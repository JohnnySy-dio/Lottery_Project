const DecentralizedLottery = artifacts.require("DecentralizedLottery");
const fs = require('fs');
const path = require('path');

module.exports = function(deployer, network) {
  deployer.deploy(DecentralizedLottery)
    .then((instance) => {
      console.log("DecentralizedLottery deployed at:", instance.address);
      
      // For local development networks, update the config.js file with the deployed address
      if (network === 'development' || network === 'ganache_ui') {
        try {
          const configPath = path.join(__dirname, '..', 'frontend', 'js', 'config.js');
          const configContent = fs.readFileSync(configPath, 'utf8');
          
          // Simple string replacement for the Ganache local address
          const updatedConfig = configContent.replace(
            /"0x539"\s*:\s*".*?"/,
            `"0x539": "${instance.address}"`
          );
          
          fs.writeFileSync(configPath, updatedConfig);
          console.log(`Updated config.js with local contract address: ${instance.address}`);
        } catch (error) {
          console.error('Failed to update config.js:', error);
        }
      }
    });
};
