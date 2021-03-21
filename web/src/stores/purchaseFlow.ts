import {wallet, flow} from './wallet';
import {BaseStoreWithData} from '../lib/utils/stores';
import {BigNumber} from '@ethersproject/bignumber';
import {Wallet} from '@ethersproject/wallet';
import {randomTokens} from './randomTokens';
import contractsInfo from '../contracts.json';
import {keccak256} from '@ethersproject/solidity';
import {arrayify} from '@ethersproject/bytes';
import {computeBuffer} from '../utils';

const initialPrice = BigNumber.from(contractsInfo.contracts.BitmapToken.linkedData.initialPrice);
const creatorCutPer10000th = contractsInfo.contracts.BitmapToken.linkedData.creatorCutPer10000th;
const coefficient = BigNumber.from(contractsInfo.contracts.BitmapToken.linkedData.linearCoefficient);

type Data = {id: string, privateKey: string, currentPrice: BigNumber, supply: BigNumber};
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

class PurchaseFlowStore extends BaseStoreWithData<PurchaseFlow, Data> {
  public constructor() {
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

  async mint(nft: {id: string, privateKey: string}): Promise<void> {
    this.setPartial({step: 'CONNECTING'});
    flow.execute(async (contracts) => {
      this.setPartial({step: 'LOADING_CURRENT_PRICE'});
      const supply = await contracts.BitmapToken.totalSupply();
      const currentPrice = supply.mul(coefficient).add(initialPrice);
      this.setPartial({data: {id: nft.id, privateKey: nft.privateKey, currentPrice, supply}, step: 'CONFIRM'});
    });

  }

  async confirm(): Promise<void> {
    const purchaseFlow = this.setPartial({step: 'WAITING_TX'});
    if (!purchaseFlow.data) {
      throw new Error(`no flow data`);
    }
    const account = new Wallet(purchaseFlow.data.privateKey);
    flow.execute(async (contracts) => {
      if (!purchaseFlow.data) {
        throw new Error(`no flow data`);
      }
      const hashedData = keccak256(
        ['string', 'address'],
        ['Bitmap', wallet.address]
      );
      const signature = await account.signMessage(arrayify(hashedData));
      const buffer = computeBuffer(purchaseFlow.data.supply, purchaseFlow.data.currentPrice)

      const tx = await contracts.BitmapToken.mint(wallet.address, signature, {value: purchaseFlow.data.currentPrice.add(buffer) });
      randomTokens.record(purchaseFlow.data.id, tx.hash, tx.nonce);
      this.setPartial({step: 'SUCCESS'});
    });
  }

  private _reset() {
    this.setPartial({step: 'IDLE', data: undefined});
  }
}

export default new PurchaseFlowStore();
