<script lang="ts">
  import NoInstallPrompt from '../components/NoInstallPrompt.svelte';
  import NewVersionNotification from '../components/NewVersionNotification.svelte';
  import {onMount} from 'svelte';

  onMount(() => {
    document.body.classList.add('dark:bg-black');
    document.body.classList.add('bg-white');
    document.documentElement.classList.add('dark');
  });
</script>

<NoInstallPrompt />
<NewVersionNotification />
<slot />
