import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserRatingSummary } from './rating-store';

// Shop interface
export interface Shop {
  id: string;
  ownerId: string;
  ownerUsername: string;
  name: string;
  description: string;
  bannerUrl: string | null;
  logoUrl: string | null;
  category: ShopCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  followerCount: number;
  totalSales: number;
}

// Shop categories
export type ShopCategory =
  | 'general'
  | 'collectibles'
  | 'electronics'
  | 'clothing'
  | 'art'
  | 'gaming'
  | 'sports'
  | 'jewelry'
  | 'handmade'
  | 'vintage'
  | 'other';

export const SHOP_CATEGORIES: { value: ShopCategory; label: string; icon: string }[] = [
  { value: 'general', label: 'General', icon: 'store' },
  { value: 'collectibles', label: 'Collectibles', icon: 'gem' },
  { value: 'electronics', label: 'Electronics', icon: 'cpu' },
  { value: 'clothing', label: 'Clothing', icon: 'shirt' },
  { value: 'art', label: 'Art', icon: 'palette' },
  { value: 'gaming', label: 'Gaming', icon: 'gamepad-2' },
  { value: 'sports', label: 'Sports', icon: 'trophy' },
  { value: 'jewelry', label: 'Jewelry', icon: 'diamond' },
  { value: 'handmade', label: 'Handmade', icon: 'hand' },
  { value: 'vintage', label: 'Vintage', icon: 'clock' },
  { value: 'other', label: 'Other', icon: 'more-horizontal' },
];

// Shop state
interface ShopState {
  shops: Record<string, Shop>;
  followers: Record<string, string[]>; // shopId -> userId[]

