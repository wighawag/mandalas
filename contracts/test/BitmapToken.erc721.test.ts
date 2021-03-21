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
  const hashedData = keccak256(['string', 'address'], ['Mandala', to]);
  const signature = await randomWallet.signMessage(arrayify(hashedData));
  return {
    tokenId: randomWallet.address,
    signature,
  };
}

erc721.runMochaTests('MandalaToken ERC721', {burn: true}, async () => {
  await deployments.fixture(['MandalaToken']);
  const {deployer} = await getNamedAccounts();
  const MandalaToken = await deployments.get('MandalaToken');
  const users = await getUnnamedAccounts();
  async function mint(to: string): Promise<{hash: string; tokenId: string}> {
    const MandalaTokenContract = await ethers.getContract('MandalaToken', to);
    const currentPrice = await MandalaTokenContract.currentPrice();
    const {tokenId, signature} = await randomMintSignature(to);
    const tx = await MandalaTokenContract.mint(to, signature, {
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
    contractAddress: MandalaToken.address,
    users,
    mint,
    deployer,
  };
});
