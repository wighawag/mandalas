import {defineConfig, devices} from '@playwright/test';
import {PLAIN_PORT, SW_GATEWAY_PORT} from './e2e/ports';

const PORT = Number(process.env.E2E_PORT || 4173);

export default defineConfig({
	testDir: './e2e/tests',
	// BOTH suffixes, explicitly. This repo's own tests are `*.spec.ts`, which
	// Playwright's default testMatch happens to cover, but the service worker
	// gateway suite inherited from the template is `*.e2e.ts` (the convention
	// upstream and in jolly-roger/bleeps) and the default silently does NOT match
	// it. Without this the inherited test is present, collected by nothing, and
	// reports green while never running.
	testMatch: ['**/*.spec.ts', '**/*.e2e.ts'],
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

		// EVERY ACTION GETS AN END, because Playwright's default is that none of
		// them do (`actionTimeout: 0`). An action waits for its element to be
		// actionable, so a `click` on a locator that matches NOTHING - a button that
		// closed between the check and the click, a row that went stale - does not
		// fail, it waits for the element to appear, forever.
		//
		// The cost of that is not the lost action, it is where the failure lands: a
		// helper that owns a deadline never gets back to it, no diagnostic it was
		// written to print can run, and the test dies on the 120s timeout above
		// pointing at whatever line happened to be executing. That is what the
		// sign-in click in e2e/fixtures/stalling-wallet.ts did upstream, and it cost
		// an afternoon of blaming the hardhat node.
		//
		// A BACKSTOP, NOT THE FIX. Every click in that loop is bounded at its own
		// call site, because the right timeout there is a few seconds and this is
		// thirty. What this buys is that the NEXT unbounded action fails at its own
		// line instead of as an unexplained test timeout.
		//
		// Well above anything a working app needs, and it does not govern `expect`
		// (which has its own timeout, and is where the long deliberate waits in this
		// suite live). So it changes no passing test: it only converts a hang into a
		// failure that names itself.
		actionTimeout: 30_000,
	},
	projects: [{name: 'chromium', use: {...devices['Desktop Chrome']}}],
	// An ARRAY: this repo's own server, plus the two `ipfs-gateway-emulator`
	// servers the inherited service worker gateway suite
	// (e2e/tests/service-worker-gateway.e2e.ts) navigates to. Ports come from
	// e2e/ports.ts so they cannot collide with PORT above.
	webServer: [
		{
			// Serves the build produced by scripts/run-e2e-tests.sh with the same
			// emulator `pnpm serve` uses, so the tests exercise the app the way it is
			// actually delivered (IPFS-style, relative paths). `vite preview` aborts
			// the initial navigation here.
			command: `pnpm exec ipfs-emulator --only -d build -p ${PORT}`,
			port: PORT,
			reuseExistingServer: !process.env.CI,
			timeout: 60_000,
		},
		{
			command: `pnpm exec ipfs-emulator --only root -d build -p ${PLAIN_PORT}`,
			port: PLAIN_PORT,
			reuseExistingServer: false,
			stdout: 'ignore',
		},
		{
			command: `pnpm exec ipfs-emulator --gateway sw -d build -p ${SW_GATEWAY_PORT}`,
			port: SW_GATEWAY_PORT,
			reuseExistingServer: false,
			stdout: 'ignore',
		},
	],
});
