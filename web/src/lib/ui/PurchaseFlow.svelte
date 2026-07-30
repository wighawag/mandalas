<script lang="ts">
	import Modal from '$lib/core/ui/modal/Modal.svelte';
	import {purchaseFlow} from '$lib';
	import {computeBuffer} from '$lib/utils';

	function format(bn: bigint, numDecimals: number): number {
		const precision = 10n ** BigInt(numDecimals);
		return Number((bn * precision) / 1000000000000000000n) / Number(precision);
	}
</script>

<Modal
	openWhen={$purchaseFlow.step !== 'IDLE' && $purchaseFlow.step !== 'SUCCESS'}
	onCancel={() => purchaseFlow.cancel()}
>
	{#if !$purchaseFlow.data}
		Please wait...
	{:else}
		<div class="text-center">
			<h2>Mint for {format($purchaseFlow.data.currentPrice, 4)} ETH</h2>
			<p class="mt-2 text-sm text-gray-300">
				We added a buffer of
				{format(
					computeBuffer(
						$purchaseFlow.data.supply,
						$purchaseFlow.data.currentPrice,
					),
					4,
				)}
				ETH to cover the case someone else is minting at the same time. You'll be
				refunded if that does not happen.
			</p>
			<button
				class="mt-5 border border-yellow-500 p-1"
				onclick={() => purchaseFlow.confirm()}
			>
				Confirm
			</button>
		</div>
	{/if}
</Modal>

<!-- onCancel is required for this to be dismissable at all: Modal sets both
     escapeKeydownBehavior and interactOutsideBehavior to 'ignore' when it is
     absent. Without it, anything that wedges the flow here traps the user. -->
<Modal
	openWhen={$purchaseFlow.step === 'WAITING_TX'}
	onCancel={() => purchaseFlow.cancel()}
>
	<div class="text-center">
		<h2>Confirm the transaction...</h2>
		<p class="mt-2 text-sm text-gray-300">
			Check your wallet. You can close this - it won't cancel a transaction
			you already approved.
		</p>
	</div>
</Modal>
