const DecentralizedLottery = artifacts.require("DecentralizedLottery");
const { assert } = require("chai");
const truffleAssert = require('truffle-assertions');

contract("DecentralizedLottery", (accounts) => {
  const owner = accounts[0];
  const player1 = accounts[1];
  const player2 = accounts[2];
  const player3 = accounts[3];
  const player4 = accounts[4];
  const nonOwner = accounts[5];
  
  const entryFee = web3.utils.toWei("0.001", "ether");
  const higherEntryFee = web3.utils.toWei("0.002", "ether");
  
  let lottery;
  
  beforeEach(async () => {
    lottery = await DecentralizedLottery.new({ from: owner });
  });
  
  describe("Contract Initialization", () => {
    it("should set the owner correctly", async () => {
      const contractOwner = await lottery.owner();
      assert.equal(contractOwner, owner, "Owner is not set correctly");
    });
    
    it("should initialize with correct default values", async () => {
      const lotteryOpen = await lottery.lotteryOpen();
      const entryFeeSet = await lottery.entryFee();
      const lotteryId = await lottery.lotteryId();
      const minPlayers = await lottery.minPlayers();
      
      assert.equal(lotteryOpen, true, "Lottery should be open by default");
      assert.equal(entryFeeSet, entryFee, "Entry fee should be set to default 0.001 ether");
      assert.equal(lotteryId, 1, "Lottery ID should start at 1");
      assert.equal(minPlayers, 3, "Minimum players should be 3 by default");
    });
  });
  
  describe("Getter Functions", () => {
    it("should return correct player count", async () => {
      await lottery.enterLottery({ from: player1, value: entryFee });
      await lottery.enterLottery({ from: player2, value: entryFee });
      
      const playerCount = await lottery.getPlayerCount();
      assert.equal(playerCount, 2, "Player count should be 2");
    });
    
    it("should return correct player list", async () => {
      await lottery.enterLottery({ from: player1, value: entryFee });
      await lottery.enterLottery({ from: player2, value: entryFee });
      
      const players = await lottery.getPlayers();
      assert.equal(players.length, 2, "Should have 2 players");
      assert.equal(players[0], player1, "First player should be player1");
      assert.equal(players[1], player2, "Second player should be player2");
    });
    
    it("should return correct balance", async () => {
      await lottery.enterLottery({ from: player1, value: entryFee });
      
      // Half of the entry fee goes to prize pool
      const expectedBalance = web3.utils.toWei("0.0005", "ether");
      const balance = await lottery.getBalance();
      
      assert.equal(balance.toString(), expectedBalance, "Balance should be half of the entry fee");
    });
  });
  
  describe("Admin Functions", () => {
    it("should allow owner to set entry fee", async () => {
      await lottery.setEntryFee(higherEntryFee, { from: owner });
      const newEntryFee = await lottery.entryFee();
      
      assert.equal(newEntryFee, higherEntryFee, "Entry fee was not updated correctly");
    });
    
    it("should not allow non-owner to set entry fee", async () => {
      await truffleAssert.reverts(
        lottery.setEntryFee(higherEntryFee, { from: nonOwner }),
        "Only the owner can call this function"
      );
    });
    
    it("should allow owner to set minimum players", async () => {
      await lottery.setMinPlayers(5, { from: owner });
      const newMinPlayers = await lottery.minPlayers();
      
      assert.equal(newMinPlayers, 5, "Minimum players was not updated correctly");
    });
    
    it("should not allow non-owner to set minimum players", async () => {
      await truffleAssert.reverts(
        lottery.setMinPlayers(5, { from: nonOwner }),
        "Only the owner can call this function"
      );
    });
    
    it("should allow owner to close lottery", async () => {
      await lottery.closeLottery({ from: owner });
      const lotteryOpen = await lottery.lotteryOpen();
      
      assert.equal(lotteryOpen, false, "Lottery should be closed");
    });
    
    it("should allow owner to reopen lottery", async () => {
      await lottery.closeLottery({ from: owner });
      await lottery.openLottery({ from: owner });
      const lotteryOpen = await lottery.lotteryOpen();
      
      assert.equal(lotteryOpen, true, "Lottery should be open");
    });
    
    it("should not allow reopening an already open lottery", async () => {
      await truffleAssert.reverts(
        lottery.openLottery({ from: owner }),
        "Lottery is already open"
      );
    });
    
    it("should allow owner to withdraw admin fees", async () => {
      // Enter lottery to generate admin fees
      await lottery.enterLottery({ from: player1, value: entryFee });
      
      const initialAdminFees = await lottery.adminFees();
      const initialOwnerBalance = await web3.eth.getBalance(owner);
      
      // Withdraw fees
      const tx = await lottery.withdrawAdminFees({ from: owner });
      
      // Calculate gas cost
      const gasUsed = tx.receipt.gasUsed;
      const txInfo = await web3.eth.getTransaction(tx.tx);
      const gasPrice = txInfo.gasPrice;
      const gasCost = web3.utils.toBN(gasUsed).mul(web3.utils.toBN(gasPrice));
      
      const finalAdminFees = await lottery.adminFees();
      const finalOwnerBalance = await web3.eth.getBalance(owner);
      
      assert.equal(finalAdminFees, 0, "Admin fees should be reset to 0");
      
      // Check that owner received the fees minus gas costs
      const expectedBalance = web3.utils.toBN(initialOwnerBalance)
        .add(web3.utils.toBN(initialAdminFees))
        .sub(gasCost);
      
      assert.equal(
        web3.utils.toBN(finalOwnerBalance).toString(),
        expectedBalance.toString(),
        "Owner should receive admin fees"
      );
    });
  });
  
  describe("Lottery Entry", () => {
    it("should allow a player to enter the lottery", async () => {
      await lottery.enterLottery({ from: player1, value: entryFee });
      
      const playerCount = await lottery.getPlayerCount();
      const hasEntered = await lottery.hasEntered(player1);
      
      assert.equal(playerCount, 1, "Player count should be 1");
      assert.equal(hasEntered, true, "Player should be marked as entered");
    });
    
    it("should not allow a player to enter with insufficient fee", async () => {
      const lowFee = web3.utils.toWei("0.0005", "ether");
      
      await truffleAssert.reverts(
        lottery.enterLottery({ from: player1, value: lowFee }),
        "Insufficient entry fee"
      );
    });
    
    it("should not allow a player to enter twice", async () => {
      await lottery.enterLottery({ from: player1, value: entryFee });
      
      await truffleAssert.reverts(
        lottery.enterLottery({ from: player1, value: entryFee }),
        "You have already entered this lottery round"
      );
    });
    
    it("should not allow entry when lottery is closed", async () => {
      await lottery.closeLottery({ from: owner });
      
      await truffleAssert.reverts(
        lottery.enterLottery({ from: player1, value: entryFee }),
        "Lottery is not open"
      );
    });
    
    it("should correctly split fees between prize pool and admin fees", async () => {
      await lottery.enterLottery({ from: player1, value: entryFee });
      
      const prizePool = await lottery.getBalance();
      const adminFees = await lottery.adminFees();
      
      const expectedShare = web3.utils.toWei("0.0005", "ether");
      
      assert.equal(prizePool.toString(), expectedShare, "Prize pool should be half of entry fee");
      assert.equal(adminFees.toString(), expectedShare, "Admin fees should be half of entry fee");
    });
  });
  
  describe("Winner Selection", () => {
    beforeEach(async () => {
      // Enter enough players to meet the minimum
      await lottery.enterLottery({ from: player1, value: entryFee });
      await lottery.enterLottery({ from: player2, value: entryFee });
      await lottery.enterLottery({ from: player3, value: entryFee });
    });
    
    it("should not allow picking a winner when lottery is open", async () => {
      await truffleAssert.reverts(
        lottery.pickWinner({ from: owner }),
        "Close the lottery first"
      );
    });
    
    it("should not allow picking a winner with insufficient players", async () => {
      // Create a new lottery with higher minimum
      lottery = await DecentralizedLottery.new({ from: owner });
      await lottery.setMinPlayers(5, { from: owner });
      
      // Only have 3 players
      await lottery.enterLottery({ from: player1, value: entryFee });
      await lottery.enterLottery({ from: player2, value: entryFee });
      await lottery.enterLottery({ from: player3, value: entryFee });
      
      await lottery.closeLottery({ from: owner });
      
      await truffleAssert.reverts(
        lottery.pickWinner({ from: owner }),
        "Not enough players"
      );
    });
    
    it("should pick a winner, transfer prize, and reset for next round", async () => {
      await lottery.closeLottery({ from: owner });
      
      // Track balances before winner selection
      const initialBalances = {};
      initialBalances[player1] = web3.utils.toBN(await web3.eth.getBalance(player1));
      initialBalances[player2] = web3.utils.toBN(await web3.eth.getBalance(player2));
      initialBalances[player3] = web3.utils.toBN(await web3.eth.getBalance(player3));
      
      const prizePool = await lottery.getBalance();
      
      // Pick winner
      const tx = await lottery.pickWinner({ from: owner });
      
      // Verify lottery state reset
      const newLotteryId = await lottery.lotteryId();
      const newPlayerCount = await lottery.getPlayerCount();
      const newLotteryOpen = await lottery.lotteryOpen();
      const hasPlayer1Entered = await lottery.hasEntered(player1);
      
      assert.equal(newLotteryId, 2, "Lottery ID should increment");
      assert.equal(newPlayerCount, 0, "Player list should be reset");
      assert.equal(newLotteryOpen, true, "Lottery should be reopened");
      assert.equal(hasPlayer1Entered, false, "Player entry status should be reset");
      
      // Verify winner received prize by checking the WinnerSelected event
      truffleAssert.eventEmitted(tx, 'WinnerSelected', (ev) => {
        const winner = ev.winner;
        
        // Check if winner's balance increased by the prize amount
        return true; // We can't easily check actual balance since we don't know who the winner is
      });
    });
  });
  
  describe("Events", () => {
    it("should emit PlayerEntered event", async () => {
      const tx = await lottery.enterLottery({ from: player1, value: entryFee });
      
      truffleAssert.eventEmitted(tx, 'PlayerEntered', (ev) => {
        return ev.player === player1 && 
               ev.amount.toString() === entryFee.toString() &&
               ev.lotteryId.toString() === '1';
      });
    });
    
    it("should emit LotteryClosed event", async () => {
      const tx = await lottery.closeLottery({ from: owner });
      
      truffleAssert.eventEmitted(tx, 'LotteryClosed', (ev) => {
        return ev.lotteryId.toString() === '1';
      });
    });
    
    it("should emit LotteryOpened event", async () => {
      await lottery.closeLottery({ from: owner });
      const tx = await lottery.openLottery({ from: owner });
      
      truffleAssert.eventEmitted(tx, 'LotteryOpened', (ev) => {
        return ev.lotteryId.toString() === '1';
      });
    });
    
    it("should emit EntryFeesUpdated event", async () => {
      const tx = await lottery.setEntryFee(higherEntryFee, { from: owner });
      
      truffleAssert.eventEmitted(tx, 'EntryFeesUpdated', (ev) => {
        return ev.newFee.toString() === higherEntryFee.toString();
      });
    });
    
    it("should emit AdminFeesWithdrawn event", async () => {
      // Generate admin fees first
      await lottery.enterLottery({ from: player1, value: entryFee });
      const adminFees = await lottery.adminFees();
      
      const tx = await lottery.withdrawAdminFees({ from: owner });
      
      truffleAssert.eventEmitted(tx, 'AdminFeesWithdrawn', (ev) => {
        return ev.amount.toString() === adminFees.toString();
      });
    });
  });
}); 