// Decentralized Lottery Application
const NETWORK_ID = "*"; // Any network ID for local development
const CONTRACT_ADDRESS = "0xa869582223058DB749e8F6eF13Ebaf5224eDb1D8" // Updated 2025-05-19 19:17:49 // Updated 2025-05-19 19:10:55 // Updated 2025-05-19 19:00:44 // Updated 2025-05-19 18:43:24 // Updated 2025-05-19 17:53:06 // Updated 2025-05-19 17:48:50 // Updated 2025-05-19 17:37:23; // Updated after redeployment

// Development settings - set to true when using local development environment
const USE_LOCAL_WEB3 = true;
const LOCAL_WEB3_PROVIDER = "http://127.0.0.1:7545"; // Ganache default
const MIN_ABI = [
    // Only include the functions and events we need for our frontend
    "function owner() view returns (address)",
    "function entryFee() view returns (uint256)",
    "function lotteryId() view returns (uint256)",
    "function lotteryOpen() view returns (bool)",
    "function minPlayers() view returns (uint256)",
    "function getBalance() view returns (uint256)",
    "function getPlayerCount() view returns (uint256)",
    "function getPlayers() view returns (address[])",
    "function lotteryHistory(uint256) view returns (address)",
    "function enterLottery() payable",
    "function closeLottery()",
    "function openLottery()",
    "function pickWinner()",
    "function setEntryFee(uint256)",
    "event PlayerEntered(address indexed player, uint256 amount, uint256 lotteryId)",
    "event WinnerSelected(address indexed winner, uint256 amount, uint256 lotteryId)",
    "event LotteryOpened(uint256 lotteryId, uint256 timestamp)",
    "event LotteryClosed(uint256 lotteryId, uint256 timestamp)",
    "event EntryFeesUpdated(uint256 newFee)"
];

// Auto-refresh interval in milliseconds (5 seconds)
const AUTO_REFRESH_INTERVAL = 5000;
let refreshIntervalId = null;

// App State
let web3;
let lotteryContract;
let accounts = [];
let isOwner = false;
let currentLotteryId = 0;
let lotteryEvents = [];

// DOM Elements
const statusMessage = document.getElementById('status-message');
const contractAddress = document.getElementById('contract-address');
const ownerAddress = document.getElementById('owner-address');
const ownerBalance = document.getElementById('owner-balance');
const lotteryIdElement = document.getElementById('lottery-id');
const entryFeeElement = document.getElementById('entry-fee');
const minPlayersElement = document.getElementById('min-players');
const lotteryStatusElement = document.getElementById('lottery-status');
const prizePoolElement = document.getElementById('prize-pool');
const playerCountElement = document.getElementById('player-count');
const enterBtn = document.getElementById('enter-btn');
const connectWalletBtn = document.getElementById('connect-wallet-btn');
const switchNetworkBtn = document.getElementById('switch-network-btn');
const playersList = document.getElementById('players-list');
const winnersList = document.getElementById('winners-list');
const userStatus = document.getElementById('user-status');
const adminSection = document.getElementById('admin-section');
const closeLotteryBtn = document.getElementById('close-lottery-btn');
const openLotteryBtn = document.getElementById('open-lottery-btn');
const pickWinnerBtn = document.getElementById('pick-winner-btn');
const entryFeeInput = document.getElementById('entry-fee-input');
const setFeeBtn = document.getElementById('set-fee-btn');

// Initialize the app when the page loads
window.addEventListener('load', async () => {
    await initWeb3();
    await initApp();
    setupEventListeners();
    
    // Check if we need to show the network switch button
    if (isMetaMaskInstalled()) {
        await checkAndDisplayNetworkButton();
          // Update network status display
        updateNetworkStatusDisplay();
    }
    
    // Start automatic refresh
    startAutoRefresh();
});

// Helper function to check if contract exists at the given address
async function checkContractExists(address) {
    try {
        console.log(`Checking if contract exists at address: ${address}`);
        const code = await web3.eth.getCode(address);
        
        // If there's no code at the address, it's not a contract
        if (code === '0x' || code === '0x0') {
            console.error(`No contract found at address ${address}`);
            return false;
        }
        
        console.log(`Contract code found at address ${address} (length: ${code.length})`);
        return true;
    } catch (error) {
        console.error(`Error checking contract at ${address}:`, error);
        return false;
    }
}

// Initialize Web3
async function initWeb3() {
    try {
        // Check if we're using local development
        if (USE_LOCAL_WEB3) {
            console.log("Using local Web3 provider:", LOCAL_WEB3_PROVIDER);
            web3 = new Web3(new Web3.providers.HttpProvider(LOCAL_WEB3_PROVIDER));
            statusMessage.innerHTML = `<p>Using local development environment at ${LOCAL_WEB3_PROVIDER}</p>`;
            statusMessage.className = 'alert alert-info';
            
            // In local development, try to get accounts immediately
            try {
                accounts = await web3.eth.getAccounts();
                console.log("Available accounts:", accounts);
                if (accounts.length === 0) {
                    console.warn("No accounts available in Ganache. Either Ganache is not running or accounts are locked.");
                    statusMessage.innerHTML += `<p>Please connect your wallet to interact with the lottery.</p>`;
                } else {
                    // Show connect wallet anyway in local mode
                    statusMessage.innerHTML += `<p>Local accounts found. Click "Connect Wallet" to use them.</p>`;
                    
                    // If we have multiple accounts, update the connect wallet button to show a dropdown
                    if (accounts.length > 1) {
                        updateConnectButtonForMultipleAccounts(accounts);
                    }
                }
            } catch (accountError) {
                console.error("Error getting accounts:", accountError);
            }        }
        // Modern browsers with MetaMask
        else if (window.ethereum) {
            console.log("MetaMask detected, initializing Web3 with ethereum provider");
            web3 = new Web3(window.ethereum);
            try {
                // Just check if MetaMask is accessible, don't request accounts yet
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                console.log("Connected to chain ID:", chainId);
                
                // Setup event listeners for account/network changes
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', () => {
                    console.log("Network changed, reloading page...");
                    window.location.reload();
                });
                
                statusMessage.innerHTML = `
                    <p>MetaMask detected! Click "Connect Wallet" to continue.</p>
                `;
                statusMessage.className = 'alert alert-info';
                
                // Try to get accounts, but don't force a connection prompt
                try {
                    const accts = await window.ethereum.request({ 
                        method: 'eth_accounts'  // This doesn't trigger the MetaMask popup
                    });
                    if (accts.length > 0) {
                        accounts = accts;
                        console.log("Already connected accounts:", accounts);
                        
                        // If already connected, update UI
                        statusMessage.innerHTML = `
                            <p>Already connected to MetaMask with account: <strong class="address-text">${accounts[0]}</strong></p>
                        `;
                        window.accounts = accounts;
                    }
                } catch (error) {
                    console.log("Could not get ethereum accounts without prompting:", error);
                }
            } catch (error) {
                console.error("Error initializing with MetaMask:", error);
                showError('Please connect MetaMask to use this application');
            }
        }
        // Legacy dapp browsers
        else if (window.web3) {
            web3 = new Web3(window.web3.currentProvider);
        }
        // No web3 provider
        else {
            showError('Non-Ethereum browser detected. You should consider trying MetaMask!');
            return;
        }
        
        // Get connected accounts
        accounts = await web3.eth.getAccounts();
          // Only check network if not using local development
        if (!USE_LOCAL_WEB3 && NETWORK_ID !== "*") {
            const networkId = await web3.eth.net.getId();
            if (networkId !== NETWORK_ID) {
                // If MetaMask is installed, offer to switch networks
                if (isMetaMaskInstalled()) {
                    const switchConfirmed = confirm(`You are on the wrong network. Would you like to switch to the required network? (ID: ${NETWORK_ID})`);
                    if (switchConfirmed) {
                        const switched = await requestNetworkSwitch(NETWORK_ID);
                        if (!switched) {
                            showError(`Please connect to the correct network. Expected network ID: ${NETWORK_ID}`);
                            return;
                        }
                    } else {
                        showError(`Please connect to the correct network. Expected network ID: ${NETWORK_ID}`);
                        return;
                    }
                } else {
                    showError(`Please connect to the correct network. Expected network ID: ${NETWORK_ID}`);
                    return;
                }
            }
        }
          // Initialize contract using the ABI from build
        try {
            console.log("Attempting to load contract ABI from /build/contracts/DecentralizedLottery.json...");
            // Load the contract ABI from the build directory
            const response = await fetch('/build/contracts/DecentralizedLottery.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch contract ABI: ${response.status} ${response.statusText}`);
            }
            
            const contractData = await response.json();
            console.log("Contract data loaded successfully");
            const abi = contractData.abi;
            
            if (CONTRACT_ADDRESS) {
                console.log(`Initializing contract at address: ${CONTRACT_ADDRESS}`);
                
                // First check if contract exists at the address
                const contractExists = await checkContractExists(CONTRACT_ADDRESS);
                if (!contractExists) {
                    showError(`No contract found at address ${CONTRACT_ADDRESS}. Please verify the contract is deployed to this network.`);
                    return;
                }
                
                lotteryContract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
                contractAddress.textContent = CONTRACT_ADDRESS;
                console.log("Contract initialized successfully with ABI from build");
                
                // Test a contract call to verify connection
                try {
                    const lotteryId = await lotteryContract.methods.lotteryId().call();
                    console.log("Contract connection test successful. Current lottery ID:", lotteryId);
                } catch (callError) {
                    console.error("Failed to call contract method:", callError);
                    showError(`Contract connection test failed. Please check if the contract is deployed at ${CONTRACT_ADDRESS}`);
                }
            } else {
                showError('Contract address not set. Please deploy the contract first and update the CONTRACT_ADDRESS variable.');
                return;
            }
        } catch (error) {            
            console.error("Error loading ABI from build:", error);
            console.log("Falling back to minimal ABI");
            
            // Fallback to minimal ABI if loading from build fails
            if (CONTRACT_ADDRESS) {
                console.log(`Initializing contract with minimal ABI at address: ${CONTRACT_ADDRESS}`);
                
                // First check if contract exists at the address
                const contractExists = await checkContractExists(CONTRACT_ADDRESS);
                if (!contractExists) {
                    showError(`No contract found at address ${CONTRACT_ADDRESS}. Please verify the contract is deployed to this network.`);
                    return;
                }
                
                lotteryContract = new web3.eth.Contract(MIN_ABI, CONTRACT_ADDRESS);
                contractAddress.textContent = CONTRACT_ADDRESS;
                
                // Test a contract call to verify connection
                try {
                    const lotteryId = await lotteryContract.methods.lotteryId().call();
                    console.log("Contract connection test successful with minimal ABI. Current lottery ID:", lotteryId);
                } catch (callError) {
                    console.error("Failed to call contract method with minimal ABI:", callError);
                    showError(`Contract connection test failed. Please check if the contract is deployed at ${CONTRACT_ADDRESS}`);
                }
            } else {
                showError('Contract address not set. Please deploy the contract first.');
                return;
            }
        }
        
    } catch (error) {
        console.error("Error initializing Web3:", error);
        showError('Failed to initialize Web3. Please check your connection and refresh.');
    }
}

