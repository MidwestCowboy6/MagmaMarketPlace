import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Transaction type
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string; // in AVAX
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'send' | 'receive';
  gasUsed?: string;
  gasPrice?: string;
}

// Saved wallet type
export interface SavedWallet {
  address: string;
  name: string;
  addedAt: number;
}

// Wallet state interface
interface WalletState {
  // Connection state
  isConnected: boolean;
  address: string | null;
  chainId: number | null;

  // Multi-wallet support
  savedWallets: SavedWallet[];

  // Balance
  balance: string; // in AVAX
  balanceUSD: number;

  // Transactions
  transactions: Transaction[];

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;

  // Actions
  connect: (address: string, chainId?: number) => void;
  disconnect: () => void;
  setBalance: (balance: string, balanceUSD: number) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransactionStatus: (hash: string, status: Transaction['status']) => void;
  setLoading: (isLoading: boolean) => void;
  setRefreshing: (isRefreshing: boolean) => void;

  // Multi-wallet actions
  addSavedWallet: (address: string, name: string) => void;
  removeSavedWallet: (address: string) => void;
  renameSavedWallet: (address: string, name: string) => void;
  switchWallet: (address: string) => void;
}

// Avalanche C-Chain ID
export const AVALANCHE_CHAIN_ID = 43114;
export const AVALANCHE_FUJI_CHAIN_ID = 43113; // Testnet

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      isConnected: false,
      address: null,
      chainId: null,
      savedWallets: [],
      balance: '0',
      balanceUSD: 0,
      transactions: [],
      isLoading: false,
      isRefreshing: false,

      connect: (address, chainId = AVALANCHE_CHAIN_ID) => {
        const lowerAddress = address.toLowerCase();
        const { savedWallets } = get();

        // Auto-add to saved wallets if not already there
        const exists = savedWallets.some(w => w.address.toLowerCase() === lowerAddress);
        const newWallets = exists ? savedWallets : [
          ...savedWallets,
          { address: lowerAddress, name: `Wallet ${savedWallets.length + 1}`, addedAt: Date.now() }
        ];

        set({
          isConnected: true,
          address: lowerAddress,
          chainId,
          savedWallets: newWallets,
        });
      },

      disconnect: () => {
        set({
          isConnected: false,
          address: null,
          chainId: null,
          balance: '0',
          balanceUSD: 0,
          transactions: [],
        });
      },

      setBalance: (balance, balanceUSD) => {
        set({ balance, balanceUSD });
      },

      setTransactions: (transactions) => {
        set({ transactions });
      },

      addTransaction: (transaction) => {
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        }));
      },

      updateTransactionStatus: (hash, status) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.hash === hash ? { ...tx, status } : tx
          ),
        }));
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setRefreshing: (isRefreshing) => {
        set({ isRefreshing });
      },

      addSavedWallet: (address, name) => {
        const lowerAddress = address.toLowerCase();
        set((state) => {
          const exists = state.savedWallets.some(w => w.address.toLowerCase() === lowerAddress);
          if (exists) return state;
          return {
            savedWallets: [
              ...state.savedWallets,
              { address: lowerAddress, name, addedAt: Date.now() }
            ]
          };
        });
      },

      removeSavedWallet: (address) => {
        const lowerAddress = address.toLowerCase();
        set((state) => ({
          savedWallets: state.savedWallets.filter(w => w.address.toLowerCase() !== lowerAddress)
        }));
      },

      renameSavedWallet: (address, name) => {
        const lowerAddress = address.toLowerCase();
        set((state) => ({
          savedWallets: state.savedWallets.map(w =>
            w.address.toLowerCase() === lowerAddress ? { ...w, name } : w
          )
        }));
      },

      switchWallet: (address) => {
        const lowerAddress = address.toLowerCase();
        const { savedWallets, chainId } = get();
        const wallet = savedWallets.find(w => w.address.toLowerCase() === lowerAddress);
        if (wallet) {
          set({
            isConnected: true,
            address: lowerAddress,
            chainId: chainId || AVALANCHE_CHAIN_ID,
            balance: '0',
            balanceUSD: 0,
            transactions: [],
          });
        }
      },
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isConnected: state.isConnected,
        address: state.address,
        chainId: state.chainId,
        savedWallets: state.savedWallets,
      }),
    }
  )
);

// Helper to format address for display
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper to format AVAX amount
export function formatAVAX(amount: string, decimals: number = 4): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
}

// Helper to validate Avalanche address
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
