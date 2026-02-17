import {resolve} from '$app/paths';
import {globalQueryParams, params} from '$lib/core/config.js';
import {getParamsFromURL, queryStringifyNoArray} from './url.js';

export function route(p: string, hash?: string) {
  if (!p.endsWith('/')) {
    p += '/';
  }
  const pathToResolve = `${p}${getQueryStringToKeep(p)}${hash ? `#${hash}` : ''}`;
  let path = resolve<any>(pathToResolve);
  return path;
}

function getQueryStringToKeep(p: string): string {
  if (globalQueryParams && globalQueryParams.length > 0) {
    const {params: paramFromPath} = getParamsFromURL(p);
    for (const queryParam of globalQueryParams) {
      if (typeof params[queryParam] != 'undefined' && typeof paramFromPath[queryParam] === 'undefined') {
        paramFromPath[queryParam] = params[queryParam];
      }
    }
    return queryStringifyNoArray(paramFromPath);
  } else {
    return '';
  }
}

export function url(p: string, hash?: string) {
  return resolve<any>(hash ? `${p}${hash.startsWith('#') ? hash : `#${hash}`}` : p);
}

export function isSameRoute(a: string, b: string): boolean {
  return a === b || a === route(b);
}

export function isParentRoute(a: string, b: string): boolean {
  return a.startsWith(b) || a.startsWith(route(b));
}
