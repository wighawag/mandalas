import type {TypedDeployments} from '$lib/core/connection/types';
import {
	createPollingStore,
	type PollingStore,
	type PollingValue,
	type PollingStatus,
} from '$lib/core/connection/polling-store';
import type {PublicClient} from 'viem';
import type {Readable} from 'svelte/store';

/**
 * The Mandalas bonding curve, as read from the chain.
 *
 * `supply` is the only value actually fetched; `currentPrice` is derived from
 * it with the curve parameters baked into the deployment's `linkedData`
 * (price = supply * linearCoefficient + initialPrice). Deriving here rather
 * than in the UI keeps the single definition of "what the next mint costs"
 * next to the read that produced it.
 */
export type CurveState = {
	readonly supply: bigint;
	readonly currentPrice: bigint;
};

export type OnchainStateValue = PollingValue<CurveState>;
export type OnchainStateStatus = PollingStatus;
export type OnchainStateStore = PollingStore<CurveState>;

export function createOnchainState(params: {
	publicClient: PublicClient;
	deployments: TypedDeployments;
	config: {
		fetchInterval?: number;
		// The curve parameters are read from `linkedData` below; accepting the
		// wider app config here keeps the single `config` object usable by both
		// this store and the view without callers having to pick it apart.
		[key: string]: unknown;
	};
	/**
	 * Optional gate: chain reads only run while this source is truthy. Used to
	 * avoid fetching (and surfacing an RPC error) when the app has no RPC of its
	 * own and the wallet is not connected yet. When omitted, reads run
	 * unconditionally (an app RPC is available).
	 */
	fetchGate?: Readable<boolean>;
}): OnchainStateStore {
	const {publicClient, deployments, config} = params;

	const {initialPrice, linearCoefficient} =
		deployments.contracts.MandalaToken.linkedData;
	const base = BigInt(initialPrice);
	const coefficient = BigInt(linearCoefficient);

	return createPollingStore(
		async () => {
			const supply = await publicClient.readContract({
				address: deployments.contracts.MandalaToken.address,
				abi: deployments.contracts.MandalaToken.abi,
				functionName: 'totalSupply',
			});
			return {supply, currentPrice: supply * coefficient + base};
		},
		{
			fetchInterval: config.fetchInterval ?? 5_000,
			...(params.fetchGate ? {source: {store: params.fetchGate}} : {}),
		},
	);
}
