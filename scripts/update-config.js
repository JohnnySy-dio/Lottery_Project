/**
 * Update Contract Address Script
 * 
 * This script updates the config.js file with the deployed contract address.
 * Run this after deploying your contract to ensure the frontend connects to the correct address.
 * 
 * Usage: node scripts/update-config.js <contract-address> [chain-id]
 * Example: node scripts/update-config.js 0x1234567890123456789012345678901234567890 0x539
 */

const fs = require('fs');
const path = require('path');

// Get arguments
const contractAddress = process.argv[2];
const chainId = process.argv[3] || '0x539'; // Default to Ganache if not specified

// Validate contract address
if (!contractAddress || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
    console.error('Error: Please provide a valid Ethereum contract address');
    console.log('Usage: node update-config.js <contract-address> [chain-id]');
    process.exit(1);
}

// Validate chain ID
if (!chainId.startsWith('0x')) {
    console.error('Error: Chain ID must be in hex format (starting with 0x)');
    process.exit(1);
}

// Config file path
const configPath = path.join(__dirname, '..', 'frontend', 'js', 'config.js');

// Read the current config file
fs.readFile(configPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading config file:', err);
        process.exit(1);
    }

    // Update contract address for the specified chain
    let updatedData = data.replace(
        new RegExp(`"${chainId}":\\s*"0x[a-fA-F0-9]{40}"`),
        `"${chainId}": "${contractAddress}"`
    );

    // Also update CONTRACT_ADDRESS if we're on the current chain
    const currentChainPattern = /CHAIN_ID:\s*"(0x[a-fA-F0-9]+)"/;
    const currentChainMatch = data.match(currentChainPattern);
    
    if (currentChainMatch && currentChainMatch[1] === chainId) {
        updatedData = updatedData.replace(
            /CONTRACT_ADDRESS:\s*"0x[a-fA-F0-9]{40}"/,
            `CONTRACT_ADDRESS: "${contractAddress}"`
        );
    }

    // Write the updated config back to the file
    fs.writeFile(configPath, updatedData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing config file:', err);
            process.exit(1);
        }
        
        console.log(`✅ Successfully updated config.js with contract address ${contractAddress} for chain ${chainId}`);
        
        // If this is Ganache, give additional instructions
        if (chainId === '0x539') {
            console.log('\nAdditional steps for local development:');
            console.log('1. Make sure your Ganache is running on port 7545');
            console.log('2. Connect MetaMask to Ganache (http://localhost:7545)');
            console.log('3. Import a Ganache account into MetaMask if needed');
        }
    });
}); 