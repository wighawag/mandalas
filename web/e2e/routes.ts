/**
 * The routes a smoke test walks. See the template's copy for why this is data
 * rather than literals in a suite.
 *
 * MANDALAS' LIST: `/mandala/` stands in for the template's `/demo/`, which this
 * app does not have. Pointing an inherited suite at a missing route does not
 * fail, it asserts against the 404 page and passes, which is the quietest way
 * for a smoke test to stop testing anything.
 */
export const SMOKE_ROUTES = [
	'/',
	'/mandala/',
	'/transactions/',
	'/explorer/',
] as const;
