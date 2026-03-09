import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Store,
  Star,
  Users,
  ShoppingBag,
  ChevronLeft,
  Edit3,
  Heart,
  HeartOff,
  Share2,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Gem,
  Cpu,
  Shirt,
  Palette,
  Gamepad2,
  Trophy,
  Diamond,
  Hand,
  Clock,
  MoreHorizontal,
  Trash2,
  Package,
  Plus,
} from 'lucide-react-native';
import { useShopStore, SHOP_CATEGORIES, type Shop } from '@/lib/shop-store';
import { useAuthStore } from '@/lib/auth-store';
import { useMarketplaceStore, type Listing } from '@/lib/marketplace-store';
import { useRatingStore, CROWN_NAMES, TIER_REQUIREMENTS } from '@/lib/rating-store';
import { CrownIcon, StarRating } from '@/components/CrownIcon';

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  store: Store,
  gem: Gem,
  cpu: Cpu,
  shirt: Shirt,
  palette: Palette,
  'gamepad-2': Gamepad2,
  trophy: Trophy,
  diamond: Diamond,
  hand: Hand,
  clock: Clock,
  'more-horizontal': MoreHorizontal,
};

// Listing card for shop items
function ListingCard({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-zinc-800 rounded-xl overflow-hidden active:opacity-80"
      style={{ width: '48%', marginBottom: 12 }}
    >
      <Image
        source={{ uri: listing.imageUrl }}
        style={{ width: '100%', height: 120 }}
        resizeMode="cover"
      />
      <View className="p-3">
        <Text className="text-white font-medium text-sm" numberOfLines={1}>
          {listing.title}
        </Text>
        <Text className="text-emerald-400 font-bold mt-1">{`${listing.price} AVAX`}</Text>
      </View>
    </Pressable>
  );
}

// Stat bar for category averages
function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const percentage = (value / 5) * 100;

  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-zinc-400 text-sm">{label}</Text>
        <Text className="text-white font-semibold">{value.toFixed(1)}</Text>
      </View>
      <View className="bg-zinc-800 h-2 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

