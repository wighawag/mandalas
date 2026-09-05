import {describe, it, expect} from 'vitest';
import {get, writable} from 'svelte/store';
import {formatBalance} from '$lib/core/utils/format/balance';
import {createViewState, PRICE_SYMBOLS} from '$lib/view';
import type {OnchainStateStore} from '$lib/onchain/state';
import type {Schema} from '$lib/account/AccountData';
import type {FieldReadable} from 'synqable';

const INITIAL_PRICE = 1_000_000_000_000_000n;
const COEFFICIENT = 500_000_000_000_000n;

const config = {
	initialPrice: INITIAL_PRICE,
	linearCoefficient: COEFFICIENT,
};

/** Minimal onchainState stub: createViewState only reads subscribe + status. */
function stubOnchainState(value: unknown): OnchainStateStore {
	const store = writable(value);
	return {
		subscribe: store.subscribe,
		status: writable({loading: false}),
	} as unknown as OnchainStateStore;
}

function stubOperations(
	ops: Record<string, unknown>,
): FieldReadable<Schema, 'operations'> {
	return writable(ops) as unknown as FieldReadable<Schema, 'operations'>;
}

/** A functionCall operation in a given inclusion/status state. */
function op(
	functionName: string,
	state?: {outcome?: string; inclusion?: string},
) {
	return {
		metadata: {type: 'functionCall', functionName},
		// The observer's state sits on the operation now: the intent it used to
		// nest under is a projection and is no longer stored.
		state,
	};
}

