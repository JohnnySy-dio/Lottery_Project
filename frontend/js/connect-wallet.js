// Connect wallet function
async function connectWallet() {
    console.log("Attempting to connect wallet...");
    try {
        // First, check if we're in local development mode
        if (typeof USE_LOCAL_WEB3 !== 'undefined' && USE_LOCAL_WEB3) {
            console.log("Using local development mode");
            // For local development, refresh accounts
            const refreshedAccounts = await web3.eth.getAccounts();
            if (refreshedAccounts.length > 0) {
                // Check if we have multiple accounts
                if (refreshedAccounts.length > 1) {
                    console.log("Multiple local accounts detected:", refreshedAccounts);
                    
                    // Check if we already have a selected account (from the selector)
                    if (window.accounts && window.accounts.length === 1) {
                        console.log("Using pre-selected account:", window.accounts[0]);
                        // Use the pre-selected account
                        const selectedAccount = window.accounts[0];
                        
                        // Update UI
                        statusMessage.innerHTML = `
                            <p>Connected with local account: <strong class="address-text">${selectedAccount}</strong></p>
                            <p>You can now interact with the lottery contract.</p>
                        `;
                        statusMessage.className = 'alert alert-success';
                        
                        showNotification('Connected to selected local account', 'success');
                        return true;
                    }
                    
                    // If we show the account selector, we'll handle the connection there
                    updateConnectButtonForMultipleAccounts(refreshedAccounts);
                    
                    // Return true but don't proceed with auto-connecting
                    // The user will need to select an account from the dropdown
                    showNotification('Please select an account to connect', 'info');
                    return false;
                }
                
                // Important: Update the global accounts variable - use the window.accounts pattern 
                window.accounts = refreshedAccounts;
                console.log("Using local accounts:", window.accounts);
                  
                // Update UI
                statusMessage.innerHTML = `
                    <p>Connected with local account: <strong class="address-text">${window.accounts[0]}</strong></p>
                    <p>You can now interact with the lottery contract.</p>
                `;
                statusMessage.className = 'alert alert-success';
                
                // Initialize the app with the local account
                await initApp();
                
                showNotification('Connected to local Ethereum accounts', 'success');
                return true;
            } else {
                showError('No accounts available in local development mode. Check if Ganache is running.');
                return false;
            }
        } else if (window.ethereum) {
            const ethereum = window.ethereum;
            console.log("MetaMask detected, requesting accounts...");
            
            try {
                // Get current network info before proceeding
                const chainId = await ethereum.request({ method: 'eth_chainId' });
                console.log("Current chain ID:", chainId);
                
                // Request account access
                const requestedAccounts = await ethereum.request({ method: 'eth_requestAccounts' });
                
                if (requestedAccounts.length > 0) {
                    // Important: Update the global accounts variable
                    window.accounts = requestedAccounts;
                    console.log("Connected accounts:", window.accounts);
                    
                    // Get network details for better user feedback
                    const networkInfo = await getNetworkDetails();
                    
                    // Update UI
                    statusMessage.innerHTML = `
                        <p>Connected with MetaMask account: <strong class="address-text">${window.accounts[0]}</strong></p>
                        <p>Network: <strong>${networkInfo.name}</strong> (Chain ID: ${networkInfo.decimal})</p>
                        <p>You can now interact with the lottery contract.</p>
                    `;
                    statusMessage.className = 'alert alert-success';
                    
                    // Setup event listeners for account/network changes
                    ethereum.on('accountsChanged', handleAccountsChanged);
                    ethereum.on('chainChanged', () => {
                        console.log("Network changed, reloading page...");
                        window.location.reload();
                    });
                    
                    // Initialize the app with the new account
                    await initApp();
                    
                    // Check account balance
                    try {
                        const balance = await web3.eth.getBalance(window.accounts[0]);
                        const balanceEth = web3.utils.fromWei(balance, 'ether');
                        console.log(`Account balance: ${balanceEth} ETH`);
                        
                        // If balance is low, show a warning
                        if (parseFloat(balanceEth) < 0.01) {
                            showNotification(`Warning: Your account balance is low (${balanceEth} ETH). You may need more ETH to participate in the lottery.`, 'warning');
                        }
                    } catch (balanceError) {
                        console.error("Error checking balance:", balanceError);
                    }
                    
                    showNotification('MetaMask connected successfully!', 'success');
                    return true;
                } else {
                    showError('No accounts available in MetaMask or access was denied');
                    return false;
                }
            } catch (error) {
                console.error("Error requesting accounts from MetaMask:", error);
                
                // Specific error handling for common MetaMask errors
                if (error.code === 4001) {
                    showError('MetaMask connection rejected. Please approve the connection request to continue.');
                } else if (error.code === -32002) {
                    showError('MetaMask connection already pending. Please open MetaMask and confirm the connection request.');
                } else {
                    showError('Failed to connect to MetaMask: ' + getErrorMessage(error));
                }
                return false;
            }
        } else {
            showError('No Ethereum provider detected. Please install MetaMask or use a Web3-enabled browser.');
            return false;
        }
    } catch (error) {
        console.error("Error connecting wallet:", error);
        showError('Failed to connect wallet: ' + getErrorMessage(error));
        return false;
    }
}
