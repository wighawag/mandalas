import {chain, fallback} from './wallet';
import {Wallet} from '@ethersproject/wallet';
import {BigNumber} from '@ethersproject/bignumber';
import {hexlify, hexZeroPad} from '@ethersproject/bytes';
import {BaseStore} from '../lib/utils/stores';

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
  minted: boolean;
};

type NFTs = {
  state: 'Idle' | 'Loading' | 'Ready';
  error?: unknown;
  tokens: NFT[];
  startIndex: number;
};

export class RandomNFTStore extends BaseStore<NFTs> {
  private timer: NodeJS.Timeout | undefined;
  private counter = 0;
  private random = '';
  private accounts: Wallet[] = [];
  private cache: {
    [cacheId: string]: {tokenURI: string; id: string; minted: boolean}[];
  } = {};
  constructor() {
    super({
      state: 'Idle',
      error: undefined,
      tokens: [],
      startIndex: 0,
    });
  }

  newPage(offset: number): void {
    const start = this.$store.startIndex + offset;
    this.stop();
    this.setPartial({startIndex: start, state: 'Loading', tokens: []});

    setTimeout(() => {
      const accounts: Wallet[] = [];
      for (let i = start; i < start + 12; i++) {
        accounts.push(
          new Wallet(
            hexZeroPad(BigNumber.from(this.random).add(i).toHexString(), 32)
          )
        );
      }
      const data = {
        random: this.random,
        start,
        accounts: accounts.map((v) => v.privateKey),
      };
      try {
        localStorage.setItem('_bitmap_tokens', JSON.stringify(data));
      } catch (e) {
        console.error(e);
      }

      this.accounts = [];
      for (const account of data.accounts) {
        this.accounts.push(new Wallet(account));
      }

      this.start();
    }, 200);
  }

  generate(): void {
    let data:
      | {random: string; start: number; accounts: string[]}
      | undefined = undefined;
    try {
      const fromStorage = localStorage.getItem('_bitmap_tokens');
      if (fromStorage) {
        try {
          data = JSON.parse(fromStorage);
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {}

    if (!data) {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      const random = hexlify(array);
      console.log({random});
      const start = 0;
      const accounts: Wallet[] = [];
      for (let i = start; i < start + 12; i++) {
        accounts.push(new Wallet(BigNumber.from(random).add(i).toHexString()));
      }
      data = {
        random,
        start,
        accounts: accounts.map((v) => v.privateKey),
      };
      try {
        localStorage.setItem('_bitmap_tokens', JSON.stringify(data));
      } catch (e) {
        console.error(e);
      }
    }

    this.random = data.random;
    this.accounts = [];
    for (const account of data.accounts) {
      this.accounts.push(new Wallet(account));
    }

    this.setPartial({startIndex: data.start});
  }

  accountAt(index: number): Wallet {
    return this.accounts[index];
  }

  async query(): Promise<
    null | {tokenURI: string; id: string; minted: boolean}[]
  > {
    if (this.accounts.length === 0) {
      return null;
    }
    const ids = this.accounts.map((v) => v.address);
    const cacheId = ids.join(',');
    const tokensFromCache = this.cache[cacheId];
    if (tokensFromCache) {
      return tokensFromCache;
    }
    const contracts = chain.contracts || fallback.contracts;
    if (contracts) {
      console.log(`getTokenDataForIds: ${performance.now()}`);
      const tokens = await contracts.BitmapToken.getTokenDataForIds(ids);
      this.cache[cacheId] = tokens;
      console.log(`done: ${performance.now()}`);
      // TODO support batching
      return tokens;
    } else if (fallback.state === 'Ready') {
      throw new Error('no contracts to fetch with');
    } else {
      return null;
    }
  }

  private async _fetch(start: number) {
    const result = await this.query();
    if (start !== this.$store.startIndex) {
      return;
    }
    if (!result) {
      this.setPartial({tokens: [], state: 'Loading'});
    } else {
      if (this.$store.tokens.length === 0) {
        const tmp: NFT[] = [];
        for (const token of result) {
          tmp.push({
            id: token.id,
            tokenURI: token.tokenURI,
            name: 'loading...',
            description: 'loading...',
            image: 'loading',
            minted: true
          });
        }
        this.setPartial({tokens: tmp, state: 'Ready'});
      }
      const transformed = await this._transform(result);
      if (start !== this.$store.startIndex) {
        return;
      }
      this.setPartial({tokens: transformed, state: 'Ready'});
    }
  }

  async _transform(
    tokens: {tokenURI: string; id: string; minted: boolean}[]
  ): Promise<NFT[]> {
    // TODO cache
    const newResult: NFT[] = [];
    for (const token of tokens) {
      if (token.tokenURI) {
        const tokenURI = fixURI(token.tokenURI);
        try {
          console.log(`fetch tokenURI: ${performance.now()}`);
          const response = await fetch(tokenURI);
          console.log(`fetch tokenURI DONE: ${performance.now()}`);

          console.log(`fetch json: ${performance.now()}`);
          const json = await response.json();
          console.log(`fetch json DONE: ${performance.now()}`);

          newResult.push({
            id: token.id,
            tokenURI,
            name: json.name,
            description: json.description,
            image: fixURI(json.image || json.image_url),
            minted: token.minted,
          });
        } catch (e) {
          newResult.push({
            id: token.id,
            tokenURI,
            name: '',
            description: '',
            image: '',
            error: e.message || e,
            minted: token.minted,
          }); // TODO error
        }
      } else {
        newResult.push({
          id: token.id,
          tokenURI: '',
          name: '',
          description: '',
          image: '',
          minted: token.minted,
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

  start(): RandomNFTStore | void {
    this.setPartial({state: 'Loading'});
    this._fetch(this.$store.startIndex);
    this.timer = setInterval(() => this._fetch(this.$store.startIndex), 5000); // TODO polling interval config
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

export const randomnnfts = new RandomNFTStore();
