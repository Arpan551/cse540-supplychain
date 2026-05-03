// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

/**
 * @title VerificationLog
 *
 * This contract handles certifications — things like "FDA Approved" or "ISO 9001".
 * Only regulators can issue or revoke them. Anyone can read them.
 *
 * Why is this a separate contract from ProductRegistry?
 *
 * Certifications have their own life cycle — a regulator might issue a cert
 * months after a product was registered, or revoke one after a failed inspection.
 * Mixing this logic into ProductRegistry would make that contract harder to
 * understand and harder to change later. Keeping it separate means we can
 * update certification rules without touching the product tracking code.
 *
 * Why store an IPFS CID instead of the actual certificate?
 *
 * A certificate PDF can be several megabytes. Storing that on Ethereum would
 * cost an enormous amount in gas. So the actual file goes on IPFS (we use Pinata
 * to keep it pinned and available). We just store the file's unique fingerprint
 * (the CID) on-chain. If anyone tries to swap the certificate document with a
 * fake one, the fingerprint won't match anymore — instant tamper detection.
 */
contract VerificationLog {

    // We ask AccessControl to check if the caller is a regulator before sensitive actions
    SupplyChainAccessControl public accessControl;

    // ── What a certification looks like ──────────────────────────────────────

    struct Certification {
        uint256 productId;    // which product this cert belongs to
        address issuedBy;     // the regulator's wallet address
        string  certType;     // a human-readable label like "FDA Approval" or "CE Mark"
        string  documentCID;  // IPFS fingerprint of the actual certificate document
        bool    isValid;      // starts as true, becomes false if revoked
        uint256 issuedAt;
        uint256 expiresAt;    // set to 0 if the cert never expires
    }

    // ── Storage ──────────────────────────────────────────────────────────────

    uint256 private _certCounter;
    mapping(uint256 => Certification) private _certifications;   // certId → certification data

    // We also keep a lookup from product to all its cert IDs so we can fetch
    // everything for a product in one call, without scanning the whole mapping.
    mapping(uint256 => uint256[]) private _productCerts;          // productId → list of certIds

    // ── Events ───────────────────────────────────────────────────────────────

    event CertificationIssued(
        uint256 indexed certId,
        uint256 indexed productId,
        address indexed issuedBy,
        string certType,
        string documentCID
    );
    event CertificationRevoked(
        uint256 indexed certId,
        uint256 indexed productId,
        address indexed revokedBy
    );

    constructor(address accessControlAddress) {
        accessControl = SupplyChainAccessControl(accessControlAddress);
    }

    // ── Guards ───────────────────────────────────────────────────────────────

    // Only regulators can issue or revoke certifications
    modifier onlyRegulator() {
        require(accessControl.isRegulator(msg.sender), "not a regulator");
        _;
    }

    // Stops people from trying to look up or revoke a cert that was never issued
    modifier certExists(uint256 certId) {
        require(_certifications[certId].issuedAt != 0, "cert not found");
        _;
    }

    // ── Actions ──────────────────────────────────────────────────────────────

    /**
     * @notice A regulator issues a certification for a product.
     *
     * The regulator uploads their certificate document to IPFS first, then passes
     * the resulting CID here. We store the CID on-chain so anyone can verify that
     * the document hasn't been tampered with by comparing the IPFS fingerprint.
     */
    function issueCertification(
        uint256 productId,
        string calldata certType,
        string calldata documentCID,
        uint256 expiresAt
    ) external onlyRegulator returns (uint256 certId) {
        require(bytes(certType).length > 0,    "certType cannot be empty");
        require(bytes(documentCID).length > 0, "documentCID cannot be empty");

        _certCounter++;
        certId = _certCounter;

        _certifications[certId] = Certification({
            productId:   productId,
            issuedBy:    msg.sender,
            certType:    certType,
            documentCID: documentCID,
            isValid:     true,
            issuedAt:    block.timestamp,
            expiresAt:   expiresAt
        });

        // Register this cert ID under the product so getCertificationsForProduct() can find it
        _productCerts[productId].push(certId);

        emit CertificationIssued(certId, productId, msg.sender, certType, documentCID);
    }

    /**
     * @notice A regulator marks a certification as no longer valid.
     *
     * This might happen after a failed re-inspection, a product recall, or the
     * discovery of fraud. Revocation is permanent — we don't allow un-revoking
     * because that would make the history ambiguous and hard to trust.
     */
    function revokeCertification(uint256 certId) external onlyRegulator certExists(certId) {
        require(_certifications[certId].isValid, "already revoked");
        _certifications[certId].isValid = false;
        emit CertificationRevoked(certId, _certifications[certId].productId, msg.sender);
    }

    // ── Reading data (anyone can call these) ─────────────────────────────────

    // Returns everything about a single certification by its ID
    function getCertification(uint256 certId) external view certExists(certId) returns (Certification memory) {
        return _certifications[certId];
    }

    // Returns a list of cert IDs for a product — the frontend then fetches each one individually
    function getCertificationsForProduct(uint256 productId) external view returns (uint256[] memory) {
        return _productCerts[productId];
    }

    // Returns the total number of certifications issued — useful for statistics
    function totalCertifications() external view returns (uint256) {
        return _certCounter;
    }
}
