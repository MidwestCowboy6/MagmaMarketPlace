import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  QrCode,
  Send,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Link2,
  Plus,
  Trash2,
  ChevronDown,
  Edit3,
} from 'lucide-react-native';
import {
  useWalletStore,
  formatAddress,
  formatAVAX,
  isValidAddress,
  type Transaction,
  type SavedWallet,
} from '@/lib/wallet-store';
import { QRCode as QRCodeComponent } from '@/components/QRCode';
import {
  fetchWalletData,
  formatTransactionTime,
  formatTransactionValue,
  getAVAXPrice,
} from '@/lib/avalanche-api';

// Connect Wallet Modal
function ConnectWalletModal({
  visible,
  onClose,
  onConnect,
}: {
  visible: boolean;
  onClose: () => void;
  onConnect: (address: string) => void;
}) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleConnect = () => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setError('Please enter a wallet address');
      return;
    }
    if (!isValidAddress(trimmedAddress)) {
      setError('Invalid Avalanche address. Must start with 0x');
      return;
    }
    setError('');
    onConnect(trimmedAddress);
    setAddress('');
    onClose();
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setAddress(text.trim());
      setError('');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-zinc-950">
        <LinearGradient
          colors={['#1a1a2e', '#0f0f23']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
          <Pressable onPress={onClose} className="p-2 -ml-2">
            <X size={24} color="#71717a" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Connect Wallet</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-5 pt-6">
          {/* Avalanche Logo */}
          <View className="items-center mb-6">
            <View className="bg-red-500/20 p-4 rounded-full mb-3">
              <Wallet size={40} color="#ef4444" />
            </View>
            <Text className="text-white font-bold text-xl">Avalanche Wallet</Text>
            <Text className="text-zinc-400 text-sm mt-1">Track your AVAX balance and transactions</Text>
          </View>

          {/* Address Input */}
          <Text className="text-white font-semibold mb-2">Wallet Address</Text>
          <View className="bg-zinc-900 rounded-xl p-4 mb-3">
            <TextInput
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                setError('');
              }}
              placeholder="0x..."
              placeholderTextColor="#71717a"
              className="text-white text-base"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error ? (
            <View className="flex-row items-center mb-3">
              <AlertCircle size={14} color="#ef4444" />
              <Text className="text-red-500 text-sm ml-1">{error}</Text>
            </View>
          ) : null}

          {/* Paste Button */}
          <Pressable
            onPress={handlePaste}
            className="flex-row items-center justify-center bg-zinc-800 rounded-xl py-3 mb-4"
          >
            <Copy size={18} color="#8b5cf6" />
            <Text className="text-violet-400 font-medium ml-2">Paste from Clipboard</Text>
          </Pressable>

          {/* Connect Button */}
          <Pressable
            onPress={handleConnect}
            className="bg-red-500 rounded-xl py-4 items-center active:bg-red-600"
          >
            <Text className="text-white font-bold text-base">Connect Wallet</Text>
          </Pressable>

          {/* Info */}
          <View className="mt-6 bg-zinc-900/50 rounded-xl p-4">
            <Text className="text-zinc-400 text-sm leading-5">
              This is a read-only wallet tracker. Enter your Avalanche C-Chain address to view your balance and transaction history. Your private keys are never stored or accessed.
            </Text>
          </View>

          {/* Supported Features */}
          <View className="mt-4">
            <Text className="text-zinc-500 text-xs mb-2">SUPPORTED FEATURES</Text>
            <View className="flex-row flex-wrap gap-2">
              {['AVAX Balance', 'Transaction History', 'USD Value', 'Real-time Updates'].map((feature) => (
                <View key={feature} className="bg-zinc-800/50 px-3 py-[6px] rounded-full">
                  <Text className="text-zinc-400 text-xs">{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Receive Modal (shows QR code and address)
function ReceiveModal({
  visible,
  onClose,
  address,
}: {
  visible: boolean;
  onClose: () => void;
  address: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(address);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-zinc-950">
        <LinearGradient
          colors={['#1a1a2e', '#0f0f23']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
          <Pressable onPress={onClose} className="p-2 -ml-2">
            <X size={24} color="#71717a" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Receive AVAX</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, alignItems: 'center' }}>
          {/* QR Code */}
          <View className="bg-white p-5 rounded-2xl mb-6">
            <QRCodeComponent value={address} size={200} />
          </View>

          <Text className="text-white font-semibold text-lg mb-2">Your Address</Text>
          <Text className="text-zinc-400 text-sm text-center mb-4 px-4">
            Share this address to receive AVAX on Avalanche C-Chain
          </Text>

          {/* Address */}
          <View className="bg-zinc-900 rounded-xl p-4 w-full mb-4">
            <Text className="text-white text-center font-mono text-sm" selectable>
              {address}
            </Text>
          </View>

          {/* Copy Button */}
          <Pressable
            onPress={handleCopy}
            className={`rounded-xl py-4 w-full items-center flex-row justify-center ${copied ? 'bg-emerald-600' : 'bg-emerald-500 active:bg-emerald-600'}`}
          >
            {copied ? (
              <>
                <CheckCircle size={20} color="#fff" />
                <Text className="text-white font-bold text-base ml-2">Copied!</Text>
              </>
            ) : (
              <>
                <Copy size={20} color="#fff" />
                <Text className="text-white font-bold text-base ml-2">Copy Address</Text>
              </>
            )}
          </Pressable>

          {/* Warning */}
          <View className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <View className="flex-row items-start">
              <AlertCircle size={18} color="#f59e0b" style={{ marginTop: 2 }} />
              <Text className="text-amber-500 text-sm ml-2 flex-1">
                Only send AVAX and Avalanche C-Chain tokens to this address. Sending other assets may result in permanent loss.
              </Text>
            </View>
          </View>

          <View className="h-8" />
        </ScrollView>
      </View>
    </Modal>
  );
}

// Transaction Item
function TransactionItem({ transaction }: { transaction: Transaction }) {
  const isSend = transaction.type === 'send';
  const statusColor = transaction.status === 'confirmed' ? '#10b981' : transaction.status === 'failed' ? '#ef4444' : '#f59e0b';

  const openExplorer = () => {
    Linking.openURL(`https://snowtrace.io/tx/${transaction.hash}`);
  };

  return (
    <Pressable
      onPress={openExplorer}
      className="bg-zinc-900 rounded-xl p-4 mb-3 active:bg-zinc-800"
    >
      <View className="flex-row items-center">
        {/* Icon */}
        <View className={`p-[10px] rounded-full ${isSend ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
          {isSend ? (
            <ArrowUpRight size={20} color="#ef4444" />
          ) : (
            <ArrowDownLeft size={20} color="#10b981" />
          )}
        </View>

        {/* Details */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="text-white font-semibold">
              {isSend ? 'Sent' : 'Received'}
            </Text>
            {transaction.status === 'pending' && (
              <View className="ml-2 bg-amber-500/20 px-2 py-[2px] rounded">
                <Text className="text-amber-500 text-xs">Pending</Text>
              </View>
            )}
          </View>
          <Text className="text-zinc-500 text-sm mt-[2px]">
            {isSend ? `To: ${formatAddress(transaction.to)}` : `From: ${formatAddress(transaction.from)}`}
          </Text>
        </View>

        {/* Amount */}
        <View className="items-end">
          <Text className={`font-semibold ${isSend ? 'text-red-400' : 'text-emerald-400'}`}>
            {formatTransactionValue(transaction.value, transaction.type)}
          </Text>
          <Text className="text-zinc-500 text-xs mt-[2px]">
            {formatTransactionTime(transaction.timestamp)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// Empty State
function EmptyState({ onConnect, savedWallets, onSelectWallet }: {
  onConnect: () => void;
  savedWallets: SavedWallet[];
  onSelectWallet: (address: string) => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="bg-red-500/20 p-5 rounded-full mb-4">
        <Wallet size={50} color="#ef4444" />
      </View>
      <Text className="text-white font-bold text-2xl text-center mb-2">
        Avalanche Wallet
      </Text>
      <Text className="text-zinc-400 text-center mb-6">
        Track your AVAX balance and transactions on the Avalanche network
      </Text>
      <Pressable
        onPress={onConnect}
        className="bg-red-500 px-8 py-4 rounded-xl flex-row items-center active:bg-red-600"
      >
        <Link2 size={20} color="#fff" />
        <Text className="text-white font-bold text-base ml-2">Connect Wallet</Text>
      </Pressable>

      {/* Saved Wallets */}
      {savedWallets.length > 0 && (
        <View className="mt-8 w-full">
          <Text className="text-zinc-500 text-xs mb-3 text-center">SAVED WALLETS</Text>
          {savedWallets.map((wallet) => (
            <Pressable
              key={wallet.address}
              onPress={() => onSelectWallet(wallet.address)}
              className="flex-row items-center bg-zinc-900/50 rounded-xl p-4 mb-2 active:bg-zinc-800"
            >
              <View className="bg-red-500/20 p-2 rounded-lg mr-3">
                <Wallet size={18} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-medium">{wallet.name}</Text>
                <Text className="text-zinc-500 text-xs">{formatAddress(wallet.address)}</Text>
              </View>
              <ChevronRight size={18} color="#71717a" />
            </Pressable>
          ))}
        </View>
      )}

      {/* Features */}
      <View className="mt-8 w-full">
        <Text className="text-zinc-500 text-xs mb-3 text-center">FEATURES</Text>
        <View className="space-y-3">
          {[
            { icon: TrendingUp, label: 'Real-time AVAX Balance', color: '#10b981' },
            { icon: Clock, label: 'Transaction History', color: '#3b82f6' },
            { icon: RefreshCw, label: 'Auto-refresh Updates', color: '#8b5cf6' },
          ].map((item, index) => (
            <View key={index} className="flex-row items-center bg-zinc-900/50 rounded-xl p-4 mt-3">
              <View className="p-2 rounded-lg" style={{ backgroundColor: `${item.color}20` }}>
                <item.icon size={18} color={item.color} />
              </View>
              <Text className="text-white font-medium ml-3">{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// Manage Wallets Modal
function ManageWalletsModal({
  visible,
  onClose,
  savedWallets,
  currentAddress,
  onSelectWallet,
  onAddWallet,
  onRemoveWallet,
  onRenameWallet,
}: {
  visible: boolean;
  onClose: () => void;
  savedWallets: SavedWallet[];
  currentAddress: string | null;
  onSelectWallet: (address: string) => void;
  onAddWallet: () => void;
  onRemoveWallet: (address: string) => void;
  onRenameWallet: (address: string, name: string) => void;
}) {
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (wallet: SavedWallet) => {
    setEditingAddress(wallet.address);
    setEditName(wallet.name);
  };

  const handleSaveEdit = () => {
    if (editingAddress && editName.trim()) {
      onRenameWallet(editingAddress, editName.trim());
    }
    setEditingAddress(null);
    setEditName('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-zinc-950">
        <LinearGradient
          colors={['#1a1a2e', '#0f0f23']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
          <Pressable onPress={onClose} className="p-2 -ml-2">
            <X size={24} color="#71717a" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Manage Wallets</Text>
          <Pressable onPress={onAddWallet} className="p-2 -mr-2">
            <Plus size={24} color="#ef4444" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-4">
          {savedWallets.length === 0 ? (
            <View className="items-center py-12">
              <Wallet size={48} color="#71717a" />
              <Text className="text-zinc-400 mt-4 text-center">
                No wallets saved yet
              </Text>
              <Pressable
                onPress={onAddWallet}
                className="mt-4 bg-red-500 px-6 py-3 rounded-xl flex-row items-center"
              >
                <Plus size={18} color="#fff" />
                <Text className="text-white font-semibold ml-2">Add Wallet</Text>
              </Pressable>
            </View>
          ) : (
            savedWallets.map((wallet) => (
              <View key={wallet.address} className="mb-3">
                {editingAddress === wallet.address ? (
                  <View className="bg-zinc-900 rounded-xl p-4">
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      placeholder="Wallet name"
                      placeholderTextColor="#71717a"
                      className="text-white text-base mb-3 bg-zinc-800 rounded-lg px-3 py-2"
                      autoFocus
                    />
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => setEditingAddress(null)}
                        className="flex-1 bg-zinc-800 py-2 rounded-lg items-center"
                      >
                        <Text className="text-zinc-400">Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSaveEdit}
                        className="flex-1 bg-red-500 py-2 rounded-lg items-center"
                      >
                        <Text className="text-white font-semibold">Save</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      onSelectWallet(wallet.address);
                      onClose();
                    }}
                    className={`rounded-xl p-4 active:bg-zinc-800 ${
                      wallet.address.toLowerCase() === currentAddress?.toLowerCase()
                        ? 'bg-red-500/10 border border-red-500/30'
                        : 'bg-zinc-900'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View className={`p-[10px] rounded-full ${
                        wallet.address.toLowerCase() === currentAddress?.toLowerCase()
                          ? 'bg-red-500/30'
                          : 'bg-zinc-800'
                      }`}>
                        <Wallet size={20} color={
                          wallet.address.toLowerCase() === currentAddress?.toLowerCase()
                            ? '#ef4444'
                            : '#a1a1aa'
                        } />
                      </View>
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className="text-white font-semibold">{wallet.name}</Text>
                          {wallet.address.toLowerCase() === currentAddress?.toLowerCase() && (
                            <View className="ml-2 bg-red-500/20 px-2 py-[2px] rounded">
                              <Text className="text-red-400 text-xs">Active</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-zinc-500 text-sm mt-[2px]">
                          {formatAddress(wallet.address)}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Pressable
                          onPress={() => handleStartEdit(wallet)}
                          className="p-2"
                        >
                          <Edit3 size={18} color="#71717a" />
                        </Pressable>
                        <Pressable
                          onPress={() => onRemoveWallet(wallet.address)}
                          className="p-2"
                        >
                          <Trash2 size={18} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                )}
              </View>
            ))
          )}

          <View className="h-8" />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function WalletScreen() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showManageWalletsModal, setShowManageWalletsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [avaxPrice, setAvaxPrice] = useState(0);

  const isConnected = useWalletStore((s) => s.isConnected);
  const address = useWalletStore((s) => s.address);
  const balance = useWalletStore((s) => s.balance);
  const balanceUSD = useWalletStore((s) => s.balanceUSD);
  const transactions = useWalletStore((s) => s.transactions);
  const isLoading = useWalletStore((s) => s.isLoading);
  const savedWallets = useWalletStore((s) => s.savedWallets);
  const connect = useWalletStore((s) => s.connect);
  const disconnect = useWalletStore((s) => s.disconnect);
  const switchWallet = useWalletStore((s) => s.switchWallet);
  const removeSavedWallet = useWalletStore((s) => s.removeSavedWallet);
  const renameSavedWallet = useWalletStore((s) => s.renameSavedWallet);
  const setBalance = useWalletStore((s) => s.setBalance);
  const setTransactions = useWalletStore((s) => s.setTransactions);
  const setLoading = useWalletStore((s) => s.setLoading);

  // Get current wallet name
  const currentWalletName = savedWallets.find(
    w => w.address.toLowerCase() === address?.toLowerCase()
  )?.name ?? 'Wallet';

  // Fetch wallet data
  const loadWalletData = useCallback(async () => {
    if (!address) return;

    try {
      const data = await fetchWalletData(address);
      setBalance(data.balance, data.balanceUSD);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  }, [address, setBalance, setTransactions]);

  // Initial load and price fetch
  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      loadWalletData().finally(() => setLoading(false));
    }

    // Fetch AVAX price
    getAVAXPrice().then(setAvaxPrice);
  }, [isConnected, address, loadWalletData, setLoading]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      loadWalletData();
      getAVAXPrice().then(setAvaxPrice);
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, address, loadWalletData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    await getAVAXPrice().then(setAvaxPrice);
    setRefreshing(false);
  };

  const handleConnect = (walletAddress: string) => {
    connect(walletAddress);
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => disconnect() },
      ]
    );
  };

  const handleCopyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const openExplorer = () => {
    if (address) {
      Linking.openURL(`https://snowtrace.io/address/${address}`);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0a0a', '#1a1a2e', '#0f0f23']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        {!isConnected ? (
          <EmptyState
            onConnect={() => setShowConnectModal(true)}
            savedWallets={savedWallets}
            onSelectWallet={switchWallet}
          />
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#ef4444"
              />
            }
          >
            {/* Header */}
            <View className="px-5 pt-2 pb-4">
              <View className="flex-row items-center justify-between">
                <Pressable
                  onPress={() => setShowManageWalletsModal(true)}
                  className="flex-row items-center active:opacity-70"
                >
                  <View className="bg-red-500/20 p-2 rounded-xl mr-3">
                    <Wallet size={24} color="#ef4444" />
                  </View>
                  <View>
                    <View className="flex-row items-center">
                      <Text className="text-white text-xl font-bold">{currentWalletName}</Text>
                      <ChevronDown size={18} color="#71717a" style={{ marginLeft: 4 }} />
                    </View>
                    <Text className="text-zinc-400 text-sm">Avalanche C-Chain</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={handleDisconnect}
                  className="bg-zinc-800 px-3 py-2 rounded-lg"
                >
                  <Text className="text-zinc-400 text-sm">Disconnect</Text>
                </Pressable>
              </View>
            </View>

            {/* Balance Card */}
            <View className="mx-5 mb-4">
              <LinearGradient
                colors={['#dc2626', '#991b1b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 20 }}
              >
                {/* Address */}
                <Pressable
                  onPress={handleCopyAddress}
                  className="flex-row items-center self-start bg-white/20 px-3 py-[6px] rounded-full mb-4"
                >
                  <Text className="text-white/90 text-sm font-medium">
                    {formatAddress(address || '')}
                  </Text>
                  <Copy size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 6 }} />
                </Pressable>

                {/* Balance */}
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="large" className="my-4" />
                ) : (
                  <>
                    <Text className="text-white/70 text-sm">Total Balance</Text>
                    <Text className="text-white text-4xl font-bold mt-1">
                      {formatAVAX(balance)} AVAX
                    </Text>
                    <Text className="text-white/70 text-lg mt-1">
                      ≈ ${balanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </Text>
                  </>
                )}

                {/* AVAX Price */}
                <View className="flex-row items-center mt-4 pt-4 border-t border-white/20">
                  <Text className="text-white/70 text-sm">AVAX Price:</Text>
                  <Text className="text-white font-semibold ml-2">
                    ${avaxPrice.toFixed(2)}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Action Buttons */}
            <View className="flex-row px-5 mb-6 gap-3">
              <Pressable
                onPress={() => setShowReceiveModal(true)}
                className="flex-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-4 items-center flex-row justify-center active:bg-emerald-500/20"
              >
                <ArrowDownLeft size={20} color="#10b981" />
                <Text className="text-emerald-400 font-semibold ml-2">Receive</Text>
              </Pressable>
              <Pressable
                onPress={openExplorer}
                className="flex-1 bg-zinc-800 rounded-xl py-4 items-center flex-row justify-center active:bg-zinc-700"
              >
                <ExternalLink size={20} color="#fff" />
                <Text className="text-white font-semibold ml-2">Explorer</Text>
              </Pressable>
            </View>

            {/* Transactions */}
            <View className="px-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white font-semibold text-lg">Transactions</Text>
                <Text className="text-zinc-500 text-sm">{`${transactions.length} total`}</Text>
              </View>

              {isLoading ? (
                <ActivityIndicator color="#ef4444" className="py-10" />
              ) : transactions.length === 0 ? (
                <View className="bg-zinc-900 rounded-xl p-8 items-center">
                  <Clock size={40} color="#71717a" />
                  <Text className="text-zinc-400 mt-3 text-center">
                    No transactions yet
                  </Text>
                </View>
              ) : (
                transactions.slice(0, 20).map((tx) => (
                  <TransactionItem key={tx.hash} transaction={tx} />
                ))
              )}
            </View>

            <View className="h-24" />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Modals */}
      <ConnectWalletModal
        visible={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnect}
      />

      {address && (
        <ReceiveModal
          visible={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          address={address}
        />
      )}

      <ManageWalletsModal
        visible={showManageWalletsModal}
        onClose={() => setShowManageWalletsModal(false)}
        savedWallets={savedWallets}
        currentAddress={address}
        onSelectWallet={(walletAddress) => {
          switchWallet(walletAddress);
          setShowManageWalletsModal(false);
        }}
        onAddWallet={() => {
          setShowManageWalletsModal(false);
          setShowConnectModal(true);
        }}
        onRemoveWallet={removeSavedWallet}
        onRenameWallet={renameSavedWallet}
      />
    </View>
  );
}
