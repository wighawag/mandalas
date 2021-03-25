import {chain, fallback, transactions} from './wallet';
import {BaseStore} from '../lib/utils/stores';

// TODO export in web3w
type ParsedEvent = {
  args: Record<string, unknown>;
  name: string;
  signature: string;
};
type TransactionStatus =
  | 'pending'
  | 'cancelled'
  | 'success'
  | 'failure'
  | 'mined';
type TransactionRecord = {
  hash: string;
  from: string;
  submissionBlockTime: number;
  acknowledged: boolean;
  status: TransactionStatus;
  nonce: number;
  confirmations: number;
  finalized: boolean;
  lastAcknowledgment?: TransactionStatus;
  to?: string;
  gasLimit?: string;
  gasPrice?: string;
  data?: string;
  value?: string;
  contractName?: string;
  method?: string;
  args?: unknown[];
  metadata?: unknown;
  lastCheck?: number;
  blockHash?: string;
  blockNumber?: number;
  events?: ParsedEvent[];
};

function fixURI(uri?: string): string {
  if (!uri) {
    return ''; // TODO error image
  }
  if (uri.startsWith('ipfs://')) {
    return 'https://ipfs.io/ipfs/' + uri.slice(7);
  }
  return uri;
}

type NFT = {
  id: string;
  tokenURI: string;
  name: string;
  description: string;
  image: string;
  error?: string;
};

type NFTs = {
  state: 'Idle' | 'Loading' | 'Ready';
  error?: unknown;
  tokens: NFT[];
  burning: {[id: string]: boolean};
};

class NFTOfStore extends BaseStore<NFTs> {
  private timer: NodeJS.Timeout | undefined;
  private counter = 0;
  private currentOwner?: string;
  private unsubscribeFromTransactions: (() => void) | undefined;
  constructor(owner?: string) {
    super({
      state: 'Idle',
      error: undefined,
      tokens: [],
      burning: {},
    });
    this.currentOwner = owner?.toLowerCase();
  }

  async query(
    address: string
  ): Promise<null | {tokenURI: string; id: string}[]> {
    const contracts = chain.contracts || fallback.contracts;
    if (contracts) {
      const numTokens = await contracts.MandalaToken.balanceOf(address);
      const tokens = await contracts.MandalaToken.getTokenDataOfOwner(
        address,
        0,
        numTokens
      );
      const result: {tokenURI: string; id: string}[] = [];
      for (const token of tokens) {
        result.push({
          tokenURI: token.tokenURI.replace(
            'image-rendering: pixelated;',
            'image-rendering: pixelated; image-rendering: crisp-edges;'
          ),
          id: token.id,
        });
      }

      // TODO support batching
      return result;
    } else if (fallback.state === 'Ready') {
      throw new Error('no contracts to fetch with');
    } else {
      return null;
    }
  }

  private async _fetch() {
    const owner = this.currentOwner;
    if (owner) {
      const result = await this.query(owner);
      if (!result) {
        if (this.$store.state !== 'Ready') {
          this.setPartial({tokens: [], state: 'Loading'});
        }
      } else {
        const transformed = await this._transform(result);
        // console.log({transformed});
        if (owner === this.currentOwner) {
          this.setPartial({tokens: transformed, state: 'Ready'});
        }
      }
    } else {
      this.setPartial({tokens: [], state: 'Ready'});
    }
  }

  async _transform(tokens: {tokenURI: string; id: string}[]): Promise<NFT[]> {
    // TODO cache
    const newResult: NFT[] = [];
    for (const token of tokens) {
      if (token.tokenURI) {
        const tokenURI = fixURI(token.tokenURI);
        try {
          const response = await fetch(tokenURI);
          const json = await response.json();
          newResult.push({
            id: token.id,
            tokenURI,
            name: json.name,
            description: json.description,
            image: fixURI(json.image || json.image_url),
          });
        } catch (e) {
          newResult.push({
            id: token.id,
            tokenURI,
            name: '',
            description: '',
            image: '',
            error: e.message || e,
          }); // TODO error
        }
      } else {
        newResult.push({
          id: token.id,
          tokenURI: '',
          name: '',
          description: '',
          image: '',
        });
      }
    }
    return newResult;
  }

  subscribe(
    run: (value: NFTs) => void,
    invalidate?: (value?: NFTs) => void
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

  onTransactions(txs: TransactionRecord[]): void {
    for (const tx of txs) {
      if (!tx.finalized && tx.args) {
        // based on args : so need to ensure args are available
        if (tx.status != 'cancelled' && tx.status !== 'failure') {
          if (tx.args.length === 1) {
            this.$store.burning[tx.args[0] as string] = true;
          }
        }
        // const foundIndex = this.$.findIndex(
        //   (v) => v.id.toLowerCase() === tx.from.toLowerCase()
        // );
        // if (foundIndex >= 0) {
        //   newData[foundIndex].message = tx.args[0] as string;
        //   newData[foundIndex].pending = tx.confirmations < 1;
        //   newData[foundIndex].timestamp = Math.floor(
        //     Date.now() / 1000
        //   ).toString();
        // } else {
        //   newData.unshift({
        //     id: tx.from.toLowerCase(),
        //     message: tx.args[0] as string,
        //     timestamp: Math.floor(Date.now() / 1000).toString(),
        //     pending: tx.confirmations < 1,
        //   });
        // }
      }
    }
    this.setPartial({burning: this.$store.burning});
  }

  start(): NFTOfStore | void {
    console.log('start ' + this.currentOwner);
    if (this.$store.state !== 'Ready') {
      this.setPartial({state: 'Loading'});
    }

    this.unsubscribeFromTransactions = transactions.subscribe((txs) =>
      this.onTransactions(txs)
    );
    this._fetch();
    this.timer = setInterval(() => this._fetch(), 5000); // TODO polling interval config
    return this;
  }

  stop() {
    if (this.unsubscribeFromTransactions) {
      this.unsubscribeFromTransactions();
    }
    console.log('stop ' + this.currentOwner);
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  acknowledgeError() {
    this.setPartial({error: undefined});
  }
}

const cache: {[owner: string]: NFTOfStore} = {};
export function nftsof(owner?: string): NFTOfStore {
  const fromCache = cache[owner || ''];
  if (fromCache) {
    return fromCache;
  }
  return (cache[owner || ''] = new NFTOfStore(owner));
}
