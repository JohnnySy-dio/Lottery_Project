# Decentralized Lottery - Quick Start Guide

## Prerequisites
- Node.js and npm installed
- Ganache running on port 7545
- MetaMask browser extension installed
- Truffle installed globally (`npm install -g truffle`)

## Setup in 3 Simple Steps

### 1. Install Dependencies
```powershell
cd d:\COMP\COMP4541\Project
npm install
```

### 2. Start the Application
Using the provided script:
```powershell
# PowerShell
./start-dev.ps1

# OR Command Prompt
start-dev.bat
```

This will:
- Check if Ganache is running
- Compile and deploy the smart contract
- Start the web server

### 3. Connect MetaMask
- Open http://localhost:4000 in your browser
- Configure MetaMask to connect to Ganache:
  - Network Name: Ganache
  - RPC URL: http://127.0.0.1:7545
  - Chain ID: 1337
  - Currency Symbol: ETH
- Import a Ganache account using its private key (copy from Ganache UI)
- Click "Connect Wallet" in the application

## Using the Lottery

### As a Regular User
1. Check the entry fee displayed on the page
2. Click "Enter Lottery"
3. Confirm the transaction in MetaMask
4. Wait for your address to appear in the participants list

### As the Admin (Contract Owner)
The admin is the first account that deployed the contract.

1. Connect with the owner account in MetaMask
2. Use admin controls:
   - Close Lottery: Prevents new entries
   - Pick Winner: Selects winner and distributes prize (only works when closed with enough players)
   - Set Entry Fee: Changes the required entry amount
   - Open Lottery: Starts a new lottery round

## Troubleshooting
- If MetaMask is not connecting, ensure you're on the Ganache network
- If transactions fail, check you have enough ETH in your account
- If Web3 connection issues occur, run the test script:
  ```powershell
  ./test-connection.ps1
  ```

## Further Documentation
For complete details, see [DOCUMENTATION.md](DOCUMENTATION.md)
