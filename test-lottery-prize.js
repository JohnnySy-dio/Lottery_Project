const Web3 = require('web3');
const fs = require('fs');
const path = require('path');

// Connect to Ganache
const web3 = new Web3('http://127.0.0.1:7545');

// Load contract ABI and address
const contractPath = path.join(__dirname, 'build', 'contracts', 'DecentralizedLottery.json');
const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
const contractABI = contractData.abi;

// Get contract address from app.js
const appJsPath = path.join(__dirname, 'frontend', 'js', 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const contractAddressMatch = appJsContent.match(/CONTRACT_ADDRESS\s*=\s*["']([^"']+)["']/);
const contractAddress = contractAddressMatch ? contractAddressMatch[1] : null;

if (!contractAddress) {
  console.error('Contract address not found in app.js');
  process.exit(1);
}

console.log(`Using contract at address: ${contractAddress}`);
const lotteryContract = new web3.eth.Contract(contractABI, contractAddress);

async function runTest() {
  try {
    // Get accounts
    const accounts = await web3.eth.getAccounts();
    const owner = accounts[0];
    const players = accounts.slice(1, 4); // Use accounts 1-3 as players
    const initialBalances = {};
    
    console.log('Owner account:', owner);
    console.log('Player accounts:', players);
    
    // Record initial balances
    for (const account of [...players, owner]) {
      initialBalances[account] = await web3.eth.getBalance(account);
      console.log(`Initial balance for ${account}: ${web3.utils.fromWei(initialBalances[account], 'ether')} ETH`);
    }
    
    // Check if lottery is open
    const isOpen = await lotteryContract.methods.lotteryOpen().call();
    if (!isOpen) {
      console.log('Opening lottery...');
      await lotteryContract.methods.openLottery().send({ from: owner, gas: 200000 });
    }
    
    // Get entry fee
    const entryFee = await lotteryContract.methods.entryFee().call();
    console.log(`Entry fee: ${web3.utils.fromWei(entryFee, 'ether')} ETH`);
    
    // Enter lottery with players
    for (const player of players) {
      console.log(`Player ${player} entering lottery...`);
      await lotteryContract.methods.enterLottery().send({
        from: player,
        value: entryFee,
        gas: 200000
      });
    }
    
    // Check contract balance
    const contractBalance = await web3.eth.getBalance(contractAddress);
    console.log(`Contract balance after entries: ${web3.utils.fromWei(contractBalance, 'ether')} ETH`);
    
    // Close lottery
    console.log('Closing lottery...');
    await lotteryContract.methods.closeLottery().send({ from: owner, gas: 200000 });
    
    // Pick winner
    console.log('Picking winner...');
    const txReceipt = await lotteryContract.methods.pickWinner().send({ from: owner, gas: 500000 });
    
    // Get winner from event logs
    const winnerEvent = txReceipt.events.WinnerSelected;
    if (!winnerEvent) {
      console.error('No WinnerSelected event found in transaction logs!');
      return;
    }
    
    const winner = winnerEvent.returnValues.winner;
    const prizeAmount = winnerEvent.returnValues.amount;
    console.log(`Winner selected: ${winner}`);
    console.log(`Prize amount: ${web3.utils.fromWei(prizeAmount, 'ether')} ETH`);
    
    // Check final balances
    for (const account of [...players, owner]) {
      const finalBalance = await web3.eth.getBalance(account);
      const diff = web3.utils.fromWei(
        web3.utils.toBN(finalBalance).sub(web3.utils.toBN(initialBalances[account])),
        'ether'
      );
      console.log(`Final balance for ${account}: ${web3.utils.fromWei(finalBalance, 'ether')} ETH`);
      console.log(`Difference: ${diff} ETH ${account === winner ? '(WINNER)' : ''}`);
    }
    
    // Check if winner received the prize
    const finalWinnerBalance = await web3.eth.getBalance(winner);
    const expectedIncrease = web3.utils.toBN(prizeAmount)
      .sub(web3.utils.toBN(entryFee))
      .sub(web3.utils.toBN(web3.utils.toWei('0.01', 'ether'))); // Approximate gas cost
    
    const actualIncrease = web3.utils.toBN(finalWinnerBalance)
      .sub(web3.utils.toBN(initialBalances[winner]));
    
    if (actualIncrease.gte(web3.utils.toBN(0))) {
      console.log('SUCCESS: Winner received funds!');
      console.log(`Expected minimum increase: ~${web3.utils.fromWei(expectedIncrease, 'ether')} ETH`);
      console.log(`Actual increase: ${web3.utils.fromWei(actualIncrease, 'ether')} ETH`);
    } else {
      console.log('FAILURE: Winner did not receive expected funds');
      console.log(`Expected minimum increase: ~${web3.utils.fromWei(expectedIncrease, 'ether')} ETH`);
      console.log(`Actual change: ${web3.utils.fromWei(actualIncrease, 'ether')} ETH`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Error running test:', err)); 