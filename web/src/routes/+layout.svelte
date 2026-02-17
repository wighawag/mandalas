<script lang="ts">
	import '../global.css';
	import NavBar from '$lib/components/styled/navigation/NavBar.svelte';
	import Notifications from '$lib/components/styled/notification/Notifications.svelte';
	import NoInstallPrompt from '$lib/components/generic/NoInstallPrompt.svelte';
	import NewVersionNotification from '$lib/components/styled/NewVersionNotification.svelte';

	import webConfig from '$lib/web-config.json';
	import {url} from '$lib/utils/url';

	const title = 'Mandalas - Mandalas are unique prodecurally generated bitmap NFTs on ethereum. The first to use tokenURI to remove the need for any client-code';
	const description = webConfig.description;
	const host = webConfig.url.endsWith('/') ? webConfig.url : webConfig.url + '/';
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
	links={[{href: url(''), title: 'MANDALAS'}, {href: url('wallet/'), title: 'Wallet'}, {href: url('about/'), title: 'About'}]} />

<slot />
