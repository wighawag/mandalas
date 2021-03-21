import { expect } from './chai-setup';
import {ethers, deployments, getUnnamedAccounts} from 'hardhat';
import {BitmapToken} from '../typechain';
import {setupUsers, waitFor} from './utils';
import {Wallet} from '@ethersproject/wallet';
import {keccak256} from '@ethersproject/solidity';
import {arrayify} from '@ethersproject/bytes';
import {generateTokenURI} from 'mandalas-common';
import { BigNumber } from 'ethers';
// import {BigNumber} from '@ethersproject/bignumber';

const setup = deployments.createFixture(async () => {
  await deployments.fixture(['BitmapToken']);
  const deployment = await deployments.get('BitmapToken')
  const contracts = {
    BitmapToken: <BitmapToken>await ethers.getContract('BitmapToken'),
  };
  const users = await setupUsers(await getUnnamedAccounts(), contracts);
  return {
    ...contracts,
    users,
    linkedData: deployment.linkedData as {initialPrice: string, creatorCutPer10000th: number, linearCoefficient: string}
  };
});

async function randomMintSignature(to: string): Promise<{signature: string, tokenId: string}> {
  const randomWallet = Wallet.createRandom();
  const hashedData = keccak256(
    ['string', 'address'],
    ['Bitmap', to]
  );
  const signature = await randomWallet.signMessage(arrayify(hashedData));
  return {
    tokenId: randomWallet.address,
    signature
  };
}

describe('BitmapToken Specific', function () {

  it('name succeed', async function () {
    const {users} = await setup();
    const name = await users[0].BitmapToken.name();
    expect(name).to.equal('Bitmap Art Token');
  });

  it('mint and transfer', async function () {
    const {users, BitmapToken} = await setup();
    const currentPrice = await BitmapToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    const receipt = await waitFor(users[0].BitmapToken.mint(users[0].address, signature, {value: currentPrice }));
    expect(receipt.events && receipt.events[0].args?.tokenId).to.eq(tokenId);
  });

  it('mint and transfer', async function () {
    const {users, BitmapToken} = await setup();
    const currentPrice = await BitmapToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    await users[0].BitmapToken.mint(users[0].address, signature, {value: currentPrice });
    await users[0].BitmapToken.transferFrom(users[0].address, users[1].address, tokenId);
    const owner = await BitmapToken.callStatic.ownerOf(tokenId);
    expect(owner).to.equal(users[1].address);
  });

  it('js uri match', async function () {
    const {users, BitmapToken} = await setup();
    const currentPrice = await BitmapToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    await users[0].BitmapToken.mint(users[0].address, signature, {value: currentPrice });
    const uri = await BitmapToken.callStatic.tokenURI(tokenId);
    console.log({uri});

    expect(uri).to.eq(generateTokenURI(tokenId))
  });


  it('mint, transfer, burn', async function () {
    const {users, BitmapToken, linkedData} = await setup();
    const currentPrice = await BitmapToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    await users[0].BitmapToken.mint(users[0].address, signature, {value: currentPrice });
    await users[0].BitmapToken.transferFrom(users[0].address, users[1].address, tokenId);
    const balanceBefore = await ethers.provider.getBalance(users[1].address);
    const gasPrice = await ethers.provider.getGasPrice();
    const receipt = await waitFor(users[1].BitmapToken.burn(tokenId, {gasPrice}));
    const txCost = gasPrice.mul(receipt.gasUsed);
    const balanceAfter = await ethers.provider.getBalance(users[1].address);
    expect(balanceAfter).to.equal(balanceBefore.sub(txCost).add(currentPrice.mul(10000 - linkedData.creatorCutPer10000th).div(10000)));
  });

  it('mint, mint, mint transfer, burn', async function () {
    const {users, BitmapToken, linkedData} = await setup();
    const currentPrice = await BitmapToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    await users[0].BitmapToken.mint(users[0].address, signature, {value: currentPrice });
    await users[0].BitmapToken.transferFrom(users[0].address, users[1].address, tokenId);

    const currentPrice3 = await BitmapToken.currentPrice();
    const {signature: signature3} = await randomMintSignature(users[0].address);
    await users[3].BitmapToken.mint(users[3].address, signature3, {value: currentPrice3 });

    const currentPrice4 = await BitmapToken.currentPrice();
    const {signature: signature4} = await randomMintSignature(users[0].address);
    await users[4].BitmapToken.mint(users[4].address, signature4, {value: currentPrice4 });

    const balanceBefore = await ethers.provider.getBalance(users[1].address);
    const gasPrice = await ethers.provider.getGasPrice();
    const supply = await BitmapToken.totalSupply();
    // const newCurrentPrice = await BitmapToken.currentPrice();
    const burnPrice = BigNumber.from(linkedData.initialPrice).add(supply.sub(1).mul(linkedData.linearCoefficient)).mul(10000 - linkedData.creatorCutPer10000th).div(10000);
    const receipt = await waitFor(users[1].BitmapToken.burn(tokenId, {gasPrice}));
    const txCost = gasPrice.mul(receipt.gasUsed);
    const balanceAfter = await ethers.provider.getBalance(users[1].address);
    expect(balanceAfter).to.equal(balanceBefore.sub(txCost).add(burnPrice));
  });


});
