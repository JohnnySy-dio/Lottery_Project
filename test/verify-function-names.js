/**
 * Function Name Verification Script
 * 
 * This script checks all JavaScript files in the frontend directory
 * to ensure that startNewLottery has been completely replaced with openLottery.
 */

const fs = require('fs');
const path = require('path');

// Print full script execution information
console.log('Script starting...');
console.log('Current directory:', process.cwd());

// Directory to scan
const frontendDir = path.join(__dirname, '..', 'frontend', 'js');
console.log('Target directory:', frontendDir);

// Check if directory exists
if (!fs.existsSync(frontendDir)) {
    console.error(`ERROR: Directory ${frontendDir} does not exist`);
    process.exit(1);
}

// Get all files in the directory
console.log('Listing directory contents...');
try {
    const allFiles = fs.readdirSync(frontendDir);
    console.log('All files in directory:', allFiles);

    // Filter for JS files
    const jsFiles = allFiles.filter(file => file.endsWith('.js'));
    console.log('JavaScript files:', jsFiles);

    if (jsFiles.length === 0) {
        console.error('ERROR: No JavaScript files found');
        process.exit(1);
    }

    // Convert to full paths
    const jsFilePaths = jsFiles.map(file => path.join(frontendDir, file));
    console.log('Full file paths:');
    jsFilePaths.forEach(file => console.log('- ' + file));

    // Check each file exists
    jsFilePaths.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`File exists: ${file}`);
            // Simplified test - just read the file content
            try {
                const content = fs.readFileSync(file, 'utf8');
                const contentPreview = content.substring(0, 100) + "...";
                console.log(`Successfully read file. Preview: ${contentPreview}`);
                
                // Check for function names
                const startNewLotteryCount = (content.match(/startNewLottery/g) || []).length;
                const openLotteryCount = (content.match(/openLottery/g) || []).length;
                
                console.log(`File: ${path.basename(file)}`);
                console.log(`- startNewLottery count: ${startNewLotteryCount}`);
                console.log(`- openLottery count: ${openLotteryCount}`);
                console.log('-------------------');
            } catch (error) {
                console.error(`Error reading file ${file}:`, error);
            }
        } else {
            console.error(`ERROR: File does not exist: ${file}`);
        }
    });

    console.log('Script completed.');
} catch (error) {
    console.error('Error reading directory:', error);
    process.exit(1);
} 