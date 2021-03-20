<script lang="ts">
  export let name: string;
  export let params: any = {};
  export let partial: boolean = false;

  import Link from '../../lib/routing/curi/Link.svelte';
  import {getRouter, getResponse} from '@curi/svelte';
  import {active as activeInteraction} from '@curi/interactions';

  let router = getRouter();
  let response = getResponse();

  let active: boolean;
  $: route = router.route(name);
  $: active =
    $response && activeInteraction(route, $response, {params, partial});

  const base: string = window.basepath || '/';
</script>

{#if active}
  <li class="">
    <!-- <div class="w-full h-1 mt-1" style={`background: url(${base}images/multicolor_line_x8.png);`}></div> -->
    <div class="w-full h-1 mb-1"></div>
    <Link
      class="text-xs sm:text-base inline-block py-2 px-4 mr-3 font-semibold border-b-2 bg-white dark:bg-black dark:text-white text-black"
      {name}
      {params}>
      <slot />
    </Link>
    <div class="w-full h-1 mb-1"></div>
    <!-- <div class="w-full h-1 mb-1" style={`background: url(${base}images/multicolor_line_x8.png);`}></div> -->
  </li>
{:else}
  <li>
    <div class="w-full h-1 mb-1"></div>
    <Link
      class="text-xs sm:text-base inline-block py-2 px-4 mr-3 font-semibold bg-white dark:bg-black dark:text-white text-black"
      {name}
      {params}>
      <slot />
    </Link>
    <div class="w-full h-1 mb-1"></div>
  </li>
{/if}
