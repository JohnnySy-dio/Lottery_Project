// Simplified Web3 Initialization Test
document.addEventListener('DOMContentLoaded', async function() {
  const statusElement = document.getElementById('status');
  
  try {
    statusElement.innerHTML = 'Initializing Web3...';
    
    // Load the contract ABI from the build directory
    const response = await fetch('/build/contracts/DecentralizedLottery.json');
    const contractData = await response.json();
    const abi = contractData.abi;
    
    // Contract address from truffle deploy
    const CONTRACT_ADDRESS = '0x691aB82f2098323384182971FfAf1e62626F687E';
    
    // Connect to Ganache
    const web3 = new Web3('http://127.0.0.1:7545');
    
    // Get network and accounts
    const networkId = await web3.eth.net.getId();
    const accounts = await web3.eth.getAccounts();
    
    // Initialize contract
    const contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
    
    // Test contract methods
    const owner = await contract.methods.owner().call();
    const entryFee = await contract.methods.entryFee().call();
    const entryFeeEth = web3.utils.fromWei(entryFee, 'ether');
    const lotteryId = await contract.methods.lotteryId().call();
    const lotteryOpen = await contract.methods.lotteryOpen().call();
    
    // Display success
    statusElement.innerHTML = `
      <div class="alert alert-success">
        <h4>Web3 Initialized Successfully!</h4>
        <p><strong>Network ID:</strong> ${networkId}</p>
        <p><strong>Connected Account:</strong> ${accounts[0]}</p>
        <p><strong>Contract Address:</strong> ${CONTRACT_ADDRESS}</p>
        <p><strong>Contract Owner:</strong> ${owner}</p>
        <p><strong>Entry Fee:</strong> ${entryFeeEth} ETH</p>
        <p><strong>Lottery ID:</strong> ${lotteryId}</p>
        <p><strong>Lottery Open:</strong> ${lotteryOpen ? 'Yes' : 'No'}</p>
      </div>
      
      <div class="mt-4">
        <a href="index.html" class="btn btn-primary">Go to Main App</a>
      </div>
    `;
    
  } catch (error) {
    console.error('Error:', error);
    statusElement.innerHTML = `
      <div class="alert alert-danger">
        <h4>Error Initializing Web3</h4>
        <p>${error.message || error}</p>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
});
