<script lang="ts">
	import {url} from '$lib/core/utils/web/path';
	import {page} from '$app/state';

	type LinkInfo = {href: string; title: string};

	interface Props {
		links: LinkInfo[];
	}
	let {links}: Props = $props();

	import NavLink from './NavLink.svelte';

	// `links` carry LOGICAL paths ('/about/'); url() resolves them only when
	// rendering the href. Previously the layout passed already-resolved hrefs
	// and this re-resolved them, which under paths.relative:true meant calling
	// resolve('../') - SvelteKit 2.70 rejects that outright.
	//
	// Compare on route.id rather than url.pathname: it is base-path
	// independent, so it still matches when served from an unknown prefix
	// (an IPFS gateway), which a pathname comparison would not.
	function normalize(p: string): string {
		return p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p;
	}

	function isActive(href: string): boolean {
		return normalize(page.route.id ?? '') === normalize(href);
	}
</script>

<div
	class="absolute z-40 -m-1 h-1 w-full"
	style={`background: url(${url(`/images/multicolor_line_x8.png`)});`}
></div>

<ul class="m-1 flex">
	{#each links as link}
		<NavLink href={url(link.href)} active={isActive(link.href)}>
			{link.title}
		</NavLink>
	{/each}
</ul>

<div
	class="absolute z-40 -m-1 h-1 w-full"
	style={`background: url(${url(`/images/multicolor_line_x8.png`)});`}
></div>
