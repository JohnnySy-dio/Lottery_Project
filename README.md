# Decentralized Lottery dApp

A fully decentralized lottery application running on the Ethereum Sepolia testnet. Users can enter the lottery by paying a small entry fee, and the contract owner can pick a random winner.

## Features

- Connect with MetaMask wallet
- Enter lottery with testnet ETH
- View current lottery status, prize pool, and participants
- Admin controls for contract owner
- Transparent winner selection
- Previous winners history

## Live Demo

Visit the deployed lottery at: [https://yourusername.github.io/Lottery_Project](https://yourusername.github.io/Lottery_Project)

## Prerequisites

- [MetaMask](https://metamask.io/) browser extension
- Sepolia testnet ETH (available from [Sepolia Faucet](https://sepoliafaucet.com/))
- Node.js and npm for local development

## Deploying to Sepolia Testnet

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on the provided `env.example`:
   ```
   cp env.example .env
   ```

3. Add your MetaMask mnemonic and Infura project ID to the `.env` file:
   ```
   MNEMONIC=your twelve word mnemonic goes here do not share with anyone
   INFURA_PROJECT_ID=your_infura_project_id_here
   ```

4. Compile and deploy your smart contract:
   ```
   npx truffle compile
   npx truffle migrate --network sepolia
   ```

5. Update the `CONTRACT_ADDRESS` in `frontend/js/app.js` with your newly deployed contract address.

## Deploying to GitHub Pages

1. Create a GitHub repository for your project.

2. Push your code to the repository:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/Lottery_Project.git
   git push -u origin main
   ```

3. The GitHub Actions workflow (in `.github/workflows/deploy.yml`) will automatically deploy your frontend to GitHub Pages.

4. Go to your repository settings, navigate to "Pages," and ensure it's set up correctly (usually with the `gh-pages` branch as the source).

## Local Development

1. Run a local blockchain:
   ```
   npx ganache-cli
   ```

2. Deploy contracts locally:
   ```
   npx truffle migrate --network development
   ```

3. Update `frontend/js/app.js` to use the local settings:
   ```javascript
   const USE_LOCAL_WEB3 = true;
   ```

4. Serve the frontend:
   ```
   npx serve frontend
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Ethereum Foundation
- Truffle Suite
- Web3.js