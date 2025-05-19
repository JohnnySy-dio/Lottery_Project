// Enhanced admin functions with transaction tracking
console.log("Enhanced admin functions loaded");

/**
 * Close lottery with transaction tracking
 */
async function closeLotteryWithTracking() {
    console.log("Close lottery with tracking started");
    
    // Check permissions
    if (!isOwner || !web3 || !lotteryContract) {
        showError('Only the owner can close the lottery');
        return;
    }
    
    try {
        // Show loading
        showLoadingState('Closing lottery...');
        
        // Get account
        const accountToUse = await getCurrentAccount();
        if (!accountToUse) {
            showError('No Ethereum account available. Please connect your wallet first.');
            hideLoadingState();
            return;
        }
        
        // Check lottery status
        const isOpen = await lotteryContract.methods.lotteryOpen().call();
        if (!isOpen) {
            showError('The lottery is already closed.');
            hideLoadingState();
            return;
        }
        
        // Estimate gas (with fallback)
        let gasEstimate = 200000;
        try {
            gasEstimate = await lotteryContract.methods.closeLottery().estimateGas({
                from: accountToUse
            });
            console.log("Estimated gas:", gasEstimate);
        } catch (error) {
            console.error("Gas estimation failed, using default:", error);
        }
        
        // Send transaction
        console.log("Sending close lottery transaction...");
        
        try {
            const promiEvent = lotteryContract.methods.closeLottery().send({
                from: accountToUse,
                gas: Math.floor(gasEstimate * 1.2)
            });
            
            // Handle transaction hash event
            promiEvent.on('transactionHash', function(hash) {
                console.log("Transaction hash received:", hash);
                hideLoadingState();
                
                // Create transaction status UI
                showTransactionStatus(hash, 'Closing lottery. Please wait for confirmation...');
                
                // Poll for receipt
                pollForReceipt(hash, function(success) {
                    if (success) {
                        // Transaction succeeded
                        showNotification('Lottery closed successfully', 'success');
                        updateTransactionStatus(hash, 'Transaction successful!', 'success');
                        
                        // Update UI
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
                console.error("Close lottery error:", error);
                hideLoadingState();
                showError('Failed to close lottery: ' + getErrorMessage(error));
            });
            
        } catch (error) {
            console.error("Failed to send transaction:", error);
            hideLoadingState();
            showError('Failed to send transaction: ' + getErrorMessage(error));
        }
    } catch (error) {
        console.error("Close lottery error:", error);
        hideLoadingState();
        showError('Failed to close lottery: ' + getErrorMessage(error));
    }
}

/**
 * Open lottery with transaction tracking
 */
async function openLotteryWithTracking() {
    console.log("Open lottery with tracking started");
    
    // Check permissions
    if (!isOwner || !web3 || !lotteryContract) {
        showError('Only the owner can open the lottery');
        return;
    }
    
    try {
        // Show loading
        showLoadingState('Opening lottery...');
        
        // Get account
        const accountToUse = await getCurrentAccount();
        if (!accountToUse) {
            showError('No Ethereum account available. Please connect your wallet first.');
            hideLoadingState();
            return;
        }
        
        // Check lottery status
        const isOpen = await lotteryContract.methods.lotteryOpen().call();
        if (isOpen) {
            showError('The lottery is already open.');
            hideLoadingState();
            return;
        }
        
        // Estimate gas (with fallback)
        let gasEstimate = 200000;
        try {
            gasEstimate = await lotteryContract.methods.openLottery().estimateGas({
                from: accountToUse
            });
            console.log("Estimated gas:", gasEstimate);
        } catch (error) {
            console.error("Gas estimation failed, using default:", error);
        }
        
        // Send transaction
        console.log("Sending open lottery transaction...");
        
        try {
            const promiEvent = lotteryContract.methods.openLottery().send({
                from: accountToUse,
                gas: Math.floor(gasEstimate * 1.2)
            });
            
            // Handle transaction hash event
            promiEvent.on('transactionHash', function(hash) {
                console.log("Transaction hash received:", hash);
                hideLoadingState();
                
                // Create transaction status UI
                showTransactionStatus(hash, 'Opening lottery. Please wait for confirmation...');
                
                // Poll for receipt
                pollForReceipt(hash, function(success) {
                    if (success) {
                        // Transaction succeeded
                        showNotification('Lottery opened successfully', 'success');
                        updateTransactionStatus(hash, 'Transaction successful!', 'success');
                        
                        // Update UI
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
                console.error("Open lottery error:", error);
                hideLoadingState();
                showError('Failed to open lottery: ' + getErrorMessage(error));
            });
            
        } catch (error) {
            console.error("Failed to send transaction:", error);
            hideLoadingState();
            showError('Failed to send transaction: ' + getErrorMessage(error));
        }
    } catch (error) {
        console.error("Open lottery error:", error);
        hideLoadingState();
        showError('Failed to open lottery: ' + getErrorMessage(error));
    }
}

/**
 * Pick winner with transaction tracking
 */
async function pickWinnerWithTracking() {
    console.log("Pick winner with tracking started");
    
    // Check permissions
    if (!isOwner || !web3 || !lotteryContract) {
        showError('Only the owner can pick a winner');
        return;
    }
    
    try {
        // Check lottery status
        const isOpen = await lotteryContract.methods.lotteryOpen().call();
        const playerCount = await lotteryContract.methods.getPlayerCount().call();
        const minPlayers = await lotteryContract.methods.minPlayers().call();
        
        if (isOpen) {
            showError('Please close the lottery before picking a winner');
            return;
        }
        
        if (playerCount < minPlayers) {
            showError(`Not enough players. Need at least ${minPlayers}, but only have ${playerCount}`);
            return;
        }
        
        // Show loading
        showLoadingState('Picking winner... This may take a while');
        
        // Get account
        const accountToUse = await getCurrentAccount();
        if (!accountToUse) {
            showError('No Ethereum account available. Please connect your wallet first.');
            hideLoadingState();
            return;
        }
        
        // Estimate gas (with fallback)
        let gasEstimate = 500000;
        try {
            gasEstimate = await lotteryContract.methods.pickWinner().estimateGas({
                from: accountToUse
            });
            console.log("Estimated gas:", gasEstimate);
        } catch (error) {
            console.error("Gas estimation failed, using default:", error);
        }
        
        // Send transaction
        console.log("Sending pick winner transaction...");
        
        try {
            const promiEvent = lotteryContract.methods.pickWinner().send({
                from: accountToUse,
                gas: Math.floor(gasEstimate * 1.2)
            });
            
            // Handle transaction hash event
            promiEvent.on('transactionHash', function(hash) {
                console.log("Transaction hash received:", hash);
                hideLoadingState();
                
                // Create transaction status UI
                showTransactionStatus(hash, 'Picking a winner. This may take a while, please wait for confirmation...');
                
                // Poll for receipt with longer timeout due to complexity
                pollForReceipt(hash, function(success) {
                    if (success) {
                        // Transaction succeeded
                        showNotification('Winner picked successfully!', 'success');
                        updateTransactionStatus(hash, 'Transaction successful!', 'success');
                        
                        // Update UI
                        updateContractInfo();
                        updatePlayersList();
                        updateWinnersList();
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
                console.error("Pick winner error:", error);
                hideLoadingState();
                showError('Failed to pick winner: ' + getErrorMessage(error));
            });
            
        } catch (error) {
            console.error("Failed to send transaction:", error);
            hideLoadingState();
            showError('Failed to send transaction: ' + getErrorMessage(error));
        }
    } catch (error) {
        console.error("Pick winner error:", error);
        hideLoadingState();
        showError('Failed to pick winner: ' + getErrorMessage(error));
    }
}

// Export functions to window
window.closeLotteryWithTracking = closeLotteryWithTracking;
window.openLotteryWithTracking = openLotteryWithTracking;
window.pickWinnerWithTracking = pickWinnerWithTracking;