  // Actions
  createShop: (
    ownerId: string,
    ownerUsername: string,
    name: string,
    description: string,
    category: ShopCategory,
    tags?: string[]
  ) => { success: boolean; shop?: Shop; error?: string };
  updateShop: (
    shopId: string,
    updates: Partial<Pick<Shop, 'name' | 'description' | 'category' | 'tags' | 'bannerUrl' | 'logoUrl' | 'isActive'>>
  ) => { success: boolean; error?: string };
  deleteShop: (shopId: string) => { success: boolean; error?: string };
  getShopByOwnerId: (ownerId: string) => Shop | undefined;
  getShopById: (shopId: string) => Shop | undefined;
  getAllShops: () => Shop[];
  searchShops: (query: string, category?: ShopCategory) => Shop[];
  followShop: (shopId: string, userId: string) => void;
  unfollowShop: (shopId: string, userId: string) => void;
  isFollowing: (shopId: string, userId: string) => boolean;
  getFollowerCount: (shopId: string) => number;
  incrementShopSales: (shopId: string) => void;
}

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      shops: {},
      followers: {},

      createShop: (ownerId, ownerUsername, name, description, category, tags = []) => {
        const { shops } = get();

        // Check if user already has a shop
        const existingShop = Object.values(shops).find((s) => s.ownerId === ownerId);
        if (existingShop) {
          return { success: false, error: 'You already have a shop' };
        }

        // Validate inputs
        if (!name.trim()) {
          return { success: false, error: 'Shop name is required' };
        }

        if (name.length < 3) {
          return { success: false, error: 'Shop name must be at least 3 characters' };
        }

        if (name.length > 50) {
          return { success: false, error: 'Shop name must be less than 50 characters' };
        }

        // Check for duplicate shop names
        const duplicateName = Object.values(shops).find(
          (s) => s.name.toLowerCase() === name.toLowerCase().trim()
        );
        if (duplicateName) {
          return { success: false, error: 'A shop with this name already exists' };
        }

        const now = new Date().toISOString();
        const shop: Shop = {
          id: generateId('shop'),
          ownerId,
          ownerUsername,
          name: name.trim(),
          description: description.trim(),
          bannerUrl: null,
          logoUrl: null,
          category,
          tags,
          createdAt: now,
          updatedAt: now,
          isActive: true,
          followerCount: 0,
          totalSales: 0,
        };

        set((state) => ({
          shops: { ...state.shops, [shop.id]: shop },
        }));

        return { success: true, shop };
      },

      updateShop: (shopId, updates) => {
        const { shops } = get();
        const shop = shops[shopId];

        if (!shop) {
          return { success: false, error: 'Shop not found' };
        }

        // Validate name if being updated
        if (updates.name !== undefined) {
          if (!updates.name.trim()) {
            return { success: false, error: 'Shop name is required' };
          }
          if (updates.name.length < 3) {
            return { success: false, error: 'Shop name must be at least 3 characters' };
          }
          if (updates.name.length > 50) {
            return { success: false, error: 'Shop name must be less than 50 characters' };
          }

          // Check for duplicate names
          const duplicateName = Object.values(shops).find(
            (s) => s.id !== shopId && s.name.toLowerCase() === updates.name!.toLowerCase().trim()
          );
          if (duplicateName) {
            return { success: false, error: 'A shop with this name already exists' };
          }
        }

        set((state) => ({
          shops: {
            ...state.shops,
            [shopId]: {
              ...shop,
              ...updates,
              name: updates.name?.trim() ?? shop.name,
              description: updates.description?.trim() ?? shop.description,
              updatedAt: new Date().toISOString(),
            },
          },
        }));

        return { success: true };
      },

      deleteShop: (shopId) => {
        const { shops, followers } = get();

        if (!shops[shopId]) {
          return { success: false, error: 'Shop not found' };
        }

        set((state) => {
          const { [shopId]: removedShop, ...remainingShops } = state.shops;
          const { [shopId]: removedFollowers, ...remainingFollowers } = state.followers;
          return {
            shops: remainingShops,
            followers: remainingFollowers,
          };
        });

        return { success: true };
      },

      getShopByOwnerId: (ownerId) => {
        return Object.values(get().shops).find((s) => s.ownerId === ownerId);
      },

      getShopById: (shopId) => {
        return get().shops[shopId];
      },

      getAllShops: () => {
        return Object.values(get().shops).filter((s) => s.isActive);
      },

      searchShops: (query, category) => {
        const shops = Object.values(get().shops).filter((s) => s.isActive);
        const lowerQuery = query.toLowerCase().trim();

        return shops.filter((shop) => {
          // Category filter
          if (category && shop.category !== category) {
            return false;
          }

          // No query = return all (with category filter)
          if (!lowerQuery) {
            return true;
          }

          // Search by name, description, owner username, or tags
          return (
            shop.name.toLowerCase().includes(lowerQuery) ||
            shop.description.toLowerCase().includes(lowerQuery) ||
            shop.ownerUsername.toLowerCase().includes(lowerQuery) ||
            shop.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
          );
        });
      },

      followShop: (shopId, userId) => {
        set((state) => {
          const currentFollowers = state.followers[shopId] || [];
          if (currentFollowers.includes(userId)) {
            return state; // Already following
          }

          const newFollowers = [...currentFollowers, userId];
          const shop = state.shops[shopId];

          return {
            followers: { ...state.followers, [shopId]: newFollowers },
            shops: shop
              ? {
                  ...state.shops,
                  [shopId]: { ...shop, followerCount: newFollowers.length },
                }
              : state.shops,
          };
        });
      },

      unfollowShop: (shopId, userId) => {
        set((state) => {
          const currentFollowers = state.followers[shopId] || [];
          const newFollowers = currentFollowers.filter((id) => id !== userId);
          const shop = state.shops[shopId];

          return {
            followers: { ...state.followers, [shopId]: newFollowers },
            shops: shop
              ? {
                  ...state.shops,
                  [shopId]: { ...shop, followerCount: newFollowers.length },
                }
              : state.shops,
          };
        });
      },

      isFollowing: (shopId, userId) => {
        const followers = get().followers[shopId] || [];
        return followers.includes(userId);
      },

      getFollowerCount: (shopId) => {
        return get().followers[shopId]?.length || 0;
      },

      incrementShopSales: (shopId) => {
        set((state) => {
          const shop = state.shops[shopId];
          if (!shop) return state;

          return {
            shops: {
              ...state.shops,
              [shopId]: { ...shop, totalSales: shop.totalSales + 1 },
            },
          };
        });
      },
    }),
    {
      name: 'shop-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
