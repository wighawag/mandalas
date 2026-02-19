<script lang="ts">
	import {onMount} from 'svelte';
	import {connection, purchaseFlow, randomTokens, curve} from '$lib';

	function format(bn: bigint, numDecimals: number): number {
		const precision = 10n ** BigInt(numDecimals);
		return Number((bn * precision) / 1000000000000000000n) / Number(precision);
	}

	let nfts = randomTokens;
	nfts.generate(32);

	function mint(nft: {id: string; privateKey: string}) {
		purchaseFlow.mint(nft);
	}

	onMount(() => {
		window.onscroll = function () {
			if (
				window.innerHeight + window.scrollY >=
				document.body.offsetHeight - window.innerHeight / 3
			) {
				nfts.loadMore(32);
			}
		};
	});
</script>

<div class="w-full">
	{#if $curve.state === 'Stuck'}
		<div
			class="mx-auto h-full w-full flex-col text-center text-black dark:text-white"
		>
			<p class="m-2 text-xs font-black text-yellow-400 md:text-base">
				Please Connect to your wallet see latest price and supply
			</p>
			<button
				class="m-2 block border border-yellow-500 p-1 text-xs font-black text-yellow-400 md:text-base"
				onclick={() => connection.connect({type: 'wallet'})}
			>
				Connect
			</button>
		</div>
	{:else}
		<div
			class="mx-auto flex h-full w-full justify-between text-black dark:text-white"
		>
			<p class="m-2 text-xs font-black text-yellow-400 md:text-base">
				Current Price:
				{$curve.currentPrice
					? format($curve.currentPrice, 4) + ' ETH'
					: 'loading'}
			</p>
			<p class="m-2 text-xs font-black text-yellow-400 md:text-base">
				Current Supply:
				{$curve.supply !== undefined && $curve.supply !== null
					? $curve.supply.toString()
					: 'loading'}
			</p>
		</div>
		<div
			class="mx-auto flex h-full w-full justify-between text-black dark:text-white"
		>
			<button
				class="m-2 border border-yellow-500 p-1 text-xs font-black text-yellow-400 md:text-base"
				onclick={() => nfts.reset()}>reset batch</button
			>
		</div>
	{/if}

	<div
		class="mx-auto flex h-full w-full flex-col items-center justify-center text-center text-xs text-black md:text-base dark:text-white"
	>
		<p class="px-4 pt-4">
			There are millions of Mandalas, all unique. Pick the one you like :)
		</p>
		<p class="px-4 pb-1">
			Their price run on a bonding curve. So as more people collect them, the
			more they get expensive. And you can burn them to get most of the price
			back. More details
			<a href="about" class="underline">here</a>.
		</p>
	</div>
	<div
		class="mx-auto flex h-full w-full items-center justify-center text-black dark:text-white"
	></div>

	<section
		class="mx-auto flex h-full w-full items-center justify-center px-4 py-8 text-black dark:text-white"
	>
		{#if !$nfts}
			<div>Generating Mandalas...</div>
		{:else if $nfts.state === 'Idle'}
			<div>Mandalas not loaded</div>
		{:else if $nfts.error}
			<div>Error: {$nfts.error}</div>
		{:else if $nfts.tokens.length === 0 && $nfts.state === 'Loading'}
			<div>Loading Mandalas...</div>
		{:else}
			<ul
				class="grid grid-cols-2 sm:grid-cols-4 sm:space-y-0 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-6 lg:gap-x-8"
			>
				{#each $nfts.tokens as nft, index}
					<li>
						<div id={nft.id} class="p-8">
							<div class="aspect-w-3 aspect-h-2">
								{#if nft.error}
									Error:
									{nft.error}
								{:else if nft.image}
									<img
										onclick={() => mint(nft)}
										style={`image-rendering: pixelated; ${nft.minted ? 'filter: grayscale(100%);' : ''}`}
										class={`h-full w-full object-contain ${nft.minted ? '' : 'cursor-pointer'}`}
										alt={nft.name}
										src={nft.image}
									/>
								{:else}
									<p class="">{nft.name}</p>
								{/if}
							</div>
							{#if nft.image}
								<div class={nft.minted ? 'hidden' : ''}>
									<div class="mt-2 flex">
										<div class="flex w-0 flex-1">
											<button
												onclick={() => mint(nft)}
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
												<span class="ml-3 text-xs md:text-base">Mint It</span>
											</button>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</li>
				{:else}Error: No Mandala could be generated{/each}
			</ul>
		{/if}
	</section>
</div>
