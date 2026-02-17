<script>
	import Button from '../ethereum/generic/Button.svelte';
	import Modal from './Modal.svelte';
	import {warning} from './warning';
</script>

<Modal openWhen={!!$warning} onCancel={() => warning.hide()}>
	{#snippet title()}
		{$warning}
	{/snippet}
	<Button onclick={() => warning.hide()}>ok</Button>
</Modal>
