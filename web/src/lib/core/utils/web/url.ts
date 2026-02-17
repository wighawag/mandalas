/* eslint-disable @typescript-eslint/no-explicit-any */
export function getParamsFromURL(url: string): {
  params: Record<string, string>;
  pathname?: string;
} {
  if (!url) {
    return {params: {}, pathname: ''};
  }
  const obj: Record<string, string> = {};
  const hash = url.lastIndexOf('#');

  let cleanedUrl = url;
  if (hash !== -1) {
    cleanedUrl = cleanedUrl.slice(0, hash);
  }

  const question = cleanedUrl.indexOf('?');
  if (question !== -1) {
    cleanedUrl
      .slice(question + 1)
      .split('&')
      .forEach((piece) => {
        const [key, val = ''] = piece.split('=');
        obj[decodeURIComponent(key)] = val === '' ? 'true' : decodeURIComponent(val);
      });
  }

  let pathname = cleanedUrl.slice(0, question) || '';
  if (pathname && !pathname.endsWith('/')) {
    pathname += '/';
  }
  return {params: obj, pathname};
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function getParamsFromLocation(): {
  params: Record<string, string>;
  pathname?: string;
} {
  if (typeof window === 'undefined') {
    return {params: {}};
  }
  return getParamsFromURL(window.location.href);
}

export function getHashParamsFromLocation(str?: string): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  const url = str || window.location.hash;
  const obj: Record<string, string> = {};
  const hash = url.lastIndexOf('#');

  if (hash !== -1) {
    url
      .slice(hash + 1)
      .split('&')
      .forEach((piece) => {
        const [key, val = ''] = piece.split('=');
        obj[decodeURIComponent(key)] = decodeURIComponent(val);
      });
  }
  return obj;
}

export function queryStringifyNoArray(query: Record<string, string>): string {
  let str = '';
  for (const key of Object.keys(query)) {
    const value = query[key];
    str += `${str === '' ? '?' : '&'}${key}=${value}`;
  }
  return str;
}

export function rebuildLocationHash(hashParams: Record<string, string>): void {
  if (typeof window === 'undefined') {
    return;
  }
  let reconstructedHash = '';
  Object.entries(hashParams).forEach((param) => {
    if (reconstructedHash === '') {
      reconstructedHash += '#';
    } else {
      reconstructedHash += '&';
    }
    reconstructedHash += param.join('=');
  });

  if ('replaceState' in window.history) {
    window.history.replaceState(
      '',
      document.title,
      window.location.pathname + window.location.search + reconstructedHash,
    );
  } else {
    // Prevent scrolling by storing the page's current scroll offset
    const {scrollTop, scrollLeft} = document.body;
    window.location.hash = '';

    // Restore the scroll offset, should be flicker free
    document.body.scrollTop = scrollTop;
    document.body.scrollLeft = scrollLeft;
  }
}
