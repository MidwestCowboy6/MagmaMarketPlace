import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import {
  User,
  Mail,
  Wallet,
  Link2,
  Unlink,
  Copy,
  Edit3,
  LogOut,
  Trash2,
  ChevronRight,
  ShoppingBag,
  TrendingUp,
  Star,
  Shield,
  X,
  Check,
  ExternalLink,
  Crown,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Ban,
  Search,
  Bot,
  Scan,
  AlertTriangle,
  Sparkles,
  Filter,
  Store,
  Plus,
  ArrowRight,
} from 'lucide-react-native';
import { useAuthStore, hasLinkedWallet, isMasterAccount } from '@/lib/auth-store';
import { useWalletStore, formatAddress, isValidAddress } from '@/lib/wallet-store';
import { useMarketplaceStore, MAX_FEE_PERCENT, MIN_FEE_PERCENT, type Listing } from '@/lib/marketplace-store';
import { useRatingStore, CROWN_NAMES, TIER_REQUIREMENTS } from '@/lib/rating-store';
import { useShopStore } from '@/lib/shop-store';
import { CrownIcon, StarRating } from '@/components/CrownIcon';
import { useSession, useInvalidateSession } from '@/lib/auth/use-session';
import { authClient } from '@/lib/auth/auth-client';
import { api } from '@/lib/api/api';

