import type {Page} from '@playwright/test';
import {privateKeyToAccount} from 'viem/accounts';

/**
 * A wallet for the browser, implemented in the test rather than in the app.
 *
 * It announces itself over EIP-6963 (and as `window.ethereum`), holds a funded
 * local key, signs `eth_sendTransaction` itself and submits the raw
 * transaction. Everything else is proxied straight to the node. So tests drive
 * the real connect-and-transact paths, with real transactions against a real
 * deployed contract, without a browser extension.
 *
 * Keeping it here rather than adding a burner-wallet dependency to the app
 * means the thing under test stays exactly what ships.
 */

/** hardhat account #0 under the standard test mnemonic; funded by the node. */
export const TEST_ACCOUNT = {
	address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266' as const,
	privateKey:
		'0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const,
};

export const RPC_URL = process.env.E2E_RPC_URL || 'http://127.0.0.1:8545';
export const CHAIN_ID = Number(process.env.E2E_CHAIN_ID || 31337);

export type WalletOptions = {
	/** Reject `eth_requestAccounts`, i.e. the user declines to connect. */
	rejectConnection?: boolean;
	/** Reject `eth_sendTransaction`, i.e. the user declines the transaction. */
	rejectTransaction?: boolean;
};

/**
 * Install the wallet. Must be called before `page.goto`, so the provider is
 * announced before the app looks for one.
 */
export async function installWallet(page: Page, options: WalletOptions = {}) {
	const account = privateKeyToAccount(TEST_ACCOUNT.privateKey);

	// Signing happens here, in node, and is exposed to the page. The page side
	// stays a thin EIP-1193 shim.
	await page.exposeFunction(
		'__e2eSignTransaction',
		async (tx: {to: string; data?: string; value?: string; gas?: string}) => {
			const nonce = await rpc<string>('eth_getTransactionCount', [
				TEST_ACCOUNT.address,
				'pending',
			]).then((v) => parseInt(v, 16));

			return account.signTransaction({
				chainId: CHAIN_ID,
				to: tx.to as `0x${string}`,
				data: tx.data as `0x${string}` | undefined,
				value: tx.value ? BigInt(tx.value) : 0n,
				gas: tx.gas ? BigInt(tx.gas) : 3_000_000n,
				maxFeePerGas: 2_000_000_000n,
				maxPriorityFeePerGas: 1_000_000_000n,
				nonce,
				type: 'eip1559',
			});
		},
	);

	await page.addInitScript(
		({rpcUrl, address, rejectConnection, rejectTransaction}) => {
			const calls: string[] = [];
			(window as any).__walletCalls = calls;
			// Mutable so a test can set up (mint something) with a cooperative
			// wallet and only then start declining. See `setRejectTransaction`.
			const opts = {rejectConnection, rejectTransaction};
			(window as any).__walletOptions = opts;

			const send = async (method: string, params: unknown[] = []) => {
				const res = await fetch(rpcUrl, {
					method: 'POST',
					headers: {'content-type': 'application/json'},
					body: JSON.stringify({
						jsonrpc: '2.0',
						id: Date.now() + Math.random(),
						method,
						params,
					}),
				});
				const json = await res.json();
				if (json.error) {
					const err: any = new Error(json.error.message);
					err.code = json.error.code;
					throw err;
				}
				return json.result;
			};

			const rejected = () => {
				const err: any = new Error('User rejected the request.');
				err.code = 4001;
				return err;
			};

			const provider = {
				isMetaMask: true,
				request: async (args: {method: string; params?: unknown[]}) => {
					const {method} = args;
					const params = args.params || [];
					calls.push(method);

					if (method === 'eth_accounts') return [address];
					if (method === 'eth_requestAccounts') {
						if (opts.rejectConnection) throw rejected();
						return [address];
					}
					if (method === 'wallet_requestPermissions') {
						if (opts.rejectConnection) throw rejected();
						return [{parentCapability: 'eth_accounts'}];
					}
					if (method === 'eth_sendTransaction') {
						if (opts.rejectTransaction) throw rejected();
						const signed = await (window as any).__e2eSignTransaction(
							params[0],
						);
						return send('eth_sendRawTransaction', [signed]);
					}
					return send(method, params);
				},
				on: () => {},
				removeListener: () => {},
			};

			(window as any).ethereum = provider;

			const info = {
				uuid: '00000000-0000-0000-0000-0000000000e2',
				name: 'E2EWallet',
				icon: 'data:image/svg+xml;base64,PHN2Zy8+',
				rdns: 'io.mandalas.e2e',
			};
			const announce = () =>
				window.dispatchEvent(
					new CustomEvent('eip6963:announceProvider', {
						detail: Object.freeze({info, provider}),
					}),
				);
			window.addEventListener('eip6963:requestProvider', announce);
			announce();
		},
		{
			rpcUrl: RPC_URL,
			address: TEST_ACCOUNT.address,
			rejectConnection: !!options.rejectConnection,
			rejectTransaction: !!options.rejectTransaction,
		},
	);
}

/** Wallet methods the page asked for, in order. */
export function walletCalls(page: Page): Promise<string[]> {
	return page.evaluate(() => (window as any).__walletCalls || []);
}

/**
 * Start (or stop) declining transactions, without reloading. Lets a test set
 * itself up with a cooperative wallet and only then simulate the user
 * declining the action under test.
 */
export function setRejectTransaction(page: Page, reject: boolean) {
	return page.evaluate((value) => {
		const opts = (window as any).__walletOptions;
		if (opts) opts.rejectTransaction = value;
	}, reject);
}

/** Pick the injected wallet if the app is showing a wallet picker. */
export async function chooseWallet(page: Page) {
	const button = page.locator('button:has-text("E2EWallet")');
	if (await button.count()) {
		await button.first().click();
	}
}

/** Direct JSON-RPC to the node, from the test process. */
export async function rpc<T = unknown>(
	method: string,
	params: unknown[] = [],
): Promise<T> {
	const res = await fetch(RPC_URL, {
		method: 'POST',
		headers: {'content-type': 'application/json'},
		body: JSON.stringify({jsonrpc: '2.0', id: 1, method, params}),
	});
	const json = await res.json();
	if (json.error) throw new Error(json.error.message);
	return json.result as T;
}
