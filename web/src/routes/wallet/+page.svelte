<script lang="ts">
	import {onMount} from 'svelte';
	import {generateBitmapDataURI, template19_bis} from 'mandalas-common';
	import {getAppContext, route} from '$lib';
	import {goto} from '$app/navigation';
	import {url} from '$lib/core/utils/web/path';
	import {createCopyToClipboard} from '$lib/core/ui/clipboard/copy-to-clipboard';
	import CurveBar from '$lib/ui/curve/CurveBar.svelte';
	import Button from '$lib/shadcn/ui/button/button.svelte';
	import {toast} from 'svelte-sonner';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import {burnMandala} from './lib/burn';

	// Per-card "copied?" flag. `createCopyToClipboard` returns a store, but
	// Svelte 5 only auto-subscribes to stores declared at the component's top
	// level; using `$store` inside the each-block is a compile error, and
	// subscribing imperatively from a reactive context is a runtime
	// `state_unsafe_mutation`. So we delay both the subscribe and the state
	// write until the user actually clicks Copy on a card. The first click
	// creates the store, subscribes, and starts mirroring its boolean into
	// the per-id $state; the template then re-renders for that card.
	const copyById = new Map<string, ReturnType<typeof createCopyToClipboard>>();
	let copied = $state<Record<string, boolean>>({});

	function copyStoreFor(id: string) {
		let s = copyById.get(id);
		if (!s) {
			s = createCopyToClipboard();
			copyById.set(id, s);
			// We never unsubscribe: the page is single-shot and the closure
			// just holds a single id-keyed assignment, so the only "leak" is
			// the timer inside the store itself (already managed by
			// createCopyToClipboard).
			s.subscribe((v) => (copied = {...copied, [id]: v}));
		}
		return s;
	}

	async function copyId(id: string) {
		// Click handler, not a reactive context: safe to (lazily) create the
		// store and write $state here.
		await copyStoreFor(id).copy(id);
	}

	function openMandala(id: string) {
		const mandalaUrl = route('/mandala/', id);
		if (typeof window !== 'undefined') {
			window.location.href = mandalaUrl;
		}
	}

	const {
		connection,
		accountExecutor,
		deployments,
		balanceCheck,
		accountBalance,
		nftsOf,
		accountCannotSend,
	} = getAppContext();

	let addressFromURI = $state<string | undefined>(undefined);

	onMount(() => {
		if (typeof window !== 'undefined' && window.location.hash) {
			addressFromURI = window.location.hash.substring(1);
		}
	});

	let currentAddress = $derived(
		connection.isTargetStepReached($connection)
			? $connection.account.address
			: undefined,
	);

	$effect(() => {
		if (!addressFromURI && currentAddress) {
			goto(url(`/wallet/`, `${currentAddress}`), {replaceState: true}).then(
				() => {
					addressFromURI =
						typeof location !== 'undefined'
							? location.hash.substring(1)
							: undefined;
				},
			);
		}
	});

	let addressToLook = $derived(addressFromURI || currentAddress);

	let isWalletOwner = $derived(
		!!currentAddress &&
			!!addressToLook &&
			currentAddress.toLowerCase() === addressToLook.toLowerCase(),
	);

	let nfts = $derived(nftsOf(addressToLook));
	// Loading / error live on the polling store's status, next to the value.
	let nftsStatus = $derived(nfts.status);

	async function burn(tokenID: bigint) {
		const result = await burnMandala(
			{
				connection,
				accountExecutor,
				deployments,
				balanceCheck,
				accountBalance,
			},
			tokenID,
		);
		if (result.status === 'submitted') {
			toast.success('Burn submitted');
		} else if (result.status === 'cannot-send') {
			accountCannotSend.show();
		} else if (result.status === 'error') {
			toast.error(result.message);
		}
	}
</script>

