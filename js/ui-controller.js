/**
 * Decentralized Lottery - UI Controller
 * Manages all UI elements and DOM manipulation
 */

class UIController {
    constructor() {
        // Status messages
        this.statusMessage = document.getElementById('statusMessage');
        
        // User info elements
        this.userAccountDisplay = document.getElementById('userAccount');
        this.userBalanceDisplay = document.getElementById('userBalance');
        this.userFullAddressDisplay = document.getElementById('userFullAddress');
        this.networkDisplay = document.getElementById('networkName');
        this.connectionStatus = document.getElementById('connectionStatus');
        
        // Lottery info elements
        this.currentLotteryId = document.getElementById('currentLotteryId');
        this.lotteryStatus = document.getElementById('lotteryStatus');
        this.entryFee = document.getElementById('entryFee');
        this.participantCount = document.getElementById('participantCount');
        this.prizePool = document.getElementById('prizePool');
        this.winnerDisplay = document.getElementById('winner');
        this.minPlayers = document.getElementById('minPlayers');
        
        // Loader elements
        this.loaders = document.querySelectorAll('.loading-indicator');
        
        // Admin elements
        this.adminActions = document.getElementById('adminActions');
    }
    
    // Display contract address from CONFIG
    displayContractAddress() {
        if (window.CONFIG) {
            const address = CONFIG.CONTRACT_ADDRESS;
            
            // Update footer contract address
            const footerAddressElement = document.getElementById('footerContractAddress');
            if (footerAddressElement) {
                footerAddressElement.textContent = address;
                // Make it selectable for easy copying
                footerAddressElement.style.cursor = 'pointer';
                footerAddressElement.title = 'Click to copy address';
                footerAddressElement.addEventListener('click', () => {
                    navigator.clipboard.writeText(address)
                        .then(() => {
                            this.showNotification("Contract address copied to clipboard", "success");
                        })
                        .catch(err => {
                            console.error('Failed to copy address: ', err);
                        });
                });
            }
            
            // Update footer Etherscan link
            const footerEtherscanLink = document.getElementById('footerEtherscanLink');
            if (footerEtherscanLink) {
                footerEtherscanLink.href = `https://sepolia.etherscan.io/address/${address}`;
            }
            
            // Update navbar Etherscan link
            const etherscanLink = document.getElementById('etherscanLink');
            if (etherscanLink) {
                etherscanLink.href = `https://sepolia.etherscan.io/address/${address}`;
            }
        }
    }
    
    // Display connection status
    updateConnectionStatus(isConnected, account = null, balance = null) {
        if (this.connectionStatus) {
            if (isConnected && account) {
                this.connectionStatus.textContent = 'Connected';
                this.connectionStatus.className = 'badge bg-success';
                
                if (this.userAccountDisplay) {
                    const shortenedAccount = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
                    this.userAccountDisplay.textContent = shortenedAccount;
                    
                    // Setup click listener to toggle full address display
                    if (!this.userAccountDisplay.hasClickListener) {
                        this.userAccountDisplay.addEventListener('click', () => {
                            if (this.userFullAddressDisplay) {
                                this.userFullAddressDisplay.classList.toggle('d-none');
                            }
                        });
                        this.userAccountDisplay.hasClickListener = true;
                    }
                    
                    // Show full address
                    if (this.userFullAddressDisplay) {
                        this.userFullAddressDisplay.textContent = account;
                        this.userFullAddressDisplay.classList.add('d-none'); // Hidden by default
                    }
                    
                    // Show balance if available
                    if (this.userBalanceDisplay && balance) {
                        this.userBalanceDisplay.textContent = `Balance: ${parseFloat(balance).toFixed(4)} ETH`;
                        this.userBalanceDisplay.classList.remove('hidden');
                    }
                }
            } else {
                this.connectionStatus.textContent = 'Not Connected';
                this.connectionStatus.className = 'badge bg-danger';
                
                if (this.userAccountDisplay) {
                    this.userAccountDisplay.textContent = 'Not connected';
                }
                
                // Hide balance and address
                if (this.userBalanceDisplay) {
                    this.userBalanceDisplay.classList.add('hidden');
                }
                
                if (this.userFullAddressDisplay) {
                    this.userFullAddressDisplay.classList.add('d-none');
                }
            }
        }
    }
    