// Initialize the application
async function initApp() {
    if (!web3 || !lotteryContract) {
        console.error("Web3 or contract not initialized");
        return;
    }
    
    try {
        // Get accounts from window.accounts if available, or refresh from web3
        if (window.accounts && window.accounts.length > 0) {
            accounts = window.accounts;
            console.log("Using accounts from window.accounts:", accounts);
        } else {
            accounts = await web3.eth.getAccounts();
            console.log("Using accounts from web3.eth.getAccounts():", accounts);
        }
        
        if (!accounts || accounts.length === 0) {
            console.warn("No accounts available - some features will be disabled");
            // Show user status as not connected
            statusMessage.innerHTML = `
                <p>No wallet connected. Please click "Connect Wallet" to continue.</p>
            `;
            statusMessage.className = 'alert alert-warning';
            
            // Update UI to show wallet connection is needed
            updateUIForWalletConnection(false);
            
            // Still load contract info
            try {
                await updateContractInfo();
                await updatePlayersList();
                await loadPastEvents(); // Load past events first
                await updateWinnersList(); // Then update winners list
            } catch (error) {
                console.error("Error updating contract info:", error);
            }
            
            return;
        }
        
        // Check if current user is the contract owner
        const ownerAddress = await lotteryContract.methods.owner().call();
        isOwner = (accounts[0].toLowerCase() === ownerAddress.toLowerCase());
        
        // Show admin section if the user is the owner
        adminSection.style.display = isOwner ? 'block' : 'none';
        
        // Update UI with contract information
        await updateContractInfo();
        await updatePlayersList();
        await loadPastEvents(); // Load past events first
        await updateWinnersList(); // Then update winners list
        await checkUserParticipation();
        
        // Update admin panel UI if user is the owner
        if (isOwner) {
            await updateAdminPanelUI();
        }
        
        // Start event listener for contract events
        listenForEvents();
        
        // Update status message
        statusMessage.innerHTML = `
            <p>Connected with account: <strong class="address-text">${accounts[0]}</strong></p>
        `;
        
        // Add network information if using MetaMask
        if (!USE_LOCAL_WEB3 && isMetaMaskInstalled()) {
            const networkInfo = await getNetworkDetails();
            statusMessage.innerHTML += `
                <p>Network: <strong>${networkInfo.name}</strong> (Chain ID: ${networkInfo.decimal})</p>
            `;
            
            // Check if we need to show the network switch button
            await checkAndDisplayNetworkButton();
        } else if (USE_LOCAL_WEB3) {
            // For local development, show network status area
            const networkStatusArea = document.getElementById('network-status-area');
            if (networkStatusArea) {
                networkStatusArea.style.display = 'block';
                networkStatusArea.innerHTML = `
                    <div class="network-status info">
                        <span class="chain-icon">💻</span>
                        <span>Connected to: <strong>Local Development Network</strong> (Ganache)</span>
                    </div>
                `;
            }
        }
        
        statusMessage.innerHTML += `<p>You can now interact with the lottery contract.</p>`;
        statusMessage.className = 'alert alert-success';
        
    } catch (error) {
        console.error("Error initializing app:", error);
        showError('Failed to initialize application. Please check if the contract is deployed correctly.');
    }
}

// New function to load past events
async function loadPastEvents() {
    try {
        console.log("Loading past events...");
        const events = await lotteryContract.getPastEvents('allEvents', {
            fromBlock: 0,
            toBlock: 'latest'
        });
        
        // Sort events by block number to ensure correct order
        events.sort((a, b) => a.blockNumber - b.blockNumber);
        
        lotteryEvents = events;
        console.log("Past events loaded:", events.length, "events");
        return events;
    } catch (error) {
        console.error("Error loading past events:", error);
        return [];
    }
}

