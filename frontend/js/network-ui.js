// Network UI Update Script
// Dynamically update network-specific information

document.addEventListener('DOMContentLoaded', function() {
    // Function to update UI based on current network
    function updateNetworkUI() {
        // Set contract address in footer - make sure to handle undefined
        const contractAddress = CONFIG.CONTRACT_ADDRESS || "Not deployed yet";
        document.getElementById('footerContractAddress').textContent = contractAddress;
        
        // Set appropriate explorer links based on network
        let explorerUrl;
        if (CONFIG.CHAIN_ID === "0xaa36a7") {
            explorerUrl = 'https://sepolia.etherscan.io/address/' + CONFIG.CONTRACT_ADDRESS;
            document.getElementById('etherscanLink').textContent = "View on Etherscan";
            document.getElementById('footerEtherscanLink').textContent = "Etherscan";
        } else if (CONFIG.CHAIN_ID === "0x539") {
            // For Ganache, we should check if the contract is deployed
            if (CONFIG.CONTRACT_ADDRESS && CONFIG.CONTRACT_ADDRESS !== "") {
                explorerUrl = '#'; // Ganache doesn't have an explorer
                document.getElementById('etherscanLink').textContent = "Local Network (Deployed)";
            } else {
                explorerUrl = '#';
                document.getElementById('etherscanLink').textContent = "Local Network (Not Deployed)";
            }
            document.getElementById('footerEtherscanLink').textContent = "Local Network";
        } else {
            explorerUrl = '#';
        }
        
        document.getElementById('etherscanLink').href = explorerUrl;
        document.getElementById('footerEtherscanLink').href = explorerUrl;
        
        console.log('Contract address set to:', CONFIG.CONTRACT_ADDRESS);
        console.log('Explorer URL set to:', explorerUrl);
    }
    
    // Initial update
    updateNetworkUI();
    
    // Listen for network changes
    document.querySelectorAll('.dropdown-item[data-network]').forEach(item => {
        item.addEventListener('click', function() {
            // Update happens after CONFIG is updated in the click handler
            setTimeout(updateNetworkUI, 100);
        });
    });
}); 