/**
 * Where the top bar can take you, and how it names where you are.
 *
 * `MANDALAS` is the site's name and its link home, so it is not in this list:
 * it is the one thing the bar always shows. These are the pages beside it, and
 * they are what folds away when the bar runs out of room (see ui/navbar).
 */
export type NavLink = {href: string; title: string};

export const NAV_LINKS: readonly NavLink[] = [
	{href: '/wallet/', title: 'Wallet'},
	{href: '/about/', title: 'About'},
];

/** Home matches only itself; every other destination matches its subtree. */
export function isActivePath(href: string, currentPath: string): boolean {
	if (href === '/') {
		return currentPath === '/';
	}
	return currentPath.startsWith(href);
}

/**
 * What the folded menu calls itself.
 *
 * Folded, the bar has room for the site name and one more thing, so that one
 * thing does double duty: it opens the rest of the site AND says which page you
 * are on. On home there is nothing extra to say, because `MANDALAS` is already
 * lit, so it falls back to `More`.
 */
export function foldedMenuLabel(
	links: readonly NavLink[],
	currentPath: string,
): string {
	const active = links.find((link) => isActivePath(link.href, currentPath));
	return active ? active.title : 'More';
}
