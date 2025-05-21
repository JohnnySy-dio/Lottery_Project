/**
 * Deploy Contract and Update Config Script
 * 
 * This script:
 * 1. Deploys the DecentralizedLottery contract
 * 2. Updates the frontend config with the new contract address
 * 
 * Usage: node scripts/deploy-and-configure.js
 * (Requires Truffle to be installed)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

console.log(`${colors.bright}Decentralized Lottery - Deployment Script${colors.reset}\n`);

try {
  // Step 1: Deploy contract
  console.log(`${colors.yellow}Step 1: Deploying contract to Ganache...${colors.reset}`);
  execSync('npx truffle migrate --reset --network development', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Contract deployed${colors.reset}\n`);

  // Step 2: Get the deployed contract address
  console.log(`${colors.yellow}Step 2: Getting contract address...${colors.reset}`);
  
  // Read the contract artifact to get the deployed address
  const artifactPath = path.join(__dirname, '..', 'build', 'contracts', 'DecentralizedLottery.json');
  const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  
  // Get the contract address from the development network (Ganache)
  if (!contractArtifact.networks || !contractArtifact.networks['5777']) {
    throw new Error('Contract not deployed to Ganache (network 5777)');
  }
  
  const contractAddress = contractArtifact.networks['5777'].address;
  console.log(`${colors.green}✓ Contract address: ${contractAddress}${colors.reset}\n`);

  // Step 3: Update config.js
  console.log(`${colors.yellow}Step 3: Updating frontend configuration...${colors.reset}`);
  execSync(`node ${path.join(__dirname, 'update-config.js')} ${contractAddress} 0x539`, { stdio: 'inherit' });
  console.log(`${colors.green}✓ Frontend configuration updated${colors.reset}\n`);

  // Step 4: Start development server
  console.log(`${colors.bright}${colors.green}Deployment and configuration completed successfully!${colors.reset}`);
  console.log(`${colors.yellow}To start the development server, run:${colors.reset}`);
  console.log(`${colors.bright}npm run dev${colors.reset}`);

} catch (error) {
  console.error(`${colors.red}Error during deployment:${colors.reset}`, error.message);
  console.log('\nTroubleshooting tips:');
  console.log('1. Make sure Ganache is running on port 7545');
  console.log('2. Check that truffle-config.js has the correct Ganache configuration');
  console.log('3. Make sure you have all dependencies installed (npm install)');
  process.exit(1);
} 