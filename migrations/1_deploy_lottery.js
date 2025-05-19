const DecentralizedLottery = artifacts.require("DecentralizedLottery");

module.exports = function(deployer) {
  deployer.deploy(DecentralizedLottery)
    .then(() => {
      console.log("DecentralizedLottery deployed at:", DecentralizedLottery.address);
    });
};
