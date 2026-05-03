// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SupplyChainAccessControl
 *
 * This contract is basically the "bouncer" for the whole system.
 * Before anyone can do anything important (register a product, transfer it,
 * issue a certification), the other contracts ask this one: "is this person
 * allowed to do that?"
 *
 * We put all the role logic here in one place so that:
 * - If you want to add or remove someone's access, you only change it here
 *   and it takes effect everywhere at once.
 * - The product and certification contracts stay clean — they just call
 *   isProducer(), isDistributor(), etc. instead of managing roles themselves.
 *
 * The five roles in this system:
 *   PRODUCER_ROLE    — factories/manufacturers, can register new products
 *   DISTRIBUTOR_ROLE — shipping companies, can transfer products between people
 *   RETAILER_ROLE    — stores, can mark products as delivered
 *   REGULATOR_ROLE   — government/quality agencies, can issue and revoke certifications
 *   DEFAULT_ADMIN    — the account that deployed the contracts, manages all the above roles
 *
 * Regular consumers don't need a role — they can read product data without one.
 */
contract SupplyChainAccessControl is AccessControl {

    // These are unique IDs for each role, created by hashing the role name.
    // OpenZeppelin uses these hashes internally to track who has what role.
    bytes32 public constant PRODUCER_ROLE    = keccak256("PRODUCER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE    = keccak256("RETAILER_ROLE");
    bytes32 public constant REGULATOR_ROLE   = keccak256("REGULATOR_ROLE");

    // When this contract is deployed, the deployer automatically becomes the admin.
    // The admin is the only one who can hand out roles to other people.
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ── Giving people roles (only the admin can do this) ─────────────────────

    // Give someone the Producer role so they can register products
    function addProducer(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PRODUCER_ROLE, account);
    }

    // Give someone the Distributor role so they can record shipments
    function addDistributor(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(DISTRIBUTOR_ROLE, account);
    }

    // Give someone the Retailer role so they can confirm deliveries
    function addRetailer(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(RETAILER_ROLE, account);
    }

    // Give someone the Regulator role so they can issue and revoke certifications
    function addRegulator(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(REGULATOR_ROLE, account);
    }

    // ── Role checks (used by the other contracts) ─────────────────────────────
    // These are simple yes/no questions that ProductRegistry and VerificationLog
    // call before allowing sensitive actions.

    function isProducer(address account)    external view returns (bool) { return hasRole(PRODUCER_ROLE, account); }
    function isDistributor(address account) external view returns (bool) { return hasRole(DISTRIBUTOR_ROLE, account); }
    function isRetailer(address account)    external view returns (bool) { return hasRole(RETAILER_ROLE, account); }
    function isRegulator(address account)   external view returns (bool) { return hasRole(REGULATOR_ROLE, account); }
}
