# Decentralized Lottery Project Documentation

## Table of Contents
- [Decentralized Lottery Project Documentation](#decentralized-lottery-project-documentation)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Project Architecture](#project-architecture)
  - [Prerequisites](#prerequisites)
  - [Setup Instructions](#setup-instructions)
    - [Installation](#installation)
    - [Configuration](#configuration)
  - [Compilation and Deployment](#compilation-and-deployment)
    - [Compiling Smart Contracts](#compiling-smart-contracts)
    - [Deploying to Local Network](#deploying-to-local-network)
    - [Deploying to Public Networks](#deploying-to-public-networks)
  - [Running the Application](#running-the-application)
    - [Using Start Scripts](#using-start-scripts)
    - [Manual Startup](#manual-startup)
    - [Testing Web3 Connection](#testing-web3-connection)
  - [Using the Lottery](#using-the-lottery)
    - [Connecting with MetaMask](#connecting-with-metamask)
    - [Entering the Lottery](#entering-the-lottery)
    - [Admin Functions](#admin-functions)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues and Solutions](#common-issues-and-solutions)
    - [Web3 Connection Testing](#web3-connection-testing)
  - [Smart Contract Overview](#smart-contract-overview)
    - [State Variables](#state-variables)
    - [Events](#events)
    - [Key Functions](#key-functions)
  - [Frontend Structure](#frontend-structure)
    - [Key Files](#key-files)
    - [Components](#components)
  - [Security Considerations](#security-considerations)
  - [Future Enhancements](#future-enhancements)

## Introduction

The Decentralized Lottery is a blockchain-based application built on Ethereum that provides a transparent and fair lottery system. The project combines Solidity smart contracts with a modern web interface, allowing users to participate in lottery rounds with full transparency and guaranteed fairness.

Key features include:
- Decentralized lottery mechanism with transparent winner selection
- Admin controls for managing lottery rounds
- Real-time updates of lottery state and participants
- Automatic prize distribution to winners
- Comprehensive event logging

## Project Architecture

The project follows a standard web3 architecture with two main components:

1. **Backend (Smart Contract)**
   - Written in Solidity 0.8.0
   - Deployed on Ethereum blockchain (local Ganache for development)
   - Manages lottery logic, participant tracking, and prize distribution

2. **Frontend (Web Interface)**
   - HTML/CSS/JavaScript
   - Web3.js for blockchain interaction
   - Bootstrap for responsive UI components
   - Express.js server for serving static files

## Prerequisites

Before setting up the project, ensure you have:

1. **Node.js and npm** - Latest LTS version recommended
2. **Ganache** - Local Ethereum blockchain for development
   - Download from [Truffle Suite](https://trufflesuite.com/ganache/)
   - Configure to run on port 7545
3. **Truffle** - For contract compilation and deployment
   - Install globally: `npm install -g truffle`
4. **MetaMask** - Browser extension for Ethereum interactions
   - Install from [MetaMask website](https://metamask.io/)
   - Configure to connect to Ganache

## Setup Instructions

### Installation

1. Clone or download the project repository:
   ```powershell
   git clone <repository-url>
   cd decentralized-lottery
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

### Configuration

1. **Ganache Setup**:
   - Launch Ganache
   - Ensure it's running on `HTTP://127.0.0.1:7545`
   - Verify the network ID matches the one in `truffle-config.js` (typically `*` or `5777`)

2. **MetaMask Configuration**:
   - Add Ganache as a custom network:
     - Network Name: Ganache
     - RPC URL: http://127.0.0.1:7545
     - Chain ID: 1337 (or the one specified in Ganache)
     - Currency Symbol: ETH
   - Import a Ganache account using its private key (available in the Ganache UI)

## Compilation and Deployment

### Compiling Smart Contracts

To compile the smart contracts:

```powershell
cd d:\COMP\COMP4541\Project
npx truffle compile
```

This will:
- Compile the Solidity contracts in the `contracts/` directory
- Generate contract artifacts in the `build/contracts/` directory
- Include ABI (Application Binary Interface) and bytecode required for deployment

### Deploying to Local Network

To deploy the contracts to your local Ganache network:

```powershell
cd d:\COMP\COMP4541\Project
npx truffle migrate --reset
```

This will:
- Deploy `DecentralizedLottery.sol` to your Ganache network
- Automatically update the `CONTRACT_ADDRESS` in `frontend/js/app.js`
- Create a new lottery instance ready for interaction

### Deploying to Public Networks

For deployment to public Ethereum networks (e.g., Goerli, Sepolia, Mainnet):

1. Create a `.env` file with your Infura API key and mnemonic (not included in base project):
   ```
   INFURA_API_KEY=your_infura_api_key
   MNEMONIC=your_wallet_mnemonic
   ```

2. Add the network configuration to `truffle-config.js` (requires modification):
   ```javascript
   goerli: {
     provider: () => new HDWalletProvider(process.env.MNEMONIC, `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`),
     network_id: 5,
     gas: 5500000,
     confirmations: 2,
     timeoutBlocks: 200,
     skipDryRun: true
   }
   ```

3. Deploy to the selected network:
   ```powershell
   npx truffle migrate --network goerli
   ```

4. Update the frontend configuration:
   - Set `USE_LOCAL_WEB3 = false` in `frontend/js/app.js`
   - Update `CONTRACT_ADDRESS` in `frontend/js/app.js` with the deployed address

## Running the Application

### Using Start Scripts

The project includes convenient scripts to start the entire application:

**For PowerShell**:
```powershell
cd d:\COMP\COMP4541\Project
./start-dev.ps1
```

**For Command Prompt**:
```
cd d:\COMP\COMP4541\Project
start-dev.bat
```

These scripts will:
1. Check if Ganache is running
2. Compile and deploy the contracts
3. Start the Express server on port 4000

### Manual Startup

If you prefer to start components individually:

1. **Compile and deploy contracts**:
   ```powershell
   cd d:\COMP\COMP4541\Project
   npm run compile
   npm run migrate
   ```

2. **Start the server**:
   ```powershell
   cd d:\COMP\COMP4541\Project
   npm start
   ```

3. **Access the application** at `http://localhost:4000`

### Testing Web3 Connection

To test Web3 connectivity without starting the full application:

```powershell
cd d:\COMP\COMP4541\Project
./test-connection.ps1
```

This script will start a temporary server and open a test page to verify connection to Ganache.

## Using the Lottery

### Connecting with MetaMask

1. Open the application at `http://localhost:4000`
2. Click "Connect Wallet" in the application
3. MetaMask will prompt for connection permission - accept it
4. Ensure you're connected to the Ganache network in MetaMask
5. Verify your account address is displayed in the UI

### Entering the Lottery

As a regular user:

1. Ensure your wallet is connected
2. Review the current lottery information:
   - Entry fee
   - Current participants
   - Prize pool (contract balance)
   - Lottery status (open/closed)
3. Click "Enter Lottery" button
4. Confirm the transaction in MetaMask (with the entry fee + gas)
5. Wait for the transaction to be confirmed
6. Your address will appear in the participants list

### Admin Functions

The admin (contract owner) has special privileges:

1. Connect with the owner account (the first account that deployed the contract)
2. Admin controls will be visible in the UI:
   - Set Entry Fee: Change the required entry fee for participation
   - Close Lottery: Close the current lottery round (preventing new entries)
   - Pick Winner: Select a winner randomly (only works when lottery is closed and minimum players reached)
   - Open Lottery: Reopen the lottery for new participants

To pick a winner:
1. First close the lottery using the "Close Lottery" button
2. Ensure the minimum number of players has been reached
3. Click "Pick Winner"
4. Confirm the transaction in MetaMask
5. The winner will be selected, prize transferred, and a new lottery round will start

## Troubleshooting

### Common Issues and Solutions

1. **"Connect Wallet" not working**
   - Ensure MetaMask is installed and unlocked
   - Verify you're on the correct network (Ganache)
   - Check browser console for errors

2. **"Contract not initialized" error**
   - Ensure Ganache is running
   - Verify the contract was deployed successfully
   - Check that CONTRACT_ADDRESS in app.js matches a deployed contract

3. **"Cannot read properties of undefined" errors**
   - Usually indicates Web3 initialization issues
   - Check if Ganache is running on port 7545
   - Try using the test-connection.ps1 script to diagnose

4. **Transaction failures**
   - Check if you have enough ETH for the transaction (entry fee + gas)
   - Verify the lottery is in the correct state (open for entries, closed for picking winners)
   - Look for specific error messages in the browser console

### Web3 Connection Testing

For direct Web3 connection testing:
1. Navigate to `http://localhost:4000/simple-test.html`
2. Click "Test Web3 Connection"
3. Check the results on the page and in the browser console

## Smart Contract Overview

The `DecentralizedLottery.sol` contract includes:

### State Variables
- `owner`: Contract administrator address
- `players`: Array of participant addresses
- `lotteryId`: Current lottery round identifier
- `lotteryHistory`: Mapping of lottery IDs to winner addresses
- `entryFee`: Required ETH amount to enter the lottery
- `minPlayers`: Minimum participants required to pick a winner
- `lotteryOpen`: Boolean indicating if entries are currently accepted

### Events
- `PlayerEntered`: Emitted when a player joins the lottery
- `WinnerSelected`: Emitted when a winner is chosen
- `LotteryOpened`: Emitted when a new lottery round starts
- `LotteryClosed`: Emitted when entries are closed
- `EntryFeesUpdated`: Emitted when entry fee is changed

### Key Functions
- `enterLottery()`: Join the lottery by paying the entry fee
- `pickWinner()`: Select a winner randomly and distribute prize
- `closeLottery()`: Close entries for the current round
- `openLottery()`: Open a new lottery round
- `setEntryFee()`: Update the required entry fee
- `getPlayers()`: Retrieve list of current participants
- `getBalance()`: Get current prize pool amount

## Frontend Structure

The frontend application is organized as follows:

### Key Files
- `index.html`: Main application interface
- `js/app.js`: Core application logic
- `css/style.css`: Custom styling
- `web3-test.html` & `simple-test.html`: Diagnostic tools

### Components
1. **Lottery Information Section**
   - Contract address
   - Current lottery ID
   - Entry fee
   - Minimum players required
   - Lottery status

2. **Participants Section**
   - Current player count
   - List of participant addresses
   - Current prize pool

3. **Admin Panel**
   - Only visible to contract owner
   - Controls for lottery management

4. **Transaction History**
   - Recent events from the contract
   - Player entries and winner selections

## Security Considerations

While the contract implements basic lottery functionality, it has limitations for educational purposes:

1. **Randomness**: The contract uses a simplistic random number generation mechanism based on block properties, which is not truly random and could potentially be manipulated by miners in a real network.

2. **No Timeout Mechanism**: The lottery doesn't have an automatic timeout or end date, relying solely on admin actions.

3. **Single-Admin Model**: All administrative functions are controlled by a single account, creating a central point of failure.

For production use, consider:
- Using Chainlink VRF for verifiable randomness
- Implementing timeouts and automatic lottery resolution
- Adding multi-signature admin capabilities
- Getting a professional security audit

## Future Enhancements

Potential improvements for the project:

1. **Time-Based Lotteries**: Automatic lottery rounds based on time periods
2. **Multiple Lottery Categories**: Different entry fees and prize structures
3. **Token Integration**: Support for ERC20 tokens in addition to ETH
4. **Governance System**: DAO-like voting for lottery parameters
5. **Enhanced Analytics**: Historical data and visualizations
6. **Mobile Optimization**: Responsive design improvements
7. **Layer 2 Support**: Integration with scaling solutions for lower gas fees
