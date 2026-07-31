import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {get} from 'svelte/store';
import {createGasFeeStore} from '$lib/core/connection/gasFee';
import type {PublicClient} from 'viem';

function activate<T>(store: {subscribe: (r: (v: T) => void) => () => void}) {
	return store.subscribe(() => {});
}

/**
 * Minimal getFeeHistory return with a single block whose per-percentile rewards
 * are [10, 50, 80] and baseFeePerGas [100, 100]. Averages over one block are the
 * values themselves, so slow/avg/fast maxPriorityFeePerGas = 10/50/80, and
 * maxFeePerGas = priority + baseFee(=last=100).
 */
function feeHistoryOneBlock() {
	return {
		oldestBlock: 0n,
		reward: [[10n, 50n, 80n]],
		baseFeePerGas: [100n, 100n],
		gasUsedRatio: [0.5],
	};
}

describe('createGasFeeStore (adapter)', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('computes slow/average/fast from eth_feeHistory percentiles', async () => {
		const getFeeHistory = vi.fn(async () => feeHistoryOneBlock());
		const publicClient = {getFeeHistory} as unknown as PublicClient;

		const store = createGasFeeStore({publicClient});
		const off = activate(store);

		await vi.waitFor(() => expect(get(store).step).toBe('Loaded'));
		const v = get(store);
		if (v.step !== 'Loaded') throw new Error('not loaded');

		expect(v.baseFeePerGas).toBe(100n);
		expect(v.slow).toEqual({maxPriorityFeePerGas: 10n, maxFeePerGas: 110n});
		expect(v.average).toEqual({maxPriorityFeePerGas: 50n, maxFeePerGas: 150n});
		expect(v.fast).toEqual({maxPriorityFeePerGas: 80n, maxFeePerGas: 180n});
		expect(v.higherThanExpected).toBe(false);
		off();
	});

	it('flags higherThanExpected when fast exceeds expectedWorstGasPrice', async () => {
		const getFeeHistory = vi.fn(async () => feeHistoryOneBlock());
		const publicClient = {getFeeHistory} as unknown as PublicClient;

		const store = createGasFeeStore(
			{publicClient},
			{expectedWorstGasPrice: 150n}, // fast.maxFeePerGas is 180n > 150n
		);
		const off = activate(store);

		await vi.waitFor(() => expect(get(store).step).toBe('Loaded'));
		const v = get(store);
		if (v.step !== 'Loaded') throw new Error('not loaded');
		expect(v.higherThanExpected).toBe(true);
		off();
	});

	it('falls back to getGasPrice when the node lacks eth_feeHistory', async () => {
		const err = Object.assign(new Error('rpc'), {
			details: 'unknown method eth_feeHistory',
		});
		const getFeeHistory = vi.fn(async () => {
			throw err;
		});
		const getGasPrice = vi.fn(async () => 7n);
		const publicClient = {
			getFeeHistory,
			getGasPrice,
		} as unknown as PublicClient;

		const store = createGasFeeStore({publicClient});
		const off = activate(store);

		await vi.waitFor(() => expect(get(store).step).toBe('Loaded'));
		const v = get(store);
		if (v.step !== 'Loaded') throw new Error('not loaded');
		// fallback: every tier uses the flat gas price
		expect(v.slow).toEqual({maxPriorityFeePerGas: 7n, maxFeePerGas: 7n});
		expect(v.fast).toEqual({maxPriorityFeePerGas: 7n, maxFeePerGas: 7n});
		expect(v.baseFeePerGas).toBe(7n);
		off();
	});
});
