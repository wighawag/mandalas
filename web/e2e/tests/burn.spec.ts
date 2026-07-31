import {expect, test, type Page} from '@playwright/test';
import {
	chooseWallet,
	installWallet,
	setRejectTransaction,
	walletCalls,
} from '../fixtures/wallet';
import {balanceOf, totalSupply} from '../fixtures/contract';
import {useChainSnapshot} from '../fixtures/chain';

/**
 * The burn flow.
 *
 * burn() is invoked straight from onclick with nothing awaiting it, so any
 * error it throws becomes an unhandled rejection that the user never sees.
 * That is exactly what happened once @etherplay/connect started rejecting
 * properly: declining the transaction produced
 * "ContractFunctionExecutionError: User rejected the request." on the window
 * and no feedback at all in the UI.
 */

useChainSnapshot();

function trackUnhandled(page: Page) {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	return errors;
}

/** Mint one, so there is something to burn. */
async function mintOne(page: Page) {
	await page.goto('/');
	await page.waitForSelector('img[alt]', {timeout: 60_000});
	// By label, not position: the navbar also has icon-only buttons now.
	await page
		.getByRole('button', {name: /Mint It/})
		.first()
		.click();
	await chooseWallet(page);
	const confirm = page.getByRole('button', {name: 'Confirm'});
	await expect(confirm).toBeVisible({timeout: 20_000});
	await confirm.click();
	await expect.poll(() => balanceOf(), {timeout: 60_000}).toBeGreaterThan(0n);
}

/**
 * `/wallet/` is a fresh page load, so the connection has to be re-established
 * there before anything is burnable: the burn handler is gated on
 * `isWalletOwner`, which is only true once the store reaches 'WalletConnected'.
 */
async function openWallet(page: Page) {
	// In-app navigation on purpose. `page.goto` is a full reload, and the app
	// sets autoConnect: false, so a reload drops the connection and
	// isWalletOwner goes false, leaving nothing burnable.
	await page.getByRole('link', {name: 'Wallet'}).click();
	await expect(page).toHaveURL(/\/wallet\//, {timeout: 15_000});

	const connect = page.getByRole('button', {name: 'Connect'});
	if (await connect.count()) {
		await connect.first().click();
		await chooseWallet(page);
	}
	// The owner-only copy only renders once we are connected AS the owner, so
	// it is a reliable signal that isWalletOwner is true.
	await expect(page.getByText('Here are your Mandalas')).toBeVisible({
		timeout: 30_000,
	});
	await expect(burnButton(page)).toBeVisible({timeout: 30_000});
}

function burnButton(page: Page) {
	return page.getByRole('button', {name: /Burn It/}).first();
}

// NOT YET RELIABLE. Landed as fixme rather than left out, because the harness
// around them works and the diagnosis is written down.
//
// Blocker: chain isolation. useChainSnapshot() calls evm_snapshot/evm_revert
// and neither errors, yet totalSupply keeps climbing across tests (observed
// 12 -> 13 -> 14 in one run), so state is NOT being rolled back. Until that is
// fixed, every totalSupply-based assertion here is untrustworthy and these
// will fail or pass for the wrong reason. Fix isolation first, then re-enable
// and re-diagnose what is left.
test.fixme('declining the burn transaction is silent, not an unhandled error', async ({
	page,
}) => {
	const unhandled = trackUnhandled(page);
	const consoleErrors: string[] = [];
	page.on('console', (m) => {
		if (m.type() === 'error') consoleErrors.push(m.text());
	});

	// Mint with a cooperative wallet first, then start declining, so only the
	// burn is rejected.
	await installWallet(page);
	await mintOne(page);
	const supply = await totalSupply();

	await openWallet(page);
	await setRejectTransaction(page, true);
	await burnButton(page).click();

	// The user declined: nothing should burn, nothing should be thrown at the
	// window, and declining is a choice rather than an error to shout about.
	await expect.poll(() => totalSupply(), {timeout: 15_000}).toBe(supply);
	expect(unhandled).toEqual([]);
	expect(consoleErrors).toEqual([]);

	// and the confirmation dialog must not be left on screen
	await expect(page.getByText('Confirm in your wallet')).toHaveCount(0);
});

// See the note above: same isolation blocker. Also observed the burn click
// not reaching the handler in this context, which needs its own look.
test.fixme('accepting the burn transaction burns the mandala', async ({
	page,
}) => {
	const unhandled = trackUnhandled(page);
	const logs: string[] = [];
	page.on('console', (m) =>
		logs.push(`[${m.type()}] ${m.text().slice(0, 200)}`),
	);
	await installWallet(page);

	await mintOne(page);
	const supply = await totalSupply();

	await openWallet(page);
	await burnButton(page).click();

	try {
		await expect.poll(() => totalSupply(), {timeout: 60_000}).toBe(supply - 1n);
	} finally {
		console.log('--- wallet calls:', JSON.stringify(await walletCalls(page)));
		console.log('--- page errors:', unhandled);
		console.log('--- console:', logs.slice(-12));
	}
	expect(unhandled).toEqual([]);
});
