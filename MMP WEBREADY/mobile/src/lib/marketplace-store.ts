import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Master wallet for collecting 2% fees
export const MASTER_WALLET_ADDRESS = '0x85cD82A3941Ee44DE3B9809281670915c3e6AF27';
export const MASTER_USER_ID = 'N263Jm6mbFiYbvQ3KIRgXq66xXYRiLTx';
export const PLATFORM_FEE_PERCENT = 2; // Default 2% fee on all transactions (collected in AVAX)
export const MAX_FEE_PERCENT = 2; // Maximum fee percentage
export const MIN_FEE_PERCENT = 0; // Minimum fee percentage

// Item categories
export type ItemCategory = 'cards' | 'collectibles' | 'art' | 'other';

// Item types (NFT, digital, physical)
export type ItemType = 'nft' | 'digital' | 'physical';

// Listing types
export type ListingType = 'auction' | 'fixed' | 'trade';

// Listing status
export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired' | 'shipped' | 'delivered' | 'in_escrow';

// Escrow status
export type EscrowStatus = 'pending' | 'funded' | 'released' | 'refunded';

// Review interface
export interface Review {
  id: string;
  listingId: string;
  reviewerId: string;
  reviewerUsername: string;
  sellerId: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: string;
}

// Offer interface (for making offers below asking price)
export interface Offer {
  id: string;
  listingId: string;
  offererId: string;
  offererUsername: string;
  offererWallet: string;
  amount: number; // AVAX amount offered
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'countered';
  counterAmount?: number; // If seller counters
  expiresAt: string;
  createdAt: string;
}

// Escrow interface
export interface Escrow {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number; // Total amount in escrow
  platformFee: number;
  sellerAmount: number;
  status: EscrowStatus;
  fundedAt?: string;
  releasedAt?: string;
  refundedAt?: string;
}

// Seller stats for verification
export interface SellerStats {
  totalSales: number;
  totalVolume: number;
  averageRating: number;
  totalReviews: number;
  joinedAt: string;
  isVerified: boolean;
  verifiedAt?: string;
}

// Shipping address interface
export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// Shipping info interface
export interface ShippingInfo {
  address: ShippingAddress;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  shippingCost: number; // in AVAX
}

// NFT metadata interface
export interface NFTMetadata {
  contractAddress?: string;
  tokenId?: string;
  blockchain: 'avalanche';
  standard: 'ERC-721' | 'ERC-1155';
  attributes?: Array<{ trait_type: string; value: string }>;
}

// Digital delivery interface
export interface DigitalDelivery {
  downloadUrl?: string;
  accessCode?: string;
  instructions?: string;
  deliveredAt?: string;
}

// Shipping label interface (for blind shipping)
export interface ShippingLabel {
  id: string;
  trackingNumber: string;
  carrier: string; // USPS, UPS, FedEx
  labelUrl?: string; // URL to label image/PDF
  maskedAddress: string; // e.g., "J. Smith, Chicago IL"
  createdAt: string;
  status: 'pending' | 'created' | 'shipped' | 'in_transit' | 'delivered';
}

// Shipping status type
export type ShippingStatus = 'awaiting_address' | 'address_provided' | 'label_requested' | 'label_created' | 'shipped' | 'in_transit' | 'delivered';

// Helper to mask address for seller view
export function getMaskedAddress(address: ShippingAddress): string {
  const firstInitial = address.fullName.charAt(0);
  const lastName = address.fullName.split(' ').pop() || '';
  const maskedLastName = lastName.charAt(0) + '.';
  return `${firstInitial}. ${maskedLastName}, ${address.city} ${address.state}`;
}

// Helper to get city/state/country only (for pre-purchase view)
export function getLocationOnly(address: ShippingAddress): string {
  return `${address.city}, ${address.state}, ${address.country}`;
}

// Bid interface
export interface Bid {
  id: string;
  listingId: string;
  bidderId: string;
  bidderUsername: string;
  bidderWallet: string;
  amount: number; // in AVAX
  timestamp: string;
}

