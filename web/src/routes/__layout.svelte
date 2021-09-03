<script lang="ts">
  import '../service-worker-handler';
  import '../global.css';
  import Notifications from '$lib/components/notification/Notifications.svelte';
  import NoInstallPrompt from '$lib/components/NoInstallPrompt.svelte';
  import NewVersionNotification from '$lib/components/NewVersionNotification.svelte';
  // import Install from './components/Install.svelte';

  import {appDescription, url as appUrl} from '../../application.json';
  import NavBar from '$lib/components/navigation/NavBar.svelte';

  const title = 'Jolly Roger, Template for Decentralised Applications.';
  const description = appDescription;
  const host = appUrl.endsWith('/') ? appUrl : appUrl + '/';
  const previewImage = host + 'preview.png';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="title" content={title} />
  <meta name="description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={host} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={previewImage} />
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={host} />
  <meta property="twitter:title" content={title} />
  <meta property="twitter:description" content={description} />
  <meta property="twitter:image" content={previewImage} />
</svelte:head>

<NoInstallPrompt />
<NewVersionNotification />
<Notifications />
<NavBar
  links={[{href: '/', title: 'MANDALAS'}, {href: 'wallet', title: 'Wallet'}, {href: 'about', title: 'About'}]} />

<slot />
