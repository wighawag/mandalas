import {writable} from 'svelte/store';

let $warning: string | undefined = undefined;
const modalStore = writable<string | undefined>($warning);

export const warning = {
	subscribe: modalStore.subscribe,
	show(msg: string) {
		$warning = msg;
		modalStore.set($warning);
	},
	hide() {
		$warning = undefined;
		modalStore.set($warning);
	},
};

(globalThis as any).warning = warning;