// Update contract info in the UI
async function updateContractInfo() {
    try {
        console.log("updateContractInfo: Starting contract info update...");
        // First, check if web3 and contract are initialized
        if (!web3 || !lotteryContract) {
            console.error("Web3 or contract not initialized");
            
            // Update UI elements to show meaningful error instead of "Loading..."
            const errorMsg = "Contract not available";
            contractAddress.textContent = errorMsg;
            ownerAddress.textContent = errorMsg;
            ownerBalance.textContent = errorMsg;
            lotteryIdElement.textContent = errorMsg;
            entryFeeElement.textContent = errorMsg;
            minPlayersElement.textContent = errorMsg;
            lotteryStatusElement.textContent = errorMsg;
            prizePoolElement.textContent = errorMsg;
            playerCountElement.textContent = errorMsg;
            
            // Display error message to user
            statusMessage.innerHTML = `
                <p>Error: Cannot connect to lottery contract. Please check if:</p>
                <ul>
                    <li>The contract address is correct (${CONTRACT_ADDRESS})</li>
                    <li>The contract is deployed on the network you're connected to</li>
                    <li>Your Ethereum node/provider is working properly</li>
                </ul>
            `;
            statusMessage.className = 'alert alert-danger';
            
            return false;
        }
        
        // Now attempt to fetch contract details
        try {
            console.log("updateContractInfo: Fetching lottery data from contract...");
            const owner = await lotteryContract.methods.owner().call();
            console.log("updateContractInfo: owner:", owner);
            
            // Get owner's balance only if the current user is the owner
            const currentAccount = await getCurrentAccount();
            const isOwner = currentAccount && currentAccount.toLowerCase() === owner.toLowerCase();
            
            if (isOwner) {
                const ownerBalanceWei = await web3.eth.getBalance(owner);
                const ownerBalanceEth = web3.utils.fromWei(ownerBalanceWei, 'ether');
                console.log("updateContractInfo: owner balance:", ownerBalanceEth, "ETH");
                ownerBalance.textContent = parseFloat(ownerBalanceEth).toFixed(4);
                ownerBalance.parentElement.style.display = 'block';
            } else {
                ownerBalance.parentElement.style.display = 'none';
            }
            
            const lotteryId = await lotteryContract.methods.lotteryId().call();
            console.log("updateContractInfo: lotteryId:", lotteryId);
            
            const entryFee = await lotteryContract.methods.entryFee().call();
            console.log("updateContractInfo: entryFee:", entryFee);
            
            const minPlayers = await lotteryContract.methods.minPlayers().call();
            console.log("updateContractInfo: minPlayers:", minPlayers);
            
            const isOpen = await lotteryContract.methods.lotteryOpen().call();
            console.log("updateContractInfo: isOpen:", isOpen);
            
            const balance = await lotteryContract.methods.getBalance().call();
            console.log("updateContractInfo: balance:", balance);
            
            const playerCount = await lotteryContract.methods.getPlayerCount().call();
            console.log("updateContractInfo: playerCount:", playerCount);
            
            // Convert wei to ETH
            const entryFeeEth = web3.utils.fromWei(entryFee, 'ether');
            const balanceEth = web3.utils.fromWei(balance, 'ether');
            
            // Update UI elements
            contractAddress.textContent = CONTRACT_ADDRESS || "Not set";
            ownerAddress.textContent = owner;
            lotteryIdElement.textContent = lotteryId;
            entryFeeElement.textContent = entryFeeEth;
            console.log("Updated entry fee display to:", entryFeeEth, "ETH");
            minPlayersElement.textContent = minPlayers;
            lotteryStatusElement.textContent = isOpen ? 'Open' : 'Closed';
            lotteryStatusElement.className = isOpen ? 'status-open' : 'status-closed';
            prizePoolElement.textContent = balanceEth;
            playerCountElement.textContent = playerCount;
            
            // Save current lottery ID for future reference
            currentLotteryId = lotteryId;
            
            console.log("Contract info updated successfully");
            return true;
        } catch (contractError) {
            console.error("Error fetching contract data:", contractError);
            
            // Show specific error in UI instead of leaving "Loading..."
            const errorMsg = "Failed to load";
            contractAddress.textContent = errorMsg;
            ownerAddress.textContent = errorMsg;
            ownerBalance.textContent = errorMsg;
            lotteryIdElement.textContent = errorMsg;
            entryFeeElement.textContent = errorMsg;
            minPlayersElement.textContent = errorMsg;
            lotteryStatusElement.textContent = errorMsg;
            prizePoolElement.textContent = errorMsg;
            playerCountElement.textContent = errorMsg;
            
            // Display detailed error message
            statusMessage.innerHTML = `
                <p>Error: Failed to fetch lottery data from contract. Details:</p>
                <p class="text-danger">${contractError.message || "Unknown error"}</p>
                <p>Please check if:</p>
                <ul>
                    <li>The contract address is correct (${CONTRACT_ADDRESS})</li>
                    <li>Your wallet is connected to the correct network</li>
                </ul>
            `;
            statusMessage.className = 'alert alert-danger';
            
            return false;
        }
    } catch (error) {
        console.error("Error in updateContractInfo:", error);
        
        // Show error in UI instead of leaving "Loading..."
        const errorMsg = "Error";
        contractAddress.textContent = errorMsg;
        ownerAddress.textContent = errorMsg;
        ownerBalance.textContent = errorMsg;
        lotteryIdElement.textContent = errorMsg;
        entryFeeElement.textContent = errorMsg;
        minPlayersElement.textContent = errorMsg;
        lotteryStatusElement.textContent = errorMsg;
        prizePoolElement.textContent = errorMsg;
        playerCountElement.textContent = errorMsg;
        
        // Display general error message
        statusMessage.innerHTML = `
            <p>Unexpected error while updating lottery information:</p>
            <p class="text-danger">${error.message || "Unknown error"}</p>
        `;
        statusMessage.className = 'alert alert-danger';
        
        return false;
    }
}

// Update the list of players in the current lottery
async function updatePlayersList() {
    try {
        // Check if web3 and contract are initialized
        if (!web3 || !lotteryContract) {
            console.error("Web3 or contract not initialized for player list");
            playersList.innerHTML = `
                <div class="text-center text-muted">
                    Cannot connect to contract
                </div>
            `;
            return;
        }
        
        const players = await lotteryContract.methods.getPlayers().call();
        
        // Get the current account for highlighting
        const currentAccount = await getCurrentAccount();
        
        // Clear the current list
        playersList.innerHTML = '';
        
        if (players.length === 0) {
            playersList.innerHTML = `
                <div class="text-center text-muted">
                    No players yet
                </div>
            `;
            return;
        }
        
        // Add each player to the list
        players.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'list-group-item player-item';
            item.innerHTML = `
                <span class="player-number">#${index + 1}</span>
                <span class="player-address address-text">${player}</span>
                ${currentAccount && player.toLowerCase() === currentAccount.toLowerCase() ? 
                    '<span class="badge bg-primary">You</span>' : ''}
            `;
            playersList.appendChild(item);
        });
        
    } catch (error) {
        console.error("Error updating players list:", error);
        playersList.innerHTML = `
            <div class="text-center text-danger">
                Error loading players
            </div>
        `;
    }
}

// Update the list of previous winners
async function updateWinnersList() {
    try {
        if (!web3 || !lotteryContract) {
            console.error("Web3 or contract not initialized for winners list");
            winnersList.innerHTML = `
                <div class="text-center text-muted">
                    Cannot connect to contract
                </div>
            `;
            return;
        }

        // Get current lottery ID
        const lotteryId = await lotteryContract.methods.lotteryId().call();
        console.log("Updating winners list for lottery ID:", lotteryId);
        
        // Clear the current list and show loading state
        winnersList.innerHTML = '<div class="text-center text-muted">Loading winners...</div>';
        
        // If there are no previous lotteries
        if (lotteryId <= 1) {
            winnersList.innerHTML = `
                <div class="text-center text-muted">
                    No previous winners
                </div>
            `;
            return;
        }

        // Get all WinnerSelected events
        const winnerEvents = await lotteryContract.getPastEvents('WinnerSelected', {
            fromBlock: 0,
            toBlock: 'latest'
        });

        // Sort events by lottery ID in descending order
        winnerEvents.sort((a, b) => Number(b.returnValues.lotteryId) - Number(a.returnValues.lotteryId));

        // Clear the list again before adding winners
        winnersList.innerHTML = '';

        // Process winners
        let winnersFound = false;
        const processedLotteryIds = new Set();

        for (const event of winnerEvents) {
            const lotteryId = Number(event.returnValues.lotteryId);
            
            // Skip if we've already processed this lottery
            if (processedLotteryIds.has(lotteryId)) continue;
            
            // Skip if this is the current lottery
            if (lotteryId >= currentLotteryId) continue;
            
            // Skip if we've processed 10 winners
            if (processedLotteryIds.size >= 10) break;

            const winnerAddress = event.returnValues.winner;
            const prizeAmount = web3.utils.fromWei(event.returnValues.amount, 'ether');
            
            // Get the current account for highlighting
            const currentAccount = await getCurrentAccount();
            
            const item = document.createElement('div');
            item.className = 'list-group-item winner-item';
            item.innerHTML = `
                <div>
                    <span class="trophy-icon">🏆</span>
                    <span>Lottery #${lotteryId}</span>
                </div>
                <span class="address-text">${winnerAddress}</span>
                <span class="eth-amount">${prizeAmount} ETH</span>
                ${currentAccount && winnerAddress.toLowerCase() === currentAccount.toLowerCase() ? 
                    '<span class="badge bg-success">You</span>' : ''}
            `;
            winnersList.appendChild(item);
            
            processedLotteryIds.add(lotteryId);
            winnersFound = true;
        }
        
        if (!winnersFound) {
            winnersList.innerHTML = `
                <div class="text-center text-muted">
                    No previous winners
                </div>
            `;
        }
        
    } catch (error) {
        console.error("Error updating winners list:", error);
        winnersList.innerHTML = `
            <div class="text-center text-danger">
                Error loading winners
            </div>
        `;
    }
}

