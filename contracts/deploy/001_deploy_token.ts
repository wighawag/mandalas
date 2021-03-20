import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {parseEther} from '@ethersproject/units';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();

  await deploy('BitmapToken', {
    from: deployer,
    log: true,
    args:[deployer, parseEther("0.01"), 500],
    proxy: !hre.network.live ? 'postUpgrade': false
  });
};
export default func;
func.tags = ['BitmapToken'];