export default function ShopDetailScreen() {
  const router = useRouter();
  const { shopId } = useLocalSearchParams<{ shopId: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const user = useAuthStore((s) => s.user);
  const getShopById = useShopStore((s) => s.getShopById);
  const followShop = useShopStore((s) => s.followShop);
  const unfollowShop = useShopStore((s) => s.unfollowShop);
  const isFollowing = useShopStore((s) => s.isFollowing);
  const deleteShop = useShopStore((s) => s.deleteShop);

  const listings = useMarketplaceStore((s) => s.listings);
  const userSummaries = useRatingStore((s) => s.userSummaries);

  // Get shop data
  const shop = shopId ? getShopById(shopId) : undefined;

  // Check if current user owns this shop
  const isOwner = user && shop && user.id === shop.ownerId;

  // Check if user is following
  const following = user && shop ? isFollowing(shop.id, user.id) : false;

  // Get shop owner's rating summary
  const userSummary = useMemo(() => {
    if (!shop) return null;
    const isPlatformOwner = shop.ownerId === 'N263Jm6mbFiYbvQ3KIRgXq66xXYRiLTx';
    const stored = userSummaries[shop.ownerId];
    if (stored) {
      return { ...stored, isPlatformOwner };
    }
    return {
      userId: shop.ownerId,
      totalRatings: 0,
      averageRating: 0,
      crownTier: isPlatformOwner ? ('sapphire' as const) : ('coal' as const),
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
  }, [shop, userSummaries]);

  // Get shop's active listings
  const shopListings = useMemo(() => {
    if (!shop) return [];
    return Object.values(listings).filter(
      (l) => l.sellerId === shop.ownerId && l.status === 'active'
    );
  }, [shop, listings]);

  const categoryInfo = shop ? SHOP_CATEGORIES.find((c) => c.value === shop.category) : undefined;
  const CategoryIcon = categoryInfo ? CATEGORY_ICONS[categoryInfo.icon] || Store : Store;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleFollow = () => {
    if (!user || !shop) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (following) {
      unfollowShop(shop.id, user.id);
    } else {
      followShop(shop.id, user.id);
    }
  };

  const handleDelete = () => {
    if (!shop) return;
    Alert.alert(
      'Delete Shop',
      'Are you sure you want to delete your shop? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const result = deleteShop(shop.id);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete shop');
            }
          },
        },
      ]
    );
  };

  if (!shop) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Shop',
            headerStyle: { backgroundColor: '#0f0f23' },
            headerTintColor: '#fff',
          }}
        />
        <View className="flex-1 bg-black items-center justify-center">
          <Text className="text-zinc-500">Shop not found</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: shop.name,
          headerStyle: { backgroundColor: '#0f0f23' },
          headerTintColor: '#fff',
          headerBackTitle: 'Back',
          headerRight: () =>
            isOwner ? (
              <Pressable
                onPress={() => router.push(`/shop/edit?shopId=${shop.id}`)}
                className="p-2"
              >
                <Edit3 size={20} color="#8b5cf6" />
              </Pressable>
            ) : null,
        }}
      />

      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f0f23']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />
          }
        >
          {/* Banner */}
          <View className="h-40">
            {shop.bannerUrl ? (
              <Image source={{ uri: shop.bannerUrl }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <LinearGradient
                colors={['#4c1d95', '#6d28d9', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </View>

          {/* Shop header */}
          <View className="px-5">
            {/* Logo and info */}
            <View className="-mt-10 flex-row items-end">
              <View className="relative">
                <View className="w-20 h-20 rounded-2xl bg-zinc-700 overflow-hidden border-4 border-black">
                  {shop.logoUrl ? (
                    <Image
                      source={{ uri: shop.logoUrl }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center bg-violet-600">
                      <Store size={36} color="#fff" />
                    </View>
                  )}
                </View>
                {/* Crown badge */}
                {userSummary && (
                  <View className="absolute -top-2 -right-2">
                    <CrownIcon tier={userSummary.crownTier} size="md" showGlow animate />
                  </View>
                )}
              </View>

              <View className="flex-1 ml-4 mb-1">
                <Text className="text-white text-xl font-bold">{shop.name}</Text>
                <Pressable onPress={() => router.push(`/user/${shop.ownerId}`)}>
                  <Text className="text-violet-400">{`@${shop.ownerUsername}`}</Text>
                </Pressable>
              </View>
            </View>

            {/* Crown tier */}
            {userSummary && (
              <View className="mt-3 flex-row items-center">
                <CrownIcon tier={userSummary.crownTier} size="sm" />
                <Text className="text-zinc-400 text-sm ml-2">
                  {CROWN_NAMES[userSummary.crownTier]}
                </Text>
                <Text className="text-zinc-600 text-xs ml-2">
                  {TIER_REQUIREMENTS[userSummary.crownTier].description}
                </Text>
              </View>
            )}

            {/* Description */}
            {shop.description ? (
              <Text className="text-zinc-400 mt-3">{shop.description}</Text>
            ) : null}

            {/* Category */}
            <View className="flex-row items-center mt-3">
              <View className="bg-zinc-800 px-3 py-[6px] rounded-full flex-row items-center">
                <CategoryIcon size={14} color="#a1a1aa" />
                <Text className="text-zinc-400 text-sm ml-[6px]">{categoryInfo?.label || 'Other'}</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View className="flex-row mt-4 gap-3">
              {!isOwner && user && (
                <Pressable
                  onPress={handleFollow}
                  className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                    following ? 'bg-zinc-800' : 'bg-violet-500'
                  }`}
                >
                  {following ? (
                    <>
                      <HeartOff size={18} color="#a1a1aa" />
                      <Text className="text-zinc-400 font-medium ml-2">Unfollow</Text>
                    </>
                  ) : (
                    <>
                      <Heart size={18} color="#fff" />
                      <Text className="text-white font-medium ml-2">Follow</Text>
                    </>
                  )}
                </Pressable>
              )}

              {isOwner && (
                <>
                  <Pressable
                    onPress={() => router.push(`/shop/edit?shopId=${shop.id}`)}
                    className="flex-1 py-3 rounded-xl bg-violet-500 flex-row items-center justify-center"
                  >
                    <Edit3 size={18} color="#fff" />
                    <Text className="text-white font-medium ml-2">Edit Shop</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleDelete}
                    className="py-3 px-4 rounded-xl bg-red-500/20 flex-row items-center justify-center"
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </Pressable>
                </>
              )}
            </View>

            {/* Stats */}
            <View className="flex-row mt-4 py-4 border-t border-zinc-800">
              <View className="flex-1 items-center">
                <Text className="text-white font-bold text-lg">{shop.followerCount}</Text>
                <Text className="text-zinc-500 text-xs">Followers</Text>
              </View>
              <View className="flex-1 items-center border-x border-zinc-800">
                <Text className="text-white font-bold text-lg">{shop.totalSales}</Text>
                <Text className="text-zinc-500 text-xs">Sales</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-white font-bold text-lg">{shopListings.length}</Text>
                <Text className="text-zinc-500 text-xs">Listings</Text>
              </View>
            </View>
          </View>

          {/* Rating summary */}
          {userSummary && userSummary.totalRatings > 0 && (
            <View className="mx-5 mt-4">
              <LinearGradient
                colors={['#27272a', '#1f1f23']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white font-semibold">Seller Rating</Text>
                  <StarRating
                    rating={userSummary.averageRating}
                    size="lg"
                    showNumber
                    showCount
                    count={userSummary.totalRatings}
                  />
                </View>

                <StatBar label="Delivery" value={userSummary.avgDelivery} color="#10b981" />
                <StatBar label="Timeliness" value={userSummary.avgTimeliness} color="#3b82f6" />
                <StatBar label="Communication" value={userSummary.avgCommunication} color="#8b5cf6" />
                <StatBar label="Accuracy" value={userSummary.avgAccuracy} color="#f59e0b" />

                {/* Sentiment breakdown */}
                <View className="flex-row mt-4 pt-4 border-t border-zinc-700">
                  <View className="flex-1 items-center">
                    <View className="flex-row items-center">
                      <ThumbsUp size={14} color="#10b981" />
                      <Text className="text-emerald-400 font-bold ml-1">
                        {userSummary.positiveCount}
                      </Text>
                    </View>
                    <Text className="text-zinc-500 text-xs">Positive</Text>
                  </View>
                  <View className="flex-1 items-center border-x border-zinc-700">
                    <View className="flex-row items-center">
                      <Minus size={14} color="#f59e0b" />
                      <Text className="text-amber-400 font-bold ml-1">
                        {userSummary.neutralCount}
                      </Text>
                    </View>
                    <Text className="text-zinc-500 text-xs">Neutral</Text>
                  </View>
                  <View className="flex-1 items-center">
                    <View className="flex-row items-center">
                      <ThumbsDown size={14} color="#ef4444" />
                      <Text className="text-red-400 font-bold ml-1">
                        {userSummary.negativeCount}
                      </Text>
                    </View>
                    <Text className="text-zinc-500 text-xs">Negative</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Listings */}
          <View className="px-5 mt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white font-semibold text-lg">
                {`Items for Sale (${shopListings.length})`}
              </Text>
              {isOwner && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/listing/create?shopId=${shop.id}`);
                  }}
                  className="flex-row items-center bg-violet-500 px-4 py-2 rounded-full"
                >
                  <Plus size={16} color="#fff" />
                  <Text className="text-white font-medium ml-1">List Item</Text>
                </Pressable>
              )}
            </View>

            {shopListings.length > 0 ? (
              <View className="flex-row flex-wrap justify-between">
                {shopListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onPress={() => {
                      // Navigate to listing detail or marketplace
                      Haptics.selectionAsync();
                    }}
                  />
                ))}
              </View>
            ) : (
              <View className="items-center py-12 bg-zinc-900 rounded-xl">
                <Package size={32} color="#3f3f46" />
                <Text className="text-zinc-500 mt-2">No items listed yet</Text>
                {isOwner && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push(`/listing/create?shopId=${shop.id}`);
                    }}
                    className="mt-3 bg-violet-500 px-6 py-2 rounded-full flex-row items-center"
                  >
                    <Plus size={16} color="#fff" />
                    <Text className="text-white font-medium ml-1">List Your First Item</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          <View className="h-24" />
        </ScrollView>
      </View>
    </>
  );
}
