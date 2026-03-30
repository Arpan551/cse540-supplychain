// scripts/deploy.js
// Deploys all three contracts in the correct order:
//   1. SupplyChainAccessControl  (no dependencies)
//   2. ProductRegistry           (depends on AccessControl address)
//   3. VerificationLog           (depends on AccessControl address)
//
// Usage:
//   npx hardhat run scripts/deploy.js --network localhost
//   npx hardhat run scripts/deploy.js --network sepolia

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy AccessControl
  const AccessControl = await ethers.getContractFactory("SupplyChainAccessControl");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  console.log("SupplyChainAccessControl deployed to:", await accessControl.getAddress());

  // 2. Deploy ProductRegistry, passing AccessControl address
  const ProductRegistry = await ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistry.deploy(await accessControl.getAddress());
  await productRegistry.waitForDeployment();
  console.log("ProductRegistry deployed to:          ", await productRegistry.getAddress());

  // 3. Deploy VerificationLog, passing AccessControl address
  const VerificationLog = await ethers.getContractFactory("VerificationLog");
  const verificationLog = await VerificationLog.deploy(await accessControl.getAddress());
  await verificationLog.waitForDeployment();
  console.log("VerificationLog deployed to:          ", await verificationLog.getAddress());

  console.log("\nDeployment complete. Update your frontend .env with the above addresses.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
