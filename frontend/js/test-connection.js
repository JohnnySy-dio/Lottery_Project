// This is a connection test script
// It will attempt to connect to a local Ganache instance
// and report any issues it encounters

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('test-button').addEventListener('click', testConnection);
    document.getElementById('ganache-url').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            testConnection();
        }
    });
});

async function testConnection() {
    const resultDiv = document.getElementById('result');
    const url = document.getElementById('ganache-url').value;
    
    resultDiv.innerHTML = '<p class="text-info">Testing connection to ' + url + '...</p>';
    
    try {
        // Attempt to create a Web3 instance
        const web3 = new Web3(new Web3.providers.HttpProvider(url));
        
        // Test basic connectivity - getting network ID
        const networkId = await web3.eth.net.getId();
        resultDiv.innerHTML += '<p class="text-success">✓ Connected to network ID: ' + networkId + '</p>';
        
        // Test getting accounts
        const accounts = await web3.eth.getAccounts();
        resultDiv.innerHTML += '<p class="text-success">✓ Found ' + accounts.length + ' accounts</p>';
        
        if (accounts.length > 0) {
            resultDiv.innerHTML += '<p class="text-success">✓ First account: ' + accounts[0] + '</p>';
        }
          // Test connecting to the contract
        const contractAddress = '0x691aB82f2098323384182971FfAf1e62626F687E';
        resultDiv.innerHTML += '<p class="text-info">Testing contract at ' + contractAddress + '...</p>';
        
        // Minimal ABI needed for testing
        const minABI = [
            "function owner() view returns (address)",
            "function getBalance() view returns (uint256)"
        ];
        
        try {
            const contract = new web3.eth.Contract(minABI, contractAddress);
            
            // Try to call a view function
            const owner = await contract.methods.owner().call();
            resultDiv.innerHTML += '<p class="text-success">✓ Contract exists! Owner: ' + owner + '</p>';
            
            const balance = await contract.methods.getBalance().call();
            const balanceEth = web3.utils.fromWei(balance, 'ether');
            resultDiv.innerHTML += '<p class="text-success">✓ Contract balance: ' + balanceEth + ' ETH</p>';
            
            resultDiv.innerHTML += '<div class="alert alert-success mt-3">All tests passed! Your connection is working correctly.</div>';
        } catch (contractError) {
            resultDiv.innerHTML += '<p class="text-danger">✗ Error connecting to contract: ' + contractError.message + '</p>';
            resultDiv.innerHTML += '<div class="alert alert-warning mt-3">Web3 connection works, but there\'s an issue with the contract. The contract might not be deployed, or the address might be incorrect.</div>';
        }
        
    } catch (error) {
        console.error("Connection test error:", error);
        resultDiv.innerHTML = '<div class="alert alert-danger">Connection failed: ' + error.message + '</div>';
        resultDiv.innerHTML += '<p>Troubleshooting suggestions:</p>';
        resultDiv.innerHTML += '<ul>';
        resultDiv.innerHTML += '<li>Make sure Ganache is running</li>';
        resultDiv.innerHTML += '<li>Check that Ganache is using the correct port (typically 7545)</li>';
        resultDiv.innerHTML += '<li>Verify there are no firewalls blocking the connection</li>';
        resultDiv.innerHTML += '<li>Try restarting Ganache and your browser</li>';
        resultDiv.innerHTML += '</ul>';
    }
}
