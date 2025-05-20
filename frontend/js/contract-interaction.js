/**
 * Decentralized Lottery - Contract Interaction
 * Handles all interactions with the smart contract
 */

class ContractInteraction {
    constructor(web3Provider) {
        this.web3Provider = web3Provider;
        this.statusCallbacks = {
            onSuccess: null,
            onError: null,
            onPending: null,
            onReceipt: null,
            onConfirmation: null
        };
    }

    // Set callbacks for transaction status updates
    setCallbacks(callbacks) {
        this.statusCallbacks = { ...this.statusCallbacks, ...callbacks };
    }

    // Helper to get the appropriate contract instance
    getContract(write = false) {
        // Special handling for Ganache
        if (CONFIG.CHAIN_ID === "0x539") {
            if (write) {
                if (!this.web3Provider.isWriteConnected) {
                    throw new Error("Not connected to Ganache. Please select a Ganache account from the 'Ganache Accounts' dropdown first.");
                }
                if (!this.web3Provider.writeContract) {
                    throw new Error("No contract deployed on Ganache. Please deploy the contract first using: truffle migrate --network development");
                }
                return this.web3Provider.writeContract;
            }
            
            const contract = this.web3Provider.getContract();
            if (!contract) {
                throw new Error("No contract available on Ganache. Please deploy the contract first using: truffle migrate --network development");
            }
            return contract;
        }
        
        // Standard handling for other networks
        if (write) {
            if (!this.web3Provider.isWriteConnected) {
                throw new Error("Write connection not available. Please connect your wallet.");
            }
            if (!this.web3Provider.writeContract) {
                throw new Error("No contract deployed on this network. Please deploy the contract first.");
            }
            return this.web3Provider.writeContract;
        }
        
        const contract = this.web3Provider.getContract();
        if (!contract) {
            throw new Error("No contract available. Contract may not be deployed on this network.");
        }
        return contract;
    }

    // ------------- READ FUNCTIONS -------------

    // Get current lottery ID
    async getCurrentLotteryId() {
        try {
            return await this.getContract().methods.lotteryId().call();
        } catch (error) {
            console.error("Failed to get current lottery ID:", error);
            throw error;
        }
    }

    // Get lottery info by ID
    async getLotteryInfo(lotteryId) {
        try {
            // The actual contract doesn't have a getLottery function
            // Create a composite object from multiple contract calls
            const [isLotteryOpen, winner, playerCount, balance, entryFee, minPlayers] = await Promise.all([
                this.getContract().methods.lotteryOpen().call(),
                this.getContract().methods.lotteryHistory(lotteryId).call(),
                this.getContract().methods.getPlayerCount().call(),
                this.getContract().methods.getBalance().call(),
                this.getContract().methods.entryFee().call(),
                this.getContract().methods.minPlayers().call()
            ]);
            
            // Check if this is a zero address (no winner yet)
            const hasWinner = winner !== '0x0000000000000000000000000000000000000000';
            
            return {
                id: lotteryId,
                startTime: 0, // Not tracked in contract
                endTime: 0,   // Not tracked in contract
                winner: winner,
                prize: balance, // Current balance
                playerCount: playerCount,
                balance: balance,
                participants: [], // Will be populated by getParticipants
                isOpen: isLotteryOpen,
                minPlayers: minPlayers,
                hasWinner: hasWinner
            };
        } catch (error) {
            console.error(`Failed to get lottery info for ID ${lotteryId}:`, error);
            throw error;
        }
    }

    // Get all participants of a lottery
    async getParticipants(lotteryId) {
        try {
            // The contract doesn't track participants by lottery ID
            // It only has current participants
            return await this.getContract().methods.getPlayers().call();
        } catch (error) {
            console.error(`Failed to get participants for lottery ID ${lotteryId}:`, error);
            throw error;
        }
    }

