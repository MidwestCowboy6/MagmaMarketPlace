import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import {
  Users,
  Trophy,
  TrendingUp,
  Star,
  ChevronRight,
  Crown,
  ShoppingBag,
  Award,
  Sparkles,
} from 'lucide-react-native';
import { useMarketplaceStore, type Listing } from '@/lib/marketplace-store';
import { useRatingStore, type UserRatingSummary } from '@/lib/rating-store';
import { CrownIcon, StarRating } from '@/components/CrownIcon';

// Top seller card
function TopSellerCard({
  summary,
  rank,
  onPress
}: {
  summary: UserRatingSummary;
  rank: number;
  onPress: () => void;
}) {
  const getRankColor = (r: number) => {
    if (r === 1) return '#fbbf24';
    if (r === 2) return '#d1d5db';
    if (r === 3) return '#d97706';
    return '#71717a';
  };

  return (
    <Animated.View entering={FadeInRight.delay(rank * 100).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        className="bg-zinc-900/80 rounded-2xl p-4 mr-3 active:opacity-80"
        style={{ width: 160 }}
      >
        {/* Rank badge */}
        <View
          className="absolute top-2 left-2 w-6 h-6 rounded-full items-center justify-center"
          style={{ backgroundColor: getRankColor(rank) }}
        >
          <Text className="text-black text-xs font-bold">#{rank}</Text>
        </View>

        <View className="items-center pt-4">
          {/* Crown */}
          <CrownIcon tier={summary.crownTier} size="lg" showGlow={true} />

          {/* Username placeholder */}
          <Text className="text-white font-semibold text-sm mt-2" numberOfLines={1}>
            Top Seller
          </Text>

          {/* Rating */}
          <View className="flex-row items-center mt-1">
            <Star size={12} color="#fbbf24" fill="#fbbf24" />
            <Text className="text-amber-400 text-xs font-bold ml-1">
              {summary.averageRating.toFixed(1)}
            </Text>
            <Text className="text-zinc-500 text-xs ml-1">
              ({summary.totalRatings})
            </Text>
          </View>

          {/* Stats */}
          <View className="flex-row items-center mt-2 gap-2">
            {summary.isTopSeller && (
              <View className="bg-amber-500/20 px-2 py-[2px] rounded">
                <Text className="text-amber-400 text-[10px] font-bold">TOP</Text>
              </View>
            )}
            {summary.isVerified && (
              <View className="bg-blue-500/20 px-2 py-[2px] rounded">
                <Text className="text-blue-400 text-[10px] font-bold">VERIFIED</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Recent sale card
function RecentSaleCard({
  listing,
  index,
  onPress
}: {
  listing: Listing;
  index: number;
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        className="bg-zinc-900/60 rounded-xl p-3 mb-2 active:opacity-80"
      >
        <View className="flex-row items-center">
          {/* Image */}
          <View className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden mr-3">
            {listing.imageUrl ? (
              <Image
                source={{ uri: listing.imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <ShoppingBag size={20} color="#52525b" />
              </View>
            )}
          </View>

          {/* Info */}
          <View className="flex-1">
            <Text className="text-white text-sm font-medium" numberOfLines={1}>
              {listing.title}
            </Text>
            <View className="flex-row items-center mt-[2px]">
              <Text className="text-zinc-500 text-xs">Sold to </Text>
              <Text className="text-zinc-400 text-xs font-medium">
                {listing.buyerUsername || 'Buyer'}
              </Text>
            </View>
          </View>

          {/* Price */}
          <View className="items-end">
            <Text className="text-emerald-400 font-bold text-sm">
              {listing.finalPrice?.toFixed(2) || listing.price.toFixed(2)} AVAX
            </Text>
            <Text className="text-zinc-600 text-xs">
              {listing.soldAt ? new Date(listing.soldAt).toLocaleDateString() : 'Recently'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Stats overview card
function CommunityStatsCard({
  totalSellers,
  totalSales,
  totalVolume
}: {
  totalSellers: number;
  totalSales: number;
  totalVolume: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(100).springify()}
      className="bg-zinc-900/60 rounded-2xl p-4 mb-6"
    >
      <View className="flex-row items-center mb-3">
        <TrendingUp size={18} color="#f97316" />
        <Text className="text-white font-semibold ml-2">Community Stats</Text>
      </View>
      <View className="flex-row justify-between">
        <View className="items-center flex-1">
          <Text className="text-orange-400 text-xl font-bold">{totalSellers}</Text>
          <Text className="text-zinc-500 text-xs">Sellers</Text>
        </View>
        <View className="w-px h-10 bg-zinc-800" />
        <View className="items-center flex-1">
          <Text className="text-emerald-400 text-xl font-bold">{totalSales}</Text>
          <Text className="text-zinc-500 text-xs">Total Sales</Text>
        </View>
        <View className="w-px h-10 bg-zinc-800" />
        <View className="items-center flex-1">
          <Text className="text-amber-400 text-xl font-bold">
            {totalVolume.toFixed(1)}
          </Text>
          <Text className="text-zinc-500 text-xs">Volume (AVAX)</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function CommunityScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const listings = useMarketplaceStore((s) => s.listings);
  const totalVolume = useMarketplaceStore((s) => s.totalVolume);
  const totalSales = useMarketplaceStore((s) => s.totalSales);
  const userSummaries = useRatingStore((s) => s.userSummaries);

  // Convert listings to array
  const allListings = useMemo(() => Object.values(listings), [listings]);

  // Get sold listings
  const soldListings = useMemo(() =>
    allListings
      .filter((l: Listing) => l.status === 'sold' || l.status === 'delivered')
      .sort((a, b) => {
        const dateA = a.soldAt ? new Date(a.soldAt).getTime() : 0;
        const dateB = b.soldAt ? new Date(b.soldAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10),
    [allListings]
  );

  // Get top sellers (sorted by rating)
  const topSellers = useMemo(() =>
    Object.values(userSummaries)
      .filter((s: UserRatingSummary) => s.totalRatings > 0)
      .sort((a, b) => {
        // Sort by average rating, then by total ratings
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return b.totalRatings - a.totalRatings;
      })
      .slice(0, 10),
    [userSummaries]
  );

  const totalSellers = Object.keys(userSummaries).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const navigateToMarket = () => {
    router.push('/(tabs)/marketplace');
  };

  const navigateToUser = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1c1917', '#0c0a09', '#000000']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f97316"
            />
          }
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(0).springify()}
            className="px-5 pt-2 pb-4"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-orange-500/20 items-center justify-center mr-3">
                <Users size={22} color="#f97316" />
              </View>
              <View>
                <Text className="text-white text-2xl font-bold tracking-tight">
                  Community
                </Text>
                <Text className="text-zinc-500 text-sm">
                  Top sellers & recent activity
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Content */}
          <View className="px-5">
            {/* Community Stats */}
            <CommunityStatsCard
              totalSellers={totalSellers}
              totalSales={totalSales}
              totalVolume={totalVolume}
            />

            {/* Top Sellers */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="bg-amber-500/20 p-[6px] rounded-lg mr-2">
                    <Trophy size={16} color="#f59e0b" />
                  </View>
                  <Text className="text-white font-semibold text-lg">Top Sellers</Text>
                </View>
              </View>

              {topSellers.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 20 }}
                  style={{ marginHorizontal: -20, paddingLeft: 20 }}
                >
                  {topSellers.map((seller, index) => (
                    <TopSellerCard
                      key={seller.userId}
                      summary={seller}
                      rank={index + 1}
                      onPress={() => navigateToUser(seller.userId)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <Animated.View
                  entering={FadeInDown.delay(200).springify()}
                  className="bg-zinc-900/50 rounded-2xl p-6 items-center"
                >
                  <View className="bg-zinc-800/50 w-14 h-14 rounded-2xl items-center justify-center mb-3">
                    <Award size={28} color="#52525b" />
                  </View>
                  <Text className="text-white font-medium text-base mb-1">
                    No Top Sellers Yet
                  </Text>
                  <Text className="text-zinc-500 text-center text-sm">
                    Complete transactions to build your reputation!
                  </Text>
                </Animated.View>
              )}
            </View>

            {/* Recent Sales */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="bg-emerald-500/20 p-[6px] rounded-lg mr-2">
                    <ShoppingBag size={16} color="#10b981" />
                  </View>
                  <Text className="text-white font-semibold text-lg">Recent Sales</Text>
                </View>
                <Pressable
                  onPress={navigateToMarket}
                  className="flex-row items-center active:opacity-70"
                >
                  <Text className="text-emerald-400 text-sm mr-1">View Market</Text>
                  <ChevronRight size={16} color="#34d399" />
                </Pressable>
              </View>

              {soldListings.length > 0 ? (
                soldListings.map((listing, index) => (
                  <RecentSaleCard
                    key={listing.id}
                    listing={listing}
                    index={index}
                    onPress={navigateToMarket}
                  />
                ))
              ) : (
                <Animated.View
                  entering={FadeInDown.delay(200).springify()}
                  className="bg-zinc-900/50 rounded-2xl p-6 items-center"
                >
                  <View className="bg-zinc-800/50 w-14 h-14 rounded-2xl items-center justify-center mb-3">
                    <Sparkles size={28} color="#52525b" />
                  </View>
                  <Text className="text-white font-medium text-base mb-1">
                    No Sales Yet
                  </Text>
                  <Text className="text-zinc-500 text-center text-sm mb-4">
                    Be the first to make a purchase on Magma Market!
                  </Text>
                  <Pressable
                    onPress={navigateToMarket}
                    className="bg-orange-500 px-5 py-[10px] rounded-xl active:bg-orange-600"
                  >
                    <Text className="text-white font-semibold">Browse Market</Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>

            {/* Crown Tiers Info */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              className="bg-zinc-900/40 rounded-2xl p-4 mb-8"
            >
              <View className="flex-row items-center mb-3">
                <Crown size={16} color="#f59e0b" />
                <Text className="text-white font-semibold ml-2">Seller Tiers</Text>
              </View>
              <Text className="text-zinc-400 text-sm mb-3">
                Earn your crown through great transactions and reviews!
              </Text>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <CrownIcon tier="coal" size="sm" animate={false} showGlow={false} />
                  <Text className="text-zinc-500 text-xs mt-1">Coal</Text>
                </View>
                <View className="items-center">
                  <CrownIcon tier="bronze" size="sm" animate={false} showGlow={false} />
                  <Text className="text-zinc-500 text-xs mt-1">Bronze</Text>
                </View>
                <View className="items-center">
                  <CrownIcon tier="silver" size="sm" animate={false} showGlow={false} />
                  <Text className="text-zinc-500 text-xs mt-1">Silver</Text>
                </View>
                <View className="items-center">
                  <CrownIcon tier="gold" size="sm" animate={false} showGlow={false} />
                  <Text className="text-zinc-500 text-xs mt-1">Gold</Text>
                </View>
                <View className="items-center">
                  <CrownIcon tier="platinum" size="sm" animate={false} showGlow={false} />
                  <Text className="text-zinc-500 text-xs mt-1">Platinum</Text>
                </View>
                <View className="items-center">
                  <CrownIcon tier="sapphire" size="sm" animate={false} showGlow={false} />
                  <Text className="text-zinc-500 text-xs mt-1">Sapphire</Text>
                </View>
              </View>
            </Animated.View>
          </View>

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
