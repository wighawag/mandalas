<script lang="ts">
	import {Dialog, Separator} from 'bits-ui';
	import {type Snippet} from 'svelte';

	interface Props {
		openWhen: boolean;
		onCancel?: () => void;
		children?: Snippet;
		title?: Snippet;
		elementToFocus?: HTMLElement;
	}

	let {
		openWhen,
		onCancel,
		children,
		title,
		elementToFocus,
		...restProps
	}: Props = $props();

	const overlayCoreClass = `z-[999] fixed inset-0`;
	const contentCoreClass =
		'z-[999] fixed top-[50%] left-[50%] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] p-5 sm:max-w-[490px]';

	let focusedElementWhenOpened: HTMLElement | null = null;
	function onOpenAutoFocus(e: Event) {
		focusedElementWhenOpened = document.querySelector(':focus-visible');
		if (elementToFocus) {
			elementToFocus.focus();
			e.preventDefault();
		}
	}
	function onCloseAutoFocus(e: Event) {
		e.preventDefault();
		focusedElementWhenOpened?.focus();
	}

	function onInteractOutside(e: Event) {
		e.preventDefault();
		onCancel?.();
	}
	function onEscapeKeydown(e: Event) {
		e.preventDefault();
		onCancel?.();
	}
</script>

<Dialog.Root
	open={openWhen}
	onOpenChange={(open) => {
		// console.log('onOpenChange', open);
		if (!open) {
			onCancel?.();
		}
	}}
	{...restProps}
>
	<Dialog.Portal>
		<Dialog.Overlay
			class={`${overlayCoreClass} data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 bg-black/80`}
		/>
		<Dialog.Content
			class={`${contentCoreClass} rounded-card-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 border bg-black p-5 outline-hidden`}
			interactOutsideBehavior={onCancel ? 'close' : 'ignore'}
			{onInteractOutside}
			escapeKeydownBehavior={onCancel ? 'close' : 'ignore'}
			{onEscapeKeydown}
			{onOpenAutoFocus}
			{onCloseAutoFocus}
		>
			{#if title}
				<Dialog.Title
					class="| flex w-full items-center justify-center text-lg font-semibold tracking-tight"
				>
					{@render title()}
				</Dialog.Title>
				<Separator.Root class="| -mx-5 mt-5 mb-6 block h-px bg-gray-200" />
			{/if}

			<!-- Add a wrapper for spacing between mechanism and wallet options -->
			<div class="flex flex-col space-y-6">
				{@render children?.()}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
