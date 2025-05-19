// IMPORTANT: Replace these placeholder values with your real values
// DO NOT commit this file to GitHub with your real mnemonic!
const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const fs = require('fs');
require('dotenv').config();

// Use environment variable for Infura project ID or fallback to public provider
const infuraProjectId = process.env.INFURA_PROJECT_ID;
const usePublicProvider = !infuraProjectId;
const publicProvider = "https://ethereum-sepolia.publicnode.com";

// Read the mnemonic from .env file
const mnemonic = process.env.MNEMONIC;

const { abi, bytecode } = require('./build/contracts/DecentralizedLottery.json');

// Configure provider with mnemonic and endpoint
const provider = new HDWalletProvider({
  mnemonic: {
    phrase: mnemonic
  },
  providerOrUrl: usePublicProvider 
    ? publicProvider 
    : `https://sepolia.infura.io/v3/${infuraProjectId}`,
  addressIndex: 0,
  numberOfAddresses: 1
});

const web3 = new Web3(provider);

// Deploy the contract
async function deploy() {
  console.log('Starting deployment to Sepolia...');
  try {
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    console.log(`Deploying from account: ${accounts[0]}`);
    
    // Get network info
    const networkId = await web3.eth.net.getId();
    const gasPrice = await web3.eth.getGasPrice();
    console.log(`Connected to network ID: ${networkId}, Gas price: ${web3.utils.fromWei(gasPrice, 'gwei')} gwei`);

    // Create contract instance
    const lottery = new web3.eth.Contract(abi);
    
    console.log('Deploying contract...');
    
    // Deploy the contract
    const deployTx = lottery.deploy({
      data: bytecode,
      arguments: []
    });
    
    const gas = await deployTx.estimateGas({ from: accounts[0] }) * 1.2;
    console.log(`Estimated gas: ${Math.floor(gas)}`);
    
    const deployedContract = await deployTx.send({
      from: accounts[0],
      gas: Math.floor(gas),
      gasPrice: Math.floor(Number(gasPrice) * 1.2) // Use higher gas price for faster confirmation
    });
    
    console.log('Contract deployed!');
    console.log(`Contract address: ${deployedContract.options.address}`);
    
    // Update the app.js file with the new contract address
    console.log('\nUpdate your frontend/js/app.js file with:');
    console.log(`const CONTRACT_ADDRESS = "${deployedContract.options.address}" // Updated ${new Date().toISOString()}`);
    
    // Allow time for the provider connection to close properly
    setTimeout(() => {
      provider.engine.stop();
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('Error deploying contract:');
    console.error(error);
    provider.engine.stop();
    process.exit(1);
  }
}

// Execute deployment
deploy(); 