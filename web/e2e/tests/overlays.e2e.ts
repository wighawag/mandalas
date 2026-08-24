import {test, expect, type Page} from '@playwright/test';
import {installWallet} from '../fixtures/wallet';

/**
 * View overlays, the layer scale, and the one guarantee that is not expressible
 * as a declaration order.
 *
 * WRITTEN FOR THIS REPO rather than inherited. The template's version of this
 * suite is built on its own `e2e/fixtures/test.ts`, which Mandalas replaced long
 * ago with an injected wallet of its own, and it drives a greeting demo this app
 * does not have. So it has never run here, and the modal-stacking fix that
 * prompted it was verified everywhere except the app it was reported against.
 * These are the same assertions on this app's own fixtures.
 *
 * See ADR-0004 (`work` branch) for the two kinds of overlay, and the layer block
 * in app.css for what covers what.
 */

/** The navbar drawer: a PROMPT overlay, and the only one in the drawer layer. */
const drawerOf = (page: Page) =>
	page.locator('#--layer-drawer [role="dialog"]');
/** A VIEW overlay: the app asking or showing something because the user acted. */
const modalOf = (page: Page) => page.locator('#--layer-modals [role="dialog"]');
/**
 * A SYSTEM overlay: visibility derived from domain state, so it lives one layer
 * up and covers both the drawer and any view modal. Naming the layer is half the
 * assertion: a system modal that quietly moved back down would still be visible,
 * and would still be the bug.
 */
const systemModalOf = (page: Page) =>
	page.locator('#--layer-system [role="dialog"]');

/**
 * The navbar is prerendered, so the button exists before the app can answer it:
 * a click during hydration is swallowed and the drawer never opens. Retry until
 * it takes.
 */
async function openDrawer(page: Page) {
	await expect(async () => {
		await page.getByLabel('Open menu').click();
		await expect(drawerOf(page)).toBeVisible({timeout: 2000});
	}).toPass({timeout: 30_000});
}

test.describe('View overlays and navigation', () => {
	test('the overlay layers are declared, applied, and ordered', async ({
		page,
	}) => {
		await page.goto('/');

		const layers = await page.evaluate(() =>
			[...document.querySelectorAll('[data-layer]')].map((el) => ({
				layer: (el as HTMLElement).dataset.layer,
				z: Number(getComputedStyle(el).zIndex),
				position: getComputedStyle(el).position,
			})),
		);

		// Assert the intent, not the numbers: what matters is that a system modal
		// covers an ordinary one, which covers a toast, which covers the drawer.
		expect(layers.map((l) => l.layer)).toEqual([
			'drawer',
			'notice',
			'toast',
			'modal',
			'system',
			'popover',
			'progress',
		]);

		for (const layer of layers) {
			// `position: relative` plus a real z-index is what makes a layer a
			// stacking context, which is what confines each surface's own z-index
			// (shadcn's z-50, sonner's 999999999) to its layer. A NaN z means the
			// rule or the custom property went missing and the scheme is off.
			expect(layer.position, `${layer.layer} layer is positioned`).toBe(
				'relative',
			);
			expect(layer.z, `${layer.layer} layer has a z-index`).not.toBeNaN();
		}

		const zs = layers.map((l) => l.z);
		expect(zs, 'layers must be strictly increasing').toEqual(
			[...zs].sort((a, b) => a - b),
		);
		expect(new Set(zs).size, 'no two layers share a z-index').toBe(zs.length);
	});

	test('the drawer closes when a link inside it navigates the page', async ({
		page,
	}) => {
		await page.goto('/');
		await openDrawer(page);

		// A link the DRAWER actually holds. Mandalas keeps its destinations in the
		// tab bar and gives the drawer the developer links, so 'Explorer' is the
		// one that is really in here.
		await drawerOf(page).getByRole('link', {name: 'Explorer'}).first().click();

		await expect(page).toHaveURL(/\/explorer\/?(\?.*)?$/);
		// The overlay belonged to the page it was opened from: it does not come
		// along. This is the bug that started ADR-0004.
		await expect(drawerOf(page)).toHaveCount(0);
	});

	test('the back gesture closes the drawer instead of leaving the page', async ({
		page,
	}) => {
		// A route this build actually serves, so the assertion is about the overlay
		// rather than about a 404 page that happens to render a navbar.
		await page.goto('/about/');
		await openDrawer(page);
		const urlWithOverlayOpen = page.url();

		// Opening pushed a history entry of our own, so back has something of ours
		// to consume and the user stays where they were. On a phone this is the
		// only dismiss gesture there is: there is no ESC.
		await page.goBack();

		await expect(drawerOf(page)).toHaveCount(0);
		// Same page, and the URL never changed: a prompt overlay is not addressable.
		expect(page.url()).toBe(urlWithOverlayOpen);
	});

	test('a system modal raised from inside the drawer sits on top of it', async ({
		page,
	}) => {
		// A wallet has to be announced for the connect flow to have anything to
		// show; this app's own injected wallet is what the rest of the suite uses.
		await installWallet(page);
		await page.goto('/');
		await openDrawer(page);

		await drawerOf(page)
			.getByRole('button', {name: /^connect$/i})
			.first()
			.click();

		// The wallet picker is part of the connection flow, so it is a SYSTEM
		// overlay and belongs in the layer above the drawer AND above ordinary
		// modals. THIS IS THE REGRESSION THIS FILE EXISTS FOR: it used to be
		// decided by mount order, which reverses after a single navigation, so the
		// same modal stacked differently depending on how the user arrived.
		const modal = systemModalOf(page).first();
		await expect(modal).toBeVisible({timeout: 30_000});
		await expect(modalOf(page)).toHaveCount(0);

		// The real assertion is HITTABILITY, not visibility: the failure this
		// guards against leaves the connect modal on screen with the drawer's
		// dimming overlay swallowing every click on it, so it looks fine and does
		// nothing.
		//
		// Asked of the MODAL rather than of a button inside it, because what is in
		// this modal depends on how far the connection has got (a wallet list, or
		// a spinner with nothing to click at all). What the layer decides is which
		// element the browser hands a click at that point, and that is exactly what
		// `elementFromPoint` answers.
		const onTop = await modal.evaluate((el) => {
			const {x, y, width, height} = el.getBoundingClientRect();
			const hit = document.elementFromPoint(x + width / 2, y + height / 2);
			return !!hit && el.contains(hit);
		});
		expect(onTop, 'the system modal receives clicks, not the drawer').toBe(
			true,
		);
	});
});
