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
                        this.userBalanceDisplay.style.display = 'block';
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
                    this.userBalanceDisplay.style.display = 'none';
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
        
        // Add styles
        devBadge.style.position = 'fixed';
        devBadge.style.top = '60px';
        devBadge.style.left = '0';
        devBadge.style.right = '0';
        devBadge.style.backgroundColor = '#FFC107';
        devBadge.style.color = '#000';
        devBadge.style.textAlign = 'center';
        devBadge.style.padding = '5px';
        devBadge.style.fontWeight = 'bold';
        devBadge.style.zIndex = '1000';
        devBadge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
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
        
        const className = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'info': 'alert-info',
            'warning': 'alert-warning'
        }[type] || 'alert-info';
        
        this.statusMessage.innerHTML = `<p class="mb-0">${message}</p>`;
        this.statusMessage.className = `alert ${className}`;
        this.statusMessage.style.display = 'block';
        
        // Scroll to status message
        this.statusMessage.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Show error
    showError(message) {
        this.showStatus(message, 'error');
        console.error(message);
    }
    
    // Show success
    showSuccess(message) {
        this.showStatus(message, 'success');
    }
    
    // Show Pending Transaction
    showPending(message) {
        this.showStatus(`<div class="spinner-border spinner-border-sm me-2" role="status"></div> ${message}`, 'info');
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
                this.winnerDisplay.parentElement.style.display = 'block';
            } else {
                this.winnerDisplay.textContent = 'No winner yet';
                this.winnerDisplay.parentElement.style.display = lotteryInfo.hasWinner ? 'block' : 'none';
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
            participantsTable.style.display = participants.length > 0 ? 'block' : 'none';
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
    
    // Toggle admin controls visibility
    showAdminControls(isOwner) {
        console.log("Updating admin controls visibility. Is owner:", isOwner);
        if (this.adminActions) {
            this.adminActions.style.display = isOwner ? 'block' : 'none';
            console.log(`Admin controls are now ${isOwner ? 'visible' : 'hidden'}`);
        } else {
            console.warn("Admin actions element not found in DOM");
        }
    }
    
    // Update admin button states based on lottery state
    updateAdminButtons(lotteryInfo) {
        if (!lotteryInfo) return;
        
        const startLotteryBtn = document.getElementById('startLotteryBtn');
        const pickWinnerBtn = document.getElementById('pickWinnerBtn');
        const closeLotteryBtn = document.getElementById('closeLotteryBtn');
        
        if (!startLotteryBtn || !pickWinnerBtn || !closeLotteryBtn) return;
        
        // Start lottery button: Enable only if lottery is closed OR if lottery is open with no participants
        const canStartNewLottery = !lotteryInfo.isOpen || 
                                   (lotteryInfo.isOpen && parseInt(lotteryInfo.playerCount) === 0);
        
        startLotteryBtn.disabled = !canStartNewLottery;
        startLotteryBtn.title = canStartNewLottery ? 
            "Start a new lottery" : 
            "Cannot start a new lottery while current lottery is open with participants";
        
        // Close lottery button: Enable only if lottery is open
        const canCloseLottery = lotteryInfo.isOpen;
        
        closeLotteryBtn.disabled = !canCloseLottery;
        closeLotteryBtn.title = canCloseLottery ? 
            "Temporarily close the lottery" : 
            "Lottery is already closed";
        
        // Pick winner button: Enable only if lottery is open and has enough participants
        const minPlayers = parseInt(lotteryInfo.minPlayers || "3");
        const currentPlayers = parseInt(lotteryInfo.playerCount || "0");
        const canPickWinner = lotteryInfo.isOpen && currentPlayers >= minPlayers;
        
        pickWinnerBtn.disabled = !canPickWinner;
        
        let pickWinnerTitle = "Select a winner for this lottery";
        if (!lotteryInfo.isOpen) {
            pickWinnerTitle = "Cannot pick a winner: Lottery is not open";
        } else if (currentPlayers === 0) {
            pickWinnerTitle = "Cannot pick a winner: No participants";
        } else if (currentPlayers < minPlayers) {
            pickWinnerTitle = `Cannot pick a winner: Need at least ${minPlayers} participants (currently ${currentPlayers})`;
        }
        
        pickWinnerBtn.title = pickWinnerTitle;
    }
    
    // Show loading state
    showLoading() {
        this.loaders.forEach(loader => {
            loader.style.display = 'inline-block';
        });
    }
    
    // Hide loading state
    hideLoading() {
        this.loaders.forEach(loader => {
            loader.style.display = 'none';
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