    // Check if an address has joined a lottery
    async hasJoined(lotteryId, address) {
        try {
            console.log(`Checking if address ${address} has joined lottery ${lotteryId}`);
            
            // Directly call the contract to ensure we get fresh data
            if (!address) return false;
            
            // Contract uses a mapping, not a function
            const hasEntered = await this.getContract().methods.hasEntered(address).call();
            console.log(`Address ${address} has ${hasEntered ? 'joined' : 'not joined'} the lottery`);
            
            return hasEntered;
        } catch (error) {
            console.error(`Failed to check if address ${address} joined lottery ${lotteryId}:`, error);
            throw error;
        }
    }

    // Get entry fee
    async getEntryFee() {
        try {
            return await this.getContract().methods.entryFee().call();
        } catch (error) {
            console.error("Failed to get entry fee:", error);
            throw error;
        }
    }

    // Get admin fees
    async getAdminFees() {
        try {
            return await this.getContract().methods.adminFees().call();
        } catch (error) {
            console.error("Failed to get admin fees:", error);
            throw error;
        }
    }

    // Check if current user is owner
    async isOwner() {
        try {
            if (!this.web3Provider.userAccount) {
                console.log("No user account available, not owner");
                return false;
            }
            
            const owner = await this.getContract().methods.owner().call();
            console.log("Contract owner:", owner);
            console.log("Current user:", this.web3Provider.userAccount);
            
            // Ensure both addresses are normalized to lowercase for comparison
            const normalizedOwner = owner.toLowerCase();
            const normalizedUser = this.web3Provider.userAccount.toLowerCase();
            const isOwner = normalizedOwner === normalizedUser;
            
            console.log(`Is current user owner? ${isOwner}`);
            return isOwner;
        } catch (error) {
            console.error("Failed to check if user is owner:", error);
            return false;
        }
    }

    // Get the contract owner address
    async getOwnerAddress() {
        try {
            return await this.getContract().methods.owner().call();
        } catch (error) {
            console.error("Failed to get owner address:", error);
            throw error;
        }
    }

    // ------------- WRITE FUNCTIONS -------------

    // Enter lottery
    async enterLottery() {
        try {
            // First check if we have a deployed contract
            if (CONFIG.CHAIN_ID === "0x539" && (!this.web3Provider.writeContract || !this.web3Provider.writeWeb3)) {
                throw new Error("No contract deployed on Ganache. Please deploy the contract first using: truffle migrate --network development");
            }

            if (!this.web3Provider.isWriteConnected) {
                if (CONFIG.CHAIN_ID === "0x539") {
                    throw new Error("Not connected to Ganache. Please select a Ganache account from the 'Ganache Accounts' dropdown first.");
                } else {
                    throw new Error("MetaMask not connected. Please connect your wallet to enter the lottery.");
                }
            }

            // Check if lottery is open
            const isOpen = await this.getContract().methods.lotteryOpen().call();
            if (!isOpen) {
                throw new Error("Lottery is currently closed. Please wait until it reopens.");
            }
            
            // Check if user has already entered
            const hasEntered = await this.getContract().methods.hasEntered(this.web3Provider.userAccount).call();
            if (hasEntered) {
                throw new Error("You have already entered this lottery round.");
            }
            
            const entryFee = await this.getEntryFee();
            
            if (this.statusCallbacks.onPending) {
                this.statusCallbacks.onPending("Entering lottery...");
            }
            
            // Contract uses enterLottery, not enter
            const tx = this.getContract(true).methods.enterLottery();
            return this._sendTransaction(tx, entryFee);
        } catch (error) {
            console.error("Failed to enter lottery:", error);
            if (this.statusCallbacks.onError) {
                this.statusCallbacks.onError(error.message);
            }
            throw error;
        }
    }

    // Start a new lottery (owner only)
    async startNewLottery() {
        if (!this.web3Provider.isWriteConnected) {
            throw new Error("MetaMask not connected. Please connect your wallet to start a lottery.");
        }

        try {
            // Check if current lottery is still open
            const isOpen = await this.getContract().methods.lotteryOpen().call();
            if (isOpen) {
                // If open, check if there are participants
                const playerCount = await this.getContract().methods.getPlayerCount().call();
                if (parseInt(playerCount) > 0) {
                    throw new Error("Cannot start a new lottery while current lottery is open with participants. Please close the current lottery and pick a winner first.");
                }
            }
            
            if (this.statusCallbacks.onPending) {
                this.statusCallbacks.onPending("Starting new lottery...");
            }
            
            // Contract doesn't have startNewLottery, it uses openLottery
            const tx = this.getContract(true).methods.openLottery();
            return this._sendTransaction(tx, "0");
        } catch (error) {
            console.error("Failed to start new lottery:", error);
            if (this.statusCallbacks.onError) {
                this.statusCallbacks.onError("Failed to start new lottery: " + error.message);
            }
            throw error;
        }
    }

