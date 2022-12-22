import { HardhatUserConfig } from 'hardhat/config';
import * as dotenv from 'dotenv';

dotenv.config();

const alchemyUrl = process.env.ALCHEMY_URL || '';
const infuraApiKey = process.env.INFURA_API_KEY;
const mnemonic = process.env.HDWALLET_MNEMONIC;
const forkEnabled = process.env.FORK_ENABLED || false;

const networks: HardhatUserConfig['networks'] = {
  localhost: {
    live: false,
    chainId: 1,
    url: 'http://127.0.0.1:8545',
  },
};

if (mnemonic) {
  if (forkEnabled) {
    networks.hardhat = {
      live: false,
      chainId: 1,
      forking: {
        url: alchemyUrl,
      },
      accounts: {
        mnemonic,
      },
    };
  }

  if (mnemonic) {
    networks.bsc = {
      live: true,
      chainId: 56,
      url: 'https://bsc-dataseed.binance.org',
      accounts: {
        mnemonic,
      },
    };

    networks.bscTestnet = {
      live: true,
      chainId: 97,
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
      accounts: {
        mnemonic,
      },
    };

    networks.polygon = {
      live: true,
      chainId: 137,
      url: 'https://polygon-rpc.com',
      accounts: {
        mnemonic,
      },
    };

    networks.mumbai = {
      live: true,
      chainId: 80001,
      url: 'https://rpc-mumbai.maticvigil.com/',
      accounts: {
        mnemonic,
      },
    };
  }

  networks.goerli = {
    live: true,
    url: `https://goerli.infura.io/v3/${infuraApiKey}`,
    chainId: 5,
    accounts: {
      mnemonic,
    },
  };

  networks.mainnet = {
    live: true,
    url: alchemyUrl,
    chainId: 1,
    accounts: {
      mnemonic,
    },
  };
} else {
  console.warn('No mnemonic available');
}

export default networks;
