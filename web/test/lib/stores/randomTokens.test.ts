import {describe, it, expect} from 'vitest';
import {get} from 'svelte/store';
import {RandomTokenStore} from '../../../src/lib/stores/randomTokens';
import type {TypedDeployments} from '../../../src/lib/core/connection/types';

const deployments = {
	chain: {id: 31337, genesisHash: '0xdead'},
	contracts: {
		MandalaToken: {address: '0x0000000000000000000000000000000000000001'},
	},
} as unknown as TypedDeployments;

function newStore(): RandomTokenStore {
	return new RandomTokenStore(deployments);
}

describe('RandomTokenStore lifecycle', () => {
	it('starts Idle with no tokens and no error', () => {
		const $store = get(newStore());
		expect($store.state).toBe('Idle');
		expect($store.tokens).toEqual([]);
		expect($store.error).toBeUndefined();
	});

	it('is Loading (not errored) before any token is generated', async () => {
		const store = newStore();
		const promise = store.generate(2);
		// synchronously after the call, the UI must already know it is working
		const $duringStart = get(store);
		expect($duringStart.state).toBe('Loading');
		expect($duringStart.error).toBeUndefined();
		await promise;
	});

	it('never reports an error while generating', async () => {
		const store = newStore();
		const seen: string[] = [];
		const unsubscribe = store.subscribe(($s) => {
			// an empty token list must never coincide with a Ready state, that is
			// the combination the page renders as "No Mandala could be generated"
			if ($s.tokens.length === 0) {
				expect($s.state).not.toBe('Ready');
			}
			seen.push($s.state);
		});
		await store.generate(8);
		unsubscribe();

		expect(seen).toContain('Loading');
		expect(seen[seen.length - 1]).toBe('Ready');
		expect(get(store).error).toBeUndefined();
	});

	it('ends Ready with the requested number of mandalas', async () => {
		const store = newStore();
		await store.generate(4);
		const $store = get(store);
		expect($store.state).toBe('Ready');
		expect($store.tokens).toHaveLength(4);
		expect($store.tokens.every((t) => !!t.image)).toBe(true);
	});

	it('reveals mandalas progressively instead of in one blocking batch', async () => {
		const store = newStore();
		const counts: number[] = [];
		const unsubscribe = store.subscribe(($s) => counts.push($s.tokens.length));
		await store.generate(8);
		unsubscribe();

		const growing = [...new Set(counts)].filter((c) => c > 0);
		expect(growing.length).toBeGreaterThan(1);
	});

	it('appends more mandalas on loadMore', async () => {
		const store = newStore();
		await store.generate(4);
		const firstIds = get(store).tokens.map((t) => t.id);

		await store.loadMore(4);
		const $store = get(store);
		expect($store.state).toBe('Ready');
		expect($store.tokens).toHaveLength(8);
		expect($store.tokens.slice(0, 4).map((t) => t.id)).toEqual(firstIds);
		expect(new Set($store.tokens.map((t) => t.id)).size).toBe(8);
	});

	it('ignores loadMore while a batch is still generating', async () => {
		const store = newStore();
		const generating = store.generate(4);
		await store.loadMore(4); // must be a no-op, not an overlapping run
		await generating;
		expect(get(store).tokens).toHaveLength(4);
	});
});
