# Decentralized Ethereum Lottery

A fully transparent lottery application running on the Ethereum Sepolia testnet.

## Features

- Connect with MetaMask wallet
- Join lottery with ETH
- Admin functionality for managing the lottery
- Real-time updates of lottery state
- Transparent winner selection
- Mobile-responsive design

## Smart Contract Features

- Enter lottery with entry fee
- Admin can set entry fee
- Admin can set minimum players
- Admin can close/open lottery
- Admin can pick a winner
- Admin fee withdrawal
- Random winner selection

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript(Node.js)
- **Libraries**: Web3.js, Bootstrap 5
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Smart Contract**: Solidity

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
- **Modern Web Browser**: Chrome, Firefox, or Erecommended

### Local Development Tools
- **Ganache**: Latest version - For local blockchain development
- **Git**: For version control

## Contract Address

The lottery smart contract is deployed on the Sepolia testnet at:
`0x3a1c2615aD402B4C706780374F9C7746125d7C24`

## How to Use

1. Connect your MetaMask wallet to the Sepolia testnet
2. Ensure you have some Sepolia ETH (get from a faucet)
3. Join the lottery by paying the entry fee
4. Wait for admin to pick a winner when minimum participants join
5. If you're the winner, prizes will be automatically sent to your wallet

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
