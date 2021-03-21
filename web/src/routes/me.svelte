<script lang="ts">
  import WalletAccess from '../templates/WalletAccess.svelte';
  import NavButton from '../components/navigation/NavButton.svelte';
  import {nftsof} from '../stores/nftsof';
  import {curve} from '../stores/curve';
  import {wallet, flow, chain} from '../stores/wallet';
  import Link from '../lib/routing/curi/Link.svelte';

  $: nfts = nftsof($wallet.address);

  function burn({id}: {id: string}) {
    flow.execute(async (contracts) => {
      await contracts.BitmapToken.burn(id);
    });
  }
</script>

<WalletAccess>
  <div
    class="w-full h-full mx-auto flex justify-between text-black dark:text-white ">
    <p class="m-2 font-black text-xs sm:text-base  text-yellow-400">Current Price: {$curve.currentPrice ? $curve.currentPrice.div("100000000000000").toNumber() / 10000 + ' ETH' : 'loading'}</p>
    <p class="m-2 font-black text-xs sm:text-base  text-yellow-400">Current Supply: {$curve.supply ? $curve.supply.toNumber() : 'loading'}</p>
  </div>

  {#if $nfts.state === 'Ready'}
    {#if $nfts.tokens.length > 0}
      <div class="w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">
        <p class="p-6">Here are your Mandalas. You can burn them to get 95% of the current price. Each time a mandala is burnt, the price decrease. Note that once burnt that same Mandala cannot be re-created.</p>
      </div>
    {:else if $chain.notSupported}}
    <div class="py-8 px-10 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">
      <p class="p-4">Please switch network</p>
          <NavButton
            label="Disonnect"
            on:click={() => wallet.disconnect()}>
            Disonnect
          </NavButton>
    </div>
    {:else if $wallet.state === 'Ready'}
      <div class="w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">
        <p class="p-4">You do not have any Mandala yet.</p>
        <p>get  your  first one <Link name="index" class="underline">here </Link></p>
      </div>
    {/if}
  {/if}
  <section
    class="py-8 px-10 md:w-3/4 w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">
    {#if $wallet.state !== 'Ready'}
      <form class="mt-5 w-full max-w-sm">
        <div class="flex items-center">
          <NavButton
            label="Connect"
            disabled={$wallet.unlocking || $chain.connecting}
            on:click={() => flow.connect()}>
            Connect
          </NavButton>
        </div>
      </form>
    {:else if !$nfts}
      <div>Getting Tokens...</div>
    {:else if $nfts.state === 'Idle'}
      <div>Tokens not loaded</div>
    {:else if $nfts.error}
      <div>Error: {$nfts.error}</div>
    {:else if $nfts.tokens.length === 0 && $nfts.state === 'Loading'}
      <div>Loading Your Tokens...</div>
    {:else}
      <ul
        class="grid grid-cols-2 sm:grid-cols-3 sm:gap-x-12 sm:gap-y-20 sm:space-y-0 lg:grid-cols-4 lg:gap-x-16">
        {#each $nfts.tokens as nft, index}
          <li>
            <div id={nft.id} class="space-y-4 p-8 cursor-pointer"
            on:click={() => burn(nft) }>
              <div class="aspect-w-3 aspect-h-2">
                {#if nft.error}
                  Error:
                  {nft.error}
                {:else if nft.image}
                  <img
                  style={`image-rendering: pixelated; ${ $nfts.burning[nft.id] ? 'filter: grayscale(100%);' : ''}`}
                    class="object-contain h-full w-full"
                    alt={nft.name}
                    src={nft.image} />
                {:else}
                  <p class="">{nft.name}</p>
                {/if}
              </div>
            {#if nft.image}
              <div class={ $nfts.burning[nft.id] ? 'hidden' : ''}>
                <div class="mt-2 flex">
                  <div class="w-0 flex-1 flex">
                    <button
                      class="relative w-0 flex-1 inline-flex items-center
                        justify-center pb-4 text-sm text-gray-700 dark:text-gray-300 font-medium
                        border border-transparent rounded-br-lg
                        hover:text-gray-500">
                      <svg
                        class="w-6 h-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
                      </svg>
                      <span class="ml-3">Burn It</span>
                    </button>
                  </div>
                </div>
              </div>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</WalletAccess>
