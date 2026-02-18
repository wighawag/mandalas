import {PUBLIC_WALLET_HOST} from '$env/static/public';
import deploymentsFromFiles from '$lib/deployments';
import {createConnection} from '@etherplay/connect';
import {derived, writable} from 'svelte/store';
import {createPublicClient, createWalletClient, custom} from 'viem';
import type {
	Account,
	DeploymentsStore,
	EstablishedConnection,
	OptionalSigner,
	TypedDeployments,
} from './types';

// TODO allow to specify the expected DeploymentStore type
export async function establishRemoteConnection(): Promise<EstablishedConnection> {
	const chainInfo = deploymentsFromFiles.chain;

	console.log(`chainInfo`, chainInfo);

	const connection = createConnection({
		walletHost: PUBLIC_WALLET_HOST,
		chainInfo,
		prioritizeWalletProvider: true,
		alwaysUseCurrentAccount: true,
		autoConnect: false,
		requestSignatureAutomaticallyIfPossible: false,
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

	let lastDeployments: TypedDeployments = deploymentsFromFiles;

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
		walletClient,
		publicClient,
		account,
		signer,
		deployments,
	};
}
