// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentralizedLottery {
    address public owner;
    address[] public players;
    uint public lotteryId;
    mapping(uint => address) public lotteryHistory;
    uint public entryFee = 0.01 ether;
    uint public minPlayers = 3;
    bool public lotteryOpen = true;
    
    // Track admin's accumulated fees
    uint public adminFees;
    
    event PlayerEntered(address indexed player, uint amount, uint lotteryId);
    event WinnerSelected(address indexed winner, uint amount, uint lotteryId);
    event LotteryOpened(uint lotteryId, uint timestamp);
    event LotteryClosed(uint lotteryId, uint timestamp);
    event EntryFeesUpdated(uint newFee);
    event AdminFeesWithdrawn(uint amount);
    
    constructor() {
        owner = msg.sender;
        lotteryId = 1;
        emit LotteryOpened(lotteryId, block.timestamp);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }
    
    function getPlayers() public view returns (address[] memory) {
        return players;
    }
    
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
    
    function getPlayerCount() public view returns (uint) {
        return players.length;
    }
    
    function setEntryFee(uint _fee) public onlyOwner {
        require(_fee > 0, "Fee must be greater than 0");
        entryFee = _fee;
        emit EntryFeesUpdated(_fee);
    }
    
    function enterLottery() public payable {
        require(lotteryOpen, "Lottery is not open");
        require(msg.value >= entryFee, "Insufficient entry fee");
        
        // Add player to the lottery
        players.push(msg.sender);
        
        // Split the entry fee: 50% to admin, 50% to prize pool
        uint adminShare = msg.value / 2;
        
        // Transfer admin's share directly to owner
        (bool success, ) = payable(owner).call{value: adminShare, gas: 30000}("");
        require(success, "Failed to transfer admin share");
        
        // The remaining amount stays in the contract for the prize pool
        
        emit PlayerEntered(msg.sender, msg.value, lotteryId);
    }
    
    function closeLottery() public onlyOwner {
        lotteryOpen = false;
        emit LotteryClosed(lotteryId, block.timestamp);
    }
    
    function openLottery() public onlyOwner {
        require(!lotteryOpen, "Lottery is already open");
        lotteryOpen = true;
        emit LotteryOpened(lotteryId, block.timestamp);
    }
    
    function pickWinner() public onlyOwner {
        require(!lotteryOpen, "Close the lottery first");
        require(players.length >= minPlayers, "Not enough players");
        
        uint index = random() % players.length;
        address winner = players[index];
        
        // Record the winner
        lotteryHistory[lotteryId] = winner;
        
        // Get the prize pool amount (contract balance)
        uint prize = address(this).balance;
        
        // Ensure we have a prize to distribute
        require(prize > 0, "No prize to distribute");
        
        // Log important values for debugging
        emit WinnerSelected(winner, prize, lotteryId);
        
        // Transfer the prize with appropriate gas limit and better error handling
        (bool success, ) = payable(winner).call{value: prize, gas: 30000}("");
        require(success, "Failed to transfer prize to winner");
        
        // Reset for next lottery
        players = new address[](0);
        lotteryId++;
        lotteryOpen = true;
        emit LotteryOpened(lotteryId, block.timestamp);
    }
    
    // Function for admin to withdraw accumulated fees
    function withdrawAdminFees() public onlyOwner {
        require(adminFees > 0, "No fees to withdraw");
        
        uint amount = adminFees;
        adminFees = 0; // Reset before transfer to prevent reentrancy
        
        (bool success, ) = payable(owner).call{value: amount, gas: 30000}("");
        require(success, "Failed to transfer admin fees");
        
        emit AdminFeesWithdrawn(amount);
    }
    
    // Simple random function (Note: This is not secure for production)
    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, players)));
    }
}