    // Pick winner (owner only)
    async pickWinner(lotteryId) {
        if (!this.web3Provider.isWriteConnected) {
            throw new Error("MetaMask not connected. Please connect your wallet to pick a winner.");
        }

        try {
            // Check if lottery is open
            const isOpen = await this.getContract().methods.lotteryOpen().call();
            if (!isOpen) {
                throw new Error("Cannot pick a winner: The lottery is not open.");
            }
            
            // Check if there are enough participants
            const [playerCount, minPlayers] = await Promise.all([
                this.getContract().methods.getPlayerCount().call(),
                this.getContract().methods.minPlayers().call()
            ]);
            
            if (parseInt(playerCount) === 0) {
                throw new Error("Cannot pick a winner: There are no participants in the lottery.");
            }
            
            if (parseInt(playerCount) < parseInt(minPlayers)) {
                throw new Error(`Cannot pick a winner: Need at least ${minPlayers} participants (currently ${playerCount}).`);
            }
            
            if (this.statusCallbacks.onPending) {
                this.statusCallbacks.onPending("Picking winner...");
            }
            
            // First close the lottery
            await this._sendTransaction(
                this.getContract(true).methods.closeLottery(),
                "0"
            );
            
            // Then pick the winner - contract doesn't take a lotteryId param
            const tx = this.getContract(true).methods.pickWinner();
            return this._sendTransaction(tx, "0");
        } catch (error) {
            console.error("Failed to pick winner:", error);
            if (this.statusCallbacks.onError) {
                this.statusCallbacks.onError("Failed to pick winner: " + error.message);
            }
            throw error;
        }
    }

    // Set Entry Fee (owner only)
    async setEntryFee(feeInEth) {
        if (!this.web3Provider.isWriteConnected) {
            throw new Error("MetaMask not connected. Please connect your wallet to set the entry fee.");
        }

        try {
            if (this.statusCallbacks.onPending) {
                this.statusCallbacks.onPending("Setting new entry fee...");
            }
            
            // Convert ETH to Wei
            const web3 = this.web3Provider.getWeb3();
            const feeInWei = web3.utils.toWei(feeInEth.toString(), 'ether');
            
            // Call the contract method
            const tx = this.getContract(true).methods.setEntryFee(feeInWei);
            return this._sendTransaction(tx, "0");
        } catch (error) {
            console.error("Failed to set entry fee:", error);
            if (this.statusCallbacks.onError) {
                this.statusCallbacks.onError("Failed to set entry fee: " + error.message);
            }
            throw error;
        }
    }
    
    // Set Min Players (owner only)
    async setMinPlayers(minPlayers) {
        if (!this.web3Provider.isWriteConnected) {
            throw new Error("MetaMask not connected. Please connect your wallet to set minimum players.");
        }

        try {
            if (this.statusCallbacks.onPending) {
                this.statusCallbacks.onPending("Setting minimum players...");
            }
            
            console.log(`Attempting to set minimum players to ${minPlayers}`);
            
            // Ensure minPlayers is a number
            const minPlayersValue = parseInt(minPlayers);
            if (isNaN(minPlayersValue) || minPlayersValue < 2) {
                throw new Error("Minimum players must be at least 2");
            }
            
            // Check if user is owner
            const isOwner = await this.isOwner();
            console.log(`Current user is owner: ${isOwner}`);
            if (!isOwner) {
                throw new Error("Only the contract owner can set minimum players");
            }
            
            // Check contract connection
            if (!this.web3Provider.writeContract || !this.web3Provider.writeWeb3) {
                console.error("No write contract available");
                throw new Error("Contract not properly initialized");
            }
            
            // Get the contract's current min players for comparison
            const currentMinPlayers = await this.getContract().methods.minPlayers().call();
            console.log(`Current contract minimum players: ${currentMinPlayers}, new value: ${minPlayersValue}`);
            
            // Call the contract method
            console.log("Preparing transaction to set min players...");
            const tx = this.getContract(true).methods.setMinPlayers(minPlayersValue);
            console.log("Transaction prepared, sending...");
            
            return this._sendTransaction(tx, "0");
        } catch (error) {
            console.error("Failed to set minimum players:", error);
            if (this.statusCallbacks.onError) {
                this.statusCallbacks.onError("Failed to set minimum players: " + error.message);
            }
            throw error;
        }
    }
    
