import adapter from '@sveltejs/adapter-static';
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import {execSync} from 'child_process';

let VERSION = `timestamp_${Date.now()}`;
try {
	VERSION = execSync('git rev-parse --short HEAD', {
		stdio: ['ignore', 'pipe', 'ignore'],
	})
		.toString()
		.trim();
	try {
		// This command returns empty string if no changes
		const output = execSync('git status --porcelain', {encoding: 'utf8'});
		if (output.trim().length > 0) {
			VERSION += '-dirty';
			console.warn(`[!] repo has some uncommited changes...`);
		}
	} catch (error) {
		console.error('Error checking git status:', error);
		process.exit(1);
	}
} catch (e) {
	console.error(e);
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	compilerOptions: {
		runes: true,
	},
	kit: {
		version: {
			// we create a deterministic building using a deterministic version (via git commit, see above)
			name: VERSION,
		},
		adapter: adapter({
			assets: 'build',
			pages: 'build',
			fallback: '404.html', // SPA fallback - serves as 404 page on IPFS/static hosts
		}),
		serviceWorker: {
			// we handle it ourselves here
			register: false,
		},
		paths: {
			// this is to make it work on ipfs (on an unknown path)
			relative: true,
		},

		output: {
			bundleStrategy: 'split', // code-split per route so the initial
			// bundle is small; a single large file stalls under slow /
			// throttled connections (and 'single' is not required for IPFS
			// since paths.relative is already true).
		},
	},
};

export default config;
