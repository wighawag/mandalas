<script lang="ts">
	import '../app.css';

	import {version} from '$app/environment';
	import {serviceWorker, notifications, params, route} from '$lib';
	import {
		provideRoute,
		provideENS,
		provideDocumentLocation,
	} from '$lib/core/capabilities';
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
	import SendingBanner from '$lib/ui/in-flight/SendingBanner.svelte';
	import {createENSService} from '$lib/core/ens';
	import {Toaster} from '$lib/shadcn/ui/sonner';
	import AcrossPages from '$lib/context/AcrossPages.svelte';
	import DefaultHead from '$lib/metadata/DefaultHead.svelte';
	import {LAYERS} from '$lib/core/ui/layers';
	import KitNavigation from '$lib/kit/KitNavigation.svelte';
	import {navigating, page} from '$app/state';
	// Identity, from the one file that holds it. Deliberately NOT written as
	// literals here: this layout is the most-edited file in the template, so a
	// constant parked in it costs a merge conflict to every fork that changes it
	// (the `website` branch paid four for this one line). Empty means no link.
	// Mandalas used to write its repo URL inline on <Navbar> below, which is the
	// very cost this import removes.
	import {repoURL, communityURL} from '../web-config.json';

	let {children} = $props();

	// Built once, synchronously, on the server as well as in the browser: every
	// service idles when browser APIs are absent, so the page (and its metadata)
	// prerenders instead of waiting behind a splash. Readiness arrives through
	// the stores. See ADR-0002 (`work` branch).
	const context = createContext();

	// Set when the app cannot run at all. Env-derived reasons are known at
	// construction (so the error also prerenders); the `?burner=true` one is
	// raised from start(), which swaps the app out for the error screen.
	const {fatal} = context.context;

	// Provide ambient capabilities to core UI components.
	provideRoute(route);
	// Where the document is, for the parts that must know during SSR (page
	// metadata). Getters, so components reading them track `page` as if they had
	// read it themselves, without importing the framework.
	provideDocumentLocation({
		pathname: () => page.url.pathname,
		version: () => version,
	});
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

<!-- No bare <NavigationProgress /> here any more: it is rendered once, in the
     `progress` overlay layer at the bottom of this file, where the layer order
     decides that a 2px pointer-events-none bar sits above everything. -->
{#if $fatal}
	<InitError message={$fatal} />
{:else}
	<Context {context}>
		<!-- Wires SvelteKit to the navigation service the context holds, and
		     provides it as a capability. First, so anything below can rely on the
		     app knowing where it is. Renders nothing. -->
		<KitNavigation />
		<!-- The framework's answers, handed to components that must not ask for
		     themselves. Getters, so reading them inside those components tracks
		     `page`/`navigating` as if they had. See src/lib/kit/README.md. -->
		<Navbar {repoURL} {communityURL} currentPath={() => page.url.pathname} />
		<SendingBanner />
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

<!--
	OVERLAY LAYERS.

	Every floating surface goes in one of these, and the ORDER IS DECIDED BY THE
	NUMBERS IN app.css (`--z-layer-*`), not by the order written here: each layer
	is a stacking context, so a surface's own z-index (shadcn's `z-50`, sonner's
	`999999999`) only ranks it against its layer-mates.

	The containers are rendered from `core/ui/layers.ts`, the same list that tells
	components which layer to target, so a layer cannot exist as a portal target
	with no container to land in (or the reverse). Four of them stay empty for
	exactly that reason: they are PORTAL TARGETS, addressed by id from
	`core/ui/modal/modal.svelte` (which addresses TWO of them, the modal layer and
	the system layer above it), the navbar drawer and the popover/select contents.
	A component that forgets to name its target does not land here, and then its
	paint order is an accident of where it sits in the tree, which is how the
	drawer once covered every modal.

	The rest hold app-owned surfaces, supplied below as snippets keyed by layer
	name. Written as snippets rather than as hand-placed divs so that the list
	stays the only place a layer is declared: a surface whose layer was deleted
	simply never renders, instead of quietly painting in the root stacking context
	above everything.
-->
{#snippet noticeLayer()}
	<VersionAndInstallNotfications
		{serviceWorker}
		classes={{
			root: 'bg-background bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,var(--color-muted)_10px,var(--color-muted)_20px)]',
		}}
	/>
{/snippet}

{#snippet toastLayer()}
	<Toaster position="bottom-right" richColors closeButton />
	<NotificationOverlay>
		<Notifications {notifications} />
	</NotificationOverlay>
{/snippet}

{#snippet progressLayer()}
	<NavigationProgress isNavigating={() => !!navigating.to} />
{/snippet}

{#each LAYERS as layer (layer.id)}
	<div id={layer.id} data-layer={layer.name}>
		{#if layer.name === 'notice'}{@render noticeLayer()}{:else if layer.name === 'toast'}{@render toastLayer()}{:else if layer.name === 'progress'}{@render progressLayer()}{/if}
	</div>
{/each}
