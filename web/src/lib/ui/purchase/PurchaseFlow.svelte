<script lang="ts">
	import * as Dialog from '$lib/shadcn/ui/dialog/index.js';
	import Button from '$lib/shadcn/ui/button/button.svelte';
	import {Spinner} from '$lib/shadcn/ui/spinner/index.js';
	import {formatBalance} from '$lib/core/utils/format/balance';
	import {PRICE_SYMBOLS} from '$lib/view';
	import {getAppContext} from '$lib';
	import {computeBuffer} from './purchase-flow';

	const {purchaseFlow, deployments} = getAppContext();

	const {initialPrice, linearCoefficient} =
		$deployments.contracts.MandalaToken.linkedData;
	const curveParams = {
		initialPrice: BigInt(initialPrice),
		linearCoefficient: BigInt(linearCoefficient),
	};

	let symbol = $derived($deployments.chain.nativeCurrency.symbol);

	let buffer = $derived.by(() => {
		if ($purchaseFlow.supply === undefined) return undefined;
		if ($purchaseFlow.currentPrice === undefined) return undefined;
		return computeBuffer(
			$purchaseFlow.supply,
			$purchaseFlow.currentPrice,
			curveParams,
		);
	});

	// The dialog is driven by the flow's step; closing it always means "cancel",
	// which is safe at every step (a transaction already handed to the wallet is
	// tracked by the tx-observer, not by this dialog).
	let open = $derived($purchaseFlow.step !== 'IDLE');
</script>

<Dialog.Root
	{open}
	onOpenChange={(next) => {
		if (!next) purchaseFlow.cancel();
	}}
>
	<!-- The target has to reach Content, which supplies its own portal (see
	     shadcn's dialog-content.svelte). A bare `<Dialog.Portal to="..." />`
	     sibling has no children and does nothing, so this dialog was going to
	     document.body while every other modal moved into #--layer-modals - which
	     put it ABOVE the wallet picker its own Confirm button raises, since
	     stacking between equal z-indexes is decided by DOM order. See
	     core/ui/modal/modal.svelte and the ordering note in context/AcrossPages. -->
	<Dialog.Content portalProps={{to: '#--layer-modals'}} class="sm:max-w-md">
		{#if $purchaseFlow.step === 'LOADING_CURRENT_PRICE'}
			<Dialog.Header>
				<Dialog.Title>Checking the current price...</Dialog.Title>
			</Dialog.Header>
			<div class="flex justify-center py-6"><Spinner /></div>
		{:else if $purchaseFlow.step === 'CONFIRM' && $purchaseFlow.currentPrice !== undefined}
			<Dialog.Header>
				<Dialog.Title>
					Mint for {formatBalance(
						$purchaseFlow.currentPrice,
						18,
						PRICE_SYMBOLS,
					)}
					{symbol}
				</Dialog.Title>
				<Dialog.Description>
					{#if buffer !== undefined}
						We add a buffer of {formatBalance(buffer, 18, PRICE_SYMBOLS)}
						{symbol} in case someone mints at the same time and moves the price. You
						are refunded if that does not happen.
					{/if}
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => purchaseFlow.cancel()}>
					Cancel
				</Button>
				<Button onclick={() => purchaseFlow.confirm()}>Confirm</Button>
			</Dialog.Footer>
		{:else if $purchaseFlow.step === 'WAITING_TX'}
			<Dialog.Header>
				<Dialog.Title>Confirm in your wallet...</Dialog.Title>
				<Dialog.Description>
					Closing this will not cancel a transaction you already approved.
				</Dialog.Description>
			</Dialog.Header>
			<div class="flex justify-center py-6"><Spinner /></div>
		{:else if $purchaseFlow.step === 'SUCCESS'}
			<Dialog.Header>
				<Dialog.Title>Mandala on its way</Dialog.Title>
				<Dialog.Description>
					Your mint was submitted. Follow it in Your Transactions.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button onclick={() => purchaseFlow.acknowledge()}>Close</Button>
			</Dialog.Footer>
		{:else if $purchaseFlow.step === 'ERROR' && $purchaseFlow.error}
			<Dialog.Header>
				<Dialog.Title>Mint failed</Dialog.Title>
				<Dialog.Description>{$purchaseFlow.error.message}</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => purchaseFlow.cancel()}>
					Close
				</Button>
				<Button onclick={() => purchaseFlow.acknowledge()}>Details</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
