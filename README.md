# Supply Chain Provenance System

**CSE 540: Engineering Blockchain Applications — Spring B 2026**  
**Group 20:** Arpandeep Singh, Krishna Teja Kanakgiri, Srijith Mulupuri, Jishnu Paruchuri, Anudeep Cherukupalli

---

## What does this project do?

Ever wonder if the medicine you bought is actually what it says it is? Or whether that "organic" food really came from a farm? That's the problem we're solving.

This app lets everyone involved in a product's journey — the factory that made it, the truck driver who shipped it, the store that sold it, and the regulator who approved it — all record their step on the blockchain. Because the blockchain can't be edited, you end up with a permanent, trustworthy record of where a product has been. Anyone, including regular consumers, can look up a product and see its full history.

**What you can do with this app:**
- A **Producer** registers a new product and gets a unique ID for it
- A **Distributor** records when they receive and ship it onwards
- A **Retailer** confirms when the product arrives at the store
- A **Regulator** attaches official certifications (like FDA approval) to a product
- A **Consumer** looks up any product by ID and sees everything that happened to it
- An **Admin** controls who gets which role

---

## Why we built it this way

### Three contracts instead of one

We split the code into three smart contracts. Each one has one job:

- **AccessControl.sol** — keeps track of who is allowed to do what. Both other contracts ask this one before letting anyone take an action.
- **ProductRegistry.sol** — tracks where a product is and what's happened to it.
- **VerificationLog.sol** — stores official certifications from regulators.

Keeping them separate means if you want to add a new feature later, you only touch the relevant contract and don't risk breaking the others.

### Why we use IPFS for documents

Storing a PDF directly on Ethereum would cost hundreds or thousands of dollars in gas fees. Instead we upload documents to IPFS (a decentralized file storage network) and only store the file's unique fingerprint (called a CID) on-chain. If someone tries to swap the document with a fake one, the fingerprint won't match — so you can always tell if something has been tampered with.

### Why you don't need MetaMask just to look up a product

We wanted consumers to be able to check a product without needing a crypto wallet. So the app connects directly to the blockchain for reading data, no MetaMask needed. You only need MetaMask when you're actually recording something (like registering a product or confirming delivery).

---

## Project structure

```
cse540-supplychain/
├── contracts/
│   ├── AccessControl.sol        # Who can do what — roles for all 5 stakeholder types
│   ├── ProductRegistry.sol      # The main contract: register products, move them, track history
│   └── VerificationLog.sol      # Certifications from regulators, linked to IPFS documents
├── scripts/
│   ├── deploy.js                # Puts the contracts on the blockchain, saves the addresses
│   ├── seed.js                  # Fills the local blockchain with demo products for testing
│   └── simulate_iot.py          # Pretends to be an IoT sensor — generates fake temperature/GPS data
├── test/
│   ├── ProductRegistry.test.js  # Automated tests for the product contract (26 tests total)
│   └── VerificationLog.test.js  # Automated tests for the certification contract
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # The main page — tabs, wallet connection, product lookup
│   │   ├── useContracts.js      # Handles connecting MetaMask and talking to the contracts
│   │   ├── App.module.css       # All the styling
│   │   ├── abi/                 # The "instruction manuals" the frontend uses to talk to contracts
│   │   └── components/
│   │       ├── RegisterProduct.jsx      # Form for producers to register a new product
│   │       ├── TransferCustody.jsx      # Form for handing a product to the next person
│   │       ├── ConfirmDelivery.jsx      # Form for retailers to mark a product as delivered
│   │       ├── UpdateStatus.jsx         # Form for logging any status change (e.g. "in warehouse")
│   │       ├── IssueCertification.jsx   # Form for regulators to issue or revoke certifications
│   │       ├── AdminPanel.jsx           # Form for the admin to assign roles to wallet addresses
│   │       └── ProvenanceTimeline.jsx   # The visual history timeline shown on product lookup
│   ├── .env                     # Your local contract addresses — don't commit this file
│   ├── .env.example             # Template showing what goes in .env
│   └── package.json
├── deployed-addresses.json      # Created automatically when you run deploy.js
├── hardhat.config.js
└── package.json
```

---

## What you need before starting

