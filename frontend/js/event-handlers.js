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
        this.networkSelector = document.getElementById('networkSelector');
        this.ganacheAccountSelectorBtn = document.getElementById('ganacheAccountSelectorBtn');
    }
    
    // Initialize all event listeners
    setupEventListeners() {
        this._setupWalletConnectionEvents();
        this._setupNetworkSelectionEvents();
        this._setupLotteryActions();
        this._setupAdminActions();
        this._setupRefreshEvents();
        this._setupGanacheEvents();
    }
    
    // Setup wallet connection events
    _setupWalletConnectionEvents() {
        // Connect wallet button
        if (this.connectWalletBtn) {
            this.connectWalletBtn.addEventListener('click', async () => {
                try {
                    // Check if we're on Ganache network 
                    if (CONFIG.CHAIN_ID === "0x539") {
                        // For Ganache, we'll show the account selector modal
                        this._setupGanacheAccountSelector();
                        
                        // We'll set up a custom callback that will be triggered when the accounts are loaded
                        this.web3Provider.onGanacheAccountsLoaded = async (accounts) => {
                            await this._populateGanacheAccountsTable(accounts);
                            
                            // Show the modal
                            const modal = new bootstrap.Modal(document.getElementById('ganacheAccountSelectorModal'));
                            modal.show();
                        };
                        
                        // Load Ganache accounts
                        await this.web3Provider.getGanacheAccounts();
                    } else {
                        // For non-Ganache networks, check for MetaMask
                        if (!window.ethereum) {
                            this.uiController.showError("MetaMask not detected. Please install MetaMask to interact with the contract.");
                            return;
                        }
                        
                        // Visual feedback
                        this.connectWalletBtn.textContent = 'Connecting...';
                        this.connectWalletBtn.disabled = true;
                        
                        await this.web3Provider.connectWallet();
                        
                        // Get account balance if connected
                        let balance = null;
                        if (this.web3Provider.isWriteConnected && this.web3Provider.userAccount) {
                            balance = await this.web3Provider.getAccountBalance();
                        }
                        
                        // Update UI
                        this.uiController.updateConnectionStatus(
                            this.web3Provider.isWriteConnected,
                            this.web3Provider.userAccount,
                            balance
                        );
                        
                        // Refresh data
                        await this.app.refreshData();
                        
                        // Reset button
                        if (this.web3Provider.isWriteConnected) {
                            this.connectWalletBtn.textContent = 'Wallet Connected';
                        } else {
                            this.connectWalletBtn.textContent = 'Connect Wallet';
                            this.connectWalletBtn.disabled = false;
                        }
                    }
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
                    
                    // Switch to currently selected network
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
                    
                    // Get the account balance
                    let balance = null;
                    try {
                        if (this.web3Provider.writeWeb3) {
                            const balanceWei = await this.web3Provider.writeWeb3.eth.getBalance(accounts[0]);
                            balance = this.web3Provider.writeWeb3.utils.fromWei(balanceWei, 'ether');
                        }
                    } catch (error) {
                        console.error("Error getting account balance:", error);
                    }
                    
                    this.uiController.updateConnectionStatus(true, accounts[0], balance);
                    
                    if (this.connectWalletBtn) {
                        this.connectWalletBtn.textContent = 'Wallet Connected';
                        this.connectWalletBtn.disabled = true;
                    }
                }
                
                // Refresh data with new account
                await this.app.refreshData();
                
                // Update Ganache UI elements
                this._updateGanacheUI();
            });
            
            // Network change listener
            window.ethereum.on('chainChanged', async (rawChainId) => {
                console.log("MetaMask network changed to (raw):", rawChainId);

                // Normalize chainId for Ganache - handle all possible Ganache chain IDs
                // 0x539 (hex for 1337), 1337 (decimal), 0x1691 (hex for 5777), 5777 (decimal)
                let chainId = rawChainId;
                if (rawChainId === "0x539" || rawChainId === "1337" || rawChainId === 1337 ||
                    rawChainId === "0x1691" || rawChainId === "5777" || rawChainId === 5777) {
                    chainId = "0x539"; // Normalize to our standard Ganache chain ID
                    console.log("Ganache network detected. Normalized chain ID to:", chainId);
                }
                console.log("MetaMask network changed to (normalized):", chainId);

                const isSupported = this.web3Provider.isNetworkSupported(chainId);
                const networkName = this.web3Provider.getNetworkName(chainId);

                // Update the network selector button text
                if (this.networkSelector) {
                    this.networkSelector.textContent = networkName;
                }

                this.uiController.updateNetworkStatus(networkName, isSupported);

                // Toggle network switch button
                if (this.switchNetworkBtn) {
                    this.switchNetworkBtn.style.display = isSupported ? 'none' : 'inline-block';
                }

                if (isSupported) {
                    if (CONFIG.CHAIN_ID !== chainId) {
                        console.log(`Updating global config to chainId: ${chainId}`);
                        CONFIG.setNetwork(chainId);
                        // web3Provider's internal state (read/write contracts) should be re-established by its own methods or by refreshData
                        await this.app.refreshData();
                    } else {
                        console.log(`ChainId ${chainId} is already the current CONFIG.CHAIN_ID. No config update needed from chainChanged event.`);
                    }
                } else {
                    this.uiController.showWarning(`Network ${networkName} (ID: ${chainId}) is not supported by this application. Please switch to a supported network.`);
                }

                // Update Ganache UI elements
                this._updateGanacheUI();
            });
        }
    }
    
    // Setup network selection events
    _setupNetworkSelectionEvents() {
        // Network selector dropdown
        const networkItems = document.querySelectorAll('.dropdown-item[data-network]');
        
        networkItems.forEach(item => {
            item.addEventListener('click', async (event) => {
                event.preventDefault();
                
                const targetNetwork = event.target.getAttribute('data-network');
                const networkName = CONFIG.NETWORKS[targetNetwork];
                
                if (!networkName) {
                    this.uiController.showError(`Invalid network selection: ${targetNetwork}`);
                    return;
                }
                
                this.uiController.showStatus(`Switching to ${networkName}...`, 'info');
                
                // Special handling for switching to Ganache
                const isCurrentlyGanache = CONFIG.CHAIN_ID === "0x539";
                const isSwitchingToGanache = targetNetwork === "0x539";
                
                // If switching to Ganache from another network, we need to disconnect any existing wallet first
                if (isSwitchingToGanache && !isCurrentlyGanache) {
                    if (this.web3Provider.isWriteConnected) {
                        console.log("Disconnecting MetaMask wallet before switching to Ganache");
                        // Reset wallet connection state
                        this.web3Provider.userAccount = null;
                        this.web3Provider.isWriteConnected = false;
                        this.web3Provider.writeWeb3 = null;
                        this.web3Provider.writeContract = null;
                        
                        // Update UI to show disconnected state
                        this.uiController.updateConnectionStatus(false);
                    }
                }
                // If switching away from Ganache to another network, reset connection state
                else if (isCurrentlyGanache && !isSwitchingToGanache) {
                    console.log("Switching away from Ganache, resetting connection state");
                    // Reset Ganache connection state
                    this.web3Provider.userAccount = null;
                    this.web3Provider.isWriteConnected = false;
                    this.web3Provider.writeWeb3 = null;
                    this.web3Provider.writeContract = null;
                    
                    // Update UI to show disconnected state
                    this.uiController.updateConnectionStatus(false);
                }
                
                // Update global config
                CONFIG.setNetwork(targetNetwork);
                
                // Always update network status in the UI
                this.uiController.updateNetworkStatus(networkName, true);
                
                // Update network selector button text
                if (this.networkSelector) {
                    this.networkSelector.textContent = networkName;
                }
                
                try {
                    // If wallet is connected and not switching to/from Ganache, try to switch MetaMask
                    if (this.web3Provider.isWriteConnected && !isCurrentlyGanache && !isSwitchingToGanache) {
                        await this.web3Provider.switchNetwork(targetNetwork);
                    } else {
                        // Just reinitialize read provider
                        await this.web3Provider.initReadOnlyWeb3();
                    }
                    
                    // Refresh application data
                    await this.app.refreshData();
                    
                    // Update Ganache UI elements
                    this._updateGanacheUI();
                    
                    // Show success message
                    this.uiController.showSuccess(`Successfully switched to ${networkName}`);
                    
                } catch (error) {
                    console.error(`Failed to switch to network ${targetNetwork}:`, error);
                    this.uiController.showError(`Failed to switch network: ${error.message}`);
                }
            });
        });
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
                    
                    // Update entry fee
                    await this.contractInteraction.setEntryFee(newFee);
                    
                } catch (error) {
                    console.error("Failed to update entry fee:", error);
                    this.uiController.showError(`Failed to update entry fee: ${error.message}`);
                    
                    // Reset button
                    this.setEntryFeeBtn.disabled = false;
                    this.setEntryFeeBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Fee';
                }
            });
        }

        // Set Min Players button
        if (this.setMinPlayersBtn && this.minPlayersInput) {
            this.setMinPlayersBtn.addEventListener('click', async () => {
                try {
                    if (!this.web3Provider.isWriteConnected) {
                        this.uiController.showError("Please connect your wallet first.");
                        return;
                    }
                    
                    const isOwner = await this.contractInteraction.isOwner();
                    if (!isOwner) {
                        this.uiController.showError("Only the contract owner can set minimum players.");
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
                            this.uiController.showNotification("Minimum players has been updated", "success");
                            
                            // Clear the input
                            this.minPlayersInput.value = '';
                            
                            // Refresh data to show the updated min players
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
                    
                    // Update minimum players
                    await this.contractInteraction.setMinPlayers(minPlayers);
                    
                } catch (error) {
                    console.error("Failed to update minimum players:", error);
                    this.uiController.showError(`Failed to update minimum players: ${error.message}`);
                    
                    // Reset button
                    this.setMinPlayersBtn.disabled = false;
                    this.setMinPlayersBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Min Players';
                }
            });
        }

        // Withdraw Admin Fees button
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
                            this.uiController.showSuccess("Admin fees successfully withdrawn!");
                            this.uiController.showNotification("Admin fees have been withdrawn", "success");
                            
                            // Refresh data to show updated balances
                            this.app.refreshData();
                            
                            // Reset button
                            this.withdrawFeesBtn.disabled = false;
                            this.withdrawFeesBtn.innerHTML = '<i class="bi bi-cash-stack me-2"></i>Withdraw Admin Fees';
                        },
                        onError: (errorMessage) => {
                            this.uiController.showError(`Failed to withdraw admin fees: ${errorMessage}`);
                            
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

    // Setup Ganache account selector
    _setupGanacheAccountSelector() {
        // Create the ganacheAccountsTable if it doesn't exist already
        const ganacheAccountsTable = document.getElementById('ganacheAccountsTable');
        if (!ganacheAccountsTable) {
            console.error("Ganache accounts table not found in the DOM");
            return;
        }
    }

    // Populate the Ganache accounts table
    async _populateGanacheAccountsTable(accounts) {
        const ganacheAccountsTable = document.getElementById('ganacheAccountsTable');
        if (!ganacheAccountsTable) {
            console.error("Ganache accounts table not found in the DOM");
            return;
        }
        
        // Get the currently selected account
        const currentAccount = this.web3Provider.userAccount;
        console.log("Currently selected account:", currentAccount);
        
        // Try to get the contract owner address
        let ownerAddress = null;
        try {
            if (this.contractInteraction && this.web3Provider.readContract) {
                ownerAddress = await this.contractInteraction.getOwnerAddress();
                console.log("Contract owner address:", ownerAddress);
            } else {
                console.log("Contract interaction not available, can't get owner address");
            }
        } catch (error) {
            console.error("Error getting contract owner:", error);
        }
        
        // Clear the table
        ganacheAccountsTable.innerHTML = '';
        
        // Add each account to the table
        accounts.forEach((account, index) => {
            const row = document.createElement('tr');
            const isSelected = currentAccount && currentAccount.toLowerCase() === account.address.toLowerCase();
            const isOwner = ownerAddress && ownerAddress.toLowerCase() === account.address.toLowerCase();
            
            row.className = isSelected ? 'table-primary' : ''; // Highlight the selected account
            
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <span class="badge bg-secondary">${index}</span>
                        </div>
                        <div>
                            <div class="fw-bold">${account.shortAddress} ${isOwner ? '<span class="badge bg-danger ms-1">Contract Owner</span>' : ''}</div>
                            <div class="text-muted small">${account.address}</div>
                        </div>
                    </div>
                </td>
                <td class="align-middle">
                    <span class="badge bg-success">${account.balance} ETH</span>
                </td>
                <td class="align-middle">
                    <button class="btn btn-sm ${isSelected ? 'btn-success' : 'btn-primary'} btnUseAccount" data-address="${account.address}">
                        ${isSelected ? '<i class="bi bi-check-circle me-1"></i> Selected' : 'Use Account'}
                    </button>
                </td>
            `;
            
            ganacheAccountsTable.appendChild(row);
        });
        
        // Add event listeners to the "Use Account" buttons
        document.querySelectorAll('.btnUseAccount').forEach(button => {
            button.addEventListener('click', async (event) => {
                const accountAddress = event.currentTarget.getAttribute('data-address');
                
                // Highlight the selected row
                document.querySelectorAll('#ganacheAccountsTable tr').forEach(row => {
                    row.className = '';
                });
                event.currentTarget.closest('tr').className = 'table-primary';
                
                // Update all buttons
                document.querySelectorAll('.btnUseAccount').forEach(btn => {
                    btn.className = 'btn btn-sm btn-primary btnUseAccount';
                    btn.innerHTML = 'Use Account';
                });
                
                // Update this button
                event.currentTarget.className = 'btn btn-sm btn-success btnUseAccount';
                event.currentTarget.innerHTML = '<i class="bi bi-check-circle me-1"></i> Selected';
                
                // Set the selected account in web3Provider
                this.web3Provider.userAccount = accountAddress;
                this.web3Provider.isWriteConnected = true;
                
                // Find the balance from the row's data
                const balanceElement = event.currentTarget.closest('tr').querySelector('.badge.bg-success');
                let balance = null;
                if (balanceElement) {
                    const balanceText = balanceElement.textContent;
                    balance = balanceText.replace(' ETH', '').trim();
                }
                
                // Update connection status with the balance
                this.uiController.updateConnectionStatus(true, accountAddress, balance);
                
                // Hide the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('ganacheAccountSelectorModal'));
                if (modal) {
                    modal.hide();
                }

                try {
                    // Try to connect to the Ganache account with contract validation
                    await this.web3Provider.connectToGanacheAccount(accountAddress);
                    
                    // Reset lottery join button state
                    const joinButton = document.getElementById('joinLotteryBtn');
                    if (joinButton) {
                        joinButton.disabled = false;
                        joinButton.textContent = 'Join Lottery';
                        joinButton.classList.add('btn-primary');
                        joinButton.classList.remove('btn-success');
                    }
                    
                    // Check if the selected account is the owner and update admin controls
                    const isOwner = await this.contractInteraction.isOwner();
                    console.log("Selected Ganache account is owner:", isOwner);
                    this.uiController.showAdminControls(isOwner);
                    
                    // Force a complete refresh of data for the new account
                    await this.app.refreshData(true);
                } catch (error) {
                    console.error("Error connecting to Ganache account:", error);
                    this.uiController.showError(error.message || "Failed to connect to Ganache account");
                }
            });
        });
    }

    // Setup Ganache-specific events 
    _setupGanacheEvents() {
        // Show/hide the Ganache account selector button based on the network
        this._updateGanacheUI();
        
        // Ganache account selector button
        if (this.ganacheAccountSelectorBtn) {
            this.ganacheAccountSelectorBtn.addEventListener('click', async () => {
                if (CONFIG.CHAIN_ID === "0x539") {
                    // Get Ganache accounts
                    const accounts = await this.web3Provider.getGanacheAccounts();
                    
                    // Populate and show the modal
                    await this._populateGanacheAccountsTable(accounts);
                    const modal = new bootstrap.Modal(document.getElementById('ganacheAccountSelectorModal'));
                    modal.show();
                } else {
                    this.uiController.showWarning("Ganache account selector is only available on Ganache network");
                }
            });
        }
    }

    // Update Ganache UI elements based on current network
    _updateGanacheUI() {
        // Handle Ganache account selector button
        if (this.ganacheAccountSelectorBtn) {
            // Only show the button on Ganache network
            this.ganacheAccountSelectorBtn.style.display = CONFIG.CHAIN_ID === "0x539" ? 'inline-block' : 'none';
        }
        
        // Handle Connect Wallet button on Ganache network
        if (this.connectWalletBtn) {
            if (CONFIG.CHAIN_ID === "0x539") {
                // When on Ganache network:
                // - Hide the regular Connect Wallet button
                // - Show the Ganache account selector button
                this.connectWalletBtn.style.display = 'none';
                
                // If just switched to Ganache, show a helpful message
                if (!this.web3Provider.isWriteConnected) {
                    // First time on Ganache, show a message to use the Ganache account selector
                    this.uiController.showStatus(
                        'You are now on Ganache network. Please use the "Ganache Accounts" button to select an account.',
                        'info'
                    );
                }
            } else {
                // On other networks, always show the regular Connect Wallet button
                this.connectWalletBtn.style.display = 'inline-block';
            }
        }
    }
}