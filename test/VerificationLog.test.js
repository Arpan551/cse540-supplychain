// test/VerificationLog.test.js
// Unit tests for VerificationLog: cert issuance and revocation.
// Run with: npx hardhat test

const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("VerificationLog", function () {
  let accessControl, verificationLog;
  let deployer, regulator, other;

  beforeEach(async function () {
    [deployer, regulator, other] = await ethers.getSigners();

    const AC = await ethers.getContractFactory("SupplyChainAccessControl");
    accessControl = await AC.deploy();
    await accessControl.addRegulator(regulator.address);

    const VL = await ethers.getContractFactory("VerificationLog");
    verificationLog = await VL.deploy(await accessControl.getAddress());
  });

  it("allows a regulator to issue a certification", async function () {
    await expect(
      verificationLog.connect(regulator).issueCertification(
        1, "ISO 9001", "ipfs://QmCertDoc", 0
      )
    ).to.emit(verificationLog, "CertificationIssued");

    const cert = await verificationLog.getCertification(1);
    expect(cert.certType).to.equal("ISO 9001");
    expect(cert.isValid).to.equal(true);
    expect(cert.productId).to.equal(1);
    expect(cert.issuedBy).to.equal(regulator.address);
  });

  it("rejects certification from a non-regulator", async function () {
    await expect(
      verificationLog.connect(other).issueCertification(
        1, "ISO 9001", "ipfs://QmCertDoc", 0
      )
    ).to.be.revertedWith("not a regulator");
  });

  it("rejects empty certType", async function () {
    await expect(
      verificationLog.connect(regulator).issueCertification(1, "", "ipfs://QmDoc", 0)
    ).to.be.revertedWith("certType cannot be empty");
  });

  it("rejects empty documentCID", async function () {
    await expect(
      verificationLog.connect(regulator).issueCertification(1, "ISO", "", 0)
    ).to.be.revertedWith("documentCID cannot be empty");
  });

  it("links multiple certs to the same product", async function () {
    await verificationLog.connect(regulator).issueCertification(
      42, "ISO 9001", "ipfs://QmDoc1", 0
    );
    await verificationLog.connect(regulator).issueCertification(
      42, "FDA Approval", "ipfs://QmDoc2", 0
    );

    const certIds = await verificationLog.getCertificationsForProduct(42);
    expect(certIds.length).to.equal(2);
  });

  it("allows a regulator to revoke a certification", async function () {
    await verificationLog.connect(regulator).issueCertification(
      1, "ISO 9001", "ipfs://QmDoc", 0
    );
    await expect(
      verificationLog.connect(regulator).revokeCertification(1)
    ).to.emit(verificationLog, "CertificationRevoked");

    const cert = await verificationLog.getCertification(1);
    expect(cert.isValid).to.equal(false);
  });

  it("rejects revoking an already-revoked certification", async function () {
    await verificationLog.connect(regulator).issueCertification(
      1, "ISO 9001", "ipfs://QmDoc", 0
    );
    await verificationLog.connect(regulator).revokeCertification(1);
    await expect(
      verificationLog.connect(regulator).revokeCertification(1)
    ).to.be.revertedWith("already revoked");
  });

  it("rejects revoking a non-existent cert", async function () {
    await expect(
      verificationLog.connect(regulator).revokeCertification(999)
    ).to.be.revertedWith("cert not found");
  });

  it("tracks totalCertifications correctly", async function () {
    await verificationLog.connect(regulator).issueCertification(1, "A", "ipfs://1", 0);
    await verificationLog.connect(regulator).issueCertification(2, "B", "ipfs://2", 0);
    expect(await verificationLog.totalCertifications()).to.equal(2);
  });
});
