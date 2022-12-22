import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { LiquidityMining, Token } from '../../typechain-types';
import { addLiquidity, addLiquidityETH, createPair, deploy, DeployResult } from './sushiswap';

export const setUp = async (admin: SignerWithAddress) => {
  // create tokens to use (tokenA and tokenB)
  const Token = await ethers.getContractFactory('Token');
  const tokenA = (await Token.deploy('Token_A', 'TKA')) as Token;
  const tokenB = (await Token.deploy('Token_B', 'TKB')) as Token;

  // deploy sushiswap ecosystem
  const sushiswap = (await deploy({ owner: admin })) as DeployResult;

  // create tokenA-tokenB pair
  await createPair(tokenA.address, tokenB.address);

  // add liquidity to tokenA-tokenB pair
  await addLiquidity({
    owner: admin,
    token0: tokenA,
    amountA: BigNumber.from('1000000000000'),
    token1: tokenB,
    amountB: BigNumber.from('1000000000000'),
  });

  // add liquidity to tokenA-ETH pair
  await addLiquidityETH({
    owner: admin,
    token0: tokenA,
    token0mount: BigNumber.from('1000000000000'),
    wethAmount: BigNumber.from('1000000000000'),
  });

  // get tokenLP address for tokenA-tokenB pair
  const tokenLP_AB_Address = await sushiswap.shushiswapV2Factory.getPair(
    tokenA.address,
    tokenB.address
  );
  const tokenLP_AB = (await ethers.getContractAt('Token', tokenLP_AB_Address)) as Token;

  // get tokenLP address for tokenA-ETH pair
  const tokenLP_AETH_Address = await sushiswap.shushiswapV2Factory.getPair(
    tokenA.address,
    sushiswap.WETH.address
  );
  const tokenLP_AETH = (await ethers.getContractAt('Token', tokenLP_AETH_Address)) as Token;

  // deploy LiquidityMining contract
  const LiquidityMining = await ethers.getContractFactory('LiquidityMining');
  const liquidityMining = (await LiquidityMining.deploy()) as LiquidityMining;
  await liquidityMining.initialize(
    sushiswap.sushiswapV2Router02.address,
    sushiswap.masterChefV1.address,
    sushiswap.masterChefV2.address
  );

  // approve tokens tokenA, tokenB, tokenLP_AB and tokenLP_AETH to be used
  // by router, masterchefV1 and masterchefV2
  await liquidityMining.approveTokens([
    tokenA.address,
    tokenB.address,
    tokenLP_AB.address,
    tokenLP_AETH.address,
  ]);

  // approve tokens tokenA and tokenB to be used by LiquidityMining contract
  await tokenA.approve(liquidityMining.address, 10000000000000);
  await tokenB.approve(liquidityMining.address, 10000000000000);

  // create deadline timestamp
  const timestamp = Date.now() + 1000 * 60 * 60;
  const deadline = Math.floor(timestamp / 1000);

  return {
    liquidityMining,
    tokenA,
    tokenB,
    tokenLP_AB,
    tokenLP_AETH,
    sushiswap,
    deadline,
  };
};
