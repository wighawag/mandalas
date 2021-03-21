<script lang="ts">
  import {keccak256} from '@ethersproject/solidity';
  import {arrayify} from '@ethersproject/bytes';
  import WalletAccess from '../templates/WalletAccess.svelte';
  import {randomTokens} from '../stores/randomTokens';
  import {curve} from '../stores/curve';
  import {wallet, flow} from '../stores/wallet';
  import {BigNumber} from '@ethersproject/bignumber';
  import {Wallet} from '@ethersproject/wallet';
  import Link from '../lib/routing/curi/Link.svelte';
  import contractsInfo from '../contracts.json';
  import {parseEther} from '@ethersproject/units';
  import purchaseFlow from '../stores/purchaseFlow';
  import Modal from '../components/Modal.svelte';
  import {computeBuffer} from '../utils';

  const initialPrice = BigNumber.from(contractsInfo.contracts.BitmapToken.linkedData.initialPrice);
  const creatorCutPer10000th = contractsInfo.contracts.BitmapToken.linkedData.creatorCutPer10000th;
  const coefficient = BigNumber.from(contractsInfo.contracts.BitmapToken.linkedData.linearCoefficient);

  function format(bn : BigNumber, numDecimals: number): number {
    const precision = Math.pow(10, numDecimals);
    const base = BigNumber.from("1000000000000000000").div(precision);
    return bn.div(base).toNumber() / precision;
  }

  let nfts = randomTokens;
  nfts.generate(32);

  function mint(nft: {id: string, privateKey: string}) {
    purchaseFlow.mint(nft);
  }

  window.onscroll = function() {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - window.innerHeight / 3) {
        nfts.loadMore(32);
    }
};
</script>

<WalletAccess>
  <div
    class="w-full h-full mx-auto flex justify-between text-black dark:text-white ">
    <p class="m-2 text-xs md:text-base font-black text-yellow-400">Current Price: {$curve.currentPrice ? format($curve.currentPrice, 4) + ' ETH' : 'loading'}</p>
    <p class="m-2 text-xs md:text-base font-black text-yellow-400">Current Supply: {$curve.supply ? $curve.supply.toNumber() : 'loading'}</p>
  </div>
  <div
    class="w-full h-full mx-auto flex justify-between text-black dark:text-white ">
    <!-- <p class="m-2 text-xs md:text-base font-black text-yellow-400">+ Refunded Buffer: {($curve.supply && $curve.currentPrice) ? format(computeBuffer($curve.supply, $curve.currentPrice),4) + ' ETH' : 'loading'}</p> -->
    <button class="m-2 text-xs md:text-base font-black text-yellow-400 border border-yellow-500 p-1" on:click={() => nfts.reset()}>reset batch</button>
  </div>
  <div class="w-full h-full text-xs text-center md:text-base mx-auto flex flex-col items-center justify-center text-black dark:text-white ">
    <p class="px-4 pt-4">There are millions of millions of Mandalas, all unique. Pick the one you like :)</p>
    <p class="px-4 pb-1">Their price run on a bounding curve. So as more people collect them, the more they get expensive. And you can burn them to get most of the price back. More details <Link name="about" class="underline">here</Link>.</p>
  </div>
  <div
    class="w-full h-full mx-auto flex items-center justify-center text-black dark:text-white ">
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
              class="p-8 cursor-pointer"
              on:click={() => mint(nft) }>
              <div class="aspect-w-3 aspect-h-2">
                {#if nft.error}
                  Error:
                  {nft.error}
                {:else if nft.image}
                  <img
                    style={`image-rendering: pixelated; ${ nft.minted ? 'filter: grayscale(100%);' : ''}`}
                    class="object-contain h-full w-full"
                    alt={nft.name}
                    src={nft.image} />
                {:else}
                  <p class="">{nft.name}</p>
                {/if}
              </div>
              {#if nft.image}
              <div class={nft.minted ? 'hidden' : ''}>
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
                        <span class="text-xs md:text-base ml-3">Mint It</span>

                    </button>
                  </div>
                </div>
              </div>
              {/if}
            </div>
          </li>
        {:else}Error: No Bitmap could be generated{/each}
      </ul>
    {/if}
  </section>
</WalletAccess>


{#if $purchaseFlow.step !== 'IDLE' && $purchaseFlow.step !== 'SUCCESS'}

  {#if $purchaseFlow.step !== 'CONFIRM'}
    <!-- Taken care by WalletAccess -->
  {:else}
    <Modal on:close={() => purchaseFlow.cancel()}>
        {#if !$purchaseFlow.data}
        Error
        {:else}
        <div class="text-center">
          <h2>
            Mint for {format($purchaseFlow.data.currentPrice, 4)} ETH
          </h2>
          <p class="text-gray-300 mt-2 text-sm">
            We added a buffer of {format(computeBuffer($purchaseFlow.data.supply, $purchaseFlow.data.currentPrice), 4)} ETH to cover the case someone else  is minting at the same time. You'll be refunded if that does not happen.
          </p>
          <button
            class="mt-5 p-1 border border-yellow-500"
            label="Mint"
            on:click={() => purchaseFlow.confirm()}>
            Confirm
          </button>
        </div>
        {/if}
    </Modal>
  {/if}
{/if}
