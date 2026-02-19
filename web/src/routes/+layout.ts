import {dev} from '$app/environment';
import {serviceWorker} from '$lib/core/config';
import {onDocumentLoaded} from '$lib/core/utils/web/hooks.js';
import {get} from 'svelte/store';

export const prerender = true;
export const trailingSlash = 'always';
export const ssr = true;

if (!dev) {
	// TODO add option to enable it in dev
	onDocumentLoaded(serviceWorker.register);
} else {
	console.warn(
		`skipping service-worker registration in dev mode, see src/routes/+layout.ts`,
	);
}

(globalThis as any).get = get;
