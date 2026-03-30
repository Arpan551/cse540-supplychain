// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SupplyChainAccessControl
 * @notice Manages roles for supply chain participants.
 * Admin (deployer) can grant/revoke roles for producers,
 * distributors, retailers, and regulators.
 */
contract SupplyChainAccessControl is AccessControl {

    // Role identifiers for each stakeholder type
    bytes32 public constant PRODUCER_ROLE    = keccak256("PRODUCER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE    = keccak256("RETAILER_ROLE");
    bytes32 public constant REGULATOR_ROLE   = keccak256("REGULATOR_ROLE");

    // Deployer gets admin rights to manage all roles
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // --- Assign Roles (admin only) ---

    // Grant producer role - allows registering new products
    function addProducer(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PRODUCER_ROLE, account);
    }

    // Grant distributor role - allows recording shipments and custody transfers
    function addDistributor(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(DISTRIBUTOR_ROLE, account);
    }

    // Grant retailer role - allows confirming receipt and delivery
    function addRetailer(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(RETAILER_ROLE, account);
    }

    // Grant regulator role - allows issuing certifications and auditing records
    function addRegulator(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(REGULATOR_ROLE, account);
    }

    // --- Role Checks (called by other contracts to verify permissions) ---

    function isProducer(address account)    external view returns (bool) { return hasRole(PRODUCER_ROLE, account); }
    function isDistributor(address account) external view returns (bool) { return hasRole(DISTRIBUTOR_ROLE, account); }
    function isRetailer(address account)    external view returns (bool) { return hasRole(RETAILER_ROLE, account); }
    function isRegulator(address account)   external view returns (bool) { return hasRole(REGULATOR_ROLE, account); }
}