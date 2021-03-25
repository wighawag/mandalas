<script lang="ts">
  import {getRouter} from '@curi/svelte';
  import {onMount} from 'svelte';
  let router = getRouter();
  onMount(() => {
    router.navigate({
      url: router.url({name: 'wallet'}),
      method: 'replace',
    });
  });
</script>

Redirecting...
