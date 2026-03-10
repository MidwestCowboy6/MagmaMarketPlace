import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {
  Store,
  Search,
  Plus,
  Filter,
  Gavel,
  Tag,
  ArrowLeftRight,
  Clock,
  X,
  ChevronRight,
  Flame,
  Image as ImageIcon,
  DollarSign,
  Info,
  CheckCircle,
  AlertCircle,
  Package,
  Smartphone,
  Hexagon,
  Truck,
  MapPin,
  Shield,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Star,
  BadgeCheck,
  MessageSquare,
  Zap,
  TrendingUp,
  Camera,
  Upload,
} from 'lucide-react-native';
import { useAuthStore, hasLinkedWallet } from '@/lib/auth-store';
import {
  useMarketplaceStore,
  type Listing,
  type ItemCategory,
  type ItemType,
  type ListingType,
  type ShippingAddress,
  type SellerStats,
  MASTER_WALLET_ADDRESS,
  calculateFees,
  getMaskedAddress,
  getLocationOnly,
} from '@/lib/marketplace-store';
import { useRatingStore } from '@/lib/rating-store';
import { CrownIcon, SellerBadge } from '@/components/CrownIcon';
import { RatingModal } from '@/components/RatingModal';

// Category config
const CATEGORIES: { value: ItemCategory; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'cards', label: 'Cards', icon: Gavel, color: '#f59e0b' },
  { value: 'collectibles', label: 'Collectibles', icon: Store, color: '#8b5cf6' },
  { value: 'art', label: 'Art', icon: ImageIcon, color: '#ec4899' },
  { value: 'other', label: 'Other', icon: Tag, color: '#06b6d4' },
];

// Listing type config
const LISTING_TYPES: { value: ListingType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'fixed', label: 'Fixed Price', icon: Tag, color: '#10b981' },
  { value: 'auction', label: 'Auction', icon: Gavel, color: '#f59e0b' },
  { value: 'trade', label: 'Trade', icon: ArrowLeftRight, color: '#3b82f6' },
];

// Item type config
const ITEM_TYPES: { value: ItemType; label: string; description: string; color: string; icon: React.ElementType }[] = [
  { value: 'physical', label: 'Physical', description: 'Ships to buyer', color: '#f59e0b', icon: Package },
  { value: 'digital', label: 'Digital', description: 'Instant delivery', color: '#8b5cf6', icon: Smartphone },
  { value: 'nft', label: 'NFT', description: 'On-chain asset', color: '#06b6d4', icon: Hexagon },
];

