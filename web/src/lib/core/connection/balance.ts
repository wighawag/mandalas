import type {OptionalSigner, Signer} from '$lib/core/connection/types';
import {get, writable, type Readable} from 'svelte/store';
import type {PublicClient} from 'viem';

export type Balance = {error?: {message: string}} & (
	| {
			step: 'Idle';
	  }
	| {
			step: 'Loading';
	  }
	| {
			step: 'Loaded';
			value: bigint;
	  }
);

export type BalanceStore = Readable<Balance> & {
	update(): void;
	value: Balance | undefined;
};

function defaultState() {
	return {
		step: 'Idle',
	} as const;
}

export function createBalanceStore(
	params: {
		publicClient: PublicClient;
		signer: Readable<OptionalSigner>;
	},
	options?: {
		fetchInterval?: number;
	},
): BalanceStore {
	const {publicClient, signer} = params;
	const fetchInterval = options?.fetchInterval || 5 * 1000; // 5 seconds

	let $state: Balance = defaultState();
	let $signer = get(signer);

	const _store = writable<Balance>($state, start);
	function set(state: Balance) {
		$state = state;
		_store.set($state);
		return $state;
	}

	async function fetchState($signer: Signer): Promise<boolean> {
		if ($state.step !== 'Loaded') {
			set({
				step: 'Loading',
			});
		}

		let balance: bigint;
		try {
			balance = await publicClient.getBalance({address: $signer.address});
		} catch (err) {
			set({
				step: 'Loading',
				error: {message: `failed to fetch balance for ${$signer.address}`},
			});
			return false;
		}

		set({
			step: 'Loaded',
			value: balance,
		});
		return true;
	}

	async function fetchContinuously() {
		if (!$signer) {
			set({
				step: 'Idle',
			});
		}
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if ($signer) {
			await fetchNow($signer);
		}
	}

	async function fetchNow(signer: Signer) {
		let interval = fetchInterval;
		try {
			const success = await fetchState(signer);
			if (!success) {
				interval = 500;
			}
		} finally {
			if (!timeout) {
				timeout = setTimeout(fetchContinuously, interval);
			}
		}
	}

	let unsubscribeFromAccount: (() => void) | undefined;
	let unsubscribeFromCost: (() => void) | undefined;
	let timeout: NodeJS.Timeout | undefined;
	function start() {
		unsubscribeFromAccount = signer.subscribe(async (newSigner) => {
			const signerChanged = $signer?.address != newSigner?.address;

			if (signerChanged) {
				if (newSigner) {
					$signer = {...newSigner};
					fetchContinuously();
				} else {
					set({step: 'Idle'});
				}
			}
		});

		fetchContinuously();

		return stop;
	}

	async function update() {
		await fetchContinuously();
		return $state;
	}

	function stop() {
		set(defaultState());

		if (unsubscribeFromAccount) {
			unsubscribeFromAccount();
			unsubscribeFromAccount = undefined;
		}

		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
	}

	return {
		subscribe: _store.subscribe,
		update,
		get value() {
			return $state.step == 'Loaded' ? $state : undefined;
		},
	};
}
