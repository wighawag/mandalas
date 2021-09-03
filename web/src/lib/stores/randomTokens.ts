import {generateTokenURI, template19_bis} from 'mandalas-common';
import {BigNumber} from '@ethersproject/bignumber';
import {Wallet} from '@ethersproject/wallet';
import {hexlify, hexZeroPad} from '@ethersproject/bytes';
import {BaseStore} from '$lib/utils/stores';

type NFT = {
  id: string;
  tokenURI: string;
  privateKey: string;
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

type Transaction = {
  hash: string;
  nonce: number;
};
type LocalStorageData = {
  claimTXs: {[id: string]: Transaction};
  random: string;
  start: number;
};

export class RandomTokenStore extends BaseStore<NFTs> {
  private timer: NodeJS.Timeout | undefined;
  private counter = 0; // keep count of subscription
  private random = '';
  private claimTXs: {[id: string]: Transaction} = {};
  constructor() {
    super({
      state: 'Ready',
      error: undefined,
      tokens: [],
      startIndex: 0,
    });

    // TODO remove
    // let currentTemplate = template19
    // window.addEventListener('click', () => {
    //   if (currentTemplate === template19) {
    //     currentTemplate = template19_bis;
    //   } else {
    //     currentTemplate = template19;
    //   }
    //   for (const token of this.$store.tokens) {
    //     const tokenURI = generateTokenURI(token.id, currentTemplate);
    //     const jsonStart = tokenURI.indexOf(",") + 1;
    //     const jsonStr = tokenURI.slice(jsonStart);
    //     const json = JSON.parse(jsonStr);
    //     token.image = json.image || json.image_url;
    //   }
    //   this.setPartial({tokens: this.$store.tokens});
    // })
  }

  record(id: string, hash: string, nonce: number): void {
    this.claimTXs[id] = {hash, nonce};
    try {
      localStorage.setItem(
        '_mandalas_generated',
        JSON.stringify({
          random: this.random,
          start: this.$store.startIndex,
          claimTXs: this.claimTXs,
        })
      );
    } catch (e) {
      console.error(e);
    }
    for (const token of this.$store.tokens) {
      if (token.id === id) {
        token.minted = true;
        break;
      }
    }
    this.setPartial({tokens: this.$store.tokens});
  }

  loadMore(num: number): void {
    const from = this.$store.startIndex + this.$store.tokens.length;
    const tokens = [];
    for (let i = 0; i < num; i++) {
      const wallet = new Wallet(
        BigNumber.from(this.random)
          .add(from + i)
          .toHexString()
      );
      const id = wallet.address;
      const tokenURI = generateTokenURI(id, template19_bis);
      const jsonStart = tokenURI.indexOf(',') + 1;
      const jsonStr = tokenURI.slice(jsonStart);
      const json = JSON.parse(jsonStr);
      tokens.push({
        id,
        tokenURI,
        privateKey: wallet.privateKey,
        name: json.name,
        description: json.description,
        image: json.image,
        minted: this.claimTXs[id] ? true : false,
      });
    }
    this.setPartial({tokens: this.$store.tokens.concat(tokens)});
  }

  reset(): void {
    localStorage.clear();
    location.reload();
  }

  generate(num: number): void {
    let data: LocalStorageData | undefined;
    try {
      const fromStorage = localStorage.getItem('_mandalas_generated');
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
      if (typeof window !== "undefined") {
        window.crypto.getRandomValues(array);
        const random = hexlify(array);
        console.log({random});
        data = {
          random,
          start: 0,
          claimTXs: {},
        };
      } else {
        data = {
          random: "0x01",
          start: 0,
          claimTXs: {}
        }
      }

      try {
        localStorage.setItem('_mandalas_generated', JSON.stringify(data));
      } catch (e) {
        console.error(e);
      }
    }

    this.claimTXs = data.claimTXs;

    this.random = data.random;
    const tokens = [];

    for (let i = data.start; i < data.start + num; i++) {
      const wallet = new Wallet(
        hexZeroPad(BigNumber.from(data.random).add(i).toHexString(), 40)
      );
      const id = wallet.address;
      const tokenURI = generateTokenURI(id, template19_bis);
      const jsonStart = tokenURI.indexOf(',') + 1;
      const jsonStr = tokenURI.slice(jsonStart);
      const json = JSON.parse(jsonStr);
      tokens.push({
        id,
        tokenURI,
        privateKey: wallet.privateKey,
        name: json.name,
        description: json.description,
        image: json.image,
        minted: data.claimTXs[id] ? true : false,
      });
      // console.log(tokens[tokens.length -1])
    }

    this.setPartial({startIndex: data.start, tokens});
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

  start(): RandomTokenStore | void {
    // this.setPartial({state: 'Loading'});
    // return this;
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

export const randomTokens = new RandomTokenStore();
