# Liquidity Mining for SushiSwap

This Smart Contract allows you to deposit your assets to a Liquidity Pool and Stake the LP tokens in a single action, thus saving gas and time.

This project is not ready for production propurses.

## Get started

There is a `.env.example` that you have to copy with the name `.env` and fill with the respective keys.

```sh
# Copy .env file
cp .env.example .env

# Install dependencies
yarn install

# Enable husky
yarn husky install
```

## Development

```sh
# Compile the smart contracts with Hardhat
yarn compile

# Generate Docs
yarn docgen

# Get smart contracts Size
yarn size
```

## Test

```sh
# Run all tests
yarn test

# Get tests coverage details
yarn coverage
```

## Deploy

```sh
# Deploy the smart contracts to a specific Network
$ yarn deploy network <networkName>
```
