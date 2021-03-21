import {chain, fallback} from './wallet';
import type {BigNumber} from '@ethersproject/bignumber';
import {BaseStore} from '../lib/utils/stores';
import contractsInfo from '../contracts.json';
import {parseEther} from '@ethersproject/units';

type Curve = {
  state: 'Idle' | 'Loading' | 'Ready';
  error?: unknown;
  currentPrice?: BigNumber;
  supply?: BigNumber;
};


export class CurveStore extends BaseStore<Curve> {
  private timer: NodeJS.Timeout | undefined;
  private counter = 0;
  constructor() {
    super({
      state: 'Idle',
    });
  }
  async query(): Promise<
    null | BigNumber
  > {const contracts = chain.contracts || fallback.contracts;
    if (contracts) {
      return await contracts.BitmapToken.totalSupply();
    } else if (fallback.state === 'Ready') {
      throw new Error('no contracts to fetch with');
    } else {
      return null;
    }
  }

  private async _fetch() {
    const supply = await this.query();
    if (!supply) {
      this.setPartial({state: 'Loading'});
    } else {
      this.setPartial({currentPrice: supply.mul(contractsInfo.contracts.BitmapToken.linkedData.linearCoefficient).add(contractsInfo.contracts.BitmapToken.linkedData.initialPrice), supply, state: 'Ready'});
    }
  }

  subscribe(
    run: (value: Curve) => void,
    invalidate?: (value?: Curve) => void
  ): () => void {
    if (this.counter === 0) {
      this.start();
    }
    this.counter++;
    const unsubscribe = super.subscribe(run, invalidate);
    return () => {
      this.counter--;
      if (this.counter === 0) {
        this.stop();
      }
      unsubscribe();
    };
  }

  start(): CurveStore | void {
    this.setPartial({state: 'Loading'});
    this._fetch();
    this.timer = setInterval(() => this._fetch(), 5000); // TODO polling interval config
    return this;
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  acknowledgeError(): void {
    this.setPartial({error: undefined});
  }
}

export const curve = new CurveStore();