// Trade offer interface
export interface TradeOffer {
  id: string;
  listingId: string;
  offererId: string;
  offererUsername: string;
  offererWallet: string;
  offeredItems: string[]; // listing IDs of items being offered
  avaxAmount: number; // additional AVAX offered
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  timestamp: string;
}

// Listing interface
export interface Listing {
  id: string;
  sellerId: string;
  sellerUsername: string;
  sellerWallet: string;

  // Item details
  title: string;
  description: string;
  category: ItemCategory;
  itemType: ItemType;
  imageUrl: string;
  additionalImages?: string[];

  // NFT specific
  nftMetadata?: NFTMetadata;

  // Digital specific
  digitalDelivery?: DigitalDelivery;

  // Physical specific
  shippingInfo?: ShippingInfo;
  shippingCost?: number; // in AVAX
  estimatedDelivery?: string; // e.g., "3-5 business days"
  shipsFrom?: string; // country/region

  // Listing type and pricing
  listingType: ListingType;
  price: number; // in AVAX (for fixed price or starting bid)
  buyNowPrice?: number; // optional buy now price for auctions
  reservePrice?: number; // minimum price for auctions (hidden)
  reserveMet?: boolean; // whether reserve has been met

  // Auction specific
  minimumBid?: number;
  bids: Bid[];
  highestBid?: Bid;

  // Trade specific
  tradeOffers: TradeOffer[];
  lookingFor?: string; // what seller is looking for in trade

  // Offers (for fixed price listings)
  offers: Offer[];
  acceptsOffers?: boolean; // whether seller accepts offers below asking

  // Bundle deals
  isBundle?: boolean;
  bundleItems?: string[]; // IDs of items in bundle
  bundleDiscount?: number; // percentage discount for bundle

  // Featured listing
  isFeatured?: boolean;
  featuredUntil?: string;

  // Timing
  createdAt: string;
  expiresAt?: string; // for auctions

  // Status
  status: ListingStatus;

  // Escrow
  escrow?: Escrow;

  // Watchlist count
  watchCount: number;

  // Transaction details (when sold)
  buyerId?: string;
  buyerUsername?: string;
  buyerWallet?: string;
  buyerShippingAddress?: ShippingAddress;
  finalPrice?: number;
  platformFee?: number;
  sellerReceived?: number;
  soldAt?: string;
  transactionHash?: string;

  // Blind shipping (for physical items)
  shippingStatus?: ShippingStatus;
  shippingLabel?: ShippingLabel;

  // Review
  reviewId?: string;
}

// Transaction record
export interface MarketplaceTransaction {
  id: string;
  listingId: string;
  type: 'purchase' | 'auction_win' | 'trade';
  itemType: ItemType;
  sellerId: string;
  buyerId: string;
  itemTitle: string;
  amount: number;
  shippingCost: number;
  platformFee: number;
  sellerReceived: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed' | 'shipped' | 'delivered';
}

// Marketplace state interface
interface MarketplaceState {
  listings: Record<string, Listing>;
  transactions: MarketplaceTransaction[];
  reviews: Record<string, Review>;
  sellerStats: Record<string, SellerStats>;
  watchlists: Record<string, string[]>; // userId -> listingIds
  escrows: Record<string, Escrow>;

  // Platform stats
  totalVolume: number; // total AVAX traded
  totalFees: number; // total fees collected
  totalListings: number;
  totalSales: number;

  // Adjustable fee (0-2%)
  currentFeePercent: number;

  // Actions
  createListing: (listing: Omit<Listing, 'id' | 'createdAt' | 'bids' | 'tradeOffers' | 'status' | 'offers' | 'watchCount'>) => string;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  cancelListing: (id: string) => void;

  // Master-only actions
  setFeePercent: (percent: number) => void;
  delistListing: (listingId: string, reason?: string) => { success: boolean; error?: string };

