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
        this.networkDisplay = document.getElementById('networkName');
        this.connectionStatus = document.getElementById('connectionStatus');
        
        // Lottery info elements
        this.currentLotteryId = document.getElementById('currentLotteryId');
        this.lotteryStatus = document.getElementById('lotteryStatus');
        this.entryFee = document.getElementById('entryFee');
        this.participantCount = document.getElementById('participantCount');
        this.prizePool = document.getElementById('prizePool');
        this.winnerDisplay = document.getElementById('winner');
        
        // Loader elements
        this.loaders = document.querySelectorAll('.loading-indicator');
        
        // Admin elements
        this.adminActions = document.getElementById('adminActions');
    }
    
    // Display connection status
    updateConnectionStatus(isConnected, account = null) {
        if (this.connectionStatus) {
            if (isConnected && account) {
                this.connectionStatus.textContent = 'Connected';
                this.connectionStatus.className = 'badge bg-success';
                
                if (this.userAccountDisplay) {
                    const shortenedAccount = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
                    this.userAccountDisplay.textContent = shortenedAccount;
                }
            } else {
                this.connectionStatus.textContent = 'Not Connected';
                this.connectionStatus.className = 'badge bg-danger';
                
                if (this.userAccountDisplay) {
                    this.userAccountDisplay.textContent = 'Not connected';
                }
            }
        }
    }
    
    // Update network status
    updateNetworkStatus(networkName, isCorrectNetwork) {
        if (this.networkDisplay) {
            this.networkDisplay.textContent = networkName;
            this.networkDisplay.className = isCorrectNetwork ? 'badge bg-success' : 'badge bg-warning';
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
        
        // Update lottery status
        if (this.lotteryStatus) {
            const statusText = lotteryInfo.completed ? 'Completed' : (lotteryInfo.isOpen ? 'Open' : 'Closed');
            const statusClass = lotteryInfo.completed ? 'bg-secondary' : (lotteryInfo.isOpen ? 'bg-success' : 'bg-warning');
            this.lotteryStatus.textContent = statusText;
            this.lotteryStatus.className = `badge ${statusClass}`;
        }
        
        // Update prize pool
        if (this.prizePool && lotteryInfo.balance) {
            try {
                // Initialize Web3 locally if needed
                const web3Instance = window.web3 || new Web3();
                
                // Convert from wei to ETH and format
                const ethValue = web3Instance.utils.fromWei(lotteryInfo.balance.toString(), 'ether');
                this.prizePool.textContent = `${parseFloat(ethValue).toFixed(4)} ETH`;
                console.log("Updated prize pool:", ethValue, "ETH from", lotteryInfo.balance, "wei");
            } catch (error) {
                console.error("Error converting prize pool:", error);
                // Fallback conversion
                const ethValue = Number(lotteryInfo.balance / 1e18).toFixed(4);
                this.prizePool.textContent = `${ethValue} ETH`;
            }
        }
        
        // Update participant count
        if (this.participantCount) {
            this.participantCount.textContent = lotteryInfo.playerCount || '0';
        }
        
        // Update winner
        if (this.winnerDisplay) {
            if (lotteryInfo.completed && lotteryInfo.winner && lotteryInfo.winner !== '0x0000000000000000000000000000000000000000') {
                const shortenedWinner = `${lotteryInfo.winner.substring(0, 6)}...${lotteryInfo.winner.substring(lotteryInfo.winner.length - 4)}`;
                this.winnerDisplay.textContent = shortenedWinner;
                this.winnerDisplay.parentElement.style.display = 'block';
            } else {
                this.winnerDisplay.textContent = 'No winner yet';
                this.winnerDisplay.parentElement.style.display = lotteryInfo.completed ? 'block' : 'none';
            }
        }
    }
    
    // Update entry fee
    updateEntryFee(fee) {
        if (this.entryFee && fee) {
            try {
                // Initialize Web3 locally if needed
                const web3Instance = window.web3 || new Web3();
                
                // Convert from wei to ETH and format
                const ethValue = web3Instance.utils.fromWei(fee.toString(), 'ether');
                this.entryFee.textContent = `${parseFloat(ethValue).toFixed(4)} ETH`;
                console.log("Updated entry fee:", ethValue, "ETH from", fee, "wei");
            } catch (error) {
                console.error("Error converting entry fee:", error);
                // Fallback conversion
                const ethValue = Number(fee / 1e18).toFixed(4);
                this.entryFee.textContent = `${ethValue} ETH`;
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
        if (this.adminActions) {
            this.adminActions.style.display = isOwner ? 'block' : 'none';
        }
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
    updateJoinButton(canJoin, hasJoined, lotteryCompleted) {
        const joinButton = document.getElementById('joinLotteryBtn');
        if (!joinButton) return;
        
        if (lotteryCompleted) {
            joinButton.disabled = true;
            joinButton.textContent = 'Lottery Ended';
        } else if (hasJoined) {
            joinButton.disabled = true;
            joinButton.textContent = 'Already Joined';
        } else if (!canJoin) {
            joinButton.disabled = true;
            joinButton.textContent = 'Connect Wallet to Join';
        } else {
            joinButton.disabled = false;
            joinButton.textContent = 'Join Lottery';
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