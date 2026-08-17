import {get, writable, type Readable} from 'svelte/store';
import {encodePacked, keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {
	InsufficientFundsError,
	isUserRejectionError,
} from '$lib/core/transaction';
import {
	txErrorDetails,
	txErrorSummary,
} from '$lib/core/transaction/tx-error-summary';
import type {Context} from '$lib/context/types';

/**
 * The Mandala being purchased. `privateKey` is not a wallet key: every Mandala
 * id IS a keypair, and minting requires proving possession of it by signing the
 * buyer's address. That signature is what the contract checks, and it is why a
 * given Mandala can only ever be claimed once.
 */
export type PurchaseTarget = {
	id: string;
	privateKey: string;
};

export type PurchaseFlowStep =
	| 'IDLE'
	| 'LOADING_CURRENT_PRICE'
	| 'CONFIRM'
	| 'WAITING_TX'
	| 'SUCCESS'
	| 'ERROR';

export type PurchaseFlowState = {
	step: PurchaseFlowStep;
	target?: PurchaseTarget;
	currentPrice?: bigint;
	supply?: bigint;
	/** Present only in the 'ERROR' step. */
	error?: {message: string; details: string};
};

export type PurchaseFlowStore = Readable<PurchaseFlowState> & {
	mint(target: PurchaseTarget): Promise<void>;
	confirm(): Promise<void>;
	cancel(): void;
	acknowledge(): void;
};

export type PurchaseFlowDeps = Pick<
	Context,
	| 'connection'
	| 'accountExecutor'
	| 'accountBalance'
	| 'deployments'
	| 'balanceCheck'
	| 'onchainState'
	| 'errorDetails'
> & {
	/**
	 * Called once a mint has been broadcast, with the Mandala id and tx hash.
	 *
	 * Lets the caller mark the Mandala as claimed (the browse grid greys it out
	 * and drops its Mint button) without this flow having to know about the
	 * token store. Fires on BROADCAST, not on confirmation, so the same Mandala
	 * cannot be submitted twice while the first mint is still in flight.
	 */
	onMinted?: (id: string, hash: string) => void;
};

/**
 * The mint price rises with supply, so the price quoted at confirm time can be
 * stale by the time the transaction lands. We overpay by a small buffer (the
 * contract refunds the difference) so a mint is not lost to a race with other
 * buyers. Three mints' worth of headroom, with a floor for the very low end of
 * the curve.
 */
export function computeBuffer(
	supply: bigint,
	currentPrice: bigint,
	params: {initialPrice: bigint; linearCoefficient: bigint},
): bigint {
	const computed =
		params.initialPrice +
		(supply + 3n) * params.linearCoefficient -
		currentPrice;
	const min = 10_000_000_000_000_000n;
	return computed > min ? computed : min;
}

export function createPurchaseFlow(deps: PurchaseFlowDeps): PurchaseFlowStore {
	const {
		connection,
		accountExecutor,
		accountBalance,
		deployments,
		balanceCheck,
		onchainState,
		errorDetails,
		onMinted,
	} = deps;

	const store = writable<PurchaseFlowState>({step: 'IDLE'});

	// Bumped whenever the flow is reset/cancelled, so a slow step that finishes
	// after the user walked away cannot revive a dead flow.
	let generation = 0;
	const superseded = (g: number) => generation !== g;

	function reset() {
		generation++;
		store.set({step: 'IDLE'});
	}

	function curveParams() {
		const {initialPrice, linearCoefficient} =
			get(deployments).contracts.MandalaToken.linkedData;
		return {
			initialPrice: BigInt(initialPrice),
			linearCoefficient: BigInt(linearCoefficient),
		};
	}

	function fail(error: unknown) {
		console.error('Mandala purchase failed:', error);
		store.set({
			step: 'ERROR',
			error: {message: txErrorSummary(error), details: txErrorDetails(error)},
		});
	}

	return {
		subscribe: store.subscribe,

		async mint(target: PurchaseTarget) {
			const g = ++generation;
			store.set({step: 'LOADING_CURRENT_PRICE', target});

			try {
				// Prefer the value the polling store already holds; only force a read
				// when it has nothing yet, so opening the dialog is instant in the
				// common case.
				let state = get(onchainState);
				if (state.step !== 'Loaded') {
					await onchainState.update();
					state = get(onchainState);
				}
				if (superseded(g)) return;
				if (state.step !== 'Loaded') {
					throw new Error('Could not read the current price from the chain.');
				}

				store.set({
					step: 'CONFIRM',
					target,
					currentPrice: state.currentPrice,
					supply: state.supply,
				});
			} catch (error) {
				if (superseded(g)) return;
				fail(error);
			}
		},

		async confirm() {
			const g = generation;
			const current = get(store);
			if (
				current.step !== 'CONFIRM' ||
				!current.target ||
				current.currentPrice === undefined ||
				current.supply === undefined
			) {
				return;
			}
			const {target, currentPrice, supply} = current;

			try {
				await connection.ensureConnected();
				if (superseded(g)) return;

				const $executor = get(accountExecutor);
				if ($executor.status !== 'ready') {
					// 'cannot-send' surfaces its own notice via the context store.
					reset();
					return;
				}

				const buyer = $executor.address;
				const $deployments = get(deployments);

				// Prove ownership of the Mandala id by signing the buyer's address
				// with the id's own key. This binds the claim to this buyer.
				const account = privateKeyToAccount(target.privateKey as `0x${string}`);
				const signature = await account.signMessage({
					message: {
						raw: keccak256(
							encodePacked(['string', 'address'], ['Mandala', buyer]),
						),
					},
				});
				if (superseded(g)) return;

				const contractRequest = await balanceCheck.ensureCanAfford(
					{
						contract: {
							address: $deployments.contracts.MandalaToken.address,
							abi: $deployments.contracts.MandalaToken.abi,
							functionName: 'mint',
							args: [buyer, signature],
							account: $executor.account,
							value:
								currentPrice +
								computeBuffer(supply, currentPrice, curveParams()),
						},
					},
					{
						// Measured against the account that will actually pay, named so
						// the check and the sender can never disagree.
						balance: accountBalance,
						sender: $executor.address,
						// The gas store polls every 10 minutes; a stale fee ceiling gets
						// the send rejected outright ("maxFeePerGas too low for the next
						// block"). Re-read right before signing so the quote matches the
						// chain.
						forceUpdate: true,
					},
				);
				if (superseded(g)) return;

				store.set({step: 'WAITING_TX', target, currentPrice, supply});
				const hash = await $executor.client.writeContract(contractRequest);

				// Record before the superseded check: the transaction is already on
				// its way, so the Mandala is spoken for even if the user closed the
				// dialog while the wallet was open.
				onMinted?.(target.id, hash);

				if (superseded(g)) return;

				store.set({step: 'SUCCESS', target, currentPrice, supply});
			} catch (error) {
				if (superseded(g)) return;
				if (
					error instanceof InsufficientFundsError ||
					isUserRejectionError(error)
				) {
					// User dismissed the funds modal or rejected in their wallet.
					reset();
					return;
				}
				fail(error);
			}
		},

		cancel: reset,

		acknowledge() {
			const current = get(store);
			if (current.step === 'ERROR' && current.error) {
				errorDetails.show(current.error.details);
			}
			reset();
		},
	};
}
