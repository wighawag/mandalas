<script lang="ts">
	import '../app.css';

	import {serviceWorker, notifications, route} from '$lib';
	import {provideRoute, provideENS} from '$lib/core/capabilities';
	import NotificationOverlay from '$lib/core/notifications/NotificationOverlay.svelte';
	import Notifications from '$lib/core/notifications/Notifications.svelte';
	import VersionAndInstallNotfications from '$lib/core/service-worker/VersionAndInstallNotfications.svelte';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';

	import {createContext} from '$lib/context/index.js';
	import Context from '$lib/context/Context.svelte';
	import InitError from '$lib/context/InitError.svelte';
	import Navbar from '$lib/ui/navbar/navbar.svelte';
	import RpcHealthBanner from '$lib/ui/rpc-health/RpcHealthBanner.svelte';
	import NonceCacheBanner from '$lib/ui/nonce-cache/NonceCacheBanner.svelte';
	import OfflineBanner from '$lib/ui/offline/OfflineBanner.svelte';
	import PurchaseFlow from '$lib/ui/purchase/PurchaseFlow.svelte';
	import {createENSService} from '$lib/core/ens';
	import {Toaster} from '$lib/shadcn/ui/sonner';
	import AcrossPages from '$lib/context/AcrossPages.svelte';
	import DefaultHead from '$lib/metadata/DefaultHead.svelte';
	import {page} from '$app/state';

	let {children} = $props();

	// Built once, synchronously, on the server as well as in the browser: every
	// service idles when browser APIs are absent, so the page (and its metadata)
	// prerenders instead of waiting behind a splash. Readiness arrives through
	// the stores. See ADR-0002.
	const context = createContext();

	// Set when the app cannot run at all. Env-derived reasons are known at
	// construction (so the error also prerenders); the `?burner=true` one is
	// raised from start(), which swaps the app out for the error screen.
	const {fatal} = context.context;

	// Provide ambient capabilities to core UI components.
	provideRoute(route);
	// Mandalas always ships an ENS RPC (see web/.env), so ENS is provided
	// unconditionally rather than gated on PUBLIC_ENS_NODE_URL as the template
	// does: the app shows ENS names wherever an address appears.
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

{#if $fatal}
	<InitError message={$fatal} />
{:else}
	<Context {context}>
		<Navbar repoURL="https://github.com/wighawag/mandalas" />
		<OfflineBanner />
		<NonceCacheBanner />
		{#if showRpcBanner}
			<RpcHealthBanner />
		{/if}

		{@render children()}

		<PurchaseFlow />
		<AcrossPages />
	</Context>
{/if}

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
