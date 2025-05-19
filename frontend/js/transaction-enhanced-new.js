// Enhanced transaction functions with better tracking
console.log("Enhanced transaction functions loaded");

/**
 * Enter lottery with transaction tracking
 */
async function enterLotteryWithTracking() {
    console.log("Enter lottery with simplified tracking started");
    
    // Check Web3 and contract
    if (!web3 || !lotteryContract) {
        console.error("Web3 or contract not initialized");
        showError('Web3 or contract not initialized. Please refresh the page.');
        return;
    }
    
    // Check if wallet is connected
    if (!accounts || accounts.length === 0) {
        console.error("No accounts available");
        showError('No Ethereum accounts detected. Please connect your wallet first.');
        if (connectWalletBtn) {
            connectWalletBtn.classList.add('btn-pulse');
            setTimeout(() => connectWalletBtn.classList.remove('btn-pulse'), 3000);
        }
        return;
    }
    
    try {
        // Get lottery info
        console.log("Fetching lottery details...");
        const entryFee = await lotteryContract.methods.entryFee().call();
        const isOpen = await lotteryContract.methods.lotteryOpen().call();
        
        console.log("Entry fee:", web3.utils.fromWei(entryFee, 'ether'), "ETH");
        console.log("Lottery open:", isOpen);
        
        if (!isOpen) {
            showError('The lottery is currently closed');
            return;
        }
        
        // Get account
        const accountToUse = await getCurrentAccount();
        if (!accountToUse) {
            showError('No Ethereum account available. Please connect your wallet first.');
            return;
        }
        
        console.log("Using account for transaction:", accountToUse);
        
        // Check balance
        const balance = await web3.eth.getBalance(accountToUse);
        console.log("Account balance:", web3.utils.fromWei(balance, 'ether'), "ETH");
        
        if (web3.utils.toBN(balance).lt(web3.utils.toBN(entryFee))) {
            showError(`Insufficient balance. You need at least ${web3.utils.fromWei(entryFee, 'ether')} ETH to enter the lottery.`);
            return;
        }
        
        // Show loading
        showLoadingState('Preparing to enter lottery...');
        
        // Estimate gas (with fallback)
        let gasEstimate = 300000;
        try {
            gasEstimate = await lotteryContract.methods.enterLottery().estimateGas({
                from: accountToUse,
                value: entryFee
            });
            console.log("Estimated gas:", gasEstimate);
        } catch (error) {
            console.error("Gas estimation failed, using default:", error);
        }
        
        // Send transaction
        console.log("Sending transaction...");
        
        try {
            const promiEvent = lotteryContract.methods.enterLottery().send({
                from: accountToUse,
                value: entryFee,
                gas: Math.floor(gasEstimate * 1.2)
            });
            
            // Handle transaction hash event
            promiEvent.on('transactionHash', function(hash) {
                console.log("Transaction hash received:", hash);
                hideLoadingState();
                
                // Create transaction status UI
                showTransactionStatus(hash, 'Entering lottery. Please wait for confirmation...');
                
                // Poll for receipt
                pollForReceipt(hash, function(success) {
                    if (success) {
                        // Transaction succeeded
                        showNotification('You have successfully entered the lottery!', 'success');
                        updateTransactionStatus(hash, 'Transaction successful!', 'success');
                        
                        // Update UI
                        updateContractInfo();
                        updatePlayersList();
                        checkUserParticipation();
                    } else {
                        // Transaction failed
                        showError('Your transaction failed. Please check Etherscan for details.');
                        updateTransactionStatus(hash, 'Transaction failed!', 'danger');
                    }
                });
            });
            
            // Handle error
            promiEvent.on('error', function(error) {
                console.error("Enter lottery error:", error);
                hideLoadingState();
                showError('Failed to enter lottery: ' + getErrorMessage(error));
            });
            
        } catch (error) {
            console.error("Failed to send transaction:", error);
            hideLoadingState();
            showError('Failed to send transaction: ' + getErrorMessage(error));
        }
    } catch (error) {
        console.error("Enter lottery error:", error);
        hideLoadingState();
        showError('Failed to enter lottery: ' + getErrorMessage(error));
    }
}

/**
 * Set entry fee with transaction tracking
 */
