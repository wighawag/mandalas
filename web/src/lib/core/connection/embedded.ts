import {PUBLIC_WALLET_HOST} from '$env/static/public';
import EmbeddedChainWorker from '$lib/onchain/embedded-chain-worker?worker'; // gives you the built URL
import {createConnection} from '@etherplay/connect';
import {setupEnvironment} from '@rocketh/web';
import DeployAvatars from 'bomber-world-contracts/deploy/001_deploy_avatars.js';
import DeployGame from 'bomber-world-contracts/deploy/010_deploy_game.js';
import DeploySale from 'bomber-world-contracts/deploy/020_deploy_sale.js';
import {config, extensions} from 'bomber-world-contracts/rocketh/config.js';
import {wrap} from 'comlink';
import {type EmbeddedChain, type EmbeddedChainOptions} from 'embedded-chain';
import {derived, writable} from 'svelte/store';
import {createPublicClient, createWalletClient, custom, parseEther} from 'viem';
import type {
	Account,
	DeploymentsStore,
	EstablishedConnection,
	OptionalSigner,
	TypedDeployments,
} from './types';

// TODO allow to specify the expected DeploymentStore type
export async function establishEmbeddedConnection(): Promise<EstablishedConnection> {
	const workerProxy = wrap<{
		createEmbeddedChain(options: EmbeddedChainOptions): Promise<EmbeddedChain>;
	}>(new EmbeddedChainWorker());
	const embeddedChain = await workerProxy.createEmbeddedChain({
		providerOptions: {
			accounts: {
				mnemonic: 'test test test test test test test test test test test junk',
			},
		},
		initialBalances: {
			// reuse dev account
			'0xd58445092375fba40216316df4735bdd0529b74e': parseEther('1000'),
		},
		miningConfig: {
			type: 'interval',
			interval: 1000,
		},
		gasEstimationOverrides: {
			addToEstimation: 100000n,
		},
		recordRequests: [
			'eth_sendRawTransaction',
			'eth_call',
			'eth_getTransactionReceipt',
		],
		// loggingLevel: 'debug'
	});

	(globalThis as any).embeddedChain = embeddedChain;
	const provider = embeddedChain.provider;
	const chainId = await provider.request({
		method: 'eth_chainId',
	});
	console.log(`INITIALISED --------------------`);
	console.log({chainId: Number(chainId)});
	const modifiedConfig = {
		...config,
		data: {
			...config.data,
			Game: {
				...config.data.Game,
				[Number(chainId)]: {
					commitPhaseDuration: 0n,
					revealPhaseDuration: 0n,
					numMoves: 10n,
				},
			},
		},
	};
	const {loadAndExecuteDeploymentsFromModules} = setupEnvironment(
		modifiedConfig,
		extensions,
	);
	const env = await loadAndExecuteDeploymentsFromModules(
		[
			{id: 'DeployAvatars', module: DeployAvatars},
			{id: 'DeployGame', module: DeployGame},
			{id: 'DeploySale', module: DeploySale},
		],
		{
			provider: provider,
			environment: 'tevm',
		},
	);

	const chainInfo = {
		...env.network.chain,
		rpcUrls: {default: {http: []}},
		provider,
	};

	console.log(`chainInfo`, chainInfo);

	const connection = createConnection({
		// TODO signingOrigin
		signingOrigin: 'https://testing.etherplay.io',
		walletHost: PUBLIC_WALLET_HOST,
		chainInfo,
		prioritizeWalletProvider: false,
		// alwaysUseCurrentAccount: true,
		autoConnect: true,
		requestSignatureAutomaticallyIfPossible: true,
	});

	const paymentConnection = createConnection({
		walletHost: PUBLIC_WALLET_HOST,
		chainInfo,
		prioritizeWalletProvider: true,
		alwaysUseCurrentAccount: true,
		autoConnect: false,
		requestSignatureAutomaticallyIfPossible: false,
	});

	const paymentWalletClient = createWalletClient({
		chain: chainInfo,
		transport: custom(paymentConnection.provider),
	});

	const paymentPublicClient = createPublicClient({
		chain: chainInfo,
		transport: custom(paymentConnection.provider),
	});

	const walletClient = createWalletClient({
		chain: chainInfo,
		transport: custom(connection.provider),
	});

	const publicClient = createPublicClient({
		chain: chainInfo,
		transport: custom(connection.provider),
	});

	const account = derived<typeof connection, Account>(
		connection,
		($connection) => {
			return $connection.step === 'SignedIn'
				? $connection.account.address
				: 'account' in $connection
					? ($connection.account as any)?.address || undefined
					: undefined;
		},
	);

	const signer = derived<typeof connection, OptionalSigner>(
		connection,
		($connection) => {
			return $connection.step === 'SignedIn'
				? {
						owner: $connection.account.address,
						address: $connection.account.signer.address,
						privateKey: $connection.account.signer.privateKey,
					}
				: undefined;
		},
	);

	let lastDeployments: TypedDeployments = {
		chain: env.network.chain,
		contracts: env.deployments,
		name: env.name,
	} as any;

	console.log(lastDeployments);

	// TODO
	// we can specify LinkedData type for each contracts
	const deploymentsStore = writable<TypedDeployments>(
		lastDeployments,
		(set) => {
			// TODO handle redeployment
			// lastDeployments =
		},
	);

	const deployments: DeploymentsStore = {
		subscribe: deploymentsStore.subscribe,
		get current() {
			return lastDeployments;
		},
	};

	return {
		connection,
		paymentConnection,
		walletClient,
		publicClient,
		paymentPublicClient,
		paymentWalletClient,
		account,
		signer,
		deployments,
	};
}