    // Update network status display
    updateNetworkStatus(networkName, isSupportedNetwork) {
        console.log(`Updating network status: ${networkName} (supported: ${isSupportedNetwork})`);
        if (this.networkDisplay) {
            this.networkDisplay.textContent = networkName;
            
            // Update connection status based on network support
            if (this.connectionStatus) {
                if (isSupportedNetwork) {
                    this.connectionStatus.className = "badge bg-success";
                    this.connectionStatus.textContent = "Connected";
                } else {
                    this.connectionStatus.className = "badge bg-warning";
                    this.connectionStatus.textContent = "Unsupported Network";
                }
            }
            
            // If we're on Ganache local network, show additional info
            if (networkName === "Ganache Local") {
                // Check if we've already shown the message recently to avoid repetition
                const lastShown = sessionStorage.getItem('ganacheMessageLastShown');
                const now = new Date().getTime();
                
                if (!lastShown || (now - parseInt(lastShown)) > 10000) { // Only show every 10 seconds
                    // Show Ganache-specific message
                    this.showStatus(
                        `<div class="alert alert-warning mb-0">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            <strong>Local Development Mode</strong>: This Ganache network view is for local development testing only.
                            Please ensure you are running this app on your local machine and have Ganache running at http://127.0.0.1:7545
                        </div>`,
                        'info'
                    );
                    
                    // Remember that we showed the message
                    sessionStorage.setItem('ganacheMessageLastShown', now.toString());
                }
                
                // Show development mode badge
                this.showDevelopmentModeBadge();
            } else {
                // Remove development mode badge if exists
                this.removeDevelopmentModeBadge();
            }
            
            console.log(`Network status updated to: ${networkName} (Supported: ${isSupportedNetwork})`);
        } else {
            console.warn("Network display element not found");
        }
    }
    
    // Show development mode badge
    showDevelopmentModeBadge() {
        // Remove any existing badge first
        this.removeDevelopmentModeBadge();
        
        // Create development mode badge
        const devBadge = document.createElement('div');
        devBadge.id = 'developmentModeBadge';
        devBadge.className = 'development-mode-badge';
        devBadge.innerHTML = '<i class="bi bi-code-slash me-2"></i>LOCAL DEVELOPMENT MODE';
        
        // Add to body
        document.body.appendChild(devBadge);
    }
    
    // Remove development mode badge
    removeDevelopmentModeBadge() {
        const existingBadge = document.getElementById('developmentModeBadge');
        if (existingBadge) {
            existingBadge.remove();
        }
    }
    
