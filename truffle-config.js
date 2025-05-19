require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Public RPC endpoint as fallback
const PUBLIC_SEPOLIA_RPC = "https://ethereum-sepolia.publicnode.com";

// Development configuration for Truffle
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    sepolia: {
      provider: () => {
        const infuraId = process.env.INFURA_PROJECT_ID;
        const providerUrl = infuraId 
          ? `https://sepolia.infura.io/v3/${infuraId}`
          : PUBLIC_SEPOLIA_RPC;
          
        return new HDWalletProvider({
          mnemonic: {
            phrase: process.env.MNEMONIC
          },
          providerOrUrl: providerUrl,
          pollingInterval: 30000, // Poll for blocks every 30 seconds
          networkCheckTimeout: 90000, // Timeout in ms
          timeoutBlocks: 50
        });
      },
      network_id: 11155111,
      gas: 4500000,        // Lower gas limit
      gasPrice: 30000000000, // 30 gwei - higher gas price for faster confirmation
      confirmations: 1,    // Lower confirmation requirement
      timeoutBlocks: 50,
      skipDryRun: true,
      networkCheckTimeout: 100000
    },
    // Public node configuration (no API key required)
    sepolia_public: {
      provider: () => new HDWalletProvider({
        mnemonic: process.env.MNEMONIC,
        providerOrUrl: PUBLIC_SEPOLIA_RPC,
        numberOfAddresses: 1,
        shareNonce: true
      }),
      network_id: 11155111,
      gas: 5500000,
      gasPrice: 15000000000, // 15 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },
  db: {
    enabled: false
  }
};
