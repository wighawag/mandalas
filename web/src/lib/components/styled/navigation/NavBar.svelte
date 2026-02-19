<script lang="ts">
	import {isSameRoute, url} from '$lib/core/utils/web/path';
	import {page} from '$app/state';

	type LinkInfo = {href: string; title: string};

	interface Props {
		links: LinkInfo[];
	}
	let {links}: Props = $props();

	import NavLink from './NavLink.svelte';

	function isActive(href: string): boolean {
		return isSameRoute(page.url.pathname, href);
	}
</script>

<div
	class="absolute z-40 -m-1 h-1 w-full"
	style={`background: url(${url(`/images/multicolor_line_x8.png`)});`}
></div>

<ul class="m-1 flex">
	{#each links as link}
		<NavLink href={link.href} active={isActive(link.href)}>
			{link.title}
		</NavLink>
	{/each}
</ul>

<div
	class="absolute z-40 -m-1 h-1 w-full"
	style={`background: url(${url(`/images/multicolor_line_x8.png`)});`}
></div>
