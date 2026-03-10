import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Crown tier based on star rating
export type CrownTier = 'coal' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'sapphire';

// Rating categories for comprehensive seller evaluation
export interface RatingCategories {
  delivery: number; // 1-5: How effective at delivery
  timeliness: number; // 1-5: How timely was the transaction
  communication: number; // 1-5: How well did they communicate
  accuracy: number; // 1-5: Item as described
  packaging: number; // 1-5: How well was item packaged (physical only)
}

// Transaction rating/review
export interface TransactionRating {
  id: string;
  transactionId: string;
  listingId: string;
  raterId: string; // User who left the rating
  raterUsername: string;
  ratedUserId: string; // User being rated
  ratedUsername: string;
  ratingType: 'buyer_to_seller' | 'seller_to_buyer';
  categories: RatingCategories;
  overallRating: number; // Calculated average 1-5
  sentiment: 'positive' | 'negative' | 'neutral';
  comment: string;
  response?: string; // Seller can respond to reviews
  responseAt?: string;
  createdAt: string;
  itemType: 'physical' | 'digital' | 'nft';
}

// User rating summary
export interface UserRatingSummary {
  userId: string;
  totalRatings: number;
  averageRating: number; // 1-5
  crownTier: CrownTier;

  // Breakdown by category
  avgDelivery: number;
  avgTimeliness: number;
  avgCommunication: number;
  avgAccuracy: number;
  avgPackaging: number;

  // Sentiment breakdown
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;

  // Recent activity
  lastRatingAt?: string;

  // Badge earned
  isTopSeller: boolean; // 4.5+ with 10+ sales
  isVerified: boolean; // Platform verified
  isPlatformOwner: boolean; // Sapphire crown
}

// Rating state
interface RatingState {
  ratings: Record<string, TransactionRating>;
  userSummaries: Record<string, UserRatingSummary>;

