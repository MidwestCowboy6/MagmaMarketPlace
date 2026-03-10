/**
 * Escrow Contract Service
 * Handles interaction with MagmaEscrow smart contract on Avalanche C-Chain
 */

// Contract addresses (to be set after deployment)
export const CONTRACT_ADDRESSES = {
  // Fuji Testnet
  fuji: {
    escrow: process.env.ESCROW_CONTRACT_FUJI || '',
    nftMarketplace: process.env.NFT_MARKETPLACE_FUJI || '',
  },
  // Mainnet
  mainnet: {
    escrow: process.env.ESCROW_CONTRACT_MAINNET || '',
    nftMarketplace: process.env.NFT_MARKETPLACE_MAINNET || '',
  },
};

// Avalanche C-Chain RPC endpoints
export const RPC_ENDPOINTS = {
  fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
  mainnet: 'https://api.avax.network/ext/bc/C/rpc',
};

// Chain IDs
export const CHAIN_IDS = {
  fuji: 43113,
  mainnet: 43114,
};

// Contract ABIs (simplified for type safety)
export const ESCROW_ABI = [
  // Read functions
  'function getOrder(uint256 orderId) view returns (tuple(uint256 id, address buyer, address seller, uint256 amount, uint256 platformFee, uint256 createdAt, uint256 shippedAt, uint256 deliveredAt, uint256 disputeDeadline, uint8 status, uint8 carrier, string trackingNumber, string itemDescription, string shippingAddress))',
  'function getBuyerOrders(address buyer) view returns (uint256[])',
  'function getSellerOrders(address seller) view returns (uint256[])',
  'function getDispute(uint256 orderId) view returns (tuple(uint256 orderId, address initiator, string reason, uint256 createdAt, bool resolved, address winner))',
  'function calculateFee(uint256 amount) view returns (uint256)',
  'function isInDisputeWindow(uint256 orderId) view returns (bool)',
  'function getDisputeTimeRemaining(uint256 orderId) view returns (uint256)',
  'function platformFeePercent() view returns (uint256)',
  'function orderCounter() view returns (uint256)',
  'function totalVolume() view returns (uint256)',
  'function totalFeesCollected() view returns (uint256)',
  // Write functions (for reference - executed client-side)
  'function createOrder(address seller, string itemDescription, string shippingAddressHash) payable returns (uint256)',
  'function shipOrder(uint256 orderId, uint8 carrier, string trackingNumber)',
  'function confirmDelivery(uint256 orderId)',
  'function openDispute(uint256 orderId, string reason)',
  'function completeOrder(uint256 orderId)',
  'function cancelOrder(uint256 orderId)',
  // Events
  'event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount, string itemDescription)',
  'event OrderFunded(uint256 indexed orderId, uint256 amount)',
  'event OrderShipped(uint256 indexed orderId, uint8 carrier, string trackingNumber)',
  'event TrackingUpdated(uint256 indexed orderId, uint8 newStatus, uint256 timestamp)',
  'event OrderDelivered(uint256 indexed orderId, uint256 deliveredAt)',
  'event DisputeOpened(uint256 indexed orderId, address indexed initiator, string reason)',
  'event DisputeResolved(uint256 indexed orderId, address winner, uint256 amount)',
  'event OrderCompleted(uint256 indexed orderId, uint256 sellerAmount, uint256 platformFee)',
  'event OrderRefunded(uint256 indexed orderId, uint256 amount)',
  'event OrderCancelled(uint256 indexed orderId)',
] as const;

