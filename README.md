# Decentralized Ethereum Lottery

A fully transparent lottery application running on the Ethereum Sepolia testnet.

## Features

- Connect with MetaMask wallet
- Join lottery with ETH
- Admin functionality for managing the lottery
- Real-time updates of lottery state
- Transparent winner selection
- Previous winners display
- Two-step randomness commitment for fair winner selection
- Mobile-responsive design
- Improved side-by-side UI layout

## Smart Contract Features

- Enter lottery with entry fee
- Admin can set entry fee
- Admin can set minimum players
- Admin can close/open lottery
- Two-step winner selection process for fairness:
  - Step 1: Commit randomness source
  - Step 2: Pick winner after waiting period
- Admin fee withdrawal
- Transparent random winner selection with blockchain consensus
- Transaction history view

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript(Node.js)
- **Libraries**: Web3.js, Bootstrap 5
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Smart Contract**: Solidity

## Testing and Verification

The application has been thoroughly tested with:

- **Smart Contract Tests**: 30 automated tests covering all contract functionality
- **Frontend Tests**: Verification scripts to ensure UI implementation
- **Cross-Platform Compatibility**: Tested on both Linux and Windows environments
- **Browser Testing**: Verified on Chrome, Firefox, and Edge

All tests are passing, ensuring the application works reliably across different platforms and environments. To run the tests:

```bash
# Run smart contract tests
npx truffle test

# Run frontend verification
node test/windows-verification.js
```

## Dependencies

### Main Dependencies
- **Node.js**: Version 20.11.0 or higher
- **web3**: ^1.10.0 - Ethereum JavaScript API
- **@truffle/hdwallet-provider**: ^2.1.5 - HD Wallet-enabled Web3 provider
- **dotenv**: ^16.0.3 - Environment variable management

### Development Dependencies
- **truffle**: ^5.8.1 - Development framework for Ethereum
- **serve**: ^14.2.0 - Static file serving for development
- **gh-pages**: ^5.0.0 - GitHub Pages deployment tool

### Browser Requirements
- **MetaMask Extension**: Latest version
- **Modern Web Browser**: Chrome, Firefox, or Edge recommended

### Local Development Tools
- **Ganache**: Latest version - For local blockchain development
- **Git**: For version control

## Contract Address

The lottery smart contract is deployed on the Sepolia testnet at:
`0x9439Fe9771c48De0E36514CC5E746398059d7b4E`

## How to Use

1. Connect your MetaMask wallet to the Sepolia testnet
2. Ensure you have some Sepolia ETH (get from a faucet)
3. Join the lottery by paying the entry fee
4. View current participants in the right-side panel
5. Check previous winners in the history panel
6. Wait for admin to pick a winner when minimum participants join
7. If you're the winner, prizes will be automatically sent to your wallet

## Live Demo

Visit the live demo at: [https://johnnysy-dio.github.io/Lottery_Project/frontend/index.html](https://johnnysy-dio.github.io/Lottery_Project/frontend/index.html)

## Installation

To run this project locally:

1. Clone the repository: `git clone https://github.com/JohnnySy-dio/Lottery_Project.git`
2. Make sure you have Node.js installed (Version 20.11.0 or higher)
3. Install dependencies: `npm install`
4. Run the frontend server: `node server.js`
5. Open your browser and navigate to `http://localhost:3000` to view the application
6. Connect MetaMask to Sepolia testnet


## License
This project is licensed under the MIT License