async function setEntryFeeWithTracking(newFeeEth) {
    console.log("Set entry fee with simplified tracking started");
    
    // Check permissions
    if (!isOwner || !web3 || !lotteryContract) {
        showError('Only the owner can set the entry fee');
        return;
    }
    
    // Validate input
    if (!newFeeEth || isNaN(newFeeEth) || Number(newFeeEth) <= 0) {
        showError('Please enter a valid entry fee (greater than 0)');
        return;
    }
    
    try {
        // Show loading
        showLoadingState('Setting new entry fee...');
        
        // Convert to Wei
        const newFeeWei = web3.utils.toWei(newFeeEth, 'ether');
        console.log("Setting fee:", newFeeEth, "ETH (", newFeeWei, "Wei)");
        
        // Get account
        const accountToUse = await getCurrentAccount();
        if (!accountToUse) {
            showError('No Ethereum account available. Please connect your wallet first.');
            hideLoadingState();
            return;
        }
        
        // Estimate gas (with fallback)
        let gasEstimate = 200000;
        try {
            gasEstimate = await lotteryContract.methods.setEntryFee(newFeeWei).estimateGas({
                from: accountToUse
            });
            console.log("Estimated gas:", gasEstimate);
        } catch (error) {
            console.error("Gas estimation failed, using default:", error);
        }
        
        // Send transaction
        console.log("Sending transaction...");
        
        try {
            const promiEvent = lotteryContract.methods.setEntryFee(newFeeWei).send({
                from: accountToUse,
                gas: Math.floor(gasEstimate * 1.2)
            });
            
            // Handle transaction hash event
            promiEvent.on('transactionHash', function(hash) {
                console.log("Transaction hash received:", hash);
                hideLoadingState();
                
                // Create transaction status UI
                showTransactionStatus(hash, 'Setting entry fee. Please wait for confirmation...');
                
                // Poll for receipt
                pollForReceipt(hash, function(success) {
                    if (success) {
                        // Transaction succeeded
                        showNotification(`Entry fee updated to ${newFeeEth} ETH`, 'success');
                        updateTransactionStatus(hash, 'Transaction successful!', 'success');
                        entryFeeInput.value = '';
                        
                        // Update UI
                        entryFeeElement.textContent = newFeeEth;
                        updateContractInfo();
                    } else {
                        // Transaction failed
                        showError('Your transaction failed. Please check Etherscan for details.');
                        updateTransactionStatus(hash, 'Transaction failed!', 'danger');
                    }
                });
            });
            
            // Handle error
            promiEvent.on('error', function(error) {
                console.error("Set fee error:", error);
                hideLoadingState();
                showError('Failed to set entry fee: ' + getErrorMessage(error));
            });
            
        } catch (error) {
            console.error("Failed to send transaction:", error);
            hideLoadingState();
            showError('Failed to send transaction: ' + getErrorMessage(error));
        }
    } catch (error) {
        console.error("Set entry fee error:", error);
        hideLoadingState();
        showError('Failed to set entry fee: ' + getErrorMessage(error));
    }
}

// Helper functions for transaction UI and tracking

/**
 * Display transaction status
 */
function showTransactionStatus(hash, message) {
    // Get container
    const container = document.getElementById('tx-status-container');
    if (!container) {
        console.error("Transaction status container not found");
        return;
    }
    
    // Create status element
    const statusId = 'tx-status-' + hash.substring(0, 10);
    let statusElement = document.getElementById(statusId);
    
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = statusId;
        statusElement.className = 'alert alert-info transaction-status';
        container.appendChild(statusElement);
    }
    
    // Update content
    statusElement.innerHTML = `
        <p>${message}</p>
        <p>Transaction Hash: <code>${hash}</code></p>
        <div class="progress">
            <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div>
        </div>
    `;
}

/**
 * Update transaction status
 */
function updateTransactionStatus(hash, message, status) {
    const statusId = 'tx-status-' + hash.substring(0, 10);
    const statusElement = document.getElementById(statusId);
    
    if (!statusElement) {
        console.error("Transaction status element not found:", statusId);
        return;
    }
    
    // Update status
    statusElement.className = `alert alert-${status} transaction-status`;
    statusElement.innerHTML = `
        <p>${message}</p>
        <p>Transaction Hash: <code>${hash}</code></p>
    `;
    
    // Auto-hide success messages after 10 seconds
    if (status === 'success') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 10000);
    }
}

/**
 * Poll for transaction receipt
 */
function pollForReceipt(hash, callback, tries = 0) {
    const maxTries = 30; // 60 seconds max (30 * 2s)
    
    if (tries >= maxTries) {
        console.error("Transaction taking too long:", hash);
        updateTransactionStatus(hash, 'Transaction is taking longer than expected.', 'warning');
        return;
    }
    
    console.log("Polling for receipt, attempt:", tries + 1);
    
    web3.eth.getTransactionReceipt(hash)
        .then(function(receipt) {
            if (!receipt) {
                // Still pending, try again in 2 seconds
                setTimeout(() => pollForReceipt(hash, callback, tries + 1), 2000);
                return;
            }
            
            console.log("Receipt received:", receipt);
            callback(receipt.status);
        })
        .catch(function(error) {
            console.error("Error checking receipt:", error);
            setTimeout(() => pollForReceipt(hash, callback, tries + 1), 2000);
        });
}

// Export functions to window
window.enterLotteryWithTracking = enterLotteryWithTracking;
window.setEntryFeeWithTracking = setEntryFeeWithTracking;
