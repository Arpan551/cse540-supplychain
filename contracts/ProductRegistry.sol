// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

/**
 * @title ProductRegistry
 *
 * This is the main contract. It keeps track of every product in the supply chain
 * and records everything that happens to it — who registered it, who shipped it,
 * where it's been, and when it was finally delivered.
 *
 * A product goes through these stages:
 *   Registered → Shipped → InStorage → Delivered
 *   (or Flagged at any point if there's a quality problem)
 *
 * Every time something happens to a product, we add an entry to its history list.
 * That history lives on the blockchain permanently — nobody can delete or edit it.
 *
 * Why we store history in an array (not just events):
 *   We want the frontend to be able to call getHistory() and get back the whole
 *   trail in one go. If we only emitted events, the frontend would have to scan
 *   every block from the beginning to rebuild the history — that's slow and complex.
 *   Storing it on-chain costs a bit more gas but makes reading much simpler.
 *
 * Why we store an IPFS CID instead of the actual document:
 *   Putting a PDF on Ethereum would cost thousands of dollars in gas fees.
 *   Instead, documents go on IPFS and we just store the file's fingerprint (CID).
 *   If someone tampers with the document, its fingerprint changes — so you can
 *   always tell if the document has been swapped out.
 */
contract ProductRegistry {

    // We ask AccessControl before allowing any sensitive action
    SupplyChainAccessControl public accessControl;

    // ── What a product looks like ────────────────────────────────────────────

    // The stages of a product's life
    enum Status {
        Registered,  // just created by the producer
        Shipped,     // handed off to a distributor
        InStorage,   // sitting in a warehouse
        Delivered,   // made it to the final destination
        Flagged      // something is wrong — under investigation or recalled
    }

    // All the information we store for one product
    struct Product {
        uint256 id;
        string  batchId;        // the producer's own label, like "BATCH-PHARMA-2024-A"
        address currentOwner;   // the wallet address of whoever has it right now
        Status  status;
        string  metadataCID;    // IPFS fingerprint of the product's document (spec sheet, origin cert, etc.)
        uint256 createdAt;
        uint256 updatedAt;
    }

    // One entry in the product's history — records what changed and who did it
    struct HistoryEntry {
        address actor;          // the wallet that triggered this change
        Status  statusBefore;
        Status  statusAfter;
        string  note;           // optional context: location, condition, reason, etc.
        uint256 timestamp;
    }

    // ── Storage ──────────────────────────────────────────────────────────────

    uint256 private _productCounter;                          // counts up as new products are registered
    mapping(uint256 => Product)        private _products;     // productId → product data
    mapping(uint256 => HistoryEntry[]) private _history;      // productId → list of history entries

    // ── Events ───────────────────────────────────────────────────────────────
    // We emit events in addition to storing data on-chain.
    // Events are useful for external services that want to listen for activity in real time.

    event ProductRegistered(uint256 indexed productId, string batchId, address indexed producer, string metadataCID);
    event CustodyTransferred(uint256 indexed productId, address indexed from, address indexed to);
    event StatusUpdated(uint256 indexed productId, Status newStatus, address indexed updatedBy);
    event DeliveryConfirmed(uint256 indexed productId, address indexed retailer);

    // The AccessControl contract address is passed in at deploy time
    constructor(address accessControlAddress) {
        accessControl = SupplyChainAccessControl(accessControlAddress);
    }

    // ── Guards ───────────────────────────────────────────────────────────────

    // Only producers can register new products
    modifier onlyProducer() {
        require(accessControl.isProducer(msg.sender), "not a producer");
        _;
    }

    // Only retailers can confirm final delivery
    modifier onlyRetailer() {
        require(accessControl.isRetailer(msg.sender), "not a retailer");
        _;
    }

    // Stops people from trying to look up or modify a product that doesn't exist
    modifier productExists(uint256 productId) {
        require(_products[productId].createdAt != 0, "product not found");
        _;
    }

    // ── Actions ──────────────────────────────────────────────────────────────

    /**
     * @notice A producer registers a new product and gets back its unique ID.
     *
     * We immediately add a "registered" entry to the history so that even a brand
     * new product with no other activity has at least one history entry. That way
     * the timeline always shows something.
     */
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

    /**
     * @notice Hands custody of a product to someone else — marks it as Shipped.
     *
     * Two checks happen here:
     * 1. The caller must have a Producer or Distributor role.
     * 2. The caller must actually be the current owner of the product.
     *
     * The second check is important — without it, any distributor could transfer
     * someone else's product even if they don't have it.
     */
    function transferCustody(
        uint256 productId,
        address newOwner,
        string calldata note
    ) external productExists(productId) {
        bool authorized = accessControl.isProducer(msg.sender)
            || accessControl.isDistributor(msg.sender);
        require(authorized, "not a producer or distributor");
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

    /**
     * @notice Any authorized stakeholder can log a status update with a note.
     *
     * This is useful for things like:
     * - A warehouse logging "arrived at cold storage in Memphis"
     * - A regulator flagging a product: "recalled due to contamination"
     * - A distributor noting a delay: "held at customs"
     */
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

    /**
     * @notice The retailer confirms that the product has arrived.
     *
     * We made this a separate function (instead of just calling updateStatus with Delivered)
     * because we want to make sure only a Retailer can close out the journey.
     * A producer or distributor shouldn't be able to mark something as delivered
     * when it's still sitting in a warehouse.
     */
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

    // ── Reading data (anyone can call these, no wallet needed) ───────────────

    // Returns the current snapshot of a product — owner, status, metadata, timestamps
    function getProduct(uint256 productId) external view productExists(productId) returns (Product memory) {
        return _products[productId];
    }

    // Returns the full history list in order — first entry is always the registration
    function getHistory(uint256 productId) external view productExists(productId) returns (HistoryEntry[] memory) {
        return _history[productId];
    }

    // Returns how many products have been registered — used by the frontend counter in the header
    function totalProducts() external view returns (uint256) {
        return _productCounter;
    }
}