// Edit Profile Modal
function EditProfileModal({
  visible,
  onClose,
  currentName,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(currentName);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-zinc-950">
        <LinearGradient
          colors={['#1a1a2e', '#0f0f23']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
          <Pressable onPress={onClose} className="p-2 -ml-2">
            <X size={24} color="#71717a" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Edit Profile</Text>
          <Pressable
            onPress={() => {
              onSave(name);
              onClose();
            }}
            className="p-2 -mr-2"
          >
            <Check size={24} color="#8b5cf6" />
          </Pressable>
        </View>

        <View className="px-5 pt-6">
          <Text className="text-zinc-400 text-sm mb-2">Display Name</Text>
          <View className="bg-zinc-900 rounded-xl px-4 py-3">
            <TextInput
              value={name}
              onChangeText={setName}
              className="text-white text-base"
              placeholder="Enter display name"
              placeholderTextColor="#71717a"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Link Wallet Modal
function LinkWalletModal({
  visible,
  onClose,
  onLink,
}: {
  visible: boolean;
  onClose: () => void;
  onLink: (address: string) => void;
}) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleLink = () => {
    if (!address.trim()) {
      setError('Please enter a wallet address');
      return;
    }
    if (!isValidAddress(address.trim())) {
      setError('Invalid address format');
      return;
    }
    onLink(address.trim());
    setAddress('');
    setError('');
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-zinc-950">
        <LinearGradient
          colors={['#1a1a2e', '#0f0f23']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
          <Pressable onPress={onClose} className="p-2 -ml-2">
            <X size={24} color="#71717a" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Link Wallet</Text>
          <View className="w-10" />
        </View>

        <View className="px-5 pt-6">
          <View className="items-center mb-6">
            <View className="bg-red-500/20 p-4 rounded-full mb-3">
              <Wallet size={32} color="#ef4444" />
            </View>
            <Text className="text-white font-semibold text-lg">Avalanche Wallet</Text>
            <Text className="text-zinc-400 text-sm mt-1 text-center">
              Link your AVAX wallet to buy, sell, and trade on the marketplace
            </Text>
          </View>

          <Text className="text-zinc-400 text-sm mb-2">Wallet Address</Text>
          <View className="bg-zinc-900 rounded-xl px-4 py-3 mb-3">
            <TextInput
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                setError('');
              }}
              className="text-white text-base"
              placeholder="0x..."
              placeholderTextColor="#71717a"
              autoCapitalize="none"
            />
          </View>

          {error ? (
            <Text className="text-red-400 text-sm mb-3">{error}</Text>
          ) : null}

          <Pressable
            onPress={handlePaste}
            className="flex-row items-center justify-center bg-zinc-800 rounded-xl py-3 mb-4"
          >
            <Copy size={18} color="#8b5cf6" />
            <Text className="text-violet-400 font-medium ml-2">Paste from Clipboard</Text>
          </Pressable>

          <Pressable
            onPress={handleLink}
            className="bg-red-500 rounded-xl py-4 items-center active:bg-red-600"
          >
            <Text className="text-white font-bold">Link Wallet</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Suspicious keywords that might indicate illegal items
const SUSPICIOUS_KEYWORDS = [
  // Drugs
  'weed', 'marijuana', 'cannabis', 'cocaine', 'heroin', 'meth', 'mdma', 'ecstasy', 'lsd', 'shrooms', 'mushrooms', 'pills', 'xanax', 'oxy', 'fentanyl', 'drugs', 'narcotics',
  // Weapons
  'gun', 'firearm', 'pistol', 'rifle', 'ammunition', 'ammo', 'weapon', 'knife', 'blade', 'switchblade', 'explosive', 'bomb',
  // Counterfeit
  'counterfeit', 'fake id', 'fake money', 'replica', 'knockoff', 'bootleg',
  // Stolen
  'stolen', 'hot', 'no questions asked',
  // Adult/Explicit
  'xxx', 'porn', 'nude', 'nsfw', 'adult only', 'explicit',
  // Scams
  'get rich quick', 'money hack', 'free money', 'guaranteed profit',
  // Other illegal
  'illegal', 'black market', 'underground', 'untraceable',
];

// AI Scanner result interface
interface AIScanResult {
  listingId: string;
  title: string;
  imageUrl: string;
  sellerUsername: string;
  price: number;
  flagged: boolean;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

// Delist Tool Modal (Master Only) - Enhanced with keyword search and AI scanning
function DelistToolModal({
  visible,
  onClose,
  listings,
  onDelist,
}: {
  visible: boolean;
  onClose: () => void;
  listings: Listing[];
  onDelist: (listingId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [showKeywordSearch, setShowKeywordSearch] = useState(false);
  const [showAIScanner, setShowAIScanner] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<AIScanResult[]>([]);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });

  // Filter listings by search query
  const searchFilteredListings = listings.filter(
    (listing) =>
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.sellerUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter listings by suspicious keywords
  const keywordFilteredListings = keywordFilter
    ? listings.filter((listing) => {
        const searchText = `${listing.title} ${listing.description}`.toLowerCase();
        const keywords = keywordFilter.toLowerCase().split(',').map(k => k.trim());
        return keywords.some(keyword => searchText.includes(keyword));
      })
    : [];

  // Check listing for suspicious keywords
  const checkSuspiciousKeywords = (listing: Listing): string[] => {
    const searchText = `${listing.title} ${listing.description}`.toLowerCase();
    return SUSPICIOUS_KEYWORDS.filter(keyword => searchText.includes(keyword));
  };

  // Scan all listings with AI
  const runAIScan = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert('Error', 'Please enter what you want the AI to look for');
      return;
    }

    setIsScanning(true);
    setScanResults([]);
    setScanProgress({ current: 0, total: listings.length });

    const results: AIScanResult[] = [];

    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      setScanProgress({ current: i + 1, total: listings.length });

      try {
        // Analyze text content
        const textPrompt = `You are a marketplace safety AI. Analyze this listing for the following concern: "${aiPrompt}"

Listing Title: ${listing.title}
Description: ${listing.description}
Category: ${listing.category}
Price: ${listing.price} AVAX

Respond with ONLY a JSON object in this exact format (no other text):
{"flagged": true/false, "reason": "brief explanation", "confidence": "high/medium/low"}`;

        const textResponse = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-5.2',
            input: textPrompt,
          }),
        });

        const textData = await textResponse.json();
        let textResult: { flagged: boolean; reason: string; confidence: 'high' | 'medium' | 'low' } = { flagged: false, reason: '', confidence: 'low' };

        try {
          const outputText = textData.output?.[0]?.content?.[0]?.text || textData.output || '';
          const jsonMatch = outputText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            textResult = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.log('Failed to parse text analysis:', e);
        }

        // Analyze image if URL exists
        let imageResult: { flagged: boolean; reason: string; confidence: 'high' | 'medium' | 'low' } = { flagged: false, reason: '', confidence: 'low' };

        if (listing.imageUrl && listing.imageUrl.startsWith('http')) {
          try {
            const imagePrompt = `You are a marketplace safety AI. Analyze this image for the following concern: "${aiPrompt}"

Look for any visual indicators of illegal items, inappropriate content, or anything that matches the concern.

Respond with ONLY a JSON object in this exact format (no other text):
{"flagged": true/false, "reason": "brief explanation of what you see", "confidence": "high/medium/low"}`;

            const imageResponse = await fetch('https://api.openai.com/v1/responses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'gpt-5.2',
                input: [{
                  role: 'user',
                  content: [
                    { type: 'input_text', text: imagePrompt },
                    { type: 'input_image', image_url: listing.imageUrl },
                  ],
                }],
              }),
            });

            const imageData = await imageResponse.json();
            const imageOutputText = imageData.output?.[0]?.content?.[0]?.text || imageData.output || '';
            const imageJsonMatch = imageOutputText.match(/\{[\s\S]*\}/);
            if (imageJsonMatch) {
              imageResult = JSON.parse(imageJsonMatch[0]);
            }
          } catch (e) {
            console.log('Failed to analyze image:', e);
          }
        }

        // Combine results - flag if either text or image is flagged
        const isFlagged = textResult.flagged || imageResult.flagged;
        const combinedReason = [
          textResult.flagged ? `Text: ${textResult.reason}` : '',
          imageResult.flagged ? `Image: ${imageResult.reason}` : '',
        ].filter(Boolean).join(' | ') || 'No issues found';

        const textConf = textResult.confidence;
        const imgConf = imageResult.confidence;
        const highestConfidence: 'high' | 'medium' | 'low' =
          textConf === 'high' || imgConf === 'high'
            ? 'high'
            : textConf === 'medium' || imgConf === 'medium'
              ? 'medium'
              : 'low';

        if (isFlagged) {
          results.push({
            listingId: listing.id,
            title: listing.title,
            imageUrl: listing.imageUrl,
            sellerUsername: listing.sellerUsername,
            price: listing.price,
            flagged: true,
            reason: combinedReason,
            confidence: highestConfidence,
          });
        }
      } catch (error) {
        console.log('Error scanning listing:', error);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setScanResults(results);
    setIsScanning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelist = (listing: Listing | AIScanResult) => {
    const title = listing.title;
    const id = 'id' in listing ? listing.id : listing.listingId;

    Alert.alert(
      'Delist Item',
      `Are you sure you want to remove "${title}" from the marketplace? This item will no longer be visible to buyers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delist',
          style: 'destructive',
          onPress: () => {
            onDelist(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Remove from scan results if present
            setScanResults(prev => prev.filter(r => r.listingId !== id));
          },
        },
      ]
    );
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#71717a';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-zinc-950">
        <LinearGradient
          colors={['#1a1a2e', '#0f0f23']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
          <Pressable onPress={onClose} className="p-2 -ml-2">
            <X size={24} color="#71717a" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Safety & Moderation</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Manual Search */}
          <View className="px-5 pt-4">
            <View className="bg-zinc-900 rounded-xl px-4 py-3 flex-row items-center">
              <Search size={18} color="#71717a" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-white text-base ml-3"
                placeholder="Search by title, seller, or description..."
                placeholderTextColor="#71717a"
              />
            </View>
          </View>

          {/* Tool Selection Buttons */}
          <View className="px-5 pt-4 flex-row gap-3">
            <Pressable
              onPress={() => {
                setShowKeywordSearch(!showKeywordSearch);
                setShowAIScanner(false);
              }}
              className={`flex-1 p-3 rounded-xl flex-row items-center justify-center ${
                showKeywordSearch ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-zinc-900'
              }`}
            >
              <Filter size={18} color={showKeywordSearch ? '#f59e0b' : '#71717a'} />
              <Text className={`ml-2 font-medium ${showKeywordSearch ? 'text-amber-400' : 'text-zinc-400'}`}>
                Keyword Filter
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowAIScanner(!showAIScanner);
                setShowKeywordSearch(false);
              }}
              className={`flex-1 p-3 rounded-xl flex-row items-center justify-center ${
                showAIScanner ? 'bg-violet-500/20 border border-violet-500/50' : 'bg-zinc-900'
              }`}
            >
              <Bot size={18} color={showAIScanner ? '#8b5cf6' : '#71717a'} />
              <Text className={`ml-2 font-medium ${showAIScanner ? 'text-violet-400' : 'text-zinc-400'}`}>
                AI Scanner
              </Text>
            </Pressable>
          </View>

          {/* Keyword Search Section */}
          {showKeywordSearch && (
            <View className="px-5 pt-4">
              <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                <View className="flex-row items-start mb-3">
                  <AlertTriangle size={20} color="#f59e0b" style={{ marginTop: 2 }} />
                  <View className="flex-1 ml-3">
                    <Text className="text-amber-400 font-semibold mb-1">Keyword Filter</Text>
                    <Text className="text-amber-300/80 text-sm">
                      Search for specific words sellers might use. Separate multiple keywords with commas.
                    </Text>
                  </View>
                </View>

                <TextInput
                  value={keywordFilter}
                  onChangeText={setKeywordFilter}
                  className="bg-zinc-900 rounded-xl px-4 py-3 text-white mb-3"
                  placeholder="e.g., drugs, weapon, fake..."
                  placeholderTextColor="#71717a"
                />

                {/* Pre-defined suspicious keywords quick filters */}
                <Text className="text-amber-300/60 text-xs mb-2">Quick filters:</Text>
                <View className="flex-row flex-wrap gap-2">
                  {['drugs', 'weapons', 'counterfeit', 'stolen', 'explicit'].map((keyword) => (
                    <Pressable
                      key={keyword}
                      onPress={() => setKeywordFilter(prev => prev ? `${prev}, ${keyword}` : keyword)}
                      className="bg-zinc-800 px-3 py-[6px] rounded-lg"
                    >
                      <Text className="text-amber-400 text-sm">{keyword}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Keyword Filter Results */}
              {keywordFilter && (
                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2">
                    {`Found ${keywordFilteredListings.length} listings matching keywords`}
                  </Text>
                  {keywordFilteredListings.map((listing) => {
                    const foundKeywords = checkSuspiciousKeywords(listing);
                    return (
                      <View key={listing.id} className="bg-zinc-900 rounded-xl mb-3 overflow-hidden border border-red-500/30">
                        <View className="flex-row p-3">
                          <Image
                            source={{ uri: listing.imageUrl }}
                            style={{ width: 60, height: 60, borderRadius: 8 }}
                          />
                          <View className="flex-1 ml-3 justify-center">
                            <Text className="text-white font-medium" numberOfLines={1}>
                              {listing.title}
                            </Text>
                            <Text className="text-zinc-400 text-sm">
                              {`@${listing.sellerUsername}`}
                            </Text>
                            {foundKeywords.length > 0 && (
                              <View className="flex-row flex-wrap gap-1 mt-1">
                                {foundKeywords.slice(0, 3).map((kw) => (
                                  <View key={kw} className="bg-red-500/20 px-2 py-[2px] rounded">
                                    <Text className="text-red-400 text-xs">{kw}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                          <Pressable
                            onPress={() => handleDelist(listing)}
                            className="bg-red-500/20 px-4 py-2 rounded-lg self-center active:bg-red-500/30"
                          >
                            <View className="flex-row items-center">
                              <Ban size={16} color="#ef4444" />
                              <Text className="text-red-400 font-medium ml-[6px]">Delist</Text>
                            </View>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* AI Scanner Section */}
          {showAIScanner && (
            <View className="px-5 pt-4">
              <View className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 mb-4">
                <View className="flex-row items-start mb-3">
                  <Sparkles size={20} color="#8b5cf6" style={{ marginTop: 2 }} />
                  <View className="flex-1 ml-3">
                    <Text className="text-violet-400 font-semibold mb-1">AI Safety Scanner</Text>
                    <Text className="text-violet-300/80 text-sm">
                      Tell the AI what to look for. It will analyze all listing text AND images to find potential violations.
                    </Text>
                  </View>
                </View>

                <TextInput
                  value={aiPrompt}
                  onChangeText={setAIPrompt}
                  className="bg-zinc-900 rounded-xl px-4 py-3 text-white mb-3"
                  placeholder="e.g., illegal drugs, weapons, explicit content..."
                  placeholderTextColor="#71717a"
                  multiline
                  numberOfLines={2}
                />

                {/* Quick prompts */}
                <Text className="text-violet-300/60 text-xs mb-2">Quick scans:</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                  {[
                    'illegal drugs or substances',
                    'weapons or ammunition',
                    'counterfeit items',
                    'explicit or adult content',
                  ].map((prompt) => (
                    <Pressable
                      key={prompt}
                      onPress={() => setAIPrompt(prompt)}
                      className="bg-zinc-800 px-3 py-[6px] rounded-lg"
                    >
                      <Text className="text-violet-400 text-sm">{prompt}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={runAIScan}
                  disabled={isScanning || !aiPrompt.trim()}
                  className={`py-3 rounded-xl flex-row items-center justify-center ${
                    isScanning || !aiPrompt.trim() ? 'bg-violet-500/30' : 'bg-violet-500'
                  }`}
                >
                  {isScanning ? (
                    <>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text className="text-white font-bold ml-2">
                        {`Scanning ${scanProgress.current}/${scanProgress.total}...`}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Scan size={20} color="#fff" />
                      <Text className="text-white font-bold ml-2">Scan All Listings</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* AI Scan Results */}
              {scanResults.length > 0 && (
                <View className="mb-4">
                  <View className="flex-row items-center mb-3">
                    <AlertTriangle size={18} color="#ef4444" />
                    <Text className="text-red-400 font-semibold ml-2">
                      {`${scanResults.length} Flagged Listings`}
                    </Text>
                  </View>

                  {scanResults.map((result) => (
                    <View
                      key={result.listingId}
                      className="bg-zinc-900 rounded-xl mb-3 overflow-hidden border border-red-500/30"
                    >
                      <View className="flex-row p-3">
                        <Image
                          source={{ uri: result.imageUrl }}
                          style={{ width: 60, height: 60, borderRadius: 8 }}
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-white font-medium" numberOfLines={1}>
                            {result.title}
                          </Text>
                          <Text className="text-zinc-400 text-sm">
                            {`@${result.sellerUsername}`}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <View
                              className="px-2 py-[2px] rounded"
                              style={{ backgroundColor: `${getConfidenceColor(result.confidence)}20` }}
                            >
                              <Text style={{ color: getConfidenceColor(result.confidence) }} className="text-xs font-medium">
                                {result.confidence.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => handleDelist(result)}
                          className="bg-red-500/20 px-4 py-2 rounded-lg self-center active:bg-red-500/30"
                        >
                          <View className="flex-row items-center">
                            <Ban size={16} color="#ef4444" />
                            <Text className="text-red-400 font-medium ml-[6px]">Delist</Text>
                          </View>
                        </Pressable>
                      </View>
                      {/* Reason */}
                      <View className="px-3 pb-3">
                        <Text className="text-zinc-400 text-xs">{result.reason}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {scanResults.length === 0 && !isScanning && aiPrompt && (
                <View className="items-center py-6">
                  <Check size={32} color="#10b981" />
                  <Text className="text-emerald-400 font-medium mt-2">All listings look clean!</Text>
                  <Text className="text-zinc-500 text-sm mt-1">No violations found for your search.</Text>
                </View>
              )}
            </View>
          )}

          {/* Warning Banner */}
          {!showKeywordSearch && !showAIScanner && (
            <View className="mx-5 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <View className="flex-row items-start">
                <Shield size={20} color="#f59e0b" style={{ marginTop: 2 }} />
                <View className="flex-1 ml-3">
                  <Text className="text-amber-400 font-semibold mb-1">Safety Tool</Text>
                  <Text className="text-amber-300/80 text-sm">
                    Use this tool to remove inappropriate or illegal items from the marketplace. Use Keyword Filter for quick searches or AI Scanner for intelligent detection.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Regular Listings (when not using special filters) */}
          {!showKeywordSearch && !showAIScanner && (
            <View className="px-5 pt-4">
              {searchFilteredListings.length === 0 ? (
                <View className="items-center py-12">
                  <Text className="text-zinc-500 text-base">No active listings found</Text>
                </View>
              ) : (
                searchFilteredListings.map((listing) => {
                  const suspiciousKeywords = checkSuspiciousKeywords(listing);
                  const hasSuspicious = suspiciousKeywords.length > 0;

                  return (
                    <View
                      key={listing.id}
                      className={`bg-zinc-900 rounded-xl mb-3 overflow-hidden ${hasSuspicious ? 'border border-amber-500/30' : ''}`}
                    >
                      <View className="flex-row p-3">
                        <Image
                          source={{ uri: listing.imageUrl }}
                          style={{ width: 60, height: 60, borderRadius: 8 }}
                        />
                        <View className="flex-1 ml-3 justify-center">
                          <Text className="text-white font-medium" numberOfLines={1}>
                            {listing.title}
                          </Text>
                          <Text className="text-zinc-400 text-sm">
                            {`@${listing.sellerUsername}`}
                          </Text>
                          <Text className="text-emerald-400 text-sm font-medium">
                            {`${listing.price} AVAX`}
                          </Text>
                          {hasSuspicious && (
                            <View className="flex-row items-center mt-1">
                              <AlertTriangle size={12} color="#f59e0b" />
                              <Text className="text-amber-400 text-xs ml-1">Suspicious keywords</Text>
                            </View>
                          )}
                        </View>
                        <Pressable
                          onPress={() => handleDelist(listing)}
                          className="bg-red-500/20 px-4 py-2 rounded-lg self-center active:bg-red-500/30"
                        >
                          <View className="flex-row items-center">
                            <Ban size={16} color="#ef4444" />
                            <Text className="text-red-400 font-medium ml-[6px]">Delist</Text>
                          </View>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          <View className="h-8" />
        </ScrollView>
      </View>
    </Modal>
  );
}

// Auth View shown when not signed in — redirects to the OTP sign-in screen
function ProfileAuthView() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-zinc-950 items-center justify-center px-8">
      <LinearGradient
        colors={['#0f172a', '#09090b']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{ backgroundColor: 'rgba(249,115,22,0.15)', borderRadius: 999, padding: 20, marginBottom: 20 }}>
        <User size={40} color="#f97316" />
      </View>
      <Text className="text-white text-2xl font-bold text-center mb-2">Sign in to view your profile</Text>
      <Text className="text-zinc-500 text-base text-center mb-8">
        {'Track your listings, ratings, and wallet all in one place.'}
      </Text>
      <Pressable
        onPress={() => router.push('/sign-in')}
        style={{ backgroundColor: '#f97316', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', flexDirection: 'row', gap: 8 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{'Sign In / Sign Up'}</Text>
        <ArrowRight size={18} color="#fff" />
      </Pressable>
    </View>
  );
}

// Stat Card
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View className="flex-1 bg-zinc-900 rounded-xl p-4">
      <View className="flex-row items-center mb-2">
        <Icon size={16} color={color} />
        <Text className="text-zinc-400 text-xs ml-[6px]">{label}</Text>
      </View>
      <Text className="text-white font-bold text-xl">{value}</Text>
    </View>
  );
}

// Menu Item
function MenuItem({
  icon: Icon,
  label,
  value,
  color = '#71717a',
  onPress,
  danger = false,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  color?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center py-4 border-b border-zinc-800 active:opacity-70 ${
        !onPress ? 'opacity-100' : ''
      }`}
      disabled={!onPress}
    >
      <View className={`p-2 rounded-lg ${danger ? 'bg-red-500/20' : 'bg-zinc-800'}`}>
        <Icon size={18} color={danger ? '#ef4444' : color} />
      </View>
      <Text className={`flex-1 ml-3 ${danger ? 'text-red-400' : 'text-white'}`}>{label}</Text>
      {value && <Text className="text-zinc-400 text-sm mr-2">{value}</Text>}
      {onPress && <ChevronRight size={18} color="#71717a" />}
    </Pressable>
  );
}

