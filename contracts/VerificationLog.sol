// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

/**
 * @title VerificationLog
 * @notice Stores regulatory certifications and quality approvals for products.
 * Only regulators can issue or revoke certs. The actual documents live on
 * IPFS; we just store the CID here so no one can tamper with them.
 */
contract VerificationLog {

    // Reference to AccessControl for role checks
    SupplyChainAccessControl public accessControl;

    // --- Data Structures ---

    // A single certification record tied to a product
    struct Certification {
        uint256 productId;    // which product this cert is for
        address issuedBy;     // regulator who issued it
        string  certType;     // e.g. "ISO 9001", "FDA Approval"
        string  documentCID;  // IPFS link to the actual certificate file
        bool    isValid;      // false if revoked
        uint256 issuedAt;
        uint256 expiresAt;    // 0 means no expiry
    }

    // --- State ---

    uint256 private _certCounter;
    mapping(uint256 => Certification) private _certifications;
    mapping(uint256 => uint256[])     private _productCerts; // productId => certIds

    // --- Events ---

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

    // Takes AccessControl address on deploy
    constructor(address accessControlAddress) {
        accessControl = SupplyChainAccessControl(accessControlAddress);
    }

    // --- Modifiers ---

    modifier onlyRegulator() {
        require(accessControl.isRegulator(msg.sender), "not a regulator");
        _;
    }

    modifier certExists(uint256 certId) {
        require(_certifications[certId].issuedAt != 0, "cert not found");
        _;
    }

    // --- Write Functions ---

    // Regulator issues a cert for a product and links it to an IPFS document
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

        _productCerts[productId].push(certId);

        emit CertificationIssued(certId, productId, msg.sender, certType, documentCID);
    }

    // Regulator marks a cert as invalid (e.g. after a failed re-inspection)
    function revokeCertification(uint256 certId) external onlyRegulator certExists(certId) {
        require(_certifications[certId].isValid, "already revoked");
        _certifications[certId].isValid = false;
        emit CertificationRevoked(certId, _certifications[certId].productId, msg.sender);
    }

    // --- Read Functions (open to everyone) ---

    // Returns the full certification record by ID
    function getCertification(uint256 certId) external view certExists(certId) returns (Certification memory) {
        return _certifications[certId];
    }

    // Returns all cert IDs linked to a product
    function getCertificationsForProduct(uint256 productId) external view returns (uint256[] memory) {
        return _productCerts[productId];
    }

    // Returns total number of certs issued across all products
    function totalCertifications() external view returns (uint256) {
        return _certCounter;
    }
}
