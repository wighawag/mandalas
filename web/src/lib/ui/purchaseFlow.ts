import {BaseStoreWithData} from '$lib/utils/stores';
import {encodePacked, keccak256, parseEther} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import contractsInfo from '../deployments';
import type {Chain, PublicClient, Transport, WalletClient} from 'viem';
import {randomTokens, connection} from '$lib';

const initialPrice = BigInt(
	contractsInfo.contracts.MandalaToken.linkedData.initialPrice,
);
// const creatorCutPer10000th =
//   contractsInfo.contracts.MandalaToken.linkedData.creatorCutPer10000th;
const coefficient = BigInt(
	contractsInfo.contracts.MandalaToken.linkedData.linearCoefficient,
);

type Data = {
	id: string;
	privateKey: string;
	currentPrice: bigint;
	supply: bigint;
};
export type PurchaseFlow = {
	type: 'PURCHASE';
	step:
		| 'IDLE'
		| 'CONNECTING'
		| 'LOADING_CURRENT_PRICE'
		| 'CONFIRM'
		| 'CREATING_TX'
		| 'WAITING_TX'
		| 'SUCCESS';
	data?: Data;
};

export class PurchaseFlowStore extends BaseStoreWithData<PurchaseFlow, Data> {
	public constructor(
		private publicClient: PublicClient<Transport, Chain>,
		private walletClient: WalletClient<Transport, Chain>,
	) {
		super({
			type: 'PURCHASE',
			step: 'IDLE',
		});
	}

	async cancel(): Promise<void> {
		this._reset();
	}

	async acknownledgeSuccess(): Promise<void> {
		// TODO automatic ?
		this._reset();
	}

	async mint(nft: {id: string; privateKey: string}): Promise<void> {
		this.setPartial({step: 'LOADING_CURRENT_PRICE'});
		try {
			const supply = (await this.publicClient.readContract({
				address: contractsInfo.contracts.MandalaToken.address as `0x${string}`,
				abi: contractsInfo.contracts.MandalaToken.abi,
				functionName: 'totalSupply',
			})) as bigint;

			const currentPrice = supply * coefficient + initialPrice;
			this.setPartial({
				data: {id: nft.id, privateKey: nft.privateKey, currentPrice, supply},
				step: 'CONFIRM',
			});
		} catch (e) {
			console.error('Error loading current price:', e);
			this._reset();
		}
	}

	async confirm(): Promise<void> {
		const purchaseFlow = this.setPartial({step: 'WAITING_TX'});
		if (!purchaseFlow.data) {
			throw new Error(`no flow data`);
		}

		const currentConnection = await connection.ensureConnected(
			'WalletConnected',
			{type: 'wallet'},
		);

		const walletAddress = currentConnection.mechanism.address;
		try {
			const account = privateKeyToAccount(
				purchaseFlow.data.privateKey as `0x${string}`,
			);

			// Sign the message
			const hashedData = keccak256(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				encodePacked(['string', 'address'], ['Mandala', walletAddress]),
			);
			const signature = await account.signMessage({message: {raw: hashedData}});

			const buffer = computeBuffer(
				purchaseFlow.data.supply,
				purchaseFlow.data.currentPrice,
			);

			const MandalaToken = contractsInfo.contracts.MandalaToken;
			const tx = await this.walletClient.writeContract({
				account: walletAddress,
				...MandalaToken,
				functionName: 'mint',
				args: [walletAddress, signature],
				value: purchaseFlow.data.currentPrice + buffer,
			});

			// Record the transaction
			randomTokens.record(purchaseFlow.data.id, tx, 0); // nonce not available easily
			this.setPartial({step: 'SUCCESS'});
		} catch (e) {
			console.error('Transaction failed:', e);
			this._reset();
		}
	}

	private _reset() {
		this.setPartial({step: 'IDLE', data: undefined});
	}
}

// Helper function
function computeBuffer(supply: bigint, currentPrice: bigint): bigint {
	// This is a simplified buffer calculation
	// The original implementation had more complex logic
	return currentPrice / BigInt(10); // 10% buffer
}
