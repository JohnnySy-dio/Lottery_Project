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
        this.onGanacheAccountsLoaded = null;
    }
    
    /**
     * Initialize the Web3Provider
     * This should be called before using any other methods
     */
    async init() {
        console.log("Initializing Web3Provider...");
        
        // Ensure Web3 class is available globally if web3.min.js is loaded
        if (typeof Web3 !== 'undefined') {
            window.Web3 = Web3; // Assign the class constructor
            console.log("Web3 class constructor assigned to window.Web3");
        } else {
            console.error("Web3 class constructor (Web3) is not defined. Make sure web3.min.js is loaded.");
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
            console.log(`Initializing read-only connection for network ${CONFIG.NETWORKS[CONFIG.CHAIN_ID]}...`);
            
            // Try each endpoint until one works
            for (const endpoint of CONFIG.CURRENT_RPC_LIST) {
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
                    this._updateGlobalWeb3Instance(this.readWeb3); // Update global instance
                    
                    // Test the connection by getting block number
                    const blockNumber = await this.readWeb3.eth.getBlockNumber();
                    console.log(`Connected to RPC endpoint ${endpoint}. Current block: ${blockNumber}`);
                    
                    // Verify contract address is set for this network
                    if (!CONFIG.CONTRACT_ADDRESS || CONFIG.CONTRACT_ADDRESS === "") {
                        console.warn(`No contract address configured for network ${CONFIG.CHAIN_ID}`);
                        
                        // For local development, we might need to deploy first
                        if (CONFIG.CHAIN_ID === "0x539") {
                            console.log("Local development detected. Please deploy the contract first.");
                            // For Ganache, we'll mark as connected but without a contract
                            this.isReadConnected = true;
                            this.readContract = null;
                            if (this.readWeb3) this._updateGlobalWeb3Instance(this.readWeb3); // Still update global if web3 obj exists
                            
                            // Trigger network changed event
                            if (this.onNetworkChanged) {
                                this.onNetworkChanged({
                                    connected: true,
                                    supportedNetwork: true,
                                    chainId: CONFIG.CHAIN_ID,
                                    supportedChains: Object.keys(CONFIG.CONTRACTS),
                                    networkName: this.getNetworkName(CONFIG.CHAIN_ID)
                                });
                            }
                            
                            return true;
                        }
                        continue;
                    }
                    
                    // Initialize contract
                    this.readContract = new this.readWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                    console.log("Read-only contract instance created successfully");
                    
                    // Test contract connection - try/catch to handle non-existent contract
                    try {
                        const lotteryId = await this.readContract.methods.lotteryId().call();
                        console.log("Contract connection test successful. Current lottery ID:", lotteryId);
                        
                        // Mark as connected
                        this.isReadConnected = true;
                        this._updateGlobalWeb3Instance(this.readWeb3); // Update global instance
                        
                        // Trigger network changed event
                        if (this.onNetworkChanged) {
                            this.onNetworkChanged({
                                connected: true,
                                supportedNetwork: true,
                                chainId: CONFIG.CHAIN_ID,
                                supportedChains: Object.keys(CONFIG.CONTRACTS),
                                networkName: this.getNetworkName(CONFIG.CHAIN_ID)
                            });
                        }
                        
                        // Exit the loop - we have a working connection
                        return true;
                    } catch (contractError) {
                        console.error("Error connecting to contract:", contractError);
                        
                        // If Ganache, still mark as connected but with warning
                        if (CONFIG.CHAIN_ID === "0x539") {
                            console.log("Local development detected. Contract may not be deployed yet.");
                            this.isReadConnected = true;
                            this.readContract = null;
                            if (this.readWeb3) this._updateGlobalWeb3Instance(this.readWeb3); // Still update global if web3 obj exists
                            
                            // Trigger network changed event
                            if (this.onNetworkChanged) {
                                this.onNetworkChanged({
                                    connected: true,
                                    supportedNetwork: true,
                                    chainId: CONFIG.CHAIN_ID,
                                    supportedChains: Object.keys(CONFIG.CONTRACTS),
                                    networkName: this.getNetworkName(CONFIG.CHAIN_ID)
                                });
                            }
                            
                            return true;
                        }
                        
                        continue;
                    }
                    
                } catch (error) {
                    console.error(`Error with RPC endpoint ${endpoint}:`, error);
                    continue; // Try next endpoint
                }
            }
            
            // If we get here, all endpoints failed
            console.error("All RPC endpoints failed");
            this.isReadConnected = false;
            
            // Trigger network changed event for failure
            if (this.onNetworkChanged) {
                this.onNetworkChanged({
                    connected: false,
                    supportedNetwork: false,
                    chainId: CONFIG.CHAIN_ID,
                    supportedChains: Object.keys(CONFIG.CONTRACTS),
                    networkName: this.getNetworkName(CONFIG.CHAIN_ID)
                });
            }
            
            return false;
            
        } catch (error) {
            console.error("Error initializing read-only Web3:", error);
            this.isReadConnected = false;
            
            // Trigger network changed event for failure
            if (this.onNetworkChanged) {
                this.onNetworkChanged({
                    connected: false,
                    supportedNetwork: false,
                    chainId: CONFIG.CHAIN_ID,
                    supportedChains: Object.keys(CONFIG.CONTRACTS),
                    networkName: this.getNetworkName(CONFIG.CHAIN_ID)
                });
            }
            
            return false;
        }
    }
    
    /**
     * Connect to MetaMask wallet for transaction capabilities
     * This is an interactive function that requires user approval
     */
    async connectWallet() {
        try {
            // Check if we're on Ganache Local network
            const isGanacheNetwork = CONFIG.CHAIN_ID === "0x539";
            
            if (isGanacheNetwork) {
                console.log("Ganache network detected, using local connection without MetaMask");
                
                // For Ganache, we can connect directly without MetaMask
                // The UI will show a dropdown of available accounts
                // But first load the accounts to populate the dropdown
                const ganacheAccounts = await this.getGanacheAccounts();
                if (ganacheAccounts.length === 0) {
                    console.error("No Ganache accounts found. Is Ganache running on the correct port?");
                    return false;
                }
                
                // Trigger event to show the Ganache account selector
                // We won't connect to any account yet - the user will select one from the UI
                if (this.onGanacheAccountsLoaded) {
                    this.onGanacheAccountsLoaded(ganacheAccounts);
                }
                
                return true;
            }
            
            // For non-Ganache networks, use MetaMask
            if (!window.ethereum) {
                console.error("MetaMask not detected. Please install MetaMask to interact with the contract.");
                return false;
            }
            
            console.log("Requesting connection to MetaMask...");
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.userAccount = accounts[0];
            
            // Get current chain ID
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            console.log(`Connected to network with chainId: ${chainId}`);
            
            // Special handling for Ganache (local network)
            // Handle both Ganache CLI (0x539/1337) and Ganache UI (0x1691/5777)
            if (chainId === "0x539" || chainId === "1337" || chainId === 1337 ||
                chainId === "0x1691" || chainId === "5777" || chainId === 5777) {
                console.log("Ganache local network detected during MetaMask auto-connect with chainId:", chainId);
                
                // Only if user manually connected to Ganache via MetaMask, we'll update UI
                // Don't switch networks here
                
                // Initialize transaction-capable web3 even without a contract
                this.writeWeb3 = new Web3(window.ethereum);
                this._updateGlobalWeb3Instance(this.writeWeb3); // Update global instance
                
                // Only initialize contract if we have an address
                if (CONFIG.CONTRACT_ADDRESS && CONFIG.CONTRACT_ADDRESS !== "") {
                    this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                    console.log(`Contract initialized at address: ${CONFIG.CONTRACT_ADDRESS}`);
                } else {
                    console.warn("No contract deployed on local network yet. Please deploy the contract first.");
                    this.writeContract = null;
                }
                
                // Set up MetaMask event listeners
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
                        chainId: "0x539", // Always use the standard chain ID format
                        networkName: "Ganache Local"
                    });
                }
                
                console.log(`Connected to Ganache wallet via MetaMask: ${this.userAccount}`);
                return true;
            }
            
            // For non-Ganache networks, check if the network is supported
            const isCorrectNetwork = this.isNetworkSupported(chainId);
            
            if (!isCorrectNetwork) {
                console.warn(`Not on a supported network. Found ${chainId}, supported networks: ${Object.keys(CONFIG.CONTRACTS).join(', ')}`);
                
                // Set event handler for network switch
                if (this.onNetworkChanged) {
                    this.onNetworkChanged({
                        connected: true,
                        supportedNetwork: false,
                        chainId: chainId,
                        supportedChains: Object.keys(CONFIG.CONTRACTS),
                        networkName: this.getNetworkName(chainId)
                    });
                }
                
                return false;
            }
            
            // Initialize transaction-capable web3
            this.writeWeb3 = new Web3(window.ethereum);
            this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
            this._updateGlobalWeb3Instance(this.writeWeb3); // Update global instance
            
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
            
            // Check if this is a supported network
            const isSupported = this.isNetworkSupported(chainId);
            
            // Update config for the detected network if supported
            if (isSupported) {
                CONFIG.setNetwork(chainId);
                
                // Reinitialize contract with new chain config
                this.writeWeb3 = new Web3(window.ethereum);
                this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                
                // Reinitialize read-only connection for the new network
                this.initReadOnlyWeb3();
            }
            
            if (this.onNetworkChanged) {
                this.onNetworkChanged({
                    connected: true,
                    supportedNetwork: isSupported,
                    chainId: chainId,
                    supportedChains: Object.keys(CONFIG.CONTRACTS),
                    networkName: this.getNetworkName(chainId)
                });
            }
        });
    }
    
    /**
     * Check if a network is supported by our configuration
     */
    isNetworkSupported(chainId) {
        // Special handling for Ganache - it can have different chain IDs
        // Handle both Ganache CLI (0x539/1337) and Ganache UI (0x1691/5777)
        if (chainId === "0x539" || chainId === "1337" || chainId === 1337 ||
            chainId === "0x1691" || chainId === "5777" || chainId === 5777) {
            console.log("Ganache network detected in isNetworkSupported. Original chainId:", chainId);
            // Always treat Ganache as supported
            return true;
        }
        
        // For non-Ganache, check if we have a contract address set
        return CONFIG.CONTRACTS.hasOwnProperty(chainId) && CONFIG.CONTRACTS[chainId] !== "";
    }
    
    /**
     * Switch the connected wallet to the specified network
     * @param {string} targetChainId - The chain ID to switch to in hex format (e.g., "0xaa36a7")
     */
    async switchNetwork(targetChainId = CONFIG.CHAIN_ID) {
        try {
            console.log(`Attempting to switch network to: ${targetChainId}`);
            
            // Ensure a valid Web3 class is available
            if (typeof Web3 === 'undefined' && typeof window.Web3 === 'undefined') {
                console.error("Web3 is not loaded. Cannot switch network. Web3 class is not available. Make sure web3.min.js is loaded.");
                return;
            }
            const Web3Constructor = window.Web3 || Web3; // Use window.Web3 (class) or global Web3

            // If trying to switch to the current network, just refresh connections
            if (this.isWriteConnected && window.ethereum && window.ethereum.chainId === targetChainId) {
                console.log(`Already on network ${targetChainId}. Re-initializing providers.`);
                // Re-initialize read provider for the current (target) network
                await this.initReadOnlyWeb3(); // This will use CONFIG.CHAIN_ID which should be targetChainId
                // Re-initialize write provider
                if (window.ethereum) {
                    this.writeWeb3 = new Web3Constructor(window.ethereum);
                    if (CONFIG.CONTRACT_ADDRESS && CONFIG.CONTRACT_ABI) {
                        this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                    } else {
                        this.writeContract = null;
                    }
                    this._updateGlobalWeb3Instance(this.writeWeb3);
                }
                console.log("Providers refreshed for current network.");
                return; // No actual switch needed via MetaMask
            }

            // If wallet is connected, attempt to switch via MetaMask
            if (this.isWriteConnected && window.ethereum) {
                try {
                    // Request network switch in MetaMask
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: targetChainId }],
                    });
                    console.log(`Successfully switched to network ${targetChainId} in MetaMask.`);
                    
                    // Update application config to match the switched network
                    CONFIG.setNetwork(targetChainId);
                    
                    // Re-initialize providers
                    await this.initReadOnlyWeb3();
                    
                    // Reinitialize write provider for the new network
                    this.writeWeb3 = new Web3Constructor(window.ethereum);
                    if (CONFIG.CONTRACT_ADDRESS && CONFIG.CONTRACT_ABI) {
                        this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                    } else {
                        this.writeContract = null;
                    }
                    this._updateGlobalWeb3Instance(this.writeWeb3);
                    
                    console.log(`Successfully switched to network ${targetChainId} and re-initialized providers.`);
                    return; // Exit after successful switch
                } catch (switchError) {
                    console.error(`Error switching network via MetaMask: ${switchError.message}`, switchError);
                    if (switchError.code === 4902) { // Chain not added to MetaMask
                        if (CONFIG.NETWORK_PARAMS && CONFIG.NETWORK_PARAMS[targetChainId]) {
                            console.log(`Chain ${targetChainId} not found in MetaMask. Attempting to add it.`);
                            try {
                                await window.ethereum.request({
                                    method: 'wallet_addEthereumChain',
                                    params: [CONFIG.NETWORK_PARAMS[targetChainId]],
                                });
                                console.log(`Successfully added and switched to network ${targetChainId}.`);
                                CONFIG.setNetwork(targetChainId);
                                await this.initReadOnlyWeb3(); // Re-initializes readWeb3 and its contract
                                
                                // Reinitialize write provider for the new network
                                this.writeWeb3 = new Web3Constructor(window.ethereum);
                                if (CONFIG.CONTRACT_ADDRESS && CONFIG.CONTRACT_ABI) {
                                    this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                                } else {
                                    this.writeContract = null;
                                }
                                this._updateGlobalWeb3Instance(this.writeWeb3);
                                return; // Exit after successful switch
                            } catch (addError) {
                                console.error(`Error adding network ${targetChainId}: ${addError.message}`, addError);
                                // Do not re-throw here, allow to fall through to read-only update if desired
                            }
                        } else {
                            console.error(`No network parameters found for chain ${targetChainId} to add to MetaMask.`);
                        }
                    }
                }
            } // End of if (this.isWriteConnected)

            // If wallet is not connected, or MetaMask switch failed:
            // Update read-only provider to the target network
            console.log("Updating read-only provider for the target network (or as fallback).");
            CONFIG.setNetwork(targetChainId); // Ensure config is set to the target network
            await this.initReadOnlyWeb3(); // This uses CONFIG.CHAIN_ID (now targetChainId) and calls _updateGlobalWeb3Instance
            
            return;
        } catch (error) {
            console.error(`Error in switchNetwork method for ${targetChainId}:`, error);
        }
    }

    // Helper to update the global Web3 instance for UI components
    _updateGlobalWeb3Instance(instance) {
        if (instance) {
            window.web3Instance = instance;
            console.log("Updated window.web3Instance");
        }
    }

    /**
     * Check if MetaMask is already connected and update state
     */
    async checkConnectedAccounts() {
        if (!window.ethereum) return false;
        
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                this.userAccount = accounts[0];
                
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                
                // Special handling for Ganache (local network)
                // Handle both Ganache CLI (0x539/1337) and Ganache UI (0x1691/5777)
                if (chainId === "0x539" || chainId === "1337" || chainId === 1337 ||
                    chainId === "0x1691" || chainId === "5777" || chainId === 5777) {
                    console.log("Ganache local network detected during auto-connect with chainId:", chainId);
                    
                    // Update config for Ganache
                    CONFIG.setNetwork("0x539");
                    
                    // Initialize transaction-capable web3 even without a contract
                    this.writeWeb3 = new Web3(window.ethereum);
                    this._updateGlobalWeb3Instance(this.writeWeb3); // Update global instance
                    
                    // Only initialize contract if we have an address
                    if (CONFIG.CONTRACT_ADDRESS && CONFIG.CONTRACT_ADDRESS !== "") {
                        this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                        console.log(`Contract initialized at address: ${CONFIG.CONTRACT_ADDRESS}`);
                    } else {
                        console.warn("No contract deployed on local network yet. Please deploy the contract first.");
                        this.writeContract = null;
                    }
                    
                    // Set up MetaMask event listeners
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
                            chainId: "0x539", // Always use the standard chain ID format
                            networkName: "Ganache Local"
                        });
                    }
                    
                    console.log(`Already connected to Ganache wallet: ${this.userAccount}`);
                    return true;
                }
                
                // For non-Ganache networks, check if the network is supported
                const isSupported = this.isNetworkSupported(chainId);
                
                if (isSupported) {
                    // Update config for the detected network
                    CONFIG.setNetwork(chainId);
                    
                    // Initialize transaction web3
                    this.writeWeb3 = new Web3(window.ethereum);
                    this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                    this._updateGlobalWeb3Instance(this.writeWeb3); // Update global instance
                    this.isWriteConnected = true;
                    
                    // Set up MetaMask event listeners
                    this.setupMetaMaskListeners();
                    
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
                    
                    console.log(`Already connected to wallet: ${this.userAccount}`);
                    return true;
                } else if (this.onNetworkChanged) {
                    this.onNetworkChanged({
                        connected: true,
                        supportedNetwork: false,
                        chainId: chainId,
                        supportedChains: Object.keys(CONFIG.CONTRACTS),
                        networkName: this.getNetworkName(chainId)
                    });
                }
            }
            
            return false;
        } catch (error) {
            console.error("Error checking connected accounts:", error);
            return false;
        }
    }

    /**
     * Check if the current network is supported
     */
    async isCorrectNetwork() {
        if (!window.ethereum) return false;
        
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            return this.isNetworkSupported(chainId);
        } catch (error) {
            console.error("Error checking network:", error);
            return false;
        }
    }

    /**
     * Get the network name from chain ID
     */
    getNetworkName(chainId) {
        return CONFIG.NETWORKS[chainId] || `Unknown Network (${chainId})`;
    }

    /**
     * Get the current Web3 instance
     * Returns the read-only instance if not connected to a wallet
     */
    getWeb3() {
        return this.isWriteConnected ? this.writeWeb3 : this.readWeb3;
    }

    /**
     * Get the current contract instance
     * Returns the read-only contract if not connected to a wallet
     */
    getContract() {
        return this.isWriteConnected ? this.writeContract : this.readContract;
    }

    /**
     * Check if connected to any web3 provider
     */
    isConnected() {
        return this.isReadConnected || this.isWriteConnected;
    }

    /**
     * Check if connected with transaction capabilities
     */
    hasWriteAccess() {
        return this.isWriteConnected;
    }

    /**
     * Get the connected wallet address
     */
    getAccount() {
        return this.userAccount;
    }

    /**
     * Get account balance in ETH
     */
    async getAccountBalance() {
        if (!this.userAccount || !this.writeWeb3) return null;
        
        try {
            const balanceWei = await this.writeWeb3.eth.getBalance(this.userAccount);
            return this.writeWeb3.utils.fromWei(balanceWei, 'ether');
        } catch (error) {
            console.error("Error getting account balance:", error);
            return null;
        }
    }

    /**
     * Special method to get all available Ganache accounts
     * Only used in local development
     */
    async getGanacheAccounts() {
        if (CONFIG.CHAIN_ID !== "0x539") {
            console.warn("getGanacheAccounts should only be called on Ganache network");
            return [];
        }

        try {
            // Create a web3 instance connected to Ganache
            const ganacheProvider = new Web3.providers.HttpProvider(CONFIG.CURRENT_RPC_LIST[0]); 
            const ganacheWeb3 = new Web3(ganacheProvider);
            this._updateGlobalWeb3Instance(ganacheWeb3);
            
            // Get all accounts
            const accounts = await ganacheWeb3.eth.getAccounts();
            
            // Get account balances
            const accountsWithBalance = await Promise.all(
                accounts.map(async (account) => {
                    const balance = await ganacheWeb3.eth.getBalance(account);
                    const balanceEth = ganacheWeb3.utils.fromWei(balance, 'ether');
                    return {
                        address: account,
                        balance: balanceEth,
                        shortAddress: `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
                    };
                })
            );
            
            console.log("Found Ganache accounts:", accountsWithBalance);
            return accountsWithBalance;
            
        } catch (error) {
            console.error("Error fetching Ganache accounts:", error);
            return [];
        }
    }

    /**
     * Connect to a specific Ganache account by address
     * Only used in local development
     */
    async connectToGanacheAccount(accountAddress) {
        if (CONFIG.CHAIN_ID !== "0x539") {
            console.warn("connectToGanacheAccount should only be called on Ganache network");
            return false;
        }

        try {
            console.log(`Connecting to Ganache account: ${accountAddress}`);
            
            // Create a web3 instance connected to Ganache
            const ganacheProvider = new Web3.providers.HttpProvider(CONFIG.CURRENT_RPC_LIST[0]);
            const ganacheWeb3 = new Web3(ganacheProvider);
            
            // Set up the provider and contract
            this.writeWeb3 = ganacheWeb3;
            this._updateGlobalWeb3Instance(ganacheWeb3);
            
            // Set the selected account
            this.userAccount = accountAddress;
            
            // Check if contract address is set
            console.log("Current contract address config:", {
                chainId: CONFIG.CHAIN_ID,
                contractAddress: CONFIG.CONTRACT_ADDRESS,
                ganacheContract: CONFIG.CONTRACTS["0x539"],
                rpcUrl: CONFIG.CURRENT_RPC_LIST[0]
            });
            
            // Set up the contract if address is available
            if (CONFIG.CONTRACT_ADDRESS && CONFIG.CONTRACT_ADDRESS !== "") {
                console.log(`Initializing contract at address: ${CONFIG.CONTRACT_ADDRESS}`);
                try {
                    this.writeContract = new this.writeWeb3.eth.Contract(CONFIG.CONTRACT_ABI, CONFIG.CONTRACT_ADDRESS);
                    
                    // Verify contract connection - add better error handling
                    try {
                        const lotteryId = await this.writeContract.methods.lotteryId().call();
                        console.log(`Contract connection verified. Current lottery ID: ${lotteryId}`);
                        
                        // Initialize read contract as well
                        this.readWeb3 = ganacheWeb3;
                        this.readContract = this.writeContract;
                    } catch (callError) {
                        console.error("Error calling contract method:", callError);
                        
                        // Try to check if contract exists at the address
                        const code = await ganacheWeb3.eth.getCode(CONFIG.CONTRACT_ADDRESS);
                        if (code === '0x' || code === '0x0') {
                            console.error(`No contract code found at address ${CONFIG.CONTRACT_ADDRESS}`);
                            throw new Error(`No contract code found at address ${CONFIG.CONTRACT_ADDRESS}. Please verify your deployment.`);
                        } else {
                            console.log(`Contract code exists at ${CONFIG.CONTRACT_ADDRESS}, but method call failed. Code length: ${code.length}`);
                            throw new Error(`Contract exists but calling methods failed. The contract ABI may not match the deployed contract.`);
                        }
                    }
                } catch (contractError) {
                    console.error("Error connecting to contract:", contractError);
                    this.writeContract = null;
                    this.readContract = null;
                    
                    this.isReadConnected = true; // Still mark as connected even without contract
                    this.isWriteConnected = true;
                    
                    throw new Error(`Error connecting to contract: ${contractError.message}`);
                }
            } else {
                console.warn("No contract address configured for Ganache network.");
                this.writeContract = null;
                this.readContract = null;
                this.isReadConnected = true; // Still mark as connected even without contract
                this.isWriteConnected = true;
                throw new Error(`No contract address configured for Ganache. Please update CONFIG.CONTRACTS["0x539"] with your deployed contract address.`);
            }
            
            // Mark as connected
            this.isReadConnected = true;
            this.isWriteConnected = true;
            
            // Get account balance for display
            const balance = await ganacheWeb3.eth.getBalance(accountAddress);
            const balanceEth = ganacheWeb3.utils.fromWei(balance, 'ether');
            
            console.log(`Connected to Ganache account: ${accountAddress} with balance: ${balanceEth} ETH`);
            return true;
            
        } catch (error) {
            console.error("Error connecting to Ganache account:", error);
            // Still mark as connected so we can see the error
            this.isReadConnected = true; 
            this.isWriteConnected = true;
            throw error;
        }
    }
} 