// Check if current user is participating in the lottery
async function checkUserParticipation() {
    try {
        const players = await lotteryContract.methods.getPlayers().call();
        
        // Get the current account
        const currentAccount = await getCurrentAccount();
        if (!currentAccount) {
            console.warn("No account available to check participation");
            userStatus.innerHTML = 'Connect your wallet to check participation status.';
            userStatus.className = 'alert alert-warning';
            return;
        }
        
        const isParticipating = players.some(player => 
            player.toLowerCase() === currentAccount.toLowerCase()
        );
        
        if (isParticipating) {
            userStatus.innerHTML = 'You are participating in this lottery round!';
            userStatus.className = 'alert alert-success';
            enterBtn.disabled = true;
            enterBtn.textContent = 'Already Entered';
        } else {
            userStatus.innerHTML = 'You are not yet participating in this round.';
            userStatus.className = 'alert alert-light';
            enterBtn.disabled = false;
            enterBtn.textContent = 'Enter Lottery';
        }
        
    } catch (error) {
        console.error("Error checking user participation:", error);
    }
}

// Listen for contract events
function listenForEvents() {
    try {
        // Listen for player entered events
        lotteryContract.events.PlayerEntered({ fromBlock: 'latest' })
            .on('data', event => {
                showNotification(`New player entered the lottery: ${event.returnValues.player}`, 'info');
                updateContractInfo();
                updatePlayersList();
                checkUserParticipation();
                if (isOwner) updateAdminPanelUI();
                lotteryEvents.push(event);
            })
            .on('error', error => console.error("Player entered event error:", error));
        
        // Listen for winner selected events
        lotteryContract.events.WinnerSelected({ fromBlock: 'latest' })
            .on('data', event => {
                const winner = event.returnValues.winner;
                const amount = web3.utils.fromWei(event.returnValues.amount, 'ether');
                showNotification(`Winner selected! ${winner} won ${amount} ETH!`, 'success');
                updateContractInfo();
                updatePlayersList();
                updateWinnersList(); // Ensure winners list is updated
                checkUserParticipation();
                if (isOwner) updateAdminPanelUI();
                lotteryEvents.push(event);
            })
            .on('error', error => console.error("Winner selected event error:", error));
        
        // Listen for lottery opened events
        lotteryContract.events.LotteryOpened({ fromBlock: 'latest' })
            .on('data', event => {
                showNotification(`Lottery #${event.returnValues.lotteryId} opened!`, 'info');
                updateContractInfo();
                if (isOwner) updateAdminPanelUI();
                lotteryEvents.push(event);
            })
            .on('error', error => console.error("Lottery opened event error:", error));
        
        // Listen for lottery closed events
        lotteryContract.events.LotteryClosed({ fromBlock: 'latest' })
            .on('data', event => {
                showNotification(`Lottery #${event.returnValues.lotteryId} closed!`, 'warning');
                updateContractInfo();
                if (isOwner) updateAdminPanelUI();
                lotteryEvents.push(event);
            })
            .on('error', error => console.error("Lottery closed event error:", error));
        
        // Listen for entry fees updated events
        lotteryContract.events.EntryFeesUpdated({ fromBlock: 'latest' })
            .on('data', event => {
                const newFee = web3.utils.fromWei(event.returnValues.newFee, 'ether');
                showNotification(`Entry fee updated to ${newFee} ETH!`, 'info');
                console.log("EntryFeesUpdated event received, new fee:", newFee, "ETH");
                // Force immediate UI update
                entryFeeElement.textContent = newFee;
                // Then do a full update of all contract info
                updateContractInfo();
                if (isOwner) updateAdminPanelUI();
                lotteryEvents.push(event);
            })
            .on('error', error => console.error("Entry fees updated event error:", error));
        
        // Get past events (up to 100 most recent events)
        lotteryContract.getPastEvents('allEvents', {
            fromBlock: 0,
            toBlock: 'latest'
        }, (error, events) => {
            if (error) {
                console.error("Error getting past events:", error);
                return;
            }
            
            lotteryEvents = events;
            console.log("Past events loaded:", events.length, "events");
            // Update winners list after loading past events
            updateWinnersList();
        });
        
    } catch (error) {
        console.error("Error setting up event listeners:", error);
    }
}

