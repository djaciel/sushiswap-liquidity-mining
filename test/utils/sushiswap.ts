import UniswapV2FactoryContract from '@uniswap/v2-core/build/UniswapV2Factory.json';
import UniswapV2Router02Contract from '@uniswap/v2-periphery/build/UniswapV2Router02.json';
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json';
import WETHContract from '@uniswap/v2-periphery/build/WETH9.json';
import { deployContract } from 'ethereum-waffle';
import { BigNumber, Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { MasterChef, MasterChefV2, SushiToken, Token } from '../../typechain-types';

let WETH: Contract,
  shushiswapV2Factory: Contract,
  sushiswapV2Router02: Contract,
  masterChefV1: MasterChef,
  masterChefV2: MasterChefV2,
  sushiToken: SushiToken;

export const deadline: BigNumber = ethers.BigNumber.from('2').pow('256').sub('2');

export interface DeployResult {
  WETH: Contract;
  shushiswapV2Factory: Contract;
  sushiswapV2Router02: Contract;
  masterChefV1: MasterChef;
  masterChefV2: MasterChefV2;
  sushiToken: SushiToken;
}

export const deploy = async ({ owner }: { owner: Signer }) => {
  // deploy WETH
  WETH = await deployContract(owner, WETHContract);

  // deploy Factory
  shushiswapV2Factory = await deployContract(owner, UniswapV2FactoryContract, [
    await owner.getAddress(),
  ]);

  // deploy Router
  sushiswapV2Router02 = await deployContract(
    owner,
    UniswapV2Router02Contract,
    [shushiswapV2Factory.address, WETH.address],
    {
      gasLimit: 9500000,
    }
  );

  // deploy Sushi Token
  const SushiTokenContract = await ethers.getContractFactory(
    'contracts/test/SushiToken.sol:SushiToken'
  );
  sushiToken = (await SushiTokenContract.deploy()) as SushiToken;

  // deploy MasterChefV1
  const MasterChefContract = await ethers.getContractFactory('MasterChef');
  masterChefV1 = (await MasterChefContract.deploy(
    sushiToken.address,
    await owner.getAddress(),
    ethers.utils.parseUnits('1', 'ether'),
    0,
    0
  )) as MasterChef;

  // deploy tokenDummy used by the MASTER_PID in MasterChefV2
  const Token = await ethers.getContractFactory('Token');
  const tokenDummy = (await Token.deploy('Token_DUMMY', 'TDMY')) as Token;

  // create the MASTER_PID used by MasterChefV2
  await addMasterChefV1(tokenDummy.address);

  // deploy MasterChefV2
  const MasterChefV2Contract = await ethers.getContractFactory('MasterChefV2');
  masterChefV2 = (await MasterChefV2Contract.deploy(
    masterChefV1.address,
    sushiToken.address,
    0 // index of the MASTER_PID previously created
  )) as MasterChefV2;

  // mint some Sushi to MasterChefV1 and MasterChefV2
  await sushiToken.mint(masterChefV1.address, ethers.utils.parseUnits('1000', 'ether'));
  await sushiToken.mint(masterChefV2.address, ethers.utils.parseUnits('1000', 'ether'));

  // transfer ownership of Sushi token to MasterChefV1
  await sushiToken.transferOwnership(masterChefV1.address);

  return {
    WETH,
    shushiswapV2Factory,
    sushiswapV2Router02,
    masterChefV1,
    masterChefV2,
    sushiToken,
  };
};

export const createPair = async (token0: string, token1: string) => {
  await shushiswapV2Factory.createPair(token0, token1);
  const pairAddress = await shushiswapV2Factory.getPair(token0, token1);
  const pair = await ethers.getContractAt(IUniswapV2Pair.abi, pairAddress);
  return pair;
};

export const addLiquidity = async ({
  owner,
  token0,
  amountA,
  token1,
  amountB,
}: {
  owner: Signer;
  token0: Contract;
  amountA: BigNumber;
  token1: Contract;
  amountB: BigNumber;
}) => {
  await token0.approve(sushiswapV2Router02.address, amountA);
  await token1.approve(sushiswapV2Router02.address, amountB);
  await sushiswapV2Router02.addLiquidity(
    token0.address,
    token1.address,
    amountA,
    amountB,
    amountA,
    amountB,
    await owner.getAddress(),
    deadline,
    {
      gasLimit: 9500000,
    }
  );
};

export const addLiquidityETH = async ({
  owner,
  token0,
  token0mount,
  wethAmount,
}: {
  owner: Signer;
  token0: Contract;
  token0mount: BigNumber;
  wethAmount: BigNumber;
}) => {
  await token0.approve(sushiswapV2Router02.address, token0mount);
  await sushiswapV2Router02.addLiquidityETH(
    token0.address,
    token0mount,
    token0mount,
    wethAmount,
    await owner.getAddress(),
    deadline,
    {
      gasLimit: 9500000,
      value: wethAmount,
    }
  );
};

export const addMasterChefV1 = async (tokenLP: string) => {
  await masterChefV1.add(1000, tokenLP, true, {
    gasLimit: 9500000,
  });
};

export const addMasterChefV2 = async (tokenLP: string) => {
  await masterChefV2.add(1000, tokenLP, ethers.constants.AddressZero, {
    gasLimit: 9500000,
  });
};