  // Bidding
  placeBid: (listingId: string, bid: Omit<Bid, 'id' | 'timestamp'>) => { success: boolean; error?: string };

  // Trading
  createTradeOffer: (offer: Omit<TradeOffer, 'id' | 'timestamp' | 'status'>) => string;
  respondToTradeOffer: (offerId: string, listingId: string, accept: boolean) => void;

  // Purchasing
  purchaseListing: (listingId: string, buyerId: string, buyerUsername: string, buyerWallet: string, shippingAddress?: ShippingAddress) => {
    success: boolean;
    transaction?: MarketplaceTransaction;
    error?: string;
  };

  // Escrow
  createEscrow: (listingId: string, buyerId: string, amount: number) => { success: boolean; escrow?: Escrow; error?: string };
  releaseEscrow: (listingId: string, buyerId: string) => { success: boolean; error?: string };
  refundEscrow: (listingId: string) => { success: boolean; error?: string };

  // Reviews
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  getSellerReviews: (sellerId: string) => Review[];

  // Watchlist
  addToWatchlist: (userId: string, listingId: string) => void;
  removeFromWatchlist: (userId: string, listingId: string) => void;
  getUserWatchlist: (userId: string) => string[];
  isInWatchlist: (userId: string, listingId: string) => boolean;

  // Offers
  makeOffer: (offer: Omit<Offer, 'id' | 'createdAt' | 'status' | 'expiresAt'>) => { success: boolean; error?: string };
  respondToOffer: (listingId: string, offerId: string, accept: boolean, counterAmount?: number) => { success: boolean; error?: string };
  getListingOffers: (listingId: string) => Offer[];

  // Buy Now for Auctions
  buyNow: (listingId: string, buyerId: string, buyerUsername: string, buyerWallet: string, shippingAddress?: ShippingAddress) => {
    success: boolean;
    transaction?: MarketplaceTransaction;
    error?: string;
  };

  // Featured Listings
  featureListing: (listingId: string, durationDays: number) => void;
  getFeaturedListings: () => Listing[];

  // Seller Stats
  getSellerStats: (sellerId: string) => SellerStats | undefined;
  updateSellerStats: (sellerId: string) => void;

  // Shipping (for physical items)
  updateBuyerShippingAddress: (listingId: string, address: ShippingAddress) => { success: boolean; error?: string };
  requestShippingLabel: (listingId: string) => { success: boolean; label?: ShippingLabel; error?: string };
  updateShippingStatus: (listingId: string, status: ShippingStatus) => void;

  // Queries
  getActiveListings: () => Listing[];
  getListingsByCategory: (category: ItemCategory) => Listing[];
  getListingsByUser: (userId: string) => Listing[];
  getListingById: (id: string) => Listing | undefined;
  getUserTransactions: (userId: string) => MarketplaceTransaction[];
  getSimilarListings: (listingId: string, limit?: number) => Listing[];
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate fees with custom percentage
export function calculateFees(amount: number, feePercent: number = PLATFORM_FEE_PERCENT): { platformFee: number; sellerReceives: number } {
  const platformFee = amount * (feePercent / 100);
  const sellerReceives = amount - platformFee;
  return { platformFee, sellerReceives };
}

// Calculate fees using current store fee
export function calculateFeesWithCurrentRate(amount: number): { platformFee: number; sellerReceives: number; feePercent: number } {
  const feePercent = useMarketplaceStore.getState().currentFeePercent;
  const platformFee = amount * (feePercent / 100);
  const sellerReceives = amount - platformFee;
  return { platformFee, sellerReceives, feePercent };
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      listings: {},
      transactions: [],
      reviews: {},
      sellerStats: {},
      watchlists: {},
      escrows: {},
      totalVolume: 0,
      totalFees: 0,
      totalListings: 0,
      totalSales: 0,
      currentFeePercent: PLATFORM_FEE_PERCENT, // Default 2%

      setFeePercent: (percent: number) => {
        // Clamp between 0 and 2%
        const clampedPercent = Math.max(MIN_FEE_PERCENT, Math.min(MAX_FEE_PERCENT, percent));
        set({ currentFeePercent: clampedPercent });
      },

      delistListing: (listingId: string, reason?: string) => {
        const { listings } = get();
        const listing = listings[listingId];

        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }

        if (listing.status !== 'active') {
          return { success: false, error: 'Listing is not active' };
        }

        set((state) => ({
          listings: {
            ...state.listings,
            [listingId]: {
              ...listing,
              status: 'cancelled',
            },
          },
        }));

        return { success: true };
      },

