import { expect } from './chai-setup';
import {ethers, deployments, getUnnamedAccounts} from 'hardhat';
import {BitmapToken} from '../typechain';
import {setupUsers} from './utils';

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

describe('BitmapToken', function () {

  it('name succeed', async function () {
    const {users} = await setup();
    const name = await users[0].BitmapToken.name();
    expect(name).to.equal('Bitmap Art Token');
  });

  it('mint and transfer', async function () {
    const {users,BitmapToken} = await setup();
    await users[0].BitmapToken.mint(1);
    await users[0].BitmapToken.transferFrom(users[0].address, users[1].address, 1);
    const owner = await BitmapToken.callStatic.ownerOf(1);
    expect(owner).to.equal(users[1].address);
  });
});
