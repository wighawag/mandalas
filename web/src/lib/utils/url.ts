import {getParamsFromURL, queryStringifyNoArray} from './web';
import {params, globalQueryParams} from '$lib/config';

// In SvelteKit 2, we use import.meta.env base or a constant
const base = ''; // Empty for now, can be configured via environment

export function url(path: string, hash?: string): string {
  const {params: paramFromPath, pathname} = getParamsFromURL(path);
  for (const queryParam of globalQueryParams) {
    if (typeof params[queryParam] != 'undefined' && typeof paramFromPath[queryParam] === 'undefined') {
      paramFromPath[queryParam] = params[queryParam];
    }
  }
  return `${base}/${pathname}${queryStringifyNoArray(paramFromPath)}${hash ? `#${hash}` : ''}`;
}

export function urlOfPath(checkUrl: string, path: string): boolean {
  const basicUrl = checkUrl.split('?')[0].split('#')[0];
  return basicUrl.replace(base, '').replace(/^\/+|\/+$/g, '') === path.replace(/^\/+|\/+$/g, '');
}

export {base};
