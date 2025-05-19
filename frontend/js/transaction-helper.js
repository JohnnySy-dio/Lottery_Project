// Helper functions for tracking and displaying transaction status

/**
 * Tracks the status of a transaction and updates the UI
 * @param {string} txHash - The transaction hash
 * @param {string} message - A message to display during tracking
 * @param {function} onSuccess - Callback function when transaction is successful
 * @param {function} onError - Callback function when transaction fails
 */
async function trackTransaction(txHash, message, onSuccess, onError) {
    if (!web3) {
        console.error("Web3 not initialized");
        if (onError) onError("Web3 not initialized");
        return;
    }
    
    console.log(`Tracking transaction: ${txHash}`);
    
    try {
        // Get Etherscan URL - properly await it now
        const etherscanUrl = await getEtherscanUrl(txHash);        // Create transaction status element if it doesn't exist
        let txStatusElement = document.getElementById('tx-status');
        if (!txStatusElement) {
            txStatusElement = document.createElement('div');
            txStatusElement.id = 'tx-status';
            txStatusElement.className = 'alert alert-info transaction-status';
            
            // Look for our dedicated tx-status-container first
            const txContainer = document.getElementById('tx-status-container');
            if (txContainer) {
                txContainer.appendChild(txStatusElement);
            } else {
                // Fallback to inserting after status message
                const statusMessageElement = document.getElementById('status-message');
                if (statusMessageElement) {
                    statusMessageElement.parentNode.insertBefore(txStatusElement, statusMessageElement.nextSibling);
                } else {
                    // Last resort - append to body
                    console.warn("Neither tx-status-container nor status-message found, appending to body");
                    document.body.appendChild(txStatusElement);
                }
            }
        }
        
        // Update status with transaction hash
        txStatusElement.innerHTML = `
            <p>${message}</p>
            <p>Transaction Hash: <a href="${etherscanUrl}" target="_blank" class="tx-hash">${txHash}</a></p>
            <div class="progress">
                <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div>
            </div>
        `;
        txStatusElement.style.display = 'block';
        
        // Check transaction receipt every 2 seconds
        let receipt = null;
        let retries = 0;
        const maxRetries = 30; // 60 seconds max
        
        while (!receipt && retries < maxRetries) {
            try {
                receipt = await web3.eth.getTransactionReceipt(txHash);
                if (!receipt) {
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                }
            } catch (error) {
                console.error("Error getting transaction receipt:", error);
                retries++;
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            }
        }
        
        if (!receipt) {
            // Transaction is taking too long
            txStatusElement.innerHTML = `
                <p>Transaction is taking longer than expected.</p>
                <p>Transaction Hash: <a href="${etherscanUrl}" target="_blank" class="tx-hash">${txHash}</a></p>
                <p>You can check its status on Etherscan or refresh the page later.</p>
            `;
            txStatusElement.className = 'alert alert-warning transaction-status';
            if (onError) onError("Transaction is taking too long");
            return;
        }
        
        // Check if transaction was successful
        if (receipt.status) {
            // Transaction successful
            txStatusElement.innerHTML = `
                <p>Transaction successful!</p>
                <p>Transaction Hash: <a href="${etherscanUrl}" target="_blank" class="tx-hash">${txHash}</a></p>
            `;
            txStatusElement.className = 'alert alert-success transaction-status';
            
            // Automatically hide after 10 seconds
            setTimeout(() => {
                txStatusElement.style.display = 'none';
            }, 10000);
            
            if (onSuccess) onSuccess(receipt);
        } else {
            // Transaction failed
            txStatusElement.innerHTML = `
                <p>Transaction failed!</p>
                <p>Transaction Hash: <a href="${etherscanUrl}" target="_blank" class="tx-hash">${txHash}</a></p>
                <p>The transaction may have run out of gas or encountered an error.</p>
            `;
            txStatusElement.className = 'alert alert-danger transaction-status';
            if (onError) onError("Transaction failed");
        }
    } catch (error) {
        console.error("Error tracking transaction:", error);
        if (onError) onError(getErrorMessage(error));
    }
}

/**
 * Gets the Etherscan URL for a transaction hash
 * @param {string} txHash - The transaction hash
 * @returns {string} - The Etherscan URL
 */
async function getEtherscanUrl(txHash) {
    if (!web3) return '#';
    
    try {
        // Get the network ID
        const networkId = await web3.eth.net.getId();
        let baseUrl;
        
        switch(networkId) {
            case 1: // Mainnet
                baseUrl = 'https://etherscan.io';
                break;
            case 3: // Ropsten
                baseUrl = 'https://ropsten.etherscan.io';
                break;
            case 4: // Rinkeby
                baseUrl = 'https://rinkeby.etherscan.io';
                break;
            case 5: // Goerli
                baseUrl = 'https://goerli.etherscan.io';
                break;
            case 42: // Kovan
                baseUrl = 'https://kovan.etherscan.io';
                break;
            case 1337: // Ganache (decimal)
            case 5777: // Ganache
                baseUrl = '#'; // No Etherscan for local
                break;
            default:
                console.log("Unknown network ID:", networkId);
                baseUrl = 'https://etherscan.io';
        }
        
        if (baseUrl === '#') {
            return '#';
        } else {
            return `${baseUrl}/tx/${txHash}`;
        }
    } catch (error) {
        console.error("Error getting network ID:", error);
        return `https://etherscan.io/tx/${txHash}`; // Default to mainnet
    }
}

/**
 * Checks if user has sufficient balance for a transaction
 * @param {string} accountAddress - The user's Ethereum address
 * @param {string} requiredAmount - The required amount in Wei
 * @param {number} gasEstimate - Optional gas estimate
 * @returns {Promise<boolean>} - True if user has sufficient balance
 */
async function hasSufficientBalance(accountAddress, requiredAmount, gasEstimate = 300000) {
    try {
        if (!web3 || !accountAddress) return false;
        
        const balance = await web3.eth.getBalance(accountAddress);
        const gasPrice = await web3.eth.getGasPrice();
        const estimatedGasCost = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(gasEstimate));
        
        // Calculate total required (amount + gas)
        const totalRequired = web3.utils.toBN(requiredAmount).add(estimatedGasCost);
        
        return web3.utils.toBN(balance).gte(totalRequired);
    } catch (error) {
        console.error("Error checking balance:", error);
        return false; // Assume insufficient balance in case of error
    }
}
