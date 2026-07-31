import contractsInfo from '../../src/lib/deployments';
import {rpc, TEST_ACCOUNT} from './wallet';

/**
 * Reads against the deployed MandalaToken, straight from the test process.
 * Used to assert that a flow really moved chain state, rather than trusting
 * what the UI says.
 */

const TOKEN = contractsInfo.contracts.MandalaToken.address as `0x${string}`;

const SELECTOR = {
	totalSupply: '0x18160ddd',
	// balanceOf(address)
	balanceOf: '0x70a08231',
};

async function call(data: string): Promise<bigint> {
	const result = await rpc<string>('eth_call', [{to: TOKEN, data}, 'latest']);
	return BigInt(result);
}

export function tokenAddress(): `0x${string}` {
	return TOKEN;
}

export function totalSupply(): Promise<bigint> {
	return call(SELECTOR.totalSupply);
}

export function balanceOf(
	address: string = TEST_ACCOUNT.address,
): Promise<bigint> {
	return call(
		SELECTOR.balanceOf + address.replace(/^0x/, '').padStart(64, '0'),
	);
}
