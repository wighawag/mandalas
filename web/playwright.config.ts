import {defineConfig, devices} from '@playwright/test';

const PORT = Number(process.env.E2E_PORT || 4173);

export default defineConfig({
	testDir: './e2e/tests',
	// These drive real transactions against a shared local node, so they are
	// not safe to interleave: they assert on totalSupply, which every test
	// moves.
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'list' : [['list'], ['html', {open: 'never'}]],
	timeout: 120_000,
	expect: {timeout: 15_000},
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		trace: 'retain-on-failure',
		video: 'retain-on-failure',
	},
	projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
	webServer: {
		// Serves the build produced by scripts/run-e2e-tests.sh with the same
		// emulator `pnpm serve` uses, so the tests exercise the app the way it is
		// actually delivered (IPFS-style, relative paths). `vite preview` aborts
		// the initial navigation here.
		command: `pnpm exec ipfs-emulator --only -d build -p ${PORT}`,
		port: PORT,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
