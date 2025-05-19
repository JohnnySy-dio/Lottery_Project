const DecentralizedLottery = artifacts.require("DecentralizedLottery");

module.exports = function(deployer) {
  deployer.deploy(DecentralizedLottery);
}; 