/**
 * Decentralized Lottery - Main Application
 * Orchestrates all the modules and provides the main functionality
 */

class App {
    constructor() {
        // Initialize modules
        this.web3Provider = new Web3Provider();
        this.contractInteraction = new ContractInteraction(this.web3Provider);
        this.uiController = new UIController();
        this.eventHandlers = new EventHandlers(
            this,
            this.web3Provider,
            this.contractInteraction,
            this.uiController
        );
        
        // Default values
        this.currentLotteryId = null;
        this.currentLotteryInfo = null;
        this.participants = [];
        this.hasJoined = false;
        this.entryFee = null;
        this.isContractPaused = false;
        // Track randomness commitment status
        this.hasCommittedRandomness = false;
        this.randomnessCommitTime = null;
        // Set timer reference
        this.pickWinnerTimer = null;
    }
    
    // Initialize the application
    async init() {
        console.log("Initializing Decentralized Lottery App...");
        console.log("Current chain ID:", CONFIG.CHAIN_ID);
        console.log("Is Ganache:", CONFIG.CHAIN_ID === "0x539");
        
        try {
            // We'll handle the timer in a cleaner way after DOM is fully loaded
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeCountdownTimer();
            });
            
            // Step 1: Try to initialize web3
            await this.web3Provider.init();
            
            // Step 2: Set up event listeners
            this.eventHandlers.setupEventListeners();
            
            // Step 3: Check if we have a wallet connected already
            if (this.web3Provider.isWriteConnected) {
                this.uiController.updateConnectionStatus(
                    true,
                    this.web3Provider.userAccount
                );
            } else {
                this.uiController.updateConnectionStatus(false);
            }
            
            // Step 4: Check network and show appropriate UI
            try {
                const chainId = await window.ethereum?.request({ method: 'eth_chainId' });
                const networkName = this.web3Provider.getNetworkName(chainId);
                const isCorrectNetwork = await this.web3Provider.isCorrectNetwork();
                this.uiController.updateNetworkStatus(networkName, isCorrectNetwork);
            } catch (error) {
                // Fallback for when window.ethereum is not available (like in Ganache mode)
                console.log("Could not get chain ID from ethereum object, using CONFIG value");
                const networkName = this.web3Provider.getNetworkName(CONFIG.CHAIN_ID);
                this.uiController.updateNetworkStatus(networkName, true);
            }
            
            // Step 5: Get initial lottery data
            await this.refreshData();
            
