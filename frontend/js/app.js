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
            const networkName = await this.web3Provider.getNetworkName();
            const isCorrectNetwork = await this.web3Provider.isCorrectNetwork();
            this.uiController.updateNetworkStatus(networkName, isCorrectNetwork);
            
            // Step 5: Get initial lottery data
            await this.refreshData();
            
            console.log("App initialization complete!");
            
        } catch (error) {
            console.error("Failed to initialize app:", error);
            this.uiController.showError(`Initialization failed: ${error.message}`);
        }
    }
    
    // Refresh all data from the blockchain
    async refreshData() {
        console.log("Refreshing data...");
        
        try {
            this.uiController.showLoading();
            
            // Always get the latest entry fee
            this.entryFee = await this.contractInteraction.getEntryFee();
            this.uiController.updateEntryFee(this.entryFee);
            
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
                this.hasJoined = await this.contractInteraction.hasJoined(
                    this.currentLotteryId,
                    this.web3Provider.userAccount
                );
            } else {
                this.hasJoined = false;
            }
            
            // Update join button state
            this.uiController.updateJoinButton(
                this.web3Provider.isWriteConnected,
                this.hasJoined,
                this.currentLotteryInfo.completed
            );
            
            // Check if current user is owner and show admin controls
            if (this.web3Provider.userAccount) {
                const isOwner = await this.contractInteraction.isOwner();
                this.uiController.showAdminControls(isOwner);
            } else {
                this.uiController.showAdminControls(false);
            }
            
            // Hide loading indicators
            this.uiController.hideLoading();
            
        } catch (error) {
            console.error("Failed to refresh data:", error);
            
            // Show error but don't use showError to avoid disrupting the UI too much
            console.error(`Data refresh failed: ${error.message}`);
            
            // Hide loading indicators even on error
            this.uiController.hideLoading();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new App();
    await app.init();
}); 