// Set up UI event listeners
function setupEventListeners() {    
    // Connect wallet button
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', async () => {
            console.log("Connect wallet button clicked");
            
            // Check if we have multiple accounts and should show the selector instead
            if (USE_LOCAL_WEB3) {
                const localAccounts = await web3.eth.getAccounts();
                if (localAccounts.length > 1) {
                    // Show account selector instead of connecting directly
                    updateConnectButtonForMultipleAccounts(localAccounts);
                    return;
                }
            }
            
            // Add a visual indication that connection is in progress
            connectWalletBtn.textContent = 'Connecting...';
            connectWalletBtn.disabled = true;
            
            try {
                if (typeof connectWallet === 'function') {
                    const success = await connectWallet();
                    if (!success) {
                        console.warn("Failed to connect wallet using connectWallet function");
                        connectWalletBtn.textContent = 'Connect Wallet';
                        connectWalletBtn.disabled = false;
                    }
                } else {
                    console.error("connectWallet function not found");
                    // Fallback implementation
                    if (window.ethereum) {
                        try {
                            console.log("Using fallback MetaMask connection method");
                            const newAccounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                            handleAccountsChanged(newAccounts);
                            showNotification('MetaMask connected successfully!', 'success');
                        } catch (error) {
                            console.error("Error connecting to MetaMask:", error);
                            showError('Failed to connect wallet: ' + getErrorMessage(error));
                            connectWalletBtn.textContent = 'Connect Wallet';
                            connectWalletBtn.disabled = false;
                        }
                    } else if (USE_LOCAL_WEB3) {
                        const refreshedAccounts = await web3.eth.getAccounts();
                        if (refreshedAccounts.length > 0) {
                            handleAccountsChanged(refreshedAccounts);
                            showNotification('Connected to local accounts', 'success');
                        } else {
                            connectWalletBtn.textContent = 'Connect Wallet';
                            connectWalletBtn.disabled = false;
                        }
                    } else {
                        showError('No Ethereum provider detected. Please install MetaMask or use a Web3-enabled browser.');
                        connectWalletBtn.textContent = 'Connect Wallet';
                        connectWalletBtn.disabled = false;
                    }
                }
            } catch (error) {
                console.error("Error in connect wallet button handler:", error);
                showError('Failed to connect wallet: ' + getErrorMessage(error));
                connectWalletBtn.textContent = 'Connect Wallet';
                connectWalletBtn.disabled = false;
            }
        });
    } else {
        console.error("Connect wallet button not found in the DOM");
    }
      // Enter Lottery button
    enterBtn.addEventListener('click', async () => {
        console.log("Enter lottery button clicked");
        if (!web3 || !lotteryContract) {
            console.error("Web3 or contract not initialized");
            showError('Web3 or contract not initialized. Please refresh the page.');
            return;
        }
        
        // Check if wallet is connected
        if (!accounts || accounts.length === 0) {
            console.error("No accounts available");
            showError('No Ethereum accounts detected. Please connect your wallet first.');
            if (connectWalletBtn) {
                connectWalletBtn.classList.add('btn-pulse'); // Add animation to draw attention
                setTimeout(() => connectWalletBtn.classList.remove('btn-pulse'), 3000);
            }
            return;
        }
        
        try {
            console.log("Fetching entry fee and lottery status...");
            const entryFee = await lotteryContract.methods.entryFee().call();
            const isOpen = await lotteryContract.methods.lotteryOpen().call();
            
            console.log("Entry fee:", web3.utils.fromWei(entryFee, 'ether'), "ETH");
            console.log("Lottery open:", isOpen);
            console.log("Using account:", accounts[0]);
            
            if (!isOpen) {
                showError('The lottery is currently closed');
                return;
            }
            
            showLoadingState('Entering lottery...');        console.log("Sending transaction to enter lottery...");
        
        // Get the current account using our helper function
        const accountToUse = await getCurrentAccount();
        if (!accountToUse) {
            showError('No Ethereum account available. Please connect your wallet first.');
            hideLoadingState();
            return;
        }
        
        console.log("Using account for transaction:", accountToUse);
        console.log("Value:", entryFee);
          
        await lotteryContract.methods.enterLottery().send({
            from: accountToUse,
            value: entryFee,
            gas: 300000
        });
            
            console.log("Transaction successful!");
            hideLoadingState();
            showNotification('You have successfully entered the lottery!', 'success');
            
            // Update UI after successful entry
            updateContractInfo();
            updatePlayersList();
            checkUserParticipation();
            
        } catch (error) {
            console.error("Enter lottery error:", error);
            hideLoadingState();
            showError('Failed to enter lottery: ' + getErrorMessage(error));
        }
    });
    
    // Admin Controls - Close Lottery
    closeLotteryBtn.addEventListener('click', async () => {
        if (!isOwner || !web3 || !lotteryContract) return;
          try {
            showLoadingState('Closing lottery...');
            
            const accountToUse = await getCurrentAccount();
            if (!accountToUse) {
                showError('No Ethereum account available. Please connect your wallet first.');
                hideLoadingState();
                return;
            }
            
            await lotteryContract.methods.closeLottery().send({
                from: accountToUse,
                gas: 200000
            });
            
            hideLoadingState();
            showNotification('Lottery closed successfully', 'success');
            
            // Automatically refresh information after transaction
            await updateContractInfo();
            await updatePlayersList();
            await updateWinnersList();
            await checkUserParticipation();
            await updateAdminPanelUI();
            
        } catch (error) {
            hideLoadingState();
            showError('Failed to close lottery: ' + getErrorMessage(error));
        }
    });
    
    // Admin Controls - Open Lottery
    openLotteryBtn.addEventListener('click', async () => {
        if (!isOwner || !web3 || !lotteryContract) return;
          try {
            showLoadingState('Opening lottery...');
            
            const accountToUse = await getCurrentAccount();
            if (!accountToUse) {
                showError('No Ethereum account available. Please connect your wallet first.');
                hideLoadingState();
                return;
            }
            
            await lotteryContract.methods.openLottery().send({
                from: accountToUse,
                gas: 200000
            });
            
            hideLoadingState();
            showNotification('Lottery opened successfully', 'success');
            
            // Automatically refresh information after transaction
            await updateContractInfo();
            await updatePlayersList();
            await updateWinnersList();
            await checkUserParticipation();
            await updateAdminPanelUI();
            
        } catch (error) {
            hideLoadingState();
            showError('Failed to open lottery: ' + getErrorMessage(error));
        }
    });
    
    // Admin Controls - Pick Winner
    pickWinnerBtn.addEventListener('click', async () => {
        if (!isOwner || !web3 || !lotteryContract) return;
        
        try {
            const isOpen = await lotteryContract.methods.lotteryOpen().call();
            const playerCount = await lotteryContract.methods.getPlayerCount().call();
            const minPlayers = await lotteryContract.methods.minPlayers().call();
            
            if (isOpen) {
                showError('Please close the lottery before picking a winner');
                return;
            }
            
            if (playerCount < minPlayers) {
                showError(`Not enough players. Need at least ${minPlayers}, but only have ${playerCount}`);
                return;
            }            
            showLoadingState('Picking winner... This may take a while');
            
            const accountToUse = await getCurrentAccount();
            if (!accountToUse) {
                showError('No Ethereum account available. Please connect your wallet first.');
                hideLoadingState();
                return;
            }
            
            await lotteryContract.methods.pickWinner().send({
                from: accountToUse,
                gas: 500000
            });
            
            hideLoadingState();
            showNotification('Winner picked successfully!', 'success');
            
            // Automatically refresh information after transaction
            await updateContractInfo();
            await updatePlayersList();
            await updateWinnersList();
            await checkUserParticipation();
            await updateAdminPanelUI();
            
        } catch (error) {
            hideLoadingState();
            showError('Failed to pick winner: ' + getErrorMessage(error));
        }
    });
    
    // Admin Controls - Set Entry Fee
    setFeeBtn.addEventListener('click', async () => {
        if (!isOwner || !web3 || !lotteryContract) return;
        
        const newFeeEth = entryFeeInput.value.trim();
        if (!newFeeEth || isNaN(newFeeEth) || Number(newFeeEth) <= 0) {
            showError('Please enter a valid entry fee (greater than 0)');
            return;
        }
        
        try {
            showLoadingState('Setting new entry fee...');
          // Convert ETH to Wei
        const newFeeWei = web3.utils.toWei(newFeeEth, 'ether');
        console.log("Setting new fee:", newFeeEth, "ETH (", newFeeWei, "Wei)");
        
        // Get the current account using our helper function
        const accountToUse = await getCurrentAccount();
        if (!accountToUse) {
            showError('No Ethereum account available. Please connect your wallet first.');
            hideLoadingState();
            return;
        }
        
        console.log("Using account for transaction:", accountToUse);
        
        await lotteryContract.methods.setEntryFee(newFeeWei).send({
            from: accountToUse,
            gas: 200000
        });
            
            hideLoadingState();
            showNotification(`Entry fee updated to ${newFeeEth} ETH`, 'success');
            entryFeeInput.value = '';
            
            // Update the UI to reflect the new entry fee
            console.log("Entry fee successfully updated, refreshing UI...");
            // Immediately update the displayed entry fee
            entryFeeElement.textContent = newFeeEth;
            // Then do a full refresh of all contract information
            await updateContractInfo();
            await updatePlayersList();
            await updateWinnersList();
            await checkUserParticipation();
            await updateAdminPanelUI();
            
        } catch (error) {
            hideLoadingState();
            showError('Failed to set entry fee: ' + getErrorMessage(error));
        }
    });      // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            console.log("Manual refresh requested...");
            
            // Prevent multiple clicks
            if (refreshBtn.disabled) {
                console.log("Refresh already in progress, ignoring click");
                return;
            }
            
            // Show loading state
            refreshBtn.textContent = "Refreshing...";
            refreshBtn.disabled = true;
            
            // Stop auto-refresh temporarily
            stopAutoRefresh();
            
            try {
                // Clear existing events cache
                lotteryEvents = [];
                
                // Update contract information
                console.log("Updating contract info...");
                const contractInfoSuccess = await updateContractInfo();
                
                // Update players list
                console.log("Updating players list...");
                await updatePlayersList();
                
                // Update winners list
                console.log("Updating winners list...");
                await updateWinnersList();
                
                // Update user participation status if connected
                if (accounts && accounts.length > 0) {
                    console.log("Updating user participation...");
                    await checkUserParticipation();
                }
                
                // Update admin panel if owner
                if (isOwner) {
                    console.log("Updating admin panel...");
                    await updateAdminPanelUI();
                }
                
                // Show success message
                if (contractInfoSuccess) {
                    showNotification('Information refreshed successfully!', 'success');
                } else {
                    showNotification('Some information could not be refreshed. Please check your connection.', 'warning');
                }
            } catch (error) {
                console.error("Error during manual refresh:", error);
                showNotification('Error refreshing information: ' + error.message, 'error');
            } finally {
                // Reset button state
                refreshBtn.textContent = "Refresh Status";
                refreshBtn.disabled = false;
                
                // Restart auto-refresh
                startAutoRefresh();
            }
        });
    }
    
    // Refresh through any refresh button in the UI
    document.addEventListener('click', async (event) => {
        if (event.target.id === 'refresh-btn') {
            await updateContractInfo();
            await updatePlayersList();
            await updateWinnersList();
            await checkUserParticipation();
        }
    });
    
    // Switch network button
    if (switchNetworkBtn) {
        switchNetworkBtn.addEventListener('click', async () => {
            console.log("Switch network button clicked");
            
            if (!isMetaMaskInstalled()) {
                showError('MetaMask is not installed. Please install MetaMask to use this feature.');
                return;
            }
            
            try {
                // Get the target network ID (you can change this based on your needs)
                const targetNetworkId = USE_LOCAL_WEB3 ? '0x539' : '0x5'; // 0x539 for Ganache, 0x5 for Goerli testnet
                
                switchNetworkBtn.textContent = 'Switching...';
                switchNetworkBtn.disabled = true;
                
                const switched = await requestNetworkSwitch(targetNetworkId);
                
                if (switched) {
                    showNotification('Network switched successfully', 'success');
                    // Wait 1 second for MetaMask to update and then reload
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showError('Failed to switch network. Please try manually in MetaMask.');
                    switchNetworkBtn.textContent = 'Switch Network';
                    switchNetworkBtn.disabled = false;
                }
            } catch (error) {
                console.error("Error switching network:", error);
                showError('Error switching network: ' + getErrorMessage(error));
                switchNetworkBtn.textContent = 'Switch Network';
                switchNetworkBtn.disabled = false;
            }
        });
    }
}

