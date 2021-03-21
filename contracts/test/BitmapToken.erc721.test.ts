import {
  deployments,
  getUnnamedAccounts,
  getNamedAccounts,
  network,
  ethers,
} from 'hardhat';
import {Wallet} from '@ethersproject/wallet';
import {keccak256} from '@ethersproject/solidity';
import {arrayify} from '@ethersproject/bytes';

import {erc721} from 'ethereum-contracts-test-suite';

async function randomMintSignature(
  to: string
): Promise<{signature: string; tokenId: string}> {
  const randomWallet = Wallet.createRandom();
  const hashedData = keccak256(['string', 'address'], ['Bitmap', to]);
  const signature = await randomWallet.signMessage(arrayify(hashedData));
  return {
    tokenId: randomWallet.address,
    signature,
  };
}

erc721.runMochaTests('BitmapToken ERC721', {burn: true}, async () => {
  await deployments.fixture(['BitmapToken']);
  const {deployer} = await getNamedAccounts();
  const BitmapToken = await deployments.get('BitmapToken');
  const users = await getUnnamedAccounts();
  async function mint(to: string): Promise<{hash: string; tokenId: string}> {
    const BitmapTokenContract = await ethers.getContract('BitmapToken', to);
    const currentPrice = await BitmapTokenContract.currentPrice();
    const {tokenId, signature} = await randomMintSignature(to);
    const tx = await BitmapTokenContract.mint(to, signature, {
      value: currentPrice,
    });
    await tx.wait();
    return {
      tokenId,
      hash: tx.hash,
    };
  }
  return {
    ethereum: network.provider,
    contractAddress: BitmapToken.address,
    users,
    mint,
    deployer,
  };
});