- **Node.js v18 or newer** — download from [nodejs.org](https://nodejs.org)
- **MetaMask** installed in your browser — download from [metamask.io](https://metamask.io)
- **Python 3** — only needed if you want to run the IoT simulator
- A terminal (PowerShell on Windows, Terminal on Mac/Linux)

---

## Setting everything up locally

### Step 1 — Install the packages

```bash
# Install the blockchain / Hardhat packages
npm install

# Install the frontend packages
cd frontend
npm install
cd ..
```

### Step 2 — Start the local blockchain

Open a terminal and run this. **Keep it running** — this is your fake blockchain:

```bash
npx hardhat node
```

You'll see 20 test accounts printed out, each with 10,000 fake ETH. Save the private keys for accounts #0 through #4 — you'll need them later.

### Step 3 — Deploy the contracts

Open a **second terminal** (keep the first one running) and run:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
```

You'll see three addresses printed. Example:

```
SupplyChainAccessControl deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
ProductRegistry deployed to:          0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VerificationLog deployed to:          0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

These addresses are also saved to `deployed-addresses.json` automatically.

### Step 4 — Tell the frontend where the contracts are

Copy the example env file:

```bash
cp frontend/.env.example frontend/.env
```

Open `frontend/.env` and paste in the three addresses from Step 3:

```
VITE_PRODUCT_REGISTRY=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_VERIFICATION_LOG=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
VITE_ACCESS_CONTROL=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

> **Good to know:** On a fresh local Hardhat network the addresses are always the same ones shown above, so if you haven't redeployed you might not even need to change anything.

### Step 5 — Load some demo data (recommended)

This creates 3 sample products and walks Product #1 through the entire supply chain so you have something to look at right away:

```bash
npx hardhat run scripts/seed.js --network localhost
```

After this you can look up products 1, 2, and 3 in the app.

### Step 6 — Start the frontend

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

### Step 7 — Connect MetaMask to your local blockchain

MetaMask doesn't know about your local Hardhat blockchain by default, so you need to add it:

1. Click the network dropdown in MetaMask → **Add a network manually**
2. Fill in these details:
   - **Network Name:** Hardhat Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. Click **Import Account** and paste in private keys from the `npx hardhat node` output

> **Tip:** Import at least accounts #0 (Admin), #1 (Producer), #2 (Distributor), #3 (Retailer), and #4 (Regulator) so you can test all the tabs.

---

## Running the tests

```bash
npx hardhat test
```

You should see **26 passing**. These tests cover every major function in both contracts.

---

## How to use each tab in the app

### Lookup Product
No wallet needed. Type any product ID (try 1, 2, or 3 after running seed.js) and hit Lookup. You'll see:
- The current owner and status (Registered, Shipped, InStorage, Delivered, or Flagged)
- A QR code you can scan with your phone
- Any certifications with links to the actual documents on IPFS
- A full timeline of everything that's happened to the product

### Register Product *(you need the Producer role)*
Give your product a batch label (e.g. `BATCH-PHARMA-2024-A`) and optionally paste an IPFS CID if you've uploaded a product document to Pinata. Hit submit — the product gets a unique ID on the blockchain.

### Transfer Custody *(Producer or Distributor role, and you have to own the product)*
Enter the product ID, the wallet address you're sending it to, and a note about the shipment. This marks the product as Shipped and hands ownership to the new address.

### Update Status *(Producer, Distributor, Retailer, or Regulator)*
Pick a product and a new status from the dropdown, add a note, and submit. Use this for things like "arrived at warehouse" (InStorage) or "flagged for recall" (Flagged). Every update gets permanently added to the product's history.

### Confirm Delivery *(Retailer role only)*
Enter the product ID and a note about where it was received. This marks the product as Delivered — the final step in the journey.

### Regulator *(Regulator role only)*
Switch between two modes:
- **Issue** — attach a certification like "FDA Approval" or "ISO 9001" to a product, link it to a document on IPFS, and optionally set an expiry date
- **Revoke** — if a certification is no longer valid, enter its ID and revoke it

### Admin *(only the account that deployed the contracts)*
- **Grant Role** — pick an address and assign it a role (Producer, Distributor, Retailer, or Regulator)
- **Check Roles** — paste any address to see what roles it currently has
- There's also a handy table showing the default Hardhat test account addresses

---

## Deploying to Sepolia testnet

If you want to run this on a real public testnet instead of locally:

1. Create a `.env` file in the root folder (copy from `.env.example`):

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<YOUR_INFURA_KEY>
PRIVATE_KEY=<YOUR_WALLET_PRIVATE_KEY>
```

2. Get some free Sepolia ETH from a faucet (search "Sepolia faucet").

3. Deploy:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

4. Update `frontend/.env` with the new addresses the deploy script prints.

5. In `useContracts.js`, change the `readProvider` URL from `http://127.0.0.1:8545` to a Sepolia RPC URL so read-only lookups work without MetaMask.

---

## Simulated IoT data

Run this Python script to generate fake sensor readings (temperature, humidity, GPS) tied to product IDs — it simulates what a real hardware sensor would send:

```bash
python scripts/simulate_iot.py
```

Press `Ctrl+C` to stop it. In a real production system these readings would be pushed on-chain by an oracle service like Chainlink.

---

## Something not working? Check here first

| Problem | What to do |
|---|---|
| "MetaMask not detected" | Make sure MetaMask is installed in your browser, then refresh the page |
| "product not found" when doing a lookup | Run `seed.js` first, or register a product using the Register tab |
| "not a producer" or any role error | Switch to account #0 in MetaMask, go to the Admin tab, and grant yourself the right role |
| Transactions spin forever or fail | Check that MetaMask is on the **Hardhat Local** network (Chain ID 31337) and not on mainnet |
| Old data showing up after a restart | When you restart `npx hardhat node` the blockchain resets. Run `deploy.js` and `seed.js` again and update `frontend/.env` |
| Env variable changes not working | After editing `frontend/.env` you have to stop and restart `npm run dev` |

---

## References

1. S. Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System," 2008.
2. V. Buterin, "Ethereum White Paper: A Next-Generation Smart Contract Platform," 2014.
3. F. Tian, "An Agri-food Supply Chain Traceability System Based on RFID and Blockchain," ICSSSM, 2016.
4. S. Saberi et al., "Blockchain Technology and Sustainable Supply Chain Management," Int. J. Prod. Res., 2019.
5. J. Benet, "IPFS: Content Addressed, Versioned, P2P File System," arXiv:1407.3561, 2014.
