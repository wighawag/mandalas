<script lang="ts">
  export let active: boolean = false;
  export let name: string; // TODO rename to href
  export let params: any = {}; // TODO remove
  export let hash: string | undefined = undefined; // TOOD remove
  export let partial: boolean = false;

  // import {page} from '$app/stores';
</script>

{#if active}
  <li class="">
    <!-- <div class="w-full h-1 mt-1" style={`background: url(${base}images/multicolor_line_x8.png);`}></div> -->
    <div class="w-full h-1 mb-1" />
    <a
      class="text-xs sm:text-base inline-block py-2 px-4 mr-3 font-semibold border-b-2 bg-white dark:bg-black dark:text-white text-black"
      href={name}
      {params}
      {hash}>
      <slot />
    </a>
    <div class="w-full h-1 mb-1" />
    <!-- <div class="w-full h-1 mb-1" style={`background: url(${base}images/multicolor_line_x8.png);`}></div> -->
  </li>
{:else}
  <li>
    <div class="w-full h-1 mb-1" />
    <a
      class="text-xs sm:text-base inline-block py-2 px-4 mr-3 font-semibold bg-white dark:bg-black dark:text-white text-black"
      href={name}
      {params}
      {hash}>
      <slot />
    </a>
    <div class="w-full h-1 mb-1" />
  </li>
{/if}