      createListing: (listingData) => {
        const id = generateId('listing');
        const now = new Date().toISOString();

        const listing: Listing = {
          ...listingData,
          id,
          createdAt: now,
          bids: [],
          tradeOffers: [],
          offers: [],
          watchCount: 0,
          status: 'active',
        };

        set((state) => ({
          listings: { ...state.listings, [id]: listing },
          totalListings: state.totalListings + 1,
        }));

        return id;
      },

      updateListing: (id, updates) => {
        set((state) => {
          const listing = state.listings[id];
          if (!listing) return state;

          return {
            listings: {
              ...state.listings,
              [id]: { ...listing, ...updates },
            },
          };
        });
      },

      cancelListing: (id) => {
        set((state) => {
          const listing = state.listings[id];
          if (!listing || listing.status !== 'active') return state;

          return {
            listings: {
              ...state.listings,
              [id]: { ...listing, status: 'cancelled' },
            },
          };
        });
      },

      placeBid: (listingId, bidData) => {
        const { listings } = get();
        const listing = listings[listingId];

        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }

        if (listing.status !== 'active') {
          return { success: false, error: 'Listing is no longer active' };
        }

        if (listing.listingType !== 'auction') {
          return { success: false, error: 'This is not an auction' };
        }

        const minimumBid = listing.highestBid?.amount || listing.price;
        if (bidData.amount <= minimumBid) {
          return { success: false, error: `Bid must be higher than ${minimumBid} AVAX` };
        }

        const bid: Bid = {
          ...bidData,
          id: generateId('bid'),
          timestamp: new Date().toISOString(),
        };

        // Check if reserve price is met
        const reserveMet = listing.reservePrice ? bidData.amount >= listing.reservePrice : true;

        set((state) => ({
          listings: {
            ...state.listings,
            [listingId]: {
              ...state.listings[listingId],
              bids: [...state.listings[listingId].bids, bid],
              highestBid: bid,
              reserveMet,
            },
          },
        }));

