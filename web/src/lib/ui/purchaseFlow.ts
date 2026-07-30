import {BaseStoreWithData} from '$lib/utils/stores';
import {encodePacked, keccak256} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import contractsInfo from '../deployments';
import type {Chain, PublicClient, Transport, WalletClient} from 'viem';
import {randomTokens, connection} from '$lib';
import {computeBuffer} from '$lib/utils';

const initialPrice = BigInt(
	contractsInfo.contracts.MandalaToken.linkedData.initialPrice,
);
// const creatorCutPer10000th =
//   contractsInfo.contracts.MandalaToken.linkedData.creatorCutPer10000th;
const coefficient = BigInt(
	contractsInfo.contracts.MandalaToken.linkedData.linearCoefficient,
);

type Data = {
	id: string;
	privateKey: string;
	currentPrice: bigint;
	supply: bigint;
};
export type PurchaseFlow = {
	type: 'PURCHASE';
	step:
		| 'IDLE'
		| 'CONNECTING'
		| 'LOADING_CURRENT_PRICE'
		| 'CONFIRM'
		| 'CREATING_TX'
		| 'WAITING_TX'
		| 'SUCCESS';
	data?: Data;
};

export class PurchaseFlowStore extends BaseStoreWithData<PurchaseFlow, Data> {
	// Bumped whenever the flow is reset/cancelled, so a slow step that finishes
	// after the user walked away cannot revive a dead flow.
	private generation = 0;

	public constructor(
		private publicClient: PublicClient<Transport, Chain>,
		private walletClient: WalletClient<Transport, Chain>,
	) {
		super({
			type: 'PURCHASE',
			step: 'IDLE',
		});
	}

	/**
	 * Resolves with the connection, or undefined when the user rejected or
	 * abandoned the attempt.
	 *
	 * @etherplay/connect >= 0.1.0 rejects with a ConnectionFailure in that case.
	 * Before 0.1.0 the promise simply never settled, which wedged this flow and
	 * needed a workaround here; that is now the library's job.
	 */
	private async _ensureConnected(): Promise<
		{mechanism: {address: `0x${string}`}} | undefined
	> {
		try {
			return (await connection.ensureConnected('WalletConnected', {
				type: 'wallet',
			})) as {mechanism: {address: `0x${string}`}};
		} catch (e) {
			console.log('connection not established:', e);
			return undefined;
		}
	}

	async cancel(): Promise<void> {
		this._reset();
	}

	/** True when the flow was reset/cancelled since `generation` was captured. */
	private _superseded(generation: number): boolean {
		return this.generation !== generation;
	}

	async acknownledgeSuccess(): Promise<void> {
		// TODO automatic ?
		this._reset();
	}

	async mint(nft: {id: string; privateKey: string}): Promise<void> {
		const generation = ++this.generation;
		this.setPartial({step: 'LOADING_CURRENT_PRICE'});

		try {
			const supply = (await this.publicClient.readContract({
				address: contractsInfo.contracts.MandalaToken.address as `0x${string}`,
				abi: contractsInfo.contracts.MandalaToken.abi,
				functionName: 'totalSupply',
			})) as bigint;

			if (this._superseded(generation)) {
				return;
			}

			const currentPrice = supply * coefficient + initialPrice;
			this.setPartial({
				data: {id: nft.id, privateKey: nft.privateKey, currentPrice, supply},
				step: 'CONFIRM',
			});
		} catch (e) {
			console.error('Error loading current price:', e);
			this._reset();
			return;
		}

		// Prompt for a wallet while the confirm dialog is already up (the price is
		// readable without a wallet, so we deliberately do not gate on this).
		// The result is intentionally unused: this is only here to surface the
		// connect UI early. What matters is the failure path - if the user rejects
		// or dismisses, close the whole flow instead of leaving a stale 'CONFIRM'
		// dialog behind, which is what made 'Confirm' clickable while unconnected.
		const currentConnection = await this._ensureConnected();
		if (this._superseded(generation)) {
			return;
		}
		if (!currentConnection) {
			this._reset();
		}
	}

	async confirm(): Promise<void> {
		const generation = this.generation;

		// 'CREATING_TX' covers the window before the wallet is actually asked for
		// anything. Only move to 'WAITING_TX' once we really are handing over to
		// the wallet, so that dialog no longer sits there when nothing was sent.
		const purchaseFlow = this.setPartial({step: 'CREATING_TX'});
		if (!purchaseFlow.data) {
			throw new Error(`no flow data`);
		}

		const currentConnection = await this._ensureConnected();
		if (this._superseded(generation)) {
			return;
		}
		if (!currentConnection) {
			this._reset();
			return;
		}

		const walletAddress = currentConnection.mechanism.address;
		this.setPartial({step: 'WAITING_TX'});
		try {
			const account = privateKeyToAccount(
				purchaseFlow.data.privateKey as `0x${string}`,
			);

			// Sign the message
			const hashedData = keccak256(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				encodePacked(['string', 'address'], ['Mandala', walletAddress]),
			);
			const signature = await account.signMessage({message: {raw: hashedData}});

			const buffer = computeBuffer(
				purchaseFlow.data.supply,
				purchaseFlow.data.currentPrice,
			);

			const MandalaToken = contractsInfo.contracts.MandalaToken;
			const tx = await this.walletClient.writeContract({
				account: walletAddress,
				...MandalaToken,
				functionName: 'mint',
				args: [walletAddress, signature],
				value: purchaseFlow.data.currentPrice + buffer,
			});

			// Record the transaction
			randomTokens.record(purchaseFlow.data.id, tx, 0); // nonce not available easily
			this.setPartial({step: 'SUCCESS'});
		} catch (e) {
			console.error('Transaction failed:', e);
			this._reset();
		}
	}

	private _reset() {
		this.generation++;
		this.setPartial({step: 'IDLE', data: undefined});
	}
}
