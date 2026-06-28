// src/utils/config.js
// ─────────────────────────────────────────────
// Central config for the frontend
// UPDATE CONTRACT_ADDRESS after deploying to Hardhat!
// ─────────────────────────────────────────────

// Smart contract address — copy from blockchain/deployment.json after deploying
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Hardhat local network chain ID
export const CHAIN_ID = 31337;

// Backend API base URL
export const API_BASE_URL = "http://localhost:5000/api";

// Hardhat local network config for MetaMask
export const HARDHAT_NETWORK = {
  chainId:         "0x7A69",       // 31337 in hex
  chainName:       "Hardhat Local",
  rpcUrls:         ["http://127.0.0.1:8545"],
  nativeCurrency: {
    name:     "Ether",
    symbol:   "ETH",
    decimals: 18,
  },
};
