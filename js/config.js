/**
 * Decentralized Lottery - Configuration
 * Contains all constants and configuration settings for the application
 */

const CONFIG = {
    // Multi-network contract addresses
    CONTRACTS: {
        // Sepolia testnet
        "0xaa36a7": "0xa9684d2C0Da71d1F3107cf9d45CcD57e5a528C30",
        // Ganache local
        "0x539": "0x557bC432D9D2BcbE16CeB1202C9Bd8236410A424",  // Will be updated after local deployment
        // Add more networks as needed
    },
    
    // Default settings - will update based on selected network
    CONTRACT_ADDRESS: "0xa9684d2C0Da71d1F3107cf9d45CcD57e5a528C30",
    NETWORK_ID: 11155111,  // Sepolia testnet
    CHAIN_ID: "0xaa36a7",  // Sepolia chain ID in hex for MetaMask
    DISABLE_AUTO_RELOAD: true, // Completely disable any automatic page reloads
    
    // Network-specific RPC endpoints
    RPC_ENDPOINTS: {
        // Sepolia testnet
        "0xaa36a7": [
            "https://ethereum-sepolia.publicnode.com",
            "https://sepolia.gateway.tenderly.co",
            "https://rpc.sepolia.org"
        ],
        // Ganache local
        "0x539": [
            "http://127.0.0.1:7545"
        ]
    },
    
    // Default RPC list - will be updated based on selected network
    CURRENT_RPC_LIST: [
        "https://ethereum-sepolia.publicnode.com",
        "https://sepolia.gateway.tenderly.co",
        "https://rpc.sepolia.org"
    ],
    
    // Network info for display
    NETWORKS: {
        "0x1": "Ethereum Mainnet",
        "0xaa36a7": "Sepolia Testnet",
        "0x539": "Ganache Local",
        "0xa4b1": "Arbitrum",
        "0x89": "Polygon",
        "0xa": "Optimism",
        "0x38": "BNB Smart Chain"
    },
    
    // Network switching info (for MetaMask)
    NETWORK_PARAMS: {
        "0xaa36a7": {
            chainId: "0xaa36a7",
            chainName: "Sepolia Testnet",
            nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://ethereum-sepolia.publicnode.com"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"]
        },
        "0x539": {
            chainId: "0x539",
            chainName: "Ganache Local",
            nativeCurrency: { name: "Ganache Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["http://127.0.0.1:7545"]
        }
    },
    
    // Minimal contract ABI - only the functions we need
    CONTRACT_ABI: [
        // Read functions
        {"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"lotteryId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"entryFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"lotteryOpen","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"getPlayerCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"getPlayers","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"minPlayers","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"hasEntered","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
        {"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"lotteryHistory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"adminFees","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        
        // Write functions
        {"inputs":[],"name":"enterLottery","outputs":[],"stateMutability":"payable","type":"function"},
        {"inputs":[],"name":"closeLottery","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[],"name":"openLottery","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[],"name":"pickWinner","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[{"internalType":"uint256","name":"_fee","type":"uint256"}],"name":"setEntryFee","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[],"name":"withdrawAdminFees","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[{"internalType":"uint256","name":"_minPlayers","type":"uint256"}],"name":"setMinPlayers","outputs":[],"stateMutability":"nonpayable","type":"function"},
        
        // Events
        {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"lotteryId","type":"uint256"}],"name":"PlayerEntered","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"winner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"lotteryId","type":"uint256"}],"name":"WinnerSelected","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"lotteryId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"LotteryOpened","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"lotteryId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"LotteryClosed","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newFee","type":"uint256"}],"name":"EntryFeesUpdated","type":"event"},
        {"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"AdminFeesWithdrawn","type":"event"}
    ],
    
    // UI settings
    AUTO_REFRESH_INTERVAL: 5000,  // milliseconds
    UI_ELEMENTS: {
        // Contract info
        contractAddress: "contract-address",
        lotteryId: "lottery-id",
        entryFee: "entry-fee",
        lotteryStatus: "lottery-status",
        prizePool: "prize-pool",
        playerCount: "player-count",
        minPlayers: "min-players",
        
        // Wallet info
        walletStatus: "wallet-status",
        userAddress: "user-address",
        networkName: "network-name",
        walletBalance: "wallet-balance",
        
        // Containers
        playersList: "players-list",
        winnersList: "winners-list",
        userStatus: "user-status",
        adminSection: "admin-section",
        statusMessage: "status-message",
        actionButtons: "action-buttons",
        networkStatusArea: "network-status-area",
        networkSelector: "network-selector",
        
        // Buttons
        connectWalletBtn: "connect-wallet-btn",
        switchNetworkBtn: "switch-network-btn",
        enterBtn: "enter-btn",
        closeLotteryBtn: "close-lottery-btn",
        openLotteryBtn: "open-lottery-btn",
        pickWinnerBtn: "pick-winner-btn",
        setFeeBtn: "set-fee-btn",
        refreshBtn: "refresh-btn",
        
        // Inputs
        entryFeeInput: "entry-fee-input",
        
        // Debug
        debugLog: "debug-log"
    },
};

// Function to set network-specific configuration
CONFIG.setNetwork = function(chainId) {
    this.CHAIN_ID = chainId;
    this.CONTRACT_ADDRESS = this.CONTRACTS[chainId] || "";
    this.CURRENT_RPC_LIST = this.RPC_ENDPOINTS[chainId] || [];
    
    // Set network ID based on chain ID (in decimal)
    if (chainId === "0xaa36a7") {
        this.NETWORK_ID = 11155111; // Sepolia
    } else if (chainId === "0x539") {
        this.NETWORK_ID = 1337; // Ganache
    } else if (chainId === "0x1") {
        this.NETWORK_ID = 1; // Mainnet
    }
    
    console.log(`Network configuration updated for ${this.NETWORKS[chainId]} with contract address ${this.CONTRACT_ADDRESS}`);
    return true;
};

// Update contract address for Ganache (called after deployment)
CONFIG.updateLocalContractAddress = function(address) {
    if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
        console.error('Invalid contract address format:', address);
        return false;
    }
    
    console.log(`Updating local contract address from ${this.CONTRACTS["0x539"]} to ${address}`);
    this.CONTRACTS["0x539"] = address;
    
    // If we're currently on Ganache, also update the active contract address
    if (this.CHAIN_ID === "0x539") {
        this.CONTRACT_ADDRESS = address;
        console.log('Current network is Ganache, active contract address updated');
    }
    
    console.log(`Local contract address updated: ${address}`);
    return true;
};

// Manually set contract address - can be called from console for testing
CONFIG.setContractAddress = function(address) {
    if (!address || typeof address !== 'string' || !address.startsWith('0x')) {
        console.error('Invalid contract address format:', address);
        return false;
    }
    
    // Store the address in both the current active contract and the network-specific mapping
    this.CONTRACT_ADDRESS = address;
    this.CONTRACTS[this.CHAIN_ID] = address;
    
    console.log(`Contract address manually set to ${address} for network ${this.NETWORKS[this.CHAIN_ID]}`);
    
    // Return the address to confirm
    return address;
};

// Set default network
CONFIG.setNetwork(CONFIG.CHAIN_ID);

// Export for module usage
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = CONFIG;
} 