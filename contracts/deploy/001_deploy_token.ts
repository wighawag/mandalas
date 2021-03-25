import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {parseEther} from '@ethersproject/units';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;

  const {deployer} = await getNamedAccounts();

  const initialPrice = parseEther('0.001');
  const creatorCutPer10000th = 500;
  const linearCoefficient = parseEther('0.0005');

  await deploy('MandalaToken', {
    from: deployer,
    log: true,
    args: [deployer, initialPrice, creatorCutPer10000th, linearCoefficient],
    proxy: !hre.network.live ? 'postUpgrade' : false,
    linkedData: {
      initialPrice: initialPrice.toString(),
      creatorCutPer10000th,
      linearCoefficient: linearCoefficient.toString(),
    },
    autoMine: true,
    skipIfAlreadyDeployed: hre.network.live,
  });
};
export default func;
func.tags = ['MandalaToken'];
