/**
 * Windows-Compatible Verification Script
 * For Decentralized Lottery Application
 */

const fs = require('fs');
const path = require('path');

// Main verification function with proper Windows path handling
function verifyChanges() {
    console.log('Starting verification (Windows-compatible)...');
    
    try {
        // Get proper Windows paths
        const baseDir = process.cwd();
        const frontendDir = path.join(baseDir, 'frontend');
        const jsDir = path.join(frontendDir, 'js');
        
        console.log(`Base directory: ${baseDir}`);
        console.log(`Frontend directory: ${frontendDir}`);
        console.log(`JS directory: ${jsDir}`);
        
        // VERIFICATION 1: Function name changes
        console.log('\n1. FUNCTION NAME CHANGES:');
        console.log('-------------------------');
        
        const contractInteractionPath = path.join(jsDir, 'contract-interaction.js');
        const uiControllerPath = path.join(jsDir, 'ui-controller.js');
        const eventHandlersPath = path.join(jsDir, 'event-handlers.js');
        const appPath = path.join(jsDir, 'app.js');
        
        // Check key files individually to ensure better error reporting
        let functionNameTestPassed = true;
        
        // Contract interaction file
        if (fs.existsSync(contractInteractionPath)) {
            const contractContent = fs.readFileSync(contractInteractionPath, 'utf8');
            console.log('Checking contract-interaction.js:');
            console.log(`- Contains openLottery: ${contractContent.includes('openLottery')}`);
            console.log(`- Contains startNewLottery: ${contractContent.includes('startNewLottery')}`);
            
            if (contractContent.includes('startNewLottery')) {
                functionNameTestPassed = false;
            }
        } else {
            console.log('⚠️ Could not find contract-interaction.js');
            functionNameTestPassed = false;
        }
        
        // UI controller file
        if (fs.existsSync(uiControllerPath)) {
            const uiContent = fs.readFileSync(uiControllerPath, 'utf8');
            console.log('\nChecking ui-controller.js:');
            console.log(`- Contains openLottery: ${uiContent.includes('openLottery')}`);
            console.log(`- Contains startNewLottery: ${uiContent.includes('startNewLottery')}`);
            
            if (uiContent.includes('startNewLottery')) {
                functionNameTestPassed = false;
            }
        } else {
            console.log('⚠️ Could not find ui-controller.js');
            functionNameTestPassed = false;
        }
        
        // Event handlers file
        if (fs.existsSync(eventHandlersPath)) {
            const eventContent = fs.readFileSync(eventHandlersPath, 'utf8');
            console.log('\nChecking event-handlers.js:');
            console.log(`- Contains openLottery: ${eventContent.includes('openLottery')}`);
            console.log(`- Contains startNewLottery: ${eventContent.includes('startNewLottery')}`);
            
            if (eventContent.includes('startNewLottery')) {
                functionNameTestPassed = false;
            }
        } else {
            console.log('⚠️ Could not find event-handlers.js');
            functionNameTestPassed = false;
        }
        
        // VERIFICATION 2: Two-column layout
        console.log('\n2. TWO-COLUMN LAYOUT:');
        console.log('--------------------');
        
        const indexPath = path.join(frontendDir, 'index.html');
        let layoutTestPassed = false;
        
        if (fs.existsSync(indexPath)) {
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for Bootstrap grid classes
            const hasRow = indexContent.includes('class="row"');
            const hasLeftCol = indexContent.includes('class="col-lg-8');
            const hasRightCol = indexContent.includes('class="col-lg-4');
            
            console.log(`- Has row class: ${hasRow}`);
            console.log(`- Has left column (col-lg-8): ${hasLeftCol}`);
            console.log(`- Has right column (col-lg-4): ${hasRightCol}`);
            
            layoutTestPassed = hasRow && hasLeftCol && hasRightCol;
            
            // Check participants table position
            const participantsInRightColumn = indexContent.includes('col-lg-4') && 
                                            indexContent.includes('participantsTable');
            
            console.log(`- Participants table in right column: ${participantsInRightColumn}`);
            
            if (!participantsInRightColumn) {
                layoutTestPassed = false;
            }
        } else {
            console.log('⚠️ Could not find index.html');
        }
        
        // VERIFICATION 3: Previous winners display
        console.log('\n3. PREVIOUS WINNERS DISPLAY:');
        console.log('--------------------------');
        
        let winnersTestPassed = false;
        
        if (fs.existsSync(indexPath)) {
            const indexContent = fs.readFileSync(indexPath, 'utf8');
            
            // Check for winners section in HTML
            const hasWinnersSection = indexContent.includes('Previous Winners');
            console.log(`- HTML includes Previous Winners section: ${hasWinnersSection}`);
            
            // Check for UI controller method
            if (fs.existsSync(uiControllerPath)) {
                const uiContent = fs.readFileSync(uiControllerPath, 'utf8');
                const hasWinnersMethod = uiContent.includes('populateWinnersTable');
                console.log(`- UI controller has populateWinnersTable method: ${hasWinnersMethod}`);
                
                if (!hasWinnersMethod) {
                    winnersTestPassed = false;
                }
            }
            
            // Check for contract interaction method
            if (fs.existsSync(contractInteractionPath)) {
                const contractContent = fs.readFileSync(contractInteractionPath, 'utf8');
                const hasGetWinnersMethod = contractContent.includes('getPreviousWinners');
                console.log(`- Contract interaction has getPreviousWinners method: ${hasGetWinnersMethod}`);
                
                if (!hasGetWinnersMethod) {
                    winnersTestPassed = false;
                }
            }
            
            // Check app.js for call to display winners
            if (fs.existsSync(appPath)) {
                const appContent = fs.readFileSync(appPath, 'utf8');
                const appCallsWinnersMethods = appContent.includes('previousWinners') && 
                                             appContent.includes('populateWinnersTable');
                console.log(`- App.js calls winners-related methods: ${appCallsWinnersMethods}`);
                
                winnersTestPassed = hasWinnersSection && appCallsWinnersMethods;
            }
        }
        
        // SUMMARY
        console.log('\nTEST SUMMARY:');
        console.log('-------------');
        console.log(`1. Function Name Changes: ${functionNameTestPassed ? 'PASS ✅' : 'FAIL ❌'}`);
        console.log(`2. Two-Column Layout: ${layoutTestPassed ? 'PASS ✅' : 'FAIL ❌'}`);
        console.log(`3. Previous Winners Display: ${winnersTestPassed ? 'PASS ✅' : 'FAIL ❌'}`);
        
        console.log('\nVerification complete!');
        
    } catch (error) {
        console.error('\nERROR DURING VERIFICATION:');
        console.error(error);
    }
}

// Run verification
verifyChanges(); 