    // Withdraw Admin Fees (owner only)
    async withdrawAdminFees() {
        if (!this.web3Provider.isWriteConnected) {
            throw new Error("MetaMask not connected. Please connect your wallet to withdraw fees.");
        }

        try {
            if (this.statusCallbacks.onPending) {
                this.statusCallbacks.onPending("Withdrawing admin fees...");
            }
            
            // Call the contract method
            const tx = this.getContract(true).methods.withdrawAdminFees();
            return this._sendTransaction(tx, "0");
        } catch (error) {
            console.error("Failed to withdraw admin fees:", error);
            if (this.statusCallbacks.onError) {
                this.statusCallbacks.onError("Failed to withdraw admin fees: " + error.message);
            }
            throw error;
        }
    }

    // Close lottery temporarily (owner only)
    async closeLottery() {
        if (!this.web3Provider.isWriteConnected) {
            throw new Error("MetaMask not connected. Please connect your wallet to close the lottery.");
        }

        try {
            // Check if lottery is already closed
            const isOpen = await this.getContract().methods.lotteryOpen().call();
            if (!isOpen) {
                throw new Error("Lottery is already closed.");
            }
            
            if (this.statusCallbacks.onPending) {
                this.statusCallbacks.onPending("Closing lottery temporarily...");
            }
            
            // Call the contract method to close the lottery
            const tx = this.getContract(true).methods.closeLottery();
            return this._sendTransaction(tx, "0");
        } catch (error) {
            console.error("Failed to close lottery:", error);
            if (this.statusCallbacks.onError) {
                this.statusCallbacks.onError("Failed to close lottery: " + error.message);
            }
            throw error;
        }
    }

    // Helper function to send transactions with proper tracking
    async _sendTransaction(tx, value) {
        try {
            const gas = await tx.estimateGas({ 
                from: this.web3Provider.userAccount, 
                value: value 
            });
            
            return new Promise((resolve, reject) => {
                tx.send({
                    from: this.web3Provider.userAccount,
                    value: value,
                    gas: Math.floor(gas * 1.2) // Add 20% buffer
                })
                .on('transactionHash', (hash) => {
                    console.log("Transaction hash:", hash);
                    if (this.statusCallbacks.onPending) {
                        this.statusCallbacks.onPending(`Transaction submitted. Hash: ${hash}`);
                    }
                })
                .on('receipt', (receipt) => {
                    console.log("Transaction receipt:", receipt);
                    if (this.statusCallbacks.onReceipt) {
                        this.statusCallbacks.onReceipt(receipt);
                    }
                })
                .on('confirmation', (confirmationNumber, receipt) => {
                    console.log(`Confirmation #${confirmationNumber}:`, receipt);
                    if (confirmationNumber === 1 && this.statusCallbacks.onConfirmation) {
                        this.statusCallbacks.onConfirmation(confirmationNumber, receipt);
                        resolve(receipt);
                    }
                })
                .on('error', (error) => {
                    console.error("Transaction error:", error);
                    if (this.statusCallbacks.onError) {
                        this.statusCallbacks.onError(error.message);
                    }
                    reject(error);
                });
            });
        } catch (error) {
            console.error("Transaction send error:", error);
            if (this.statusCallbacks.onError) {
                this.statusCallbacks.onError(error.message);
            }
            throw error;
        }
    }
} 