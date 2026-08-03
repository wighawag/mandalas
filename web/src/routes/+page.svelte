<script lang="ts">
	import {onMount} from 'svelte';
	import {getAppContext, route} from '$lib';
	import {formatError} from '$lib/core/utils/format/error';
	import {truncateHex} from '$lib/core/utils/format';
	import {createCopyToClipboard} from '$lib/core/ui/clipboard/copy-to-clipboard';
	import CurveBar from '$lib/ui/curve/CurveBar.svelte';
	import Button from '$lib/shadcn/ui/button/button.svelte';
	import {Spinner} from '$lib/shadcn/ui/spinner/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	const {purchaseFlow, randomTokens, canReadChain, connection} =
		getAppContext();

	// Per-card "copied?" flag. `createCopyToClipboard` returns a store, but
	// Svelte 5 only auto-subscribes to stores declared at the component's top
	// level; using `$store` inside the each-block is a compile error, and
	// subscribing imperatively from a reactive context is a runtime
	// `state_unsafe_mutation`. So we delay both the subscribe and the state
	// write until the user actually clicks Copy on a card. The first click
	// creates the store, subscribes, and starts mirroring its boolean into
	// the per-id $state; the template then re-renders for that card.
	const copyById = new Map<string, ReturnType<typeof createCopyToClipboard>>();
	let copied = $state<Record<string, boolean>>({});

	function copyStoreFor(id: string) {
		let s = copyById.get(id);
		if (!s) {
			s = createCopyToClipboard();
			copyById.set(id, s);
			// We never unsubscribe: the page is single-shot and the closure
			// just holds a single id-keyed assignment, so the only "leak" is
			// the timer inside the store itself (already managed by
			// createCopyToClipboard).
			s.subscribe((v) => (copied = {...copied, [id]: v}));
		}
		return s;
	}

	async function copyId(id: string) {
		// Click handler, not a reactive context: safe to (lazily) create the
		// store and write $state here.
		await copyStoreFor(id).copy(id);
	}

	async function openMandala(id: string) {
		const url = route('/mandala/', id);
		if (typeof window !== 'undefined') {
			window.location.href = url;
		}
	}

	const BATCH = 32;

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
		<CurveBar />
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

	<!-- Short hero copy, so centring reads fine here; measure and type scale come
	     from .prose-mandala, the same ones the About page reads at. -->
	<div class="prose-mandala flex flex-col items-center gap-2 py-6 text-center">
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
				class="grid grid-cols-2 gap-x-4 gap-y-8 p-4 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 md:gap-x-6 md:gap-y-12 xl:grid-cols-6 xl:gap-x-8"
			>
				{#each $randomTokens.tokens as nft (nft.id)}
					<li>
						<div id={nft.id} class="p-4 sm:p-6">
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
							{#if nft.image}
								<div class="mt-2 flex items-center justify-end gap-1">
									<button
										type="button"
										title={`Open ${truncateHex(nft.id, {start: 4, end: 4})} on its own page`}
										aria-label="Open this Mandala on its own page"
										onclick={() => openMandala(nft.id)}
										class="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									>
										<ExternalLinkIcon class="size-4" />
									</button>
									<button
										type="button"
										title={`Copy id ${truncateHex(nft.id, {start: 4, end: 4})}`}
										aria-label="Copy token id"
										onclick={() => copyId(nft.id)}
										class="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									>
										{#if copied[nft.id]}
											<CheckIcon class="size-4 text-green-500" />
										{:else}
											<CopyIcon class="size-4" />
										{/if}
									</button>
								</div>
							{/if}
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
