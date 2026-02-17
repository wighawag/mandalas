import {version} from '$app/environment';
import {getParamsFromLocation, getHashParamsFromLocation} from './utils/web';

export const VERSION = version;
console.log(`VERSION: ${VERSION}`);
export const hashParams = getHashParamsFromLocation();
export const {params} = getParamsFromLocation();

// Chain configuration - using mainnet by default as per task requirements
const chainIdFromEnv = import.meta.env.VITE_CHAIN_ID || '1';
export const chainId = parseInt(chainIdFromEnv, 10);

// Finality blocks - depends on chain
export const finality = chainId === 1 ? 12 : 5;
export const blockTime = chainId === 1 ? 15 : 10;
export const chainName = chainId === 1 ? 'Ethereum' : `Chain ${chainId}`;
export const nativeTokenSymbol = 'ETH';

// Graph node URL
export const graphNodeURL = import.meta.env.VITE_THE_GRAPH_HTTP as string | undefined;

// Query parameters
export const globalQueryParams = ['debug', 'log', 'subgraph', 'ethnode', '_d_eruda'];

// Time periods
export const logPeriod = 7 * 24 * 60 * 60;
export const deletionDelay = 7 * 24 * 60 * 60;

export const lowFrequencyFetch = blockTime * 8;
export const mediumFrequencyFetch = blockTime * 4;
export const highFrequencyFetch = blockTime * 2;

// For backwards compatibility
export const fallbackProviderOrUrl = import.meta.env.VITE_ETH_NODE_URI;
export const webWalletURL = import.meta.env.VITE_WEB_WALLET_ETH_NODE;
export const localDev = chainId === 1337 || chainId === 31337;