// Shipping Address Form Modal
function ShippingAddressModal({
  visible,
  onClose,
  onSubmit,
  listing,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (address: ShippingAddress) => void;
  listing: Listing | null;
}) {
  const [fullName, setFullName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!addressLine1.trim()) {
      setError('Address is required');
      return;
    }
    if (!city.trim()) {
      setError('City is required');
      return;
    }
    if (!state.trim()) {
      setError('State is required');
      return;
    }
    if (!postalCode.trim()) {
      setError('Postal code is required');
      return;
    }
    if (!country.trim()) {
      setError('Country is required');
      return;
    }

    const address: ShippingAddress = {
      fullName: fullName.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      phone: phone.trim() || undefined,
    };

    onSubmit(address);

    // Reset form
    setFullName('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('United States');
    setPhone('');
    setError('');
  };

  if (!listing) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-zinc-950"
      >
        <LinearGradient
          colors={['#1a1a2e', '#0f0f23']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
          <Pressable onPress={onClose} className="p-2 -ml-2">
            <X size={24} color="#71717a" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Shipping Address</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {/* Privacy Notice */}
          <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4">
            <View className="flex-row items-start">
              <Shield size={20} color="#10b981" style={{ marginTop: 2 }} />
              <View className="flex-1 ml-3">
                <Text className="text-emerald-400 font-semibold mb-1">Your Address is Protected</Text>
                <Text className="text-emerald-300/80 text-sm">
                  The seller will only see your city and state. Your full address is kept private and used only for shipping label generation.
                </Text>
              </View>
            </View>
          </View>

          {/* Item Being Purchased */}
          <View className="bg-zinc-900 rounded-xl p-3 mb-4 flex-row items-center">
            {listing.imageUrl ? (
              <Image
                source={{ uri: listing.imageUrl }}
                style={{ width: 50, height: 50, borderRadius: 8 }}
              />
            ) : (
              <View className="w-12 h-12 bg-zinc-800 rounded-lg items-center justify-center">
                <Package size={24} color="#71717a" />
              </View>
            )}
            <View className="flex-1 ml-3">
              <Text className="text-white font-medium" numberOfLines={1}>{listing.title}</Text>
              <Text className="text-zinc-400 text-sm">{`${listing.price.toFixed(2)} AVAX`}</Text>
            </View>
          </View>

          {/* Form Fields */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Full Name *</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Smith"
              placeholderTextColor="#71717a"
              className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
            />
          </View>

          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Address Line 1 *</Text>
            <TextInput
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholder="123 Main Street"
              placeholderTextColor="#71717a"
              className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
            />
          </View>

          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Address Line 2 (Optional)</Text>
            <TextInput
              value={addressLine2}
              onChangeText={setAddressLine2}
              placeholder="Apt 4B"
              placeholderTextColor="#71717a"
              className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
            />
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-zinc-400 text-sm mb-2">City *</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Chicago"
                placeholderTextColor="#71717a"
                className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
              />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-400 text-sm mb-2">State *</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="IL"
                placeholderTextColor="#71717a"
                className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
              />
            </View>
          </View>

          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-zinc-400 text-sm mb-2">Postal Code *</Text>
              <TextInput
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="60601"
                placeholderTextColor="#71717a"
                className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
                keyboardType="number-pad"
              />
            </View>
            <View className="flex-1">
              <Text className="text-zinc-400 text-sm mb-2">Country *</Text>
              <TextInput
                value={country}
                onChangeText={setCountry}
                placeholder="United States"
                placeholderTextColor="#71717a"
                className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Phone (Optional)</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor="#71717a"
              className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
              keyboardType="phone-pad"
            />
          </View>

          {/* What seller sees */}
          <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <EyeOff size={16} color="#f59e0b" />
              <Text className="text-amber-400 font-medium ml-2">What the seller will see:</Text>
            </View>
            <Text className="text-amber-300/80 text-sm">
              {fullName && city && state
                ? getMaskedAddress({ fullName, addressLine1, city, state, postalCode, country })
                : 'J. S., City ST'}
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <Text className="text-red-400 text-center">{error}</Text>
            </View>
          )}

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            className="bg-emerald-500 rounded-xl py-4 items-center active:bg-emerald-600 mb-6"
          >
            <Text className="text-white font-bold text-lg">Continue to Purchase</Text>
          </Pressable>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Listing Card
function ListingCard({ listing, onPress, userId, onSellerPress }: { listing: Listing; onPress: () => void; userId?: string; onSellerPress?: (sellerId: string) => void }) {
  const typeConfig = LISTING_TYPES.find((t) => t.value === listing.listingType);
  const itemTypeConfig = ITEM_TYPES.find((t) => t.value === listing.itemType);
  const TypeIcon = typeConfig?.icon || Tag;
  const ItemTypeIcon = itemTypeConfig?.icon || Package;

  const watchlistsMap = useMarketplaceStore((s) => s.watchlists);
  const isInWatchlist = userId ? (watchlistsMap[userId]?.includes(listing.id) ?? false) : false;
  const addToWatchlist = useMarketplaceStore((s) => s.addToWatchlist);
  const removeFromWatchlist = useMarketplaceStore((s) => s.removeFromWatchlist);
  const sellerStatsMap = useMarketplaceStore((s) => s.sellerStats);
  const sellerStats = sellerStatsMap[listing.sellerId];

  // Get seller rating - use stable selector
  const userSummaries = useRatingStore((s) => s.userSummaries);
  const sellerSummary = React.useMemo(() => {
    const sellerId = listing.sellerId;
    const isPlatformOwner = sellerId === 'N263Jm6mbFiYbvQ3KIRgXq66xXYRiLTx';
    const stored = userSummaries[sellerId];
    if (stored) {
      return { ...stored, isPlatformOwner };
    }
    return {
      userId: sellerId,
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
  }, [listing.sellerId, userSummaries]);

  const handleWatchlist = (e: any) => {
    e.stopPropagation();
    if (!userId) return;
    if (isInWatchlist) {
      removeFromWatchlist(userId, listing.id);
    } else {
      addToWatchlist(userId, listing.id);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSellerPress = (e: any) => {
    e.stopPropagation();
    if (onSellerPress) {
      onSellerPress(listing.sellerId);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-zinc-900 rounded-xl overflow-hidden mb-3 active:opacity-80"
      style={{ width: '48%' }}
    >
      {/* Image */}
      <View style={{ height: 140, backgroundColor: '#27272a' }}>
        {listing.imageUrl ? (
          <Image
            source={{ uri: listing.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ImageIcon size={40} color="#52525b" />
          </View>
        )}
        {/* Featured Badge */}
        {listing.isFeatured && (
          <View className="absolute top-2 left-2 bg-amber-500 px-2 py-1 rounded-lg flex-row items-center">
            <Zap size={10} color="#fff" />
            <Text className="text-white text-xs font-bold ml-1">Featured</Text>
          </View>
        )}
        {/* Type Badge */}
        {!listing.isFeatured && (
          <View
            className="absolute top-2 left-2 px-2 py-1 rounded-lg flex-row items-center"
            style={{ backgroundColor: `${typeConfig?.color}30` }}
          >
            <TypeIcon size={12} color={typeConfig?.color} />
            <Text style={{ color: typeConfig?.color }} className="text-xs font-medium ml-1">
              {typeConfig?.label}
            </Text>
          </View>
        )}
        {/* Watchlist Button */}
        {userId && (
          <Pressable
            onPress={handleWatchlist}
            className="absolute top-2 right-2 bg-black/50 p-[6px] rounded-full"
          >
            <Heart
              size={16}
              color={isInWatchlist ? '#ef4444' : '#fff'}
              fill={isInWatchlist ? '#ef4444' : 'transparent'}
            />
          </Pressable>
        )}
        {/* Buy Now Badge for Auctions */}
        {listing.listingType === 'auction' && listing.buyNowPrice && (
          <View className="absolute bottom-2 left-2 bg-emerald-500 px-2 py-1 rounded-lg">
            <Text className="text-white text-xs font-bold">Buy Now Available</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View className="p-3">
        <Text className="text-white font-semibold" numberOfLines={1}>
          {listing.title}
        </Text>
        <Pressable onPress={handleSellerPress} className="flex-row items-center mt-1">
          <CrownIcon tier={sellerSummary.crownTier} size="sm" showGlow={false} animate={false} />
          <Text className="text-zinc-400 text-xs ml-1">{`@${listing.sellerUsername}`}</Text>
          {sellerStats?.isVerified && (
            <BadgeCheck size={12} color="#3b82f6" style={{ marginLeft: 4 }} />
          )}
        </Pressable>

        {/* Price */}
        <View className="flex-row items-center justify-between mt-2">
          {listing.listingType === 'auction' ? (
            <View>
              <Text className="text-zinc-500 text-xs">
                {listing.highestBid ? 'Current Bid' : 'Starting'}
              </Text>
              <Text className="text-amber-400 font-bold">
                {`${(listing.highestBid?.amount || listing.price).toFixed(2)} AVAX`}
              </Text>
            </View>
          ) : listing.listingType === 'trade' ? (
            <View>
              <Text className="text-zinc-500 text-xs">Looking for</Text>
              <Text className="text-blue-400 font-medium text-sm" numberOfLines={1}>
                {listing.lookingFor || 'Offers'}
              </Text>
            </View>
          ) : (
            <View>
              <Text className="text-zinc-500 text-xs">Price</Text>
              <Text className="text-emerald-400 font-bold">
                {`${listing.price.toFixed(2)} AVAX`}
              </Text>
            </View>
          )}

          {listing.listingType === 'auction' && listing.bids.length > 0 && (
            <View className="bg-amber-500/20 px-2 py-1 rounded">
              <Text className="text-amber-400 text-xs">{`${listing.bids.length} bids`}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// Create Listing Modal
function CreateListingModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (listing: {
    title: string;
    description: string;
    category: ItemCategory;
    itemType: ItemType;
    imageUrl: string;
    listingType: ListingType;
    price: number;
    lookingFor?: string;
    shippingCost?: number;
    estimatedDelivery?: string;
    shipsFrom?: string;
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ItemCategory>('cards');
  const [itemType, setItemType] = useState<ItemType>('physical');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [listingType, setListingType] = useState<ListingType>('fixed');
  const [price, setPrice] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [shipsFrom, setShipsFrom] = useState('');
  const [error, setError] = useState('');

  // Pick image from library
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageUrl(''); // Clear URL if user picks an image
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.log('Error picking image:', e);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageUrl(''); // Clear URL if user takes a photo
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      console.log('Error taking photo:', e);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Convert local image to data URL for storage
  const getImageDataUrl = async (uri: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    } catch (e) {
      console.log('Error converting image:', e);
      return '';
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (listingType !== 'trade' && (!price || parseFloat(price) <= 0)) {
      setError('Valid price is required');
      return;
    }
    if (itemType === 'physical' && !shipsFrom.trim()) {
      setError('Please specify where you ship from');
      return;
    }

    setIsUploadingImage(true);

    // Get final image URL
    let finalImageUrl = imageUrl.trim();
    if (imageUri) {
      // Convert local image to data URL
      finalImageUrl = await getImageDataUrl(imageUri);
    }
    if (!finalImageUrl) {
      finalImageUrl = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400';
    }

    setIsUploadingImage(false);

    onCreate({
      title: title.trim(),
      description: description.trim(),
      category,
      itemType,
      imageUrl: finalImageUrl,
      listingType,
      price: parseFloat(price) || 0,
      lookingFor: lookingFor.trim(),
      shippingCost: itemType === 'physical' ? parseFloat(shippingCost) || 0 : undefined,
      estimatedDelivery: itemType === 'physical' ? estimatedDelivery.trim() : undefined,
      shipsFrom: itemType === 'physical' ? shipsFrom.trim() : undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('cards');
    setItemType('physical');
    setImageUrl('');
    setImageUri(null);
    setListingType('fixed');
    setPrice('');
    setLookingFor('');
    setShippingCost('');
    setEstimatedDelivery('');
    setShipsFrom('');
    setError('');
    onClose();
  };

  const currentFeePercent = useMarketplaceStore((s) => s.currentFeePercent);
  const { platformFee, sellerReceives } = calculateFees(parseFloat(price) || 0, currentFeePercent);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
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
          <Text className="text-white font-bold text-lg">Create Listing</Text>
          <Pressable onPress={handleCreate} disabled={isUploadingImage} className="p-2 -mr-2">
            {isUploadingImage ? (
              <ActivityIndicator color="#10b981" size="small" />
            ) : (
              <CheckCircle size={24} color="#10b981" />
            )}
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What are you selling?"
              placeholderTextColor="#71717a"
              className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
            />
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your item..."
              placeholderTextColor="#71717a"
              className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          {/* Image URL */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Item Image</Text>

            {/* Image Preview */}
            {(imageUri || imageUrl) && (
              <View className="mb-3 items-center">
                <Image
                  source={{ uri: imageUri || imageUrl }}
                  style={{ width: 150, height: 150, borderRadius: 12 }}
                />
                <Pressable
                  onPress={() => {
                    setImageUri(null);
                    setImageUrl('');
                  }}
                  className="mt-2 px-3 py-[6px] bg-red-500/20 rounded-lg"
                >
                  <Text className="text-red-400 text-sm">Remove Image</Text>
                </Pressable>
              </View>
            )}

            {/* Image Picker Buttons */}
            <View className="flex-row gap-3 mb-3">
              <Pressable
                onPress={pickImage}
                className="flex-1 bg-zinc-900 rounded-xl py-4 flex-row items-center justify-center active:bg-zinc-800"
              >
                <Upload size={20} color="#8b5cf6" />
                <Text className="text-violet-400 font-medium ml-2">Upload Photo</Text>
              </Pressable>

              <Pressable
                onPress={takePhoto}
                className="flex-1 bg-zinc-900 rounded-xl py-4 flex-row items-center justify-center active:bg-zinc-800"
              >
                <Camera size={20} color="#3b82f6" />
                <Text className="text-blue-400 font-medium ml-2">Take Photo</Text>
              </Pressable>
            </View>

            {/* Or enter URL */}
            <View className="flex-row items-center mb-2">
              <View className="flex-1 h-px bg-zinc-800" />
              <Text className="text-zinc-500 text-xs mx-3">or enter URL</Text>
              <View className="flex-1 h-px bg-zinc-800" />
            </View>

            <TextInput
              value={imageUrl}
              onChangeText={(text) => {
                setImageUrl(text);
                if (text) setImageUri(null); // Clear local image if URL is entered
              }}
              placeholder="https://..."
              placeholderTextColor="#71717a"
              className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
              autoCapitalize="none"
            />
          </View>

          {/* Category */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-xl flex-row items-center ${
                    category === cat.value ? 'border-2' : 'bg-zinc-900'
                  }`}
                  style={
                    category === cat.value
                      ? { backgroundColor: `${cat.color}20`, borderColor: cat.color }
                      : {}
                  }
                >
                  <cat.icon size={16} color={category === cat.value ? cat.color : '#71717a'} />
                  <Text
                    className={`ml-2 ${category === cat.value ? 'font-medium' : 'text-zinc-400'}`}
                    style={category === cat.value ? { color: cat.color } : {}}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Item Type */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Item Type</Text>
            <View className="flex-row gap-2">
              {ITEM_TYPES.map((type) => (
                <Pressable
                  key={type.value}
                  onPress={() => setItemType(type.value)}
                  className={`flex-1 py-3 px-2 rounded-xl items-center ${
                    itemType === type.value ? 'border-2' : 'bg-zinc-900'
                  }`}
                  style={
                    itemType === type.value
                      ? { backgroundColor: `${type.color}20`, borderColor: type.color }
                      : {}
                  }
                >
                  <Text
                    className={`text-sm font-medium ${itemType === type.value ? '' : 'text-zinc-400'}`}
                    style={itemType === type.value ? { color: type.color } : {}}
                  >
                    {type.label}
                  </Text>
                  <Text
                    className="text-xs mt-[2px]"
                    style={{ color: itemType === type.value ? type.color : '#71717a' }}
                  >
                    {type.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Listing Type */}
          <View className="mb-4">
            <Text className="text-zinc-400 text-sm mb-2">Listing Type</Text>
            <View className="flex-row gap-2">
              {LISTING_TYPES.map((type) => (
                <Pressable
                  key={type.value}
                  onPress={() => setListingType(type.value)}
                  className={`flex-1 py-3 rounded-xl items-center ${
                    listingType === type.value ? 'border-2' : 'bg-zinc-900'
                  }`}
                  style={
                    listingType === type.value
                      ? { backgroundColor: `${type.color}20`, borderColor: type.color }
                      : {}
                  }
                >
                  <type.icon size={20} color={listingType === type.value ? type.color : '#71717a'} />
                  <Text
                    className={`mt-1 text-sm ${listingType === type.value ? 'font-medium' : 'text-zinc-400'}`}
                    style={listingType === type.value ? { color: type.color } : {}}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Price (for fixed/auction) */}
          {listingType !== 'trade' && (
            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">
                {listingType === 'auction' ? 'Starting Price (AVAX)' : 'Price (AVAX)'}
              </Text>
              <View className="flex-row items-center bg-zinc-900 rounded-xl px-4">
                <DollarSign size={18} color="#71717a" />
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="#71717a"
                  className="flex-1 py-3 ml-2 text-white text-lg"
                  keyboardType="decimal-pad"
                />
                <Text className="text-zinc-400">AVAX</Text>
              </View>

              {/* Fee breakdown */}
              {parseFloat(price) > 0 && (
                <View className="mt-3 bg-zinc-900/50 rounded-xl p-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-zinc-500 text-sm">{`Platform Fee (${currentFeePercent}%)`}</Text>
                    <Text className="text-zinc-400 text-sm">{`${platformFee.toFixed(4)} AVAX`}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-zinc-400 text-sm font-medium">You'll Receive</Text>
                    <Text className="text-emerald-400 text-sm font-bold">{`${sellerReceives.toFixed(4)} AVAX`}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Looking For (for trades) */}
          {listingType === 'trade' && (
            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">What are you looking for?</Text>
              <TextInput
                value={lookingFor}
                onChangeText={setLookingFor}
                placeholder="e.g., Rare anime cards, Collectibles..."
                placeholderTextColor="#71717a"
                className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
              />
            </View>
          )}

          {/* Shipping Info (for physical items) */}
          {itemType === 'physical' && (
            <View className="mb-4">
              <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-3">
                <Text className="text-amber-400 text-sm">
                  Physical items require shipping. Buyer will provide their shipping address at checkout.
                </Text>
              </View>

              <Text className="text-zinc-400 text-sm mb-2">Ships From *</Text>
              <TextInput
                value={shipsFrom}
                onChangeText={setShipsFrom}
                placeholder="e.g., United States, Japan..."
                placeholderTextColor="#71717a"
                className="bg-zinc-900 rounded-xl px-4 py-3 text-white mb-3"
              />

              <Text className="text-zinc-400 text-sm mb-2">Shipping Cost (AVAX)</Text>
              <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 mb-3">
                <TextInput
                  value={shippingCost}
                  onChangeText={setShippingCost}
                  placeholder="0.00"
                  placeholderTextColor="#71717a"
                  className="flex-1 py-3 text-white"
                  keyboardType="decimal-pad"
                />
                <Text className="text-zinc-400">AVAX</Text>
              </View>

              <Text className="text-zinc-400 text-sm mb-2">Estimated Delivery</Text>
              <TextInput
                value={estimatedDelivery}
                onChangeText={setEstimatedDelivery}
                placeholder="e.g., 3-5 business days"
                placeholderTextColor="#71717a"
                className="bg-zinc-900 rounded-xl px-4 py-3 text-white"
              />
            </View>
          )}

          {/* Digital Item Info */}
          {itemType === 'digital' && (
            <View className="mb-4">
              <View className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-3">
                <Text className="text-violet-400 text-sm">
                  Digital items are delivered instantly. You'll be able to add download links or access codes after the sale is complete.
                </Text>
              </View>
            </View>
          )}

          {/* NFT Info */}
          {itemType === 'nft' && (
            <View className="mb-4">
              <View className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
                <Text className="text-cyan-400 text-sm">
                  NFT transactions are handled on the Avalanche blockchain. Ensure you have the NFT in your connected wallet before listing.
                </Text>
              </View>
            </View>
          )}

          {/* Error */}
          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <Text className="text-red-400 text-center">{error}</Text>
            </View>
          )}

          {/* Fee Info */}
          <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Info size={18} color="#f59e0b" style={{ marginTop: 2 }} />
              <Text className="text-amber-400 text-sm ml-2 flex-1">
                {`A ${currentFeePercent}% platform fee is applied to all sales. Fees are sent to the platform wallet for service maintenance.`}
              </Text>
            </View>
          </View>

          <View className="h-20" />
        </ScrollView>
      </View>
    </Modal>
  );
}

// Listing Detail Modal
function ListingDetailModal({
  visible,
  listing,
  onClose,
  onPurchase,
  onBid,
  onBuyNow,
  onMakeOffer,
  onReleaseEscrow,
  onSubmitReview,
  currentUserId,
  currentUsername,
  onRequestLabel,
  onUpdateShippingStatus,
  onSellerPress,
  onOpenRatingModal,
}: {
  visible: boolean;
  listing: Listing | null;
  onClose: () => void;
  onPurchase: () => void;
  onBid: (amount: number) => void;
  onBuyNow?: () => void;
  onMakeOffer?: (amount: number, message?: string) => void;
  onReleaseEscrow?: () => void;
  onSubmitReview?: (rating: number, comment: string) => void;
  currentUserId: string | null;
  currentUsername?: string;
  onRequestLabel?: (listingId: string) => void;
  onUpdateShippingStatus?: (listingId: string, status: 'shipped' | 'delivered') => void;
  onSellerPress?: (sellerId: string) => void;
  onOpenRatingModal?: () => void;
}) {
  const [bidAmount, setBidAmount] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const currentFeePercent = useMarketplaceStore((s) => s.currentFeePercent);
  const sellerStatsMap = useMarketplaceStore((s) => s.sellerStats);
  const reviewsMap = useMarketplaceStore((s) => s.reviews);
  const listingsMap = useMarketplaceStore((s) => s.listings);

  // Compute derived values with useMemo
  const sellerStats = listing ? sellerStatsMap[listing.sellerId] : undefined;
  const sellerReviews = React.useMemo(() => {
    if (!listing) return [];
    return Object.values(reviewsMap).filter(r => r.sellerId === listing.sellerId);
  }, [listing?.sellerId, reviewsMap]);
  const similarListings = React.useMemo(() => {
    if (!listing) return [];
    return Object.values(listingsMap)
      .filter(l => l.id !== listing.id && l.status === 'active' && (l.category === listing.category || l.itemType === listing.itemType))
      .slice(0, 4);
  }, [listing?.id, listing?.category, listing?.itemType, listingsMap]);

  // Get seller rating summary - use stable selector
  const userSummaries = useRatingStore((s) => s.userSummaries);
  const ratings = useRatingStore((s) => s.ratings);

  const sellerSummary = React.useMemo(() => {
    if (!listing) return null;
    const sellerId = listing.sellerId;
    const isPlatformOwner = sellerId === 'N263Jm6mbFiYbvQ3KIRgXq66xXYRiLTx';
    const stored = userSummaries[sellerId];
    if (stored) {
      return { ...stored, isPlatformOwner };
    }
    return {
      userId: sellerId,
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
  }, [listing?.sellerId, userSummaries]);

  // Check if user has rated this transaction - use stable selector
  const hasRated = React.useMemo(() => {
    if (!listing || !currentUserId) return false;
    return Object.values(ratings).some(
      r => r.transactionId === listing.id &&
           r.raterId === currentUserId &&
           r.ratingType === 'buyer_to_seller'
    );
  }, [listing?.id, currentUserId, ratings]);

  if (!listing) return null;

  const typeConfig = LISTING_TYPES.find((t) => t.value === listing.listingType);
  const itemTypeConfig = ITEM_TYPES.find((t) => t.value === listing.itemType);
  const isOwner = currentUserId === listing.sellerId;
  const isBuyer = currentUserId === listing.buyerId;
  const isSold = listing.status === 'sold' || listing.status === 'shipped' || listing.status === 'delivered' || listing.status === 'in_escrow';
  const canReview = isBuyer && (listing.status === 'delivered' || listing.status === 'sold') && !hasRated;
  const canReleaseEscrow = isBuyer && listing.status === 'in_escrow' && listing.escrow?.status === 'funded';
  const { platformFee, sellerReceives } = calculateFees(listing.price, currentFeePercent);

  // Shipping status label
  const getShippingStatusLabel = (status?: string) => {
    switch (status) {
      case 'awaiting_address': return 'Awaiting Address';
      case 'address_provided': return 'Address Received';
      case 'label_requested': return 'Label Requested';
      case 'label_created': return 'Label Ready';
      case 'shipped': return 'Shipped';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      default: return 'Pending';
    }
  };

  const getShippingStatusColor = (status?: string) => {
    switch (status) {
      case 'awaiting_address': return '#f59e0b';
      case 'address_provided': return '#3b82f6';
      case 'label_requested': return '#8b5cf6';
      case 'label_created': return '#10b981';
      case 'shipped': return '#06b6d4';
      case 'in_transit': return '#06b6d4';
      case 'delivered': return '#22c55e';
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

        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-zinc-800">
          <Pressable onPress={onClose} className="p-2 -ml-2">
            <X size={24} color="#71717a" />
          </Pressable>
          <Text className="text-white font-bold text-lg">Listing Details</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Image */}
          <View style={{ height: 250, backgroundColor: '#27272a' }}>
            {listing.imageUrl ? (
              <Image
                source={{ uri: listing.imageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <ImageIcon size={60} color="#52525b" />
              </View>
            )}
          </View>

          <View className="px-5 pt-4 pb-8">
            {/* Type Badges */}
            <View className="flex-row gap-2 mb-3">
              <View
                className="px-3 py-[6px] rounded-lg flex-row items-center"
                style={{ backgroundColor: `${typeConfig?.color}20` }}
              >
                {typeConfig && <typeConfig.icon size={14} color={typeConfig.color} />}
                <Text style={{ color: typeConfig?.color }} className="text-sm font-medium ml-[6px]">
                  {typeConfig?.label}
                </Text>
              </View>
              <View
                className="px-3 py-[6px] rounded-lg flex-row items-center"
                style={{ backgroundColor: `${itemTypeConfig?.color}20` }}
              >
                {itemTypeConfig && <itemTypeConfig.icon size={14} color={itemTypeConfig.color} />}
                <Text style={{ color: itemTypeConfig?.color }} className="text-sm font-medium ml-[6px]">
                  {itemTypeConfig?.label}
                </Text>
              </View>
            </View>

            {/* Title & Seller */}
            <Text className="text-white text-2xl font-bold">{listing.title}</Text>
            <Pressable
              onPress={() => onSellerPress?.(listing.sellerId)}
              className="flex-row items-center mt-2 bg-zinc-900 rounded-xl p-3"
            >
              {sellerSummary && (
                <CrownIcon tier={sellerSummary.crownTier} size="md" showGlow={false} animate={false} />
              )}
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-white font-medium">{`@${listing.sellerUsername}`}</Text>
                  {sellerStats?.isVerified && (
                    <BadgeCheck size={14} color="#3b82f6" style={{ marginLeft: 4 }} />
                  )}
                </View>
                {sellerSummary && sellerSummary.totalRatings > 0 && (
                  <View className="flex-row items-center mt-[2px]">
                    <Star size={12} color="#f59e0b" fill="#f59e0b" />
                    <Text className="text-amber-400 text-sm ml-1">
                      {sellerSummary.averageRating.toFixed(1)}
                    </Text>
                    <Text className="text-zinc-500 text-sm ml-1">
                      {`(${sellerSummary.totalRatings} reviews)`}
                    </Text>
                  </View>
                )}
              </View>
              <ChevronRight size={18} color="#71717a" />
            </Pressable>

            {/* Description */}
            {listing.description && (
              <Text className="text-zinc-300 mt-4">{listing.description}</Text>
            )}

            {/* Price Card */}
            <View className="bg-zinc-900 rounded-xl p-4 mt-4">
              {listing.listingType === 'auction' ? (
                <>
                  <Text className="text-zinc-400 text-sm">
                    {listing.highestBid ? 'Current Highest Bid' : 'Starting Price'}
                  </Text>
                  <Text className="text-amber-400 text-3xl font-bold mt-1">
                    {`${(listing.highestBid?.amount || listing.price).toFixed(2)} AVAX`}
                  </Text>
                  {listing.highestBid && (
                    <Text className="text-zinc-500 text-sm mt-1">
                      {`by @${listing.highestBid.bidderUsername}`}
                    </Text>
                  )}
                </>
              ) : listing.listingType === 'trade' ? (
                <>
                  <Text className="text-zinc-400 text-sm">Looking For</Text>
                  <Text className="text-blue-400 text-xl font-semibold mt-1">
                    {listing.lookingFor || 'Open to offers'}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-zinc-400 text-sm">Price</Text>
                  <Text className="text-emerald-400 text-3xl font-bold mt-1">
                    {`${listing.price.toFixed(2)} AVAX`}
                  </Text>
                  <View className="flex-row justify-between mt-2 pt-2 border-t border-zinc-800">
                    <Text className="text-zinc-500 text-sm">
                      {`+${currentFeePercent}% fee: ${platformFee.toFixed(4)} AVAX`}
                    </Text>
                    <Text className="text-zinc-400 text-sm">
                      {`Total: ${(listing.price + platformFee).toFixed(4)} AVAX`}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Shipping Info (for physical items) */}
            {listing.itemType === 'physical' && (
              <View className="bg-zinc-900 rounded-xl p-4 mt-3">
                <View className="flex-row items-center mb-3">
                  <Truck size={18} color="#f59e0b" />
                  <Text className="text-white font-semibold ml-2">Shipping Information</Text>
                </View>
                {listing.shipsFrom && (
                  <View className="flex-row items-center mb-2">
                    <MapPin size={14} color="#71717a" />
                    <Text className="text-zinc-400 text-sm ml-2">{`Ships from: ${listing.shipsFrom}`}</Text>
                  </View>
                )}
                {listing.shippingCost !== undefined && (
                  <View className="flex-row items-center mb-2">
                    <Package size={14} color="#71717a" />
                    <Text className="text-zinc-400 text-sm ml-2">
                      {`Shipping: ${listing.shippingCost > 0 ? `${listing.shippingCost.toFixed(2)} AVAX` : 'Free'}`}
                    </Text>
                  </View>
                )}
                {listing.estimatedDelivery && (
                  <View className="flex-row items-center">
                    <Clock size={14} color="#71717a" />
                    <Text className="text-zinc-400 text-sm ml-2">{`Delivery: ${listing.estimatedDelivery}`}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Digital Item Info */}
            {listing.itemType === 'digital' && (
              <View className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 mt-3">
                <View className="flex-row items-center">
                  <Smartphone size={18} color="#8b5cf6" />
                  <Text className="text-violet-400 ml-2">
                    Digital delivery - Access will be provided after purchase
                  </Text>
                </View>
              </View>
            )}

            {/* NFT Info */}
            {listing.itemType === 'nft' && (
              <View className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mt-3">
                <View className="flex-row items-center">
                  <Hexagon size={18} color="#06b6d4" />
                  <Text className="text-cyan-400 ml-2">
                    NFT on Avalanche blockchain
                  </Text>
                </View>
              </View>
            )}

            {/* Actions */}
            {!isOwner && !isSold && (
              <View className="mt-4">
                {listing.listingType === 'fixed' && (
                  <>
                    <Pressable
                      onPress={onPurchase}
                      className="bg-emerald-500 rounded-xl py-4 items-center active:bg-emerald-600"
                    >
                      <Text className="text-white font-bold text-lg">Buy Now</Text>
                    </Pressable>

                    {/* Make Offer */}
                    {listing.acceptsOffers !== false && (
                      <View className="mt-3">
                        {!showOfferForm ? (
                          <Pressable
                            onPress={() => setShowOfferForm(true)}
                            className="bg-zinc-800 rounded-xl py-3 items-center active:bg-zinc-700"
                          >
                            <View className="flex-row items-center">
                              <MessageSquare size={18} color="#a1a1aa" />
                              <Text className="text-zinc-300 font-medium ml-2">Make an Offer</Text>
                            </View>
                          </Pressable>
                        ) : (
                          <View className="bg-zinc-900 rounded-xl p-4">
                            <Text className="text-white font-medium mb-3">Your Offer</Text>
                            <View className="flex-row items-center bg-zinc-800 rounded-xl px-4 mb-3">
                              <DollarSign size={18} color="#71717a" />
                              <TextInput
                                value={offerAmount}
                                onChangeText={setOfferAmount}
                                placeholder={`Less than ${listing.price.toFixed(2)}`}
                                placeholderTextColor="#71717a"
                                className="flex-1 py-3 text-white ml-2"
                                keyboardType="decimal-pad"
                              />
                              <Text className="text-zinc-400">AVAX</Text>
                            </View>
                            <TextInput
                              value={offerMessage}
                              onChangeText={setOfferMessage}
                              placeholder="Add a message (optional)"
                              placeholderTextColor="#71717a"
                              className="bg-zinc-800 rounded-xl px-4 py-3 text-white mb-3"
                            />
                            <View className="flex-row gap-2">
                              <Pressable
                                onPress={() => setShowOfferForm(false)}
                                className="flex-1 bg-zinc-700 rounded-xl py-3 items-center"
                              >
                                <Text className="text-white">Cancel</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => {
                                  onMakeOffer?.(parseFloat(offerAmount), offerMessage);
                                  setShowOfferForm(false);
                                  setOfferAmount('');
                                  setOfferMessage('');
                                }}
                                className="flex-1 bg-blue-500 rounded-xl py-3 items-center active:bg-blue-600"
                              >
                                <Text className="text-white font-bold">Send Offer</Text>
                              </Pressable>
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}

                {listing.listingType === 'auction' && (
                  <View>
                    {/* Buy Now Option */}
                    {listing.buyNowPrice && onBuyNow && (
                      <Pressable
                        onPress={onBuyNow}
                        className="bg-emerald-500 rounded-xl py-4 items-center active:bg-emerald-600 mb-3"
                      >
                        <View className="flex-row items-center">
                          <Zap size={18} color="#fff" />
                          <Text className="text-white font-bold text-lg ml-2">
                            {`Buy Now - ${listing.buyNowPrice.toFixed(2)} AVAX`}
                          </Text>
                        </View>
                      </Pressable>
                    )}

                    {/* Reserve Price Notice */}
                    {listing.reservePrice && !listing.reserveMet && (
                      <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-3">
                        <View className="flex-row items-center">
                          <AlertCircle size={16} color="#f59e0b" />
                          <Text className="text-amber-400 text-sm ml-2">Reserve price not yet met</Text>
                        </View>
                      </View>
                    )}

                    <View className="flex-row items-center bg-zinc-900 rounded-xl px-4 mb-3">
                      <TextInput
                        value={bidAmount}
                        onChangeText={setBidAmount}
                        placeholder={`Min: ${((listing.highestBid?.amount || listing.price) + 0.01).toFixed(2)}`}
                        placeholderTextColor="#71717a"
                        className="flex-1 py-3 text-white text-lg"
                        keyboardType="decimal-pad"
                      />
                      <Text className="text-zinc-400">AVAX</Text>
                    </View>
                    <Pressable
                      onPress={() => onBid(parseFloat(bidAmount))}
                      className="bg-amber-500 rounded-xl py-4 items-center active:bg-amber-600"
                    >
                      <Text className="text-white font-bold text-lg">Place Bid</Text>
                    </Pressable>
                  </View>
                )}

                {listing.listingType === 'trade' && (
                  <Pressable className="bg-blue-500 rounded-xl py-4 items-center active:bg-blue-600">
                    <Text className="text-white font-bold text-lg">Make Offer</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Buyer Actions - Escrow Release & Review */}
            {isBuyer && (
              <View className="mt-4">
                {/* Escrow Release */}
                {canReleaseEscrow && (
                  <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-3">
                    <View className="flex-row items-center mb-3">
                      <Shield size={20} color="#10b981" />
                      <Text className="text-emerald-400 font-semibold ml-2">Funds in Escrow</Text>
                    </View>
                    <Text className="text-zinc-300 text-sm mb-3">
                      Your payment is being held securely. Once you receive and verify the item, release the funds to complete the transaction.
                    </Text>
                    <View className="bg-black/30 rounded-lg p-3 mb-3">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-zinc-400 text-sm">Amount Held:</Text>
                        <Text className="text-white font-medium">{`${listing.escrow?.amount.toFixed(2)} AVAX`}</Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-zinc-400 text-sm">Seller Receives:</Text>
                        <Text className="text-emerald-400 font-medium">{`${listing.escrow?.sellerAmount.toFixed(2)} AVAX`}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={onReleaseEscrow}
                      className="bg-emerald-500 rounded-xl py-3 items-center active:bg-emerald-600"
                    >
                      <View className="flex-row items-center">
                        <CheckCircle size={18} color="#fff" />
                        <Text className="text-white font-bold ml-2">Item Received - Release Funds</Text>
                      </View>
                    </Pressable>
                  </View>
                )}

                {/* Review Form */}
                {canReview && (
                  <View className="bg-zinc-900 rounded-xl p-4 mb-3">
                    <Text className="text-white font-semibold mb-3">Leave a Review</Text>
                    <Pressable
                      onPress={() => onOpenRatingModal?.()}
                      className="bg-amber-500 rounded-xl py-3 items-center active:bg-amber-600"
                    >
                      <View className="flex-row items-center">
                        <Star size={18} color="#fff" />
                        <Text className="text-white font-bold ml-2">Rate This Seller</Text>
                      </View>
                    </Pressable>
                  </View>
                )}

                {/* Already Rated Message */}
                {isBuyer && hasRated && (
                  <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-3">
                    <View className="flex-row items-center">
                      <CheckCircle size={18} color="#10b981" />
                      <Text className="text-emerald-400 font-semibold ml-2">Review Submitted</Text>
                    </View>
                    <Text className="text-zinc-400 text-sm mt-2">
                      Thank you for leaving feedback on this transaction!
                    </Text>
                  </View>
                )}

                {/* Purchase Complete Message */}
                {listing.status === 'delivered' && !canReview && (
                  <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <View className="flex-row items-center">
                      <CheckCircle size={18} color="#10b981" />
                      <Text className="text-emerald-400 font-semibold ml-2">Transaction Complete</Text>
                    </View>
                    <Text className="text-zinc-400 text-sm mt-2">
                      You have received this item. Thank you for your purchase!
                    </Text>
                  </View>
                )}
              </View>
            )}

            {isOwner && (
              <View className="mt-4">
                {/* Active listing message */}
                {listing.status === 'active' && (
                  <View className="bg-zinc-900 rounded-xl p-4">
                    <Text className="text-zinc-400 text-center">This is your listing</Text>
                  </View>
                )}

                {/* Sold item - Show shipping management for physical items */}
                {isSold && listing.itemType === 'physical' && (
                  <View className="bg-zinc-900 rounded-xl p-4">
                    <View className="flex-row items-center mb-4">
                      <Package size={20} color="#10b981" />
                      <Text className="text-white font-semibold ml-2 text-lg">Shipping Management</Text>
                    </View>

                    {/* Shipping Status */}
                    <View className="bg-black/30 rounded-xl p-3 mb-3">
                      <Text className="text-zinc-500 text-xs mb-1">Status</Text>
                      <View className="flex-row items-center">
                        <View
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: getShippingStatusColor(listing.shippingStatus) }}
                        />
                        <Text style={{ color: getShippingStatusColor(listing.shippingStatus) }} className="font-medium">
                          {getShippingStatusLabel(listing.shippingStatus)}
                        </Text>
                      </View>
                    </View>

                    {/* Buyer Info (Masked) */}
                    {listing.buyerShippingAddress && (
                      <View className="bg-black/30 rounded-xl p-3 mb-3">
                        <View className="flex-row items-center mb-2">
                          <Shield size={14} color="#f59e0b" />
                          <Text className="text-amber-400 text-xs ml-[6px]">Protected Address</Text>
                        </View>
                        <Text className="text-white font-medium">
                          {getMaskedAddress(listing.buyerShippingAddress)}
                        </Text>
                        <Text className="text-zinc-500 text-xs mt-1">
                          Full address hidden for buyer privacy
                        </Text>
                      </View>
                    )}

                    {/* Shipping Label */}
                    {listing.shippingLabel ? (
                      <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-3">
                        <View className="flex-row items-center mb-2">
                          <FileText size={16} color="#10b981" />
                          <Text className="text-emerald-400 font-semibold ml-2">Shipping Label Ready</Text>
                        </View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-zinc-400 text-sm">Carrier:</Text>
                          <Text className="text-white text-sm">{listing.shippingLabel.carrier}</Text>
                        </View>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-zinc-400 text-sm">Tracking:</Text>
                          <Text className="text-white text-sm font-mono">{listing.shippingLabel.trackingNumber}</Text>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-zinc-400 text-sm">Ship To:</Text>
                          <Text className="text-white text-sm">{listing.shippingLabel.maskedAddress}</Text>
                        </View>
                      </View>
                    ) : listing.buyerShippingAddress && onRequestLabel ? (
                      <Pressable
                        onPress={() => onRequestLabel(listing.id)}
                        className="bg-violet-500 rounded-xl py-3 items-center active:bg-violet-600 mb-3"
                      >
                        <View className="flex-row items-center">
                          <FileText size={18} color="#fff" />
                          <Text className="text-white font-bold ml-2">Generate Shipping Label</Text>
                        </View>
                      </Pressable>
                    ) : null}

                    {/* Action Buttons */}
                    {listing.shippingLabel && onUpdateShippingStatus && (
                      <View className="flex-row gap-2">
                        {listing.shippingStatus !== 'shipped' && listing.shippingStatus !== 'delivered' && (
                          <Pressable
                            onPress={() => onUpdateShippingStatus(listing.id, 'shipped')}
                            className="flex-1 bg-cyan-500 rounded-xl py-3 items-center active:bg-cyan-600"
                          >
                            <View className="flex-row items-center">
                              <Truck size={16} color="#fff" />
                              <Text className="text-white font-medium ml-2">Mark Shipped</Text>
                            </View>
                          </Pressable>
                        )}
                        {listing.shippingStatus === 'shipped' && (
                          <Pressable
                            onPress={() => onUpdateShippingStatus(listing.id, 'delivered')}
                            className="flex-1 bg-green-500 rounded-xl py-3 items-center active:bg-green-600"
                          >
                            <View className="flex-row items-center">
                              <CheckCircle size={16} color="#fff" />
                              <Text className="text-white font-medium ml-2">Mark Delivered</Text>
                            </View>
                          </Pressable>
                        )}
                      </View>
                    )}

                    {listing.status === 'delivered' && (
                      <View className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mt-3">
                        <View className="flex-row items-center">
                          <CheckCircle size={16} color="#22c55e" />
                          <Text className="text-green-400 ml-2">Item has been delivered!</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Sold digital/NFT item */}
                {isSold && listing.itemType !== 'physical' && (
                  <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <View className="flex-row items-center">
                      <CheckCircle size={18} color="#10b981" />
                      <Text className="text-emerald-400 font-semibold ml-2">
                        {`Sold to @${listing.buyerUsername}`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Bids History */}
            {listing.listingType === 'auction' && listing.bids.length > 0 && (
              <View className="mt-6">
                <Text className="text-white font-semibold text-lg mb-3">
                  {`Bid History (${listing.bids.length})`}
                </Text>
                {listing.bids
                  .slice()
                  .reverse()
                  .map((bid, index) => (
                    <View
                      key={bid.id}
                      className="flex-row items-center justify-between py-3 border-b border-zinc-800"
                    >
                      <View>
                        <Text className="text-white">{`@${bid.bidderUsername}`}</Text>
                        <Text className="text-zinc-500 text-xs">
                          {new Date(bid.timestamp).toLocaleString()}
                        </Text>
                      </View>
                      <Text className={`font-bold ${index === 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                        {`${bid.amount.toFixed(2)} AVAX`}
                      </Text>
                    </View>
                  ))}
              </View>
            )}

            {/* Seller Reviews */}
            {sellerReviews.length > 0 && (
              <View className="mt-6">
                <Text className="text-white font-semibold text-lg mb-3">
                  {`Seller Reviews (${sellerReviews.length})`}
                </Text>
                {sellerReviews.slice(0, 3).map((review) => (
                  <View key={review.id} className="bg-zinc-900 rounded-xl p-3 mb-2">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-zinc-300">{`@${review.reviewerUsername}`}</Text>
                      <View className="flex-row items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            color="#f59e0b"
                            fill={star <= review.rating ? '#f59e0b' : 'transparent'}
                          />
                        ))}
                      </View>
                    </View>
                    {review.comment && (
                      <Text className="text-zinc-400 text-sm">{review.comment}</Text>
                    )}
                    <Text className="text-zinc-600 text-xs mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Similar Items */}
            {similarListings.length > 0 && (
              <View className="mt-6">
                <View className="flex-row items-center mb-3">
                  <TrendingUp size={18} color="#8b5cf6" />
                  <Text className="text-white font-semibold text-lg ml-2">Similar Items</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
                  {similarListings.map((similar) => (
                    <Pressable
                      key={similar.id}
                      className="bg-zinc-900 rounded-xl overflow-hidden mr-3 active:opacity-80"
                      style={{ width: 140 }}
                    >
                      <View style={{ height: 100, backgroundColor: '#27272a' }}>
                        {similar.imageUrl ? (
                          <Image
                            source={{ uri: similar.imageUrl }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="flex-1 items-center justify-center">
                            <ImageIcon size={24} color="#52525b" />
                          </View>
                        )}
                      </View>
                      <View className="p-2">
                        <Text className="text-white text-sm font-medium" numberOfLines={1}>
                          {similar.title}
                        </Text>
                        <Text className="text-emerald-400 text-sm font-bold">
                          {`${similar.price.toFixed(2)} AVAX`}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function MarketplaceScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all' | 'my_sales' | 'watchlist' | 'featured'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [pendingShippingAddress, setPendingShippingAddress] = useState<ShippingAddress | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const listings = useMarketplaceStore((s) => s.listings);
  const createListing = useMarketplaceStore((s) => s.createListing);
  const purchaseListing = useMarketplaceStore((s) => s.purchaseListing);
  const placeBid = useMarketplaceStore((s) => s.placeBid);
  const totalVolume = useMarketplaceStore((s) => s.totalVolume);
  const totalFees = useMarketplaceStore((s) => s.totalFees);
  const currentFeePercent = useMarketplaceStore((s) => s.currentFeePercent);
  const getUserWatchlist = useMarketplaceStore((s) => s.getUserWatchlist);
  const getFeaturedListings = useMarketplaceStore((s) => s.getFeaturedListings);

  // Filter listings
  const activeListings = useMemo(() => {
    let filtered = Object.values(listings);

    // My Sales filter - show user's sold items
    if (selectedCategory === 'my_sales' && user) {
      return filtered
        .filter((l) => l.sellerId === user.id && (l.status === 'sold' || l.status === 'shipped' || l.status === 'delivered' || l.status === 'in_escrow'))
        .sort((a, b) => new Date(b.soldAt || b.createdAt).getTime() - new Date(a.soldAt || a.createdAt).getTime());
    }

    // Watchlist filter - show user's saved listings
    if (selectedCategory === 'watchlist' && user) {
      const watchlistIds = getUserWatchlist(user.id);
      return filtered
        .filter((l) => watchlistIds.includes(l.id) && l.status === 'active')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Featured filter - show featured listings
    if (selectedCategory === 'featured') {
      return getFeaturedListings()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Regular category filter
    return filtered
      .filter((l) => l.status === 'active')
      .filter((l) => selectedCategory === 'all' || l.category === selectedCategory)
      .filter((l) =>
        searchQuery
          ? l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.sellerUsername.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [listings, selectedCategory, searchQuery, user, getUserWatchlist, getFeaturedListings]);

  const handleCreateListing = (listingData: {
    title: string;
    description: string;
    category: ItemCategory;
    itemType: ItemType;
    imageUrl: string;
    listingType: ListingType;
    price: number;
    lookingFor?: string;
    shippingCost?: number;
    estimatedDelivery?: string;
    shipsFrom?: string;
  }) => {
    if (!user || !user.walletAddress) {
      Alert.alert('Wallet Required', 'Please link a wallet to create listings');
      return;
    }

    createListing({
      sellerId: user.id,
      sellerUsername: user.username,
      sellerWallet: user.walletAddress,
      ...listingData,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Finalize purchase (with or without shipping address)
  const finalizePurchase = (shippingAddress?: ShippingAddress) => {
    if (!user || !selectedListing) return;

    const result = purchaseListing(
      selectedListing.id,
      user.id,
      user.username,
      user.walletAddress!,
      shippingAddress
    );

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      let message = `You bought "${selectedListing.title}"!\n\nPlease send ${selectedListing.price.toFixed(4)} AVAX to the seller and ${result.transaction?.platformFee.toFixed(4)} AVAX to the platform wallet.`;

      if (selectedListing.itemType === 'physical' && shippingAddress) {
        message += `\n\nThe seller will receive a shipping label with your masked address (${getMaskedAddress(shippingAddress)}).`;
      }

      Alert.alert('Purchase Complete', message);
      setSelectedListing(null);
      setShowShippingModal(false);
      setPendingShippingAddress(null);
    } else {
      Alert.alert('Error', result.error || 'Failed to complete purchase');
    }
  };

  const handlePurchase = () => {
    if (!user || !selectedListing) return;

    if (!hasLinkedWallet(user)) {
      Alert.alert('Wallet Required', 'Please link a wallet to make purchases');
      return;
    }

    // For physical items, show shipping address modal first
    if (selectedListing.itemType === 'physical') {
      setShowShippingModal(true);
      return;
    }

    // For digital/NFT items, proceed directly with confirmation
    Alert.alert(
      'Confirm Purchase',
      `Buy "${selectedListing.title}" for ${selectedListing.price.toFixed(2)} AVAX?\n\nA ${currentFeePercent}% platform fee will be added.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: () => finalizePurchase(),
        },
      ]
    );
  };

  // Handle shipping address submission
  const handleShippingAddressSubmit = (address: ShippingAddress) => {
    if (!selectedListing) return;

    Alert.alert(
      'Confirm Purchase',
      `Buy "${selectedListing.title}" for ${selectedListing.price.toFixed(2)} AVAX?\n\nShipping: ${selectedListing.shippingCost?.toFixed(2) || '0.00'} AVAX\nA ${currentFeePercent}% platform fee will be added.\n\nYour address will be protected. The seller will only see: ${getMaskedAddress(address)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: () => finalizePurchase(address),
        },
      ]
    );
  };

  const handleBid = (amount: number) => {
    if (!user || !selectedListing) return;

    if (!hasLinkedWallet(user)) {
      Alert.alert('Wallet Required', 'Please link a wallet to place bids');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Bid', 'Please enter a valid bid amount');
      return;
    }

    const result = placeBid(selectedListing.id, {
      listingId: selectedListing.id,
      bidderId: user.id,
      bidderUsername: user.username,
      bidderWallet: user.walletAddress!,
      amount,
    });

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Bid Placed', `Your bid of ${amount.toFixed(2)} AVAX has been placed!`);
      // Refresh listing
      setSelectedListing(useMarketplaceStore.getState().getListingById(selectedListing.id) || null);
    } else {
      Alert.alert('Bid Failed', result.error || 'Failed to place bid');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Handle shipping label generation
  const requestShippingLabel = useMarketplaceStore((s) => s.requestShippingLabel);
  const updateShippingStatus = useMarketplaceStore((s) => s.updateShippingStatus);

  const handleRequestLabel = (listingId: string) => {
    const result = requestShippingLabel(listingId);
    if (result.success && result.label) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Label Generated',
        `Shipping label created!\n\nCarrier: ${result.label.carrier}\nTracking: ${result.label.trackingNumber}\n\nThe buyer's address is protected. You will ship to:\n${result.label.maskedAddress}`
      );
      // Refresh the listing
      setSelectedListing(useMarketplaceStore.getState().getListingById(listingId) || null);
    } else {
      Alert.alert('Error', result.error || 'Failed to generate label');
    }
  };

  const handleUpdateShippingStatus = (listingId: string, status: 'shipped' | 'delivered') => {
    updateShippingStatus(listingId, status);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (status === 'shipped') {
      Alert.alert('Shipped', 'Item has been marked as shipped. The buyer will be notified.');
    } else {
      Alert.alert('Delivered', 'Item has been marked as delivered. Transaction complete!');
    }

    // Refresh the listing
    setSelectedListing(useMarketplaceStore.getState().getListingById(listingId) || null);
  };

  // Handle Buy Now for auctions
  const buyNow = useMarketplaceStore((s) => s.buyNow);
  const handleBuyNow = () => {
    if (!user || !selectedListing) return;

    if (!hasLinkedWallet(user)) {
      Alert.alert('Wallet Required', 'Please link a wallet to make purchases');
      return;
    }

    Alert.alert(
      'Buy Now',
      `Buy "${selectedListing.title}" instantly for ${selectedListing.buyNowPrice?.toFixed(2)} AVAX?\n\nA ${currentFeePercent}% platform fee will be added.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: () => {
            const result = buyNow(selectedListing.id, user.id, user.username, user.walletAddress!);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Purchase Complete', `You bought "${selectedListing.title}" via Buy Now!`);
              setSelectedListing(null);
            } else {
              Alert.alert('Error', result.error || 'Failed to complete purchase');
            }
          },
        },
      ]
    );
  };

  // Handle making an offer
  const makeOffer = useMarketplaceStore((s) => s.makeOffer);
  const handleMakeOffer = (amount: number, message?: string) => {
    if (!user || !selectedListing) return;

    if (!hasLinkedWallet(user)) {
      Alert.alert('Wallet Required', 'Please link a wallet to make offers');
      return;
    }

    if (isNaN(amount) || amount <= 0 || amount >= selectedListing.price) {
      Alert.alert('Invalid Offer', 'Offer must be greater than 0 and less than the asking price');
      return;
    }

    const result = makeOffer({
      listingId: selectedListing.id,
      offererId: user.id,
      offererUsername: user.username,
      offererWallet: user.walletAddress!,
      amount,
      message,
    });

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Offer Sent', `Your offer of ${amount.toFixed(2)} AVAX has been sent to the seller!`);
      setSelectedListing(useMarketplaceStore.getState().getListingById(selectedListing.id) || null);
    } else {
      Alert.alert('Error', result.error || 'Failed to send offer');
    }
  };

  // Handle releasing escrow
  const releaseEscrow = useMarketplaceStore((s) => s.releaseEscrow);
  const handleReleaseEscrow = () => {
    if (!user || !selectedListing) return;

    Alert.alert(
      'Release Funds',
      'Are you sure you want to release the funds to the seller? This confirms you have received the item.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release Funds',
          onPress: () => {
            const result = releaseEscrow(selectedListing.id, user.id);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Funds Released', 'The seller has received your payment. Thank you for your purchase!');
              setSelectedListing(useMarketplaceStore.getState().getListingById(selectedListing.id) || null);
            } else {
              Alert.alert('Error', result.error || 'Failed to release escrow');
            }
          },
        },
      ]
    );
  };

  // Handle submitting a review
  const addReview = useMarketplaceStore((s) => s.addReview);
  const handleSubmitReview = (rating: number, comment: string) => {
    if (!user || !selectedListing) return;

    const result = addReview({
      listingId: selectedListing.id,
      reviewerId: user.id,
      reviewerUsername: user.username,
      sellerId: selectedListing.sellerId,
      rating,
      comment,
    });

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Review Submitted', 'Thank you for your feedback!');
      setSelectedListing(useMarketplaceStore.getState().getListingById(selectedListing.id) || null);
    } else {
      Alert.alert('Error', result.error || 'Failed to submit review');
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f0f23']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <SafeAreaView className="flex-1 items-center justify-center px-8">
          <View className="bg-violet-500/20 p-5 rounded-full mb-4">
            <Store size={50} color="#8b5cf6" />
          </View>
          <Text className="text-white text-2xl font-bold text-center mb-2">Marketplace</Text>
          <Text className="text-zinc-400 text-center mb-6">
            Sign in to buy, sell, and trade items with other users
          </Text>
          <Pressable
            onPress={() => router.push('/auth')}
            className="bg-violet-500 px-8 py-4 rounded-xl active:bg-violet-600"
          >
            <Text className="text-white font-bold">Sign In</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f23']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-2 pb-2">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="bg-violet-500/20 p-2 rounded-xl mr-3">
                <Store size={24} color="#8b5cf6" />
              </View>
              <View>
                <Text className="text-white text-xl font-bold">Marketplace</Text>
                <Text className="text-zinc-400 text-sm">Buy, Sell & Trade</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                if (!hasLinkedWallet(user)) {
                  Alert.alert('Wallet Required', 'Please link a wallet in your profile to create listings');
                  return;
                }
                setShowCreateModal(true);
              }}
              className="bg-violet-500 p-3 rounded-xl active:bg-violet-600"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-zinc-800/80 rounded-xl px-4 py-3">
            <Search size={18} color="#71717a" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search listings..."
              placeholderTextColor="#71717a"
              className="flex-1 text-white ml-2"
            />
            {searchQuery && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color="#71717a" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
          style={{ flexGrow: 0 }}
        >
          {/* Browse Shops Button */}
          <Pressable
            onPress={() => router.push('/shops')}
            className="px-4 py-2 rounded-xl mr-2 flex-row items-center bg-emerald-500/20 border border-emerald-500/30"
          >
            <Store size={14} color="#10b981" />
            <Text className="ml-[6px] font-medium text-emerald-400">
              Shops
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl mr-2 ${
              selectedCategory === 'all' ? 'bg-violet-500' : 'bg-zinc-800'
            }`}
          >
            <Text className={selectedCategory === 'all' ? 'text-white font-medium' : 'text-zinc-400'}>
              All
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedCategory('my_sales')}
            className={`px-4 py-2 rounded-xl mr-2 flex-row items-center ${
              selectedCategory === 'my_sales' ? '' : 'bg-zinc-800'
            }`}
            style={
              selectedCategory === 'my_sales'
                ? { backgroundColor: '#10b98130' }
                : {}
            }
          >
            <Package
              size={14}
              color={selectedCategory === 'my_sales' ? '#10b981' : '#71717a'}
            />
            <Text
              className={`ml-[6px] ${selectedCategory === 'my_sales' ? 'font-medium' : 'text-zinc-400'}`}
              style={selectedCategory === 'my_sales' ? { color: '#10b981' } : {}}
            >
              My Sales
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedCategory('watchlist')}
            className={`px-4 py-2 rounded-xl mr-2 flex-row items-center ${
              selectedCategory === 'watchlist' ? '' : 'bg-zinc-800'
            }`}
            style={
              selectedCategory === 'watchlist'
                ? { backgroundColor: '#ef444430' }
                : {}
            }
          >
            <Heart
              size={14}
              color={selectedCategory === 'watchlist' ? '#ef4444' : '#71717a'}
            />
            <Text
              className={`ml-[6px] ${selectedCategory === 'watchlist' ? 'font-medium' : 'text-zinc-400'}`}
              style={selectedCategory === 'watchlist' ? { color: '#ef4444' } : {}}
            >
              Watchlist
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedCategory('featured')}
            className={`px-4 py-2 rounded-xl mr-2 flex-row items-center ${
              selectedCategory === 'featured' ? '' : 'bg-zinc-800'
            }`}
            style={
              selectedCategory === 'featured'
                ? { backgroundColor: '#f59e0b30' }
                : {}
            }
          >
            <Zap
              size={14}
              color={selectedCategory === 'featured' ? '#f59e0b' : '#71717a'}
            />
            <Text
              className={`ml-[6px] ${selectedCategory === 'featured' ? 'font-medium' : 'text-zinc-400'}`}
              style={selectedCategory === 'featured' ? { color: '#f59e0b' } : {}}
            >
              Featured
            </Text>
          </Pressable>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.value}
              onPress={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-xl mr-2 flex-row items-center ${
                selectedCategory === cat.value ? '' : 'bg-zinc-800'
              }`}
              style={
                selectedCategory === cat.value
                  ? { backgroundColor: `${cat.color}30` }
                  : {}
              }
            >
              <cat.icon
                size={14}
                color={selectedCategory === cat.value ? cat.color : '#71717a'}
              />
              <Text
                className={`ml-[6px] ${selectedCategory === cat.value ? 'font-medium' : 'text-zinc-400'}`}
                style={selectedCategory === cat.value ? { color: cat.color } : {}}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Listings */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#8b5cf6" />
          }
        >
          {/* Stats */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-zinc-900 rounded-xl p-3">
              <Text className="text-zinc-500 text-xs">Total Volume</Text>
              <Text className="text-white font-bold">{`${totalVolume.toFixed(2)} AVAX`}</Text>
            </View>
            <View className="flex-1 bg-zinc-900 rounded-xl p-3">
              <Text className="text-zinc-500 text-xs">Active Listings</Text>
              <Text className="text-white font-bold">{activeListings.length}</Text>
            </View>
          </View>

          {/* Listings Grid */}
          {activeListings.length === 0 ? (
            <View className="items-center py-16">
              <Store size={50} color="#52525b" />
              <Text className="text-zinc-400 mt-4 text-center">
                No listings found.{'\n'}Be the first to sell something!
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {activeListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onPress={() => setSelectedListing(listing)}
                  userId={user?.id}
                  onSellerPress={(sellerId) => router.push(`/user/${sellerId}`)}
                />
              ))}
            </View>
          )}

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <CreateListingModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateListing}
      />

      <ListingDetailModal
        visible={!!selectedListing && !showShippingModal}
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onPurchase={handlePurchase}
        onBid={handleBid}
        onBuyNow={handleBuyNow}
        onMakeOffer={handleMakeOffer}
        onReleaseEscrow={handleReleaseEscrow}
        onSubmitReview={handleSubmitReview}
        currentUserId={user?.id || null}
        currentUsername={user?.username}
        onRequestLabel={handleRequestLabel}
        onUpdateShippingStatus={handleUpdateShippingStatus}
        onSellerPress={(sellerId) => {
          setSelectedListing(null);
          router.push(`/user/${sellerId}`);
        }}
        onOpenRatingModal={() => setShowRatingModal(true)}
      />

      {/* Rating Modal */}
      {selectedListing && user && (
        <RatingModal
          visible={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          transactionId={selectedListing.id}
          listingId={selectedListing.id}
          ratedUserId={selectedListing.sellerId}
          ratedUsername={selectedListing.sellerUsername}
          raterId={user.id}
          raterUsername={user.username}
          ratingType="buyer_to_seller"
          itemType={selectedListing.itemType}
          itemTitle={selectedListing.title}
        />
      )}

      <ShippingAddressModal
        visible={showShippingModal}
        onClose={() => setShowShippingModal(false)}
        onSubmit={handleShippingAddressSubmit}
        listing={selectedListing}
      />
    </View>
  );
}
