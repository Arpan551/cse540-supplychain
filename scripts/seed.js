// scripts/seed.js
// Seeds the local Hardhat network with demo data for a live demonstration.
//
// What this script does:
//   1. Reads deployed-addresses.json (created by deploy.js)
//   2. Assigns stakeholder roles to Hardhat test accounts
//   3. Registers three products as Producer
//   4. Walks Product #1 through the full supply chain (Producer → Distributor → Retailer)
//   5. Issues a certification for Product #1 as Regulator
//   6. Registers Product #2 and flags it (simulating a recall / QC failure)
//
// Usage:
//   npx hardhat node                              (terminal 1 — leave running)
//   npx hardhat run scripts/deploy.js --network localhost  (terminal 2)
//   npx hardhat run scripts/seed.js   --network localhost  (terminal 2)

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Load deployed addresses
  const addrFile = path.join(__dirname, "..", "deployed-addresses.json");
  if (!fs.existsSync(addrFile)) {
    throw new Error("deployed-addresses.json not found. Run deploy.js first.");
  }
  const addresses = JSON.parse(fs.readFileSync(addrFile, "utf8"));

  const signers = await ethers.getSigners();
  const [admin, producer, distributor, retailer, regulator] = signers;

  console.log("=== Supply Chain Demo Seed ===");
  console.log("Admin:      ", admin.address);
  console.log("Producer:   ", producer.address);
  console.log("Distributor:", distributor.address);
  console.log("Retailer:   ", retailer.address);
  console.log("Regulator:  ", regulator.address);
  console.log();

  // Attach to deployed contracts
  const AC = await ethers.getContractFactory("SupplyChainAccessControl");
  const accessControl = AC.attach(addresses.accessControl);

  const PR = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = PR.attach(addresses.productRegistry);

  const VL = await ethers.getContractFactory("VerificationLog");
  const verificationLog = VL.attach(addresses.verificationLog);

  // ── Step 1: Assign roles ──────────────────────────────────────────────────
  console.log("Assigning roles...");
  await (await accessControl.connect(admin).addProducer(producer.address)).wait();
  await (await accessControl.connect(admin).addDistributor(distributor.address)).wait();
  await (await accessControl.connect(admin).addRetailer(retailer.address)).wait();
  await (await accessControl.connect(admin).addRegulator(regulator.address)).wait();
  console.log("Roles assigned.");
  console.log();

  // ── Step 2: Register three products ──────────────────────────────────────
  console.log("Registering products...");

  const tx1 = await productRegistry.connect(producer)
    .registerProduct("BATCH-PHARMA-2024-A", "ipfs://QmPharmaDoc1");
  const r1 = await tx1.wait();
  console.log("  Product #1 registered (Pharma Batch A) — tx:", r1.hash);

  const tx2 = await productRegistry.connect(producer)
    .registerProduct("BATCH-FOOD-2024-B", "ipfs://QmFoodDoc2");
  const r2 = await tx2.wait();
  console.log("  Product #2 registered (Food Batch B) — tx:", r2.hash);

  const tx3 = await productRegistry.connect(producer)
    .registerProduct("BATCH-LUXURY-2024-C", "ipfs://QmLuxuryDoc3");
  const r3 = await tx3.wait();
  console.log("  Product #3 registered (Luxury Goods C) — tx:", r3.hash);
  console.log();

  // ── Step 3: Full journey for Product #1 ──────────────────────────────────
  console.log("Walking Product #1 through the full supply chain...");

  // Producer → Distributor
  await (await productRegistry.connect(producer).transferCustody(
    1, distributor.address, "Shipped from manufacturing plant, Chicago IL"
  )).wait();
  console.log("  #1: Custody transferred — Producer → Distributor");

  // Distributor logs a storage event
  await (await productRegistry.connect(distributor).updateStatus(
    1, 2, "Received at cold-storage warehouse, Memphis TN"  // Status.InStorage = 2
  )).wait();
  console.log("  #1: Status updated — InStorage");

  // Distributor → Retailer
  await (await productRegistry.connect(distributor).transferCustody(
    1, retailer.address, "Last-mile delivery dispatched"
  )).wait();
  console.log("  #1: Custody transferred — Distributor → Retailer");

  // Retailer confirms delivery
  await (await productRegistry.connect(retailer).confirmDelivery(
    1, "Received and shelved at retail store, Austin TX"
  )).wait();
  console.log("  #1: Delivery confirmed — product is Delivered");
  console.log();

  // ── Step 4: Regulator certifies Product #1 ───────────────────────────────
  console.log("Issuing certification for Product #1...");
  await (await verificationLog.connect(regulator).issueCertification(
    1,
    "FDA Approval",
    "ipfs://QmFDAApprovalDoc",
    0  // no expiry
  )).wait();
  console.log("  Cert #1 issued: FDA Approval for Product #1");
  console.log();

  // ── Step 5: Flag Product #2 (simulate a QC problem) ──────────────────────
  console.log("Flagging Product #2 (simulated recall)...");
  await (await productRegistry.connect(regulator).updateStatus(
    2, 4, "Flagged after quality inspection failure — batch recalled"  // Status.Flagged = 4
  )).wait();
  console.log("  Product #2 status set to Flagged");
  console.log();

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("=== Seed complete ===");
  console.log("You can now open the frontend and look up products 1, 2, and 3.");
  console.log("Product 1: full journey (Registered → Shipped → InStorage → Delivered) + FDA cert");
  console.log("Product 2: Flagged (simulated recall)");
  console.log("Product 3: Registered only (in production)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
