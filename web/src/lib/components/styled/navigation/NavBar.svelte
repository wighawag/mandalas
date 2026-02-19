<script lang="ts">
	type LinkInfo = {href: string; title: string};

	interface Props {
		links: LinkInfo[];
	}
	let {links}: Props = $props();

	import NavLink from './NavLink.svelte';
	import {page} from '$app/stores';
	import {base} from '$app/paths';

	console.log({base});

	function isActive(href: string): boolean {
		const currentPath = $page.url.pathname;
		// Normalize paths - remove trailing slashes for comparison
		const normalizedHref = href.replace(/^\/+|\/+$/g, '');
		const normalizedCurrent = currentPath.replace(/^\/+|\/+$/g, '');
		return (
			normalizedCurrent === normalizedHref ||
			normalizedCurrent.startsWith(normalizedHref + '/')
		);
	}
</script>

<div
	class="absolute z-40 -m-1 h-1 w-full"
	style={`background: url(${base}/images/multicolor_line_x8.png);`}
/>

<ul class="m-1 flex">
	{#each links as link}
		<NavLink href={link.href} active={isActive(link.href)}>
			{link.title}
		</NavLink>
	{/each}
</ul>

<div
	class="absolute z-40 -m-1 h-1 w-full"
	style={`background: url(${base}/images/multicolor_line_x8.png);`}
/>
