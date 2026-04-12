// test/ProductRegistry.test.js
// Unit tests for ProductRegistry covering the full supply chain flow.
// Run with: npx hardhat test

const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("ProductRegistry", function () {
  let accessControl, productRegistry;
  let deployer, producer, distributor, retailer, regulator, consumer;

  beforeEach(async function () {
    [deployer, producer, distributor, retailer, regulator, consumer] =
      await ethers.getSigners();

    const AC = await ethers.getContractFactory("SupplyChainAccessControl");
    accessControl = await AC.deploy();

    await accessControl.addProducer(producer.address);
    await accessControl.addDistributor(distributor.address);
    await accessControl.addRetailer(retailer.address);
    await accessControl.addRegulator(regulator.address);

    const PR = await ethers.getContractFactory("ProductRegistry");
    productRegistry = await PR.deploy(await accessControl.getAddress());
  });

  // ── Registration ──────────────────────────────────────────────────────────

  it("allows a producer to register a product", async function () {
    await expect(
      productRegistry.connect(producer).registerProduct("BATCH-001", "ipfs://QmTest")
    ).to.emit(productRegistry, "ProductRegistered");

    const product = await productRegistry.getProduct(1);
    expect(product.batchId).to.equal("BATCH-001");
    expect(product.currentOwner).to.equal(producer.address);
    expect(product.status).to.equal(0); // Status.Registered
  });

  it("rejects registration from a non-producer", async function () {
    await expect(
      productRegistry.connect(consumer).registerProduct("BATCH-002", "ipfs://QmTest")
    ).to.be.revertedWith("not a producer");
  });

  it("rejects empty batchId", async function () {
    await expect(
      productRegistry.connect(producer).registerProduct("", "ipfs://QmTest")
    ).to.be.revertedWith("batchId cannot be empty");
  });

  it("increments totalProducts on each registration", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-A", "ipfs://Qm1");
    await productRegistry.connect(producer).registerProduct("BATCH-B", "ipfs://Qm2");
    expect(await productRegistry.totalProducts()).to.equal(2);
  });

  // ── Custody Transfer ──────────────────────────────────────────────────────

  it("allows producer to transfer custody to a distributor", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-003", "ipfs://QmTest");

    await expect(
      productRegistry.connect(producer).transferCustody(
        1, distributor.address, "Shipped from factory"
      )
    )
      .to.emit(productRegistry, "CustodyTransferred")
      .withArgs(1, producer.address, distributor.address);

    const product = await productRegistry.getProduct(1);
    expect(product.currentOwner).to.equal(distributor.address);
    expect(product.status).to.equal(1); // Status.Shipped
  });

  it("allows distributor to forward custody onward", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-004", "ipfs://QmTest");
    await productRegistry.connect(producer).transferCustody(
      1, distributor.address, "To distributor"
    );
    // Distributor now owns it and can forward to retailer (or another distributor)
    await expect(
      productRegistry.connect(distributor).transferCustody(
        1, retailer.address, "To retailer warehouse"
      )
    ).to.emit(productRegistry, "CustodyTransferred");

    const product = await productRegistry.getProduct(1);
    expect(product.currentOwner).to.equal(retailer.address);
  });

  it("rejects transfer from non-owner", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-005", "ipfs://QmTest");
    await expect(
      productRegistry.connect(distributor).transferCustody(
        1, retailer.address, "Unauthorized"
      )
    ).to.be.revertedWith("not current owner");
  });

  it("rejects transfer by unauthorized role (consumer)", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-006", "ipfs://QmTest");
    await expect(
      productRegistry.connect(consumer).transferCustody(
        1, retailer.address, "Unauthorized"
      )
    ).to.be.revertedWith("not a producer or distributor");
  });

  // ── Status Update ─────────────────────────────────────────────────────────

  it("allows an authorized stakeholder to update product status", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-007", "ipfs://QmTest");
    await expect(
      productRegistry.connect(producer).updateStatus(1, 2, "Moved to cold storage")
    ).to.emit(productRegistry, "StatusUpdated").withArgs(1, 2, producer.address);
  });

  it("allows regulator to update status", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-008", "ipfs://QmTest");
    await expect(
      productRegistry.connect(regulator).updateStatus(1, 4, "Flagged for inspection")
    ).to.emit(productRegistry, "StatusUpdated");
  });

  it("rejects status update from consumer", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-009", "ipfs://QmTest");
    await expect(
      productRegistry.connect(consumer).updateStatus(1, 1, "Unauthorized")
    ).to.be.revertedWith("not an authorized stakeholder");
  });

  // ── Delivery Confirmation ─────────────────────────────────────────────────

  it("allows retailer to confirm delivery", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-010", "ipfs://QmTest");
    await expect(
      productRegistry.connect(retailer).confirmDelivery(1, "Received at store")
    ).to.emit(productRegistry, "DeliveryConfirmed").withArgs(1, retailer.address);

    const product = await productRegistry.getProduct(1);
    expect(product.status).to.equal(3); // Status.Delivered
  });

  it("rejects delivery confirmation from non-retailer", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-011", "ipfs://QmTest");
    await expect(
      productRegistry.connect(consumer).confirmDelivery(1, "Unauthorized")
    ).to.be.revertedWith("not a retailer");
  });

  // ── Full Supply Chain Flow ────────────────────────────────────────────────

  it("records provenance history across the full supply chain", async function () {
    // 1. Producer registers
    await productRegistry.connect(producer).registerProduct("BATCH-FULL", "ipfs://QmDoc");
    // 2. Producer ships to distributor
    await productRegistry.connect(producer).transferCustody(
      1, distributor.address, "Left factory"
    );
    // 3. Distributor ships to retailer
    await productRegistry.connect(distributor).transferCustody(
      1, retailer.address, "Arrived at distribution center"
    );
    // 4. Retailer confirms delivery
    await productRegistry.connect(retailer).confirmDelivery(1, "On shelf");

    const history = await productRegistry.getHistory(1);
    expect(history.length).to.equal(4);
    expect(history[0].note).to.equal("Product registered by producer");
    expect(history[3].note).to.equal("On shelf");

    const product = await productRegistry.getProduct(1);
    expect(product.status).to.equal(3); // Delivered
  });

  // ── Read Functions ────────────────────────────────────────────────────────

  it("returns provenance history starting with the registration entry", async function () {
    await productRegistry.connect(producer).registerProduct("BATCH-H", "ipfs://QmTest");
    const history = await productRegistry.getHistory(1);
    expect(history.length).to.equal(1);
    expect(history[0].note).to.equal("Product registered by producer");
  });

  it("reverts getProduct for a non-existent product ID", async function () {
    await expect(productRegistry.getProduct(999))
      .to.be.revertedWith("product not found");
  });

  it("reverts getHistory for a non-existent product ID", async function () {
    await expect(productRegistry.getHistory(999))
      .to.be.revertedWith("product not found");
  });
});
