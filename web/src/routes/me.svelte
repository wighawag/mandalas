<script lang="ts">
  import {onMount} from 'svelte';
  import { url } from '$lib/utils/url';
  import {goto} from '$app/navigation';
  onMount(() => {
    goto(url(`wallet/`), {replaceState: true});
  });
</script>

Redirecting...
