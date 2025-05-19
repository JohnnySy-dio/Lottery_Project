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
        if (write) {
            if (!this.web3Provider.isWriteConnected) {
                throw new Error("Write connection not available. Please connect your wallet.");
            }
            return this.web3Provider.writeContract;
        }
        return this.web3Provider.getContract();
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
            const [isLotteryOpen, winner, playerCount, balance, entryFee] = await Promise.all([
                this.getContract().methods.lotteryOpen().call(),
                this.getContract().methods.lotteryHistory(lotteryId).call(),
                this.getContract().methods.getPlayerCount().call(),
                this.getContract().methods.getBalance().call(),
                this.getContract().methods.entryFee().call()
            ]);
            
            // Check if this is a zero address (no winner yet)
            const hasWinner = winner !== '0x0000000000000000000000000000000000000000';
            
            return {
                id: lotteryId,
                startTime: 0, // Not tracked in contract
                endTime: 0,   // Not tracked in contract
                winner: winner,
                prize: balance, // Current balance
                completed: !isLotteryOpen || hasWinner, // If not open or has winner
                playerCount: playerCount,
                balance: balance,
                participants: [], // Will be populated by getParticipants
                isOpen: isLotteryOpen
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
            // Contract uses a mapping, not a function
            return await this.getContract().methods.hasEntered(address).call();
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

    // Check if current user is owner
    async isOwner() {
        try {
            if (!this.web3Provider.userAccount) return false;
            
            const owner = await this.getContract().methods.owner().call();
            return owner.toLowerCase() === this.web3Provider.userAccount.toLowerCase();
        } catch (error) {
            console.error("Failed to check if user is owner:", error);
            return false;
        }
    }

    // ------------- WRITE FUNCTIONS -------------

    // Enter lottery
    async enterLottery() {
        if (!this.web3Provider.isWriteConnected) {
            throw new Error("MetaMask not connected. Please connect your wallet to enter the lottery.");
        }

        try {
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
                this.statusCallbacks.onError("Failed to enter lottery: " + error.message);
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