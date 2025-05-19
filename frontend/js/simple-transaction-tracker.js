// Simple implementation of transaction tracking functions
console.log("Simple transaction tracker loaded");

/**
 * Tracks and displays transaction status
 * @param {string} txHash - The transaction hash
 * @param {string} message - A message to display during tracking
 * @param {Function} onSuccess - Callback for successful transactions
 * @param {Function} onError - Callback for failed transactions
 */
async function trackTransactionSimple(txHash, message, onSuccess, onError) {
    console.log("Transaction tracking started for:", txHash);
    
    // Create or get transaction status container
    const container = document.getElementById('tx-status-container');
    if (!container) {
        console.error("Transaction status container not found");
        if (onError) onError("UI elements not found");
        return;
    }
    
    // Create a unique ID for this transaction status
    const statusId = 'tx-status-' + txHash.substring(0, 10);
    
    // Create or get the status element for this transaction
    let statusElement = document.getElementById(statusId);
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = statusId;
        statusElement.className = 'alert alert-info transaction-status';
        container.appendChild(statusElement);
    }
    
    // Show initial status
    statusElement.innerHTML = `
        <p>${message}</p>
        <p>Transaction Hash: <code>${txHash}</code></p>
        <div class="progress">
            <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div>
        </div>
    `;
    
    // Begin checking transaction status
    try {
        // Poll for transaction receipt
        const checkReceipt = async () => {
            if (!web3) {
                throw new Error("Web3 not initialized");
            }
            
            try {
                console.log("Checking receipt for transaction:", txHash);
                const receipt = await web3.eth.getTransactionReceipt(txHash);
                
                if (!receipt) {
                    // Transaction still pending
                    console.log("Transaction still pending:", txHash);
                    setTimeout(checkReceipt, 2000); // Check again in 2 seconds
                    return;
                }
                
                console.log("Receipt received for transaction:", txHash, receipt);
                
                // Transaction completed
                if (receipt.status) {
                    // Success
                    statusElement.className = 'alert alert-success transaction-status';
                    statusElement.innerHTML = `
                        <p>Transaction successful!</p>
                        <p>Transaction Hash: <code>${txHash}</code></p>
                    `;
                    
                    // Auto-hide after 10 seconds
                    setTimeout(() => {
                        statusElement.style.display = 'none';
                    }, 10000);
                    
                    if (onSuccess) onSuccess(receipt);
                } else {
                    // Failed
                    statusElement.className = 'alert alert-danger transaction-status';
                    statusElement.innerHTML = `
                        <p>Transaction failed!</p>
                        <p>Transaction Hash: <code>${txHash}</code></p>
                    `;
                    
                    if (onError) onError("Transaction failed");
                }
            } catch (error) {
                console.error("Error checking transaction receipt:", error);
                setTimeout(checkReceipt, 2000); // Try again in 2 seconds
            }
        };
        
        // Start checking
        checkReceipt();
        
    } catch (error) {
        console.error("Error tracking transaction:", error);
        statusElement.className = 'alert alert-danger transaction-status';
        statusElement.innerHTML = `
            <p>Error tracking transaction: ${error.message || 'Unknown error'}</p>
            <p>Transaction Hash: <code>${txHash}</code></p>
        `;
        
        if (onError) onError(error.message || "Error tracking transaction");
    }
}

/**
 * Check if user has sufficient balance for a transaction
 * @param {string} account - User's account address
 * @param {string|number} amount - Amount in wei
 * @param {number} gasEstimate - Estimated gas amount
 * @returns {Promise<boolean>} - True if sufficient balance
 */
async function checkSufficientBalance(account, amount, gasEstimate = 300000) {
    try {
        if (!web3 || !account) return false;
        
        console.log("Checking balance for:", account);
        const balance = await web3.eth.getBalance(account);
        const gasPrice = await web3.eth.getGasPrice();
        
        console.log("Account balance:", web3.utils.fromWei(balance, 'ether'), "ETH");
        console.log("Required amount:", web3.utils.fromWei(amount.toString(), 'ether'), "ETH");
        console.log("Gas estimate:", gasEstimate);
        console.log("Gas price:", web3.utils.fromWei(gasPrice, 'gwei'), "Gwei");
        
        const gasCost = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(gasEstimate));
        const totalRequired = web3.utils.toBN(amount).add(gasCost);
        
        console.log("Total required with gas:", web3.utils.fromWei(totalRequired, 'ether'), "ETH");
        
        return web3.utils.toBN(balance).gte(totalRequired);
    } catch (error) {
        console.error("Error checking balance:", error);
        return false;
    }
}

// Export to window object for global access
window.trackTransactionSimple = trackTransactionSimple;
window.checkSufficientBalance = checkSufficientBalance;
