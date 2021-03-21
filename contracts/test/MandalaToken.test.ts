import { expect } from './chai-setup';
import {ethers, deployments, getUnnamedAccounts} from 'hardhat';
import {MandalaToken} from '../typechain';
import {setupUsers, waitFor} from './utils';
import {Wallet} from '@ethersproject/wallet';
import {keccak256} from '@ethersproject/solidity';
import {arrayify} from '@ethersproject/bytes';
import {generateTokenURI, template19_bis} from 'mandalas-common';
import { BigNumber } from 'ethers';
// import {BigNumber} from '@ethersproject/bignumber';

const setup = deployments.createFixture(async () => {
  await deployments.fixture(['MandalaToken']);
  const deployment = await deployments.get('MandalaToken')
  const contracts = {
    MandalaToken: <MandalaToken>await ethers.getContract('MandalaToken'),
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
    ['Mandala', to]
  );
  const signature = await randomWallet.signMessage(arrayify(hashedData));
  return {
    tokenId: randomWallet.address,
    signature
  };
}

describe('MandalaToken Specific', function () {

  it('name succeed', async function () {
    const {users} = await setup();
    const name = await users[0].MandalaToken.name();
    expect(name).to.equal('Mandala Tokens');
  });

  it('mint and transfer', async function () {
    const {users, MandalaToken} = await setup();
    const currentPrice = await MandalaToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    const receipt = await waitFor(users[0].MandalaToken.mint(users[0].address, signature, {value: currentPrice }));
    expect(receipt.events && receipt.events[0].args?.tokenId).to.eq(tokenId);
  });

  it('mint and transfer', async function () {
    const {users, MandalaToken} = await setup();
    const currentPrice = await MandalaToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    await users[0].MandalaToken.mint(users[0].address, signature, {value: currentPrice });
    await users[0].MandalaToken.transferFrom(users[0].address, users[1].address, tokenId);
    const owner = await MandalaToken.callStatic.ownerOf(tokenId);
    expect(owner).to.equal(users[1].address);
  });

  it('js uri match', async function () {
    const {users, MandalaToken} = await setup();
    const currentPrice = await MandalaToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    await users[0].MandalaToken.mint(users[0].address, signature, {value: currentPrice });
    const uri = await MandalaToken.callStatic.tokenURI(tokenId);
    console.log({uri});

    expect(uri).to.eq(generateTokenURI(tokenId, template19_bis))
  });


  it('mint, transfer, burn', async function () {
    const {users, MandalaToken, linkedData} = await setup();
    const currentPrice = await MandalaToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    await users[0].MandalaToken.mint(users[0].address, signature, {value: currentPrice });
    await users[0].MandalaToken.transferFrom(users[0].address, users[1].address, tokenId);
    const balanceBefore = await ethers.provider.getBalance(users[1].address);
    const gasPrice = await ethers.provider.getGasPrice();
    const receipt = await waitFor(users[1].MandalaToken.burn(tokenId, {gasPrice}));
    const txCost = gasPrice.mul(receipt.gasUsed);
    const balanceAfter = await ethers.provider.getBalance(users[1].address);
    expect(balanceAfter).to.equal(balanceBefore.sub(txCost).add(currentPrice.mul(10000 - linkedData.creatorCutPer10000th).div(10000)));
  });

  it('mint, burn, burn, fails', async function () {
    const {users, MandalaToken} = await setup();
    const currentPrice = await MandalaToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    await users[0].MandalaToken.mint(users[0].address, signature, {value: currentPrice });
    await users[0].MandalaToken.transferFrom(users[0].address, users[1].address, tokenId);
    await waitFor(users[1].MandalaToken.burn(tokenId));
    await expect(users[1].MandalaToken.burn(tokenId)).to.be.revertedWith("ALREADY_BURNT");
  });

  it('mint, burn, mint, fails', async function () {
    const {users, MandalaToken} = await setup();
    const currentPrice = await MandalaToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    await users[0].MandalaToken.mint(users[0].address, signature, {value: currentPrice });
    await users[0].MandalaToken.transferFrom(users[0].address, users[1].address, tokenId);
    await waitFor(users[1].MandalaToken.burn(tokenId));
    await expect(users[1].MandalaToken.mint(users[0].address, signature, {value: currentPrice })).to.be.revertedWith("ALREADY_MINTED");
  });

  it('mint, mint, mint transfer, burn', async function () {
    const {users, MandalaToken, linkedData} = await setup();
    const currentPrice = await MandalaToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    await users[0].MandalaToken.mint(users[0].address, signature, {value: currentPrice });
    await users[0].MandalaToken.transferFrom(users[0].address, users[1].address, tokenId);

    const currentPrice3 = await MandalaToken.currentPrice();
    const {signature: signature3} = await randomMintSignature(users[0].address);
    await users[3].MandalaToken.mint(users[3].address, signature3, {value: currentPrice3 });

    const currentPrice4 = await MandalaToken.currentPrice();
    const {signature: signature4} = await randomMintSignature(users[0].address);
    await users[4].MandalaToken.mint(users[4].address, signature4, {value: currentPrice4 });

    const balanceBefore = await ethers.provider.getBalance(users[1].address);
    const gasPrice = await ethers.provider.getGasPrice();
    const supply = await MandalaToken.totalSupply();
    // const newCurrentPrice = await MandalaToken.currentPrice();
    const burnPrice = BigNumber.from(linkedData.initialPrice).add(supply.sub(1).mul(linkedData.linearCoefficient)).mul(10000 - linkedData.creatorCutPer10000th).div(10000);
    const receipt = await waitFor(users[1].MandalaToken.burn(tokenId, {gasPrice}));
    const txCost = gasPrice.mul(receipt.gasUsed);
    const balanceAfter = await ethers.provider.getBalance(users[1].address);
    expect(balanceAfter).to.equal(balanceBefore.sub(txCost).add(burnPrice));
  });


});
