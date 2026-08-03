import {generateTokenURI, template19_bis} from 'mandalas-common';
import {BaseStore} from '$lib/utils/stores';
import {privateKeyToAccount} from 'viem/accounts';
import type {TypedDeployments} from '$lib/core/connection/types';

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

// Mandala generation is pure CPU work on the main thread. Generating a whole
// batch in one go blocks the browser long enough that it never paints the
// "generating" state. We slice the work and yield between slices so the UI
// stays responsive and the mandalas show up progressively.
const GENERATION_CHUNK_SIZE = 4;

function yieldToBrowser(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

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
	private timer: ReturnType<typeof setInterval> | undefined;
	private counter = 0; // keep count of subscription
	private random = '';
	private claimTXs: {[id: string]: Transaction} = {};
	private key: string;
	private runId = 0;
	constructor(private deployments: TypedDeployments) {
		super({
			state: 'Idle',
			error: undefined,
			tokens: [],
			startIndex: 0,
		});
		this.key = `_mandalas_generated_${deployments.chain.id}_${deployments.chain.genesisHash}_${deployments.contracts.MandalaToken.address.toLowerCase()}`;
	}

	record(id: string, hash: string, nonce: number): void {
		this.claimTXs[id] = {hash, nonce};
		if (typeof localStorage == 'undefined') {
			return;
		}
		try {
			localStorage.setItem(
				this.key,
				JSON.stringify({
					random: this.random,
					start: this.$store.startIndex,
					claimTXs: this.claimTXs,
				}),
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

	private generateToken(index: number): NFT {
		const randomBigInt = BigInt(this.random) + BigInt(index);
		// Convert to 32-byte hex string
		const privateKey = '0x' + randomBigInt.toString(16).padStart(64, '0');
		const wallet = privateKeyToAccount(privateKey as `0x${string}`);
		const id = wallet.address;
		const tokenURI = generateTokenURI(id, template19_bis);
		const jsonStart = tokenURI.indexOf(',') + 1;
		const jsonStr = tokenURI.slice(jsonStart);
		const json = JSON.parse(jsonStr);
		return {
			id,
			tokenURI,
			privateKey: privateKey, // Store the original private key
			name: json.name,
			description: json.description,
			image: json.image,
			minted: !!this.claimTXs[id],
		};
	}

	/**
	 * Generate `num` mandalas starting at `from`, appending them chunk by chunk
	 * so the browser can paint between chunks. Returns false if a newer run
	 * superseded this one (reset/regenerate), in which case the caller must not
	 * touch the store anymore.
	 */
	private async generateFrom(
		from: number,
		num: number,
		runId: number,
	): Promise<boolean> {
		for (let i = 0; i < num; i += GENERATION_CHUNK_SIZE) {
			const chunk: NFT[] = [];
			const end = Math.min(i + GENERATION_CHUNK_SIZE, num);
			for (let j = i; j < end; j++) {
				chunk.push(this.generateToken(from + j));
			}
			if (runId !== this.runId) {
				return false;
			}
			this.setPartial({tokens: this.$store.tokens.concat(chunk)});
			await yieldToBrowser();
			if (runId !== this.runId) {
				return false;
			}
		}
		return true;
	}

	async loadMore(num: number): Promise<void> {
		// Ignore while a batch is still being generated: the scroll handler fires
		// repeatedly and would otherwise pile up overlapping generations.
		if (this.$store.state !== 'Ready' || this.$store.error) {
			return;
		}
		const runId = ++this.runId;
		const from = this.$store.startIndex + this.$store.tokens.length;
		this.setPartial({state: 'Loading'});
		try {
			if (!(await this.generateFrom(from, num, runId))) {
				return;
			}
			this.setPartial({state: 'Ready'});
		} catch (e) {
			if (runId !== this.runId) {
				return;
			}
			console.error(e);
			this.setPartial({state: 'Ready', error: e});
		}
	}

	reset(): void {
		if (typeof localStorage == 'undefined') {
			return;
		}
		// invalidate any in-flight generation before the page goes away
		this.runId++;
		localStorage.clear();
		location.reload();
	}

	private loadSeed(): LocalStorageData {
		let data: LocalStorageData | undefined;
		try {
			const fromStorage = localStorage.getItem(this.key);
			if (fromStorage) {
				try {
					data = JSON.parse(fromStorage);
				} catch (e) {
					console.error(e);
				}
			}
		} catch (e) {}

		if (!data) {
			console.log(`no data`);
			const array = new Uint8Array(32);
			if (typeof window !== 'undefined') {
				console.log(`generating new mandalas....`);
				window.crypto.getRandomValues(array);
				const random =
					'0x' +
					Array.from(array)
						.map((b) => b.toString(16).padStart(2, '0'))
						.join('');
				console.log({random});
				data = {
					random,
					start: 0,
					claimTXs: {},
				};
			} else {
				console.log(`hmm, we fallback on fixed`);
				data = {
					random: '0x01',
					start: 0,
					claimTXs: {},
				};
			}

			if (!(typeof localStorage == 'undefined')) {
				try {
					localStorage.setItem(this.key, JSON.stringify(data));
				} catch (e) {
					console.error(e);
				}
			}
		}

		return data;
	}

	async generate(num: number): Promise<void> {
		const runId = ++this.runId;
		this.setPartial({state: 'Loading', error: undefined, tokens: []});
		// let the browser paint the "generating" state before we hog the main thread
		await yieldToBrowser();
		if (runId !== this.runId) {
			return;
		}
		try {
			const data = this.loadSeed();
			this.claimTXs = data.claimTXs;
			this.random = data.random;
			this.setPartial({startIndex: data.start});

			if (!(await this.generateFrom(data.start, num, runId))) {
				return;
			}
			this.setPartial({state: 'Ready'});
		} catch (e) {
			if (runId !== this.runId) {
				return;
			}
			console.error(e);
			this.setPartial({state: 'Ready', error: e});
		}
	}

	subscribe(
		run: (value: NFTs) => void,
		invalidate?: (value?: NFTs) => void,
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