  // Actions
  submitRating: (rating: Omit<TransactionRating, 'id' | 'createdAt' | 'overallRating'>) => { success: boolean; error?: string };
  respondToRating: (ratingId: string, response: string) => { success: boolean; error?: string };
  getUserRatings: (userId: string) => TransactionRating[];
  getTransactionRating: (transactionId: string, ratingType: 'buyer_to_seller' | 'seller_to_buyer') => TransactionRating | undefined;
  getUserSummary: (userId: string) => UserRatingSummary;
  updateUserSummary: (userId: string) => void;
  getCrownTier: (averageRating: number, isPlatformOwner?: boolean) => CrownTier;
  hasUserRatedTransaction: (userId: string, transactionId: string, ratingType: 'buyer_to_seller' | 'seller_to_buyer') => boolean;
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate overall rating from categories
function calculateOverallRating(categories: RatingCategories, itemType: string): number {
  const { delivery, timeliness, communication, accuracy, packaging } = categories;

  // For physical items, include packaging; for digital/NFT, exclude it
  if (itemType === 'physical') {
    return (delivery + timeliness + communication + accuracy + packaging) / 5;
  }

  return (delivery + timeliness + communication + accuracy) / 4;
}

// Determine sentiment from rating
function determineSentiment(overallRating: number): 'positive' | 'negative' | 'neutral' {
  if (overallRating >= 4) return 'positive';
  if (overallRating <= 2) return 'negative';
  return 'neutral';
}

// Get crown tier from rating
function getCrownTierFromRating(averageRating: number, isPlatformOwner: boolean = false): CrownTier {
  if (isPlatformOwner) return 'sapphire';
  if (averageRating >= 4.5) return 'platinum';
  if (averageRating >= 3.5) return 'gold';
  if (averageRating >= 2.5) return 'silver';
  if (averageRating >= 1.5) return 'bronze';
  return 'coal';
}

// Crown tier colors
export const CROWN_COLORS: Record<CrownTier, { primary: string; secondary: string; glow: string }> = {
  coal: { primary: '#374151', secondary: '#1f2937', glow: '#4b5563' },
  bronze: { primary: '#cd7f32', secondary: '#8b5a2b', glow: '#d4a574' },
  silver: { primary: '#c0c0c0', secondary: '#a8a8a8', glow: '#e8e8e8' },
  gold: { primary: '#ffd700', secondary: '#daa520', glow: '#ffed4a' },
  platinum: { primary: '#e5e4e2', secondary: '#b0b0b0', glow: '#ffffff' },
  sapphire: { primary: '#0f52ba', secondary: '#082567', glow: '#6495ed' },
};

// Crown tier names
export const CROWN_NAMES: Record<CrownTier, string> = {
  coal: 'Coal Crown',
  bronze: 'Bronze Crown',
  silver: 'Silver Crown',
  gold: 'Gold Crown',
  platinum: 'Platinum Crown',
  sapphire: 'Sapphire Crystal Crown',
};

// Star requirements for each tier
export const TIER_REQUIREMENTS: Record<CrownTier, { min: number; max: number; description: string }> = {
  coal: { min: 0, max: 1.49, description: 'Needs improvement' },
  bronze: { min: 1.5, max: 2.49, description: 'Getting started' },
  silver: { min: 2.5, max: 3.49, description: 'Good seller' },
  gold: { min: 3.5, max: 4.49, description: 'Great seller' },
  platinum: { min: 4.5, max: 5, description: 'Top seller' },
  sapphire: { min: 0, max: 5, description: 'Platform Owner' },
};

export const useRatingStore = create<RatingState>()(
  persist(
    (set, get) => ({
      ratings: {},
      userSummaries: {},

      submitRating: (ratingData) => {
        const { ratings } = get();

        // Check if user already rated this transaction with this type
        const existingRating = Object.values(ratings).find(
          r => r.transactionId === ratingData.transactionId &&
               r.raterId === ratingData.raterId &&
               r.ratingType === ratingData.ratingType
        );

        if (existingRating) {
          return { success: false, error: 'You have already rated this transaction' };
        }

        // Validate rating values
        const { delivery, timeliness, communication, accuracy, packaging } = ratingData.categories;
        if ([delivery, timeliness, communication, accuracy, packaging].some(r => r < 1 || r > 5)) {
          return { success: false, error: 'Ratings must be between 1 and 5' };
        }

        const overallRating = calculateOverallRating(ratingData.categories, ratingData.itemType);
        const sentiment = ratingData.sentiment || determineSentiment(overallRating);

        const rating: TransactionRating = {
          ...ratingData,
          id: generateId('rating'),
          overallRating: Math.round(overallRating * 10) / 10, // Round to 1 decimal
          sentiment,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          ratings: { ...state.ratings, [rating.id]: rating },
        }));

        // Update the rated user's summary
        get().updateUserSummary(ratingData.ratedUserId);

        return { success: true };
      },

      respondToRating: (ratingId, response) => {
        const { ratings } = get();
        const rating = ratings[ratingId];

        if (!rating) {
          return { success: false, error: 'Rating not found' };
        }

        if (rating.response) {
          return { success: false, error: 'Already responded to this rating' };
        }

        set((state) => ({
          ratings: {
            ...state.ratings,
            [ratingId]: {
              ...rating,
              response,
              responseAt: new Date().toISOString(),
            },
          },
        }));

        return { success: true };
      },

      getUserRatings: (userId) => {
        return Object.values(get().ratings)
          .filter(r => r.ratedUserId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getTransactionRating: (transactionId, ratingType) => {
        return Object.values(get().ratings).find(
          r => r.transactionId === transactionId && r.ratingType === ratingType
        );
      },

      getUserSummary: (userId) => {
        const { userSummaries } = get();

        // Check if user is platform owner
        const isPlatformOwner = userId === 'N263Jm6mbFiYbvQ3KIRgXq66xXYRiLTx';

        if (userSummaries[userId]) {
          return { ...userSummaries[userId], isPlatformOwner };
        }

        // Return default summary for new users
        return {
          userId,
          totalRatings: 0,
          averageRating: 0,
          crownTier: isPlatformOwner ? 'sapphire' : 'coal',
          avgDelivery: 0,
          avgTimeliness: 0,
          avgCommunication: 0,
          avgAccuracy: 0,
          avgPackaging: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          isTopSeller: false,
          isVerified: false,
          isPlatformOwner,
        };
      },

      updateUserSummary: (userId) => {
        const ratings = get().getUserRatings(userId);
        const isPlatformOwner = userId === 'N263Jm6mbFiYbvQ3KIRgXq66xXYRiLTx';

        if (ratings.length === 0) {
          set((state) => ({
            userSummaries: {
              ...state.userSummaries,
              [userId]: {
                userId,
                totalRatings: 0,
                averageRating: 0,
                crownTier: isPlatformOwner ? 'sapphire' : 'coal',
                avgDelivery: 0,
                avgTimeliness: 0,
                avgCommunication: 0,
                avgAccuracy: 0,
                avgPackaging: 0,
                positiveCount: 0,
                negativeCount: 0,
                neutralCount: 0,
                isTopSeller: false,
                isVerified: false,
                isPlatformOwner,
              },
            },
          }));
          return;
        }

        const totalRatings = ratings.length;
        const avgDelivery = ratings.reduce((sum, r) => sum + r.categories.delivery, 0) / totalRatings;
        const avgTimeliness = ratings.reduce((sum, r) => sum + r.categories.timeliness, 0) / totalRatings;
        const avgCommunication = ratings.reduce((sum, r) => sum + r.categories.communication, 0) / totalRatings;
        const avgAccuracy = ratings.reduce((sum, r) => sum + r.categories.accuracy, 0) / totalRatings;
        const avgPackaging = ratings.reduce((sum, r) => sum + r.categories.packaging, 0) / totalRatings;
        const averageRating = ratings.reduce((sum, r) => sum + r.overallRating, 0) / totalRatings;

        const positiveCount = ratings.filter(r => r.sentiment === 'positive').length;
        const negativeCount = ratings.filter(r => r.sentiment === 'negative').length;
        const neutralCount = ratings.filter(r => r.sentiment === 'neutral').length;

        const lastRatingAt = ratings[0]?.createdAt;

        const crownTier = getCrownTierFromRating(averageRating, isPlatformOwner);
        const isTopSeller = averageRating >= 4.5 && totalRatings >= 10;

        set((state) => ({
          userSummaries: {
            ...state.userSummaries,
            [userId]: {
              userId,
              totalRatings,
              averageRating: Math.round(averageRating * 10) / 10,
              crownTier,
              avgDelivery: Math.round(avgDelivery * 10) / 10,
              avgTimeliness: Math.round(avgTimeliness * 10) / 10,
              avgCommunication: Math.round(avgCommunication * 10) / 10,
              avgAccuracy: Math.round(avgAccuracy * 10) / 10,
              avgPackaging: Math.round(avgPackaging * 10) / 10,
              positiveCount,
              negativeCount,
              neutralCount,
              lastRatingAt,
              isTopSeller,
              isVerified: totalRatings >= 5 && averageRating >= 4.0,
              isPlatformOwner,
            },
          },
        }));
      },

      getCrownTier: (averageRating, isPlatformOwner = false) => {
        return getCrownTierFromRating(averageRating, isPlatformOwner);
      },

      hasUserRatedTransaction: (userId, transactionId, ratingType) => {
        return Object.values(get().ratings).some(
          r => r.transactionId === transactionId &&
               r.raterId === userId &&
               r.ratingType === ratingType
        );
      },
    }),
    {
      name: 'rating-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
