import { expect } from './chai-setup';
import {ethers, deployments, getUnnamedAccounts} from 'hardhat';
import {BitmapToken} from '../typechain';
import {setupUsers, waitFor} from './utils';
import {Wallet} from '@ethersproject/wallet';
import {keccak256} from '@ethersproject/solidity';
import {arrayify} from '@ethersproject/bytes';
import {generateTokenURI} from 'generative-art-common';
// import {BigNumber} from '@ethersproject/bignumber';

const setup = deployments.createFixture(async () => {
  await deployments.fixture(['BitmapToken']);
  const contracts = {
    BitmapToken: <BitmapToken>await ethers.getContract('BitmapToken'),
  };
  const users = await setupUsers(await getUnnamedAccounts(), contracts);
  return {
    ...contracts,
    users,
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

describe('BitmapToken', function () {

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

  it('uri ', async function () {
    const {users, BitmapToken} = await setup();
    const currentPrice = await BitmapToken.currentPrice();
    const {tokenId, signature} = await randomMintSignature(users[0].address);
    await users[0].BitmapToken.mint(users[0].address, signature, {value: currentPrice });
    const uri = await BitmapToken.callStatic.tokenURI(tokenId);
    console.log({uri});

    expect(uri).to.eq(generateTokenURI(tokenId))
  });

});
