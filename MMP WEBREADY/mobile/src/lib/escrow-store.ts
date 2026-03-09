import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Order status enum matching smart contract
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

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

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

export const OrderStatusColors: Record<number, string> = {
  0: '#6b7280', // gray
  1: '#8b5cf6', // violet
  2: '#3b82f6', // blue
  3: '#0ea5e9', // sky
  4: '#22c55e', // green
  5: '#f59e0b', // amber
  6: '#10b981', // emerald
  7: '#ef4444', // red
  8: '#f97316', // orange
  9: '#71717a', // zinc
};

// Carrier enum matching smart contract
export const Carrier = {
  USPS: 0,
  UPS: 1,
  FedEx: 2,
  DHL: 3,
  Other: 4,
} as const;

export type CarrierType = typeof Carrier[keyof typeof Carrier];

export const CarrierLabels: Record<number, string> = {
  0: 'USPS',
  1: 'UPS',
  2: 'FedEx',
  3: 'DHL',
  4: 'Other',
};

// Escrow order interface
export interface EscrowOrder {
  id: number;
  buyer: string;
  seller: string;
  amount: string; // in AVAX
  amountWei: string;
  platformFee: string;
  createdAt: number;
  shippedAt: number;
  deliveredAt: number;
  disputeDeadline: number;
  status: OrderStatusType;
  carrier: CarrierType;
  trackingNumber: string;
  itemDescription: string;
  // Local-only fields
  listingId?: string;
  shopId?: string;
  shopName?: string;
  itemImage?: string;
}

// Dispute info interface
export interface DisputeInfo {
  orderId: number;
  initiator: string;
  reason: string;
  createdAt: number;
  resolved: boolean;
  winner: string | null;
}

// Network configuration
export type Network = 'fuji' | 'mainnet';

export const NetworkConfig = {
  fuji: {
    name: 'Avalanche Fuji Testnet',
    chainId: 43113,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    isTestnet: true,
  },
  mainnet: {
    name: 'Avalanche C-Chain',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    isTestnet: false,
  },
};

// Escrow store state
interface EscrowState {
  // Network
  network: Network;

  // Orders
  buyerOrders: EscrowOrder[];
  sellerOrders: EscrowOrder[];

  // Disputes
  disputes: Record<number, DisputeInfo>;

  // Loading states
  isLoading: boolean;
  isCreatingOrder: boolean;
  isShippingOrder: boolean;

  // Actions
  setNetwork: (network: Network) => void;
  setBuyerOrders: (orders: EscrowOrder[]) => void;
  setSellerOrders: (orders: EscrowOrder[]) => void;
  addBuyerOrder: (order: EscrowOrder) => void;
  addSellerOrder: (order: EscrowOrder) => void;
  updateOrder: (orderId: number, updates: Partial<EscrowOrder>) => void;
  setDispute: (orderId: number, dispute: DisputeInfo) => void;
  setLoading: (isLoading: boolean) => void;
  setCreatingOrder: (isCreating: boolean) => void;
  setShippingOrder: (isShipping: boolean) => void;
  getOrderById: (orderId: number) => EscrowOrder | undefined;
  clearOrders: () => void;
}

export const useEscrowStore = create<EscrowState>()(
  persist(
    (set, get) => ({
      network: 'fuji',
      buyerOrders: [],
      sellerOrders: [],
      disputes: {},
      isLoading: false,
      isCreatingOrder: false,
      isShippingOrder: false,

      setNetwork: (network) => {
        set({ network, buyerOrders: [], sellerOrders: [], disputes: {} });
      },

      setBuyerOrders: (orders) => {
        set({ buyerOrders: orders });
      },

      setSellerOrders: (orders) => {
        set({ sellerOrders: orders });
      },

      addBuyerOrder: (order) => {
        set((state) => ({
          buyerOrders: [order, ...state.buyerOrders.filter(o => o.id !== order.id)],
        }));
      },

      addSellerOrder: (order) => {
        set((state) => ({
          sellerOrders: [order, ...state.sellerOrders.filter(o => o.id !== order.id)],
        }));
      },

      updateOrder: (orderId, updates) => {
        set((state) => ({
          buyerOrders: state.buyerOrders.map(o =>
            o.id === orderId ? { ...o, ...updates } : o
          ),
          sellerOrders: state.sellerOrders.map(o =>
            o.id === orderId ? { ...o, ...updates } : o
          ),
        }));
      },

      setDispute: (orderId, dispute) => {
        set((state) => ({
          disputes: { ...state.disputes, [orderId]: dispute },
        }));
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setCreatingOrder: (isCreatingOrder) => {
        set({ isCreatingOrder });
      },

      setShippingOrder: (isShippingOrder) => {
        set({ isShippingOrder });
      },

      getOrderById: (orderId) => {
        const state = get();
        return state.buyerOrders.find(o => o.id === orderId) ||
               state.sellerOrders.find(o => o.id === orderId);
      },

      clearOrders: () => {
        set({ buyerOrders: [], sellerOrders: [], disputes: {} });
      },
    }),
    {
      name: 'escrow-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        network: state.network,
        buyerOrders: state.buyerOrders,
        sellerOrders: state.sellerOrders,
      }),
    }
  )
);

// Helper functions
export function getStatusLabel(status: number): string {
  return OrderStatusLabels[status] || 'Unknown';
}

export function getStatusColor(status: number): string {
  return OrderStatusColors[status] || '#6b7280';
}

export function getCarrierLabel(carrier: number): string {
  return CarrierLabels[carrier] || 'Unknown';
}

export function canCancelOrder(status: number): boolean {
  return status === OrderStatus.Funded;
}

export function canShipOrder(status: number): boolean {
  return status === OrderStatus.Funded;
}

export function canConfirmDelivery(status: number): boolean {
  return status === OrderStatus.Shipped || status === OrderStatus.InTransit;
}

export function canOpenDispute(status: number): boolean {
  return status === OrderStatus.DisputeWindow;
}

export function canCompleteOrder(status: number): boolean {
  return status === OrderStatus.DisputeWindow;
}

export function isOrderFinal(status: number): boolean {
  return [OrderStatus.Completed, OrderStatus.Refunded, OrderStatus.Cancelled].includes(status as 6 | 8 | 9);
}

export function formatDisputeTimeRemaining(deadline: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = deadline - now;

  if (remaining <= 0) return 'Expired';

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export function getExplorerUrl(network: Network, txHash: string): string {
  const config = NetworkConfig[network];
  return `${config.explorerUrl}/tx/${txHash}`;
}

export function getAddressExplorerUrl(network: Network, address: string): string {
  const config = NetworkConfig[network];
  return `${config.explorerUrl}/address/${address}`;
}
