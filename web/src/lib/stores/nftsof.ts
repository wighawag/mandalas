import {BaseStore} from '$lib/utils/stores';
import contractsInfo from '$lib/deployments';
import type {PublicClient} from 'viem';

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
  id: bigint;
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

export class NFTOfStore extends BaseStore<NFTs> {
  private timer: ReturnType<typeof setInterval> | undefined;
  private counter = 0;
  private currentOwner?: string;

  constructor(
    private publicClient: PublicClient,
    owner?: string,
  ) {
    super({
      state: 'Idle',
      error: undefined,
      tokens: [],
      burning: {},
    });
    this.currentOwner = owner?.toLowerCase();
  }

  async query(address: string): Promise<null | {tokenURI: string; id: bigint}[]> {
    if (this.publicClient) {
      try {
        const numTokens = (await this.publicClient.readContract({
          address: contractsInfo.contracts.MandalaToken.address as `0x${string}`,
          abi: contractsInfo.contracts.MandalaToken.abi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        })) as bigint;

        if (numTokens === BigInt(0)) {
          return [];
        }

        const MandalaToken = contractsInfo.contracts.MandalaToken;
        const tokens = await this.publicClient.readContract({
          ...MandalaToken,
          functionName: 'getTokenDataOfOwner',
          args: [address as `0x${string}`, BigInt(0), numTokens],
        });

        const result: {tokenURI: string; id: bigint}[] = [];
        for (const token of tokens) {
          result.push({
            tokenURI: token.tokenURI.replace(
              'image-rendering: pixelated;',
              'image-rendering: pixelated; image-rendering: crisp-edges;',
            ),
            id: token.id,
          });
        }

        return result;
      } catch (e) {
        console.error('Error fetching NFTs:', e);
        return null;
      }
    }
    return null;
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
        if (owner === this.currentOwner) {
          this.setPartial({tokens: transformed, state: 'Ready'});
        }
      }
    } else {
      this.setPartial({tokens: [], state: 'Ready'});
    }
  }

  async _transform(tokens: {tokenURI: string; id: bigint}[]): Promise<NFT[]> {
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
            error: (e as Error).message || String(e),
          });
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

  subscribe(run: (value: NFTs) => void, invalidate?: (value?: NFTs) => void): () => void {
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

  start(): NFTOfStore | void {
    console.log('start ' + this.currentOwner);
    if (this.$store.state !== 'Ready') {
      this.setPartial({state: 'Loading'});
    }
    this._fetch();
    this.timer = setInterval(() => this._fetch(), 5000); // TODO polling interval config
    return this;
  }

  stop() {
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
