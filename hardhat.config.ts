// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MagmaNFTMarketplace
 * @dev NFT Marketplace for Avalanche C-Chain supporting ERC-721 and ERC-1155
 * Features:
 * - List and buy ERC-721 NFTs
 * - List and buy ERC-1155 NFTs (with quantity support)
 * - Auction functionality
 * - Make offers on any NFT
 * - Adjustable platform fees
 * - Royalty support (EIP-2981)
 */
contract MagmaNFTMarketplace is
    ERC721Holder,
    ERC1155Holder,
    ReentrancyGuard,
    Ownable,
    Pausable
{

    // ============ Enums ============

    enum ListingType {
        FixedPrice,
        Auction
    }

    enum TokenStandard {
        ERC721,
        ERC1155
    }

    enum ListingStatus {
        Active,
        Sold,
        Cancelled
    }

    // ============ Structs ============

    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 quantity;        // 1 for ERC721, variable for ERC1155
        uint256 price;           // Fixed price or starting bid
        uint256 endTime;         // 0 for fixed price, timestamp for auction
        ListingType listingType;
        TokenStandard tokenStandard;
        ListingStatus status;
        address highestBidder;
        uint256 highestBid;
    }

    struct Offer {
        uint256 offerId;
        address offeror;
        address nftContract;
        uint256 tokenId;
        uint256 amount;
        uint256 quantity;        // For ERC1155
        uint256 expiresAt;
        bool accepted;
        bool cancelled;
    }

    struct CollectionStats {
        uint256 totalVolume;
        uint256 totalSales;
        uint256 floorPrice;
    }

    // ============ State Variables ============

    uint256 public listingCounter;
    uint256 public offerCounter;
    uint256 public platformFeePercent = 250; // 2.5%
    uint256 public constant MAX_FEE_PERCENT = 1000; // 10%
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;
    uint256 public constant MAX_AUCTION_DURATION = 30 days;
    uint256 public constant MIN_BID_INCREMENT_PERCENT = 500; // 5%

    address public feeRecipient;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer) public offers;
    mapping(address => mapping(uint256 => uint256)) public activeListingId; // nft => tokenId => listingId
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userOffers;
    mapping(address => CollectionStats) public collectionStats;

    // Royalty interface ID (EIP-2981)
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    uint256 public totalVolume;
    uint256 public totalFeesCollected;

    // ============ Events ============

    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 quantity,
        uint256 price,
        ListingType listingType
    );

    event ListingUpdated(
        uint256 indexed listingId,
        uint256 newPrice
    );

    event ListingCancelled(uint256 indexed listingId);

    event Sale(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 platformFee,
        uint256 royaltyAmount
    );

    event BidPlaced(
        uint256 indexed listingId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionEnded(
        uint256 indexed listingId,
        address winner,
        uint256 amount
    );

    event OfferCreated(
        uint256 indexed offerId,
        address indexed offeror,
        address indexed nftContract,
        uint256 tokenId,
        uint256 amount
    );

    event OfferAccepted(uint256 indexed offerId, address seller);

    event OfferCancelled(uint256 indexed offerId);

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    // ============ Constructor ============

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    // ============ Listing Functions ============

    /**
     * @dev Create a fixed price listing for ERC721
     */
    function listERC721(
        address _nftContract,
        uint256 _tokenId,
        uint256 _price
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(_price > 0, "Price must be > 0");
        require(
            activeListingId[_nftContract][_tokenId] == 0,
            "Already listed"
        );

        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "Not owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(_tokenId) == address(this),
            "Not approved"
        );

        // Transfer NFT to marketplace
        nft.safeTransferFrom(msg.sender, address(this), _tokenId);

        listingCounter++;
        uint256 listingId = listingCounter;

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            quantity: 1,
            price: _price,
            endTime: 0,
            listingType: ListingType.FixedPrice,
            tokenStandard: TokenStandard.ERC721,
            status: ListingStatus.Active,
            highestBidder: address(0),
            highestBid: 0
        });

        activeListingId[_nftContract][_tokenId] = listingId;
        userListings[msg.sender].push(listingId);

        emit ListingCreated(
            listingId,
            msg.sender,
            _nftContract,
            _tokenId,
            1,
            _price,
            ListingType.FixedPrice
        );

        return listingId;
    }

    /**
     * @dev Create a fixed price listing for ERC1155
     */
    function listERC1155(
        address _nftContract,
        uint256 _tokenId,
        uint256 _quantity,
        uint256 _price
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(_price > 0, "Price must be > 0");
        require(_quantity > 0, "Quantity must be > 0");

        IERC1155 nft = IERC1155(_nftContract);
        require(
            nft.balanceOf(msg.sender, _tokenId) >= _quantity,
            "Insufficient balance"
        );
        require(
            nft.isApprovedForAll(msg.sender, address(this)),
            "Not approved"
        );

        // Transfer NFTs to marketplace
        nft.safeTransferFrom(msg.sender, address(this), _tokenId, _quantity, "");

        listingCounter++;
        uint256 listingId = listingCounter;

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            quantity: _quantity,
            price: _price,
            endTime: 0,
            listingType: ListingType.FixedPrice,
            tokenStandard: TokenStandard.ERC1155,
            status: ListingStatus.Active,
            highestBidder: address(0),
            highestBid: 0
        });

        userListings[msg.sender].push(listingId);

        emit ListingCreated(
            listingId,
            msg.sender,
            _nftContract,
            _tokenId,
            _quantity,
            _price,
            ListingType.FixedPrice
        );

        return listingId;
    }

    /**
     * @dev Create an auction listing for ERC721
     */
    function createAuction(
        address _nftContract,
        uint256 _tokenId,
        uint256 _startingPrice,
        uint256 _duration
    ) external nonReentrant whenNotPaused returns (uint256) {
        require(_startingPrice > 0, "Price must be > 0");
        require(
            _duration >= MIN_AUCTION_DURATION && _duration <= MAX_AUCTION_DURATION,
            "Invalid duration"
        );
        require(
            activeListingId[_nftContract][_tokenId] == 0,
            "Already listed"
        );

        IERC721 nft = IERC721(_nftContract);
        require(nft.ownerOf(_tokenId) == msg.sender, "Not owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(_tokenId) == address(this),
            "Not approved"
        );

        // Transfer NFT to marketplace
        nft.safeTransferFrom(msg.sender, address(this), _tokenId);

        listingCounter++;
        uint256 listingId = listingCounter;

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            quantity: 1,
            price: _startingPrice,
            endTime: block.timestamp + _duration,
            listingType: ListingType.Auction,
            tokenStandard: TokenStandard.ERC721,
            status: ListingStatus.Active,
            highestBidder: address(0),
            highestBid: 0
        });

        activeListingId[_nftContract][_tokenId] = listingId;
        userListings[msg.sender].push(listingId);

        emit ListingCreated(
            listingId,
            msg.sender,
            _nftContract,
            _tokenId,
            1,
            _startingPrice,
            ListingType.Auction
        );

        return listingId;
    }

    /**
     * @dev Update listing price (fixed price only)
     */
    function updateListing(
        uint256 _listingId,
        uint256 _newPrice
    ) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.status == ListingStatus.Active, "Not active");
        require(listing.listingType == ListingType.FixedPrice, "Cannot update auction");
        require(_newPrice > 0, "Price must be > 0");

        listing.price = _newPrice;

        emit ListingUpdated(_listingId, _newPrice);
    }

    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.status == ListingStatus.Active, "Not active");

        // For auctions, can't cancel if there are bids
        if (listing.listingType == ListingType.Auction) {
            require(listing.highestBidder == address(0), "Has bids");
        }

        listing.status = ListingStatus.Cancelled;

        // Return NFT to seller
        if (listing.tokenStandard == TokenStandard.ERC721) {
            activeListingId[listing.nftContract][listing.tokenId] = 0;
            IERC721(listing.nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                listing.tokenId
            );
        } else {
            IERC1155(listing.nftContract).safeTransferFrom(
                address(this),
                msg.sender,
                listing.tokenId,
                listing.quantity,
                ""
            );
        }

        emit ListingCancelled(_listingId);
    }

    // ============ Buy Functions ============

    /**
     * @dev Buy a fixed price listing
     */
    function buy(uint256 _listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[_listingId];
        require(listing.status == ListingStatus.Active, "Not active");
        require(listing.listingType == ListingType.FixedPrice, "Not fixed price");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy own listing");

        listing.status = ListingStatus.Sold;

        _executeSale(listing, msg.sender, listing.price);

        // Refund excess
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }
    }

    // ============ Auction Functions ============

    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 _listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[_listingId];
        require(listing.status == ListingStatus.Active, "Not active");
        require(listing.listingType == ListingType.Auction, "Not auction");
        require(block.timestamp < listing.endTime, "Auction ended");
        require(msg.sender != listing.seller, "Cannot bid on own auction");

        uint256 minBid;
        if (listing.highestBid == 0) {
            minBid = listing.price;
        } else {
            minBid = listing.highestBid + (listing.highestBid * MIN_BID_INCREMENT_PERCENT / 10000);
        }
        require(msg.value >= minBid, "Bid too low");

        // Refund previous bidder
        if (listing.highestBidder != address(0)) {
            (bool refundSuccess, ) = listing.highestBidder.call{value: listing.highestBid}("");
            require(refundSuccess, "Refund failed");
        }

        listing.highestBidder = msg.sender;
        listing.highestBid = msg.value;

        // Extend auction if bid in last 10 minutes
        if (listing.endTime - block.timestamp < 10 minutes) {
            listing.endTime = block.timestamp + 10 minutes;
        }

        emit BidPlaced(_listingId, msg.sender, msg.value);
    }

    /**
     * @dev End an auction and transfer NFT to winner
     */
    function endAuction(uint256 _listingId) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.status == ListingStatus.Active, "Not active");
        require(listing.listingType == ListingType.Auction, "Not auction");
        require(block.timestamp >= listing.endTime, "Auction not ended");

        listing.status = ListingStatus.Sold;

        if (listing.highestBidder != address(0)) {
            // Has winner
            _executeSale(listing, listing.highestBidder, listing.highestBid);
            emit AuctionEnded(_listingId, listing.highestBidder, listing.highestBid);
        } else {
            // No bids - return NFT to seller
            if (listing.tokenStandard == TokenStandard.ERC721) {
                activeListingId[listing.nftContract][listing.tokenId] = 0;
                IERC721(listing.nftContract).safeTransferFrom(
                    address(this),
                    listing.seller,
                    listing.tokenId
                );
            }
            emit AuctionEnded(_listingId, address(0), 0);
        }
    }

    // ============ Offer Functions ============

    /**
     * @dev Make an offer on any NFT (doesn't need to be listed)
     */
    function makeOffer(
        address _nftContract,
        uint256 _tokenId,
        uint256 _quantity,
        uint256 _duration
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(msg.value > 0, "Offer must be > 0");
        require(_duration > 0 && _duration <= 30 days, "Invalid duration");
        require(_quantity > 0, "Quantity must be > 0");

        offerCounter++;
        uint256 offerId = offerCounter;

        offers[offerId] = Offer({
            offerId: offerId,
            offeror: msg.sender,
            nftContract: _nftContract,
            tokenId: _tokenId,
            amount: msg.value,
            quantity: _quantity,
            expiresAt: block.timestamp + _duration,
            accepted: false,
            cancelled: false
        });

        userOffers[msg.sender].push(offerId);

        emit OfferCreated(offerId, msg.sender, _nftContract, _tokenId, msg.value);

        return offerId;
    }

    /**
     * @dev Accept an offer (NFT owner)
     */
    function acceptOffer(uint256 _offerId) external nonReentrant whenNotPaused {
        Offer storage offer = offers[_offerId];
        require(!offer.accepted && !offer.cancelled, "Offer not active");
        require(block.timestamp < offer.expiresAt, "Offer expired");

        // Check if it's ERC721 or ERC1155
        bool isERC721 = _supportsInterface(offer.nftContract, type(IERC721).interfaceId);

        if (isERC721) {
            IERC721 nft = IERC721(offer.nftContract);
            require(nft.ownerOf(offer.tokenId) == msg.sender, "Not owner");
            require(
                nft.isApprovedForAll(msg.sender, address(this)) ||
                nft.getApproved(offer.tokenId) == address(this),
                "Not approved"
            );

            // Transfer NFT to buyer
            nft.safeTransferFrom(msg.sender, offer.offeror, offer.tokenId);
        } else {
            IERC1155 nft = IERC1155(offer.nftContract);
            require(nft.balanceOf(msg.sender, offer.tokenId) >= offer.quantity, "Insufficient balance");
            require(nft.isApprovedForAll(msg.sender, address(this)), "Not approved");

            // Transfer NFTs to buyer
            nft.safeTransferFrom(msg.sender, offer.offeror, offer.tokenId, offer.quantity, "");
        }

        offer.accepted = true;

        // Calculate fees
        uint256 platformFee = (offer.amount * platformFeePercent) / 10000;
        uint256 royaltyAmount = 0;

        // Check for royalties (EIP-2981)
        (address royaltyRecipient, uint256 royalty) = _getRoyaltyInfo(
            offer.nftContract,
            offer.tokenId,
            offer.amount
        );

        if (royalty > 0 && royaltyRecipient != address(0)) {
            royaltyAmount = royalty;
        }

        uint256 sellerAmount = offer.amount - platformFee - royaltyAmount;

        // Pay seller
        (bool sellerSuccess, ) = msg.sender.call{value: sellerAmount}("");
        require(sellerSuccess, "Seller payment failed");

        // Pay platform fee
        (bool feeSuccess, ) = feeRecipient.call{value: platformFee}("");
        require(feeSuccess, "Fee payment failed");

        // Pay royalty
        if (royaltyAmount > 0) {
            (bool royaltySuccess, ) = royaltyRecipient.call{value: royaltyAmount}("");
            require(royaltySuccess, "Royalty payment failed");
        }

        totalVolume += offer.amount;
        totalFeesCollected += platformFee;

        emit OfferAccepted(_offerId, msg.sender);
    }

    /**
     * @dev Cancel an offer
     */
    function cancelOffer(uint256 _offerId) external nonReentrant {
        Offer storage offer = offers[_offerId];
        require(offer.offeror == msg.sender, "Not offeror");
        require(!offer.accepted && !offer.cancelled, "Offer not active");

        offer.cancelled = true;

        // Refund offer amount
        (bool success, ) = msg.sender.call{value: offer.amount}("");
        require(success, "Refund failed");

        emit OfferCancelled(_offerId);
    }

    // ============ Internal Functions ============

    function _executeSale(
        Listing storage listing,
        address buyer,
        uint256 salePrice
    ) internal {
        // Calculate fees
        uint256 platformFee = (salePrice * platformFeePercent) / 10000;
        uint256 royaltyAmount = 0;

        // Check for royalties (EIP-2981)
        (address royaltyRecipient, uint256 royalty) = _getRoyaltyInfo(
            listing.nftContract,
            listing.tokenId,
            salePrice
        );

        if (royalty > 0 && royaltyRecipient != address(0)) {
            royaltyAmount = royalty;
        }

        uint256 sellerAmount = salePrice - platformFee - royaltyAmount;

        // Transfer NFT
        if (listing.tokenStandard == TokenStandard.ERC721) {
            activeListingId[listing.nftContract][listing.tokenId] = 0;
            IERC721(listing.nftContract).safeTransferFrom(
                address(this),
                buyer,
                listing.tokenId
            );
        } else {
            IERC1155(listing.nftContract).safeTransferFrom(
                address(this),
                buyer,
                listing.tokenId,
                listing.quantity,
                ""
            );
        }

        // Pay seller
        (bool sellerSuccess, ) = listing.seller.call{value: sellerAmount}("");
        require(sellerSuccess, "Seller payment failed");

        // Pay platform fee
        (bool feeSuccess, ) = feeRecipient.call{value: platformFee}("");
        require(feeSuccess, "Fee payment failed");

        // Pay royalty
        if (royaltyAmount > 0) {
            (bool royaltySuccess, ) = royaltyRecipient.call{value: royaltyAmount}("");
            require(royaltySuccess, "Royalty payment failed");
        }

        // Update stats
        totalVolume += salePrice;
        totalFeesCollected += platformFee;
        collectionStats[listing.nftContract].totalVolume += salePrice;
        collectionStats[listing.nftContract].totalSales++;

        emit Sale(
            listing.listingId,
            buyer,
            listing.seller,
            salePrice,
            platformFee,
            royaltyAmount
        );
    }

    function _getRoyaltyInfo(
        address _nftContract,
        uint256 _tokenId,
        uint256 _salePrice
    ) internal view returns (address, uint256) {
        if (!_supportsInterface(_nftContract, _INTERFACE_ID_ERC2981)) {
            return (address(0), 0);
        }

        try IERC2981(_nftContract).royaltyInfo(_tokenId, _salePrice) returns (
            address receiver,
            uint256 royaltyAmount
        ) {
            // Cap royalty at 10%
            if (royaltyAmount > _salePrice / 10) {
                royaltyAmount = _salePrice / 10;
            }
            return (receiver, royaltyAmount);
        } catch {
            return (address(0), 0);
        }
    }

    function _supportsInterface(
        address _contract,
        bytes4 _interfaceId
    ) internal view returns (bool) {
        try IERC165(_contract).supportsInterface(_interfaceId) returns (bool supported) {
            return supported;
        } catch {
            return false;
        }
    }

    // ============ Admin Functions ============

    function setPlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= MAX_FEE_PERCENT, "Fee too high");
        uint256 oldFee = platformFeePercent;
        platformFeePercent = _newFeePercent;
        emit PlatformFeeUpdated(oldFee, _newFeePercent);
    }

    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        address oldRecipient = feeRecipient;
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(oldRecipient, _newRecipient);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    function getListing(uint256 _listingId) external view returns (Listing memory) {
        return listings[_listingId];
    }

    function getOffer(uint256 _offerId) external view returns (Offer memory) {
        return offers[_offerId];
    }

    function getUserListings(address _user) external view returns (uint256[] memory) {
        return userListings[_user];
    }

    function getUserOffers(address _user) external view returns (uint256[] memory) {
        return userOffers[_user];
    }

    function getCollectionStats(address _collection) external view returns (CollectionStats memory) {
        return collectionStats[_collection];
    }

    function calculateFee(uint256 _amount) external view returns (uint256) {
        return (_amount * platformFeePercent) / 10000;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Holder)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

// ============ Interface for EIP-2981 ============

interface IERC2981 {
    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view returns (address receiver, uint256 royaltyAmount);
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
