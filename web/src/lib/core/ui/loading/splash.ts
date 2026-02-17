import {browser} from '$app/environment';
import {params} from '$lib/core/config';
import manifest from '$lib/manifest.json';
import {Assets, TextureStyle} from 'pixi.js';
import {writable, type Readable} from 'svelte/store';
TextureStyle.defaultOptions.scaleMode = 'nearest';

const MAX_STAGE = 2;
const LOCAL_STORAGE_KEY = `__visited`;

export type SplashState = {
	stage: number;
	loadingValue: number;
	complete: boolean;
};

export function createSplashStore(loadingStore?: Readable<number> | undefined) {
	let result;
	try {
		result = localStorage.getItem(LOCAL_STORAGE_KEY);
	} catch {}
	let timeout: number | undefined;
	let visited = result === 'true';
	let stageTime = performance.now();
	let loadingStoreUnsubscribe: (() => void) | undefined;
	let $data: SplashState = {
		stage: visited ? 1 : 0,
		loadingValue: 0,
		complete: false,
	};
	const store = writable<SplashState>($data);

	function set(data: Omit<SplashState, 'complete'>) {
		$data = {
			...data,
			complete: data.stage === MAX_STAGE && data.loadingValue >= 1,
		};
		store.set($data);
	}

	function start(startingStage: number = 0) {
		if (loadingStore) {
			// Subscribe to the loading store
			loadingStoreUnsubscribe = loadingStore.subscribe((value) => {
				const clampedValue = Math.max(0, Math.min(1, value));
				set({...$data, loadingValue: clampedValue});
			});
		}

		if ($data.stage < startingStage) {
			set({stage: startingStage, loadingValue: $data.loadingValue});
		}
		stageTime = performance.now();

		if (!params['logo']) {
			// in case image are not loaded
			setTimeout(
				() => {
					set({stage: MAX_STAGE, loadingValue: $data.loadingValue});
				},
				visited ? 2000 : 2000,
			);
		}
	}

	function stop() {
		if (timeout) {
			clearTimeout(timeout);
		}
		if (loadingStoreUnsubscribe) {
			loadingStoreUnsubscribe();
			loadingStoreUnsubscribe = undefined;
		}
		stageTime = 1;
		set({stage: MAX_STAGE, loadingValue: $data.loadingValue});
	}

	function gameLogoReady() {
		visited ? _loaded(1000) : _loaded(1000);
	}

	function studioLogoReady() {
		_loaded(1000);
	}

	function _loaded(timeIn: number) {
		const diff = performance.now() - stageTime;
		if (diff > timeIn) {
			if (!params['logo']) {
				nextStage();
			}
		} else {
			if (!params['logo']) {
				timeout = setTimeout(
					() => nextStage(),
					timeIn - diff,
				) as unknown as number;
			}
		}
	}

	function nextStage() {
		if (timeout) {
			clearTimeout(timeout);
		}
		if ($data.stage < MAX_STAGE) {
			stageTime = performance.now();
			set({stage: $data.stage + 1, loadingValue: $data.loadingValue});
		}

		if ($data.stage === MAX_STAGE) {
			try {
				localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
			} catch {}
		}
	}

	return {
		subscribe: store.subscribe,
		start,
		stop,
		nextStage,
		gameLogoReady,
		studioLogoReady,
	};
}

let progress = 0;
const assetLoading = writable(progress);
if (browser) {
	console.log(`loading assets...`);
	Assets.init({manifest}).then(() => {
		Assets.loadBundle('default', (progress) => {
			assetLoading.set(progress);
		}).then((assets) => {
			assetLoading.set(1);
			console.log(`Assets Loaded`, assets);
		});
	});
} else {
	const loadingInterval = setInterval(() => {
		progress += 0.1; // Increment by 2%
		assetLoading.set(Math.min(1, progress));

		if (progress >= 1) {
			clearInterval(loadingInterval);
		}
	}, 100); // Update every 100ms
}

export const splash = createSplashStore(assetLoading);

if (typeof window !== 'undefined') {
	(window as any).splash = splash;
}
