<script lang="ts">
	import type {Snippet} from 'svelte';

	interface Props {
		active?: boolean;
		href: string;
		children?: Snippet;
	}
	let {active = false, href, children}: Props = $props();

	// import {page} from '$app/stores';
</script>

{#if active}
	<li class="">
		<!-- <div class="w-full h-1 mt-1" style={`background: url(${base}/images/multicolor_line_x8.png);`}></div> -->
		<div class="mb-1 h-1 w-full" />
		<a
			class="mr-3 inline-block border-b-2 bg-white px-4 py-2 text-xs font-semibold text-black sm:text-base dark:bg-black dark:text-white"
			{href}
		>
			{@render children?.()}
		</a>
		<div class="mb-1 h-1 w-full" />
		<!-- <div class="w-full h-1 mb-1" style={`background: url(${base}/images/multicolor_line_x8.png);`}></div> -->
	</li>
{:else}
	<li>
		<div class="mb-1 h-1 w-full" />
		<a
			class="mr-3 inline-block bg-white px-4 py-2 text-xs font-semibold text-black sm:text-base dark:bg-black dark:text-white"
			{href}
		>
			{@render children?.()}
		</a>
		<div class="mb-1 h-1 w-full" />
	</li>
{/if}
