import {dev} from '$app/environment';
import {resolve} from '$app/paths';
import {notifications} from '$lib/core/notifications';
import type {Logger} from 'named-logs';
import {logs} from 'named-logs';
import {get, writable} from 'svelte/store';
import {handleAutomaticUpdate, listenForWaitingServiceWorker} from './utils';

const logger = logs('service-worker') as Logger & {
	level: number;
	enabled: boolean;
};

function updateLoggingForWorker(worker: ServiceWorker | null) {
	if (worker) {
		if (logger.enabled) {
			logger.debug(
				`enabling logging for service worker, level: ${logger.level}`,
			);
		} else {
			logger.debug(
				`disabling logging for service worker, level: ${logger.level}`,
			);
		}
		worker.postMessage({
			type: 'debug',
			level: logger.level,
			enabled: logger.enabled,
		});
	}
}

const IDLE_DELAY_MS = 3 * 60 * 1000;
const CHECK_DELAY_MS = 30 * 60 * 1000;

export type ServiceWorkerState =
	| undefined
	| {
			notSupported: true;
	  }
	| {
			notSupported: false;
			registering: true;
	  }
	| {
			notSupported: false;
			registering: false;
			error: {message: string; cause: any};
			registration: undefined;
			updateAvailable: false;
	  }
	| {
			registration?: ServiceWorkerRegistration;
			updateAvailable: boolean;
			notSupported: false;
			registering: false;
	  };

export function createServiceWorker() {
	const store = writable<ServiceWorkerState>(undefined);

	function pingServideWorker(
		state: 'installing' | 'waiting' | 'active' = 'active',
	) {
		sendMessage(
			{
				type: 'ping',
			},
			state,
		);
	}

	function sendMessage(
		message: string | object,
		state: 'installing' | 'waiting' | 'active' = 'active',
	) {
		const $serviceWorker = get(store);
		if (!$serviceWorker) {
			throw new Error(`not loaded`);
		}
		if ($serviceWorker.notSupported) {
			throw new Error(`not supported`);
		}
		if ($serviceWorker.registering) {
			throw new Error(`is registering...`);
		}
		const registration = $serviceWorker.registration;
		if (!registration) {
			throw new Error(`no registration`);
		}
		if (!registration[state]) {
			throw new Error(`no registration in state: ${state}`);
		}
		registration[state].postMessage(message);
	}

	function skipWaiting() {
		logger.log(`accepting update...`);
		const $serviceWorker = get(store);
		if (!$serviceWorker) {
			throw new Error(`not loaded`);
		}
		if ($serviceWorker.notSupported) {
			throw new Error(`not supported`);
		}
		if ($serviceWorker.registering) {
			throw new Error(`is registering...`);
		}
		if ($serviceWorker.updateAvailable && $serviceWorker.registration) {
			const registration = $serviceWorker.registration;
			if (!registration) {
				throw new Error(`no registration`);
			}

			if (registration.waiting) {
				logger.log(`was waiting, skipping...`);
				registration.waiting.postMessage('skipWaiting');
			} else {
				logger.log(`was not waiting, should we reload?`);
				logger.error(`not waiting..., todo reload?`);
				// window.location.reload();
			}

			if (!dev) {
				logger.log(`update store`);
				store.set({
					notSupported: false,
					updateAvailable: false,
					registration: $serviceWorker.registration,
					registering: $serviceWorker.registering,
				});
			}
		}
	}

	function skip() {
		const $serviceWorker = get(store);
		if (!$serviceWorker) {
			throw new Error(`not loaded`);
		}
		if ($serviceWorker.notSupported) {
			throw new Error(`not supported`);
		}
		if ($serviceWorker.registering) {
			throw new Error(`is registering...`);
		}
		store.set({
			notSupported: false,
			updateAvailable: false,
			registration: $serviceWorker.registration,
			registering: $serviceWorker.registering,
		});
	}

	function register() {
		if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
			store.set({notSupported: false, registering: true});

			// ------------------------------------------------------------------------------------------------
			// FORCE RELOAD ON CONTROLLER CHANGE
			// ------------------------------------------------------------------------------------------------
			let refreshing = false;
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				if (refreshing) {
					return;
				}
				refreshing = true;
				window.location.reload();
			});
			// ------------------------------------------------------------------------------------------------

			//listen to messages
			navigator.serviceWorker.onmessage = (event) => {
				if (event.data && event.data.type === 'notification') {
					console.log(event);
					notifications.add({
						type: 'push-notification',
						data: event.data.notification,
					});
				}
			};

			const swLocation = resolve<any>(`/service-worker.js`);
			//{scope: `${base}/`}
			navigator.serviceWorker
				.register(swLocation, {
					type: dev ? 'module' : 'classic',
				})
				.then((registration) => {
					try {
						handleAutomaticUpdate(registration, {
							idle: IDLE_DELAY_MS,
							checks: CHECK_DELAY_MS,
						});
					} catch (e) {}

					store.set({
						notSupported: false,
						updateAvailable: false,
						registration: registration,
						registering: false,
					});
					updateLoggingForWorker(registration.installing);
					updateLoggingForWorker(registration.waiting);
					updateLoggingForWorker(registration.active);
					listenForWaitingServiceWorker(registration, () => {
						store.set({
							notSupported: false,
							updateAvailable: true,
							registration: registration,
							registering: false,
						});
					});
				})
				.catch((e) => {
					console.error(e);
					store.set({
						registering: false,
						notSupported: false,
						updateAvailable: false,
						registration: undefined,
						error: {
							message: `failed to register service-worker`,
							cause: e.message || e,
						},
					});
					logger.error('Failed to register service worker', e);
				});
		} else {
			if (typeof window !== 'undefined') {
				store.set({notSupported: true});
			}
		}
	}

	return {
		subscribe: store.subscribe,
		set: store.set, // TODO remove and move handler logic in here
		get registration(): ServiceWorkerRegistration | undefined {
			const $serviceWorker = get(store);
			if ($serviceWorker && 'registration' in $serviceWorker) {
				return $serviceWorker.registration;
			} else {
				return undefined;
			}
		},
		get updateAvailable(): boolean {
			const $serviceWorker = get(store);
			if ($serviceWorker && 'updateAvailable' in $serviceWorker) {
				return $serviceWorker.updateAvailable;
			} else {
				return false;
			}
		},
		register,
		pingServideWorker,
		sendMessage,
		skipWaiting,
		skip,
	};
}