// Check and display network switch button if needed
async function checkAndDisplayNetworkButton() {
    // Only show the button if MetaMask is installed
    if (!isMetaMaskInstalled() || !switchNetworkBtn) return;
    
    try {
        // Get current network
        const networkInfo = await getNetworkDetails();
        let expectedNetwork;
        
        // Determine expected network
        if (USE_LOCAL_WEB3) {
            expectedNetwork = '0x539'; // Ganache Local (hex)
        } else if (NETWORK_ID !== "*") {
            // Convert numeric network ID to hex
            expectedNetwork = '0x' + Number(NETWORK_ID).toString(16);
        } else {
            // Any network is acceptable
            switchNetworkBtn.style.display = 'none';
            return;
        }
        
        // Compare current with expected
        if (networkInfo.hex !== expectedNetwork) {
            // On wrong network, show button
            switchNetworkBtn.style.display = 'inline-block';
            switchNetworkBtn.classList.add('pulse');
            
            // Show a helpful message
            console.log(`Current network: ${networkInfo.name}, Expected: ${expectedNetwork}`);
            
            return false;
        } else {
            // On correct network, hide button
            switchNetworkBtn.style.display = 'none';
            switchNetworkBtn.classList.remove('pulse');
            return true;
        }
    } catch (error) {
        console.error("Error checking network:", error);
        // In case of error, show the button anyway
        switchNetworkBtn.style.display = 'inline-block';
        return false;
    }
}

// Add a pulsing effect to the connect wallet button
function pulseConnectWalletButton() {
    if (!connectWalletBtn) return;
    
    // Add animation class
    connectWalletBtn.classList.add('btn-pulse');
    
    // Remove animation after 3 seconds
    setTimeout(() => {
        connectWalletBtn.classList.remove('btn-pulse');
    }, 3000);
}

// Update the UI based on wallet connection status
function updateUIForWalletConnection(isConnected) {
    // If not connected, pulse the connect wallet button
    if (!isConnected) {
        pulseConnectWalletButton();
        
        // Disable buttons that require wallet connection
        if (enterBtn) enterBtn.disabled = true;
        
        // Stop auto-refresh if not connected
        stopAutoRefresh();
    } else {
        // Restart auto-refresh when connected
        startAutoRefresh();
        
        // If in local dev mode with multiple accounts, add switch account option
        if (USE_LOCAL_WEB3) {
            addSwitchAccountOption();
        }
    }
}

// Add switch account option for local development mode
async function addSwitchAccountOption() {
    try {
        const localAccounts = await web3.eth.getAccounts();
        if (localAccounts.length <= 1) return;
        
        // Check if we already have the switch account button
        let switchAccountBtn = document.getElementById('switch-account-btn');
        if (switchAccountBtn) return;
        
        // Create a switch account button and add it next to the network status
        const networkStatusArea = document.getElementById('network-status-area');
        if (!networkStatusArea) return;
        
        // Create a container for the switch account button
        const switchAccountContainer = document.createElement('div');
        switchAccountContainer.className = 'mt-2';
        
        // Create the button
        switchAccountBtn = document.createElement('button');
        switchAccountBtn.id = 'switch-account-btn';
        switchAccountBtn.className = 'btn btn-outline-info btn-sm';
        switchAccountBtn.textContent = 'Switch Local Account';
        
        // Add the button to the container
        switchAccountContainer.appendChild(switchAccountBtn);
        
        // Add the container to the network status area
        networkStatusArea.appendChild(switchAccountContainer);
        
        // Add click event to show account selector modal
        switchAccountBtn.addEventListener('click', () => {
            showAccountSelectorModal(localAccounts);
        });
    } catch (error) {
        console.error("Error adding switch account option:", error);
    }
}

