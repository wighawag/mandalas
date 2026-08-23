import {createOnchainState} from '$lib/onchain/state.js';
import {createViewState} from '$lib/view/index.js';
import {createPurchaseFlow} from '$lib/ui/purchase/purchase-flow.js';
import {RandomTokenStore} from '$lib/stores/randomTokens.js';
import {createNFTOfStore, type NFTOfStore} from '$lib/stores/nftsof.js';
import type {CoreServices, AppContext} from './core.js';

/**
 * THIS APP'S HALF OF THE CONTEXT. The part a fork replaces.
 *
 * `./core.ts` composes everything that is true of any app built on the
 * jolly-roger template: the connection, the executor, balances, transaction
 * observation, navigation and overlays. This file is Mandalas, and it is the
 * only one of the two that diverges from upstream on purpose.
 *
 * WHY THE SPLIT EXISTS, which is not tidiness. `core.ts` is merged down from
 * jolly-roger forever, so it wants to differ as little as possible; this file is
 * REPLACED, so it wants to be separable. Under the old single function, the
 * Mandalas domain block sat in the middle of an 800-line composition and its
 * three members were appended to the same object literal upstream appends to,
 * which is the canonical shape git cannot merge.
 *
 * EVERY MEMBER HERE REACHES THE CONTEXT THROUGH `...appContext`, so adding
 * another one never means editing the literal in `core.ts`.
 *
 * CORE BUILDS THIS, not the other way round, and the order is the reason.
 * `core.ts` calls the factory partway through its own construction, because this
 * half needs the connection, the executor and the balance stores, and core's
 * refresh wiring and RPC health then need this half's `onchainState`. Two passes
 * in one direction, rather than a cycle. See the injection point in `core.ts`,
 * which also explains why the balance stores are hoisted above it here.
 */
export function createAppContext(core: CoreServices): AppContext {
	const {
		connection,
		publicClient,
		deployments,
		account,
		accountData,
		accountExecutor,
		accountBalance,
		balanceCheck,
		errorDetails,
		chainFetchGate,
	} = core;

	// The bonding-curve parameters are fixed at deployment time and shared by the
	// onchain read (which derives the confirmed price) and the view (which
	// re-derives it for optimistic pending mints), so resolve them once here.
	const {initialPrice, linearCoefficient} =
		deployments.get().contracts.MandalaToken.linkedData;
	const config = {
		batchSize: core.appConfig.batchSize,
		initialPrice: BigInt(initialPrice),
		linearCoefficient: BigInt(linearCoefficient),
	};

	const onchainState = createOnchainState({
		publicClient,
		deployments: deployments.get(),
		config,
		fetchGate: chainFetchGate,
	});

	const viewState = createViewState({
		onchainState,
		operations: accountData.watchField('operations'),
		config,
	});

	// The browse grid generates candidate Mandalas locally (each id is a keypair)
	// and remembers which ones this browser already sent a mint for.
	const randomTokens = new RandomTokenStore(deployments.get());

	// One store per owner, cached so several components asking for the same
	// owner's tokens share a single set of chain reads. An undefined owner means
	// "the connected account", which is the `account` store itself: the poller
	// then rescopes (and refetches) when the user switches account.
	const nftsOfCache: {[owner: string]: NFTOfStore} = {};
	const nftsOf = (owner?: string): NFTOfStore =>
		(nftsOfCache[owner || ''] ??= createNFTOfStore({
			publicClient,
			deployments: deployments.get(),
			owner: owner ?? account,
		}));

	const purchaseFlow = createPurchaseFlow({
		connection,
		accountExecutor,
		accountBalance,
		deployments,
		balanceCheck,
		onchainState,
		errorDetails,
		// Mark the Mandala as claimed so the grid greys it out and stops offering
		// it. Persisted per chain+contract, so it survives a reload while the mint
		// is still pending.
		onMinted: (id, hash) => randomTokens.record(id, hash, 0),
	});

	// `config` is not returned: it is this half's own construction detail, and
	// core neither uses it nor puts it in the context.
	return {onchainState, viewState, randomTokens, nftsOf, purchaseFlow};
}
