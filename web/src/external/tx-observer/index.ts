import { writable } from 'svelte/store';
import type { EIP1193Provider, EIP1193Block } from 'eip-1193';
import type { EIP1193TransactionWithMetadata } from 'web3-connection/dist/provider/wrap';
import { initEmitter } from '$external/callbacks';

export type PendingTransactionInclusion =
	| 'Loading'
	| 'Pending'
	| 'NotFound'
	| 'Cancelled'
	| 'Included';
export type PendingTransaction = {
	readonly hash: `0x${string}`;
	readonly request: EIP1193TransactionWithMetadata;
} & PendingTransactionState;

export type PendingTransactionState =
	| {
			inclusion: 'Loading' | 'Pending' | 'NotFound' | 'Cancelled';
			final: undefined;
			status: undefined;
	  }
	| {
			inclusion: 'Included';
			status: 'Failure' | 'Success';
			final: number;
	  };

export function initTransactionProcessor(config: { finality: number }) {
	const emitter = initEmitter<PendingTransaction>();

	let provider: EIP1193Provider | undefined;
	const $txs: PendingTransaction[] = [];
	const store = writable<PendingTransaction[]>($txs);
	const map: { [hash: string]: PendingTransaction } = {};

	function add(list: PendingTransaction[]) {
		for (const tx of list) {
			_addSingle(tx);
		}
		store.set($txs);
	}

	function _addSingle(pendingTransaction: PendingTransaction) {
		if (!map[pendingTransaction.hash]) {
			map[pendingTransaction.hash] = pendingTransaction;
			$txs.push(pendingTransaction);
		}
	}

	function addTx(
		tx: EIP1193TransactionWithMetadata,
		hash: `0x${string}`,
		state?: PendingTransactionState
	) {
		if (!map[hash]) {
			const pendingTransaction: PendingTransaction = {
				hash,
				request: tx,
				...(state || {
					inclusion: 'Loading',
					final: undefined,
					status: undefined,
				}),
			};
			_addSingle(pendingTransaction);
			store.set($txs);
		}
	}

	function clear() {
		for (const tx of $txs) {
			delete map[tx.hash];
		}
		$txs.splice(0, $txs.length);
	}

	function remove(hash: string) {
		const pendingTransaction = map[hash];
		if (pendingTransaction) {
			const index = $txs.indexOf(pendingTransaction);
			if (index >= 0) {
				$txs.splice(index, 1);
				store.set($txs);
			}
			delete map[hash];
		}
	}

	async function process() {
		if (!provider) {
			return;
		}

		const latestBlock = await provider.request({
			method: 'eth_getBlockByNumber',
			params: ['latest', false],
		});

		const latestBlockNumber = parseInt(latestBlock.number.slice(2), 16);

		const latestFinalizedBlockNumber = Math.max(latestBlockNumber - config.finality, 0);

		const latestFinalizedBlock = await provider.request({
			method: 'eth_getBlockByNumber',
			params: [`0x${latestFinalizedBlockNumber.toString(16)}`, false],
		});
		const account = '0x'; // TODO checkedAction.action.txOrigin || ownerAddress;
		const tranactionCount = await provider.request({
			method: 'eth_getTransactionCount',
			params: [account, latestFinalizedBlock.hash],
		});
		const finalityNonce = parseInt(tranactionCount.slice(2), 16);

		let changes = false;
		for (const tx of $txs) {
			const newChanges = await processTx(tx, {
				latestBlockNumber,
				latestFinalizedBlockNumber,
				finalityNonce,
			});
			// TODO skip if account / network changes
			changes = changes || newChanges;
		}

		if (changes) {
			// TODO a store per tx ?
			// TODO we could also set the changes on each tx inside processTx
			store.set($txs);
		}
	}

	async function processTx(
		tx: PendingTransaction,
		{
			latestBlockNumber,
			finalityNonce,
		}: { latestBlockNumber: number; latestFinalizedBlockNumber: number; finalityNonce: number }
	): Promise<boolean> {
		if (!provider) {
			return false;
		}

		if (tx.inclusion === 'Included') {
			if (tx.final) {
				// TODO auto remove ?
				return false;
			}
		}

		const txFromPeers = await provider.request({
			method: 'eth_getTransactionByHash',
			params: [tx.hash],
		});

		let changes = false;
		if (txFromPeers) {
			let receipt;
			if (txFromPeers.blockNumber) {
				receipt = await provider.request({
					method: 'eth_getTransactionReceipt',
					params: [tx.hash],
				});
			}
			if (receipt) {
				const block = await provider.request({
					method: 'eth_getBlockByHash',
					params: [txFromPeers.blockHash, false],
				});
				if (block) {
					const blockNumber = parseInt(block.number.slice(2), 16);
					const blockTimestamp = parseInt(block.timestamp.slice(2), 16);
					const is_final = latestBlockNumber - blockNumber >= config.finality;
					if (receipt.status === '0x0' || receipt.status === '0x00') {
						if (tx.status !== 'Failure' || tx.final !== blockTimestamp) {
							tx.status = 'Failure';
							tx.final = is_final ? blockTimestamp : undefined;
							changes = true;
						}
					} else {
						if (tx.status !== 'Success' || tx.final !== blockTimestamp) {
							tx.status = 'Success';
							tx.final = is_final ? blockTimestamp : undefined;
							changes = true;
						}
					}
				}
			} else {
				if (tx.inclusion !== 'Pending') {
					tx.inclusion = 'Pending';
					changes = true;
				}
			}
		} else {
			// NOTE: we feteched it again to ensure the call was not lost
			const txFromPeers = await provider.request({
				method: 'eth_getTransactionByHash',
				params: [tx.hash],
			});
			if (txFromPeers) {
				return false; // we skip it for now
			}
			if (typeof tx.request.nonce === 'number' && finalityNonce > tx.request.nonce) {
				if (tx.inclusion !== 'Cancelled' || !tx.final) {
					tx.inclusion = 'Cancelled';
					tx.final = tx.request.timestamp;
					changes = true;
				}
			} else {
				if (tx.inclusion !== 'NotFound') {
					tx.inclusion = 'NotFound';
					tx.final = undefined;
					changes = true;
				}
			}
		}

		if (changes) {
			if (map[tx.hash]) {
				// still tracked
				emitter.emit(tx);
			}
		}

		return changes;
	}

	return {
		txs: {
			subscribe: store.subscribe,
		},
		setProvider(newProvider: EIP1193Provider) {
			provider = newProvider;
		},
		// we probably do not want to hook it up directly to web3-connection observers
		// most likely we want an account data store to be the observer and store the tx as they come, to ensure they are saved as soon as possible
		// then the account store can notify the tx observer to start processing
		// similarly on account loaded or switched, we will want to delete the tx
		// also we need to consider the provider changing ?

		// onTxSent(tx: EIP1193TransactionWithMetadata, hash: string) {
		// 	addTx(tx, hash, 'Pending');
		// },
		add,
		remove,
		clear,

		process,

		onTx: emitter.on,
		offTx: emitter.off,
	};
}
