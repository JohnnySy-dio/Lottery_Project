const fs = require('fs');
const path = require('path');

// Function to update the CONTRACT_ADDRESS in app.js
function updateContractAddress(address) {
  const appJsPath = path.join(__dirname, 'frontend', 'js', 'app.js');
  
  // Read the file
  let content = fs.readFileSync(appJsPath, 'utf8');
  
  // Replace the CONTRACT_ADDRESS value
  content = content.replace(
    /const CONTRACT_ADDRESS = ".*";/,
    `const CONTRACT_ADDRESS = "${address}";`
  );
  
  // Write the file back
  fs.writeFileSync(appJsPath, content, 'utf8');
  
  console.log(`Updated CONTRACT_ADDRESS to ${address} in app.js`);
}

// Export the function to be used after contract deployment
module.exports = {
  updateContractAddress
};
