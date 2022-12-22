import { ethers, network } from 'hardhat';
import { LiquidityMining, Token } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { DeployResult } from './utils/sushiswap';
import { setUp } from './utils/utils';
import { expect } from 'chai';

let admin: SignerWithAddress;

let liquidityMining: LiquidityMining;
let tokenA: Token;
let sushiswap: DeployResult;

describe('LiquidityMining with MasterChefV2', () => {
  beforeEach(async () => {
    await network.provider.request({
      method: 'hardhat_reset',
    });

    [admin] = await ethers.getSigners();

    ({ liquidityMining, sushiswap, tokenA } = await setUp(admin));
  });

  describe('LiquidityMining', () => {
    it('should approve LiquidityMining tokens', async () => {
      await liquidityMining.approveTokens([tokenA.address]);

      let allowance = await tokenA.allowance(
        liquidityMining.address,
        sushiswap.sushiswapV2Router02.address
      );
      expect(allowance.gt(0)).to.be.true;

      allowance = await tokenA.allowance(liquidityMining.address, sushiswap.masterChefV1.address);
      expect(allowance.gt(0)).to.be.true;

      allowance = await tokenA.allowance(liquidityMining.address, sushiswap.masterChefV2.address);
      expect(allowance.gt(0)).to.be.true;
    });

    it('should fail trying to initialize LiquidityMining contract with a zero address', async () => {
      const LiquidityMining = await ethers.getContractFactory('LiquidityMining');
      const liquidityMining = (await LiquidityMining.deploy()) as LiquidityMining;

      await expect(
        liquidityMining.initialize(
          ethers.constants.AddressZero,
          sushiswap.masterChefV1.address,
          sushiswap.masterChefV2.address
        )
      ).to.be.revertedWith(`LiquidityMining: Cannot set a 0 address as Router`);

      await expect(
        liquidityMining.initialize(
          sushiswap.sushiswapV2Router02.address,
          ethers.constants.AddressZero,
          sushiswap.masterChefV2.address
        )
      ).to.be.revertedWith(`LiquidityMining: Cannot set a 0 address as MasterChefV1`);

      await expect(
        liquidityMining.initialize(
          sushiswap.sushiswapV2Router02.address,
          sushiswap.masterChefV1.address,
          ethers.constants.AddressZero
        )
      ).to.be.revertedWith(`LiquidityMining: Cannot set a 0 address as MasterChefV2`);
    });
  });
});
