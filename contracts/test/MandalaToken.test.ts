import {expect} from 'earl';
import {describe, it} from 'node:test';
import {network} from 'hardhat';
import {setupFixtures} from './utils/index.js';
import {generatePrivateKey, privateKeyToAccount} from 'viem/accounts';
import {encodePacked, keccak256, hexToBytes} from 'viem';
import {generateTokenURI, template19_bis} from 'mandalas-common';

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

describe('MandalaToken Specific', function () {
	it('name succeed', async function () {
		const {env, MandalaToken} = await networkHelpers.loadFixture(deployAll);
		const name = await env.read(MandalaToken, {functionName: 'name'});
		expect(name).toEqual('Mandala Tokens');
	});

	it('mint and transfer', async function () {
		const {env, MandalaToken, unnamedAccounts} =
			await networkHelpers.loadFixture(deployAll);
		const currentPrice = await env.read(MandalaToken, {
			functionName: 'currentPrice',
		});
		const {tokenId, signature} = await randomMintSignature(unnamedAccounts[0]);
		const receipt = await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'mint',
			args: [unnamedAccounts[0], signature],
			value: currentPrice,
		});
		// TODO
		// expect(receipt.events && receipt.events[0].args?.tokenId).to.eq(tokenId);
	});

	it('mint and transfer', async function () {
		const {env, MandalaToken, unnamedAccounts} =
			await networkHelpers.loadFixture(deployAll);
		const currentPrice = await env.read(MandalaToken, {
			functionName: 'currentPrice',
		});
		const {tokenId, signature} = await randomMintSignature(unnamedAccounts[0]);
		await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'mint',
			args: [unnamedAccounts[0], signature],
			value: currentPrice,
		});
		await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'transferFrom',
			args: [unnamedAccounts[0], unnamedAccounts[1], tokenId],
		});

		const owner = await env.read(MandalaToken, {
			functionName: 'ownerOf',
			args: [tokenId],
		});
		expect(owner.toLowerCase()).toEqual(unnamedAccounts[1]);
	});

	it('js uri match', async function () {
		const {env, MandalaToken, unnamedAccounts} =
			await networkHelpers.loadFixture(deployAll);
		const currentPrice = await env.read(MandalaToken, {
			functionName: 'currentPrice',
		});
		const {tokenId, signature} = await randomMintSignature(unnamedAccounts[0]);
		await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'mint',
			args: [unnamedAccounts[0], signature],
			value: currentPrice,
		});
		const uri = await env.read(MandalaToken, {
			functionName: 'tokenURI',
			args: [tokenId],
		});
		console.log({uri});

		expect(uri).toEqual(
			generateTokenURI(tokenId.toString(), template19_bis, {doNotFix: true}),
		);
	});

	it('mint, transfer, burn', async function () {
		const {env, MandalaToken, unnamedAccounts} =
			await networkHelpers.loadFixture(deployAll);
		const currentPrice = await env.read(MandalaToken, {
			functionName: 'currentPrice',
		});
		const {tokenId, signature} = await randomMintSignature(unnamedAccounts[0]);
		await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'mint',
			args: [unnamedAccounts[0], signature],
			value: currentPrice,
		});
		const currentPrice2 = await env.read(MandalaToken, {
			functionName: 'currentPrice',
		});
		await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'transferFrom',
			args: [unnamedAccounts[0], unnamedAccounts[1], tokenId],
		});
		const balanceBefore = await env.viem.publicClient.getBalance({
			address: unnamedAccounts[1],
		});

		const receipt = await env.execute(MandalaToken, {
			account: unnamedAccounts[1],
			functionName: 'burn',
			args: [tokenId],
		});

		const txCost = BigInt(receipt.effectiveGasPrice) * BigInt(receipt.gasUsed);
		const balanceAfter = await env.viem.publicClient.getBalance({
			address: unnamedAccounts[1],
		});
		const expectedBalance =
			balanceBefore -
			(txCost +
				(currentPrice *
					(10000n - BigInt(MandalaToken.linkedData.creatorCutPer10000th))) /
					10000n);
		expect(balanceAfter).toEqual(expectedBalance);
	});

	it('mint, burn, burn, fails', async function () {
		const {env, MandalaToken, unnamedAccounts} =
			await networkHelpers.loadFixture(deployAll);
		const currentPrice = await env.read(MandalaToken, {
			functionName: 'currentPrice',
		});
		const {tokenId, signature} = await randomMintSignature(unnamedAccounts[0]);
		await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'mint',
			args: [unnamedAccounts[0], signature],
			value: currentPrice,
		});
		await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'transferFrom',
			args: [unnamedAccounts[0], unnamedAccounts[1], tokenId],
		});
		await env.execute(MandalaToken, {
			account: unnamedAccounts[1],
			functionName: 'burn',
			args: [tokenId],
		});

		await expect(
			env.execute(MandalaToken, {
				account: unnamedAccounts[1],
				functionName: 'burn',
				args: [tokenId],
			}),
		).toBeRejectedWith('ALREADY_BURNT');
	});

	it('mint, burn, mint, fails', async function () {
		const {env, MandalaToken, unnamedAccounts} =
			await networkHelpers.loadFixture(deployAll);
		const currentPrice = await env.read(MandalaToken, {
			functionName: 'currentPrice',
		});
		const {tokenId, signature} = await randomMintSignature(unnamedAccounts[0]);
		await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'mint',
			args: [unnamedAccounts[0], signature],
			value: currentPrice,
		});
		await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'transferFrom',
			args: [unnamedAccounts[0], unnamedAccounts[1], tokenId],
		});
		await env.execute(MandalaToken, {
			account: unnamedAccounts[1],
			functionName: 'burn',
			args: [tokenId],
		});

		await expect(
			env.execute(MandalaToken, {
				account: unnamedAccounts[1],
				functionName: 'mint',
				args: [unnamedAccounts[0], signature],
				value: currentPrice,
			}),
		).toBeRejectedWith('ALREADY_MINTED');
	});

	it('mint, mint, mint transfer, burn', async function () {
		const {env, MandalaToken, unnamedAccounts} =
			await networkHelpers.loadFixture(deployAll);
		const currentPrice = await env.read(MandalaToken, {
			functionName: 'currentPrice',
		});
		const {tokenId, signature} = await randomMintSignature(unnamedAccounts[0]);
		await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'mint',
			args: [unnamedAccounts[0], signature],
			value: currentPrice,
		});
		await env.execute(MandalaToken, {
			account: unnamedAccounts[0],
			functionName: 'transferFrom',
			args: [unnamedAccounts[0], unnamedAccounts[1], tokenId],
		});

		const currentPrice3 = await env.read(MandalaToken, {
			functionName: 'currentPrice',
		});
		const {signature: signature3} = await randomMintSignature(
			unnamedAccounts[0],
		);
		const receipt3 = await env.execute(MandalaToken, {
			account: unnamedAccounts[3],
			functionName: 'mint',
			args: [unnamedAccounts[3], signature3],
			value: currentPrice3,
		});

		console.log(JSON.stringify(receipt3, null, 2));

		const currentPrice4 = await env.read(MandalaToken, {
			functionName: 'currentPrice',
		});
		const {signature: signature4} = await randomMintSignature(
			unnamedAccounts[0],
		);
		console.log(currentPrice4);
		const receipt4 = await env.execute(MandalaToken, {
			account: unnamedAccounts[4],
			functionName: 'mint',
			args: [unnamedAccounts[4], signature4],
			value: currentPrice4,
		});
		console.log(JSON.stringify(receipt4, null, 2));

		const balanceBefore = await env.viem.publicClient.getBalance({
			address: unnamedAccounts[1],
		});

		const supply = await env.read(MandalaToken, {
			functionName: 'totalSupply',
		});
		// const newCurrentPrice = await MandalaToken.currentPrice();
		const burnPrice =
			BigInt(MandalaToken.linkedData.initialPrice) +
			((supply - 1n) *
				BigInt(MandalaToken.linkedData.linearCoefficient) *
				(10000n - BigInt(MandalaToken.linkedData.creatorCutPer10000th))) /
				10000n;

		const receipt = await env.execute(MandalaToken, {
			account: unnamedAccounts[1],
			functionName: 'burn',
			args: [tokenId],
		});
		const txCost = BigInt(receipt.effectiveGasPrice) * BigInt(receipt.gasUsed);
		const balanceAfter = await env.viem.publicClient.getBalance({
			address: unnamedAccounts[1],
		});
		expect(balanceAfter).toEqual(balanceBefore - txCost + burnPrice);
	});
});
