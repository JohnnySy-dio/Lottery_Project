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
        this.setEntryFeeBtn = document.getElementById('setEntryFeeBtn');
        this.withdrawFeesBtn = document.getElementById('withdrawFeesBtn');
        this.newEntryFeeInput = document.getElementById('newEntryFeeInput');
        this.closeLotteryBtn = document.getElementById('closeLotteryBtn');
        this.setMinPlayersBtn = document.getElementById('setMinPlayersBtn');
        this.minPlayersInput = document.getElementById('minPlayersInput');
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
        
        // Close lottery button
        if (this.closeLotteryBtn) {
            this.closeLotteryBtn.addEventListener('click', async () => {
                try {
                    if (!this.web3Provider.isWriteConnected) {
                        this.uiController.showError("Please connect your wallet first.");
                        return;
                    }
                    
                    const isOwner = await this.contractInteraction.isOwner();
                    if (!isOwner) {
                        this.uiController.showError("Only the contract owner can close the lottery.");
                        return;
                    }
                    
                    // Visual feedback
                    this.closeLotteryBtn.disabled = true;
                    this.closeLotteryBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Closing...';
                    
                    // Set up transaction callbacks
                    this.contractInteraction.setCallbacks({
                        onPending: (message) => {
                            this.uiController.showPending(message);
                        },
                        onReceipt: (receipt) => {
                            console.log("Transaction confirmed in block:", receipt.blockNumber);
                        },
                        onConfirmation: (confirmationNumber, receipt) => {
                            this.uiController.showSuccess("Lottery closed successfully!");
                            this.uiController.showNotification("Lottery has been temporarily closed", "success");
                            
                            // Refresh data after closing
                            this.app.refreshData();
                            
                            // Reset button
                            this.closeLotteryBtn.disabled = false;
                            this.closeLotteryBtn.innerHTML = '<i class="bi bi-x-circle me-2"></i>Close Lottery';
                        },
                        onError: (errorMessage) => {
                            this.uiController.showError(`Failed to close lottery: ${errorMessage}`);
                            
                            // Reset button
                            this.closeLotteryBtn.disabled = false;
                            this.closeLotteryBtn.innerHTML = '<i class="bi bi-x-circle me-2"></i>Close Lottery';
                        }
                    });
                    
                    // Close lottery
                    await this.contractInteraction.closeLottery();
                    
                } catch (error) {
                    console.error("Failed to close lottery:", error);
                    this.uiController.showError(`Failed to close lottery: ${error.message}`);
                    
                    // Reset button
                    this.closeLotteryBtn.disabled = false;
                    this.closeLotteryBtn.innerHTML = '<i class="bi bi-x-circle me-2"></i>Close Lottery';
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

        // Set up Set Entry Fee button
        if (this.setEntryFeeBtn && this.newEntryFeeInput) {
            this.setEntryFeeBtn.addEventListener('click', async () => {
                try {
                    if (!this.web3Provider.isWriteConnected) {
                        this.uiController.showError("Please connect your wallet first.");
                        return;
                    }
                    
                    const isOwner = await this.contractInteraction.isOwner();
                    if (!isOwner) {
                        this.uiController.showError("Only the contract owner can set the entry fee.");
                        return;
                    }
                    
                    // Get and validate the new fee
                    const newFee = parseFloat(this.newEntryFeeInput.value);
                    if (isNaN(newFee) || newFee <= 0) {
                        this.uiController.showError("Please enter a valid entry fee greater than 0.");
                        return;
                    }
                    
                    // Visual feedback
                    this.setEntryFeeBtn.disabled = true;
                    this.setEntryFeeBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
                    
                    // Set up transaction callbacks
                    this.contractInteraction.setCallbacks({
                        onPending: (message) => {
                            this.uiController.showPending(message);
                        },
                        onReceipt: (receipt) => {
                            console.log("Transaction confirmed in block:", receipt.blockNumber);
                        },
                        onConfirmation: (confirmationNumber, receipt) => {
                            this.uiController.showSuccess(`Entry fee updated to ${newFee} ETH!`);
                            this.uiController.showNotification("Entry fee has been updated", "success");
                            
                            // Clear the input
                            this.newEntryFeeInput.value = '';
                            
                            // Refresh data after setting new fee
                            this.app.refreshData();
                            
                            // Reset button
                            this.setEntryFeeBtn.disabled = false;
                            this.setEntryFeeBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Fee';
                        },
                        onError: (errorMessage) => {
                            this.uiController.showError(`Failed to update entry fee: ${errorMessage}`);
                            
                            // Reset button
                            this.setEntryFeeBtn.disabled = false;
                            this.setEntryFeeBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Fee';
                        }
                    });
                    
                    // Set the new entry fee
                    await this.contractInteraction.setEntryFee(newFee);
                    
                } catch (error) {
                    console.error("Failed to set entry fee:", error);
                    this.uiController.showError(`Failed to set entry fee: ${error.message}`);
                    
                    // Reset button
                    this.setEntryFeeBtn.disabled = false;
                    this.setEntryFeeBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Fee';
                }
            });
        }
        
        // Set up Withdraw Admin Fees button
        if (this.withdrawFeesBtn) {
            this.withdrawFeesBtn.addEventListener('click', async () => {
                try {
                    if (!this.web3Provider.isWriteConnected) {
                        this.uiController.showError("Please connect your wallet first.");
                        return;
                    }
                    
                    const isOwner = await this.contractInteraction.isOwner();
                    if (!isOwner) {
                        this.uiController.showError("Only the contract owner can withdraw admin fees.");
                        return;
                    }
                    
                    // Visual feedback
                    this.withdrawFeesBtn.disabled = true;
                    this.withdrawFeesBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Withdrawing...';
                    
                    // Set up transaction callbacks
                    this.contractInteraction.setCallbacks({
                        onPending: (message) => {
                            this.uiController.showPending(message);
                        },
                        onReceipt: (receipt) => {
                            console.log("Transaction confirmed in block:", receipt.blockNumber);
                        },
                        onConfirmation: (confirmationNumber, receipt) => {
                            this.uiController.showSuccess("Admin fees withdrawn successfully!");
                            this.uiController.showNotification("Admin fees have been withdrawn to your wallet", "success");
                            
                            // Refresh data
                            this.app.refreshData();
                            
                            // Reset button
                            this.withdrawFeesBtn.disabled = false;
                            this.withdrawFeesBtn.innerHTML = '<i class="bi bi-cash-stack me-2"></i>Withdraw Admin Fees';
                        },
                        onError: (errorMessage) => {
                            this.uiController.showError(`Failed to withdraw fees: ${errorMessage}`);
                            
                            // Reset button
                            this.withdrawFeesBtn.disabled = false;
                            this.withdrawFeesBtn.innerHTML = '<i class="bi bi-cash-stack me-2"></i>Withdraw Admin Fees';
                        }
                    });
                    
                    // Withdraw admin fees
                    await this.contractInteraction.withdrawAdminFees();
                    
                } catch (error) {
                    console.error("Failed to withdraw admin fees:", error);
                    this.uiController.showError(`Failed to withdraw admin fees: ${error.message}`);
                    
                    // Reset button
                    this.withdrawFeesBtn.disabled = false;
                    this.withdrawFeesBtn.innerHTML = '<i class="bi bi-cash-stack me-2"></i>Withdraw Admin Fees';
                }
            });
        }
        
        // Set up Set Min Players button
        if (this.setMinPlayersBtn && this.minPlayersInput) {
            this.setMinPlayersBtn.addEventListener('click', async () => {
                try {
                    if (!this.web3Provider.isWriteConnected) {
                        this.uiController.showError("Please connect your wallet first.");
                        return;
                    }
                    
                    const isOwner = await this.contractInteraction.isOwner();
                    if (!isOwner) {
                        this.uiController.showError("Only the contract owner can set the minimum players.");
                        return;
                    }
                    
                    // Get and validate the new min players value
                    const minPlayers = parseInt(this.minPlayersInput.value);
                    if (isNaN(minPlayers) || minPlayers < 2) {
                        this.uiController.showError("Please enter a valid number of minimum players (at least 2).");
                        return;
                    }
                    
                    // Visual feedback
                    this.setMinPlayersBtn.disabled = true;
                    this.setMinPlayersBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
                    
                    // Set up transaction callbacks
                    this.contractInteraction.setCallbacks({
                        onPending: (message) => {
                            this.uiController.showPending(message);
                        },
                        onReceipt: (receipt) => {
                            console.log("Transaction confirmed in block:", receipt.blockNumber);
                        },
                        onConfirmation: (confirmationNumber, receipt) => {
                            this.uiController.showSuccess(`Minimum players updated to ${minPlayers}!`);
                            this.uiController.showNotification("Minimum players requirement has been updated", "success");
                            
                            // Clear the input
                            this.minPlayersInput.value = '';
                            
                            // Refresh data after setting new min players
                            this.app.refreshData();
                            
                            // Reset button
                            this.setMinPlayersBtn.disabled = false;
                            this.setMinPlayersBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Min Players';
                        },
                        onError: (errorMessage) => {
                            this.uiController.showError(`Failed to update minimum players: ${errorMessage}`);
                            
                            // Reset button
                            this.setMinPlayersBtn.disabled = false;
                            this.setMinPlayersBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Min Players';
                        }
                    });
                    
                    // Set the new minimum players
                    await this.contractInteraction.setMinPlayers(minPlayers);
                    
                } catch (error) {
                    console.error("Failed to set minimum players:", error);
                    this.uiController.showError(`Failed to set minimum players: ${error.message}`);
                    
                    // Reset button
                    this.setMinPlayersBtn.disabled = false;
                    this.setMinPlayersBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Min Players';
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