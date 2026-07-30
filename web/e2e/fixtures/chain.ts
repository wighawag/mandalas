import {test} from '@playwright/test';
import {rpc} from './wallet';

/**
 * Chain isolation.
 *
 * Every test here moves real chain state (minting and burning both change
 * totalSupply), and they share one node. Without isolation a test can observe
 * another test's transaction landing and pass or fail for the wrong reason,
 * which is exactly what happened before this existed: a mint assertion went
 * green in under a second because a previous test's transaction had already
 * moved the supply.
 *
 * Snapshot after deployment, revert after each test, so every test starts from
 * the same freshly deployed chain.
 */
export function useChainSnapshot() {
	let snapshot: string | undefined;

	test.beforeEach(async () => {
		snapshot = await rpc<string>('evm_snapshot');
	});

	test.afterEach(async () => {
		if (snapshot) {
			await rpc('evm_revert', [snapshot]);
			snapshot = undefined;
		}
	});
}
