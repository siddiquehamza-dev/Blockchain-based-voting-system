# 🗳️ Blockchain Based Voting System

A full-stack decentralized voting system built with **React.js**, **Node.js/Express**, **Solidity**, and **MongoDB**.

## 📁 Project Structure

```
blockchain-voting-system/
├── blockchain/          # Hardhat project (Smart contracts)
│   ├── contracts/       # Solidity contracts
│   ├── scripts/         # Deployment scripts
│   ├── test/            # Contract tests
│   └── hardhat.config.js
├── backend/             # Node.js + Express API
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/       # Auth middleware
│   └── server.js
├── frontend/            # React.js application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Web3, Auth)
│   │   └── utils/       # Helper functions
│   └── public/
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- MetaMask browser extension
- MongoDB (local or Atlas)
- Git

### Step 1: Clone & Install
```bash
# Install blockchain dependencies
cd blockchain
npm install

# Install backend dependencies
cd ../backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Start Local Blockchain
```bash
cd blockchain
npx hardhat node
```
This starts a local Ethereum network at http://127.0.0.1:8545 with test accounts.

### Step 3: Deploy Smart Contract
```bash
# In a new terminal
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
Copy the deployed contract address and update `frontend/src/utils/config.js`.

### Step 4: Configure MetaMask
1. Open MetaMask → Add Network
2. Network Name: Hardhat Local
3. RPC URL: http://127.0.0.1:8545
4. Chain ID: 31337
5. Import test account using private key from hardhat node output

### Step 5: Start Backend
```bash
cd backend
# Create .env file (see .env.example)
npm run dev
```

### Step 6: Start Frontend
```bash
cd frontend
npm start
```

## 🧪 Test Accounts (from Hardhat)
When you run `npx hardhat node`, it generates 20 accounts with 10000 ETH each.
- Account #0: Use as Admin
- Account #1-5: Use as Voters

## 🔐 Security Features
- **Double voting prevented** via smart contract mapping (`hasVoted`)
- **Votes stored on blockchain** — immutable and transparent
- **Voter identity not linked to vote** — only wallet address tracked
- **JWT authentication** for backend APIs

## ❓ Viva Q&A
See `VIVA_QA.md` for common interview questions with answers.
