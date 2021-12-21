<script lang="ts">
  type LinkInfo = {href: string; title: string};
  export let links: LinkInfo[];
  import NavLink from './NavLink.svelte';
  import Loading from '$lib/components/styled/Loading.svelte';
  import {urlOfPath} from '$lib/utils/url';
  import {page, navigating} from '$app/stores';
  import {base} from '$app/paths';

  console.log({base})
</script>

<!-- {JSON.stringify($page, null, '  ')} -->

<!-- {JSON.stringify($navigating, null, '  ')} -->

<div
  class="absolute w-full h-1 -m-1 z-40"
  style={`background: url(${base}/images/multicolor_line_x8.png);`} />

<ul class="flex m-1">
  {#each links as link}
    <NavLink href={link.href} active={urlOfPath(link.href, $page.path)}>
      {link.title}
      <!-- ({link.href}) -->
    </NavLink>
  {/each}
</ul>

<div
  class="absolute w-full h-1 -m-1 z-40"
  style={`background: url(${base}/images/multicolor_line_x8.png);`} />


{#if $navigating}
  <Loading />
{/if}
