require('@nomiclabs/hardhat-waffle')
require("@nomicfoundation/hardhat-verify");
require('dotenv').config()

const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

module.exports = {
  networks: {
    sepolia: {
      chainId: 11155111,
      url: `https://eth-sepolia.g.alchemy.com/v2/r24vXvM3fi53zBdclFRC79MOyMx7w5k-`, 
      accounts: [WALLET_PRIVATE_KEY? WALLET_PRIVATE_KEY : ""]
    },
    fuse_sparknet: {
      chainId: 123,
      url: `https://rpc.fusespark.io`, 
      accounts: [WALLET_PRIVATE_KEY? WALLET_PRIVATE_KEY : ""]
    }
  },
  solidity: {
    version: '0.8.11',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './src/contracts',
    artifacts: './src/abis',
  },
  mocha: {
    timeout: 40000,
  },
  etherscan: {
    apiKey: {
        mainnet: "5KKUIPX5EDA1KX2RU7ZSAKYWMEJWPZQT4X"
    }
  },
  blockExplorer: {
    sepolia: "https://api-sepolia.etherscan.io/api"
  }
}
