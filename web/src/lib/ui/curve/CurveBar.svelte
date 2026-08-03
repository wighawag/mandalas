<script lang="ts">
	import {getAppContext} from '$lib';
	import {formatBalance} from '$lib/core/utils/format/balance';
	import {PRICE_SYMBOLS} from '$lib/view';

	const {viewState, deployments, canReadChain} = getAppContext();

	// The chain's own symbol, not a hardcoded 'ETH': this app runs against
	// whatever chain it is deployed to, and the home page used to claim ETH on
	// every one of them.
	let symbol = $derived($deployments.chain.nativeCurrency.symbol);
</script>

<!--
	Price and supply are the two numbers that decide whether to mint, and they
	move under you while you scroll a grid that is deliberately long. Left in the
	flow they were readable only at the very top of the page, i.e. never at the
	moment of the decision, so the bar sticks directly under the header.

	It offsets by --header-height (app.css) because CSS does not stack sticky
	elements: without the offset it would stick at y=0 and sit behind the nav.
	z-40 keeps it under the header (z-50) so the two overlap in the right order,
	and the translucent background plus blur keeps the numbers legible while
	mandalas scroll beneath them.

	With nothing to read the chain with, the bar would sit there saying "loading"
	for ever, so it renders nothing instead and the page says what to do about it.
-->
{#if $canReadChain}
	<div
		class="sticky top-[var(--header-height)] z-40 w-full border-b border-border bg-background/90 backdrop-blur-sm"
	>
		<div
			class="needs-gutter-padding mx-auto flex w-full items-center justify-between px-2 py-1.5"
		>
			<p class="text-xs font-black text-yellow-400 md:text-sm">
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
			<p class="text-xs font-black text-yellow-400 md:text-sm">
				Current Supply:
				{#if $viewState.step === 'Loaded'}
					{$viewState.curve.supply}
				{:else}
					loading
				{/if}
			</p>
		</div>
	</div>
{/if}
