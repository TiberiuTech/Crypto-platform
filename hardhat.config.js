require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: "YOUR_SEPOLIA_URL",
      accounts: ["YOUR_PRIVATE_KEY"]
    }
  }
};
