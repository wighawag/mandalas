import {readable, type Readable} from 'svelte/store';
import type {PublicClient} from 'viem';
import type {Account, TypedDeployments} from '$lib/core/connection/types';
import {
	createPollingStore,
	type PollingStore,
	type PollingStatus,
	type PollingValue,
} from '$lib/core/connection/polling-store';

function fixURI(uri?: string): string {
	if (!uri) {
		return ''; // TODO error image
	}
	if (uri.startsWith('ipfs://')) {
		return 'https://ipfs.io/ipfs/' + uri.slice(7);
	}
	return uri;
}

export type NFT = {
	id: bigint;
	tokenURI: string;
	name: string;
	description: string;
	image: string;
	/**
	 * Set when THIS token's metadata could not be read. Per-token rather than
	 * per-store on purpose: one unreachable tokenURI must not blank the whole
	 * wallet. A failure to read the chain (which does affect every token) is a
	 * store error instead, reported on `status`.
	 */
	error?: string;
};

export type NFTOfValue = PollingValue<{tokens: NFT[]}>;
export type NFTOfStatus = PollingStatus;
export type NFTOfStore = PollingStore<{tokens: NFT[]}>;

/**
 * The Mandalas held by an address.
 *
 * Built on `createPollingStore` rather than hand-rolled, which is what makes it
 * SSR-inert (no fetch and no timer off-browser, see ADR-0002) and gives it the
 * things the previous implementation lacked: errors that surface instead of
 * being swallowed into a permanent "Loading", exponential backoff, an
 * `update()` for the health banner's Retry, and a `status` the RPC-health store
 * can read.
 *
 * `owner` may be a fixed address or a store (the connected account), and it is
 * passed straight through as the polling source: rescoping, the refetch on
 * change, and the "no owner means nothing to fetch" reset all come from the
 * engine, which is what replaces the old subscriber ref-counting and the
 * `owner === this.currentOwner` race guard.
 */
export function createNFTOfStore(
	params: {
		publicClient: PublicClient;
		deployments: TypedDeployments;
		owner: string | Readable<Account>;
	},
	options?: {fetchInterval?: number},
): NFTOfStore {
	const {publicClient, deployments} = params;

	const owner: Readable<Account> =
		typeof params.owner === 'string'
			? readable(params.owner as `0x${string}`)
			: params.owner;

	async function queryTokensOf(
		address: `0x${string}`,
	): Promise<{tokenURI: string; id: bigint}[]> {
		const MandalaToken = deployments.contracts.MandalaToken;

		const numTokens = await publicClient.readContract({
			address: MandalaToken.address,
			abi: MandalaToken.abi,
			functionName: 'balanceOf',
			args: [address],
		});

		if (numTokens === 0n) {
			return [];
		}

		const tokens = await publicClient.readContract({
			...MandalaToken,
			functionName: 'getTokenDataOfOwner',
			args: [address, 0n, numTokens],
		});

		return tokens.map((token) => ({
			id: token.id,
			// Chrome honours `crisp-edges` where it ignores `pixelated` inside an
			// svg data-uri, so ask for both.
			tokenURI: token.tokenURI.replace(
				'image-rendering: pixelated;',
				'image-rendering: pixelated; image-rendering: crisp-edges;',
			),
		}));
	}

	async function withMetadata(
		tokens: {tokenURI: string; id: bigint}[],
	): Promise<NFT[]> {
		// TODO cache
		const result: NFT[] = [];
		for (const token of tokens) {
			if (!token.tokenURI) {
				result.push({
					id: token.id,
					tokenURI: '',
					name: '',
					description: '',
					image: '',
				});
				continue;
			}
			const tokenURI = fixURI(token.tokenURI);
			try {
				const response = await fetch(tokenURI);
				const json = await response.json();
				result.push({
					id: token.id,
					tokenURI,
					name: json.name,
					description: json.description,
					image: fixURI(json.image || json.image_url),
				});
			} catch (e) {
				result.push({
					id: token.id,
					tokenURI,
					name: '',
					description: '',
					image: '',
					error: (e as Error).message || String(e),
				});
			}
		}
		return result;
	}

	return createPollingStore(
		async (address: Account) => {
			const tokens = await queryTokensOf(address!);
			return {tokens: await withMetadata(tokens)};
		},
		{
			fetchInterval: options?.fetchInterval ?? 5_000,
			source: {
				store: owner,
				// Addresses reach us from the chain, the URL hash and the wallet, so
				// compare them case-insensitively: the same wallet spelled two ways
				// must not look like a rescope (and refetch).
				key: (address) => address?.toLowerCase(),
			},
		},
	);
}
