/**
 * Simple Verification Script for Decentralized Lottery
 */

const fs = require('fs');
const path = require('path');

// Main verification function
function verify() {
    console.log('Starting verification...');
    
    // 1. Check for openLottery
    try {
        const contractInteractionPath = path.join(__dirname, '..', 'frontend', 'js', 'contract-interaction.js');
        const contractInteractionContent = fs.readFileSync(contractInteractionPath, 'utf8');
        
        console.log('1. Checking for openLottery in contract-interaction.js');
        if (contractInteractionContent.includes('openLottery')) {
            console.log('✅ Found openLottery in contract-interaction.js');
        } else {
            console.log('❌ openLottery not found in contract-interaction.js');
        }
        
        if (contractInteractionContent.includes('startNewLottery')) {
            console.log('❌ startNewLottery still exists in contract-interaction.js');
        } else {
            console.log('✅ startNewLottery has been successfully removed');
        }
    } catch (error) {
        console.error('Error checking contract-interaction.js:', error.message);
    }
    
    // 2. Check two-column layout
    try {
        const indexPath = path.join(__dirname, '..', 'frontend', 'index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        console.log('\n2. Checking for two-column layout in index.html');
        if (indexContent.includes('col-lg-8') && indexContent.includes('col-lg-4')) {
            console.log('✅ Two-column layout found in index.html');
        } else {
            console.log('❌ Two-column layout not found in index.html');
        }
    } catch (error) {
        console.error('Error checking index.html:', error.message);
    }
    
    // 3. Check for previous winners section
    try {
        const indexPath = path.join(__dirname, '..', 'frontend', 'index.html');
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        console.log('\n3. Checking for previous winners section in index.html');
        if (indexContent.includes('Previous Winners')) {
            console.log('✅ Previous Winners section found in index.html');
        } else {
            console.log('❌ Previous Winners section not found in index.html');
        }
    } catch (error) {
        console.error('Error checking for Previous Winners section:', error.message);
    }
    
    console.log('\nVerification complete!');
}

// Run verification
verify(); 