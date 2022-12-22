import * as dotenv from 'dotenv';

import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-contract-sizer';
import 'hardhat-deploy';
import 'hardhat-docgen';
import 'hardhat-abi-exporter';
import networks from './hardhat.network';

dotenv.config();

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.6.12',
      },
    ],
  },
  gasReporter: {
    currency: 'USD',
    enabled: true,
    excludeContracts: ['SushiToken', 'MasterChef', 'MasterChefV2', 'Token', 'ERC20'],
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: true,
    except: ['./test'],
  },
  abiExporter: {
    runOnCompile: true,
    clear: true,
    flat: true,
    only: [':LiquidityMining$'],
  },
  contractSizer: {
    runOnCompile: false,
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      bsc: process.env.BSC_API_KEY,
      bscTestnet: process.env.BSC_API_KEY,
      polygonMumbai: process.env.POLY_API_KEY,
      polygon: process.env.POLY_API_KEY,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    router: {
      1: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      5: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
    },
    masterChefV1: {
      1: '0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd',
      5: '0x80C7DD17B01855a6D2347444a0FCC36136a314de',
    },
    masterChefV2: {
      1: '0xef0881ec094552b2e128cf945ef17a6752b4ec5d',
      5: '0x80C7DD17B01855a6D2347444a0FCC36136a314de',
    },
  },
  networks,
};

export default config;
