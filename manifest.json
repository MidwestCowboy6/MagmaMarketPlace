import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {
  X,
  CheckCircle,
  Camera,
  Upload,
  Package,
  Smartphone,
  Hexagon,
  Tag,
  Gavel,
  ArrowLeftRight,
  Store,
  Image as ImageIcon,
  ChevronDown,
  Truck,
  MapPin,
} from 'lucide-react-native';
import { useAuthStore, hasLinkedWallet } from '@/lib/auth-store';
import {
  useMarketplaceStore,
  type ItemCategory,
  type ItemType,
  type ListingType,
  calculateFees,
} from '@/lib/marketplace-store';

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

export default function CreateListingScreen() {
  const router = useRouter();
  const { shopId } = useLocalSearchParams<{ shopId?: string }>();

  const user = useAuthStore((s) => s.user);
  const createListing = useMarketplaceStore((s) => s.createListing);
  const currentFeePercent = useMarketplaceStore((s) => s.currentFeePercent);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setImageUrl('');
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
        setImageUrl('');
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
    if (!user) {
      Alert.alert('Error', 'Please sign in to create a listing');
      return;
    }

    if (!hasLinkedWallet(user)) {
      Alert.alert('Wallet Required', 'Please link your wallet in your profile to create listings');
      return;
    }

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

    setIsSubmitting(true);
    setIsUploadingImage(true);

    // Get final image URL
    let finalImageUrl = imageUrl.trim();
    if (imageUri) {
      finalImageUrl = await getImageDataUrl(imageUri);
    }
    if (!finalImageUrl) {
      finalImageUrl = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400';
    }

    setIsUploadingImage(false);

    const listingId = createListing({
      sellerId: user.id,
      sellerUsername: user.username,
      sellerWallet: user.walletAddress || '',
      title: title.trim(),
      description: description.trim(),
      category,
      itemType,
      imageUrl: finalImageUrl,
      listingType,
      price: parseFloat(price) || 0,
      lookingFor: lookingFor.trim() || undefined,
      shippingCost: itemType === 'physical' ? parseFloat(shippingCost) || 0 : undefined,
      estimatedDelivery: itemType === 'physical' ? estimatedDelivery.trim() || undefined : undefined,
      shipsFrom: itemType === 'physical' ? shipsFrom.trim() || undefined : undefined,
    });

    setIsSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Navigate back to shop or marketplace
    if (shopId) {
      router.replace(`/shop/${shopId}`);
    } else {
      router.back();
    }
  };

  const { platformFee, sellerReceives } = calculateFees(parseFloat(price) || 0, currentFeePercent);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'List New Item',
          headerStyle: { backgroundColor: '#0f0f23' },
          headerTintColor: '#fff',
          headerBackTitle: 'Back',
          headerRight: () => (
            <Pressable onPress={handleCreate} disabled={isSubmitting} className="p-2">
              {isSubmitting ? (
                <ActivityIndicator color="#10b981" size="small" />
              ) : (
                <CheckCircle size={24} color="#10b981" />
              )}
            </Pressable>
          ),
        }}
      />

      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#1a1a2e', '#0f0f23']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
            {/* Error */}
            {error ? (
              <View className="bg-red-500/20 rounded-xl p-3 mb-4">
                <Text className="text-red-400 text-center">{error}</Text>
              </View>
            ) : null}

            {/* Image */}
            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">Item Photo</Text>
              {imageUri || imageUrl ? (
                <View className="relative">
                  <Image
                    source={{ uri: imageUri || imageUrl }}
                    style={{ width: '100%', height: 200, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => {
                      setImageUri(null);
                      setImageUrl('');
                    }}
                    className="absolute top-2 right-2 bg-black/60 p-2 rounded-full"
                  >
                    <X size={16} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={takePhoto}
                    className="flex-1 bg-zinc-800 rounded-xl p-6 items-center justify-center"
                  >
                    <Camera size={32} color="#8b5cf6" />
                    <Text className="text-zinc-400 mt-2">Take Photo</Text>
                  </Pressable>
                  <Pressable
                    onPress={pickImage}
                    className="flex-1 bg-zinc-800 rounded-xl p-6 items-center justify-center"
                  >
                    <Upload size={32} color="#8b5cf6" />
                    <Text className="text-zinc-400 mt-2">Upload</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What are you selling?"
                placeholderTextColor="#71717a"
                className="bg-zinc-800 text-white px-4 py-3 rounded-xl"
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
                multiline
                numberOfLines={3}
                className="bg-zinc-800 text-white px-4 py-3 rounded-xl"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>

            {/* Category */}
            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.value;
                  return (
                    <Pressable
                      key={cat.value}
                      onPress={() => setCategory(cat.value)}
                      className={`flex-row items-center px-4 py-2 rounded-full ${
                        isSelected ? 'bg-violet-500' : 'bg-zinc-800'
                      }`}
                    >
                      <Icon size={16} color={isSelected ? '#fff' : cat.color} />
                      <Text className={`ml-2 ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Item Type */}
            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">Item Type</Text>
              <View className="flex-row gap-2">
                {ITEM_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = itemType === type.value;
                  return (
                    <Pressable
                      key={type.value}
                      onPress={() => setItemType(type.value)}
                      className={`flex-1 items-center p-3 rounded-xl border ${
                        isSelected ? 'border-violet-500 bg-violet-500/20' : 'border-zinc-700 bg-zinc-800'
                      }`}
                    >
                      <Icon size={24} color={isSelected ? '#8b5cf6' : type.color} />
                      <Text className={`mt-1 font-medium ${isSelected ? 'text-violet-400' : 'text-white'}`}>
                        {type.label}
                      </Text>
                      <Text className="text-zinc-500 text-xs">{type.description}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Listing Type */}
            <View className="mb-4">
              <Text className="text-zinc-400 text-sm mb-2">Listing Type</Text>
              <View className="flex-row gap-2">
                {LISTING_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = listingType === type.value;
                  return (
                    <Pressable
                      key={type.value}
                      onPress={() => setListingType(type.value)}
                      className={`flex-1 flex-row items-center justify-center px-3 py-3 rounded-xl ${
                        isSelected ? 'bg-violet-500' : 'bg-zinc-800'
                      }`}
                    >
                      <Icon size={18} color={isSelected ? '#fff' : type.color} />
                      <Text className={`ml-2 ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                        {type.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Price */}
            {listingType !== 'trade' && (
              <View className="mb-4">
                <Text className="text-zinc-400 text-sm mb-2">
                  {listingType === 'auction' ? 'Starting Price (AVAX)' : 'Price (AVAX)'}
                </Text>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor="#71717a"
                  keyboardType="decimal-pad"
                  className="bg-zinc-800 text-white px-4 py-3 rounded-xl"
                />
                {parseFloat(price) > 0 && (
                  <View className="mt-2 bg-zinc-800/50 rounded-lg p-3">
                    <View className="flex-row justify-between">
                      <Text className="text-zinc-500">Platform fee ({currentFeePercent}%)</Text>
                      <Text className="text-zinc-400">{platformFee.toFixed(4)} AVAX</Text>
                    </View>
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-zinc-500">You receive</Text>
                      <Text className="text-emerald-400 font-medium">{sellerReceives.toFixed(4)} AVAX</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Looking For (Trade only) */}
            {listingType === 'trade' && (
              <View className="mb-4">
                <Text className="text-zinc-400 text-sm mb-2">What are you looking for?</Text>
                <TextInput
                  value={lookingFor}
                  onChangeText={setLookingFor}
                  placeholder="Describe what you want in trade..."
                  placeholderTextColor="#71717a"
                  multiline
                  className="bg-zinc-800 text-white px-4 py-3 rounded-xl"
                  style={{ minHeight: 60, textAlignVertical: 'top' }}
                />
              </View>
            )}

            {/* Shipping Info (Physical only) */}
            {itemType === 'physical' && (
              <>
                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2">Ships From *</Text>
                  <View className="flex-row items-center bg-zinc-800 rounded-xl px-4">
                    <MapPin size={18} color="#71717a" />
                    <TextInput
                      value={shipsFrom}
                      onChangeText={setShipsFrom}
                      placeholder="e.g., United States, California"
                      placeholderTextColor="#71717a"
                      className="flex-1 text-white py-3 ml-2"
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2">Shipping Cost (AVAX)</Text>
                  <View className="flex-row items-center bg-zinc-800 rounded-xl px-4">
                    <Truck size={18} color="#71717a" />
                    <TextInput
                      value={shippingCost}
                      onChangeText={setShippingCost}
                      placeholder="0.00 (free shipping)"
                      placeholderTextColor="#71717a"
                      keyboardType="decimal-pad"
                      className="flex-1 text-white py-3 ml-2"
                    />
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2">Estimated Delivery</Text>
                  <TextInput
                    value={estimatedDelivery}
                    onChangeText={setEstimatedDelivery}
                    placeholder="e.g., 3-5 business days"
                    placeholderTextColor="#71717a"
                    className="bg-zinc-800 text-white px-4 py-3 rounded-xl"
                  />
                </View>
              </>
            )}

            {/* Create Button */}
            <Pressable
              onPress={handleCreate}
              disabled={isSubmitting}
              className={`py-4 rounded-xl items-center mb-8 ${
                isSubmitting ? 'bg-violet-500/50' : 'bg-violet-500'
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-lg">Create Listing</Text>
              )}
            </Pressable>

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}
