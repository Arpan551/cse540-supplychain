// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

/**
 * @title ProductRegistry
 * @notice Core contract for tracking products through the supply chain.
 * Producers register products, distributors transfer custody,
 * retailers confirm delivery. All changes are logged on-chain permanently.
 */
contract ProductRegistry {

    // Reference to AccessControl for checking roles
    SupplyChainAccessControl public accessControl;

    // --- Data Structures ---

    // Lifecycle stages a product can be in
    enum Status {
        Registered,  // just created by producer
        Shipped,     // handed off to distributor
        InStorage,   // sitting in a warehouse
        Delivered,   // reached the end destination
        Flagged      // under investigation
    }

    // All info stored for a single product
    struct Product {
        uint256 id;
        string  batchId;        // producer's batch label
        address currentOwner;   // who currently holds custody
        Status  status;
        string  metadataCID;    // IPFS link to docs (certs, images, etc.)
        uint256 createdAt;
        uint256 updatedAt;
    }

    // A single entry in the product's provenance trail
    struct HistoryEntry {
        address actor;          // who made this change
        Status  statusBefore;
        Status  statusAfter;
        string  note;           // optional context (location, condition, etc.)
        uint256 timestamp;
    }

    // --- State ---

    uint256 private _productCounter;
    mapping(uint256 => Product)        private _products;
    mapping(uint256 => HistoryEntry[]) private _history;

    // --- Events ---

    event ProductRegistered(uint256 indexed productId, string batchId, address indexed producer, string metadataCID);
    event CustodyTransferred(uint256 indexed productId, address indexed from, address indexed to);
    event StatusUpdated(uint256 indexed productId, Status newStatus, address indexed updatedBy);
    event DeliveryConfirmed(uint256 indexed productId, address indexed retailer);

    // Takes AccessControl contract address on deploy
    constructor(address accessControlAddress) {
        accessControl = SupplyChainAccessControl(accessControlAddress);
    }

    // --- Modifiers ---

    modifier onlyProducer() {
        require(accessControl.isProducer(msg.sender), "not a producer");
        _;
    }

    modifier onlyDistributor() {
        require(accessControl.isDistributor(msg.sender), "not a distributor");
        _;
    }

    modifier onlyRetailer() {
        require(accessControl.isRetailer(msg.sender), "not a retailer");
        _;
    }

    modifier productExists(uint256 productId) {
        require(_products[productId].createdAt != 0, "product not found");
        _;
    }

    // --- Write Functions ---

    // Producer registers a new product and gets back its on-chain ID
    function registerProduct(
        string calldata batchId,
        string calldata metadataCID
    ) external onlyProducer returns (uint256 productId) {
        require(bytes(batchId).length > 0, "batchId cannot be empty");

        _productCounter++;
        productId = _productCounter;

        _products[productId] = Product({
            id:           productId,
            batchId:      batchId,
            currentOwner: msg.sender,
            status:       Status.Registered,
            metadataCID:  metadataCID,
            createdAt:    block.timestamp,
            updatedAt:    block.timestamp
        });

        _history[productId].push(HistoryEntry({
            actor:        msg.sender,
            statusBefore: Status.Registered,
            statusAfter:  Status.Registered,
            note:         "Product registered by producer",
            timestamp:    block.timestamp
        }));

        emit ProductRegistered(productId, batchId, msg.sender, metadataCID);
    }

    // Distributor hands off custody to the next party in the chain
    function transferCustody(
        uint256 productId,
        address newOwner,
        string calldata note
    ) external onlyDistributor productExists(productId) {
        require(newOwner != address(0), "invalid address");
        require(_products[productId].currentOwner == msg.sender, "not current owner");

        address prev      = _products[productId].currentOwner;
        Status prevStatus = _products[productId].status;

        _products[productId].currentOwner = newOwner;
        _products[productId].status       = Status.Shipped;
        _products[productId].updatedAt    = block.timestamp;

        _history[productId].push(HistoryEntry(msg.sender, prevStatus, Status.Shipped, note, block.timestamp));

        emit CustodyTransferred(productId, prev, newOwner);
        emit StatusUpdated(productId, Status.Shipped, msg.sender);
    }

    // Any authorized stakeholder can log a status change with an optional note
    function updateStatus(
        uint256 productId,
        Status  newStatus,
        string calldata note
    ) external productExists(productId) {
        bool authorized = accessControl.isProducer(msg.sender)
            || accessControl.isDistributor(msg.sender)
            || accessControl.isRetailer(msg.sender)
            || accessControl.isRegulator(msg.sender);
        require(authorized, "not an authorized stakeholder");

        Status prev = _products[productId].status;
        _products[productId].status    = newStatus;
        _products[productId].updatedAt = block.timestamp;

        _history[productId].push(HistoryEntry(msg.sender, prev, newStatus, note, block.timestamp));

        emit StatusUpdated(productId, newStatus, msg.sender);
    }

    // Retailer marks the product as delivered at the final destination
    function confirmDelivery(
        uint256 productId,
        string calldata note
    ) external onlyRetailer productExists(productId) {
        Status prev = _products[productId].status;

        _products[productId].status    = Status.Delivered;
        _products[productId].updatedAt = block.timestamp;

        _history[productId].push(HistoryEntry(msg.sender, prev, Status.Delivered, note, block.timestamp));

        emit DeliveryConfirmed(productId, msg.sender);
        emit StatusUpdated(productId, Status.Delivered, msg.sender);
    }

    // --- Read Functions (open to everyone) ---

    // Returns current product data
    function getProduct(uint256 productId) external view productExists(productId) returns (Product memory) {
        return _products[productId];
    }

    // Returns the full history trail for a product in chronological order
    function getHistory(uint256 productId) external view productExists(productId) returns (HistoryEntry[] memory) {
        return _history[productId];
    }

    // Returns how many products have been registered so far
    function totalProducts() external view returns (uint256) {
        return _productCounter;
    }
}