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
    }
    
    // Initialize the application
    async init() {
        console.log("Initializing Decentralized Lottery App...");
        console.log("Current chain ID:", CONFIG.CHAIN_ID);
        console.log("Is Ganache:", CONFIG.CHAIN_ID === "0x539");
        
        try {
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
                
                // Update UI based on owner status
                this.uiController.showAdminControls(isOwner);
                
                // If owner, update admin button states based on lottery state
                if (isOwner) {
                    this.uiController.updateAdminButtons(this.currentLotteryInfo);
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
    
    const app = new App();
    await app.init();
}); 