/**
 * Decentralized Lottery - Event Handlers
 * Sets up all event listeners for the application
 */

class EventHandlers {
    constructor(app, web3Provider, contractInteraction, uiController) {
        this.app = app;
        this.web3Provider = web3Provider;
        this.contractInteraction = contractInteraction;
        this.uiController = uiController;
        
        // Store button elements
        this.connectWalletBtn = document.getElementById('connectWalletBtn');
        this.joinLotteryBtn = document.getElementById('joinLotteryBtn');
        this.startLotteryBtn = document.getElementById('startLotteryBtn');
        this.pickWinnerBtn = document.getElementById('pickWinnerBtn');
        this.switchNetworkBtn = document.getElementById('switchNetworkBtn');
        this.refreshDataBtn = document.getElementById('refreshDataBtn');
    }
    
    // Initialize all event listeners
    setupEventListeners() {
        this._setupWalletConnectionEvents();
        this._setupLotteryActions();
        this._setupAdminActions();
        this._setupRefreshEvents();
    }
    
    // Setup wallet connection events
    _setupWalletConnectionEvents() {
        // Connect wallet button
        if (this.connectWalletBtn) {
            this.connectWalletBtn.addEventListener('click', async () => {
                try {
                    if (!window.ethereum) {
                        this.uiController.showError("MetaMask not detected. Please install MetaMask to interact with the contract.");
                        return;
                    }
                    
                    // Visual feedback
                    this.connectWalletBtn.textContent = 'Connecting...';
                    this.connectWalletBtn.disabled = true;
                    
                    await this.web3Provider.connectWallet();
                    
                    // Update UI
                    this.uiController.updateConnectionStatus(
                        this.web3Provider.isWriteConnected,
                        this.web3Provider.userAccount
                    );
                    
                    // Refresh data
                    await this.app.refreshData();
                    
                    // Reset button
                    this.connectWalletBtn.textContent = 'Wallet Connected';
                    
                } catch (error) {
                    console.error("Failed to connect wallet:", error);
                    this.uiController.showError(`Failed to connect wallet: ${error.message}`);
                    
                    // Reset button
                    this.connectWalletBtn.textContent = 'Connect Wallet';
                    this.connectWalletBtn.disabled = false;
                }
            });
        }
        
        // Switch network button
        if (this.switchNetworkBtn) {
            this.switchNetworkBtn.addEventListener('click', async () => {
                try {
                    // Visual feedback
                    this.switchNetworkBtn.textContent = 'Switching...';
                    this.switchNetworkBtn.disabled = true;
                    
                    await this.web3Provider.switchNetwork();
                    
                    // Update UI
                    this.app.refreshData();
                    
                    // Reset button
                    this.switchNetworkBtn.textContent = 'Switch Network';
                    this.switchNetworkBtn.disabled = false;
                    
                } catch (error) {
                    console.error("Failed to switch network:", error);
                    this.uiController.showError(`Failed to switch network: ${error.message}`);
                    
                    // Reset button
                    this.switchNetworkBtn.textContent = 'Switch Network';
                    this.switchNetworkBtn.disabled = false;
                }
            });
        }
        
        // MetaMask account change listener
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async (accounts) => {
                console.log("MetaMask accounts changed:", accounts);
                
                if (accounts.length === 0) {
                    // User disconnected wallet
                    this.web3Provider.userAccount = null;
                    this.web3Provider.isWriteConnected = false;
                    this.uiController.updateConnectionStatus(false);
                    
                    if (this.connectWalletBtn) {
                        this.connectWalletBtn.textContent = 'Connect Wallet';
                        this.connectWalletBtn.disabled = false;
                    }
                    
                } else {
                    // User changed account
                    this.web3Provider.userAccount = accounts[0];
                    this.web3Provider.isWriteConnected = true;
                    this.uiController.updateConnectionStatus(true, accounts[0]);
                    
                    if (this.connectWalletBtn) {
                        this.connectWalletBtn.textContent = 'Wallet Connected';
                        this.connectWalletBtn.disabled = true;
                    }
                }
                
                // Refresh data with new account
                await this.app.refreshData();
            });
            
