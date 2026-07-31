<script lang="ts">
	import {onMount} from 'svelte';
	import {getAppContext} from '$lib';
	import {formatBalance} from '$lib/core/utils/format/balance';
	import {PRICE_SYMBOLS} from '$lib/view';
	import Button from '$lib/shadcn/ui/button/button.svelte';
	import DownloadIcon from '@lucide/svelte/icons/download';

	const {purchaseFlow, randomTokens, viewState, canReadChain, connection} =
		getAppContext();

	const BATCH = 32;

	randomTokens.generate(BATCH);

	let symbol = 'ETH';

	onMount(() => {
		function onScroll() {
			if (
				window.innerHeight + window.scrollY >=
				document.body.offsetHeight - window.innerHeight / 3
			) {
				randomTokens.loadMore(BATCH);
			}
		}
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<div class="w-full">
	{#if !$canReadChain}
		<div class="mx-auto h-full w-full flex-col text-center">
			<p class="m-2 text-xs font-black text-yellow-400 md:text-base">
				Connect your wallet to see the latest price and supply
			</p>
			<Button class="m-2" onclick={() => connection.connect()}>Connect</Button>
		</div>
	{:else}
		<div class="mx-auto flex h-full w-full justify-between">
			<p class="m-2 text-xs font-black text-yellow-400 md:text-base">
				Current Price:
				{#if $viewState.step === 'Loaded'}
					{formatBalance($viewState.curve.currentPrice, 18, PRICE_SYMBOLS)}
					{symbol}{#if $viewState.curve.pending}<span
							class="ml-1 font-normal text-yellow-600">(pending)</span
						>{/if}
				{:else}
					loading
				{/if}
			</p>
			<p class="m-2 text-xs font-black text-yellow-400 md:text-base">
				Current Supply:
				{#if $viewState.step === 'Loaded'}
					{$viewState.curve.supply}
				{:else}
					loading
				{/if}
			</p>
		</div>
		<div class="mx-auto flex h-full w-full justify-between">
			<Button
				variant="outline"
				size="sm"
				class="m-2"
				onclick={() => randomTokens.reset()}
			>
				reset batch
			</Button>
		</div>
	{/if}

	<div
		class="mx-auto flex h-full w-full flex-col items-center justify-center text-center text-xs md:text-base"
	>
		<p class="px-4 pt-4">
			There are millions of Mandalas, all unique. Pick the one you like :)
		</p>
		<p class="px-4 pb-1">
			Their price runs on a bonding curve. So as more people collect them, the
			more expensive they get. And you can burn them to get most of the price
			back. More details
			<a href="about" class="underline">here</a>.
		</p>
	</div>

	<section
		class="mx-auto flex h-full w-full items-center justify-center px-4 py-8"
	>
		{#if !$randomTokens}
			<div>Generating Mandalas...</div>
		{:else if $randomTokens.state === 'Idle'}
			<div>Mandalas not loaded</div>
		{:else if $randomTokens.error}
			<div class="text-destructive">Error: {$randomTokens.error}</div>
		{:else if $randomTokens.tokens.length === 0 && $randomTokens.state === 'Loading'}
			<div>Loading Mandalas...</div>
		{:else}
			<ul
				class="grid grid-cols-2 sm:grid-cols-4 sm:space-y-0 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-6 lg:gap-x-8"
			>
				{#each $randomTokens.tokens as nft (nft.id)}
					<li>
						<div id={nft.id} class="p-8">
							<div class="aspect-w-3 aspect-h-2">
								{#if nft.error}
									Error: {nft.error}
								{:else if nft.image}
									<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<img
										onclick={() => !nft.minted && purchaseFlow.mint(nft)}
										style={`image-rendering: pixelated; ${nft.minted ? 'filter: grayscale(100%);' : ''}`}
										class={`h-full w-full object-contain ${nft.minted ? '' : 'cursor-pointer'}`}
										alt={nft.name}
										src={nft.image}
									/>
								{:else}
									<p>{nft.name}</p>
								{/if}
							</div>
							{#if nft.image && !nft.minted}
								<div class="mt-2 flex">
									<button
										onclick={() => purchaseFlow.mint(nft)}
										class="relative inline-flex w-0 flex-1 items-center justify-center rounded-br-lg border border-transparent pb-4 text-sm font-medium text-muted-foreground hover:text-foreground"
									>
										<DownloadIcon class="h-6 w-6" />
										<span class="ml-3 text-xs md:text-base">Mint It</span>
									</button>
								</div>
							{/if}
						</div>
					</li>
				{:else}
					<div>Error: No Mandala could be generated</div>
				{/each}
			</ul>
		{/if}
	</section>
</div>