describe('createViewState (mandalas curve)', () => {
	it('is Unloaded until the chain read lands', () => {
		const view = createViewState({
			onchainState: stubOnchainState({step: 'Unloaded'}),
			operations: stubOperations({}),
			config,
		});
		expect(get(view)).toEqual({step: 'Unloaded'});
	});

	it('reports the confirmed curve when nothing is in flight', () => {
		const view = createViewState({
			onchainState: stubOnchainState({
				step: 'Loaded',
				supply: 4n,
				currentPrice: 4n * COEFFICIENT + INITIAL_PRICE,
			}),
			operations: stubOperations({}),
			config,
		});
		const v = get(view);
		expect(v).toMatchObject({
			step: 'Loaded',
			curve: {supply: 4n, pending: false, pendingMints: 0, pendingBurns: 0},
		});
	});

	it('advances supply and price for a pending mint', () => {
		const view = createViewState({
			onchainState: stubOnchainState({
				step: 'Loaded',
				supply: 4n,
				currentPrice: 4n * COEFFICIENT + INITIAL_PRICE,
			}),
			operations: stubOperations({'1': op('mint')}),
			config,
		});
		const v = get(view);
		if (v.step !== 'Loaded') throw new Error('expected Loaded');
		expect(v.curve.supply).toBe(5n);
		expect(v.curve.currentPrice).toBe(5n * COEFFICIENT + INITIAL_PRICE);
		expect(v.curve.pending).toBe(true);
		expect(v.curve.pendingMints).toBe(1);
	});

	it('rolls supply back for a pending burn', () => {
		const view = createViewState({
			onchainState: stubOnchainState({
				step: 'Loaded',
				supply: 4n,
				currentPrice: 4n * COEFFICIENT + INITIAL_PRICE,
			}),
			operations: stubOperations({'1': op('burn')}),
			config,
		});
		const v = get(view);
		if (v.step !== 'Loaded') throw new Error('expected Loaded');
		expect(v.curve.supply).toBe(3n);
		expect(v.curve.pendingBurns).toBe(1);
	});

	it('nets mints against burns', () => {
		const view = createViewState({
			onchainState: stubOnchainState({
				step: 'Loaded',
				supply: 10n,
				currentPrice: 10n * COEFFICIENT + INITIAL_PRICE,
			}),
			operations: stubOperations({
				'1': op('mint'),
				'2': op('mint'),
				'3': op('burn'),
			}),
			config,
		});
		const v = get(view);
		if (v.step !== 'Loaded') throw new Error('expected Loaded');
		expect(v.curve.supply).toBe(11n);
	});

	it('never lets optimistic burns drive supply below zero', () => {
		const view = createViewState({
			onchainState: stubOnchainState({
				step: 'Loaded',
				supply: 1n,
				currentPrice: 1n * COEFFICIENT + INITIAL_PRICE,
			}),
			operations: stubOperations({'1': op('burn'), '2': op('burn')}),
			config,
		});
		const v = get(view);
		if (v.step !== 'Loaded') throw new Error('expected Loaded');
		expect(v.curve.supply).toBe(0n);
		expect(v.curve.currentPrice).toBe(INITIAL_PRICE);
	});

	it('stops counting a mint once it is included, so it is not double-counted', () => {
		// Regression: an included mint is already reflected in the chain read, so
		// adding it again showed supply 2 for a chain that reported 1, stuck on
		// "(pending)" until finality pruned the operation.
		const view = createViewState({
			onchainState: stubOnchainState({
				step: 'Loaded',
				supply: 1n,
				currentPrice: 1n * COEFFICIENT + INITIAL_PRICE,
			}),
			operations: stubOperations({
				'1': op('mint', {inclusion: 'Included', outcome: 'Success'}),
			}),
			config,
		});
		const v = get(view);
		if (v.step !== 'Loaded') throw new Error('expected Loaded');
		expect(v.curve.supply).toBe(1n);
		expect(v.curve.pending).toBe(false);
		expect(v.curve.pendingMints).toBe(0);
	});

	it('counts a mint that is only in the mempool', () => {
		const view = createViewState({
			onchainState: stubOnchainState({
				step: 'Loaded',
				supply: 1n,
				currentPrice: 1n * COEFFICIENT + INITIAL_PRICE,
			}),
			operations: stubOperations({
				'1': op('mint', {inclusion: 'InMemPool'}),
			}),
			config,
		});
		const v = get(view);
		if (v.step !== 'Loaded') throw new Error('expected Loaded');
		expect(v.curve.supply).toBe(2n);
		expect(v.curve.pending).toBe(true);
	});

	it('ignores failed and dropped operations', () => {
		const view = createViewState({
			onchainState: stubOnchainState({
				step: 'Loaded',
				supply: 4n,
				currentPrice: 4n * COEFFICIENT + INITIAL_PRICE,
			}),
			operations: stubOperations({
				'1': op('mint', {outcome: 'Failure'}),
				'2': op('mint', {inclusion: 'Dropped'}),
				'3': op('mint', {inclusion: 'NotFound'}),
			}),
			config,
		});
		const v = get(view);
		if (v.step !== 'Loaded') throw new Error('expected Loaded');
		expect(v.curve.supply).toBe(4n);
		expect(v.curve.pending).toBe(false);
	});

	it('ignores operations that are not mint or burn', () => {
		const view = createViewState({
			onchainState: stubOnchainState({
				step: 'Loaded',
				supply: 4n,
				currentPrice: 4n * COEFFICIENT + INITIAL_PRICE,
			}),
			operations: stubOperations({'1': op('transferFrom')}),
			config,
		});
		const v = get(view);
		if (v.step !== 'Loaded') throw new Error('expected Loaded');
		expect(v.curve.supply).toBe(4n);
	});
});

describe('PRICE_SYMBOLS', () => {
	it('keeps the entry-level mandala price readable', () => {
		// Regression: formatBalance's third argument is a TOTAL character budget,
		// not a decimal count. Passing 4 (meaning "4 decimals") left only 2
		// decimal places for a "0." value, truncating the 0.001 ETH starting price
		// to the useless ">0". The whole curve lives in this range early on.
		expect(formatBalance(INITIAL_PRICE, 18, PRICE_SYMBOLS)).toBe('0.001');
		expect(formatBalance(INITIAL_PRICE, 18, 4)).toBe('>0');
	});

	it('renders prices across the curve without truncation markers', () => {
		for (const supply of [0n, 1n, 10n, 100n]) {
			const price = supply * COEFFICIENT + INITIAL_PRICE;
			const shown = formatBalance(price, 18, PRICE_SYMBOLS);
			expect(shown.startsWith('>')).toBe(false);
			expect(shown.startsWith('~')).toBe(false);
		}
	});

	it('still fits values above 1 ETH', () => {
		// supply 2000 -> 1.001 ETH
		const price = 2000n * COEFFICIENT + INITIAL_PRICE;
		expect(formatBalance(price, 18, PRICE_SYMBOLS)).toBe('1.001');
	});
});
