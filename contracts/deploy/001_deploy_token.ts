import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {parseEther} from '@ethersproject/units';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();

  const initialPrice = parseEther("0.01");
  const creatorCutPer10000th = 500;

  await deploy('BitmapToken', {
    from: deployer,
    log: true,
    args:[deployer, initialPrice, creatorCutPer10000th],
    proxy: !hre.network.live ? 'postUpgrade': false,
    linkedData: {
      initialPrice: initialPrice.toString(),
      creatorCutPer10000th
    },
    autoMine: true
  });
};
export default func;
func.tags = ['BitmapToken'];
