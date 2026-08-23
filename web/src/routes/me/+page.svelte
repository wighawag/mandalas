<script lang="ts">
	import {onMount} from 'svelte';
	import {goto} from '$app/navigation';
	import {url} from '$lib/kit/paths';
	onMount(() => {
		goto(url(`/wallet/`), {replaceState: true});
	});
</script>

Redirecting...
