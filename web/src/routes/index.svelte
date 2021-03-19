<script lang="ts">
  import WalletAccess from '../templates/WalletAccess.svelte';
  import NavButton from '../components/navigation/NavButton.svelte';
  import {nftsof} from '../stores/nftsof';
  import {wallet, flow, chain} from '../stores/wallet';

  $: nfts = nftsof($wallet.address);
</script>

<WalletAccess>
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
        class="space-y-12 sm:grid sm:grid-cols-3 sm:gap-x-12 sm:gap-y-20 sm:space-y-0 lg:grid-cols-4 lg:gap-x-16">
        {#each $nfts.tokens as nft, index}
          <li>
            <div id={nft.id} class="space-y-4 p-8">
              <div class="aspect-w-3 aspect-h-2">
                {#if nft.error}
                  Error:
                  {nft.error}
                {:else if nft.image}
                  <img
                    style="image-rendering: pixelated;"
                    class="object-contain h-full w-full"
                    alt={nft.name}
                    src={nft.image} />
                {:else}
                  <p class="">{nft.name}</p>
                {/if}
              </div>
            </div>
          </li>
        {:else}You do not have any Tokens{/each}
      </ul>
    {/if}
  </section>
</WalletAccess>
