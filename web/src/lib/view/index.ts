import {derived, type Readable} from 'svelte/store';
import type {CurveState, OnchainStateStore} from '$lib/onchain/state';
import type {Schema} from '$lib/account/AccountData';
import type {FieldReadable} from 'synqable';

/**
 * The curve as the user should see it right now: the last confirmed chain read,
 * adjusted by the mints/burns this user has in flight.
 *
 * Without this the UI would keep showing the pre-mint price until the next
 * 5s poll lands, so a successful mint looks like it did nothing, and a second
 * mint would be quoted (and sent) at a price the contract has already moved past.
 */
/**
 * Display width for ETH prices, in TOTAL characters (`formatBalance`'s
 * `maxSymbols`, not a decimal count).
 *
 * Mandala prices start at 0.001 ETH and climb by 0.0005 per mint, so they need
 * room for several leading zeros. The default of 7 (and anything below 6) makes
 * `formatBalance` truncate 0.001 all the way down to ">0"; 8 keeps small prices
 * readable while still fitting values well past 1 ETH.
 */
export const PRICE_SYMBOLS = 8;

export type CurveView = CurveState & {
	/** Supply/price include locally-pending operations. */
	pending: boolean;
	/** Number of this user's mints that are still in flight. */
	pendingMints: number;
	/** Number of this user's burns that are still in flight. */
	pendingBurns: number;
};

export type ViewStateValue =
	{step: 'Unloaded'} | {step: 'Loaded'; curve: CurveView};

export type ViewStateStatus = {
	loading: boolean;
	error?: {message: string};
	lastSuccessfulFetch?: number;
};

export type ViewStateStore = {
	subscribe: Readable<ViewStateValue>['subscribe'];
	status: Readable<ViewStateStatus>;
};

/**
 * Whether an operation is still awaiting inclusion, i.e. its effect is NOT yet
 * visible in the chain read.
 *
 * Anything already included is excluded, successful or not: `supply` comes from
 * the chain, so once the transaction is in a block the chain read is the source
 * of truth. Counting an included mint again would double it (a confirmed mint
 * showed supply 1 on chain but 2 in the UI, permanently "pending" until the
 * operation was pruned at finality). The tx-observer refreshes onchain state on
 * inclusion, so the handover is immediate.
 */
function isInFlight(operation: {
	// Observer-owned, and no longer nested under a stored intent: the record
	// keeps the observer's state directly and the intent is a projection.
	state?: {outcome?: string; inclusion?: string};
}): boolean {
	const state = operation.state;
	// No state yet: just broadcast, definitely not on chain.
	if (!state) return true;
	if (state.outcome === 'Failure') return false;
	return (
		state.inclusion !== 'Included' &&
		state.inclusion !== 'NotFound' &&
		state.inclusion !== 'Dropped'
	);
}

export function createViewState(params: {
	onchainState: OnchainStateStore;
	operations: FieldReadable<Schema, 'operations'>;
	config: {
		initialPrice: bigint;
		linearCoefficient: bigint;
	};
}): ViewStateStore {
	const {onchainState, operations, config} = params;

	const _mainStore = derived(
		[{subscribe: onchainState.subscribe}, operations],
		([$onchainState, $operations]): ViewStateValue => {
			if ($onchainState.step === 'Unloaded') {
				return {step: 'Unloaded'};
			}

			let pendingMints = 0;
			let pendingBurns = 0;
			for (const operationID of Object.keys($operations)) {
				const operation = $operations[operationID];
				if (!isInFlight(operation)) continue;
				if (operation.metadata.type !== 'functionCall') continue;
				if (operation.metadata.functionName === 'mint') pendingMints++;
				else if (operation.metadata.functionName === 'burn') pendingBurns++;
			}

			const delta = BigInt(pendingMints - pendingBurns);
			const confirmedSupply = $onchainState.supply;

			// Supply can never go below zero, however many burns are queued.
			const supply =
				delta < 0n && -delta > confirmedSupply ? 0n : confirmedSupply + delta;

			return {
				step: 'Loaded',
				curve: {
					supply,
					currentPrice: supply * config.linearCoefficient + config.initialPrice,
					pending: pendingMints > 0 || pendingBurns > 0,
					pendingMints,
					pendingBurns,
				},
			};
		},
	);

	const _statusStore = derived(
		onchainState.status,
		($status): ViewStateStatus => ({...$status}),
	);

	return {
		subscribe: _mainStore.subscribe,
		status: {subscribe: _statusStore.subscribe},
	};
}