            console.log("App initialization complete!");
            
        } catch (error) {
            console.error("Failed to initialize app:", error);
            this.uiController.showError(`Initialization failed: ${error.message}`);
        }
    }
    
    // Refresh all data from the blockchain
    async refreshData(forceRefresh = false) {
        console.log(`Refreshing data... ${forceRefresh ? '(Force refresh)' : ''}`);
        
        try {
            // Show loading
            this.uiController.showLoading();
            
            // Check if we have a valid contract connection
            if (!this.web3Provider.readContract && !this.web3Provider.writeContract) {
                console.warn("No contract connection available");
                this.uiController.showWarning(`No contract deployed on ${CONFIG.NETWORKS[CONFIG.CHAIN_ID]} network. Please deploy the contract first.`);
                this.uiController.hideLoading();
                return;
            }
            
            // Check if contract is paused
            try {
                this.isContractPaused = await this.contractInteraction.isContractPaused();
                if (this.isContractPaused) {
                    this.uiController.showWarning("Contract is currently paused. Most operations are disabled.");
                }
            } catch (error) {
                console.warn("Failed to check contract pause status:", error);
            }
            
            // Always get the latest entry fee
            this.entryFee = await this.contractInteraction.getEntryFee();
            this.uiController.updateEntryFee(this.entryFee);
            
            // Get admin fees
            const adminFees = await this.contractInteraction.getAdminFees();
            this.uiController.updateAdminFees(adminFees);
            
            // Get current lottery ID
            this.currentLotteryId = await this.contractInteraction.getCurrentLotteryId();
            
            // Get lottery info
            this.currentLotteryInfo = await this.contractInteraction.getLotteryInfo(this.currentLotteryId);
            
            // Update UI with lottery info
            this.uiController.updateLotteryInfo(this.currentLotteryInfo);
            
            // Get participants
            this.participants = await this.contractInteraction.getParticipants(this.currentLotteryId);
            this.uiController.populateParticipantsTable(this.participants);
            
            // Get previous winners
            this.previousWinners = await this.contractInteraction.getPreviousWinners();
            this.uiController.populateWinnersTable(this.previousWinners);
            
            // Check if current user has joined
            if (this.web3Provider.userAccount) {
                // Force a fresh check of hasJoined status when switching accounts
                if (forceRefresh) {
                    this.hasJoined = false; // Reset first
                }
                
                this.hasJoined = await this.contractInteraction.hasJoined(
                    this.currentLotteryId,
                    this.web3Provider.userAccount
                );
                
                // Get and display account balance
                const balance = await this.web3Provider.getAccountBalance();
                
                // Update connection status with balance
                this.uiController.updateConnectionStatus(
                    this.web3Provider.isWriteConnected,
                    this.web3Provider.userAccount,
                    balance
                );
                
                // Update Join button state based on current account's participation
                this.uiController.updateJoinButton(
                    this.web3Provider.isWriteConnected, 
                    this.hasJoined, 
                    this.currentLotteryInfo?.isOpen
                );
            } else {
                this.hasJoined = false;
                
                // Update Join button for disconnected state
                this.uiController.updateJoinButton(
                    false, 
                    false, 
                    this.currentLotteryInfo?.isOpen
                );
            }
            
            // Check if current user is owner and show admin controls
            if (this.web3Provider.userAccount) {
                console.log("Checking if current account is owner...");
                const isOwner = await this.contractInteraction.isOwner();
                console.log("Owner check completed. Result:", isOwner);
                
                // Show admin controls
                this.uiController.showAdminControls(isOwner);
                
                // If owner, update admin button states based on lottery state
                if (isOwner) {
                    this.uiController.updateAdminButtons(this.currentLotteryInfo);
                    
                    // Check if we need to restore the timer state (e.g., after page refresh)
                    if (this.hasCommittedRandomness && this.randomnessCommitTime) {
                        const elapsedMs = Date.now() - this.randomnessCommitTime;
                        if (elapsedMs < 60000) {  // Less than 1 minute has passed
                            this.startPickWinnerTimer();
                        }
                    }
                }
            } else {
                console.log("No connected account, hiding admin controls");
                this.uiController.showAdminControls(false);
            }
            
            // Hide loading indicators
            this.uiController.hideLoading();
            
        } catch (error) {
            console.error("Failed to refresh data:", error);
            
            // Check if this is due to no contract deployed
            if (CONFIG.CHAIN_ID === "0x539" && (!CONFIG.CONTRACT_ADDRESS || CONFIG.CONTRACT_ADDRESS === "")) {
                this.uiController.showWarning("No contract deployed on local network. Please deploy the contract first.");
            } else {
                // Show error but don't use showError to avoid disrupting the UI too much
                console.error(`Data refresh failed: ${error.message}`);
            }
            
            // Hide loading indicators even on error
            this.uiController.hideLoading();
        }
    }
    
    // Helper function to ensure blockchain time has advanced enough
    async ensureBlockchainTime() {
        // This method creates a small dummy transaction to generate a new block
        // which can help ensure the blockchain time has advanced properly before picking a winner
        console.log("Ensuring blockchain time has advanced enough...");
        if (this.web3Provider && this.web3Provider.isWriteConnected) {
            try {
                const userAccount = this.web3Provider.userAccount;
                // Make a trivial transaction to the contract to generate a new block
                await this.web3Provider.writeWeb3.eth.sendTransaction({
                    from: userAccount,
                    to: userAccount,
                    value: 0,
                    gas: 30000,
                    data: '0x' // Empty data
                });
                console.log("Dummy transaction completed to advance blockchain time");
                return true;
            } catch (error) {
                console.warn("Failed to ensure blockchain time with dummy transaction:", error);
                return false;
            }
        }
        return false;
    }
    
    // Pick winner using the two-step process
    async pickWinner() {
        try {
            console.log("Attempting to pick winner...");
            
            // Optional: Ensure blockchain has advanced enough
            await this.ensureBlockchainTime();
            
            // Call the pickWinner method which now handles the two-step process
            await this.contractInteraction.pickWinner(this.currentLotteryId);
            
            // Reset randomness commitment state
            this.hasCommittedRandomness = false;
            this.randomnessCommitTime = null;
            
            // Hide countdown timer if visible
            const countdownTimer = document.getElementById('countdownTimer');
            if (countdownTimer) {
                countdownTimer.classList.remove('visible');
                countdownTimer.style.display = 'none';
            }
            
            // Refresh data after transaction completes
            setTimeout(() => this.refreshData(true), 1000);
        } catch (error) {
            console.error("Failed to pick winner:", error);
            this.uiController.showError(`Failed to pick winner: ${error.message}`);
        }
    }
    
    // Manually commit randomness (for advanced users)
    async commitRandomness() {
        try {
            console.log("Starting randomness commitment process...");
            await this.contractInteraction.commitRandomness();
            
            // Mark that randomness has been committed and record the time
            this.hasCommittedRandomness = true;
            this.randomnessCommitTime = Date.now();
            console.log("Randomness commitment time recorded:", new Date(this.randomnessCommitTime).toISOString());
            
            // Start timer for pick winner button
            this.startPickWinnerTimer();
            
            // Refresh data after transaction completes
            setTimeout(() => this.refreshData(true), 1000);
            
            // Show success message with instructions
            this.uiController.showSuccess(
                "Randomness commitment successful! Please wait at least 1 minute before picking the winner. " +
                "This delay ensures fair randomness selection."
            );
            
            // Show detailed notification
            this.uiController.showNotification(
                "Randomness committed! The 1-minute waiting period prevents manipulation " +
                "by ensuring the final random value incorporates future blockchain data that cannot be predicted.", 
                "success"
            );
        } catch (error) {
            console.error("Failed to commit randomness:", error);
            this.uiController.showError(`Failed to commit randomness: ${error.message}`);
        }
    }
    
    // Start timer for enabling pick winner button
    startPickWinnerTimer() {
        // Clear any existing timer
        if (this.pickWinnerTimer) {
            clearInterval(this.pickWinnerTimer);
        }
        
        // Get the countdown timer elements
        const countdownTimer = document.getElementById('countdownTimer');
        const countdownText = document.getElementById('countdownText');
        
        // Show the countdown timer by adding a class
        if (countdownTimer) {
            // Using classList instead of style to avoid CSP issues
            countdownTimer.classList.add('visible');
            // Also explicitly set display style
            countdownTimer.style.display = 'block';
            console.log("Countdown timer is now visible");
        }
        
        // We'll wait 70 seconds instead of 65 to ensure blockchain consensus
        const waitTimeMs = 70000; // 70 seconds in milliseconds
        const endTime = this.randomnessCommitTime + waitTimeMs;
        console.log("Timer started with wait time:", waitTimeMs/1000, "seconds");
        console.log("Timer will end at:", new Date(endTime).toISOString());
        
        // Update button state every second
        this.pickWinnerTimer = setInterval(() => {
            const now = Date.now();
            const elapsedMs = now - this.randomnessCommitTime;
            const remainingSecs = Math.max(0, Math.ceil(waitTimeMs / 1000) - Math.floor(elapsedMs / 1000));
            
            // Debug logging at key intervals
            if (remainingSecs === 60 || remainingSecs === 30 || remainingSecs === 10 || remainingSecs === 5 || remainingSecs === 0) {
                console.log(`Timer update: ${remainingSecs}s remaining, elapsed: ${Math.floor(elapsedMs/1000)}s, current time: ${new Date(now).toISOString()}`);
            }
            
            // Update the countdown text
            if (countdownText) {
                countdownText.textContent = `Waiting: ${remainingSecs}s`;
                
                // Add urgent class when less than 10 seconds remain
                if (remainingSecs < 10 && remainingSecs > 0) {
                    if (countdownTimer) {
                        countdownTimer.classList.add('urgent');
                        countdownTimer.classList.remove('normal');
                    }
                } else {
                    if (countdownTimer) {
                        countdownTimer.classList.add('normal');
                        countdownTimer.classList.remove('urgent');
                    }
                }
            }
            
            // Get the pick winner button element
            const pickWinnerBtn = document.getElementById('pickWinnerBtn');
            if (!pickWinnerBtn) return;
            
            if (remainingSecs > 0) {
                // Still waiting, update button text with countdown
                pickWinnerBtn.disabled = true;
                pickWinnerBtn.innerHTML = `<i class="bi bi-trophy me-2"></i>Step 2: Pick Winner (Wait ${remainingSecs}s)`;
            } else {
                // Time's up, enable the button
                pickWinnerBtn.disabled = false;
                pickWinnerBtn.innerHTML = `<i class="bi bi-trophy me-2"></i>Step 2: Pick Winner`;
                
                // Hide the countdown timer
                if (countdownTimer) {
                    countdownTimer.classList.remove('visible');
                    // Explicitly set display to none
                    countdownTimer.style.display = 'none';
                }
                
                // Clear the interval now that we're done
                clearInterval(this.pickWinnerTimer);
                this.pickWinnerTimer = null;
                
                // Show notification that the button is now active
                this.uiController.showNotification("You can now pick a winner!", "success");
                console.log("Timer completed, pick winner button enabled");
            }
        }, 1000);
    }
    
    // For testing purposes only - shows the countdown timer
    testCountdownTimer() {
        console.log("Testing countdown timer visibility");
        
        // Simulate randomness commitment
        this.hasCommittedRandomness = true;
        this.randomnessCommitTime = Date.now();
        
        // Get the countdown timer elements
        const countdownTimer = document.getElementById('countdownTimer');
        if (countdownTimer) {
            countdownTimer.classList.add('visible');
            // Explicitly set display to block
            countdownTimer.style.display = 'block';
            console.log("Countdown timer should be visible now");
        } else {
            console.error("Countdown timer element not found!");
        }
        
        // Start the timer
        this.startPickWinnerTimer();
    }
    
    // Initialize countdown timer display
    initializeCountdownTimer() {
        console.log("Initializing countdown timer");
        
        // Add test button for debugging timer visibility issues
        const adminActions = document.getElementById('adminActions');
        if (adminActions) {
            const testButton = document.createElement('button');
            testButton.id = 'testTimerBtn';
            testButton.className = 'btn btn-secondary mt-3';
            testButton.innerHTML = '<i class="bi bi-clock"></i> Test Timer Visibility';
            testButton.onclick = () => this.testCountdownTimer();
            adminActions.appendChild(testButton);
            console.log("Test timer button added to admin actions");
        }
        
        console.log("Countdown timer initialization complete - using CSS classes for styling");
    }
    
    // Set emergency stop status
    async setEmergencyStop(isPaused) {
        try {
            await this.contractInteraction.setEmergencyStop(isPaused);
            
            // Update UI immediately
            this.uiController.updateEmergencyStopButtons(isPaused);
            
            // Refresh data after transaction completes
            setTimeout(() => this.refreshData(true), 1000);
            
            // Show success message
            const message = isPaused 
                ? "Contract has been paused. All operations are temporarily disabled." 
                : "Contract has been resumed. All operations are now enabled.";
            this.uiController.showSuccess(message);
        } catch (error) {
            console.error("Failed to set emergency stop:", error);
            this.uiController.showError(`Failed to set emergency stop: ${error.message}`);
        }
    }
    
    // Transfer ownership
    async transferOwnership(newOwnerAddress) {
        try {
            await this.contractInteraction.transferOwnership(newOwnerAddress);
            
            // Refresh data after transaction completes
            setTimeout(() => this.refreshData(true), 1000);
            
            // Show success message with warning
            this.uiController.showSuccess(
                `Ownership transferred to ${newOwnerAddress}. You no longer have admin access to this contract.`
            );
        } catch (error) {
            console.error("Failed to transfer ownership:", error);
            this.uiController.showError(`Failed to transfer ownership: ${error.message}`);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Make sure CONFIG is loaded and accessible before using it
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG object is not available. Make sure config.js is loaded before app.js');
    } else {
        console.log('CONFIG object loaded, contract address:', CONFIG.CONTRACT_ADDRESS);
        
        // Set the footer contract address with the value from CONFIG
        const footerAddressElement = document.getElementById('footerContractAddress');
        if (footerAddressElement) {
            footerAddressElement.innerHTML = CONFIG.CONTRACT_ADDRESS;
            console.log('Footer contract address set to:', CONFIG.CONTRACT_ADDRESS);
        } else {
            console.error('Footer contract address element not found');
        }
    }
    
    // Create app instance and make it globally available
    window.app = new App();
    await window.app.init();
    
    // Debug button for admin controls
    const debugBtn = document.createElement('button');
    debugBtn.id = 'debugAdminBtn';
    debugBtn.className = 'btn btn-secondary mt-3';
    debugBtn.textContent = 'Debug Admin Controls';
    debugBtn.addEventListener('click', () => {
        const adminEl = document.getElementById('adminActions');
        if (adminEl) {
            // Check if element is visible in DOM
            const isVisible = window.getComputedStyle(adminEl).display !== 'none';
            console.log('Admin element:', adminEl);
            console.log('Admin classes:', adminEl.className);
            console.log('Admin display style:', window.getComputedStyle(adminEl).display);
            console.log('Is visible?', isVisible);
            
            // Force show if hidden
            if (!isVisible) {
                adminEl.style.display = 'block';
                console.log('Forced display:block on admin element');
            } else {
                adminEl.style.display = 'none';
                console.log('Forced display:none on admin element for toggle');
            }
        } else {
            console.log('Admin element not found in DOM');
        }
    });
    document.body.appendChild(debugBtn);
}); 