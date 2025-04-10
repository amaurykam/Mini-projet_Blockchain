require("@nomicfoundation/hardhat-toolbox");

// hardhat.config.js
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
      },
      {
        version: "0.8.24",
      }
    ],
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
  },
};