export const NFT_MARKETPLACE_ABI = [
  // Read functions
  'function getListing(uint256 listingId) view returns (tuple(uint256 listingId, address seller, address nftContract, uint256 tokenId, uint256 quantity, uint256 price, uint256 endTime, uint8 listingType, uint8 tokenStandard, uint8 status, address highestBidder, uint256 highestBid))',
  'function getOffer(uint256 offerId) view returns (tuple(uint256 offerId, address offeror, address nftContract, uint256 tokenId, uint256 amount, uint256 quantity, uint256 expiresAt, bool accepted, bool cancelled))',
  'function getUserListings(address user) view returns (uint256[])',
  'function getUserOffers(address user) view returns (uint256[])',
  'function getCollectionStats(address collection) view returns (tuple(uint256 totalVolume, uint256 totalSales, uint256 floorPrice))',
  'function calculateFee(uint256 amount) view returns (uint256)',
  'function platformFeePercent() view returns (uint256)',
  'function listingCounter() view returns (uint256)',
  'function totalVolume() view returns (uint256)',
  // Write functions (for reference - executed client-side)
  'function listERC721(address nftContract, uint256 tokenId, uint256 price) returns (uint256)',
  'function listERC1155(address nftContract, uint256 tokenId, uint256 quantity, uint256 price) returns (uint256)',
  'function createAuction(address nftContract, uint256 tokenId, uint256 startingPrice, uint256 duration) returns (uint256)',
  'function updateListing(uint256 listingId, uint256 newPrice)',
  'function cancelListing(uint256 listingId)',
  'function buy(uint256 listingId) payable',
  'function placeBid(uint256 listingId) payable',
  'function endAuction(uint256 listingId)',
  'function makeOffer(address nftContract, uint256 tokenId, uint256 quantity, uint256 duration) payable returns (uint256)',
  'function acceptOffer(uint256 offerId)',
  'function cancelOffer(uint256 offerId)',
  // Events
  'event ListingCreated(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 quantity, uint256 price, uint8 listingType)',
  'event ListingUpdated(uint256 indexed listingId, uint256 newPrice)',
  'event ListingCancelled(uint256 indexed listingId)',
  'event Sale(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price, uint256 platformFee, uint256 royaltyAmount)',
  'event BidPlaced(uint256 indexed listingId, address indexed bidder, uint256 amount)',
  'event AuctionEnded(uint256 indexed listingId, address winner, uint256 amount)',
  'event OfferCreated(uint256 indexed offerId, address indexed offeror, address indexed nftContract, uint256 tokenId, uint256 amount)',
  'event OfferAccepted(uint256 indexed offerId, address seller)',
  'event OfferCancelled(uint256 indexed offerId)',
] as const;

// Order status enum mapping
export const OrderStatus = {
  Created: 0,
  Funded: 1,
  Shipped: 2,
  InTransit: 3,
  Delivered: 4,
  DisputeWindow: 5,
  Completed: 6,
  Disputed: 7,
  Refunded: 8,
  Cancelled: 9,
} as const;

export const OrderStatusLabels: Record<number, string> = {
  0: 'Created',
  1: 'Funded',
  2: 'Shipped',
  3: 'In Transit',
  4: 'Delivered',
  5: 'Dispute Window',
  6: 'Completed',
  7: 'Disputed',
  8: 'Refunded',
  9: 'Cancelled',
};

// Carrier enum mapping
export const Carrier = {
  USPS: 0,
  UPS: 1,
  FedEx: 2,
  DHL: 3,
  Other: 4,
} as const;

export const CarrierLabels: Record<number, string> = {
  0: 'USPS',
  1: 'UPS',
  2: 'FedEx',
  3: 'DHL',
  4: 'Other',
};

// Listing type enum mapping
export const ListingType = {
  FixedPrice: 0,
  Auction: 1,
} as const;

// Token standard enum mapping
export const TokenStandard = {
  ERC721: 0,
  ERC1155: 1,
} as const;

// Listing status enum mapping
export const ListingStatus = {
  Active: 0,
  Sold: 1,
  Cancelled: 2,
} as const;

// Types for order data
export interface EscrowOrder {
  id: number;
  buyer: string;
  seller: string;
  amount: string; // BigInt as string
  platformFee: string;
  createdAt: number;
  shippedAt: number;
  deliveredAt: number;
  disputeDeadline: number;
  status: number;
  carrier: number;
  trackingNumber: string;
  itemDescription: string;
  shippingAddress: string;
}

export interface NFTListing {
  listingId: number;
  seller: string;
  nftContract: string;
  tokenId: number;
  quantity: number;
  price: string;
  endTime: number;
  listingType: number;
  tokenStandard: number;
  status: number;
  highestBidder: string;
  highestBid: string;
}

export interface NFTOffer {
  offerId: number;
  offeror: string;
  nftContract: string;
  tokenId: number;
  amount: string;
  quantity: number;
  expiresAt: number;
  accepted: boolean;
  cancelled: boolean;
}

// Network helper
export function getNetworkConfig(network: 'fuji' | 'mainnet') {
  return {
    rpcUrl: RPC_ENDPOINTS[network],
    chainId: CHAIN_IDS[network],
    escrowAddress: CONTRACT_ADDRESSES[network].escrow,
    nftMarketplaceAddress: CONTRACT_ADDRESSES[network].nftMarketplace,
  };
}

// Format AVAX amount (wei to AVAX)
export function formatAvax(wei: string | bigint): string {
  const value = typeof wei === 'string' ? BigInt(wei) : wei;
  const avax = Number(value) / 1e18;
  return avax.toFixed(6);
}

// Parse AVAX amount (AVAX to wei)
export function parseAvax(avax: string | number): string {
  const value = typeof avax === 'string' ? parseFloat(avax) : avax;
  const wei = BigInt(Math.floor(value * 1e18));
  return wei.toString();
}
