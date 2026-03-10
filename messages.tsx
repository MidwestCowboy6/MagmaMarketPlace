import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { ShippingAddress } from './marketplace-store';
import { MASTER_WALLET_ADDRESS, MASTER_USER_ID } from './marketplace-store';

// User profile interface
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  walletAddress: string | null;
  shippingAddress: ShippingAddress | null;
  createdAt: string;
  updatedAt: string;
  // Stats
  totalSales: number;
  totalPurchases: number;
  totalTrades: number;
  reputation: number; // 0-100
}

// Auth state interface
interface AuthState {
  // User state
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Stored users (local auth - in production use a real backend)
  users: Record<string, { profile: UserProfile; passwordHash: string }>;

  // Actions
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  linkWallet: (walletAddress: string) => void;
  unlinkWallet: () => void;
  deleteAccount: () => void;
}

// Simple hash function for passwords (in production, use proper backend auth)
async function hashPassword(password: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + 'anitrack-salt-2024'
  );
  return digest;
}

// Generate unique ID
function generateId(): string {
  return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Generate random avatar
function generateAvatar(username: string): string {
  const colors = ['FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7', 'DDA0DD', '98D8C8'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=${color}&color=fff&size=200`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      users: {},

      signUp: async (email, password, username) => {
        const { users } = get();
        const normalizedEmail = email.toLowerCase().trim();

        // Validate inputs
        if (!email || !password || !username) {
          return { success: false, error: 'All fields are required' };
        }

        if (password.length < 6) {
          return { success: false, error: 'Password must be at least 6 characters' };
        }

        if (username.length < 3) {
          return { success: false, error: 'Username must be at least 3 characters' };
        }

        // Check if email already exists
        const existingUser = Object.values(users).find(
          (u) => u.profile.email === normalizedEmail
        );
        if (existingUser) {
          return { success: false, error: 'Email already registered' };
        }

        // Check if username already exists
        const existingUsername = Object.values(users).find(
          (u) => u.profile.username.toLowerCase() === username.toLowerCase()
        );
        if (existingUsername) {
          return { success: false, error: 'Username already taken' };
        }

        // Create new user
        const passwordHash = await hashPassword(password);
        const now = new Date().toISOString();
        const userId = generateId();

        const newProfile: UserProfile = {
          id: userId,
          email: normalizedEmail,
          username: username.trim(),
          displayName: username.trim(),
          avatarUrl: generateAvatar(username),
          walletAddress: null,
          shippingAddress: null,
          createdAt: now,
          updatedAt: now,
          totalSales: 0,
          totalPurchases: 0,
          totalTrades: 0,
          reputation: 100,
        };

        set((state) => ({
          users: {
            ...state.users,
            [userId]: { profile: newProfile, passwordHash },
          },
          user: newProfile,
          isAuthenticated: true,
        }));

        return { success: true };
      },

      signIn: async (email, password) => {
        const { users } = get();
        const normalizedEmail = email.toLowerCase().trim();

        // Find user by email
        const userEntry = Object.values(users).find(
          (u) => u.profile.email === normalizedEmail
        );

        if (!userEntry) {
          return { success: false, error: 'Invalid email or password' };
        }

        // Check password
        const passwordHash = await hashPassword(password);
        if (passwordHash !== userEntry.passwordHash) {
          return { success: false, error: 'Invalid email or password' };
        }

        set({
          user: userEntry.profile,
          isAuthenticated: true,
        });

        return { success: true };
      },

      signOut: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      updateProfile: (updates) => {
        const { user, users } = get();
        if (!user) return;

        const updatedProfile: UserProfile = {
          ...user,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          user: updatedProfile,
          users: {
            ...state.users,
            [user.id]: {
              ...state.users[user.id],
              profile: updatedProfile,
            },
          },
        }));
      },

      linkWallet: (walletAddress) => {
        const { updateProfile } = get();
        updateProfile({ walletAddress: walletAddress.toLowerCase() });
      },

      unlinkWallet: () => {
        const { updateProfile } = get();
        updateProfile({ walletAddress: null });
      },

      deleteAccount: () => {
        const { user } = get();
        if (!user) return;

        set((state) => {
          const { [user.id]: removed, ...remainingUsers } = state.users;
          return {
            users: remainingUsers,
            user: null,
            isAuthenticated: false,
          };
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper to check if user has wallet linked
export function hasLinkedWallet(user: UserProfile | null): boolean {
  return user?.walletAddress !== null && user?.walletAddress !== undefined;
}

// Check if user is master account
export function isMasterAccount(user: UserProfile | null): boolean {
  return user?.id === MASTER_USER_ID;
}