    // Show status message
    showStatus(message, type = 'info') {
        if (!this.statusMessage) return;
        
        this.statusMessage.className = `alert alert-${type} my-3`;
        this.statusMessage.innerHTML = message;
        this.statusMessage.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.statusMessage.classList.add('hidden');
        }, 5000);
    }
    
    // Show success message
    showSuccess(message) {
        this.showStatus(message, 'success');
    }
    
    // Show error message
    showError(message) {
        this.showStatus(message, 'danger');
    }
    
    // Show warning message
    showWarning(message) {
        this.showStatus(message, 'warning');
    }
    
    // Show pending message
    showPending(message) {
        this.showStatus(`<div class="d-flex align-items-center">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ${message}
        </div>`, 'primary');
    }
    
    // Update lottery info
    updateLotteryInfo(lotteryInfo) {
        if (!lotteryInfo) return;
        
        // Update lottery ID
        if (this.currentLotteryId) {
            this.currentLotteryId.textContent = lotteryInfo.id || 'N/A';
        }
        
        // Update lottery status - only Open or Closed
        if (this.lotteryStatus) {
            const statusText = lotteryInfo.isOpen ? 'Open' : 'Closed';
            const statusClass = lotteryInfo.isOpen ? 'bg-success' : 'bg-warning';
            this.lotteryStatus.textContent = statusText;
            this.lotteryStatus.className = `badge ${statusClass}`;
        }
        
        // Update prize pool
        if (this.prizePool && lotteryInfo.balance) {
            try {
                if (window.web3Instance && window.web3Instance.utils) {
                    const ethValue = window.web3Instance.utils.fromWei(lotteryInfo.balance.toString(), 'ether');
                    this.prizePool.textContent = `${parseFloat(ethValue).toFixed(4)} ETH`;
                } else {
                    console.warn("web3Instance not available for fromWei conversion in prize pool, falling back to manual.");
                    const ethValue = Number(lotteryInfo.balance / 1e18).toFixed(4);
                    this.prizePool.textContent = `${ethValue} ETH`;
                }
            } catch (error) {
                console.error("Error converting prize pool:", error);
                const ethValue = Number(lotteryInfo.balance / 1e18).toFixed(4);
                this.prizePool.textContent = `${ethValue} ETH`; // Fallback
            }
        }
        
        // Update participant count
        if (this.participantCount) {
            this.participantCount.textContent = lotteryInfo.playerCount || '0';
        }
        
        // Update minimum participants
        if (this.minPlayers) {
            this.minPlayers.textContent = lotteryInfo.minPlayers || '-';
        }
        
        // Update winner
        if (this.winnerDisplay) {
            if (lotteryInfo.hasWinner && lotteryInfo.winner && lotteryInfo.winner !== '0x0000000000000000000000000000000000000000') {
                const shortenedWinner = `${lotteryInfo.winner.substring(0, 6)}...${lotteryInfo.winner.substring(lotteryInfo.winner.length - 4)}`;
                this.winnerDisplay.textContent = shortenedWinner;
                this.winnerDisplay.parentElement.classList.remove('hidden');
            } else {
                this.winnerDisplay.textContent = 'No winner yet';
                if (lotteryInfo.hasWinner) {
                    this.winnerDisplay.parentElement.classList.remove('hidden');
                } else {
                    this.winnerDisplay.parentElement.classList.add('hidden');
                }
            }
        }
    }
    
    // Update entry fee
    updateEntryFee(fee) {
        if (this.entryFee && fee) {
            try {
                if (window.web3Instance && window.web3Instance.utils) {
                    const ethValue = window.web3Instance.utils.fromWei(fee.toString(), 'ether');
                    this.entryFee.textContent = `${parseFloat(ethValue).toFixed(4)} ETH`;
                } else {
                    console.warn("web3Instance not available for fromWei conversion in entry fee, falling back to manual.");
                    const ethValue = Number(fee / 1e18).toFixed(4);
                    this.entryFee.textContent = `${ethValue} ETH`;
                }
            } catch (error) {
                console.error("Error converting entry fee:", error);
                const ethValue = Number(fee / 1e18).toFixed(4);
                this.entryFee.textContent = `${ethValue} ETH`; // Fallback
            }
        }
    }
    
    // Update admin fees
    updateAdminFees(fees) {
        const adminFeesElement = document.getElementById('adminFeesAmount');
        if (adminFeesElement && fees) {
            try {
                if (window.web3Instance && window.web3Instance.utils) {
                    const ethValue = window.web3Instance.utils.fromWei(fees.toString(), 'ether');
                    adminFeesElement.textContent = `${parseFloat(ethValue).toFixed(4)} ETH`;
                } else {
                    console.warn("web3Instance not available for fromWei conversion in admin fees, falling back to manual.");
                    const ethValue = Number(fees / 1e18).toFixed(4);
                    adminFeesElement.textContent = `${ethValue} ETH`;
                }
                
                // Update button state - disable button if no fees to withdraw
                const withdrawFeesBtn = document.getElementById('withdrawFeesBtn');
                if (withdrawFeesBtn) {
                    withdrawFeesBtn.disabled = Number(fees) === 0;
                    if (Number(fees) === 0) {
                        withdrawFeesBtn.title = "No admin fees to withdraw";
                    } else {
                        withdrawFeesBtn.title = "Withdraw admin fees";
                    }
                }
            } catch (error) {
                console.error("Error converting admin fees:", error);
                const ethValue = Number(fees / 1e18).toFixed(4);
                adminFeesElement.textContent = `${ethValue} ETH`; // Fallback
            }
        }
    }
    
    // Populate participants table
    populateParticipantsTable(participants) {
        const participantsTable = document.getElementById('participantsTable');
        const participantsTableBody = document.getElementById('participantsTableBody');
        
        if (!participantsTableBody) return;
        
        // Clear the table
        participantsTableBody.innerHTML = '';
        
        // Show/hide the table based on participants count
        if (participantsTable) {
            if (participants.length > 0) {
                participantsTable.classList.remove('hidden');
                // Explicitly set display style to ensure visibility
                participantsTable.style.display = 'block';
                
                // Add a message if empty
                if (participants.length === 0) {
                    const emptyRow = document.createElement('tr');
                    emptyRow.innerHTML = `<td colspan="3" class="text-center py-3">No participants yet</td>`;
                    participantsTableBody.appendChild(emptyRow);
                }
            } else {
                // Even when there are no participants, we want to keep the table visible in the two-column layout
                // Just show a message instead of hiding it
                participantsTable.classList.remove('hidden');
                participantsTable.style.display = 'block';
                
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `<td colspan="3" class="text-center py-3">No participants yet</td>`;
                participantsTableBody.appendChild(emptyRow);
            }
        }
        
        // Add each participant to the table
        participants.forEach((participant, index) => {
            const row = document.createElement('tr');
            const shortenedAddress = `${participant.substring(0, 6)}...${participant.substring(participant.length - 4)}`;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${shortenedAddress}</td>
                <td>
                    <a href="https://sepolia.etherscan.io/address/${participant}" 
                       target="_blank" class="btn btn-sm btn-outline-info">
                        View on Etherscan
                    </a>
                </td>
            `;
            
            participantsTableBody.appendChild(row);
        });
    }
    
    // Populate winners table
    populateWinnersTable(winners) {
        const winnersTable = document.getElementById('winnersTable');
        const winnersTableBody = document.getElementById('winnersTableBody');
        
        if (!winnersTableBody) return;
        
        // Clear the table
        winnersTableBody.innerHTML = '';
        
        // Always keep the table visible in the layout
        if (winnersTable) {
            // Add a message if there are no winners yet
            if (winners.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = `<td colspan="3" class="text-center py-3">No previous winners yet</td>`;
                winnersTableBody.appendChild(emptyRow);
                return;
            }
        }
        
        // Add each winner to the table
        winners.forEach((winner) => {
            const row = document.createElement('tr');
            const shortenedAddress = `${winner.address.substring(0, 6)}...${winner.address.substring(winner.address.length - 4)}`;
            
            row.innerHTML = `
                <td><span class="badge bg-success">${winner.id}</span></td>
                <td>${shortenedAddress}</td>
                <td>
                    <a href="https://sepolia.etherscan.io/address/${winner.address}" 
                       target="_blank" class="btn btn-sm btn-outline-success">
                        <i class="bi bi-award"></i> View Winner
                    </a>
                </td>
            `;
            
            winnersTableBody.appendChild(row);
        });
    }
    
    // Show/hide admin controls
    showAdminControls(isOwner) {
        if (this.adminActions) {
            if (isOwner) {
                this.adminActions.classList.remove('hidden');
                // Explicitly set display style to ensure visibility
                this.adminActions.style.display = 'block';
                
                // Add advanced admin controls if they don't exist yet
                if (!document.getElementById('advancedAdminControls')) {
                    const advancedControls = document.createElement('div');
                    advancedControls.id = 'advancedAdminControls';
                    advancedControls.className = 'mt-4 p-3 border border-warning rounded';
                    advancedControls.innerHTML = `
                        <h5 class="text-warning mb-3"><i class="bi bi-shield-exclamation"></i> Advanced Controls</h5>
                        
                        <div class="mb-3">
                            <label class="form-label">Emergency Stop</label>
                            <div class="d-flex gap-2">
                                <button id="enableEmergencyStop" class="btn btn-sm btn-danger">
                                    <i class="bi bi-exclamation-octagon"></i> Pause Contract
                                </button>
                                <button id="disableEmergencyStop" class="btn btn-sm btn-success">
                                    <i class="bi bi-play-circle"></i> Resume Contract
                                </button>
                            </div>
                            <small class="text-muted">Use emergency stop to pause all contract operations in case of issues.</small>
                        </div>
                        
                        <div class="mb-2">
                            <label for="newOwnerAddress" class="form-label">Transfer Ownership</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="newOwnerAddress" placeholder="New owner's Ethereum address">
                                <button class="btn btn-warning" id="transferOwnershipBtn">Transfer</button>
                            </div>
                            <small class="text-danger">Warning: After transferring ownership, you will lose admin access.</small>
                        </div>
                    `;
                    
                    // Append to admin actions
                    this.adminActions.appendChild(advancedControls);
                    
                    // Set up event listeners
                    document.getElementById('enableEmergencyStop').addEventListener('click', () => {
                        if (confirm('Are you sure you want to PAUSE all contract operations? This will prevent users from entering the lottery and admins from performing most actions until resumed.')) {
                            if (window.app && window.app.setEmergencyStop) {
                                window.app.setEmergencyStop(true);
                            } else {
                                this.showError('App not properly initialized. Please refresh the page.');
                            }
                        }
                    });
                    
                    document.getElementById('disableEmergencyStop').addEventListener('click', () => {
                        if (window.app && window.app.setEmergencyStop) {
                            window.app.setEmergencyStop(false);
                        } else {
                            this.showError('App not properly initialized. Please refresh the page.');
                        }
                    });
                    
                    document.getElementById('transferOwnershipBtn').addEventListener('click', () => {
                        const newOwnerAddress = document.getElementById('newOwnerAddress').value.trim();
                        if (newOwnerAddress) {
                            if (confirm(`Are you ABSOLUTELY sure you want to transfer ownership to ${newOwnerAddress}? You will permanently lose admin access to this contract!`)) {
                                if (window.app && window.app.transferOwnership) {
                                    window.app.transferOwnership(newOwnerAddress);
                                } else {
                                    this.showError('App not properly initialized. Please refresh the page.');
                                }
                            }
                        } else {
                            this.showError('Please enter a valid Ethereum address.');
                        }
                    });
                }
                
                // Check contract pause status and update buttons
                try {
                    if (window.app && window.app.contractInteraction && window.app.contractInteraction.isContractPaused) {
                        window.app.contractInteraction.isContractPaused().then(isPaused => {
                            this.updateEmergencyStopButtons(isPaused);
                        }).catch(error => {
                            console.warn("Could not check contract pause status:", error);
                        });
                    }
                } catch (error) {
                    console.warn("Error checking contract pause status:", error);
                }
            } else {
                this.adminActions.classList.add('hidden');
                // Also set display to none
                this.adminActions.style.display = 'none';
            }
        }
    }
    
    // Update emergency stop buttons based on contract state
    updateEmergencyStopButtons(isPaused) {
        const enableBtn = document.getElementById('enableEmergencyStop');
        const disableBtn = document.getElementById('disableEmergencyStop');
        
        if (enableBtn && disableBtn) {
            if (isPaused) {
                enableBtn.disabled = true;
                disableBtn.disabled = false;
                // Add visual indicator that contract is paused
                if (!document.getElementById('contractPausedBanner')) {
                    const banner = document.createElement('div');
                    banner.id = 'contractPausedBanner';
                    banner.className = 'alert alert-danger text-center';
                    banner.innerHTML = '<strong><i class="bi bi-exclamation-triangle"></i> CONTRACT PAUSED</strong> - All operations are temporarily disabled';
                    document.body.insertBefore(banner, document.body.firstChild);
                }
            } else {
                enableBtn.disabled = false;
                disableBtn.disabled = true;
                // Remove pause banner if exists
                const banner = document.getElementById('contractPausedBanner');
                if (banner) {
                    banner.remove();
                }
            }
        }
    }
    
    // Update admin buttons based on lottery state
    updateAdminButtons(lotteryInfo) {
        if (!lotteryInfo) return;
        
        const startLotteryBtn = document.getElementById('startLotteryBtn');
        const closeLotteryBtn = document.getElementById('closeLotteryBtn');
        const pickWinnerBtn = document.getElementById('pickWinnerBtn');
        const commitRandomnessBtn = document.getElementById('commitRandomnessBtn');
        
        // Initialize the buttons if they don't exist yet
        if (!startLotteryBtn && !closeLotteryBtn && !pickWinnerBtn) {
            this.createAdminButtons();
            return;
        }
        
        // Access buttons again after potential creation
        const startLotteryBtn2 = document.getElementById('startLotteryBtn');
        const closeLotteryBtn2 = document.getElementById('closeLotteryBtn');
        const pickWinnerBtn2 = document.getElementById('pickWinnerBtn');
        const commitRandomnessBtn2 = document.getElementById('commitRandomnessBtn');
        
        if (startLotteryBtn2 && closeLotteryBtn2 && pickWinnerBtn2 && commitRandomnessBtn2) {
            // Start button is active when lottery is closed
            // The previous condition was incorrectly disabling the button when there were participants
            startLotteryBtn2.disabled = lotteryInfo.isOpen;
            
            // Close button is active when lottery is open 
            closeLotteryBtn2.disabled = !lotteryInfo.isOpen;
            
            // Commit randomness button is active when lottery is closed and has enough players
            commitRandomnessBtn2.disabled = lotteryInfo.isOpen || lotteryInfo.playerCount < lotteryInfo.minPlayers;
            
            // Pick winner button needs special handling - disable by default unless timer has expired
            // The app.startPickWinnerTimer method will enable it when the time is right
            if (window.app && window.app.hasCommittedRandomness && window.app.randomnessCommitTime) {
                const elapsedMs = Date.now() - window.app.randomnessCommitTime;
                if (elapsedMs < 60000) { // Less than 1 minute
                    pickWinnerBtn2.disabled = true;
                }
            } else if (lotteryInfo.isOpen || lotteryInfo.playerCount < lotteryInfo.minPlayers) {
                // Normal disabling conditions
                pickWinnerBtn2.disabled = true;
            } else if (!window.app || !window.app.hasCommittedRandomness) {
                // Disable if randomness hasn't been committed
                pickWinnerBtn2.disabled = true;
            }
            
            // Add tooltips to explain button states
            if (startLotteryBtn2.disabled) {
                if (lotteryInfo.isOpen) {
                    startLotteryBtn2.title = "Cannot open: Lottery is already open";
                }
            } else {
                if (lotteryInfo.playerCount > 0) {
                    startLotteryBtn2.title = "Open the lottery for new participants (previous participants will remain)";
                } else {
                    startLotteryBtn2.title = "Open the lottery for new participants";
                }
            }
            
            if (closeLotteryBtn2.disabled) {
                closeLotteryBtn2.title = "Cannot close: Lottery is already closed";
            } else {
                closeLotteryBtn2.title = "Close the current lottery temporarily";
            }
            
            if (commitRandomnessBtn2.disabled) {
                if (lotteryInfo.isOpen) {
                    commitRandomnessBtn2.title = "Cannot commit randomness: Close the lottery first";
                } else if (lotteryInfo.playerCount < lotteryInfo.minPlayers) {
                    commitRandomnessBtn2.title = `Cannot commit randomness: Need at least ${lotteryInfo.minPlayers} participants`;
                }
            } else {
                commitRandomnessBtn2.title = "Step 1: Commit randomness for fair winner selection. This creates a commitment to a randomness source that can't be manipulated later when picking the winner.";
            }
            
            if (pickWinnerBtn2.disabled) {
                if (lotteryInfo.isOpen) {
                    pickWinnerBtn2.title = "Cannot pick winner: Close the lottery first";
                } else if (lotteryInfo.playerCount < lotteryInfo.minPlayers) {
                    pickWinnerBtn2.title = `Cannot pick winner: Need at least ${lotteryInfo.minPlayers} participants`;
                } else if (window.app && window.app.hasCommittedRandomness) {
                    const elapsedMs = Date.now() - window.app.randomnessCommitTime;
                    const remainingSecs = Math.max(0, 60 - Math.floor(elapsedMs / 1000));
                    if (remainingSecs > 0) {
                        pickWinnerBtn2.title = `Must wait ${remainingSecs} more seconds after committing randomness`;
                    }
                } else {
                    pickWinnerBtn2.title = "Must commit randomness first (Step 1)";
                }
            } else {
                pickWinnerBtn2.title = "Step 2: Pick the winner (after committing randomness)";
            }
        }
    }
    
    // Create admin buttons
    createAdminButtons() {
        if (!this.adminActions) return;
        
        // Clear existing buttons
        const existingButtonGroup = document.getElementById('adminButtonGroup');
        if (existingButtonGroup) {
            existingButtonGroup.remove();
        }
        
        // Create button group
        const buttonGroup = document.createElement('div');
        buttonGroup.id = 'adminButtonGroup';
        buttonGroup.className = 'mt-3';
        
        // Create buttons
        buttonGroup.innerHTML = `
            <h5 class="mb-3">Lottery Management</h5>
            <div class="d-flex flex-wrap gap-2">
                                <button id="startLotteryBtn" class="btn btn-success">                    <i class="bi bi-play-circle"></i> Open Lottery                </button>
                <button id="closeLotteryBtn" class="btn btn-warning">
                    <i class="bi bi-pause-circle"></i> Close Lottery
                </button>
                <button id="commitRandomnessBtn" class="btn btn-info">
                    <i class="bi bi-shield-lock"></i> Step 1: Commit Randomness
                </button>
                <button id="pickWinnerBtn" class="btn btn-primary">
                    <i class="bi bi-trophy"></i> Step 2: Pick Winner
                </button>
                <!-- Test button to show countdown timer -->
                <button id="testTimerBtn" class="btn btn-secondary">
                    <i class="bi bi-clock"></i> Test Timer
                </button>
            </div>
            
            <div class="mt-4">
                <h5 class="mb-3">Fee Management</h5>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label for="entryFeeInput" class="form-label">Set Entry Fee (ETH)</label>
                        <div class="input-group">
                            <input type="number" class="form-control" id="entryFeeInput" placeholder="e.g. 0.01" step="0.001" min="0.0001">
                            <button class="btn btn-outline-secondary" id="setEntryFeeBtn">Set Fee</button>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <label for="minPlayersInput" class="form-label">Set Minimum Players</label>
                        <div class="input-group">
                            <input type="number" class="form-control" id="minPlayersInput" placeholder="e.g. 3" min="2" step="1">
                            <button class="btn btn-outline-secondary" id="setMinPlayersBtn">Set Min</button>
                        </div>
                    </div>
                    <div class="col-12 mt-3">
                        <button id="withdrawFeesBtn" class="btn btn-success">
                            <i class="bi bi-cash-coin"></i> Withdraw Admin Fees
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add button group to adminActions
        this.adminActions.appendChild(buttonGroup);
        
        // Setup event listeners
        document.getElementById('startLotteryBtn').addEventListener('click', () => {
            window.app.contractInteraction.openLottery()
                .then(() => {
                    this.showSuccess("Lottery opened successfully!");
                    setTimeout(() => window.app.refreshData(true), 1000);
                })
                .catch(error => {
                    this.showError(`Failed to open lottery: ${error.message}`);
                });
        });
        
        document.getElementById('closeLotteryBtn').addEventListener('click', () => {
            window.app.contractInteraction.closeLottery()
                .then(() => {
                    this.showSuccess("Lottery closed successfully!");
                    setTimeout(() => window.app.refreshData(true), 1000);
                })
                .catch(error => {
                    this.showError(`Failed to close lottery: ${error.message}`);
                });
        });
        
        document.getElementById('commitRandomnessBtn').addEventListener('click', () => {
            window.app.commitRandomness();
        });
        
        document.getElementById('pickWinnerBtn').addEventListener('click', () => {
            window.app.pickWinner();
        });
        
        document.getElementById('withdrawFeesBtn').addEventListener('click', () => {
            window.app.contractInteraction.withdrawAdminFees()
                .then(() => {
                    this.showSuccess("Admin fees withdrawn successfully!");
                    setTimeout(() => window.app.refreshData(true), 1000);
                })
                .catch(error => {
                    this.showError(`Failed to withdraw fees: ${error.message}`);
                });
        });
        
        document.getElementById('setEntryFeeBtn').addEventListener('click', () => {
            const feeInput = document.getElementById('entryFeeInput');
            const feeValue = feeInput.value.trim();
            
            if (!feeValue || isNaN(feeValue) || parseFloat(feeValue) <= 0) {
                this.showError("Please enter a valid entry fee greater than 0");
                return;
            }
            
            window.app.contractInteraction.setEntryFee(feeValue)
                .then(() => {
                    this.showSuccess(`Entry fee set to ${feeValue} ETH!`);
                    setTimeout(() => window.app.refreshData(true), 1000);
                    feeInput.value = '';
                })
                .catch(error => {
                    this.showError(`Failed to set entry fee: ${error.message}`);
                });
        });
        
        document.getElementById('setMinPlayersBtn').addEventListener('click', () => {
            const minPlayersInput = document.getElementById('minPlayersInput');
            const minValue = minPlayersInput.value.trim();
            
            if (!minValue || isNaN(minValue) || parseInt(minValue) < 2) {
                this.showError("Please enter a valid number of minimum players (at least 2)");
                return;
            }
            
            window.app.contractInteraction.setMinPlayers(minValue)
                .then(() => {
                    this.showSuccess(`Minimum players set to ${minValue}!`);
                    setTimeout(() => window.app.refreshData(true), 1000);
                    minPlayersInput.value = '';
                })
                .catch(error => {
                    this.showError(`Failed to set minimum players: ${error.message}`);
                });
        });
    }
    
    // Show loading state
    showLoading() {
        this.loaders.forEach(loader => {
            loader.classList.remove('hidden');
        });
    }
    
    // Hide loading state
    hideLoading() {
        this.loaders.forEach(loader => {
            loader.classList.add('hidden');
        });
    }
    
    // Update join button state
    updateJoinButton(canJoin, hasJoined, isLotteryOpen) {
        const joinButton = document.getElementById('joinLotteryBtn');
        if (!joinButton) return;
        
        if (!isLotteryOpen) {
            // If lottery is closed, disable button
            joinButton.disabled = true;
            joinButton.textContent = 'Lottery Closed';
            joinButton.classList.add('btn-secondary');
            joinButton.classList.remove('btn-primary', 'pulse');
        } else if (hasJoined) {
            // If user has joined, show but disable button
            joinButton.disabled = true;
            joinButton.textContent = 'Already Joined';
            joinButton.classList.add('btn-success');
            joinButton.classList.remove('btn-primary', 'pulse');
        } else if (!canJoin) {
            // If user can't join (not connected), disable button
            joinButton.disabled = true;
            joinButton.textContent = 'Connect Wallet to Join';
            joinButton.classList.add('btn-secondary');
            joinButton.classList.remove('btn-primary', 'pulse');
        } else {
            // User can join and hasn't joined yet
            joinButton.disabled = false;
            joinButton.textContent = 'Join Lottery';
            joinButton.classList.add('btn-primary', 'pulse');
            joinButton.classList.remove('btn-secondary', 'btn-success');
        }
    }
    
    // Show notification toast
    showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.role = 'alert';
        toast.ariaLive = 'assertive';
        toast.ariaAtomic = 'true';
        
        const colorClass = {
            'success': 'bg-success text-white',
            'error': 'bg-danger text-white',
            'info': 'bg-info text-white',
            'warning': 'bg-warning'
        }[type] || 'bg-info text-white';
        
        toast.innerHTML = `
            <div class="toast-header ${colorClass}">
                <strong class="me-auto">Lottery App</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        // Add to notification area
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
            toastContainer.appendChild(toast);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                toast.remove();
            }, 5000);
            
            // Add close button functionality
            const closeButton = toast.querySelector('.btn-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    toast.remove();
                });
            }
        }
    }
} 