<script lang="ts">
	import {onMount} from 'svelte';
	import {generateBitmapDataURI, template19_bis} from 'mandalas-common';
	import {curve, nftsof, connection, walletClient} from '$lib';
	import contractsInfo from '$lib/deployments';
	import {get} from 'svelte/store';
	import {goto} from '$app/navigation';
	import {url} from '$lib/core/utils/web/path';
	import {page} from '$app/stores';
	import Modal from '$lib/core/ui/modal/Modal.svelte';

	let addressFromURI = $state<string | undefined>(undefined);

	onMount(async () => {
		// Get wallet address from URL hash
		if (typeof window !== 'undefined' && window.location.hash) {
			addressFromURI = window.location.hash.substring(1);
		}
	});

	$effect(() => {
		if (
			!addressFromURI &&
			$connection.step === 'WalletConnected' &&
			$connection.mechanism.address
		) {
			const walletAddress = $connection.mechanism.address;
			console.log('redirect');
			goto(url(`/wallet/`, `${walletAddress}`), {replaceState: true}).then(
				() => {
					addressFromURI =
						$page.route && typeof location !== 'undefined'
							? location.hash.substr(1)
							: undefined;
				},
			);
		}
	});

	let currentAddress = $derived(
		$connection.step === 'WalletConnected'
			? $connection.mechanism.address
			: undefined,
	);

	let addressToLook = $derived(addressFromURI || currentAddress);

	let isWalletOwner = $derived(
		currentAddress &&
			addressToLook &&
			currentAddress.toLowerCase() === addressToLook.toLowerCase(),
	);

	let nfts = $derived(nftsof(addressToLook));

	let connected = $derived(
		$connection.step === 'WalletConnected' || $connection.step === 'SignedIn',
	);

	function formatPrice(price: bigint): string {
		return (Number(price) / 1e18).toFixed(4);
	}

	let txStatus = $state<'WAITING_TX' | undefined>(undefined);

	// Burn function would need to be implemented with viem writeContract
	async function burn({id}: {id: bigint}) {
		const currentConnection = await connection.ensureConnected(
			'WalletConnected',
			{type: 'wallet'},
		);
		txStatus = 'WAITING_TX';
		try {
			const walletAddress = currentConnection.mechanism.address;
			const MandalaToken = contractsInfo.contracts.MandalaToken;
			await walletClient.writeContract({
				account: walletAddress,
				...MandalaToken,
				functionName: 'burn',
				args: [id],
			});
		} finally {
			txStatus = undefined;
		}
	}
</script>

<div class="w-full">
	{#if $curve.supply}
		<div
			class="mx-auto flex h-full w-full justify-between text-black dark:text-white"
		>
			<p class="m-2 text-xs font-black text-yellow-400 sm:text-base">
				Current Price:
				{$curve.currentPrice
					? formatPrice($curve.currentPrice) + ' ETH'
					: 'loading'}
			</p>
			<p class="m-2 text-xs font-black text-yellow-400 sm:text-base">
				Current Supply:
				{$curve.supply ? $curve.supply.toString() : 'loading'}
			</p>
		</div>
	{/if}

	{#if !addressToLook && !connected}
		<div
			class="mx-auto h-full w-full flex-col text-center text-black dark:text-white"
		>
			<p class="mt-4 text-xs font-black text-yellow-400 sm:text-base">
				Please Connect to your wallet see the tokens
			</p>
			<button
				class="m-2 border border-yellow-500 p-1 text-xs font-black text-yellow-400 md:text-base"
				onclick={() => connection.connect({type: 'wallet'})}
			>
				Connect
			</button>
		</div>
	{:else if currentAddress && !isWalletOwner}
		<div
			class="mx-auto h-full w-full flex-col text-center text-black dark:text-white"
		>
			<div
				class="mx-auto flex h-full w-full justify-between text-black dark:text-white"
			>
				<!-- TODO reload or reactivate s-->
				<a
					href={`#/`.concat(currentAddress)}
					class="m-2 border border-yellow-500 p-1 text-xs font-black text-yellow-400 md:text-base"
				>
					Show My Mandalas
				</a>
			</div>
		</div>
	{/if}

	{#if $nfts.state === 'Ready'}
		{#if $nfts.tokens.length > 0}
			<div
				class="mx-auto flex h-full w-full flex-col items-center justify-center text-black dark:text-white"
			>
				<p class="p-6">
					{#if isWalletOwner}
						Here are your Mandalas. You can burn them to get 95% of the current
						price. Each time a mandala is burnt, the price decrease. Note that
						once burnt that same Mandala cannot be re-created.
					{:else}Here are the Mandalas for wallet {addressToLook}.{/if}
				</p>
			</div>
		{:else}
			<div
				class="mx-auto flex h-full w-full flex-col items-center justify-center text-black dark:text-white"
			>
				{#if isWalletOwner}
					<p class="p-4">You do not have any Mandala yet.</p>
					<p>get your first one <a href="/" class="underline">here</a></p>
				{:else}
					<p class="p-4">No Mandala for {addressToLook}</p>
				{/if}
			</div>
		{/if}
	{/if}

	<section
		class="mx-auto flex h-full w-full flex-col items-center justify-center px-10 py-8 text-black md:w-3/4 dark:text-white"
	>
		{#if !$nfts}
			<div>Getting Tokens...</div>
		{:else if $nfts.state === 'Idle'}
			<div>Tokens not loaded</div>
		{:else if $nfts.error}
			<div>Error: {$nfts.error}</div>
		{:else if $nfts.tokens.length === 0 && $nfts.state === 'Loading'}
			<div>Loading Your Tokens...</div>
		{:else}
			<ul
				class="grid grid-cols-2 sm:grid-cols-3 sm:space-y-0 sm:gap-x-12 sm:gap-y-20 lg:grid-cols-4 lg:gap-x-16"
			>
				{#each $nfts.tokens as nft, index}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<li>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							id={nft.id.toString()}
							onclick={() => burn(nft)}
							class="space-y-4 p-8"
						>
							<div class="aspect-w-3 aspect-h-2">
								{#if nft.error}
									Error: {nft.error}
								{:else if nft.image}
									<img
										style={`image-rendering: pixelated; ${$nfts.burning[nft.id.toString()] ? 'filter: grayscale(100%);' : ''}`}
										class="h-full w-full object-contain"
										alt={nft.name}
										src={generateBitmapDataURI(
											nft.id.toString(),
											template19_bis,
										)}
									/>
								{:else}
									<p class="">{nft.name}</p>
								{/if}
							</div>
							{#if nft.image && isWalletOwner}
								<div class={$nfts.burning[nft.id.toString()] ? 'hidden' : ''}>
									<div class="mt-2 flex">
										<div class="flex w-0 flex-1">
											<button
												class="relative inline-flex w-0 flex-1 items-center
                        justify-center rounded-br-lg border border-transparent pb-4 text-sm
                        font-medium text-gray-700 hover:text-gray-500
                        dark:text-gray-300"
											>
												<svg
													class="h-6 w-6"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"
													/>
												</svg>
												<span class="ml-3">Burn It</span>
											</button>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

<Modal openWhen={txStatus === 'WAITING_TX'}>
	<div class="text-center">
		<h2>Confirm the transaction...</h2>
		<p class="mt-2 text-sm text-gray-300"></p>
	</div>
</Modal>