// My Shop Section Component
function MyShopSection() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const getShopByOwnerId = useShopStore((s) => s.getShopByOwnerId);

  const userShop = user ? getShopByOwnerId(user.id) : undefined;

  return (
    <View className="px-5 mb-6">
      <Text className="text-zinc-500 text-xs mb-3">MY SHOP</Text>
      <View className="bg-zinc-900 rounded-xl overflow-hidden">
        {userShop ? (
          <Pressable
            onPress={() => router.push(`/shop/${userShop.id}`)}
            className="p-4 flex-row items-center active:bg-zinc-800"
          >
            <View className="bg-violet-500/20 p-2 rounded-lg">
              <Store size={18} color="#8b5cf6" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-white font-medium">{userShop.name}</Text>
              <Text className="text-zinc-400 text-sm">
                {`${userShop.followerCount} followers • ${userShop.totalSales} sales`}
              </Text>
            </View>
            <ChevronRight size={18} color="#71717a" />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/shop/create')}
            className="p-4 flex-row items-center active:bg-zinc-800"
          >
            <View className="bg-emerald-500/20 p-2 rounded-lg">
              <Plus size={18} color="#10b981" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-white font-medium">Create Your Shop</Text>
              <Text className="text-zinc-400 text-sm">Start selling on the marketplace</Text>
            </View>
            <ChevronRight size={18} color="#71717a" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinkWalletModal, setShowLinkWalletModal] = useState(false);
  const [showDelistModal, setShowDelistModal] = useState(false);

  const { data: session } = useSession();
  const invalidateSession = useInvalidateSession();
  const sessionUser = session?.user;

  // Local profile data (walletAddress, stats) still from local store until fully migrated
  const localUser = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const linkWallet = useAuthStore((s) => s.linkWallet);
  const unlinkWallet = useAuthStore((s) => s.unlinkWallet);

  // Compose a merged user object: real auth fields from session, extras from local store
  const user = sessionUser
    ? {
        id: sessionUser.id,
        email: sessionUser.email,
        username: (sessionUser as unknown as { username?: string }).username ?? sessionUser.name ?? sessionUser.email.split('@')[0],
        displayName: sessionUser.name ?? sessionUser.email.split('@')[0],
        avatarUrl: sessionUser.image ?? localUser?.avatarUrl ?? null,
        walletAddress: localUser?.walletAddress ?? null,
        totalSales: localUser?.totalSales ?? 0,
        totalPurchases: localUser?.totalPurchases ?? 0,
        totalTrades: localUser?.totalTrades ?? 0,
        reputation: localUser?.reputation ?? 100,
      }
    : null;

  const walletConnect = useWalletStore((s) => s.connect);
  const walletDisconnect = useWalletStore((s) => s.disconnect);

  const totalFees = useMarketplaceStore((s) => s.totalFees);
  const totalVolume = useMarketplaceStore((s) => s.totalVolume);
  const currentFeePercent = useMarketplaceStore((s) => s.currentFeePercent);
  const setFeePercent = useMarketplaceStore((s) => s.setFeePercent);

  const sliderWidthRef = useRef(0);
  const sliderPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, x / (sliderWidthRef.current || 1)));
        const raw = MIN_FEE_PERCENT + ratio * (MAX_FEE_PERCENT - MIN_FEE_PERCENT);
        const stepped = Math.round(raw * 10) / 10;
        setFeePercent(stepped);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, x / (sliderWidthRef.current || 1)));
        const raw = MIN_FEE_PERCENT + ratio * (MAX_FEE_PERCENT - MIN_FEE_PERCENT);
        const stepped = Math.round(raw * 10) / 10;
        setFeePercent(stepped);
      },
    })
  ).current;
  const getActiveListings = useMarketplaceStore((s) => s.getActiveListings);
  const delistListing = useMarketplaceStore((s) => s.delistListing);

  const userSummaries = useRatingStore((s) => s.userSummaries);
  const userId = user?.id;
  const userSummary = React.useMemo(() => {
    if (!userId) return null;
    const isPlatformOwner = userId === 'N263Jm6mbFiYbvQ3KIRgXq66xXYRiLTx';
    const stored = userSummaries[userId];
    if (stored) return { ...stored, isPlatformOwner };
    return {
      userId,
      totalRatings: 0,
      averageRating: 0,
      crownTier: isPlatformOwner ? 'sapphire' as const : 'coal' as const,
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
  }, [userId, userSummaries]);

  const isMaster = user?.id === 'N263Jm6mbFiYbvQ3KIRgXq66xXYRiLTx';

  if (!user) {
    return <ProfileAuthView />;
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          await authClient.signOut();
          await invalidateSession();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await authClient.signOut();
            await invalidateSession();
          },
        },
      ]
    );
  };

  const handleLinkWallet = (address: string) => {
    linkWallet(address);
    walletConnect(address);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleUnlinkWallet = () => {
    Alert.alert('Unlink Wallet', 'Are you sure you want to unlink your wallet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlink',
        style: 'destructive',
        onPress: () => {
          unlinkWallet();
          walletDisconnect();
        },
      },
    ]);
  };

  const handleCopyAddress = async () => {
    if (user.walletAddress) {
      await Clipboard.setStringAsync(user.walletAddress);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const hasWallet = !!user.walletAddress;

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f23']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-5 pt-2 pb-6">
            <Text className="text-white text-2xl font-bold">Profile</Text>
          </View>

          {/* Profile Card */}
          <View className="mx-5 mb-6">
            <LinearGradient
              colors={isMaster ? ['#1e40af', '#3b82f6'] : ['#4c1d95', '#6d28d9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 20 }}
            >
              {/* Crown Badge at top */}
              {userSummary && (
                <View className="items-center mb-4">
                  <CrownIcon tier={userSummary.crownTier} size="xl" showGlow animate />
                  <Text className="text-white/90 text-sm mt-2 font-medium">
                    {CROWN_NAMES[userSummary.crownTier]}
                  </Text>
                  <Text className="text-white/60 text-xs">
                    {TIER_REQUIREMENTS[userSummary.crownTier].description}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center">
                <Image
                  source={{ uri: user.avatarUrl || 'https://via.placeholder.com/100' }}
                  style={{ width: 70, height: 70, borderRadius: 35 }}
                />
                <View className="flex-1 ml-4">
                  <Text className="text-white text-xl font-bold">{user.displayName}</Text>
                  <Text className="text-white/70">{`@${user.username}`}</Text>
                  {/* Star rating */}
                  {userSummary && userSummary.totalRatings > 0 && (
                    <View className="mt-1">
                      <StarRating
                        rating={userSummary.averageRating}
                        size="sm"
                        showNumber
                        showCount
                        count={userSummary.totalRatings}
                      />
                    </View>
                  )}
                </View>
                <Pressable
                  onPress={() => setShowEditModal(true)}
                  className="bg-white/20 p-2 rounded-full"
                >
                  <Edit3 size={18} color="#fff" />
                </Pressable>
              </View>

              {/* Rating sentiment breakdown */}
              {userSummary && userSummary.totalRatings > 0 && (
                <View className="flex-row mt-4 pt-4 border-t border-white/20">
                  <View className="flex-1 items-center">
                    <View className="flex-row items-center">
                      <ThumbsUp size={14} color="#10b981" />
                      <Text className="text-emerald-400 font-bold ml-1">
                        {userSummary.positiveCount}
                      </Text>
                    </View>
                    <Text className="text-white/60 text-xs">Positive</Text>
                  </View>
                  <View className="flex-1 items-center border-x border-white/20">
                    <View className="flex-row items-center">
                      <Minus size={14} color="#f59e0b" />
                      <Text className="text-amber-400 font-bold ml-1">
                        {userSummary.neutralCount}
                      </Text>
                    </View>
                    <Text className="text-white/60 text-xs">Neutral</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <View className="flex-row items-center">
                      <ThumbsDown size={14} color="#ef4444" />
                      <Text className="text-red-400 font-bold ml-1">
                        {userSummary.negativeCount}
                      </Text>
                    </View>
                    <Text className="text-white/60 text-xs">Negative</Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Master Account - Fees Collected */}
          {isMaster && (
            <View className="mx-5 mb-6">
              <LinearGradient
                colors={['#065f46', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 20 }}
              >
                <View className="flex-row items-center mb-3">
                  <DollarSign size={20} color="#34d399" />
                  <Text className="text-emerald-300 font-bold text-lg ml-2">Platform Revenue</Text>
                </View>
                <View className="bg-black/20 rounded-xl p-4">
                  <Text className="text-emerald-200 text-sm">{`Total Fees Collected (${currentFeePercent}%)`}</Text>
                  <Text className="text-white text-3xl font-bold mt-1">
                    {`${totalFees.toFixed(4)} AVAX`}
                  </Text>
                  <View className="flex-row items-center mt-3 pt-3 border-t border-white/10">
                    <Text className="text-emerald-200/70 text-sm">Total Volume: </Text>
                    <Text className="text-white font-semibold">{`${totalVolume.toFixed(2)} AVAX`}</Text>
                  </View>
                </View>

                {/* Fee Adjustment Slider */}
                <View className="mt-4 bg-black/20 rounded-xl p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-emerald-200 text-sm font-medium">Platform Fee</Text>
                    <Text className="text-white font-bold text-lg">{`${currentFeePercent.toFixed(1)}%`}</Text>
                  </View>
                  <View
                    style={{ width: '100%', height: 40, justifyContent: 'center' }}
                    onLayout={(e: LayoutChangeEvent) => {
                      sliderWidthRef.current = e.nativeEvent.layout.width;
                    }}
                    {...sliderPanResponder.panHandlers}
                  >
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: '#064e3b', width: '100%' }}>
                      <View style={{ height: 4, borderRadius: 2, backgroundColor: '#34d399', width: `${((currentFeePercent - MIN_FEE_PERCENT) / (MAX_FEE_PERCENT - MIN_FEE_PERCENT)) * 100}%` }} />
                    </View>
                    <View style={{
                      position: 'absolute',
                      left: `${((currentFeePercent - MIN_FEE_PERCENT) / (MAX_FEE_PERCENT - MIN_FEE_PERCENT)) * 100}%`,
                      marginLeft: -12,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#10b981',
                    }} />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-emerald-200/50 text-xs">{`${MIN_FEE_PERCENT}%`}</Text>
                    <Text className="text-emerald-200/50 text-xs">{`${MAX_FEE_PERCENT}%`}</Text>
                  </View>
                </View>

                {/* Delist Tool Button */}
                <Pressable
                  onPress={() => setShowDelistModal(true)}
                  className="mt-4 bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex-row items-center active:bg-red-500/30"
                >
                  <View className="bg-red-500/30 p-2 rounded-lg">
                    <Ban size={20} color="#ef4444" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-red-400 font-semibold">Delist Tool</Text>
                    <Text className="text-red-300/70 text-sm">Remove illegal or inappropriate items</Text>
                  </View>
                  <ChevronRight size={20} color="#ef4444" />
                </Pressable>
              </LinearGradient>
            </View>
          )}

          {/* Stats */}
          <View className="flex-row px-5 gap-3 mb-6">
            <StatCard
              icon={ShoppingBag}
              label="Sales"
              value={user.totalSales}
              color="#10b981"
            />
            <StatCard
              icon={TrendingUp}
              label="Purchases"
              value={user.totalPurchases}
              color="#3b82f6"
            />
            <StatCard
              icon={Star}
              label="Trades"
              value={user.totalTrades}
              color="#f59e0b"
            />
          </View>

          {/* My Shop Section */}
          <MyShopSection />

          {/* Wallet Section */}
          <View className="px-5 mb-6">
            <Text className="text-zinc-500 text-xs mb-3">WALLET</Text>
            <View className="bg-zinc-900 rounded-xl overflow-hidden">
              {hasWallet ? (
                <>
                  <View className="p-4 border-b border-zinc-800">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="bg-red-500/20 p-2 rounded-lg">
                          <Wallet size={18} color="#ef4444" />
                        </View>
                        <View className="ml-3">
                          <Text className="text-white font-medium">Avalanche</Text>
                          <Text className="text-zinc-400 text-sm">
                            {formatAddress(user.walletAddress || '')}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row">
                        <Pressable
                          onPress={handleCopyAddress}
                          className="bg-zinc-800 p-2 rounded-lg mr-2"
                        >
                          <Copy size={16} color="#71717a" />
                        </Pressable>
                        <Pressable
                          onPress={handleUnlinkWallet}
                          className="bg-red-500/20 p-2 rounded-lg"
                        >
                          <Unlink size={16} color="#ef4444" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </>
              ) : (
                <Pressable
                  onPress={() => setShowLinkWalletModal(true)}
                  className="p-4 flex-row items-center active:bg-zinc-800"
                >
                  <View className="bg-zinc-800 p-2 rounded-lg">
                    <Link2 size={18} color="#8b5cf6" />
                  </View>
                  <Text className="text-white flex-1 ml-3">Link Wallet</Text>
                  <Text className="text-violet-400 text-sm">Required for trading</Text>
                  <ChevronRight size={18} color="#71717a" style={{ marginLeft: 8 }} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Account Section */}
          <View className="px-5 mb-6">
            <Text className="text-zinc-500 text-xs mb-3">ACCOUNT</Text>
            <View className="bg-zinc-900 rounded-xl px-4">
              <MenuItem
                icon={Mail}
                label="Email"
                value={user.email}
                color="#3b82f6"
              />
              <MenuItem
                icon={User}
                label="Username"
                value={`@${user.username}`}
                color="#8b5cf6"
              />
              <MenuItem
                icon={LogOut}
                label="Sign Out"
                onPress={handleSignOut}
              />
              <MenuItem
                icon={Trash2}
                label="Delete Account"
                onPress={handleDeleteAccount}
                danger
              />
            </View>
          </View>

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentName={user.displayName}
        onSave={(name) => updateProfile({ displayName: name })}
      />

      <LinkWalletModal
        visible={showLinkWalletModal}
        onClose={() => setShowLinkWalletModal(false)}
        onLink={handleLinkWallet}
      />

      {/* Master-only Delist Tool Modal */}
      {isMaster && (
        <DelistToolModal
          visible={showDelistModal}
          onClose={() => setShowDelistModal(false)}
          listings={getActiveListings()}
          onDelist={(listingId) => {
            const result = delistListing(listingId);
            if (!result.success) {
              Alert.alert('Error', result.error || 'Failed to delist item');
            }
          }}
        />
      )}
    </View>
  );
}
