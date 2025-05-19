// Update the Enter Lottery transaction to use our transaction tracking functionality
async function enterLotteryWithTracking() {
    console.log("Enter lottery with tracking started");
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
            connectWalletBtn.classList.add('btn-pulse'); // Add animation to draw attention
            setTimeout(() => connectWalletBtn.classList.remove('btn-pulse'), 3000);
        }
        return;
    }
    
    try {
        console.log("Fetching entry fee and lottery status...");
        const entryFee = await lotteryContract.methods.entryFee().call();
        const isOpen = await lotteryContract.methods.lotteryOpen().call();
        
        console.log("Entry fee:", web3.utils.fromWei(entryFee, 'ether'), "ETH");
        console.log("Lottery open:", isOpen);
        
        if (!isOpen) {
            showError('The lottery is currently closed');
            return;
        }
        
        // Get the current account using our helper function
        const accountToUse = await getCurrentAccount();
        if (!accountToUse) {
            showError('No Ethereum account available. Please connect your wallet first.');
            return;
        }
        
        console.log("Using account for transaction:", accountToUse);
        
        // Check if the user has sufficient balance
        const hasSufficient = await hasSufficientBalance(accountToUse, entryFee);
        if (!hasSufficient) {
            showError(`Insufficient balance. You need at least ${web3.utils.fromWei(entryFee, 'ether')} ETH plus gas to enter.`);
            return;
        }
        
        // Show loading state
        showLoadingState('Preparing to enter lottery...');
        
        // Estimate gas
        const gasEstimate = await lotteryContract.methods.enterLottery().estimateGas({
            from: accountToUse,
            value: entryFee
        }).catch(error => {
            console.error("Gas estimation failed:", error);
            // Use a default value if estimation fails
            return 300000;
        });
        
        console.log("Estimated gas:", gasEstimate);
          // Send transaction
        console.log("Sending transaction to enter lottery with tracking...");
        lotteryContract.methods.enterLottery().send({
            from: accountToUse,
            value: entryFee,
            gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
        })
        .on('transactionHash', function(hash) {
            console.log("Transaction hash received:", hash);
            hideLoadingState();
            
            // Track transaction progress
            if (typeof trackTransaction === 'function') {
                console.log("Starting transaction tracking for hash:", hash);
                trackTransaction(
                    hash, 
                    'Entering lottery. Please wait for confirmation...', 
                    function(receipt) {
                        // Success callback
                        console.log("Enter lottery transaction confirmed:", receipt);
                        showNotification('You have successfully entered the lottery!', 'success');
                        
                        // Update UI after successful entry
                        updateContractInfo();
                        updatePlayersList();
                        checkUserParticipation();
                    },
                    function(error) {
                        // Error callback
                        console.error("Enter lottery transaction failed:", error);
                        showError('Failed to enter lottery: ' + error);
                    }
                );
            } else {
                console.error("trackTransaction function not found!");
                alert("Transaction sent, but tracking function not found. Hash: " + hash);
            }
        })
        .on('error', function(error) {
            console.error("Enter lottery error:", error);
            hideLoadingState();
            showError('Failed to enter lottery: ' + getErrorMessage(error));
        });
    } catch (error) {
        console.error("Enter lottery error:", error);
        hideLoadingState();
        showError('Failed to enter lottery: ' + getErrorMessage(error));
    }
}

// Update the set entry fee transaction to use our transaction tracking functionality
async function setEntryFeeWithTracking(newFeeEth) {
    if (!isOwner || !web3 || !lotteryContract) {
        showError('Only the owner can set the entry fee');
        return;
    }
    
    if (!newFeeEth || isNaN(newFeeEth) || Number(newFeeEth) <= 0) {
        showError('Please enter a valid entry fee (greater than 0)');
        return;
    }
    
    try {
        showLoadingState('Setting new entry fee...');
        
        // Convert ETH to Wei
        const newFeeWei = web3.utils.toWei(newFeeEth, 'ether');
        console.log("Setting new fee:", newFeeEth, "ETH (", newFeeWei, "Wei)");
        
        // Get the current account using our helper function
        const accountToUse = await getCurrentAccount();
        if (!accountToUse) {
            showError('No Ethereum account available. Please connect your wallet first.');
            hideLoadingState();
            return;
        }
        
        console.log("Using account for transaction:", accountToUse);
        
        // Estimate gas
        const gasEstimate = await lotteryContract.methods.setEntryFee(newFeeWei).estimateGas({
            from: accountToUse
        }).catch(error => {
            console.error("Gas estimation failed:", error);
            // Use a default value if estimation fails
            return 200000;
        });
        
        console.log("Estimated gas:", gasEstimate);
        
        // Send transaction
        lotteryContract.methods.setEntryFee(newFeeWei).send({
            from: accountToUse,
            gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
        })
        .on('transactionHash', function(hash) {
            console.log("Transaction hash:", hash);
            hideLoadingState();
            
            // Track transaction progress
            trackTransaction(
                hash, 
                'Setting entry fee. Please wait for confirmation...', 
                function(receipt) {
                    // Success callback
                    console.log("Set entry fee transaction confirmed:", receipt);
                    showNotification(`Entry fee updated to ${newFeeEth} ETH`, 'success');
                    entryFeeInput.value = '';
                    
                    // Update the UI to reflect the new entry fee
                    console.log("Entry fee successfully updated, refreshing UI...");
                    // Immediately update the displayed entry fee
                    entryFeeElement.textContent = newFeeEth;
                    // Then do a full refresh of contract information
                    updateContractInfo();
                },
                function(error) {
                    // Error callback
                    console.error("Set entry fee transaction failed:", error);
                    showError('Failed to set entry fee: ' + error);
                }
            );
        })
        .on('error', function(error) {
            console.error("Set entry fee error:", error);
            hideLoadingState();
            showError('Failed to set entry fee: ' + getErrorMessage(error));
        });
    } catch (error) {
        console.error("Set entry fee error:", error);
        hideLoadingState();
        showError('Failed to set entry fee: ' + getErrorMessage(error));
    }
}
