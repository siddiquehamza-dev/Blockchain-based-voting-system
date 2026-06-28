require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,   // Enable optimizer for gas savings
        runs: 200,       // Optimize for average usage
      },
    },
  },
  networks: {
    // Local Hardhat network (default for testing)
    hardhat: {
      chainId: 31337,
    },
    // Named localhost network (for running `npx hardhat node` separately)
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
