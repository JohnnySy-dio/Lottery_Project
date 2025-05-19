/**
 * Decentralized Lottery - Web3 Provider
 * Handles Web3 connections to Ethereum networks
 * Uses dual-provider architecture: read-only + transaction mode
 */

class Web3Provider {
    constructor() {
        // Web3 instances
        this.readWeb3 = null;      // For read-only operations using PublicNode
        this.writeWeb3 = null;     // For transactions using MetaMask
        this.readContract = null;  // Contract instance for reading
        this.writeContract = null; // Contract instance for writing
        this.userAccount = null;   // Connected wallet address
        
        // Connection state
        this.isReadConnected = false;
        this.isWriteConnected = false;
        
        // Event handlers
        this.onAccountsChanged = null;
        this.onChainChanged = null;
        this.onNetworkChanged = null;
        this.onConnected = null;
        this.onDisconnected = null;
    }
    
    /**
     * Initialize the Web3Provider
     * This should be called before using any other methods
     */
    async init() {
        console.log("Initializing Web3Provider...");
        
        // Initialize a global instance for UI components
        if (!window.web3 && typeof Web3 !== 'undefined') {
            console.log("Initializing global Web3 instance for UI");
            window.web3 = new Web3();
        }
        
        // Initialize read-only connection
        const readInitialized = await this.initReadOnlyWeb3();
        if (!readInitialized) {
            console.warn("Failed to initialize read-only connection");
        }
        
        // Check if MetaMask is already connected
        await this.checkConnectedAccounts();
        
        return this.isReadConnected;
    }
    
    /**
     * Initialize read-only web3 connection through public RPC
     * This always runs even if MetaMask is not available
     */
    async initReadOnlyWeb3() {
        try {
            console.log("Initializing read-only connection via PublicNode RPC...");
            
            // Try each endpoint until one works
            for (const endpoint of CONFIG.RPC_ENDPOINTS) {
                try {
                    console.log(`Trying RPC endpoint: ${endpoint}`);
                    
                    // Test direct endpoint access first
                    try {
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                jsonrpc: '2.0',
                                method: 'eth_blockNumber',
                                params: [],
                                id: 1
                            })
                        });
                        
                        if (!response.ok) {
                            console.error(`RPC endpoint fetch failed with status: ${response.status}`);
                            continue; // Try next endpoint
                        }
                        
                        const data = await response.json();
                        console.log("RPC endpoint direct fetch response:", data);
                    } catch (fetchError) {
                        console.error(`Direct fetch to ${endpoint} failed:`, fetchError);
                        continue; // Try next endpoint
                    }
                    
                    // Create Web3 instance with detailed error handling
                    this.readWeb3 = new Web3(new Web3.providers.HttpProvider(endpoint, {
                        timeout: 30000, // Increase timeout to 30 seconds
                        headers: [{ name: 'Accept', value: 'application/json' }]
                    }));
                    
                    // Test the connection by getting block number
                    const blockNumber = await this.readWeb3.eth.getBlockNumber();
                    console.log(`Connected to RPC endpoint ${endpoint}. Current block: ${blockNumber}`);
                    
                    // Initialize contract
                    this.readContract = new this.readWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                    console.log("Read-only contract instance created successfully");
                    
                    // Test contract connection
                    const lotteryId = await this.readContract.methods.lotteryId().call();
                    console.log("Contract connection test successful. Current lottery ID:", lotteryId);
                    
                    // Mark as connected
                    this.isReadConnected = true;
                    