            // Network change listener
            window.ethereum.on('chainChanged', async (chainId) => {
                console.log("MetaMask network changed:", chainId);
                
                // Check if it's the correct network
                const isCorrectNetwork = chainId === CONFIG.CHAIN_ID;
                const networkName = await this.web3Provider.getNetworkName();
                
                this.uiController.updateNetworkStatus(networkName, isCorrectNetwork);
                
                // Toggle network switch button
                if (this.switchNetworkBtn) {
                    this.switchNetworkBtn.style.display = isCorrectNetwork ? 'none' : 'inline-block';
                }
                
                // Refresh application data
                await this.app.refreshData();
            });
        }
    }
    
    // Setup lottery action events
    _setupLotteryActions() {
        // Join lottery button
        if (this.joinLotteryBtn) {
            this.joinLotteryBtn.addEventListener('click', async () => {
                try {
                    if (!this.web3Provider.isWriteConnected) {
                        this.uiController.showError("Please connect your wallet first.");
                        return;
                    }
                    
                    // Visual feedback
                    this.joinLotteryBtn.disabled = true;
                    this.joinLotteryBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Joining...';
                    
                    // Set up transaction callbacks
                    this.contractInteraction.setCallbacks({
                        onPending: (message) => {
                            this.uiController.showPending(message);
                        },
                        onReceipt: (receipt) => {
                            console.log("Transaction confirmed in block:", receipt.blockNumber);
                        },
                        onConfirmation: (confirmationNumber, receipt) => {
                            this.uiController.showSuccess("Successfully joined the lottery!");
                            this.uiController.showNotification("You have successfully entered the lottery!", "success");
                            
                            // Refresh data after joining
                            this.app.refreshData();
                            
                            // Reset button
                            this.joinLotteryBtn.disabled = true;
                            this.joinLotteryBtn.textContent = 'Already Joined';
                        },
                        onError: (errorMessage) => {
                            this.uiController.showError(`Failed to join lottery: ${errorMessage}`);
                            
                            // Reset button
                            this.joinLotteryBtn.disabled = false;
                            this.joinLotteryBtn.textContent = 'Join Lottery';
                        }
                    });
                    
                    // Enter lottery
                    await this.contractInteraction.enterLottery();
                    
                } catch (error) {
                    console.error("Failed to join lottery:", error);
                    this.uiController.showError(`Failed to join lottery: ${error.message}`);
                    
                    // Reset button
                    this.joinLotteryBtn.disabled = false;
                    this.joinLotteryBtn.textContent = 'Join Lottery';
                }
            });
        }
    }
    
    // Setup admin action events
    _setupAdminActions() {
        // Start new lottery button
        if (this.startLotteryBtn) {
            this.startLotteryBtn.addEventListener('click', async () => {
                try {
                    if (!this.web3Provider.isWriteConnected) {
                        this.uiController.showError("Please connect your wallet first.");
                        return;
                    }
                    
                    const isOwner = await this.contractInteraction.isOwner();
                    if (!isOwner) {
                        this.uiController.showError("Only the contract owner can start a new lottery.");
                        return;
                    }
                    
                    // Visual feedback
                    this.startLotteryBtn.disabled = true;
                    this.startLotteryBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Starting...';
                    
                    // Set up transaction callbacks
                    this.contractInteraction.setCallbacks({
                        onPending: (message) => {
                            this.uiController.showPending(message);
                        },
                        onReceipt: (receipt) => {
                            console.log("Transaction confirmed in block:", receipt.blockNumber);
                        },
                        onConfirmation: (confirmationNumber, receipt) => {
                            this.uiController.showSuccess("New lottery started successfully!");
                            this.uiController.showNotification("New lottery round has been created", "success");
                            
                            // Refresh data after starting
                            this.app.refreshData();
                            
                            // Reset button
                            this.startLotteryBtn.disabled = false;
                            this.startLotteryBtn.textContent = 'Start New Lottery';
                        },
                        onError: (errorMessage) => {
                            this.uiController.showError(`Failed to start new lottery: ${errorMessage}`);
                            
                            // Reset button
                            this.startLotteryBtn.disabled = false;
                            this.startLotteryBtn.textContent = 'Start New Lottery';
                        }
                    });
                    
                    // Start new lottery
                    await this.contractInteraction.startNewLottery();
                    
                } catch (error) {
                    console.error("Failed to start new lottery:", error);
                    this.uiController.showError(`Failed to start new lottery: ${error.message}`);
                    
                    // Reset button
                    this.startLotteryBtn.disabled = false;
                    this.startLotteryBtn.textContent = 'Start New Lottery';
                }
            });
        }
        
        // Pick winner button
        if (this.pickWinnerBtn) {
            this.pickWinnerBtn.addEventListener('click', async () => {
                try {
                    if (!this.web3Provider.isWriteConnected) {
                        this.uiController.showError("Please connect your wallet first.");
                        return;
                    }
                    
                    const isOwner = await this.contractInteraction.isOwner();
                    if (!isOwner) {
                        this.uiController.showError("Only the contract owner can pick a winner.");
                        return;
                    }
                    
                    // Get current lottery ID
                    const lotteryId = await this.contractInteraction.getCurrentLotteryId();
                    
                    // Visual feedback
                    this.pickWinnerBtn.disabled = true;
                    this.pickWinnerBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Picking Winner...';
                    
                    // Set up transaction callbacks
                    this.contractInteraction.setCallbacks({
                        onPending: (message) => {
                            this.uiController.showPending(message);
                        },
                        onReceipt: (receipt) => {
                            console.log("Transaction confirmed in block:", receipt.blockNumber);
                        },
                        onConfirmation: (confirmationNumber, receipt) => {
                            this.uiController.showSuccess("Winner has been selected successfully!");
                            this.uiController.showNotification("A winner has been randomly selected!", "success");
                            
                            // Refresh data after picking winner
                            this.app.refreshData();
                            
                            // Reset button
                            this.pickWinnerBtn.disabled = false;
                            this.pickWinnerBtn.textContent = 'Pick Winner';
                        },
                        onError: (errorMessage) => {
                            this.uiController.showError(`Failed to pick winner: ${errorMessage}`);
                            
                            // Reset button
                            this.pickWinnerBtn.disabled = false;
                            this.pickWinnerBtn.textContent = 'Pick Winner';
                        }
                    });
                    
                    // Pick winner
                    await this.contractInteraction.pickWinner(lotteryId);
                    
                } catch (error) {
                    console.error("Failed to pick winner:", error);
                    this.uiController.showError(`Failed to pick winner: ${error.message}`);
                    
                    // Reset button
                    this.pickWinnerBtn.disabled = false;
                    this.pickWinnerBtn.textContent = 'Pick Winner';
                }
            });
        }
    }
    
    // Setup refresh events
    _setupRefreshEvents() {
        // Refresh data button
        if (this.refreshDataBtn) {
            this.refreshDataBtn.addEventListener('click', async () => {
                try {
                    // Visual feedback
                    this.refreshDataBtn.disabled = true;
                    this.refreshDataBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Refreshing...';
                    
                    // Refresh data
                    await this.app.refreshData();
                    
                    // Reset button
                    this.refreshDataBtn.disabled = false;
                    this.refreshDataBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
                    
                } catch (error) {
                    console.error("Failed to refresh data:", error);
                    
                    // Reset button
                    this.refreshDataBtn.disabled = false;
                    this.refreshDataBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
                }
            });
        }
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.app.refreshData();
        }, 30000);
    }
} 