<div class="w-full">
	<CurveBar />

	{#if !addressToLook}
		<div class="mx-auto h-full w-full flex-col text-center">
			<p class="mt-4 text-xs font-black text-yellow-400 sm:text-base">
				Connect your wallet to see your Mandalas
			</p>
			<Button class="m-2" onclick={() => connection.connect()}>Connect</Button>
		</div>
	{:else if currentAddress && !isWalletOwner}
		<div class="mx-auto flex h-full w-full justify-between">
			<a href={`#/`.concat(currentAddress)} class="m-2">
				<Button variant="outline" size="sm">Show My Mandalas</Button>
			</a>
		</div>
	{/if}

	{#if $nfts.step === 'Loaded'}
		{#if $nfts.tokens.length > 0}
			<div class="prose-mandala py-6 text-center">
				{#if isWalletOwner}
					<p>
						Here are your Mandalas. You can burn them to get 95% of the current
						price. Each time a Mandala is burnt the price decreases. Note that
						once burnt, that same Mandala cannot be re-created.
					</p>
				{:else}
					<!-- A 42-character address is unbreakable enough to overflow a
					     narrow viewport; monospace + break-all keeps it contained. -->
					<p>
						Here are the Mandalas for wallet
						<span class="font-mono break-all">{addressToLook}</span>.
					</p>
				{/if}
			</div>
		{:else if addressToLook}
			<div class="prose-mandala space-y-2 py-6 text-center">
				{#if isWalletOwner}
					<p>You do not have any Mandala yet.</p>
					<p>Get your first one <a href={route('/')}>here</a>.</p>
				{:else}
					<p>
						No Mandala for
						<span class="font-mono break-all">{addressToLook}</span>
					</p>
				{/if}
			</div>
		{/if}
	{/if}

	<section
		class="mx-auto flex h-full w-full flex-col items-center justify-center px-10 py-8 md:w-3/4"
	>
		{#if $nftsStatus.error && $nfts.step !== 'Loaded'}
			<div class="text-destructive">Error: {$nftsStatus.error.message}</div>
		{:else if $nfts.step !== 'Loaded'}
			{#if $nftsStatus.loading}
				<div>Loading Your Tokens...</div>
			{:else}
				<div>Tokens not loaded</div>
			{/if}
		{:else}
			<ul
				class="grid grid-cols-2 sm:grid-cols-3 sm:space-y-0 sm:gap-x-12 sm:gap-y-20 lg:grid-cols-4 lg:gap-x-16"
			>
				{#each $nfts.tokens as nft (nft.id.toString())}
					<li>
						<div id={nft.id.toString()} class="space-y-4 p-8">
							<div class="aspect-w-3 aspect-h-2">
								{#if nft.error}
									Error: {nft.error}
								{:else if nft.image}
									<img
										style="image-rendering: pixelated;"
										class="h-full w-full object-contain"
										alt={nft.name}
										src={generateBitmapDataURI(
											nft.id.toString(),
											template19_bis,
										)}
									/>
								{:else}
									<p>{nft.name}</p>
								{/if}
							</div>
							{#if nft.image}
								<div class="mt-2 flex items-center justify-end gap-1">
									<button
										type="button"
										title={`Open ${nft.id.toString()} on its own page`}
										aria-label="Open this Mandala on its own page"
										onclick={() => openMandala(nft.id.toString())}
										class="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									>
										<ExternalLinkIcon class="size-4" />
									</button>
									<button
										type="button"
										title={`Copy id ${nft.id.toString()}`}
										aria-label="Copy token id"
										onclick={() => copyId(nft.id.toString())}
										class="inline-flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									>
										{#if copied[nft.id.toString()]}
											<CheckIcon class="size-4 text-green-500" />
										{:else}
											<CopyIcon class="size-4" />
										{/if}
									</button>
								</div>
							{/if}
							{#if nft.image && isWalletOwner}
								<div class="mt-2 flex">
									<button
										onclick={() => burn(nft.id)}
										class="relative inline-flex w-0 flex-1 items-center justify-center rounded-br-lg border border-transparent pb-4 text-sm font-medium text-muted-foreground hover:text-foreground"
									>
										<FlameIcon class="h-6 w-6" />
										<span class="ml-3">Burn It</span>
									</button>
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
