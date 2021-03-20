<script lang="ts">
  import {keccak256} from '@ethersproject/solidity';
  import {arrayify} from '@ethersproject/bytes';
  import WalletAccess from '../templates/WalletAccess.svelte';
  import NavButton from '../components/navigation/NavButton.svelte';
  import {randomnnfts} from '../stores/randomNfts';
  import {wallet, flow} from '../stores/wallet';
  import {onMount} from 'svelte';
import { BigNumber } from '@ethersproject/bignumber';

  let nfts = randomnnfts;
  onMount(() => {
    setTimeout(() => {
      nfts.generate();
    }, 200);
  });


  function mint(index: number) {
    const account = nfts.accountAt(index);

    flow.execute(async (contracts) => {
      const hashedData = keccak256(
        ['string', 'address'],
        ['Bitmap', wallet.address]
      );
      const signature = await account.signMessage(arrayify(hashedData));
      const buffer = BigNumber.from("1000000000000000000"); // TODO
      if (!$randomnnfts.currentPrice) {
        throw new Error(`no currentPrice available`);
      }
      await contracts.BitmapToken.mint(wallet.address, signature, {value: $randomnnfts.currentPrice.add(buffer) });
    });
  }
</script>

<WalletAccess>
  <div
    class="w-full h-full mx-auto flex flex-col items-center justify-center text-black dark:text-white ">
    <p>Current Price: {$randomnnfts.currentPrice ? $randomnnfts.currentPrice.div("100000000000000").toNumber() / 10000 + ' ETH' : 'loading'}</p>
    <p>Current Supply: {$randomnnfts.supply ? $randomnnfts.supply.toNumber() : 'loading'}</p>
  </div>
  <div
    class="w-full h-full mx-auto flex items-center justify-center text-black dark:text-white ">

    <form class="mt-5 w-full max-w-sm">
      <div class="flex items-center">
        <NavButton
          label="Previous"
          class="mr-4"
          disabled={$randomnnfts.startIndex === 0}
          on:click={() => randomnnfts.newPage(-12)}>
          Previous
        </NavButton>
        <NavButton
          label="More"
          class="ml-4"
          on:click={() => randomnnfts.newPage(12)}>
          More...
        </NavButton>
      </div>
    </form>
  </div>

  <section
    class="py-8 px-4 w-full h-full mx-auto flex items-center justify-center text-black dark:text-white ">
    {#if !$nfts}
      <div>Generating Bitmaps...</div>
    {:else if $nfts.state === 'Idle'}
      <div>Bitmaps not loaded</div>
    {:else if $nfts.error}
      <div>Error: {$nfts.error}</div>
    {:else if $nfts.tokens.length === 0 && $nfts.state === 'Loading'}
      <div>Loading Bitmaps...</div>
    {:else}
      <ul
        class="grid-cols-2 grid sm:grid-cols-4 sm:gap-x-6 sm:gap-y-12 sm:space-y-0 lg:grid-cols-6 lg:gap-x-8">
        {#each $nfts.tokens as nft, index}
          <li>
            <div
              id={nft.id}
              class=" p-8 cursor-pointer"
              on:click={() => {if (nft.image) {mint(index)}} }>
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
              {#if nft.image}
              <div>
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
                      <span class="ml-3">Mint It</span>
                    </button>
                  </div>
                </div>
              </div>
              {/if}
              <!-- <div class="space-y-2">
                  <div class="text-lg leading-6 font-medium space-y-1">
                    <h3>Lindsay Walton</h3>
                    <p class="text-indigo-600">Front-end Developer</p>
                    <button
                      disabled={nft.minted}
                      on:click={() => mint(index)}>mint</button>
                    <button on:click={() => copyPrivateKey(index)}>copy private
                      key</button>
                  </div>
                </div> -->
            </div>
          </li>
        {:else}Error: No Bitmap could be generated{/each}
      </ul>
    {/if}
  </section>

  {#if $nfts && $nfts.tokens && $nfts.tokens.length}
    <div
      class="w-full h-full mx-auto flex items-center justify-center text-black dark:text-white ">
      <form class="m-5 w-full max-w-sm">
        <div class="flex items-center">
          <NavButton
            label="Previous"
            class="mr-4"
            disabled={$randomnnfts.startIndex === 0}
            on:click={() => randomnnfts.newPage(-12)}>
            Previous
          </NavButton>
          <NavButton
            label="More"
            class="ml-4"
            on:click={() => randomnnfts.newPage(12)}>
            More...
          </NavButton>
        </div>
      </form>
    </div>
  {/if}
</WalletAccess>
