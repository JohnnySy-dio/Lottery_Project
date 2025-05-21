/**
 * UI Verification Script
 * 
 * This script verifies that the UI elements, file references, and functionality
 * properly reflect the updates we've made to the Decentralized Lottery application.
 */

const fs = require('fs');
const path = require('path');

// Directories to scan
const frontendDir = path.join(__dirname, '..', 'frontend');
const jsDir = path.join(frontendDir, 'js');

console.log('= Decentralized Lottery Application Verification =');
console.log('Checking for proper implementation of UI changes...\n');

// 1. Verify function name changes
console.log('1. FUNCTION NAME VERIFICATION');
console.log('----------------------------');

// Check all JS files for startNewLottery vs openLottery
const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));

let startNewLotteryFound = false;
let openLotteryFound = false;
let openLotteryFiles = [];

jsFiles.forEach(file => {
    const filePath = path.join(jsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const startNewLotteryCount = (content.match(/startNewLottery/g) || []).length;
    const openLotteryCount = (content.match(/openLottery/g) || []).length;
    
    if (startNewLotteryCount > 0) {
        startNewLotteryFound = true;
        console.log(`❌ Found ${startNewLotteryCount} instances of 'startNewLottery' in ${file}`);
    }
    
    if (openLotteryCount > 0) {
        openLotteryFound = true;
        openLotteryFiles.push({ file, count: openLotteryCount });
    }
});

if (!startNewLotteryFound) {
    console.log('✅ No instances of startNewLottery found in any JavaScript files');
}

if (openLotteryFound) {
    console.log('✅ Found openLottery references in the following files:');
    openLotteryFiles.forEach(item => {
        console.log(`  - ${item.file}: ${item.count} references`);
    });
} else {
    console.log('❌ No references to openLottery found in any JavaScript files');
}

// 2. Verify two-column layout
console.log('\n2. TWO-COLUMN LAYOUT VERIFICATION');
console.log('-------------------------------');

try {
    const htmlPath = path.join(frontendDir, 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check for row and column structure
    const hasRow = htmlContent.includes('class="row"');
    const hasLeftColumn = htmlContent.includes('class="col-lg-8');
    const hasRightColumn = htmlContent.includes('class="col-lg-4');
    
    if (hasRow && hasLeftColumn && hasRightColumn) {
        console.log('✅ Found two-column layout structure in index.html');
    } else {
        console.log('❌ Two-column layout not properly implemented:');
        if (!hasRow) console.log('  - Missing row class');
        if (!hasLeftColumn) console.log('  - Missing left column (col-lg-8)');
        if (!hasRightColumn) console.log('  - Missing right column (col-lg-4)');
    }
    
    // Check for participants table in right column
    const participantsInRightColumn = htmlContent.includes('col-lg-4') && 
                                    htmlContent.includes('participantsTable') &&
                                    htmlContent.includes('Current Participants');
    
    if (participantsInRightColumn) {
        console.log('✅ Participants table is positioned in the right column');
    } else {
        console.log('❌ Participants table not properly positioned in right column');
    }
} catch (error) {
    console.error('Error checking HTML structure:', error);
}

// 3. Verify previous winners display
console.log('\n3. PREVIOUS WINNERS VERIFICATION');
console.log('------------------------------');

try {
    const htmlPath = path.join(frontendDir, 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check for previous winners section
    const hasPreviousWinners = htmlContent.includes('Previous Winners') && 
                              htmlContent.includes('winnersTable');
    
    if (hasPreviousWinners) {
        console.log('✅ Found Previous Winners section in index.html');
    } else {
        console.log('❌ Previous Winners section not found in index.html');
    }
    
    // Check for winners table methods in UI controller
    const uiControllerPath = path.join(jsDir, 'ui-controller.js');
    const uiControllerContent = fs.readFileSync(uiControllerPath, 'utf8');
    
    const hasPopulateWinnersTable = uiControllerContent.includes('populateWinnersTable');
    
    if (hasPopulateWinnersTable) {
        console.log('✅ Found populateWinnersTable method in ui-controller.js');
    } else {
        console.log('❌ populateWinnersTable method not found in ui-controller.js');
    }
    
    // Check for winners retrieval methods in contract-interaction.js
    const contractInteractionPath = path.join(jsDir, 'contract-interaction.js');
    const contractInteractionContent = fs.readFileSync(contractInteractionPath, 'utf8');
    
    const hasGetPreviousWinners = contractInteractionContent.includes('getPreviousWinners');
    
    if (hasGetPreviousWinners) {
        console.log('✅ Found getPreviousWinners method in contract-interaction.js');
    } else {
        console.log('❌ getPreviousWinners method not found in contract-interaction.js');
    }
    
    // Check if app.js calls the winners methods
    const appPath = path.join(jsDir, 'app.js');
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    const appCallsWinnersMethods = appContent.includes('previousWinners') && 
                                  appContent.includes('populateWinnersTable');
    
    if (appCallsWinnersMethods) {
        console.log('✅ app.js calls winner-related methods during data refresh');
    } else {
        console.log('❌ app.js does not properly call winner-related methods');
    }
} catch (error) {
    console.error('Error checking winners implementation:', error);
}

// Summary
console.log('\nVERIFICATION SUMMARY');
console.log('------------------');

if (!startNewLotteryFound && openLotteryFound) {
    console.log('✅ Function Name Changes: Successfully implemented');
} else {
    console.log('❌ Function Name Changes: Issues detected');
}

const twoColumnLayoutSuccess = fs.readFileSync(path.join(frontendDir, 'index.html'), 'utf8').includes('class="col-lg-8') && 
                            fs.readFileSync(path.join(frontendDir, 'index.html'), 'utf8').includes('class="col-lg-4');

if (twoColumnLayoutSuccess) {
    console.log('✅ Two-Column Layout: Successfully implemented');
} else {
    console.log('❌ Two-Column Layout: Issues detected');
}

const previousWinnersSuccess = fs.readFileSync(path.join(frontendDir, 'index.html'), 'utf8').includes('Previous Winners') && 
                              fs.readFileSync(path.join(jsDir, 'ui-controller.js'), 'utf8').includes('populateWinnersTable') &&
                              fs.readFileSync(path.join(jsDir, 'contract-interaction.js'), 'utf8').includes('getPreviousWinners');

if (previousWinnersSuccess) {
    console.log('✅ Previous Winners Display: Successfully implemented');
} else {
    console.log('❌ Previous Winners Display: Issues detected');
}

console.log('\nVerification complete!'); 