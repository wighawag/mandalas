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

<Modal openWhen={$purchaseFlow.step === 'WAITING_TX'}>
	<div class="text-center">
		<h2>Confirm the transaction...</h2>
		<p class="mt-2 text-sm text-gray-300"></p>
	</div>
</Modal>
