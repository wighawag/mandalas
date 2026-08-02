import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {get} from 'svelte/store';
import {createOnchainState} from '$lib/onchain/state';
import type {PublicClient} from 'viem';
import type {TypedDeployments} from '$lib/core/connection/types';

const ADDR = '0xaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaA' as const;

const INITIAL_PRICE = 1_000_000_000_000_000n; // 0.001 ETH
const COEFFICIENT = 500_000_000_000_000n; // 0.0005 ETH per token

// onchainState reads the MandalaToken address/abi for the call and its
// linkedData for the curve parameters, so a minimal stub suffices.
const deployments = {
	contracts: {
		MandalaToken: {
			address: ADDR,
			abi: [],
			linkedData: {
				initialPrice: INITIAL_PRICE.toString(),
				linearCoefficient: COEFFICIENT.toString(),
			},
		},
	},
} as unknown as TypedDeployments;

function activate<T>(store: {subscribe: (r: (v: T) => void) => () => void}) {
	return store.subscribe(() => {});
}

describe('createOnchainState (adapter)', () => {
	// Polling stores only poll in a browser (ADR-0002), and this project is Node
	// with no DOM, so declare the global the guard looks for. The off-browser
	// behaviour itself is covered in polling-store.test.ts.
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubGlobal('window', {});
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('reads totalSupply and derives the current price from the curve', async () => {
		const readContract = vi.fn(async () => 4n);
		const publicClient = {readContract} as unknown as PublicClient;

		const store = createOnchainState({
			publicClient,
			deployments,
			config: {},
		});
		const off = activate(store);

		await vi.waitFor(() => {
			expect(get(store).step).toBe('Loaded');
		});

		// price = supply * coefficient + initialPrice
		expect(get(store)).toEqual({
			step: 'Loaded',
			supply: 4n,
			currentPrice: 4n * COEFFICIENT + INITIAL_PRICE,
		});
		expect(readContract).toHaveBeenCalledWith(
			expect.objectContaining({functionName: 'totalSupply'}),
		);
		off();
	});

	it('prices the very first mint at exactly the initial price', async () => {
		const readContract = vi.fn(async () => 0n);
		const publicClient = {readContract} as unknown as PublicClient;

		const store = createOnchainState({
			publicClient,
			deployments,
			config: {},
		});
		const off = activate(store);

		await vi.waitFor(() => expect(get(store).step).toBe('Loaded'));
		expect(get(store)).toEqual({
			step: 'Loaded',
			supply: 0n,
			currentPrice: INITIAL_PRICE,
		});
		off();
	});

	it('records an error when the read fails', async () => {
		const readContract = vi.fn(async () => {
			throw new Error('revert');
		});
		const publicClient = {readContract} as unknown as PublicClient;

		const store = createOnchainState({
			publicClient,
			deployments,
			config: {},
		});
		const off = activate(store);

		await vi.waitFor(() => expect(get(store.status).error).toBeDefined());
		off();
	});
});
