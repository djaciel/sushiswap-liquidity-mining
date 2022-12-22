import { ethers, network } from 'hardhat';
import { LiquidityMining, Token } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { addMasterChefV1, DeployResult } from './utils/sushiswap';
import { setUp } from './utils/utils';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

let admin: SignerWithAddress;

let liquidityMining: LiquidityMining;
let sushiswap: DeployResult;
let tokenA: Token;
let tokenB: Token;
let tokenLP_AB: Token;
let tokenLP_AETH: Token;
let deadline = 0;

let balanceBeforeTokenA: BigNumber;
let balanceBeforeTokenB: BigNumber;
let balanceBeforeSushi: BigNumber;

let balanceAfterTokenA: BigNumber;
let balanceAfterTokenB: BigNumber;
let balanceAfterSushi: BigNumber;

describe('LiquidityMining with MasterChefV1', () => {
  before(async () => {
    await network.provider.request({
      method: 'hardhat_reset',
    });

    [admin] = await ethers.getSigners();

    ({ liquidityMining, tokenA, tokenB, tokenLP_AB, tokenLP_AETH, deadline, sushiswap } =
      await setUp(admin));

    await addMasterChefV1(tokenLP_AB.address);
    await addMasterChefV1(tokenLP_AETH.address);
  });

  describe('LiquidityMining', () => {
    it('should add liquidity and deposit using MasterChefV1', async () => {
      balanceBeforeTokenA = await tokenA.balanceOf(admin.address);
      balanceBeforeTokenB = await tokenB.balanceOf(admin.address);
      balanceBeforeSushi = await sushiswap.sushiToken.balanceOf(admin.address);

      await liquidityMining.addLiquidityAndDepositToMasterChefV1(
        tokenA.address,
        tokenB.address,
        100,
        100,
        1,
        tokenLP_AB.address,
        deadline
      );

      balanceAfterTokenA = await tokenA.balanceOf(admin.address);
      balanceAfterTokenB = await tokenB.balanceOf(admin.address);

      expect(balanceBeforeTokenA.sub(100)).to.equal(balanceAfterTokenA);
      expect(balanceBeforeTokenB.sub(100)).to.equal(balanceAfterTokenB);

      const tokenLP_AB_Balance = await tokenLP_AB.balanceOf(liquidityMining.address);
      expect(tokenLP_AB_Balance).to.equal(0);
    });

    it('should withdraw and remove liquidity using MasterChefV1', async () => {
      const userInfo = await sushiswap.masterChefV1.userInfo(1, liquidityMining.address);

      await network.provider.send('evm_mine');

      await liquidityMining.withdrawFromMasterChefV1AndRemoveLiquidity(
        tokenA.address,
        tokenB.address,
        100,
        100,
        1,
        tokenLP_AB.address,
        userInfo.amount,
        deadline
      );

      balanceAfterTokenA = await tokenA.balanceOf(admin.address);
      balanceAfterTokenB = await tokenB.balanceOf(admin.address);
      balanceAfterSushi = await sushiswap.sushiToken.balanceOf(admin.address);

      expect(balanceBeforeTokenA).to.equal(balanceAfterTokenA);
      expect(balanceBeforeTokenB).to.equal(balanceAfterTokenB);
      expect(balanceAfterSushi.gt(balanceBeforeSushi)).to.be.true;
    });

    it('should add liquidity with ETH and deposit using MasterChefV1', async () => {
      balanceBeforeTokenA = await tokenA.balanceOf(admin.address);
      balanceBeforeSushi = await sushiswap.sushiToken.balanceOf(admin.address);

      await liquidityMining.addLiquidityETHAndDepositToMasterChefV1(
        tokenA.address,
        100,
        2,
        tokenLP_AETH.address,
        deadline,
        {
          value: 100,
        }
      );

      balanceAfterTokenA = await tokenA.balanceOf(admin.address);

      expect(balanceBeforeTokenA.sub(100)).to.equal(balanceAfterTokenA);

      const tokenLP_AB_Balance = await tokenLP_AB.balanceOf(liquidityMining.address);
      expect(tokenLP_AB_Balance).to.equal(0);
    });

    it('should withdraw and remove liquidity ETH using MasterChefV1', async () => {
      const userInfo = await sushiswap.masterChefV1.userInfo(2, liquidityMining.address);

      await network.provider.send('evm_mine');

      await liquidityMining.withdrawFromMasterChefV1AndRemoveLiquidityETH(
        tokenA.address,
        100,
        1,
        2,
        tokenLP_AETH.address,
        userInfo.amount,
        deadline
      );

      balanceAfterTokenA = await tokenA.balanceOf(admin.address);
      balanceAfterSushi = await sushiswap.sushiToken.balanceOf(admin.address);

      expect(balanceBeforeTokenA).to.equal(balanceAfterTokenA);
      expect(balanceAfterSushi.gt(balanceBeforeSushi)).to.be.true;
    });

    it('should fail sending a zero address as tokenA', async () => {
      await expect(
        liquidityMining.addLiquidityAndDepositToMasterChefV1(
          ethers.constants.AddressZero,
          tokenB.address,
          100,
          100,
          1,
          tokenLP_AB.address,
          deadline
        )
      ).to.be.revertedWith(`LiquidityMining: TokenA cannot be a 0 address`);

      await expect(
        liquidityMining.addLiquidityETHAndDepositToMasterChefV1(
          ethers.constants.AddressZero,
          100,
          2,
          tokenLP_AETH.address,
          deadline,
          {
            value: 100,
          }
        )
      ).to.be.revertedWith(`LiquidityMining: TokenA cannot be a 0 address`);
    });

    it('should fail sending a zero address as tokenB', async () => {
      await expect(
        liquidityMining.addLiquidityAndDepositToMasterChefV1(
          tokenA.address,
          ethers.constants.AddressZero,
          100,
          100,
          1,
          tokenLP_AB.address,
          deadline
        )
      ).to.be.revertedWith(`LiquidityMining: TokenB cannot be a 0 address`);
    });

    it('should fail sending a zero address as tokenSLP', async () => {
      await expect(
        liquidityMining.addLiquidityAndDepositToMasterChefV1(
          tokenA.address,
          tokenB.address,
          100,
          100,
          1,
          ethers.constants.AddressZero,
          deadline
        )
      ).to.be.revertedWith(`LiquidityMining: TokenSLP cannot be a 0 address`);

      await expect(
        liquidityMining.addLiquidityETHAndDepositToMasterChefV1(
          tokenA.address,
          100,
          2,
          ethers.constants.AddressZero,
          deadline,
          {
            value: 100,
          }
        )
      ).to.be.revertedWith(`LiquidityMining: TokenSLP cannot be a 0 address`);
    });
  });
});
