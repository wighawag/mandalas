<script lang="ts">
	import {getAppContext, route} from '$lib';
	import Button, {buttonVariants} from '$lib/shadcn/ui/button/button.svelte';
	import EthereumAvatar from '../../core/ui/ethereum/EthereumAvatar.svelte';
	import {Spinner} from '$lib/shadcn/ui/spinner/index.js';
	import * as Drawer from '$lib/shadcn/ui/drawer/index.js';
	import * as Collapsible from '$lib/shadcn/ui/collapsible/index.js';
	import * as Popover from '$lib/shadcn/ui/popover/index.js';
	import Address from '../../core/ui/ethereum/Address.svelte';
	import Badge from '$lib/shadcn/ui/badge/badge.svelte';
	import {formatBalance} from '$lib/core/utils/format/balance';
	import {countPendingOperations} from '$lib/view/operation';
	import {effectiveGasPrice} from '$lib/core/connection/gasFee';
	import {FaucetButton, hasFaucet} from '$lib/core/ui/faucet/index.js';
	import MenuIcon from '@lucide/svelte/icons/menu';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import AlertCircleIcon from '@lucide/svelte/icons/circle-alert';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import GitIcon from '$lib/icons/GitIcon.svelte';
	import {url} from '$lib/kit/paths';
	import {NAV_LINKS, foldedMenuLabel, isActivePath} from '$lib/navigation';
	import {navbarMenuPrompt} from './overlays';

	let {
		repoURL,
		communityURL,
		currentPath,
	}: {
		repoURL?: string;
		communityURL?: string;
		/**
		 * The path being shown, as a GETTER so reading it here tracks the caller's
		 * reactive source. Passed in rather than read from the router, so the navbar
		 * does not name the framework (src/lib/kit/README.md), and so it still
		 * highlights the right link during SSR, when the navigation service is
		 * deliberately inert.
		 */
		currentPath: () => string;
	} = $props();

	/**
	 * Whether the left-hand side fits beside the wallet is MEASURED, not pinned
	 * to a breakpoint, because both sides of the bar move: the right-hand side is
	 * a Connect button, or a balance and an avatar, or an avatar on its own, and
	 * it changes the moment somebody connects. At 320px the unfolded left side is
	 * 273px wide and the wallet another 124px, so the wallet was simply pushed off
	 * the right edge, which is the bug this measurement exists to prevent.
	 *
	 * Where it does not fit, the bar keeps the site name and folds the rest (the
	 * pages, and the repo/community links) into one menu, whose label says which
	 * page you are on. Navigation stays on the LEFT, where it belongs: the button
	 * beside it is the wallet, and it becomes an account avatar once you connect,
	 * which is the wrong place to hide pages.
	 */
	let moreOpen = $state(false);

	let navElement = $state<HTMLElement | undefined>(undefined);
	/** The hidden copy of the whole left-hand side, which is what gets measured. */
	let measuringElement = $state<HTMLElement | undefined>(undefined);
	let accountElement = $state<HTMLElement | undefined>(undefined);

	/**
	 * Starts as "it fits", because that is right on a desktop, which is where a
	 * prerendered page is most often first painted; the measurement corrects it
	 * before the browser paints anything on a phone.
	 */
	let showsEveryLink = $state(true);

	/** Room for the gap between the two halves, and a little either way. */
	const BREATHING_ROOM = 24;

	function measureLinks() {
		if (!navElement || !measuringElement || !accountElement) {
			return;
		}
		const available =
			navElement.clientWidth - accountElement.offsetWidth - BREATHING_ROOM;
		showsEveryLink = measuringElement.scrollWidth <= available;
	}

	$effect(() => {
		if (!navElement || !accountElement) {
			return;
		}
		measureLinks();
		// The bar resizes with the window; the account side also resizes on its own
		// when a wallet connects and a balance appears where a button was.
		const observer = new ResizeObserver(measureLinks);
		observer.observe(navElement);
		observer.observe(accountElement);
		// Link widths change when the webfont lands, which is after the first paint.
		void document.fonts?.ready.then(measureLinks);
		return () => observer.disconnect();
	});

	const {
		connection,
		accountData,
		accountBalance,
		gasFee,
		clock,
		deployments,
		overlays,
	} = getAppContext();

	// The drawer closes itself on any navigation, and the back gesture closes it,
	// because it is a registered view overlay. Nav links below therefore carry no
	// close handler of their own.
	const menu = overlays.use(navbarMenuPrompt);
	$effect(() => menu.registerRenderer());

	let accountsOpen = $state(false);

	let hasMultipleAccounts = $derived(
		$connection.wallet?.accounts && $connection.wallet.accounts.length > 1,
	);

	// Watch all operations; the pending-badge counting rule lives in the view helper.
	let operations = $derived(accountData.watchField('operations'));
	let transactionCount = $derived(countPendingOperations($operations));

	// Derive formatted balance
	let formattedBalance = $derived.by(() => {
		if ($accountBalance.step === 'Loaded') {
			return formatBalance($accountBalance.value, 18, 6);
		}
		return null;
	});

	// Balance status store
	const balanceStatus = accountBalance.status;

	// Format time ago for stale indicator (reactive to clock store)
	function formatTimeAgo(timestamp: number): string {
		const seconds = Math.floor(($clock - timestamp) / 1000);
		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ago`;
	}

	// Gas fee store and status
	const gasFeeStatus = gasFee.status;

	// Format effective gas price in gwei (9 decimals).
	let formattedGasPrice = $derived.by(() => {
		if ($gasFee.step === 'Loaded') {
			return formatBalance(effectiveGasPrice($gasFee), 9, 6);
		}
		return null;
	});

	function toggleMenu() {
		if ($menu.open) menu.close();
		else menu.open();
	}

	function isActive(path: string): boolean {
		return isActivePath(path, currentPath());
	}

	let menuLabel = $derived(foldedMenuLabel(NAV_LINKS, currentPath()));
</script>

<!-- The multicolor rules bracketing the bar are the Mandalas signature, drawn
     from the same 8x-scaled bitmap the tokens themselves are made of. The whole
     header sticks as one unit, so both rules travel with it and stay flush and
     full-bleed (no page gutter) as the page scrolls. -->
{#snippet colorStrip()}
	<!-- The source bitmap is 128x1, i.e. ONE pixel tall. It must tile on both
	     axes (the CSS default) so it fills the strip's height; constraining it to
	     repeat-x renders a single 1px line in a 4px box and looks too thin. -->
	<!-- Height comes from --strip-height (app.css) rather than a utility, so the
	     bar's own height stays derivable and anything sticking below the header
	     can offset by --header-height without the two drifting apart. -->
	<div
		class="w-full"
		style={`height: var(--strip-height); background: url(${url('/images/multicolor_line_x8.png')});`}
	></div>
{/snippet}

<header class="sticky top-0 left-0 z-50 w-full">
	{@render colorStrip()}
	<!--navbar padding handled by scrollbar-gutter on desktop, needs-gutter-padding class adds padding on touch devices, see app.css-->
	<nav
		bind:this={navElement}
		class="needs-gutter-padding flex h-[var(--nav-height)] w-full items-center justify-between bg-background py-4 shadow-md"
	>
		<!-- The left-hand side laid out in full, but not shown, so the width it WOULD
		     take can be measured whatever the bar is currently showing. Without it the
		     decision would feed on its own output: fold, become narrower, decide it
		     fits, unfold, overflow, fold again. -->
		<div
			bind:this={measuringElement}
			aria-hidden="true"
			class="pointer-events-none invisible absolute top-0 left-0 m-1 flex items-center space-x-4 whitespace-nowrap"
		>
			<span class="inline-flex items-baseline gap-4">
				<span class="px-2 py-1 text-sm font-black tracking-wider">MANDALAS</span
				>
				{#each NAV_LINKS as link (link.href)}
					<span class="px-2 py-1 text-sm font-semibold">{link.title}</span>
				{/each}
			</span>
			<span class="flex items-center space-x-2">
				{#if repoURL}<span class="block h-5 w-5"></span>{/if}
				{#if communityURL}<span class="block h-5 w-5"></span>{/if}
			</span>
		</div>

		<!-- `min-w-0` lets this side shrink and `overflow-hidden` keeps whatever is
		     left of it inside its own box, so the wallet on the right can never be
		     pushed off the edge of a narrow screen. -->
		<div
			class="m-1 flex h-full min-w-0 flex-1 items-center space-x-4 overflow-hidden"
		>
			<span class="inline-flex items-baseline gap-4">
				<!-- The site's name is the one thing that never folds: it is the brand,
				     and it is the way home. -->
				<a
					href={route('/')}
					class="rounded px-2 py-1 text-sm font-black tracking-wider whitespace-nowrap transition-colors {isActive(
						'/',
					)
						? 'bg-primary/20 text-primary'
						: 'text-yellow-400 hover:text-yellow-300 hover:underline'}"
				>
					MANDALAS
				</a>
				{#if showsEveryLink}
					{#each NAV_LINKS as link (link.href)}
						<a
							href={route(link.href)}
							class="rounded px-2 py-1 text-sm whitespace-nowrap transition-colors {isActive(
								link.href,
							)
								? 'bg-primary/20 font-semibold text-primary'
								: 'text-muted-foreground hover:text-foreground hover:underline'}"
						>
							{link.title}
						</a>
					{/each}
				{/if}
			</span>
			{#if showsEveryLink}
				<div class="flex items-center space-x-2">
					{#if repoURL}
						<a
							href={repoURL}
							target="_blank"
							rel="noopener noreferrer"
							class="text-muted-foreground hover:text-foreground"
							aria-label="GitHub"
						>
							<GitIcon class="h-5 w-5 fill-white" />
						</a>
					{/if}
					{#if communityURL}
						<a
							href={communityURL}
							target="_blank"
							rel="noopener noreferrer"
							class="text-muted-foreground hover:text-foreground"
							aria-label="Discord"
						>
							<MessageCircleIcon class="h-5 w-5" />
						</a>
					{/if}
				</div>
			{:else}
				<!-- Folded: one menu holding every page but home, and the outside links.
				     Its label is the page you are on, so the bar still says where you are
				     with the room it has; on home it says `More`, because the lit
				     MANDALAS beside it has already said it. -->
				<Popover.Root bind:open={moreOpen}>
					<Popover.Trigger
						class="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
						aria-label="More pages"
					>
						{menuLabel}
						<ChevronDownIcon
							class="h-3 w-3 transition-transform {moreOpen
								? 'rotate-180'
								: ''}"
						/>
					</Popover.Trigger>
					<Popover.Content align="start" sideOffset={8} class="w-44 p-1">
						{#each NAV_LINKS as link (link.href)}
							<a
								href={route(link.href)}
								class="block rounded px-3 py-2 text-sm transition-colors {isActive(
									link.href,
								)
									? 'bg-primary/20 font-semibold text-primary'
									: 'text-muted-foreground hover:text-foreground'}"
								onclick={() => (moreOpen = false)}
							>
								{link.title}
							</a>
						{/each}
						{#if repoURL}
							<a
								href={repoURL}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-2 rounded px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
								onclick={() => (moreOpen = false)}
							>
								<GitIcon class="h-4 w-4 fill-current" />
								Code
							</a>
						{/if}
						{#if communityURL}
							<a
								href={communityURL}
								target="_blank"
								rel="noopener noreferrer"
								class="flex items-center gap-2 rounded px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
								onclick={() => (moreOpen = false)}
							>
								<MessageCircleIcon class="h-4 w-4" />
								Community
							</a>
						{/if}
					</Popover.Content>
				</Popover.Root>
			{/if}
		</div>

		<div
			bind:this={accountElement}
			class="relative flex h-full shrink-0 items-center space-x-2"
		>
			<!-- Connect Button / Connected Address -->
			{#if ($connection.step === 'Idle' && $connection.loading) || ($connection.step != 'Idle' && !connection.isTargetStepReached($connection))}
				<Button disabled class="m-1 flex h-8 items-center justify-center p-0">
					<Spinner /> Connect
				</Button>
			{:else if connection.isTargetStepReached($connection)}
				<div class="m-1 hidden h-8 items-center space-x-2 sm:flex">
					{#if $balanceStatus.error && formattedBalance !== null}
						<span class="flex items-center gap-1 text-sm text-muted-foreground">
							<AlertCircleIcon class="h-3 w-3 text-amber-500" />
							{formattedBalance}
							{$deployments.chain.nativeCurrency.symbol}
						</span>
					{:else if formattedBalance !== null}
						<span class="text-sm text-muted-foreground"
							>{formattedBalance}
							{$deployments.chain.nativeCurrency.symbol}</span
						>
					{:else if $balanceStatus.error}
						<span class="flex items-center gap-1 text-sm text-destructive">
							<AlertCircleIcon class="h-3 w-3" />
							Balance error
						</span>
					{/if}
				</div>
			{:else}
				<Button
					class="m-1 flex h-8 items-center justify-center p-0 px-3"
					onclick={() => connection.connect()}
				>
					Connect
				</Button>
			{/if}

			<!-- Drawer Button - Avatar when connected, Menu icon when disconnected -->
			<button
				class="relative m-1 flex h-8 w-8 items-center justify-center rounded-md focus:outline-none {$connection.step !==
				'SignedIn'
					? 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
					: ''}"
				onclick={toggleMenu}
				aria-label="Open menu"
			>
				{#if connection.isTargetStepReached($connection)}
					<EthereumAvatar address={$connection.account.address} />
					{#if transactionCount > 0}
						<span
							class="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground"
						>
							{transactionCount > 99 ? '99+' : transactionCount}
						</span>
					{/if}
				{:else}
					<MenuIcon class="h-5 w-5" />
				{/if}
			</button>
		</div>
		<Drawer.Root
			open={$menu.open}
			onOpenChange={(open) => {
				if (!open) menu.close();
			}}
			direction="right"
		>
			<!-- Lands in the drawer layer, which is Drawer.Content's own default (see
			     lib/core/ui/layers.ts). That is what keeps the modals this panel opens
			     ABOVE the panel itself. The target has to be on Content, which supplies
			     its own portal: a bare `<Drawer.Portal to="..." />` sibling has no
			     children and silently does nothing, which is what once put this drawer
			     on top of every modal. -->
			<Drawer.Content class="select-text **:select-text">
				{#if connection.isTargetStepReached($connection)}
					<!-- Account Section -->
					<div class="flex flex-col gap-2 px-4 pt-4">
						<Collapsible.Root
							bind:open={accountsOpen}
							disabled={!hasMultipleAccounts}
						>
							<Collapsible.Trigger
								class="w-full"
								disabled={!hasMultipleAccounts}
							>
								<div
									class="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 {hasMultipleAccounts
										? 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
										: 'cursor-default'}"
								>
									<div class="flex items-center gap-2">
										<div
											class="h-6 w-6 shrink-0 overflow-hidden *:h-full *:w-full"
										>
											<EthereumAvatar address={$connection.account.address} />
										</div>
										<Address value={$connection.account.address} />
									</div>
									{#if hasMultipleAccounts}
										<ChevronDownIcon
											class="h-4 w-4 transition-transform {accountsOpen
												? 'rotate-180'
												: ''}"
										/>
									{/if}
								</div>
							</Collapsible.Trigger>
							{#if hasMultipleAccounts && $connection.wallet}
								<Collapsible.Content>
									<div
										class="mt-1 flex flex-col gap-1 rounded-md border border-input bg-muted/50 p-1"
									>
										{#each $connection.wallet.accounts as account}
											<button
												class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors {account ===
												$connection.account.address
													? 'bg-primary/20 text-primary'
													: 'hover:bg-accent hover:text-accent-foreground'}"
												onclick={() => {
													if (account !== $connection.account.address) {
														connection.connectToAddress(account);
														accountsOpen = false;
													}
												}}
											>
												<div
													class="h-5 w-5 shrink-0 overflow-hidden *:h-full *:w-full"
												>
													<EthereumAvatar address={account} />
												</div>
												<Address value={account} />
												{#if account === $connection.account.address}
													<span class="ml-auto text-xs text-muted-foreground"
														>(current)</span
													>
												{/if}
											</button>
										{/each}
									</div>
								</Collapsible.Content>
							{/if}
						</Collapsible.Root>

						<Button
							class="w-full"
							variant="destructive"
							onclick={() => {
								connection.disconnect();
								menu.close();
							}}
						>
							Disconnect
						</Button>
					</div>

					<!-- Balance & Transactions Section -->
					<div
						class="mt-4 flex flex-col gap-2 border-t border-border px-4 pt-4"
					>
						<div class="flex flex-col gap-1 rounded-md bg-muted/50 px-3 py-2">
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Balance</span>
								{#if $balanceStatus.loading && formattedBalance === null}
									<Spinner class="h-4 w-4" />
								{:else if formattedBalance !== null}
									<span class="font-medium"
										>{formattedBalance}
										{$deployments.chain.nativeCurrency.symbol}</span
									>
								{:else if $balanceStatus.error}
									<span class="text-sm text-destructive">Failed to load</span>
								{:else}
									<span class="text-sm text-muted-foreground">—</span>
								{/if}
							</div>

							{#if $balanceStatus.error}
								<div class="flex items-center justify-between">
									<span
										class="flex items-center gap-1 text-xs text-destructive"
									>
										<AlertCircleIcon class="h-3 w-3" />
										{#if $balanceStatus.lastSuccessfulFetch}
											Stale — updated {formatTimeAgo(
												$balanceStatus.lastSuccessfulFetch,
											)}
										{:else}
											Unable to fetch balance
										{/if}
									</span>
									<button
										class="flex items-center gap-1 text-xs text-primary hover:underline"
										onclick={() => accountBalance.update()}
									>
										<RefreshCwIcon class="h-3 w-3" />
										Retry
									</button>
								</div>
							{/if}

							{#if hasFaucet && $accountBalance.step === 'Loaded' && $accountBalance.value === 0n}
								<FaucetButton />
							{/if}
						</div>

						<a
							href={route('/transactions/')}
							class="{buttonVariants({variant: 'outline'})} justify-between"
						>
							<span>Your Transactions</span>
							{#if transactionCount > 0}
								<Badge variant="secondary" class="ml-2"
									>{transactionCount}</Badge
								>
							{/if}
						</a>
					</div>
				{:else}
					<Drawer.Header class="text-start">
						<Drawer.Title>You are disconnected</Drawer.Title>
					</Drawer.Header>
					<div class="px-4">
						<Button class="w-full" onclick={() => connection.connect()}>
							Connect
						</Button>
					</div>
				{/if}

				<!-- Network Info -->
				<div class="mt-4 flex flex-col gap-2 border-t border-border px-4 pt-4">
					<span class="text-xs tracking-wide text-muted-foreground uppercase"
						>Network</span
					>
					<div
						class="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
					>
						<span class="text-sm text-muted-foreground">Gas Price</span>
						{#if $gasFeeStatus.loading && formattedGasPrice === null}
							<Spinner class="h-4 w-4" />
						{:else if formattedGasPrice !== null}
							<span class="font-medium">{formattedGasPrice} gwei</span>
						{:else if $gasFeeStatus.error}
							<span class="text-sm text-destructive">unavailable</span>
						{:else}
							<span class="text-sm text-muted-foreground">—</span>
						{/if}
					</div>
				</div>

				<!-- Developer Links -->
				<div class="mt-4 flex flex-col gap-2 border-t border-border px-4 pt-4">
					<span class="text-xs tracking-wide text-muted-foreground uppercase"
						>Developer</span
					>
					<a
						href={route('/contracts/')}
						class={buttonVariants({variant: 'outline'})}
					>
						Contracts
					</a>
					<a
						href={route('/explorer/')}
						class={buttonVariants({variant: 'outline'})}
					>
						Explorer
					</a>
				</div>

				<Drawer.Footer class="pt-2">
					<Drawer.Close class={buttonVariants({variant: 'outline'})}
						>Cancel</Drawer.Close
					>
				</Drawer.Footer>
			</Drawer.Content>
		</Drawer.Root>
	</nav>
	{@render colorStrip()}
</header>
