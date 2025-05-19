# Decentralized Lottery

A blockchain-based lottery system built on Ethereum, featuring a transparent and fair lottery mechanism with a modern web interface.

## Project Overview

This decentralized lottery application allows users to:

1. Enter a lottery by paying a small entry fee in ETH
2. View current participants and prize pool
3. See previous lottery winners
4. (Admin only) Manage lottery rounds, set fees, and pick winners

The project consists of:
- A Solidity smart contract deployed on the Ethereum blockchain
- A web-based frontend for interacting with the contract

## Technologies Used

### Backend
- Solidity ^0.8.0
- Ethereum Blockchain

### Frontend
- HTML5 / CSS3
- JavaScript
- Web3.js
- Bootstrap 5

## Smart Contract Features

The `DecentralizedLottery.sol` smart contract includes:

- Entry fee management
- Player tracking
- Lottery state management (open/closed)
- Secure winner selection
- Prize distribution
- Admin controls
- Event logging

## How It Works

1. **Setup**: The contract owner deploys the lottery with initial parameters
2. **Entry**: Players pay the required ETH to enter the lottery
3. **Closing**: Admin closes the lottery when ready to select a winner
4. **Winner Selection**: Admin triggers winner selection (only when closed and minimum players reached)
5. **Prize Distribution**: The entire contract balance is automatically transferred to the winner
6. **Reset**: A new lottery round starts automatically

## Getting Started

### Prerequisites

- [MetaMask](https://metamask.io/) browser extension
- An Ethereum wallet with testnet ETH (for testing)
- Node.js and npm (for local development)
- [Ganache](https://trufflesuite.com/ganache/) for local blockchain development

### Local Development Setup

1. Install the required dependencies:
   ```
   npm install
   ```

2. Start Ganache - either the GUI or CLI version:
   - Make sure it's running on `http://127.0.0.1:7545`
   - Note the available accounts and their private keys

3. Use the development script that handles compilation, deployment, and server startup:
   ```
   # For PowerShell
   ./start-dev.ps1
   
   # For Command Prompt
   start-dev.bat
   ```
   - This will automatically:
     - Check if Ganache is running
     - Compile and deploy the smart contract
     - Update the CONTRACT_ADDRESS in the frontend code
     - Start the Express server on port 4000

4. Access the application at `http://localhost:4000`

### Testing Web3 Connection

If you encounter issues connecting to Ganache, you can run the connection test:
```
./test-connection.ps1
```
This will:
- Check if Ganache is running
- Start a temporary server to serve the test page
- Open the Web3 test page in your browser

### Testnet Deployment (optional)

1. Compile the smart contract:
   ```
   npx truffle compile
   ```
2. Deploy to a testnet (like Goerli or Sepolia):
   ```
   npx truffle migrate --network goerli
   ```
3. Update the `CONTRACT_ADDRESS` in `frontend/js/app.js` with your deployed contract address
4. Set `USE_LOCAL_WEB3 = false` in `frontend/js/app.js`

### Running the Frontend

1. For local testing:
   ```
   npm run dev
   ```
2. For production:
   ```
   npm start
   ```
3. Access via a web browser with MetaMask installed

### Troubleshooting

If you encounter issues:
- Make sure Ganache is running and accessible
- Check that the contract was deployed successfully
- Verify the CONTRACT_ADDRESS is correctly set in app.js
- Ensure you're connected to the right network in MetaMask

## Using the Application

### As a Player
1. Connect your MetaMask wallet
2. Check the entry fee and prize pool
3. Click "Enter Lottery" to participate
4. Wait for the lottery to complete to see if you won

### As the Admin
1. Connect with the owner wallet
2. Use admin controls to:
   - Close the lottery
   - Pick a winner (when enough players have joined)
   - Set new entry fees
   - Start a new lottery round

## Security Considerations

This application is for educational purposes. In a production environment, consider:

- Using a more secure randomness source (e.g., Chainlink VRF)
- Adding more extensive testing
- Implementing timeouts and additional safeguards
- Getting a professional security audit

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Ethereum and Solidity documentation
- Web3.js library
- Bootstrap for UI components

## Future Enhancements

- Time-based lottery rounds
- Multiple lottery categories with different entry fees
- Token-based voting for lottery parameters
- Escrow and dispute resolution mechanisms
- Better randomness using Chainlink VRF