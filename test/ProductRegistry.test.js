// test/ProductRegistry.test.js
// Basic unit tests for the ProductRegistry contract.
// Run with: npx hardhat test

const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("ProductRegistry", function () {
  let accessControl, productRegistry;
  let deployer, producer, distributor, retailer, consumer;

  // Deploy fresh contracts before each test
  beforeEach(async function () {
    [deployer, producer, distributor, retailer, consumer] = await ethers.getSigners();

    // Deploy AccessControl and assign roles
    const AC = await ethers.getContractFactory("SupplyChainAccessControl");
    accessControl = await AC.deploy();

    await accessControl.addProducer(producer.address);
    await accessControl.addDistributor(distributor.address);
    await accessControl.addRetailer(retailer.address);

    // Deploy ProductRegistry with AccessControl address
    const PR = await ethers.getContractFactory("ProductRegistry");
    productRegistry = await PR.deploy(await accessControl.getAddress());
  });

  // ── Registration ──────────────────────────────────────────────────────────

  it("should allow a producer to register a product", async function () {
    await expect(
      productRegistry.connect(producer).registerProduct("BATCH-001", "ipfs://Qm...")
    ).to.emit(productRegistry, "ProductRegistered");

    const product = await productRegistry.getProduct(1);
    expect(product.batchId).to.equal("BATCH-001");
    expect(product.currentOwner).to.equal(producer.address);
  });

  it("should reject registration from a non-producer address", async function () {
    await expect(
      productRegistry.connect(consumer).registerProduct("BATCH-002", "ipfs://Qm...")
    ).to.be.revertedWith("ProductRegistry: caller is not a producer");
  });

  // ── Custody Transfer ──────────────────────────────────────────────────────

  it("should allow a distributor to transfer custody", async function () {
    // Producer registers first
    await productRegistry.connect(producer).registerProduct("BATCH-003", "ipfs://Qm...");

    // Simulate custody starting with distributor
    // (In a real flow, producer transfers to distributor first)
    // For this draft test we override the owner via a status update scenario.
    // Full ownership flow test to be added in midterm sprint.
  });

  // ── Status Update ─────────────────────────────────────────────────────────

  it("should allow an authorized stakeholder to update product status", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-004", "ipfs://Qm...");

    await expect(
      productRegistry.connect(producer).updateStatus(1, 1, "Shipped from warehouse A")
    ).to.emit(productRegistry, "StatusUpdated");
  });

  // ── Read Functions ────────────────────────────────────────────────────────

  it("should return the provenance history for a product", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-005", "ipfs://Qm...");
    const history = await productRegistry.getHistory(1);
    expect(history.length).to.equal(1);
    expect(history[0].note).to.equal("Product registered by producer");
  });

  it("should revert getProduct for a non-existent product ID", async function () {
    await expect(productRegistry.getProduct(999))
      .to.be.revertedWith("ProductRegistry: product does not exist");
  });
});
