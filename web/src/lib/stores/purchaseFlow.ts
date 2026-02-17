import {get} from 'svelte/store';
import {BaseStoreWithData} from '$lib/utils/stores';
import {keccak256, parseEther} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {randomTokens} from './randomTokens';
import contractsInfo from '../contracts.json';
import type {PublicClient, WalletClient} from 'viem';

const initialPrice = BigInt(contractsInfo.contracts.MandalaToken.linkedData.initialPrice);
// const creatorCutPer10000th =
//   contractsInfo.contracts.MandalaToken.linkedData.creatorCutPer10000th;
const coefficient = BigInt(contractsInfo.contracts.MandalaToken.linkedData.linearCoefficient);

type Data = {
  id: string;
  privateKey: string;
  currentPrice: bigint;
  supply: bigint;
};
export type PurchaseFlow = {
  type: 'PURCHASE';
  step: 'IDLE' | 'CONNECTING' | 'LOADING_CURRENT_PRICE' | 'CONFIRM' | 'CREATING_TX' | 'WAITING_TX' | 'SUCCESS';
  data?: Data;
};

class PurchaseFlowStore extends BaseStoreWithData<PurchaseFlow, Data> {
  private publicClient: PublicClient | null = null;
  private walletClient: WalletClient | null = null;

  public constructor() {
    super({
      type: 'PURCHASE',
      step: 'IDLE',
    });
  }

  setClients(publicClient: PublicClient, walletClient: WalletClient) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }

  async cancel(): Promise<void> {
    this._reset();
  }

  async acknownledgeSuccess(): Promise<void> {
    // TODO automatic ?
    this._reset();
  }

  async mint(nft: {id: string; privateKey: string}): Promise<void> {
    if (!this.publicClient) {
      console.error('Public client not initialized');
      return;
    }

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
    if (!this.walletClient) {
      throw new Error(`wallet client not initialized`);
    }

    try {
      const account = privateKeyToAccount(purchaseFlow.data.privateKey as `0x${string}`);

      // Sign the message
      const hashedData = keccak256(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new TextEncoder().encode('Mandala' + (this.walletClient as any).account.address),
      );
      const signature = await account.signMessage({message: {raw: hashedData}});

      const buffer = computeBuffer(purchaseFlow.data.supply, purchaseFlow.data.currentPrice);

      const tx = await this.walletClient.writeContract({
        address: contractsInfo.contracts.MandalaToken.address as `0x${string}`,
        abi: contractsInfo.contracts.MandalaToken.abi,
        functionName: 'mint',
        args: [this.walletClient.account.address as `0x${string}`, signature],
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

export default new PurchaseFlowStore();

// Helper function
function computeBuffer(supply: bigint, currentPrice: bigint): bigint {
  // This is a simplified buffer calculation
  // The original implementation had more complex logic
  return currentPrice / BigInt(10); // 10% buffer
}
