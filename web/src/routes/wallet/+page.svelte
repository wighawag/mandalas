<script lang="ts">
	import {onMount} from 'svelte';
	import {generateBitmapDataURI, template19_bis} from 'mandalas-common';
	import {getAppContext, route} from '$lib';
	import {goto} from '$app/navigation';
	import {url} from '$lib/core/utils/web/path';
	import {formatBalance} from '$lib/core/utils/format/balance';
	import {PRICE_SYMBOLS} from '$lib/view';
	import Button from '$lib/shadcn/ui/button/button.svelte';
	import {toast} from 'svelte-sonner';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import {burnMandala} from './lib/burn';

	const {
		connection,
		executor,
		deployments,
		balanceCheck,
		nftsOf,
		viewState,
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

	let symbol = $derived($deployments.chain.nativeCurrency.symbol);

	async function burn(tokenID: bigint) {
		const result = await burnMandala(
			{connection, executor, deployments, balanceCheck},
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
	{#if $viewState.step === 'Loaded'}
		<div class="mx-auto flex h-full w-full justify-between">
			<p class="m-2 text-xs font-black text-yellow-400 sm:text-base">
				Current Price: {formatBalance(
					$viewState.curve.currentPrice,
					18,
					PRICE_SYMBOLS,
				)}
				{symbol}
			</p>
			<p class="m-2 text-xs font-black text-yellow-400 sm:text-base">
				Current Supply: {$viewState.curve.supply}
			</p>
		</div>
	{/if}

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
			<div
				class="mx-auto flex h-full w-full flex-col items-center justify-center"
			>
				<p class="p-6 text-center">
					{#if isWalletOwner}
						Here are your Mandalas. You can burn them to get 95% of the current
						price. Each time a Mandala is burnt the price decreases. Note that
						once burnt, that same Mandala cannot be re-created.
					{:else}
						Here are the Mandalas for wallet {addressToLook}.
					{/if}
				</p>
			</div>
		{:else if addressToLook}
			<div
				class="mx-auto flex h-full w-full flex-col items-center justify-center"
			>
				{#if isWalletOwner}
					<p class="p-4">You do not have any Mandala yet.</p>
					<p>
						Get your first one <a href={route('/')} class="underline">here</a>.
					</p>
				{:else}
					<p class="p-4">No Mandala for {addressToLook}</p>
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
