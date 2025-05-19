# Decentralized Lottery Application

This is a decentralized lottery application built on Ethereum. The application allows users to enter a lottery by paying an entry fee, and then randomly selects a winner when the lottery is closed.

## Features

- Connect with MetaMask or use local development accounts
- Enter lottery by paying an entry fee
- View current lottery status, prize pool, and participants
- Admin features for contract owner (open/close lottery, pick winner, set entry fee)
- View previous lottery winners
- Network detection and switching capability
- Transaction tracking and monitoring
- Detailed error handling and user feedback

## Enhanced MetaMask Integration

This application includes robust MetaMask wallet integration with the following features:

1. **Automatic Detection**: Automatically detects if MetaMask is installed and available
2. **Network Management**: Detects the current network and can switch to the appropriate network if needed
3. **Transaction Tracking**: Tracks transactions in real-time and provides feedback on their status
4. **Balance Checking**: Verifies user has sufficient balance before initiating transactions
5. **Error Handling**: Provides meaningful error messages for common MetaMask errors
6. **Account Switching**: Handles account switching events properly
7. **Network Switching**: Supports switching between different networks (mainnet, testnets, local)
8. **Gas Estimation**: Estimates gas costs and adds a buffer for reliable transactions

## Smart Contract Features

- **Lottery Management**: Open, close, and manage lottery rounds
- **Entry Fee Management**: Set and update the required entry fee
- **Random Winner Selection**: Securely pick a random winner
- **Minimum Players**: Set a minimum number of players required before a winner can be picked
- **Event Logging**: Logs all important events for transparency and UI updates

## Development Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```
   or
   ```
   ./start-dev.ps1
   ```

3. The application will be available at http://localhost:4001

## Using the Application

1. **Connect Your Wallet**: Click the "Connect Wallet" button to connect your MetaMask wallet
2. **Enter the Lottery**: Click the "Enter Lottery" button to join the current lottery round
3. **View Participants**: See the list of current lottery participants
4. **View Previous Winners**: See the results of previous lottery rounds
5. **Admin Controls**: If you are the contract owner, you can open/close the lottery, pick winners, and set the entry fee

## Network Compatibility

The application supports:
- Ethereum Mainnet
- Goerli Testnet
- Ganache Local Development Network
- Other EVM-compatible networks

## Adding Custom Networks

If you want to use a custom network, you can set the `NETWORK_ID` variable in `app.js` to your desired network ID, or set it to `"*"` to accept any network.

## Transaction Tracking

The application now includes detailed transaction tracking:
1. Shows transaction hash and provides a link to Etherscan (when applicable)
2. Displays a progress indicator during transaction confirmation
3. Updates UI automatically when transactions are confirmed
4. Provides clear error messages if transactions fail

## Error Handling

The application includes comprehensive error handling:
1. MetaMask connection errors
2. Network switching errors
3. Transaction rejection by user
4. Contract-related errors
5. Gas estimation failures
6. Insufficient balance errors

## License

MIT
