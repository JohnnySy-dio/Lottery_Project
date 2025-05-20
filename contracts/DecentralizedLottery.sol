// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DecentralizedLottery {
    address public owner;
    address[] public players;
    uint public lotteryId;
    mapping(uint => address) public lotteryHistory;
    uint public entryFee = 0.001 ether;
    uint public minPlayers = 3;
    bool public lotteryOpen = true;

    // Track admin's accumulated fees
    uint public adminFees;

    // Track which addresses have entered the current lottery
    mapping(address => bool) public hasEntered;

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
        require(
            !hasEntered[msg.sender],
            "You have already entered this lottery round"
        );

        // Mark address as having entered
        hasEntered[msg.sender] = true;

        // Add player to the lottery
        players.push(msg.sender);

        // Split the entry fee: 50% to admin, 50% to prize pool
        uint adminShare = msg.value / 2;

        // Transfer admin's share directly to owner
        (bool success, ) = payable(owner).call{value: adminShare, gas: 30000}(
            ""
        );
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

        // Clear the hasEntered mapping for all players before resetting the array
        for (uint i = 0; i < players.length; i++) {
            hasEntered[players[i]] = false;
        }

        // Reset for next lottery
        players = new address[](0);
        lotteryId++;
        lotteryOpen = true;

        emit LotteryOpened(lotteryId, block.timestamp);
    }

    // Updated random function compatible with both Ganache and post-Merge Ethereum
    function random() private view returns (uint) {
        // Use block.difficulty which works on Ganache and maps to prevrandao on post-Merge Ethereum
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, players)));
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

    // The owner should be able to set the minimum number of players
    function setMinPlayers(uint _minPlayers) public onlyOwner {
        minPlayers = _minPlayers;
    }
}
