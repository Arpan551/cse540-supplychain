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
│   ├── deploy.js               # Hardhat deployment script (saves deployed-addresses.json)
│   ├── seed.js                 # Seeds demo data for local testing
│   └── simulate_iot.py         # Simulated IoT sensor data generator
├── test/
│   ├── ProductRegistry.test.js # Unit tests for core contract
│   └── VerificationLog.test.js # Unit tests for verification contract
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx             # React frontend entry point
│       ├── useContracts.js     # MetaMask and contract connection hook
│       ├── abi/                # Contract ABIs
│       └── components/         # UI components
├── hardhat.config.js
├── package.json
└── README.md
```

---

## Dependencies

### Smart Contracts and Backend

- Node.js v18+
- Hardhat v2.x
- OpenZeppelin Contracts v5.x

```bash
npm install
```

### Frontend

- React v18+
- Ethers.js v6.x
- Vite v5.x
- MetaMask browser extension

```bash
cd frontend && npm install
```

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Arpan551/cse540-supplychain.git
cd cse540-supplychain
npm install
```

### 2. Start a Local Hardhat Network

```bash
npx hardhat node
```

### 3. Compile and Deploy Contracts

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Configure the Frontend

```bash
cp frontend/.env.example frontend/.env
```

Fill in the contract addresses from the deploy output into `frontend/.env`.

### 5. Seed Demo Data (optional)

```bash
npx hardhat run scripts/seed.js --network localhost
```

### 6. Run Tests

```bash
npx hardhat test
```

### 7. Run the Frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`. Connect MetaMask to `http://127.0.0.1:8545` (chain ID 31337).

### 8. Deploy to Sepolia Testnet

Create a `.env` file in the project root:

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_INFURA_KEY>
PRIVATE_KEY=<YOUR_WALLET_PRIVATE_KEY>
```

Then run:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 9. Run Simulated IoT Data Script

```bash
python scripts/simulate_iot.py
```

---

## How to Use

1. **Register a Product:** Connect MetaMask as a Producer. Fill in the product form and submit.
2. **Transfer Custody:** Connect as a Producer or Distributor. Select a product and transfer to the next address.
3. **Update Status:** Any authorized stakeholder can call `updateStatus()` to log a new state.
4. **Confirm Delivery:** Connect as a Retailer to mark the product as delivered.
5. **Verify a Product:** Any user can enter a product ID to view its full on-chain provenance history.
6. **Add Certification:** Connect as a Regulator to issue a certification linked to an IPFS document.
