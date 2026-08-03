<script lang="ts">
	import {onMount} from 'svelte';
	import {getAppContext, route} from '$lib';
	import {formatBalance} from '$lib/core/utils/format/balance';
	import {formatError} from '$lib/core/utils/format/error';
	import {PRICE_SYMBOLS} from '$lib/view';
	import Button from '$lib/shadcn/ui/button/button.svelte';
	import {Spinner} from '$lib/shadcn/ui/spinner/index.js';
	import DownloadIcon from '@lucide/svelte/icons/download';

	const {purchaseFlow, randomTokens, viewState, canReadChain, connection} =
		getAppContext();

	const BATCH = 32;

	let symbol = 'ETH';

	onMount(() => {
		// Generated on mount, not at script level: this page prerenders now, and
		// generating during prerender bakes 32 mandalas into the HTML that the
		// browser immediately replaces with 32 different ones.
		void randomTokens.generate(BATCH);

		function onScroll() {
			if (
				window.innerHeight + window.scrollY >=
				document.body.offsetHeight - window.innerHeight / 3
			) {
				void randomTokens.loadMore(BATCH);
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

	<!-- Short hero copy, so centring reads fine here; the measure cap is what
	     matters, otherwise the second sentence runs the full width of a desktop
	     monitor above a grid that is itself gridded and calm. -->
	<div
		class="prose-mandala mx-auto flex w-full max-w-prose flex-col items-center gap-2 px-4 py-4 text-center text-sm leading-relaxed md:text-base"
	>
		<p>There are millions of Mandalas, all unique. Pick the one you like :)</p>
		<p>
			Their price runs on a bonding curve. So as more people collect them, the
			more expensive they get. And you can burn them to get most of the price
			back. More details
			<a href={route('/about/')}>here</a>.
		</p>
	</div>

	<section
		class="mx-auto flex h-full w-full flex-col items-center justify-center px-4 py-8"
	>
		{#if $randomTokens.error}
			<div class="text-destructive">
				Error: {formatError($randomTokens.error)}
			</div>
		{:else if $randomTokens.tokens.length === 0}
			<!-- Generation is CPU work on the main thread: until the first tokens
			     land we are still working, not failing. -->
			{#if $randomTokens.state === 'Ready'}
				<div class="text-destructive">Error: No Mandala could be generated</div>
			{:else}
				<div class="flex items-center gap-2">
					<Spinner />
					<span>Generating Mandalas...</span>
				</div>
			{/if}
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
				{/each}
			</ul>
			{#if $randomTokens.state === 'Loading'}
				<div class="flex items-center gap-2 py-4">
					<Spinner />
					<span>Generating more Mandalas...</span>
				</div>
			{/if}
		{/if}
	</section>
</div>
