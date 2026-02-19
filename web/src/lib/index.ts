import {get} from 'svelte/store';
import {establishRemoteConnection} from './core/connection';
import {createBalanceStore} from './core/connection/balance';
import {createGasFeeStore} from './core/connection/gasFee';
import {PurchaseFlowStore} from './ui/purchaseFlow';
import type {Dependencies} from './types.js';
import {CurveStore} from './stores/curve';
import {RandomTokenStore} from './stores/randomTokens';
import {NFTOfStore} from './stores/nftsof';

export async function createDependencies(): Promise<Dependencies> {
	const window = globalThis as any;

	// ----------------------------------------------------------------------------
	// CONNECTION
	// ----------------------------------------------------------------------------

	const {signer, connection, walletClient, publicClient, account, deployments} =
		await establishRemoteConnection();

	window.connection = connection;
	window.walletClient = walletClient;
	window.publicClient = publicClient;
	window.deployments = deployments;

	// ----------------------------------------------------------------------------

	// ----------------------------------------------------------------------------
	// BALANCE AND COSTS
	// ----------------------------------------------------------------------------

	const balance = createBalanceStore({publicClient, signer});
	window.balance = balance;

	// ----------------------------------------------------------------------------

	// TODO use deployment store ?
	const gasFee = createGasFeeStore({
		publicClient: publicClient as any, // TODO fix publicClient type
		deployments: deployments.current,
	});
	window.gasFee = gasFee;

	// TODO remove
	// we trigger it
	gasFee.subscribe((v) => {
		console.log(`gas fee updated`, v);
	});
	window.gasFee = gasFee;
	// ----------------------------------------------------------------------------

	const purchaseFlow = new PurchaseFlowStore(publicClient, walletClient);
	window.purchaseFlow = purchaseFlow;

	return {
		gasFee,
		balance,
		connection,
		walletClient,
		publicClient,
		account,
		deployments,
		purchaseFlow,
	};
}

(globalThis as any).get = get;

// const [getUserContextFunction, setUserContext] = createContext<() => Dependencies>();

// const getUserContext = () => getUserContextFunction()();
// export {getUserContext, setUserContext};

export const {
	gasFee,
	balance,
	connection,
	walletClient,
	publicClient,
	account,
	deployments,
	purchaseFlow,
} = await createDependencies();

export const curve = new CurveStore(publicClient);
export const randomTokens = new RandomTokenStore(deployments.current);

const cache: {[owner: string]: NFTOfStore} = {};
export function nftsof(owner?: string): NFTOfStore {
	const fromCache = cache[owner || ''];
	if (fromCache) {
		return fromCache;
	}
	return (cache[owner || ''] = new NFTOfStore(publicClient, owner));
}
