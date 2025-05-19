/**
 * Decentralized Lottery - Configuration
 * Contains all constants and configuration settings for the application
 */

const CONFIG = {
    // Contract settings
    CONTRACT_ADDRESS: "0xFdC2f4574F069EC5801E64BFb6C672d0FE997C2C",
    NETWORK_ID: 11155111,  // Sepolia testnet
    CHAIN_ID: "0xaa36a7",  // Sepolia chain ID in hex for MetaMask
    
    // RPC endpoints with fallbacks
    RPC_ENDPOINTS: [
        "https://ethereum-sepolia.publicnode.com",
        "https://sepolia.gateway.tenderly.co",
        "https://rpc.sepolia.org"
    ],
    
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
        
        // Write functions
        {"inputs":[],"name":"enterLottery","outputs":[],"stateMutability":"payable","type":"function"},
        {"inputs":[],"name":"closeLottery","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[],"name":"openLottery","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[],"name":"pickWinner","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[{"internalType":"uint256","name":"_fee","type":"uint256"}],"name":"setEntryFee","outputs":[],"stateMutability":"nonpayable","type":"function"},
        {"inputs":[],"name":"withdrawAdminFees","outputs":[],"stateMutability":"nonpayable","type":"function"},
        
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
    
    // Network info for display
    NETWORKS: {
        "0x1": "Ethereum Mainnet",
        "0xaa36a7": "Sepolia Testnet",
        "0xa4b1": "Arbitrum",
        "0x89": "Polygon",
        "0xa": "Optimism",
        "0x38": "BNB Smart Chain"
    }
};

// Export for module usage
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = CONFIG;
} 