import deploymentsFromFiles from '$lib/deployments';
import type {
	ConnectionStore,
	UnderlyingEthereumProvider,
} from '@etherplay/connect';
import type {Readable} from 'svelte/store';
import type {PublicClient, WalletClient} from 'viem';

export type Signer = {
	owner: `0x${string}`;
	address: `0x${string}`;
	privateKey: `0x${string}`;
};
export type OptionalSigner = Signer | undefined;
export type OptionalSignerStore = Readable<OptionalSigner>;

export type Account = `0x${string}` | undefined;
export type AccountStore = Readable<Account>;

export type TypedDeployments = typeof deploymentsFromFiles;

export type DeploymentsStore = Readable<TypedDeployments> & {
	current: TypedDeployments;
};

export type EstablishedConnection = {
	connection: ConnectionStore<UnderlyingEthereumProvider>;
	paymentConnection: ConnectionStore<UnderlyingEthereumProvider>;
	walletClient: WalletClient;
	publicClient: PublicClient;
	paymentPublicClient: PublicClient;
	paymentWalletClient: WalletClient;
	account: AccountStore;
	signer: OptionalSignerStore;
	deployments: DeploymentsStore;
};