                    // Exit the loop - we have a working connection
                    return true;
                    
                } catch (error) {
                    console.error(`Error with RPC endpoint ${endpoint}:`, error);
                    continue; // Try next endpoint
                }
            }
            
            // If we get here, all endpoints failed
            console.error("All RPC endpoints failed");
            this.isReadConnected = false;
            return false;
            
        } catch (error) {
            console.error("Error initializing read-only Web3:", error);
            this.isReadConnected = false;
            return false;
        }
    }
    
    /**
     * Connect to MetaMask wallet for transaction capabilities
     * This is an interactive function that requires user approval
     */
    async connectWallet() {
        try {
            if (!window.ethereum) {
                console.error("MetaMask not detected. Please install MetaMask to interact with the contract.");
                return false;
            }
            
            console.log("Requesting connection to MetaMask...");
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.userAccount = accounts[0];
            
            // Check if on correct network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== CONFIG.CHAIN_ID) {
                console.warn(`Wrong network. Found ${chainId}, expected ${CONFIG.CHAIN_ID} (Sepolia).`);
                
                // Set event handler for network switch
                if (this.onNetworkChanged) {
                    this.onNetworkChanged({
                        connected: true,
                        correctNetwork: false,
                        chainId: chainId,
                        expectedChainId: CONFIG.CHAIN_ID,
                        networkName: this.getNetworkName(chainId)
                    });
                }
                
                return false;
            }
            
            // Initialize transaction-capable web3
            this.writeWeb3 = new Web3(window.ethereum);
            this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
            
            // Set up event listeners for MetaMask
            this.setupMetaMaskListeners();
            
            // Mark as connected
            this.isWriteConnected = true;
            
            // Trigger connected event
            if (this.onConnected) {
                const balance = await this.writeWeb3.eth.getBalance(this.userAccount);
                const balanceEth = this.writeWeb3.utils.fromWei(balance, 'ether');
                
                this.onConnected({
                    account: this.userAccount,
                    balance: balanceEth,
                    chainId: chainId,
                    networkName: this.getNetworkName(chainId)
                });
            }
            
            console.log(`Connected to wallet: ${this.userAccount}`);
            return true;
            
        } catch (error) {
            console.error("Error connecting to wallet:", error);
            this.isWriteConnected = false;
            return false;
        }
    }
    
    /**
     * Setup event listeners for MetaMask
     */
    setupMetaMaskListeners() {
        if (!window.ethereum) return;
        
        // Handle account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                // User disconnected wallet
                this.userAccount = null;
                this.isWriteConnected = false;
                
                if (this.onDisconnected) {
                    this.onDisconnected();
                }
                
                console.log("Wallet disconnected");
            } else {
                // Account switched
                this.userAccount = accounts[0];
                
                if (this.onAccountsChanged) {
                    this.onAccountsChanged(accounts[0]);
                }
                
                console.log(`Switched to account: ${this.userAccount}`);
            }
        });
        
        // Handle chain changes
        window.ethereum.on('chainChanged', (chainId) => {
            console.log(`Chain changed to ${chainId}`);
            
            // Check if this is the correct network
            const isCorrectNetwork = chainId === CONFIG.CHAIN_ID;
            
            if (this.onNetworkChanged) {
                this.onNetworkChanged({
                    connected: true,
                    correctNetwork: isCorrectNetwork,
                    chainId: chainId,
                    expectedChainId: CONFIG.CHAIN_ID,
                    networkName: this.getNetworkName(chainId)
                });
            }
            
            if (isCorrectNetwork) {
                // Reinitialize transaction contract with current chain
                this.writeWeb3 = new Web3(window.ethereum);
                this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                this.isWriteConnected = true;
            } else {
                this.isWriteConnected = false;
            }
        });
    }
    
    /**
     * Request network switch to Sepolia
     */
    async switchNetwork() {
        if (!window.ethereum) return false;
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CONFIG.CHAIN_ID }],
            });
            return true;
        } catch (error) {
            console.error("Error switching network:", error);
            return false;
        }
    }
    
    /**
     * Check if MetaMask is already connected
     * This doesn't trigger a MetaMask popup
     */
    async checkConnectedAccounts() {
        if (!window.ethereum) return null;
        
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
                this.userAccount = accounts[0];
                
                // Initialize write connection
                this.writeWeb3 = new Web3(window.ethereum);
                this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                this.isWriteConnected = true;
                
                // Set up event listeners for MetaMask
                this.setupMetaMaskListeners();
                
                return accounts[0];
            }
            return null;
        } catch (error) {
            console.error("Error checking MetaMask connection:", error);
            return null;
        }
    }
    
    /**
     * Check if the connected wallet is on the correct network
     */
    async isCorrectNetwork() {
        try {
            if (window.ethereum) {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                return chainId === CONFIG.CHAIN_ID;
            }
            return false;
        } catch (error) {
            console.error("Error checking network:", error);
            return false;
        }
    }
    
    /**
     * Get a human-readable network name from chainId
     * If chainId is not provided, gets the current chainId
     */
    async getNetworkName(chainId) {
        // If chainId not provided, get current chainId
        if (!chainId && window.ethereum) {
            try {
                chainId = await window.ethereum.request({ method: 'eth_chainId' });
            } catch (error) {
                console.error("Error getting chainId:", error);
                return "Unknown Network";
            }
        }
        
        return CONFIG.NETWORKS[chainId] || `Unknown Network (${chainId})`;
    }
    
    /**
     * Get the currently active Web3 instance based on connection state
     */
    getWeb3() {
        return this.isWriteConnected ? this.writeWeb3 : this.readWeb3;
    }
    
    /**
     * Get the currently active contract instance based on connection state
     */
    getContract() {
        return this.isWriteConnected ? this.writeContract : this.readContract;
    }
    
    /**
     * Check if any Web3 provider is connected
     */
    isConnected() {
        return this.isReadConnected || this.isWriteConnected;
    }
    
    /**
     * Check if connected with write capabilities
     */
    hasWriteAccess() {
        return this.isWriteConnected;
    }
    
    /**
     * Get current connected account
     */
    getAccount() {
        return this.userAccount;
    }
}

// Create singleton instance
const web3Provider = new Web3Provider();

// Export for module usage
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = web3Provider;
} 