import {version} from '$app/environment';
import {createServiceWorker} from './service-worker';
import {getHashParamsFromLocation, getParamsFromLocation} from './utils/web/url';

export const serviceWorker = createServiceWorker();

export const hashParams = getHashParamsFromLocation();
export const {params} = getParamsFromLocation();

export const globalQueryParams = ['debug', 'debugLevel', 'traceLevel', 'debugLabel', 'eruda'];

export const VERSION = version;
console.log(`VERSION: ${VERSION}`);
