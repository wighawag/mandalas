import {writable, type Readable} from 'svelte/store';
import type {GetFeeHistoryReturnType, PublicClient} from 'viem';
import type {TypedDeployments} from './types';

export type GasPrice = {maxFeePerGas: bigint; maxPriorityFeePerGas: bigint};
export type EstimateGasPriceResult = GasPrice[];

export type GasPriceEstimates = {
	slow: GasPrice;
	average: GasPrice;
	fast: GasPrice;
	higherThanExpected: boolean;
};

export type LoadedGasFee = {
	step: 'Loaded';
} & GasPriceEstimates;
export type GasFee = {error?: {message: string; cause?: any}} & (
	| {
			step: 'Idle';
	  }
	| {
			step: 'Loading';
	  }
	| LoadedGasFee
);

export type GasFeeStore = Readable<GasFee> & {
	update(): void;
	value: LoadedGasFee | undefined;
};

function defaultState() {
	return {
		step: 'Idle',
	} as const;
}

function avg(arr: bigint[]) {
	const sum = arr.reduce((a: bigint, v: bigint) => a + v);
	return sum / BigInt(arr.length);
}

export function createGasFeeStore(
	params: {publicClient: PublicClient; deployments: TypedDeployments},
	options?: {fetchInterval?: number},
): GasFeeStore {
	let feeHistoryNotSupported: boolean | undefined;
	const {publicClient, deployments} = params;
	const fetchInterval = options?.fetchInterval || 10 * 60 * 1000; // 10 minute

	let $state: GasFee = defaultState();

	const _store = writable<GasFee>($state, start);
	function set(state: GasFee) {
		$state = state;
		_store.set($state);
		return $state;
	}

	async function fetchGasPriceEstimates(): Promise<GasPriceEstimates> {
		const blockCount = 20;
		const rewardPercentiles = [10, 50, 80];

		if (!feeHistoryNotSupported) {
			try {
				const feeHistory: GetFeeHistoryReturnType =
					await publicClient.getFeeHistory({
						blockCount,
						rewardPercentiles,
						blockTag: 'pending',
					});
				const reward = feeHistory.reward!;

				let blockNum = Number(feeHistory.oldestBlock);
				const lastBlock = blockNum + reward.length;
				let index = 0;
				const blocksHistory: {
					number: number;
					baseFeePerGas: bigint;
					gasUsedRatio: number;
					priorityFeePerGas: bigint[];
				}[] = [];
				while (blockNum < lastBlock) {
					blocksHistory.push({
						number: blockNum,
						baseFeePerGas: feeHistory.baseFeePerGas[index],
						gasUsedRatio: feeHistory.gasUsedRatio[index],
						priorityFeePerGas: reward[index],
					});
					blockNum += 1;
					index += 1;
				}

				const percentilePriorityFeeAverages: bigint[] = [];
				for (let i = 0; i < rewardPercentiles.length; i++) {
					percentilePriorityFeeAverages.push(
						avg(blocksHistory.map((b) => b.priorityFeePerGas[i])),
					);
				}

				const baseFeePerGas =
					feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1];

				const result: EstimateGasPriceResult = [];
				for (let i = 0; i < rewardPercentiles.length; i++) {
					result.push({
						maxFeePerGas: percentilePriorityFeeAverages[i] + baseFeePerGas,
						maxPriorityFeePerGas: percentilePriorityFeeAverages[i],
					});
				}
				return {
					slow: result[0],
					average: result[1],
					fast: result[2],
					higherThanExpected:
						result[2].maxFeePerGas >
						BigInt(deployments.chain.properties.expectedWorstGasPrice),
				};
			} catch (err: any) {
				if (feeHistoryNotSupported === undefined) {
					if (
						('details' in err &&
							err.details.indexOf('unknown method eth_feeHistory') != -1) ||
						err.details.indexOf('Unknown method eth_feeHistory') != -1
					) {
						feeHistoryNotSupported = true;
					} else {
						throw err;
					}
				} else {
					throw err;
				}
			}
		}

		if (feeHistoryNotSupported) {
			const gasPrice = await publicClient.getGasPrice();
			return {
				slow: {
					maxFeePerGas: gasPrice,
					maxPriorityFeePerGas: gasPrice,
				},
				average: {
					maxFeePerGas: gasPrice,
					maxPriorityFeePerGas: gasPrice,
				},
				fast: {
					maxFeePerGas: gasPrice,
					maxPriorityFeePerGas: gasPrice,
				},
				higherThanExpected:
					gasPrice > BigInt(deployments.chain.properties.expectedWorstGasPrice),
			};
		}

		throw new Error(`could not fallback on getGasPrice`);
	}

	async function fetchState(): Promise<boolean> {
		if ($state.step !== 'Loaded') {
			set({
				step: 'Loading',
			});
		}

		let gasPriceEstimates: GasPriceEstimates;
		try {
			gasPriceEstimates = await fetchGasPriceEstimates();
		} catch (err: any) {
			console.error(`failed to fetch fee history`, err);
			set({
				step: 'Loading',
				error: {message: `failed to fetch fee history`, cause: err},
			});
			return false;
		}

		set({
			step: 'Loaded',
			...gasPriceEstimates,
		});

		return true;
	}

	async function fetchContinuously() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}

		let interval = fetchInterval;
		try {
			const success = await fetchState();
			if (!success) {
				interval = 500;
			}
		} finally {
			if (!timeout) {
				timeout = setTimeout(fetchContinuously, interval);
			}
		}
	}

	let timeout: NodeJS.Timeout | undefined;
	function start() {
		fetchContinuously();

		return stop;
	}

	async function update() {
		await fetchContinuously();
		return $state;
	}

	function stop() {
		set(defaultState());

		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
	}

	return {
		subscribe: _store.subscribe,
		update,
		get value() {
			return $state.step === 'Loaded' ? $state : undefined;
		},
	};
}