// Show a modal with account selection options
function showAccountSelectorModal(availableAccounts) {
    try {
        // Create modal elements
        const modalId = 'account-selector-modal';
        
        // Check if modal already exists
        let modal = document.getElementById(modalId);
        if (modal) {
            // Modal exists, just show it
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();
            return;
        }
        
        // Create modal container
        modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = modalId;
        modal.tabIndex = -1;
        modal.setAttribute('aria-labelledby', 'account-selector-modal-label');
        modal.setAttribute('aria-hidden', 'true');
        
        // Create modal content
        const modalHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="account-selector-modal-label">Switch Local Account</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Select an account to use:</p>
                        <select id="modal-account-selector" class="form-select account-selector mb-3">
                            ${availableAccounts.map((account, index) => {
                                const shortAddress = account.slice(0, 6) + '...' + account.slice(-4);
                                const isSelected = account.toLowerCase() === (accounts[0] || '').toLowerCase();
                                return `<option value="${account}" ${isSelected ? 'selected' : ''}>
                                    Account ${index + 1}: ${shortAddress}
                                </option>`;
                            }).join('')}
                        </select>
                        <div class="current-account mb-3">
                            <small class="text-muted">Current account: 
                                <span class="current-account-address">
                                    ${accounts[0] || 'None'}
                                </span>
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="switch-account-confirm-btn">Switch Account</button>
                    </div>
                </div>
            </div>
        `;
        
        // Set the modal HTML
        modal.innerHTML = modalHTML;
        
        // Add the modal to the document body
        document.body.appendChild(modal);
        
        // Show the modal
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
        
        // Add event listener to the confirm button
        const confirmBtn = document.getElementById('switch-account-confirm-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', async () => {
                const selector = document.getElementById('modal-account-selector');
                if (!selector) return;
                
                const selectedAccount = selector.value;
                if (!selectedAccount) {
                    showError('Please select an account');
                    return;
                }
                
                // Hide the modal
                modalInstance.hide();
                
                // Set the selected account as the active account
                window.accounts = [selectedAccount];
                accounts = [selectedAccount];
                
                // Show loading state
                showLoadingState('Switching account...');
                
                // Reinitialize the app with the new account
                try {
                    await initApp();
                    hideLoadingState();
                    showNotification(`Switched to account: ${selectedAccount}`, 'success');
                } catch (error) {
                    hideLoadingState();
                    console.error("Error switching account:", error);
                    showError('Failed to switch account');
                }
            });
        }
    } catch (error) {
        console.error("Error showing account selector modal:", error);
    }
}

// Update network status display
async function updateNetworkStatusDisplay() {
    if (!isMetaMaskInstalled()) return;
    
    try {
        const networkInfo = await getNetworkDetails();
        const networkStatusArea = document.getElementById('network-status-area');
        
        if (!networkStatusArea) return;
        
        // Show network status area
        networkStatusArea.style.display = 'block';
        
        let networkClass = 'warning';
        let networkIcon = '🔄';
        
        // Determine network type
        if (networkInfo.name.includes('Mainnet')) {
            networkClass = 'success';
            networkIcon = '🌐';
        } else if (networkInfo.name.toLowerCase().includes('local') || 
                   networkInfo.name.includes('Ganache')) {
            networkClass = 'info';
            networkIcon = '💻';
        }
        
        // Try to get account for balance display
        let balanceDisplay = '';
        try {
            const currentAccount = await getCurrentAccount();
            if (currentAccount) {
                const balance = await web3.eth.getBalance(currentAccount);
                const balanceEth = parseFloat(web3.utils.fromWei(balance, 'ether')).toFixed(4);
                balanceDisplay = `<span class="balance-display">Balance: ${balanceEth} ETH</span>`;
            }
        } catch (e) {
            console.error("Error getting balance:", e);
        }
        
        networkStatusArea.innerHTML = `
            <div class="network-status ${networkClass}">
                <span class="chain-icon">${networkIcon}</span>
                <span>Connected to: <strong>${networkInfo.name}</strong> (Chain ID: ${networkInfo.decimal})</span>
                ${balanceDisplay}
            </div>
        `;
    } catch (error) {
        console.error("Error updating network status:", error);
    }
}

// Helper function to get the current account
async function getCurrentAccount() {
    // First check window.accounts (set by connect-wallet.js)
    if (window.accounts && window.accounts.length > 0) {
        console.log("Using account from window.accounts:", window.accounts[0]);
        return window.accounts[0];
    }
    
    // Then check the local accounts variable
    if (accounts && accounts.length > 0) {
        console.log("Using account from local accounts variable:", accounts[0]);
        return accounts[0];
    }
    
    // Finally, try to get fresh accounts from web3
    try {
        const freshAccounts = await web3.eth.getAccounts();
        if (freshAccounts && freshAccounts.length > 0) {
            console.log("Using fresh account from web3.eth.getAccounts:", freshAccounts[0]);
            return freshAccounts[0];
        }
    } catch (error) {
        console.error("Error getting fresh accounts:", error);
    }
    
    console.error("No account available");
    return null;
}

// Helper function to show errors in UI
function showError(message) {
    // Log to console
    console.error("ERROR:", message);
    
    // Display in UI status message
    if (statusMessage) {
        statusMessage.innerHTML = `<p class="mb-0"><strong>Error:</strong> ${message}</p>`;
        statusMessage.className = 'alert alert-danger';
    }
    
    // Also show modal with error
    showNotification(message, 'error');
    
    // Update UI elements if needed
    if (document.querySelectorAll('.loading-indicator').length > 0) {
        hideLoadingState();
    }
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
    console.log(`NOTIFICATION (${type}):`, message);
    
    // Check if the Bootstrap modal exists
    const notificationModal = document.getElementById('notification-modal');
    const notificationModalBody = document.getElementById('notification-modal-body');
    
    if (notificationModal && notificationModalBody) {
        // Set message
        notificationModalBody.innerHTML = `<div class="alert alert-${type === 'error' ? 'danger' : type}">${message}</div>`;
        
        // Get Bootstrap modal instance
        const modalInstance = new bootstrap.Modal(notificationModal);
        modalInstance.show();
    } else {
        // Fallback to alert if modal doesn't exist
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Helper function to show loading state
function showLoadingState(message = 'Loading...') {
    // Add a loading indicator to status message
    if (statusMessage) {
        statusMessage.innerHTML = `
            <div class="d-flex align-items-center loading-indicator">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span>${message}</span>
            </div>
        `;
        statusMessage.className = 'alert alert-info';
    }
}

// Helper function to hide loading state
function hideLoadingState() {
    // Remove loading indicator from status message
    const loadingIndicators = document.querySelectorAll('.loading-indicator');
    loadingIndicators.forEach(indicator => {
        indicator.parentNode.removeChild(indicator);
    });
    
    // Restore original status message style
    if (statusMessage && statusMessage.classList.contains('alert-info')) {
        statusMessage.className = 'alert alert-light';
    }
}

// Function to start automatic refresh of lottery information
function startAutoRefresh() {
    console.log(`Starting automatic refresh every ${AUTO_REFRESH_INTERVAL/1000} seconds`);
    
    // Clear any existing interval
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
    }
    
    // Create refresh indicator if it doesn't exist
    let refreshIndicator = document.getElementById('refresh-indicator');
    if (!refreshIndicator) {
        refreshIndicator = document.createElement('span');
        refreshIndicator.id = 'refresh-indicator';
        refreshIndicator.className = 'refresh-indicator ms-2';
        refreshIndicator.style.display = 'none';
        refreshIndicator.innerHTML = '🔄';
        
        // Add to DOM next to refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn && refreshBtn.parentNode) {
            refreshBtn.parentNode.insertBefore(refreshIndicator, refreshBtn.nextSibling);
        }
    }
    
    // Create admin refresh indicator if it doesn't exist
    let adminRefreshIndicator = document.getElementById('admin-refresh-indicator');
    if (!adminRefreshIndicator && isOwner) {
        adminRefreshIndicator = document.createElement('span');
        adminRefreshIndicator.id = 'admin-refresh-indicator';
        adminRefreshIndicator.className = 'refresh-indicator ms-2';
        adminRefreshIndicator.style.display = 'none';
        adminRefreshIndicator.innerHTML = '🔄';
        
        // Add to DOM in the admin section header
        const adminHeader = document.querySelector('#admin-section .card-header');
        if (adminHeader) {
            adminHeader.appendChild(adminRefreshIndicator);
        }
    }
    
    // Set up new interval
    refreshIntervalId = setInterval(async () => {
        // Only refresh if web3 and contract are initialized
        if (web3 && lotteryContract) {
            console.log("Auto-refreshing lottery information...");
            
            // Show refresh indicator
            if (refreshIndicator) {
                refreshIndicator.style.display = 'inline-block';
                refreshIndicator.classList.add('spin');
            }
            
            // Show admin refresh indicator if user is owner
            if (adminRefreshIndicator && isOwner) {
                adminRefreshIndicator.style.display = 'inline-block';
                adminRefreshIndicator.classList.add('spin');
            }
            
            try {
                // Load past events first
                await loadPastEvents();
                
                // Then update all information
                await updateContractInfo();
                await updatePlayersList();
                await updateWinnersList();
                if (accounts && accounts.length > 0) {
                    await checkUserParticipation();
                }
                
                // Update admin panel UI if user is owner
                if (isOwner) {
                    console.log("Updating admin panel...");
                    await updateAdminPanelUI();
                }
            } catch (error) {
                console.error("Error during auto-refresh:", error);
            }
            
            // Hide refresh indicator after short delay
            setTimeout(() => {
                if (refreshIndicator) {
                    refreshIndicator.style.display = 'none';
                    refreshIndicator.classList.remove('spin');
                }
                
                if (adminRefreshIndicator && isOwner) {
                    adminRefreshIndicator.style.display = 'none';
                    adminRefreshIndicator.classList.remove('spin');
                }
            }, 1000);
        }
    }, AUTO_REFRESH_INTERVAL);
}

// Function to stop automatic refresh
function stopAutoRefresh() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
        console.log("Automatic refresh stopped");
    }
}

// Clean up resources when page is unloaded
window.addEventListener('beforeunload', () => {
    // Stop auto-refresh interval when page is closed
    stopAutoRefresh();
});

// Update the admin panel UI with current contract state
async function updateAdminPanelUI() {
    try {
        if (!web3 || !lotteryContract || !isOwner) {
            return; // Only proceed if user is the owner and contract is available
        }
        
        console.log("Updating admin panel UI...");
        
        // Get current lottery state
        const isOpen = await lotteryContract.methods.lotteryOpen().call();
        const playerCount = await lotteryContract.methods.getPlayerCount().call();
        const minPlayers = await lotteryContract.methods.minPlayers().call();
        
        // Update close lottery button state
        if (closeLotteryBtn) {
            closeLotteryBtn.disabled = !isOpen;
            if (!isOpen) {
                closeLotteryBtn.title = "Lottery is already closed";
            } else {
                closeLotteryBtn.title = "Close the current lottery";
            }
        }
        
        // Update open lottery button state
        if (openLotteryBtn) {
            openLotteryBtn.disabled = isOpen;
            if (isOpen) {
                openLotteryBtn.title = "Lottery is already open";
            } else {
                openLotteryBtn.title = "Open a new lottery round";
            }
        }
        
        // Update pick winner button state
        if (pickWinnerBtn) {
            const canPickWinner = !isOpen && playerCount >= minPlayers;
            pickWinnerBtn.disabled = !canPickWinner;
            
            if (isOpen) {
                pickWinnerBtn.title = "Close the lottery first before picking a winner";
            } else if (playerCount < minPlayers) {
                pickWinnerBtn.title = `Not enough players (${playerCount}/${minPlayers})`;
            } else {
                pickWinnerBtn.title = "Pick a winner for the current lottery";
            }
        }
        
        // Optional: Add more admin UI updates here if needed
        
    } catch (error) {
        console.error("Error updating admin panel UI:", error);
    }
}

// Handle accounts changed event from MetaMask
function handleAccountsChanged(newAccounts) {
    console.log("Accounts changed:", newAccounts);
    
    // Update the global accounts variable
    accounts = newAccounts;
    
    // Check if we still have an account
    if (accounts.length === 0) {
        console.log("No accounts available after change");
        showError('No Ethereum accounts available. Please connect your wallet.');
        
        // Update UI to show wallet disconnected
        statusMessage.innerHTML = `
            <p>Wallet disconnected. Please connect your wallet to interact with the lottery.</p>
        `;
        statusMessage.className = 'alert alert-warning';
        
        // Update UI visuals
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.disabled = false;
        
        // Reset wallet-dependent UI elements
        adminSection.style.display = 'none';
        updateUIForWalletConnection(false);
        
    } else {
        console.log("Using new account:", accounts[0]);
        
        // Update status message
        statusMessage.innerHTML = `
            <p>Connected with account: <strong class="address-text">${accounts[0]}</strong></p>
        `;
        statusMessage.className = 'alert alert-success';
        
        // Set connect button as connected
        connectWalletBtn.textContent = 'Wallet Connected';
        connectWalletBtn.disabled = true;
        
        // Reinitialize the app with the new account
        initApp();
    }
    
    // When accounts change, restart the auto-refresh
    startAutoRefresh();
}

// Update the connect wallet button to show a dropdown for multiple accounts
function updateConnectButtonForMultipleAccounts(availableAccounts) {
    if (!connectWalletBtn || !availableAccounts || availableAccounts.length <= 1) {
        return;
    }
    
    console.log("Setting up multiple account selector for", availableAccounts.length, "accounts");
    
    // Create an account selector dropdown
    const accountSelectorId = 'account-selector';
    let accountSelector = document.getElementById(accountSelectorId);
    
    // Create the selector if it doesn't exist
    if (!accountSelector) {
        // Remove existing connect wallet button
        const parentElement = connectWalletBtn.parentElement;
        if (!parentElement) return;
        
        // Create a container for the new UI
        const container = document.createElement('div');
        container.className = 'account-selector-container';
        
        // Create the select element
        accountSelector = document.createElement('select');
        accountSelector.id = accountSelectorId;
        accountSelector.className = 'form-select account-selector mb-2';
        
        // Add a default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = 'Select an account...';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        accountSelector.appendChild(defaultOption);
        
        // Add each account as an option
        availableAccounts.forEach((account, index) => {
            const option = document.createElement('option');
            option.value = account;
            // Format address for display (truncate in the middle)
            const shortAddress = account.slice(0, 6) + '...' + account.slice(-4);
            option.text = `Account ${index + 1}: ${shortAddress}`;
            accountSelector.appendChild(option);
        });
        
        // Create a connect button
        const connectButton = document.createElement('button');
        connectButton.id = 'connect-with-account-btn';
        connectButton.className = 'btn btn-success btn-lg w-100';
        connectButton.textContent = 'Connect Selected Account';
        
        // Add elements to container
        container.appendChild(accountSelector);
        container.appendChild(connectButton);
        
        // Replace the original button with our container
        parentElement.replaceChild(container, connectWalletBtn);
        
        // Add event listener to the new connect button
        connectButton.addEventListener('click', async () => {
            const selectedAccount = accountSelector.value;
            if (!selectedAccount) {
                showError('Please select an account');
                return;
            }
            
            console.log("Connecting with selected account:", selectedAccount);
            
            // Set this as the active account
            window.accounts = [selectedAccount];
            accounts = [selectedAccount];
            
            // Initialize the app with the selected account
            connectButton.disabled = true;
            connectButton.textContent = 'Connecting...';
            
            try {
                await initApp();
                showNotification(`Connected with account: ${selectedAccount}`, 'success');
            } catch (error) {
                console.error("Error initializing with selected account:", error);
                showError('Failed to connect with selected account');
                connectButton.disabled = false;
                connectButton.textContent = 'Connect Selected Account';
            }
        });
    }
}

async function updateUserStatus() {
    if (!web3 || !lotteryContract || !currentAccount) {
        userStatus.innerHTML = '<div class="alert alert-light">Connect your wallet to participate.</div>';
        return;
    }

    try {
        // Check if user has already entered this round
        const hasEntered = await lotteryContract.methods.hasEntered(currentAccount).call();
        
        if (hasEntered) {
            userStatus.innerHTML = '<div class="alert alert-warning">You have already entered this lottery round.</div>';
            enterBtn.disabled = true;
            enterBtn.textContent = 'Already Entered';
        } else {
            userStatus.innerHTML = '<div class="alert alert-light">You are not yet participating in this round.</div>';
            enterBtn.disabled = false;
            enterBtn.textContent = 'Enter Lottery';
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        userStatus.innerHTML = '<div class="alert alert-danger">Error checking participation status.</div>';
    }
}

async function enterLottery() {
    if (!web3 || !lotteryContract || !currentAccount) {
        showNotification('Please connect your wallet first.', 'warning');
        return;
    }

    try {
        const entryFee = await lotteryContract.methods.entryFee().call();
        const lotteryOpen = await lotteryContract.methods.lotteryOpen().call();

        if (!lotteryOpen) {
            showNotification('The lottery is currently closed.', 'warning');
            return;
        }

        // Check if user has already entered
        const hasEntered = await lotteryContract.methods.hasEntered(currentAccount).call();
        if (hasEntered) {
            showNotification('You have already entered this lottery round.', 'warning');
            return;
        }

        const tx = await lotteryContract.methods.enterLottery().send({
            from: currentAccount,
            value: entryFee,
            gas: 300000
        });

        showNotification('Successfully entered the lottery!', 'success');
        updateContractInfo();
        updatePlayersList();
        updateUserStatus();
    } catch (error) {
        console.error('Error entering lottery:', error);
        if (error.message.includes('already entered')) {
            showNotification('You have already entered this lottery round.', 'warning');
        } else {
            showNotification('Error entering lottery. Please try again.', 'danger');
        }
    }
}






