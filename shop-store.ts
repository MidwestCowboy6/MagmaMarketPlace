// Avalanche API service for fetching wallet data
// Uses public Avalanche C-Chain RPC and Snowtrace API

import { type Transaction } from './wallet-store';

// Avalanche C-Chain RPC endpoints
const AVALANCHE_RPC = 'https://api.avax.network/ext/bc/C/rpc';
const SNOWTRACE_API = 'https://api.snowtrace.io/api';

// Backend URL for proxied requests
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'http://localhost:3000';

// Fetch AVAX balance for an address
export async function getAVAXBalance(address: string): Promise<string> {
  try {
    const response = await fetch(AVALANCHE_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    });

    const data = await response.json();
    if (data.result) {
      // Convert from wei to AVAX (18 decimals)
      const balanceWei = BigInt(data.result);
      const balanceAVAX = Number(balanceWei) / 1e18;
      return balanceAVAX.toString();
    }
    return '0';
  } catch (error) {
    console.error('Error fetching AVAX balance:', error);
    return '0';
  }
}

// Fetch current AVAX price in USD
export async function getAVAXPrice(): Promise<number> {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/price/avax`
    );
    const data = await response.json() as { price?: number };
    return data.price ?? 0;
  } catch (error) {
    console.error('Error fetching AVAX price:', error);
    return 0;
  }
}

// Fetch transaction history for an address
export async function getTransactionHistory(
  address: string,
  page: number = 1,
  limit: number = 20
): Promise<Transaction[]> {
  try {
    // Using Snowtrace API (Avalanche's block explorer API)
    const response = await fetch(
      `${SNOWTRACE_API}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${limit}&sort=desc`
    );

    const data = await response.json();

    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.map((tx: {
        hash: string;
        from: string;
        to: string;
        value: string;
        timeStamp: string;
        isError: string;
        gasUsed: string;
        gasPrice: string;
      }) => ({
        hash: tx.hash,
        from: tx.from.toLowerCase(),
        to: tx.to?.toLowerCase() || '',
        value: (Number(tx.value) / 1e18).toString(),
        timestamp: parseInt(tx.timeStamp) * 1000,
        status: tx.isError === '0' ? 'confirmed' : 'failed',
        type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

// Get gas price
export async function getGasPrice(): Promise<string> {
  try {
    const response = await fetch(AVALANCHE_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_gasPrice',
        params: [],
      }),
    });

    const data = await response.json();
    if (data.result) {
      // Convert from wei to gwei
      const gasPriceWei = BigInt(data.result);
      const gasPriceGwei = Number(gasPriceWei) / 1e9;
      return gasPriceGwei.toFixed(2);
    }
    return '25'; // Default gas price
  } catch (error) {
    console.error('Error fetching gas price:', error);
    return '25';
  }
}

// Estimate gas for a transfer
export async function estimateGas(
  from: string,
  to: string,
  value: string
): Promise<string> {
  try {
    // Convert AVAX to wei
    const valueWei = `0x${Math.floor(parseFloat(value) * 1e18).toString(16)}`;

    const response = await fetch(AVALANCHE_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_estimateGas',
        params: [
          {
            from,
            to,
            value: valueWei,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.result) {
      return BigInt(data.result).toString();
    }
    return '21000'; // Default gas limit for simple transfer
  } catch (error) {
    console.error('Error estimating gas:', error);
    return '21000';
  }
}

// Fetch wallet data (balance + price + transactions)
export async function fetchWalletData(address: string): Promise<{
  balance: string;
  balanceUSD: number;
  transactions: Transaction[];
}> {
  const [balance, price, transactions] = await Promise.all([
    getAVAXBalance(address),
    getAVAXPrice(),
    getTransactionHistory(address),
  ]);

  const balanceNum = parseFloat(balance);
  const balanceUSD = balanceNum * price;

  return {
    balance,
    balanceUSD,
    transactions,
  };
}

// Format timestamp to relative time
export function formatTransactionTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

// Format transaction value with + or -
export function formatTransactionValue(value: string, type: 'send' | 'receive'): string {
  const num = parseFloat(value);
  if (num === 0) return '0 AVAX';

  const formatted = num < 0.0001 ? '<0.0001' : num.toFixed(4);
  const prefix = type === 'receive' ? '+' : '-';

  return `${prefix}${formatted} AVAX`;
}
