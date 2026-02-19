import {erc721, Test, TestToRun} from 'ethereum-contracts-test-suite';
import {encodePacked, keccak256} from 'viem';
import {generatePrivateKey, privateKeyToAccount} from 'viem/accounts';

import {network} from 'hardhat';
import {setupFixtures} from './utils/index.js';
import {describe, it} from 'node:test';

const {provider, networkHelpers} = await network.connect();
const {deployAll} = setupFixtures(provider);
async function randomMintSignature(
	to: `0x${string}`,
): Promise<{signature: `0x${string}`; tokenId: bigint}> {
	const randomPrivatekey = generatePrivateKey();
	const randomAccount = privateKeyToAccount(randomPrivatekey);
	const hashedData = keccak256(
		encodePacked(['string', 'address'], ['Mandala', to]),
	);
	const signature = await randomAccount.signMessage({
		message: {raw: hashedData},
	});
	return {
		tokenId: BigInt(randomAccount.address),
		signature,
	};
}

const tests = erc721.generateTests({burn: true}, async () => {
	const {env, MandalaToken} = await networkHelpers.loadFixture(deployAll);
	async function mint(to: string): Promise<{hash: string; tokenId: string}> {
		const currentPrice = await env.read(MandalaToken, {
			functionName: 'currentPrice',
		});

		const {tokenId, signature} = await randomMintSignature(to as `0x${string}`);

		const receipt = await env.execute(MandalaToken, {
			account: to,
			functionName: 'mint',
			args: [to as `0x${string}`, signature],
			value: currentPrice,
		});
		return {
			tokenId: tokenId.toString(),
			hash: receipt.transactionHash,
		};
	}
	return {
		ethereum: env.network.provider,
		contractAddress: MandalaToken.address,
		users: env.unnamedAccounts,
		mint,
		deployer: env.namedAccounts.deployer,
	};
});

function generateTest(test: TestToRun) {
	if (test.test) {
		it(test.title, test.test);
	}
	const subTests = test.subTests;
	if (subTests) {
		describe(test.title, () => {
			for (const childTest of subTests) {
				generateTest(childTest);
			}
		});
	}
}

describe('ERC721 tests', () => {
	for (const test of tests) {
		generateTest(test);
	}
});
