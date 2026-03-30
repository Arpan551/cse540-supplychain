# Blockchain-Based Supply Chain Provenance System

**CSE 540: Engineering Blockchain Applications — Spring B 2026**  
**Group 20:** Arpandeep Singh, Krishna Teja Kanakgiri, Srijith Mulupuri, Jishnu Paruchuri, Anudeep Cherukupalli

---

## Project Description

This project implements a blockchain-powered supply chain provenance system on Ethereum. The system allows multiple stakeholders (Producers, Distributors, Retailers, Regulators, and Consumers) to transparently track and verify a product's journey from origin to delivery. All critical events are recorded immutably on-chain via Solidity smart contracts, while large artifacts such as certificates and IoT sensor data are stored off-chain using IPFS.

**Core Features:**
- Product registration with unique on-chain ID and metadata
- Role-based access control (RBAC) for all stakeholders
- Custody transfer and status update logging
- Regulatory verification and certification records
- IPFS integration for off-chain document storage
- React web frontend for product lookup and interaction

---

## Project Structure

```
supplychain/
├── contracts/
│   ├── AccessControl.sol       # Role-based access control contract
│   ├── ProductRegistry.sol     # Core product registration and tracking contract
│   └── VerificationLog.sol     # Regulatory approvals and certification records
├── scripts/
│   ├── deploy.js               # Hardhat deployment script
│   └── simulate_iot.py         # Simulated IoT sensor data generator
├── test/
│   └── ProductRegistry.test.js # Unit tests for core contract
├── frontend/
│   └── src/
│       └── App.jsx             # React frontend entry point
├── hardhat.config.js           # Hardhat configuration
├── package.json                # Node.js dependencies
└── README.md
```

---

## Dependencies

### Smart Contracts and Backend

- [Node.js](https://nodejs.org/) v18+
- [Hardhat](https://hardhat.org/) v2.x
- [OpenZeppelin Contracts](https://openzeppelin.com/contracts/) v5.x
- [Ethers.js](https://docs.ethers.org/) v6.x

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### Frontend

- [React](https://react.dev/) v18+
- [Ethers.js](https://docs.ethers.org/) v6.x
- [MetaMask](https://metamask.io/) browser extension (for wallet connection)

```bash
cd frontend
npm install
```

### IPFS (Off-chain Storage)

- [Pinata](https://www.pinata.cloud/) account and API key for IPFS pinning

### Simulated IoT Script

- Python 3.x
- No additional packages required (uses standard library only)

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/supplychain.git
cd supplychain
npm install
```

### 2. Start a Local Hardhat Network

```bash
npx hardhat node
```

This spins up a local Ethereum node at `http://127.0.0.1:8545` with pre-funded test accounts.

### 3. Compile the Contracts

```bash
npx hardhat compile
```

### 4. Deploy Contracts to Local Network

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Note the deployed contract addresses printed in the terminal. You will need these for the frontend configuration.

### 5. Run Tests

```bash
npx hardhat test
```

### 6. Deploy to Sepolia Testnet (for demo)

Create a `.env` file in the project root:

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_INFURA_KEY>
PRIVATE_KEY=<YOUR_WALLET_PRIVATE_KEY>
```

Then run:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 7. Run the Frontend

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:3000` in your browser. Connect MetaMask to your local Hardhat network or Sepolia testnet.

### 8. Run Simulated IoT Data Script

```bash
python scripts/simulate_iot.py
```

---

## How to Use

> Full usage instructions will be added at the midterm stage. The following is a high-level overview.

1. **Register a Product:** Connect MetaMask as a Producer role. Fill in the product form on the frontend and submit. A transaction is sent to `ProductRegistry.registerProduct()`.
2. **Transfer Custody:** Connect as a Distributor. Select the product ID and initiate a custody transfer to the next stakeholder address.
3. **Update Status:** Any authorized stakeholder can call `updateStatus()` to log a new state (e.g., Shipped, Received, Delivered).
4. **Verify a Product:** Any user (including Consumers) can enter a product ID on the frontend to view its full on-chain provenance history.
5. **Add Certification:** Connect as a Regulator to issue a certification linked to a product ID and an IPFS document CID.

---

## Status

> Smart contract draft complete. Frontend and IPFS integration in progress.
