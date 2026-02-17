<script lang="ts">
	import {onMount} from 'svelte';
	import NavButton from '$lib/components/styled/navigation/NavButton.svelte';
	import {nftsof} from '$lib/stores/nftsof';
	import {curve} from '$lib/stores/curve';
	import {generateBitmapDataURI, template19_bis} from 'mandalas-common';
	import {establishRemoteConnection} from '$lib/core/connection';

	let connected = false;
	let connecting = false;
	let connection: any = null;
	let publicClient: any = null;
	let walletClient: any = null;
	let account: any = null;

	let walletAddress: string | undefined = undefined;

	onMount(async () => {
		// Try to connect on mount
		connect();

		// Get wallet address from URL hash
		if (typeof window !== 'undefined' && window.location.hash) {
			walletAddress = window.location.hash.substring(1);
		}
	});

	async function connect() {
		connecting = true;
		try {
			const established = await establishRemoteConnection();
			connection = established.connection;
			publicClient = established.publicClient;
			walletClient = established.walletClient;
			account = established.account;
			curve.setPublicClient(publicClient);
			connected = true;
		} catch (e) {
			console.error('Failed to connect:', e);
		} finally {
			connecting = false;
		}
	}

	$: currentAddress = $account;
	$: isWalletOwner = currentAddress && walletAddress && currentAddress.toLowerCase() === walletAddress.toLowerCase();

	$: nfts = nftsof(walletAddress);

	function formatPrice(price: bigint): string {
		return (Number(price) / 1e18).toFixed(4);
	}

	// Burn function would need to be implemented with viem writeContract
</script>

<div class="w-full">
	{#if $curve.supply}
		<div class="w-full h-full mx-auto flex justify-between text-black dark:text-white">
			<p class="m-2 font-black text-xs sm:text-base text-yellow-400">
				Current Price:
				{$curve.currentPrice ? formatPrice($curve.currentPrice) + ' ETH' : 'loading'}
			</p>
			<p class="m-2 font-black text-xs sm:text-base text-yellow-400">
				Current Supply:
				{$curve.supply ? $curve.supply.toString() : 'loading'}
			</p>
		</div>
	{/if}

	{#if !connected}
		<div class="w-full h-full mx-auto text-center flex-col text-black dark:text-white">
			<p class="mt-4 text-xs sm:text-base font-black text-yellow-400">
				Please Connect to your wallet see the tokens
			</p>
			<button
				class="m-2 text-xs md:text-base font-black text-yellow-400 border border-yellow-500 p-1"
				onclick={() => connect()}
			>
				{connecting ? 'Connecting...' : 'Connect'}
			</button>
		</div>
	{:else if !walletAddress || walletAddress === ''}
		<div class="w-full h-full mx-auto text-center flex-col text-black dark:text-white">
			<p class="mt-4 text-xs sm:text-base font-black text-yellow-400">
				Please Connect to your wallet see your tokens
			</p>
			<button
				class="m-2 text-xs md:text-base font-black text-yellow-400 border border-yellow-500 p-1"
				onclick={() => connect()}
			>
				Connect
			</button>
		</div>
	{:else if currentAddress && !isWalletOwner}
		<div class="w-full h-full mx-auto text-center flex-col text-black dark:text-white">
			<div class="w-full h-full mx-auto flex justify-between text-black dark:text-white">
				<a
					href={`#/`.concat(currentAddress)}
					class="m-2 text-xs md:text-base font-black text-yellow-400 border border-yellow-500 p-1"
				>
					Show My Mandalas
				</a>
			</div>
		</div>
	{/if}

	{#if $nfts.state === 'Ready'}
		{#if $nfts.tokens.length > 0}
			<div class="w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white">
				<p class="p-6">
					{#if isWalletOwner}
						Here are your Mandalas. You can burn them to get 95% of the current
						price. Each time a mandala is burnt, the price decrease. Note that
						once burnt that same Mandala cannot be re-created.
					{:else}Here are the Mandalas for wallet {walletAddress}.{/if}
				</p>
			</div>
		{:else if currentAddress === undefined}
			<div class="py-8 px-10 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white">
				<p class="p-4">Loading...</p>
			</div>
		{:else}
			<div class="w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white">
				{#if isWalletOwner}
					<p class="p-4">You do not have any Mandala yet.</p>
					<p>get your first one <a href="/" class="underline">here</a></p>
				{:else}
					<p class="p-4">No Mandala for {walletAddress}</p>
				{/if}
			</div>
		{/if}
	{/if}

	<section class="py-8 px-10 md:w-3/4 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white">
		{#if !connected}
			<div>Please connect your wallet</div>
		{:else if !$nfts}
			<div>Getting Tokens...</div>
		{:else if $nfts.state === 'Idle'}
			<div>Tokens not loaded</div>
		{:else if $nfts.error}
			<div>Error: {$nfts.error}</div>
		{:else if $nfts.tokens.length === 0 && $nfts.state === 'Loading'}
			<div>Loading Your Tokens...</div>
		{:else}
			<ul class="grid grid-cols-2 sm:grid-cols-3 sm:gap-x-12 sm:gap-y-20 sm:space-y-0 lg:grid-cols-4 lg:gap-x-16">
				{#each $nfts.tokens as nft, index}
					<li>
						<div id={nft.id} class="space-y-4 p-8">
							<div class="aspect-w-3 aspect-h-2">
								{#if nft.error}
									Error: {nft.error}
								{:else if nft.image}
									<img
										style={`image-rendering: pixelated; ${$nfts.burning[nft.id] ? 'filter: grayscale(100%);' : ''}`}
										class="object-contain h-full w-full"
										alt={nft.name}
										src={generateBitmapDataURI(nft.id, template19_bis)} />
								{:else}
									<p class="">{nft.name}</p>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
