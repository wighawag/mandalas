<script lang="ts">
  import {onMount} from 'svelte';
  import {goto} from '$app/navigation';
  import { url } from '$lib/core/utils/web/path';
  onMount(() => {
    goto(url(`/wallet/`), {replaceState: true});
  });
</script>

Redirecting...
