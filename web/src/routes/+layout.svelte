<script lang="ts">
	import '../app.css';

	import {serviceWorker, notifications, route} from '$lib';
	import {provideRoute, provideENS} from '$lib/core/capabilities';
	import NotificationOverlay from '$lib/core/notifications/NotificationOverlay.svelte';
	import Notifications from '$lib/core/notifications/Notifications.svelte';
	import VersionAndInstallNotfications from '$lib/core/service-worker/VersionAndInstallNotfications.svelte';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';

	import {createContext} from '$lib/context/index.js';
	import AsyncContext from '$lib/context/AsyncContext.svelte';
	import Navbar from '$lib/ui/navbar/navbar.svelte';
	import RpcHealthBanner from '$lib/ui/rpc-health/RpcHealthBanner.svelte';
	import NonceCacheBanner from '$lib/ui/nonce-cache/NonceCacheBanner.svelte';
	import OfflineBanner from '$lib/ui/offline/OfflineBanner.svelte';
	import PurchaseFlow from '$lib/ui/purchase/PurchaseFlow.svelte';
	import {createENSService} from '$lib/core/ens';
	import {Toaster} from '$lib/shadcn/ui/sonner';
	import AcrossPages from '$lib/context/AcrossPages.svelte';
	import DefaultHead from '$lib/metadata/DefaultHead.svelte';
	import {url} from '$lib/core/utils/web/path';
	import {page} from '$app/state';

	let {children} = $props();

	// Provide ambient capabilities to core UI components.
	provideRoute(route);
	provideENS(createENSService());

	// The RPC-health / no-RPC banner is relevant on pages that read onchain data.
	// The standalone mandala renderer does not (it is pure client-side generation
	// from the id in the hash), so it is excluded. `page.route.id` is base-path
	// independent (works under IPFS/relative paths).
	let showRpcBanner = $derived(
		page.route.id !== '/mandala' && page.route.id !== '/about',
	);
</script>

<DefaultHead />

<NavigationProgress />

<!-- splashImage must go through url(): with `paths.relative: true` a bare
     '/icon.png' resolves against the gateway root, not the app, so the splash
     would 404 on IPFS. AsyncContext's own default is already wrapped; an
     override has to do the same. Mandalas ships a png rather than the
     template's svg. -->
<AsyncContext getContext={createContext} splashImage={url('/icon.png')}>
	<Navbar repoURL="https://github.com/wighawag/mandalas" />
	<OfflineBanner />
	<NonceCacheBanner />
	{#if showRpcBanner}
		<RpcHealthBanner />
	{/if}

	{@render children()}

	<PurchaseFlow />
	<AcrossPages />
</AsyncContext>

<Toaster position="bottom-right" richColors closeButton />

<VersionAndInstallNotfications
	{serviceWorker}
	classes={{
		root: 'bg-background bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,var(--color-muted)_10px,var(--color-muted)_20px)]',
	}}
/>

<NotificationOverlay>
	<Notifications {notifications} />
</NotificationOverlay>

<div id="--layer-drawer"></div>
<div id="--layer-modals"></div>
