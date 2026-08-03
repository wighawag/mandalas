import {describe, expect, it} from 'vitest';
import {NAV_LINKS, foldedMenuLabel, isActivePath} from '$lib/navigation';

describe('the site navigation', () => {
	it('lists the pages beside the MANDALAS brand, and not home itself', () => {
		const hrefs = NAV_LINKS.map((link) => link.href);
		expect(hrefs).not.toContain('/');
		expect(new Set(hrefs).size).toEqual(hrefs.length);
	});

	it('lights home only on home, and every other page on its subtree', () => {
		expect(isActivePath('/', '/')).toBe(true);
		expect(isActivePath('/', '/wallet/')).toBe(false);
		expect(isActivePath('/wallet/', '/wallet/')).toBe(true);
		expect(isActivePath('/wallet/', '/wallet/send/')).toBe(true);
		expect(isActivePath('/wallet/', '/about/')).toBe(false);
	});

	it('names the folded menu after the page you are on', () => {
		expect(foldedMenuLabel(NAV_LINKS, '/wallet/')).toEqual('Wallet');
		expect(foldedMenuLabel(NAV_LINKS, '/about/')).toEqual('About');
	});

	it('falls back to `More` on home, where the lit brand already says it', () => {
		expect(foldedMenuLabel(NAV_LINKS, '/')).toEqual('More');
		// a page the bar does not link to has nothing to say either
		expect(foldedMenuLabel(NAV_LINKS, '/explorer/')).toEqual('More');
	});
});
