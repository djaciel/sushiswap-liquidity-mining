import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const contractName = 'LiquidityMining';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  async function main() {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer, router, masterChefV1, masterChefV2 } = await getNamedAccounts();

    const deployResult = await deploy(contractName, {
      from: deployer,
      proxy: {
        proxyContract: 'OpenZeppelinTransparentProxy',
        execute: {
          init: {
            methodName: 'initialize',
            args: [router, masterChefV1, masterChefV2],
          },
        },
      },
      gasLimit: 4000000,
      log: true,
    });

    console.log(`${contractName} deployed to ${deployResult.address}`);

    return true;
  }

  await main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
};

export default func;
