// scripts/deploy.js
// Deploys all three contracts in the correct order:
//   1. SupplyChainAccessControl  (no dependencies)
//   2. ProductRegistry           (depends on AccessControl address)
//   3. VerificationLog           (depends on AccessControl address)
//
// After deployment, writes deployed-addresses.json so the frontend and
// seed script can pick up the addresses automatically.
//
// Usage:
//   npx hardhat run scripts/deploy.js --network localhost
//   npx hardhat run scripts/deploy.js --network sepolia

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy AccessControl
  const AccessControl = await ethers.getContractFactory("SupplyChainAccessControl");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddr = await accessControl.getAddress();
  console.log("SupplyChainAccessControl deployed to:", accessControlAddr);

  // 2. Deploy ProductRegistry, passing AccessControl address
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistry.deploy(accessControlAddr);
  await productRegistry.waitForDeployment();
  const productRegistryAddr = await productRegistry.getAddress();
  console.log("ProductRegistry deployed to:         ", productRegistryAddr);

  // 3. Deploy VerificationLog, passing AccessControl address
  const VerificationLog = await ethers.getContractFactory("VerificationLog");
  const verificationLog = await VerificationLog.deploy(accessControlAddr);
  await verificationLog.waitForDeployment();
  const verificationLogAddr = await verificationLog.getAddress();
  console.log("VerificationLog deployed to:         ", verificationLogAddr);

  // Write addresses to JSON so frontend and seed script can consume them
  const addresses = {
    network: hre.network.name,
    accessControl:   accessControlAddr,
    productRegistry: productRegistryAddr,
    verificationLog: verificationLogAddr,
  };

  const outPath = path.join(__dirname, "..", "deployed-addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to deployed-addresses.json");
  console.log("Run 'npx hardhat run scripts/seed.js --network <network>' to load demo data.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
