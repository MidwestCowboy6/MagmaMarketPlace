// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MagmaEscrow
 * @dev Escrow contract for physical item transactions on Avalanche C-Chain
 * Features:
 * - Escrow funds until delivery confirmed
 * - Real tracking API integration via oracle
 * - 7-day dispute window after delivery
 * - Adjustable platform fees
 * - Multi-carrier support (USPS, UPS, FedEx, DHL)
 */
contract MagmaEscrow is ReentrancyGuard, Ownable, Pausable {

    // ============ Enums ============

    enum OrderStatus {
        Created,           // Order created, awaiting payment
        Funded,            // Buyer has deposited funds
        Shipped,           // Seller has shipped item
        InTransit,         // Package in transit (tracking updated)
        Delivered,         // Package delivered (tracking confirmed)
        DisputeWindow,     // 7-day dispute period active
        Completed,         // Funds released to seller
        Disputed,          // Buyer opened dispute
        Refunded,          // Buyer refunded
        Cancelled          // Order cancelled
    }

    enum Carrier {
        USPS,
        UPS,
        FedEx,
        DHL,
        Other
    }

    // ============ Structs ============

    struct Order {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        uint256 platformFee;
        uint256 createdAt;
        uint256 shippedAt;
        uint256 deliveredAt;
        uint256 disputeDeadline;
        OrderStatus status;
        Carrier carrier;
        string trackingNumber;
        string itemDescription;
        string shippingAddress; // Encrypted off-chain, hash stored
    }

    struct DisputeInfo {
        uint256 orderId;
        address initiator;
        string reason;
        uint256 createdAt;
        bool resolved;
        address winner;
    }

    // ============ State Variables ============

    uint256 public orderCounter;
    uint256 public platformFeePercent = 250; // 2.5% (basis points, 10000 = 100%)
    uint256 public constant MAX_FEE_PERCENT = 1000; // Max 10%
    uint256 public constant DISPUTE_WINDOW = 7 days;
    uint256 public constant MIN_ORDER_AMOUNT = 0.001 ether; // Min order ~$0.03 at $30/AVAX

    address public feeRecipient;
    address public trackingOracle; // Oracle address for tracking updates

    mapping(uint256 => Order) public orders;
    mapping(uint256 => DisputeInfo) public disputes;
    mapping(address => uint256[]) public buyerOrders;
    mapping(address => uint256[]) public sellerOrders;
    mapping(string => uint256) public trackingToOrder; // tracking number => order ID

    uint256 public totalVolume;
    uint256 public totalFeesCollected;

    // ============ Events ============

    event OrderCreated(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        string itemDescription
    );

    event OrderFunded(uint256 indexed orderId, uint256 amount);

    event OrderShipped(
        uint256 indexed orderId,
        Carrier carrier,
        string trackingNumber
    );

    event TrackingUpdated(
        uint256 indexed orderId,
        OrderStatus newStatus,
        uint256 timestamp
    );

    event OrderDelivered(uint256 indexed orderId, uint256 deliveredAt);

    event DisputeOpened(
        uint256 indexed orderId,
        address indexed initiator,
        string reason
    );

    event DisputeResolved(
        uint256 indexed orderId,
        address winner,
        uint256 amount
    );

    event OrderCompleted(
        uint256 indexed orderId,
        uint256 sellerAmount,
        uint256 platformFee
    );

    event OrderRefunded(uint256 indexed orderId, uint256 amount);

    event OrderCancelled(uint256 indexed orderId);

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    event TrackingOracleUpdated(address oldOracle, address newOracle);

    // ============ Modifiers ============

    modifier onlyBuyer(uint256 _orderId) {
        require(orders[_orderId].buyer == msg.sender, "Not the buyer");
        _;
    }

    modifier onlySeller(uint256 _orderId) {
        require(orders[_orderId].seller == msg.sender, "Not the seller");
        _;
    }

    modifier onlyParticipant(uint256 _orderId) {
        require(
            orders[_orderId].buyer == msg.sender ||
            orders[_orderId].seller == msg.sender,
            "Not a participant"
        );
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == trackingOracle, "Not the oracle");
        _;
    }

    modifier orderExists(uint256 _orderId) {
        require(_orderId > 0 && _orderId <= orderCounter, "Order does not exist");
        _;
    }

    // ============ Constructor ============

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    // ============ Core Functions ============

    /**
     * @dev Create a new order (called by buyer)
     * @param _seller Address of the seller
     * @param _itemDescription Description of the item
     * @param _shippingAddressHash Hash of encrypted shipping address
     */
    function createOrder(
        address _seller,
        string calldata _itemDescription,
        string calldata _shippingAddressHash
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(_seller != address(0), "Invalid seller");
        require(_seller != msg.sender, "Cannot buy from yourself");
        require(msg.value >= MIN_ORDER_AMOUNT, "Amount too low");
        require(bytes(_itemDescription).length > 0, "Description required");

        orderCounter++;
        uint256 orderId = orderCounter;

        uint256 fee = (msg.value * platformFeePercent) / 10000;

        orders[orderId] = Order({
            id: orderId,
            buyer: msg.sender,
            seller: _seller,
            amount: msg.value,
            platformFee: fee,
            createdAt: block.timestamp,
            shippedAt: 0,
            deliveredAt: 0,
            disputeDeadline: 0,
            status: OrderStatus.Funded,
            carrier: Carrier.Other,
            trackingNumber: "",
            itemDescription: _itemDescription,
            shippingAddress: _shippingAddressHash
        });

        buyerOrders[msg.sender].push(orderId);
        sellerOrders[_seller].push(orderId);

        totalVolume += msg.value;

        emit OrderCreated(orderId, msg.sender, _seller, msg.value, _itemDescription);
        emit OrderFunded(orderId, msg.value);

        return orderId;
    }

    /**
     * @dev Seller marks order as shipped with tracking
     * @param _orderId Order ID
     * @param _carrier Shipping carrier
     * @param _trackingNumber Tracking number
     */
    function shipOrder(
        uint256 _orderId,
        Carrier _carrier,
        string calldata _trackingNumber
    ) external onlySeller(_orderId) orderExists(_orderId) whenNotPaused {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Funded, "Order not funded");
        require(bytes(_trackingNumber).length > 0, "Tracking number required");

        order.status = OrderStatus.Shipped;
        order.carrier = _carrier;
        order.trackingNumber = _trackingNumber;
        order.shippedAt = block.timestamp;

        trackingToOrder[_trackingNumber] = _orderId;

        emit OrderShipped(_orderId, _carrier, _trackingNumber);
    }

    /**
     * @dev Oracle updates tracking status
     * @param _orderId Order ID
     * @param _newStatus New order status
     */
    function updateTracking(
        uint256 _orderId,
        OrderStatus _newStatus
    ) external onlyOracle orderExists(_orderId) {
        Order storage order = orders[_orderId];
        require(
            order.status == OrderStatus.Shipped ||
            order.status == OrderStatus.InTransit,
            "Invalid current status"
        );
        require(
            _newStatus == OrderStatus.InTransit ||
            _newStatus == OrderStatus.Delivered,
            "Invalid new status"
        );

        order.status = _newStatus;

        if (_newStatus == OrderStatus.Delivered) {
            order.deliveredAt = block.timestamp;
            order.disputeDeadline = block.timestamp + DISPUTE_WINDOW;
            order.status = OrderStatus.DisputeWindow;
            emit OrderDelivered(_orderId, block.timestamp);
        }

        emit TrackingUpdated(_orderId, _newStatus, block.timestamp);
    }

    /**
     * @dev Buyer confirms delivery manually (if oracle fails)
     * @param _orderId Order ID
     */
    function confirmDelivery(
        uint256 _orderId
    ) external onlyBuyer(_orderId) orderExists(_orderId) whenNotPaused {
        Order storage order = orders[_orderId];
        require(
            order.status == OrderStatus.Shipped ||
            order.status == OrderStatus.InTransit,
            "Cannot confirm delivery"
        );

        order.deliveredAt = block.timestamp;
        order.disputeDeadline = block.timestamp + DISPUTE_WINDOW;
        order.status = OrderStatus.DisputeWindow;

        emit OrderDelivered(_orderId, block.timestamp);
    }

    /**
     * @dev Buyer opens a dispute during dispute window
     * @param _orderId Order ID
     * @param _reason Reason for dispute
     */
    function openDispute(
        uint256 _orderId,
        string calldata _reason
    ) external onlyBuyer(_orderId) orderExists(_orderId) whenNotPaused {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.DisputeWindow, "Not in dispute window");
        require(block.timestamp <= order.disputeDeadline, "Dispute window closed");
        require(bytes(_reason).length > 0, "Reason required");

        order.status = OrderStatus.Disputed;

        disputes[_orderId] = DisputeInfo({
            orderId: _orderId,
            initiator: msg.sender,
            reason: _reason,
            createdAt: block.timestamp,
            resolved: false,
            winner: address(0)
        });

        emit DisputeOpened(_orderId, msg.sender, _reason);
    }

    /**
     * @dev Owner resolves dispute
     * @param _orderId Order ID
     * @param _refundBuyer True to refund buyer, false to pay seller
     */
    function resolveDispute(
        uint256 _orderId,
        bool _refundBuyer
    ) external onlyOwner orderExists(_orderId) nonReentrant {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Disputed, "Not disputed");

        DisputeInfo storage dispute = disputes[_orderId];
        require(!dispute.resolved, "Already resolved");

        dispute.resolved = true;

        if (_refundBuyer) {
            dispute.winner = order.buyer;
            order.status = OrderStatus.Refunded;

            (bool success, ) = order.buyer.call{value: order.amount}("");
            require(success, "Refund failed");

            emit DisputeResolved(_orderId, order.buyer, order.amount);
            emit OrderRefunded(_orderId, order.amount);
        } else {
            dispute.winner = order.seller;
            order.status = OrderStatus.Completed;

            uint256 sellerAmount = order.amount - order.platformFee;

            (bool sellerSuccess, ) = order.seller.call{value: sellerAmount}("");
            require(sellerSuccess, "Seller payment failed");

            (bool feeSuccess, ) = feeRecipient.call{value: order.platformFee}("");
            require(feeSuccess, "Fee payment failed");

            totalFeesCollected += order.platformFee;

            emit DisputeResolved(_orderId, order.seller, sellerAmount);
            emit OrderCompleted(_orderId, sellerAmount, order.platformFee);
        }
    }

    /**
     * @dev Complete order after dispute window (release funds to seller)
     * @param _orderId Order ID
     */
    function completeOrder(
        uint256 _orderId
    ) external orderExists(_orderId) nonReentrant whenNotPaused {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.DisputeWindow, "Not in dispute window");
        require(block.timestamp > order.disputeDeadline, "Dispute window not ended");

        order.status = OrderStatus.Completed;

        uint256 sellerAmount = order.amount - order.platformFee;

        (bool sellerSuccess, ) = order.seller.call{value: sellerAmount}("");
        require(sellerSuccess, "Seller payment failed");

        (bool feeSuccess, ) = feeRecipient.call{value: order.platformFee}("");
        require(feeSuccess, "Fee payment failed");

        totalFeesCollected += order.platformFee;

        emit OrderCompleted(_orderId, sellerAmount, order.platformFee);
    }

    /**
     * @dev Cancel order (only before shipping)
     * @param _orderId Order ID
     */
    function cancelOrder(
        uint256 _orderId
    ) external onlyParticipant(_orderId) orderExists(_orderId) nonReentrant whenNotPaused {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Funded, "Cannot cancel after shipping");

        order.status = OrderStatus.Cancelled;

        (bool success, ) = order.buyer.call{value: order.amount}("");
        require(success, "Refund failed");

        emit OrderCancelled(_orderId);
        emit OrderRefunded(_orderId, order.amount);
    }

    // ============ Admin Functions ============

    /**
     * @dev Update platform fee percentage
     * @param _newFeePercent New fee in basis points (100 = 1%)
     */
    function setPlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= MAX_FEE_PERCENT, "Fee too high");
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _newFeePercent;
        emit PlatformFeeUpdated(oldFee, _newFeePercent);
    }

    /**
     * @dev Update fee recipient address
     * @param _newRecipient New fee recipient
     */
    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        address oldRecipient = feeRecipient;
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(oldRecipient, _newRecipient);
    }

    /**
     * @dev Update tracking oracle address
     * @param _newOracle New oracle address
     */
    function setTrackingOracle(address _newOracle) external onlyOwner {
        address oldOracle = trackingOracle;
        trackingOracle = _newOracle;
        emit TrackingOracleUpdated(oldOracle, _newOracle);
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @dev Get order details
     */
    function getOrder(uint256 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }

    /**
     * @dev Get buyer's orders
     */
    function getBuyerOrders(address _buyer) external view returns (uint256[] memory) {
        return buyerOrders[_buyer];
    }

    /**
     * @dev Get seller's orders
     */
    function getSellerOrders(address _seller) external view returns (uint256[] memory) {
        return sellerOrders[_seller];
    }

    /**
     * @dev Get dispute info
     */
    function getDispute(uint256 _orderId) external view returns (DisputeInfo memory) {
        return disputes[_orderId];
    }

    /**
     * @dev Calculate platform fee for amount
     */
    function calculateFee(uint256 _amount) external view returns (uint256) {
        return (_amount * platformFeePercent) / 10000;
    }

    /**
     * @dev Check if dispute window is active
     */
    function isInDisputeWindow(uint256 _orderId) external view returns (bool) {
        Order storage order = orders[_orderId];
        return order.status == OrderStatus.DisputeWindow &&
               block.timestamp <= order.disputeDeadline;
    }

    /**
     * @dev Get time remaining in dispute window
     */
    function getDisputeTimeRemaining(uint256 _orderId) external view returns (uint256) {
        Order storage order = orders[_orderId];
        if (order.status != OrderStatus.DisputeWindow) return 0;
        if (block.timestamp >= order.disputeDeadline) return 0;
        return order.disputeDeadline - block.timestamp;
    }
}
