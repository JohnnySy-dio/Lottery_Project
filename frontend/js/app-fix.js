// Update contract info in the UI
async function updateContractInfo() {
    try {
        // Check if web3 and contract are initialized
        if (!web3 || !lotteryContract) {
            console.error("Web3 or contract not initialized");
            
            // Update UI elements to show error
            const errorMsg = "Contract not available";
            lotteryIdElement.textContent = errorMsg;
            entryFeeElement.textContent = errorMsg;
            minPlayersElement.textContent = errorMsg;
            lotteryStatusElement.textContent = errorMsg;
            prizePoolElement.textContent = errorMsg;
            playerCountElement.textContent = errorMsg;
            
            return;
        }
        
        // Get contract details
        const lotteryId = await lotteryContract.methods.lotteryId().call();
        const entryFee = await lotteryContract.methods.entryFee().call();
        const minPlayers = await lotteryContract.methods.minPlayers().call();
        const isOpen = await lotteryContract.methods.lotteryOpen().call();
        const balance = await lotteryContract.methods.getBalance().call();
        const playerCount = await lotteryContract.methods.getPlayerCount().call();
        
        // Convert wei to ETH
        const entryFeeEth = web3.utils.fromWei(entryFee, 'ether');
        const balanceEth = web3.utils.fromWei(balance, 'ether');
        
        // Update UI elements
        lotteryIdElement.textContent = lotteryId;
        entryFeeElement.textContent = entryFeeEth;
        console.log("Updated entry fee display to:", entryFeeEth, "ETH");
        minPlayersElement.textContent = minPlayers;
        lotteryStatusElement.textContent = isOpen ? 'Open' : 'Closed';
        lotteryStatusElement.className = isOpen ? 'status-open' : 'status-closed';
        prizePoolElement.textContent = balanceEth;
        playerCountElement.textContent = playerCount;
        
        // Save current lottery ID for future reference
        currentLotteryId = lotteryId;
        
        return true; // Indicate successful update
        
    } catch (error) {
        console.error("Error updating contract info:", error);
        
        // Show error in UI instead of leaving "Loading..."
        const errorMsg = "Failed to load";
        lotteryIdElement.textContent = errorMsg;
        entryFeeElement.textContent = errorMsg;
        minPlayersElement.textContent = errorMsg;
        lotteryStatusElement.textContent = errorMsg;
        prizePoolElement.textContent = errorMsg;
        playerCountElement.textContent = errorMsg;
        
        return false; // Indicate failed update
    }
}
