import {defineConfig} from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import {sveltekit} from '@sveltejs/kit/vite';
import {hookup} from 'named-logs-console';

hookup();

const plugins = [
	devtoolsJson({uuid: '612d0dc7-ecc1-4ebd-8daf-7201d2a8a133'}),
	tailwindcss(),
	sveltekit(),
];

export default defineConfig({
	plugins,
	build: {
		emptyOutDir: true,
		minify: true, // shrink chunks so large files don't stall on slow /
		// throttled connections (an unminified single bundle hung under
		// Chrome's request-level throttling)
		sourcemap: true,
	},
	worker: {
		format: 'es',
	},
});
