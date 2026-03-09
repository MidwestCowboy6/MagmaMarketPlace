import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Search,
  Store,
  Star,
  Users,
  ShoppingBag,
  ChevronRight,
  X,
  Filter,
  Crown,
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
  Plus,
} from 'lucide-react-native';
import { useShopStore, SHOP_CATEGORIES, type ShopCategory, type Shop } from '@/lib/shop-store';
import { useAuthStore } from '@/lib/auth-store';
import { useRatingStore, CROWN_NAMES } from '@/lib/rating-store';
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

// Category filter chip
function CategoryChip({
  category,
  isSelected,
  onPress,
}: {
  category: { value: ShopCategory; label: string; icon: string };
  isSelected: boolean;
  onPress: () => void;
}) {
  const Icon = CATEGORY_ICONS[category.icon] || Store;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
        isSelected ? 'bg-violet-500' : 'bg-zinc-800'
      }`}
    >
      <Icon size={14} color={isSelected ? '#fff' : '#a1a1aa'} />
      <Text className={`ml-[6px] text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
        {category.label}
      </Text>
    </Pressable>
  );
}

// Shop card component
function ShopCard({ shop, onPress }: { shop: Shop; onPress: () => void }) {
  const userSummaries = useRatingStore((s) => s.userSummaries);

  const userSummary = useMemo(() => {
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
  }, [shop.ownerId, userSummaries]);

  const categoryInfo = SHOP_CATEGORIES.find((c) => c.value === shop.category);
  const CategoryIcon = categoryInfo ? CATEGORY_ICONS[categoryInfo.icon] || Store : Store;

  return (
    <Pressable
      onPress={onPress}
      className="bg-zinc-900 rounded-2xl overflow-hidden mb-4 active:opacity-80"
    >
      {/* Banner */}
      <View className="h-24 bg-zinc-800">
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

      {/* Content */}
      <View className="px-4 pb-4">
        {/* Logo overlapping banner */}
        <View className="-mt-8 mb-3 flex-row items-end justify-between">
          <View className="relative">
            <View className="w-16 h-16 rounded-xl bg-zinc-700 overflow-hidden border-4 border-zinc-900">
              {shop.logoUrl ? (
                <Image source={{ uri: shop.logoUrl }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <View className="flex-1 items-center justify-center bg-violet-600">
                  <Store size={28} color="#fff" />
                </View>
              )}
            </View>
            {/* Crown badge */}
            <View className="absolute -top-1 -right-1">
              <CrownIcon tier={userSummary.crownTier} size="sm" showGlow />
            </View>
          </View>

          {/* Category badge */}
          <View className="bg-zinc-800 px-3 py-[6px] rounded-full flex-row items-center mb-2">
            <CategoryIcon size={12} color="#a1a1aa" />
            <Text className="text-zinc-400 text-xs ml-1">{categoryInfo?.label || 'Other'}</Text>
          </View>
        </View>

        {/* Shop info */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-white font-bold text-lg" numberOfLines={1}>
              {shop.name}
            </Text>
            <Text className="text-violet-400 text-sm">{`@${shop.ownerUsername}`}</Text>
            {shop.description ? (
              <Text className="text-zinc-400 text-sm mt-1" numberOfLines={2}>
                {shop.description}
              </Text>
            ) : null}
          </View>
          <ChevronRight size={20} color="#71717a" />
        </View>

        {/* Stats row */}
        <View className="flex-row mt-3 pt-3 border-t border-zinc-800">
          {/* Rating */}
          <View className="flex-1 flex-row items-center">
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-white font-medium ml-1">
              {userSummary.averageRating > 0 ? userSummary.averageRating.toFixed(1) : 'New'}
            </Text>
            {userSummary.totalRatings > 0 && (
              <Text className="text-zinc-500 text-xs ml-1">{`(${userSummary.totalRatings})`}</Text>
            )}
          </View>

          {/* Followers */}
          <View className="flex-1 flex-row items-center justify-center">
            <Users size={14} color="#8b5cf6" />
            <Text className="text-zinc-400 text-sm ml-1">{shop.followerCount}</Text>
          </View>

          {/* Sales */}
          <View className="flex-1 flex-row items-center justify-end">
            <ShoppingBag size={14} color="#10b981" />
            <Text className="text-zinc-400 text-sm ml-1">{shop.totalSales} sold</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function ShopsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const user = useAuthStore((s) => s.user);
  const searchShops = useShopStore((s) => s.searchShops);
  const getShopByOwnerId = useShopStore((s) => s.getShopByOwnerId);

  // Get user's shop if they have one
  const userShop = user ? getShopByOwnerId(user.id) : undefined;

  // Search/filter shops
  const filteredShops = useMemo(() => {
    return searchShops(searchQuery, selectedCategory ?? undefined);
  }, [searchQuery, selectedCategory, searchShops]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    Haptics.selectionAsync();
  };

  const handleCategoryPress = (category: ShopCategory) => {
    Haptics.selectionAsync();
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Shops',
          headerStyle: { backgroundColor: '#0f0f23' },
          headerTintColor: '#fff',
          headerBackTitle: 'Back',
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
          {/* Search bar */}
          <View className="px-5 pt-4">
            <View className="bg-zinc-900 rounded-xl px-4 py-3 flex-row items-center">
              <Search size={18} color="#71717a" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 text-white text-base ml-3"
                placeholder="Search shops by name or username..."
                placeholderTextColor="#71717a"
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={handleClearSearch} className="p-1">
                  <X size={18} color="#71717a" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Category filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ paddingHorizontal: 20 }}
            style={{ flexGrow: 0 }}
          >
            {SHOP_CATEGORIES.map((category) => (
              <CategoryChip
                key={category.value}
                category={category}
                isSelected={selectedCategory === category.value}
                onPress={() => handleCategoryPress(category.value)}
              />
            ))}
          </ScrollView>

          {/* Create/View your shop CTA */}
          <View className="px-5 mt-4">
            {userShop ? (
              <Pressable
                onPress={() => router.push(`/shop/${userShop.id}`)}
                className="bg-violet-500/20 border border-violet-500/30 rounded-xl p-4 flex-row items-center active:bg-violet-500/30"
              >
                <View className="bg-violet-500/30 p-2 rounded-lg">
                  <Store size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-violet-400 font-semibold">Your Shop</Text>
                  <Text className="text-violet-300/70 text-sm">{userShop.name}</Text>
                </View>
                <ChevronRight size={20} color="#8b5cf6" />
              </Pressable>
            ) : user ? (
              <Pressable
                onPress={() => router.push('/shop/create')}
                className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 flex-row items-center active:bg-emerald-500/30"
              >
                <View className="bg-emerald-500/30 p-2 rounded-lg">
                  <Plus size={20} color="#10b981" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-emerald-400 font-semibold">Create Your Shop</Text>
                  <Text className="text-emerald-300/70 text-sm">
                    Start selling your items today
                  </Text>
                </View>
                <ChevronRight size={20} color="#10b981" />
              </Pressable>
            ) : null}
          </View>

          {/* Results header */}
          <View className="px-5 mt-6 mb-3 flex-row items-center justify-between">
            <Text className="text-white font-semibold text-lg">
              {selectedCategory
                ? SHOP_CATEGORIES.find((c) => c.value === selectedCategory)?.label + ' Shops'
                : searchQuery
                  ? 'Search Results'
                  : 'All Shops'}
            </Text>
            <Text className="text-zinc-500 text-sm">{filteredShops.length} shops</Text>
          </View>

          {/* Shop list */}
          <View className="px-5">
            {filteredShops.length > 0 ? (
              filteredShops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  onPress={() => router.push(`/shop/${shop.id}`)}
                />
              ))
            ) : (
              <View className="items-center py-12">
                <View className="bg-zinc-800 p-4 rounded-full mb-4">
                  <Store size={32} color="#3f3f46" />
                </View>
                <Text className="text-zinc-500 text-base">No shops found</Text>
                <Text className="text-zinc-600 text-sm mt-1">
                  {searchQuery ? 'Try a different search' : 'Be the first to create a shop!'}
                </Text>
              </View>
            )}
          </View>

          <View className="h-24" />
        </ScrollView>
      </View>
    </>
  );
}
