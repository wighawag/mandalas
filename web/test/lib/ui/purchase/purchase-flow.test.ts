import {describe, it, expect, vi} from 'vitest';
import {get, readable} from 'svelte/store';
import {
	computeBuffer,
	createPurchaseFlow,
} from '$lib/ui/purchase/purchase-flow';

const INITIAL_PRICE = 1_000_000_000_000_000n; // 0.001 ETH
const COEFFICIENT = 500_000_000_000_000n; // 0.0005 ETH per token
const params = {initialPrice: INITIAL_PRICE, linearCoefficient: COEFFICIENT};

/** The price the contract would charge at a given supply. */
const priceAt = (supply: bigint) => supply * COEFFICIENT + INITIAL_PRICE;

const MIN_BUFFER = 10_000_000_000_000_000n; // 0.01 ETH floor

describe('computeBuffer', () => {
	it('never goes below the 0.01 ETH floor', () => {
		// Low on the curve the 3-mint headroom is tiny, so the floor dominates.
		expect(computeBuffer(0n, priceAt(0n), params)).toBe(MIN_BUFFER);
		expect(computeBuffer(4n, priceAt(4n), params)).toBe(MIN_BUFFER);
	});

	it('covers three further mints once that exceeds the floor', () => {
		// headroom = 3 * coefficient once price matches supply. With this
		// coefficient that is 0.0015 ETH, still under the floor, so push the
		// coefficient up to make the headroom the binding term.
		const bigParams = {
			initialPrice: INITIAL_PRICE,
			linearCoefficient: 100_000_000_000_000_000n, // 0.1 ETH per token
		};
		const supply = 10n;
		const price = supply * bigParams.linearCoefficient + bigParams.initialPrice;
		expect(computeBuffer(supply, price, bigParams)).toBe(
			3n * bigParams.linearCoefficient,
		);
	});

	it('is a flat 3-mint headroom while the quote is fresh, whatever the supply', () => {
		// With a fresh quote the supply terms cancel and the buffer is exactly
		// 3 * coefficient, independent of where we are on the curve. Here that is
		// 0.0015 ETH, under the floor, so the floor is what is actually charged.
		const headroom = 3n * COEFFICIENT;
		expect(headroom).toBeLessThan(MIN_BUFFER);
		for (const supply of [0n, 40n, 1000n]) {
			expect(computeBuffer(supply, priceAt(supply), params)).toBe(MIN_BUFFER);
		}
	});

	it('grows once the quoted price has gone stale', () => {
		// Quoted at supply 40 but 20 mints landed first: the buffer must absorb
		// that gap too, otherwise the mint reverts for underpayment.
		const staleQuote = priceAt(40n);
		const fresh = computeBuffer(40n, staleQuote, params);
		const stale = computeBuffer(60n, staleQuote, params);
		expect(stale).toBeGreaterThan(fresh);
		// initialPrice + 63*c - (40*c + initialPrice) = 23*c
		expect(stale).toBe(23n * COEFFICIENT);
	});

	it('always leaves the sent value at or above the true price', () => {
		// The property that actually matters: price + buffer must cover the cost
		// even if several mints land first.
		for (const supply of [0n, 1n, 7n, 50n, 1000n]) {
			const quoted = priceAt(supply);
			const buffer = computeBuffer(supply, quoted, params);
			// three more mints slip in ahead of us
			const actual = priceAt(supply + 3n);
			expect(quoted + buffer).toBeGreaterThanOrEqual(actual);
		}
	});
});

/** Build a purchase flow over stub deps, capturing onMinted calls. */
function makeFlow(overrides: Record<string, unknown> = {}) {
	const minted: Array<{id: string; hash: string}> = [];
	const writeContract = vi.fn(async () => '0xdeadbeef' as const);

	const deps = {
		connection: {ensureConnected: vi.fn(async () => undefined)},
		executor: readable({
			status: 'ready',
			address: '0x1111111111111111111111111111111111111111',
			account: '0x1111111111111111111111111111111111111111',
			client: {writeContract},
		}),
		deployments: readable({
			contracts: {
				MandalaToken: {
					address: '0x2222222222222222222222222222222222222222',
					abi: [],
					linkedData: {
						initialPrice: INITIAL_PRICE.toString(),
						linearCoefficient: COEFFICIENT.toString(),
					},
				},
			},
		}),
		balanceCheck: {ensureCanAfford: vi.fn(async (o: any) => o.contract)},
		onchainState: Object.assign(
			readable({step: 'Loaded', supply: 0n, currentPrice: INITIAL_PRICE}),
			{update: vi.fn(async () => {})},
		),
		errorDetails: {show: vi.fn()},
		onMinted: (id: string, hash: string) => minted.push({id, hash}),
		...overrides,
	};

	return {flow: createPurchaseFlow(deps as never), minted, writeContract};
}

// A Mandala id is itself a keypair; this is a throwaway test key.
const TARGET = {
	id: '0xabc',
	privateKey:
		'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
};

describe('purchase flow claim recording', () => {
	it('reports the mint so the grid can grey the Mandala out', async () => {
		const {flow, minted, writeContract} = makeFlow();

		await flow.mint(TARGET);
		expect(get(flow).step).toBe('CONFIRM');

		await flow.confirm();

		expect(writeContract).toHaveBeenCalledTimes(1);
		// Regression: this callback was dropped in the rewrite, so a minted
		// Mandala stayed fully coloured and still offered a Mint button.
		expect(minted).toEqual([{id: '0xabc', hash: '0xdeadbeef'}]);
		expect(get(flow).step).toBe('SUCCESS');
	});

	it('does not report anything when the mint never gets sent', async () => {
		const {flow, minted} = makeFlow({
			executor: readable({status: 'cannot-send'}),
		});

		await flow.mint(TARGET);
		await flow.confirm();

		expect(minted).toEqual([]);
	});

	it('sends nothing when cancelled before the wallet is reached', async () => {
		const {flow, minted, writeContract} = makeFlow();
		await flow.mint(TARGET);
		const confirming = flow.confirm();
		// Cancel lands before the first await resolves, so the flow bails out at
		// its next superseded check and never broadcasts.
		flow.cancel();
		await confirming;

		expect(writeContract).not.toHaveBeenCalled();
		expect(minted).toEqual([]);
		expect(get(flow).step).toBe('IDLE');
	});

	it('still records the claim if the user closes the dialog mid-broadcast', async () => {
		// Once the transaction is actually out, the Mandala is spoken for - even
		// though the flow was superseded and renders nothing. Not recording here
		// would leave it mintable again while the first mint is still in flight.
		let release: (v: '0xdeadbeef') => void;
		const pending = new Promise<'0xdeadbeef'>((r) => (release = r));
		const writeContract = vi.fn(() => pending);
		const {flow, minted} = makeFlow({
			executor: readable({
				status: 'ready',
				address: '0x1111111111111111111111111111111111111111',
				account: '0x1111111111111111111111111111111111111111',
				client: {writeContract},
			}),
		});

		await flow.mint(TARGET);
		const confirming = flow.confirm();
		// let the flow get all the way to the in-flight writeContract
		await vi.waitFor(() => expect(writeContract).toHaveBeenCalled());
		flow.cancel();
		release!('0xdeadbeef');
		await confirming;

		expect(minted).toEqual([{id: '0xabc', hash: '0xdeadbeef'}]);
		expect(get(flow).step).toBe('IDLE');
	});
});