        return { success: true };
      },

      createTradeOffer: (offerData) => {
        const id = generateId('offer');
        const now = new Date().toISOString();

        const offer: TradeOffer = {
          ...offerData,
          id,
          timestamp: now,
          status: 'pending',
        };

        set((state) => {
          const listing = state.listings[offerData.listingId];
          if (!listing) return state;

          return {
            listings: {
              ...state.listings,
              [offerData.listingId]: {
                ...listing,
                tradeOffers: [...listing.tradeOffers, offer],
              },
            },
          };
        });

        return id;
      },

      respondToTradeOffer: (offerId, listingId, accept) => {
        set((state) => {
          const listing = state.listings[listingId];
          if (!listing) return state;

          const acceptedOffer = listing.tradeOffers.find((o) => o.id === offerId);

          const updatedOffers: TradeOffer[] = listing.tradeOffers.map((offer) =>
            offer.id === offerId
              ? { ...offer, status: (accept ? 'accepted' : 'rejected') as TradeOffer['status'] }
              : offer
          );

          const updatedListing: Listing = {
            ...listing,
            tradeOffers: updatedOffers,
            status: accept ? 'sold' : listing.status,
            buyerId: accept ? acceptedOffer?.offererId : undefined,
            buyerUsername: accept ? acceptedOffer?.offererUsername : undefined,
            buyerWallet: accept ? acceptedOffer?.offererWallet : undefined,
            soldAt: accept ? new Date().toISOString() : undefined,
          };

          return {
            listings: {
              ...state.listings,
              [listingId]: updatedListing,
            },
            totalSales: accept ? state.totalSales + 1 : state.totalSales,
          };
        });
      },

      purchaseListing: (listingId, buyerId, buyerUsername, buyerWallet, shippingAddress) => {
        const { listings, currentFeePercent } = get();
        const listing = listings[listingId];

        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }

        if (listing.status !== 'active') {
          return { success: false, error: 'Listing is no longer active' };
        }

        if (listing.sellerId === buyerId) {
          return { success: false, error: 'Cannot purchase your own listing' };
        }

        // For physical items, shipping address is required
        if (listing.itemType === 'physical' && !shippingAddress) {
          return { success: false, error: 'Shipping address required for physical items' };
        }

        const price = listing.listingType === 'auction' && listing.highestBid
          ? listing.highestBid.amount
          : listing.price;

        const shippingCost = listing.itemType === 'physical' ? (listing.shippingCost || 0) : 0;
        const { platformFee, sellerReceives } = calculateFees(price + shippingCost, currentFeePercent);

        const transaction: MarketplaceTransaction = {
          id: generateId('tx'),
          listingId,
          type: listing.listingType === 'auction' ? 'auction_win' : 'purchase',
          itemType: listing.itemType,
          sellerId: listing.sellerId,
          buyerId,
          itemTitle: listing.title,
          amount: price,
          shippingCost,
          platformFee,
          sellerReceived: sellerReceives,
          timestamp: new Date().toISOString(),
          status: 'pending',
        };

        // Create escrow for physical items
        const escrow: Escrow | undefined = listing.itemType === 'physical' ? {
          id: generateId('escrow'),
          listingId,
          buyerId,
          sellerId: listing.sellerId,
          amount: price + shippingCost,
          platformFee,
          sellerAmount: sellerReceives,
          status: 'funded',
          fundedAt: new Date().toISOString(),
        } : undefined;

        set((state) => ({
          listings: {
            ...state.listings,
            [listingId]: {
              ...listing,
              status: escrow ? 'in_escrow' : 'sold',
              buyerId,
              buyerUsername,
              buyerWallet,
              buyerShippingAddress: shippingAddress,
              finalPrice: price,
              platformFee,
              sellerReceived: sellerReceives,
              soldAt: new Date().toISOString(),
              shippingStatus: listing.itemType === 'physical' ? 'address_provided' : undefined,
              escrow,
            },
          },
          transactions: [...state.transactions, transaction],
          escrows: escrow ? { ...state.escrows, [escrow.id]: escrow } : state.escrows,
          totalVolume: state.totalVolume + price,
          totalFees: state.totalFees + platformFee,
          totalSales: state.totalSales + 1,
        }));

        // Update seller stats
        get().updateSellerStats(listing.sellerId);

        return { success: true, transaction };
      },

      // Escrow methods
      createEscrow: (listingId, buyerId, amount) => {
        const { listings, currentFeePercent } = get();
        const listing = listings[listingId];

        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }

        const { platformFee, sellerReceives } = calculateFees(amount, currentFeePercent);

        const escrow: Escrow = {
          id: generateId('escrow'),
          listingId,
          buyerId,
          sellerId: listing.sellerId,
          amount,
          platformFee,
          sellerAmount: sellerReceives,
          status: 'funded',
          fundedAt: new Date().toISOString(),
        };

        set((state) => ({
          escrows: { ...state.escrows, [escrow.id]: escrow },
          listings: {
            ...state.listings,
            [listingId]: { ...listing, escrow, status: 'in_escrow' },
          },
        }));

        return { success: true, escrow };
      },

      releaseEscrow: (listingId, buyerId) => {
        const { listings } = get();
        const listing = listings[listingId];

        if (!listing || !listing.escrow) {
          return { success: false, error: 'No escrow found' };
        }

        if (listing.escrow.buyerId !== buyerId) {
          return { success: false, error: 'Only buyer can release escrow' };
        }

        set((state) => ({
          listings: {
            ...state.listings,
            [listingId]: {
              ...listing,
              status: 'delivered',
              escrow: { ...listing.escrow!, status: 'released', releasedAt: new Date().toISOString() },
            },
          },
          escrows: {
            ...state.escrows,
            [listing.escrow!.id]: { ...listing.escrow!, status: 'released', releasedAt: new Date().toISOString() },
          },
        }));

        return { success: true };
      },

      refundEscrow: (listingId) => {
        const { listings } = get();
        const listing = listings[listingId];

        if (!listing || !listing.escrow) {
          return { success: false, error: 'No escrow found' };
        }

        set((state) => ({
          listings: {
            ...state.listings,
            [listingId]: {
              ...listing,
              status: 'cancelled',
              escrow: { ...listing.escrow!, status: 'refunded', refundedAt: new Date().toISOString() },
            },
          },
          escrows: {
            ...state.escrows,
            [listing.escrow!.id]: { ...listing.escrow!, status: 'refunded', refundedAt: new Date().toISOString() },
          },
        }));

        return { success: true };
      },

      // Review methods
      addReview: (reviewData) => {
        const { listings, reviews } = get();
        const listing = listings[reviewData.listingId];

        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }

        if (listing.status !== 'delivered' && listing.status !== 'sold') {
          return { success: false, error: 'Can only review completed transactions' };
        }

        if (listing.reviewId) {
          return { success: false, error: 'Already reviewed' };
        }

        const review: Review = {
          ...reviewData,
          id: generateId('review'),
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          reviews: { ...state.reviews, [review.id]: review },
          listings: {
            ...state.listings,
            [reviewData.listingId]: { ...listing, reviewId: review.id },
          },
        }));

        // Update seller stats
        get().updateSellerStats(reviewData.sellerId);

        return { success: true };
      },

      getSellerReviews: (sellerId) => {
        return Object.values(get().reviews).filter((r) => r.sellerId === sellerId);
      },

      // Watchlist methods
      addToWatchlist: (userId, listingId) => {
        set((state) => {
          const userWatchlist = state.watchlists[userId] || [];
          if (userWatchlist.includes(listingId)) return state;

          const listing = state.listings[listingId];
          return {
            watchlists: {
              ...state.watchlists,
              [userId]: [...userWatchlist, listingId],
            },
            listings: listing ? {
              ...state.listings,
              [listingId]: { ...listing, watchCount: listing.watchCount + 1 },
            } : state.listings,
          };
        });
      },

      removeFromWatchlist: (userId, listingId) => {
        set((state) => {
          const userWatchlist = state.watchlists[userId] || [];
          const listing = state.listings[listingId];
          return {
            watchlists: {
              ...state.watchlists,
              [userId]: userWatchlist.filter((id) => id !== listingId),
            },
            listings: listing ? {
              ...state.listings,
              [listingId]: { ...listing, watchCount: Math.max(0, listing.watchCount - 1) },
            } : state.listings,
          };
        });
      },

      getUserWatchlist: (userId) => {
        return get().watchlists[userId] || [];
      },

      isInWatchlist: (userId, listingId) => {
        return (get().watchlists[userId] || []).includes(listingId);
      },

      // Offer methods
      makeOffer: (offerData) => {
        const { listings } = get();
        const listing = listings[offerData.listingId];

        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }

        if (listing.status !== 'active') {
          return { success: false, error: 'Listing is no longer active' };
        }

        if (!listing.acceptsOffers && listing.listingType !== 'fixed') {
          return { success: false, error: 'Seller does not accept offers' };
        }

        if (offerData.amount >= listing.price) {
          return { success: false, error: 'Offer must be below asking price' };
        }

        const offer: Offer = {
          ...offerData,
          id: generateId('offer'),
          status: 'pending',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          listings: {
            ...state.listings,
            [offerData.listingId]: {
              ...listing,
              offers: [...listing.offers, offer],
            },
          },
        }));

        return { success: true };
      },

      respondToOffer: (listingId, offerId, accept, counterAmount) => {
        const { listings } = get();
        const listing = listings[listingId];

        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }

        const offerIndex = listing.offers.findIndex((o) => o.id === offerId);
        if (offerIndex === -1) {
          return { success: false, error: 'Offer not found' };
        }

        const updatedOffers = [...listing.offers];
        if (accept) {
          updatedOffers[offerIndex] = { ...updatedOffers[offerIndex], status: 'accepted' };
        } else if (counterAmount) {
          updatedOffers[offerIndex] = { ...updatedOffers[offerIndex], status: 'countered', counterAmount };
        } else {
          updatedOffers[offerIndex] = { ...updatedOffers[offerIndex], status: 'rejected' };
        }

        set((state) => ({
          listings: {
            ...state.listings,
            [listingId]: { ...listing, offers: updatedOffers },
          },
        }));

        return { success: true };
      },

      getListingOffers: (listingId) => {
        const listing = get().listings[listingId];
        return listing?.offers || [];
      },

      // Buy Now for auctions
      buyNow: (listingId, buyerId, buyerUsername, buyerWallet, shippingAddress) => {
        const { listings } = get();
        const listing = listings[listingId];

        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }

        if (listing.listingType !== 'auction' || !listing.buyNowPrice) {
          return { success: false, error: 'Buy Now not available' };
        }

        // Update the listing price to buyNowPrice and process as normal purchase
        set((state) => ({
          listings: {
            ...state.listings,
            [listingId]: { ...listing, price: listing.buyNowPrice! },
          },
        }));

        return get().purchaseListing(listingId, buyerId, buyerUsername, buyerWallet, shippingAddress);
      },

      // Featured listings
      featureListing: (listingId, durationDays) => {
        const { listings } = get();
        const listing = listings[listingId];
        if (!listing) return;

        const featuredUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

        set((state) => ({
          listings: {
            ...state.listings,
            [listingId]: { ...listing, isFeatured: true, featuredUntil },
          },
        }));
      },

      getFeaturedListings: () => {
        const now = new Date().toISOString();
        return Object.values(get().listings).filter(
          (l) => l.isFeatured && l.status === 'active' && (!l.featuredUntil || l.featuredUntil > now)
        );
      },

      // Seller stats
      getSellerStats: (sellerId) => {
        return get().sellerStats[sellerId];
      },

      updateSellerStats: (sellerId) => {
        const { listings, reviews, sellerStats } = get();
        const sellerListings = Object.values(listings).filter((l) => l.sellerId === sellerId);
        const sellerReviews = Object.values(reviews).filter((r) => r.sellerId === sellerId);

        const soldListings = sellerListings.filter((l) => l.status === 'sold' || l.status === 'delivered');
        const totalSales = soldListings.length;
        const totalVolume = soldListings.reduce((sum, l) => sum + (l.finalPrice || 0), 0);
        const totalReviews = sellerReviews.length;
        const averageRating = totalReviews > 0
          ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

        const existingStats = sellerStats[sellerId];
        const isVerified = totalSales >= 10 && averageRating >= 4.0;

        const stats: SellerStats = {
          totalSales,
          totalVolume,
          averageRating,
          totalReviews,
          joinedAt: existingStats?.joinedAt || new Date().toISOString(),
          isVerified,
          verifiedAt: isVerified && !existingStats?.verifiedAt ? new Date().toISOString() : existingStats?.verifiedAt,
        };

        set((state) => ({
          sellerStats: { ...state.sellerStats, [sellerId]: stats },
        }));
      },

      // Shipping methods for physical items
      updateBuyerShippingAddress: (listingId, address) => {
        const { listings } = get();
        const listing = listings[listingId];

        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }

        if (listing.itemType !== 'physical') {
          return { success: false, error: 'Only physical items require shipping' };
        }

        set((state) => ({
          listings: {
            ...state.listings,
            [listingId]: {
              ...listing,
              buyerShippingAddress: address,
              shippingStatus: 'address_provided',
            },
          },
        }));

        return { success: true };
      },

      requestShippingLabel: (listingId) => {
        const { listings } = get();
        const listing = listings[listingId];

        if (!listing) {
          return { success: false, error: 'Listing not found' };
        }

        if (!listing.buyerShippingAddress) {
          return { success: false, error: 'No shipping address provided' };
        }

        // Generate mock shipping label
        const carriers = ['USPS', 'UPS', 'FedEx'];
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        const trackingNumber = `${carrier.substring(0, 2).toUpperCase()}${Date.now().toString().slice(-10)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const label: ShippingLabel = {
          id: generateId('label'),
          trackingNumber,
          carrier,
          maskedAddress: getMaskedAddress(listing.buyerShippingAddress),
          createdAt: new Date().toISOString(),
          status: 'created',
        };

        set((state) => ({
          listings: {
            ...state.listings,
            [listingId]: {
              ...listing,
              shippingLabel: label,
              shippingStatus: 'label_created',
            },
          },
        }));

        return { success: true, label };
      },

      updateShippingStatus: (listingId, status) => {
        const { listings } = get();
        const listing = listings[listingId];

        if (!listing) return;

        const updates: Partial<Listing> = {
          shippingStatus: status,
        };

        // Update label status if exists
        if (listing.shippingLabel) {
          let labelStatus: ShippingLabel['status'] = listing.shippingLabel.status;
          if (status === 'shipped') labelStatus = 'shipped';
          if (status === 'in_transit') labelStatus = 'in_transit';
          if (status === 'delivered') labelStatus = 'delivered';

          updates.shippingLabel = {
            ...listing.shippingLabel,
            status: labelStatus,
          };
        }

        // Update listing status for delivered items
        if (status === 'delivered') {
          updates.status = 'delivered';
        } else if (status === 'shipped') {
          updates.status = 'shipped';
        }

        set((state) => ({
          listings: {
            ...state.listings,
            [listingId]: {
              ...listing,
              ...updates,
            },
          },
        }));
      },

      getActiveListings: () => {
        return Object.values(get().listings).filter((l) => l.status === 'active');
      },

      getListingsByCategory: (category) => {
        return Object.values(get().listings).filter(
          (l) => l.category === category && l.status === 'active'
        );
      },

      getListingsByUser: (userId) => {
        return Object.values(get().listings).filter((l) => l.sellerId === userId);
      },

      getListingById: (id) => {
        return get().listings[id];
      },

      getUserTransactions: (userId) => {
        return get().transactions.filter(
          (t) => t.sellerId === userId || t.buyerId === userId
        );
      },

      getSimilarListings: (listingId, limit = 4) => {
        const listing = get().listings[listingId];
        if (!listing) return [];

        return Object.values(get().listings)
          .filter((l) =>
            l.id !== listingId &&
            l.status === 'active' &&
            (l.category === listing.category || l.itemType === listing.itemType)
          )
          .sort((a, b) => {
            // Prioritize same category
            const aScore = (a.category === listing.category ? 2 : 0) + (a.itemType === listing.itemType ? 1 : 0);
            const bScore = (b.category === listing.category ? 2 : 0) + (b.itemType === listing.itemType ? 1 : 0);
            return bScore - aScore;
          })
          .slice(0, limit);
      },
    }),
    {
      name: 'marketplace-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper to format AVAX with fee breakdown
export function formatPriceWithFee(price: number): {
  total: string;
  fee: string;
  sellerReceives: string;
} {
  const { platformFee, sellerReceives } = calculateFees(price);
  return {
    total: price.toFixed(4),
    fee: platformFee.toFixed(4),
    sellerReceives: sellerReceives.toFixed(4),
  };
}
