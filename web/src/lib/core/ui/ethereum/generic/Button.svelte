<script lang="ts">
	import {Button} from 'bits-ui';
	import clsx from 'clsx/lite';
	let {children, class: extraClass, ...restProps}: Button.RootProps = $props();

	// variants : rounded bg-zinc-700 px-4 py-2 text-zinc-100 transition hover:bg-zinc-600

	let clazz = $derived(
		clsx(
			'bg-primary hover:bg-primary-light rounded-md px-3.5 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
			extraClass,
		),
	);
</script>

<Button.Root {...restProps} class={clazz}>
	{@render children?.()}
</Button.Root>
