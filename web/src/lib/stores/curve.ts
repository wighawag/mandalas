import {get} from 'svelte/store';
import type {PublicClient} from 'viem';
import {BaseStore} from '$lib/utils/stores';
import contractsInfo from '$lib/deployments';

type Curve = {
  state: 'Idle' | 'Loading' | 'Ready' | 'Stuck';
  error?: unknown;
  currentPrice?: bigint;
  supply?: bigint;
};

export class CurveStore extends BaseStore<Curve> {
  private timer: ReturnType<typeof setInterval> | undefined;
  private counter = 0;
  private startTime = 0;
  private publicClient: PublicClient | null = null;

  constructor() {
    super({
      state: 'Idle',
    });
  }

  setPublicClient(client: PublicClient) {
    this.publicClient = client;
  }

  async query(): Promise<null | bigint> {
    if (this.publicClient) {
      try {
        return await this.publicClient.readContract({
          address: contractsInfo.contracts.MandalaToken.address as `0x${string}`,
          abi: contractsInfo.contracts.MandalaToken.abi,
          functionName: 'totalSupply',
        });
      } catch (e) {
        console.error('Error fetching totalSupply:', e);
        return null;
      }
    }
    return null;
  }

  private async _fetch() {
    const supply = await this.query();
    if (!supply) {
      if (this.startTime > 0 && Date.now() - this.startTime > 2000) {
        console.log('STUCK');
        this.setPartial({state: 'Stuck'});
      } else {
        this.setPartial({state: 'Loading'});
      }
    } else {
      const linkedData = contractsInfo.contracts.MandalaToken.linkedData;
      const currentPrice = supply * BigInt(linkedData.linearCoefficient) + BigInt(linkedData.initialPrice);
      this.setPartial({
        currentPrice,
        supply,
        state: 'Ready',
      });
    }
  }

  subscribe(run: (value: Curve) => void, invalidate?: (value?: Curve) => void): () => void {
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
    if (this.startTime === 0) {
      this.startTime = Date.now();
      console.log({start: this.startTime});
    }
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
