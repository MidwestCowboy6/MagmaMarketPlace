import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  ShoppingBag,
  TrendingUp,
  Star,
  Shield,
  BadgeCheck,
  MessageSquare,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Truck,
  Clock,
  CheckCircle,
  Package,
  User,
} from 'lucide-react-native';
import { useAuthStore, isMasterAccount } from '@/lib/auth-store';
import { useMarketplaceStore } from '@/lib/marketplace-store';
import {
  useRatingStore,
  CROWN_NAMES,
  TIER_REQUIREMENTS,
  type TransactionRating,
} from '@/lib/rating-store';
import { CrownIcon, StarRating, SellerBadge } from '@/components/CrownIcon';
import { useMessagingStore } from '@/lib/messaging-store';

// Review card component
function ReviewCard({ review }: { review: TransactionRating }) {
  const sentimentConfig = {
    positive: { icon: ThumbsUp, color: '#10b981', bg: 'bg-emerald-500/10' },
    negative: { icon: ThumbsDown, color: '#ef4444', bg: 'bg-red-500/10' },
    neutral: { icon: Minus, color: '#f59e0b', bg: 'bg-amber-500/10' },
  };

  const config = sentimentConfig[review.sentiment];
  const SentimentIcon = config.icon;

  return (
    <View className="bg-zinc-900 rounded-xl p-4 mb-3">
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="bg-zinc-800 w-10 h-10 rounded-full items-center justify-center">
            <User size={20} color="#71717a" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-white font-medium">{review.raterUsername}</Text>
            <Text className="text-zinc-500 text-xs">
              {new Date(review.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View className={`flex-row items-center px-2 py-1 rounded-lg ${config.bg}`}>
          <SentimentIcon size={14} color={config.color} />
          <Text className="ml-1 text-xs font-medium" style={{ color: config.color }}>
            {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
          </Text>
        </View>
      </View>

      {/* Star rating */}
      <View className="mb-3">
        <StarRating rating={review.overallRating} size="md" showNumber />
      </View>

      {/* Comment */}
      <Text className="text-zinc-300 text-sm leading-5 mb-3">{review.comment}</Text>

      {/* Category breakdown */}
      <View className="bg-zinc-800/50 rounded-lg p-3">
        <Text className="text-zinc-500 text-xs mb-2">Rating Breakdown</Text>
        <View className="flex-row flex-wrap gap-y-1">
          <CategoryChip icon={Truck} label="Delivery" value={review.categories.delivery} />
          <CategoryChip icon={Clock} label="Timeliness" value={review.categories.timeliness} />
          <CategoryChip icon={MessageSquare} label="Communication" value={review.categories.communication} />
          <CategoryChip icon={CheckCircle} label="Accuracy" value={review.categories.accuracy} />
          {review.itemType === 'physical' && (
            <CategoryChip icon={Package} label="Packaging" value={review.categories.packaging} />
          )}
        </View>
      </View>

      {/* Seller response */}
      {review.response && (
        <View className="mt-3 bg-violet-500/10 border-l-2 border-violet-500 pl-3 py-2">
          <Text className="text-violet-400 text-xs font-medium mb-1">Seller Response</Text>
          <Text className="text-zinc-300 text-sm">{review.response}</Text>
        </View>
      )}
    </View>
  );
}

function CategoryChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <View className="flex-row items-center mr-3">
      <Icon size={12} color="#71717a" />
      <Text className="text-zinc-400 text-xs ml-1">{label}</Text>
      <Text className="text-amber-400 text-xs ml-1 font-medium">{value}</Text>
    </View>
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

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [refreshing, setRefreshing] = useState(false);

  const currentUser = useAuthStore((s) => s.user);
  const users = useAuthStore((s) => s.users);
  const listings = useMarketplaceStore((s) => s.listings);
  const userSummaries = useRatingStore((s) => s.userSummaries);
  const ratings = useRatingStore((s) => s.ratings);
  const getOrCreateConversation = useMessagingStore((s) => s.getOrCreateConversation);

  const handleMessage = () => {
    if (!currentUser || !userId) return;
    const otherUser = users[userId]?.profile;
    if (!otherUser) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const conversationId = getOrCreateConversation(
      currentUser.id,
      currentUser.username,
      currentUser.displayName,
      currentUser.avatarUrl,
      otherUser.id,
      otherUser.username,
      otherUser.displayName,
      otherUser.avatarUrl
    );
    router.push(`/chat/${conversationId}`);
  };

  // Get the user being viewed
  const viewedUser = userId ? users[userId]?.profile : null;
  const isOwnProfile = currentUser?.id === userId;
  const isViewingMaster = userId === 'N263Jm6mbFiYbvQ3KIRgXq66xXYRiLTx';
  const isCurrentUserMaster = isMasterAccount(currentUser);

  // Get user data with memoization
  const userListings = React.useMemo(() => {
    if (!userId) return [];
    return Object.values(listings).filter((l) => l.sellerId === userId);
  }, [userId, listings]);

  const userRatings = React.useMemo(() => {
    if (!userId) return [];
    return Object.values(ratings)
      .filter(r => r.ratedUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [userId, ratings]);

  const userSummary = React.useMemo(() => {
    if (!userId) return null;
    const isPlatformOwner = userId === 'N263Jm6mbFiYbvQ3KIRgXq66xXYRiLTx';
    const stored = userSummaries[userId];
    if (stored) {
      return { ...stored, isPlatformOwner };
    }
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

  const activeListings = userListings.filter((l) => l.status === 'active');
  const soldListings = userListings.filter((l) => l.status === 'sold' || l.status === 'delivered');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (!viewedUser) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">User not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: viewedUser.displayName,
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
          {/* Profile Header */}
          <View className="px-5 pt-4 pb-6">
            <View className="items-center">
              {/* Avatar with crown */}
              <View className="relative mb-3">
                <Image
                  source={{ uri: viewedUser.avatarUrl || 'https://via.placeholder.com/100' }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
                {userSummary && (
                  <View className="absolute -top-2 -right-2">
                    <CrownIcon
                      tier={userSummary.crownTier}
                      size="lg"
                      showGlow
                      animate
                    />
                  </View>
                )}
              </View>

              {/* Name and username */}
              <Text className="text-white text-2xl font-bold">{viewedUser.displayName}</Text>
              <Text className="text-violet-400 text-sm">{`@${viewedUser.username}`}</Text>

              {/* Crown tier badge */}
              {userSummary && (
                <View className="mt-3 items-center">
                  <Text className="text-zinc-400 text-sm">
                    {CROWN_NAMES[userSummary.crownTier]}
                  </Text>
                  <Text className="text-zinc-500 text-xs">
                    {TIER_REQUIREMENTS[userSummary.crownTier].description}
                  </Text>
                </View>
              )}

              {/* Badges */}
              <View className="flex-row mt-3 gap-2">
                {userSummary?.isPlatformOwner && (
                  <View className="bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full flex-row items-center">
                    <Shield size={12} color="#3b82f6" />
                    <Text className="text-blue-400 text-xs font-medium ml-1">Platform Owner</Text>
                  </View>
                )}
                {userSummary?.isTopSeller && (
                  <View className="bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full flex-row items-center">
                    <Star size={12} color="#f59e0b" />
                    <Text className="text-amber-400 text-xs font-medium ml-1">Top Seller</Text>
                  </View>
                )}
                {userSummary?.isVerified && (
                  <View className="bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex-row items-center">
                    <BadgeCheck size={12} color="#10b981" />
                    <Text className="text-emerald-400 text-xs font-medium ml-1">Verified</Text>
                  </View>
                )}
              </View>

              {/* Message Button (show if viewing someone else's profile and logged in) */}
              {currentUser && !isOwnProfile && (
                <Pressable
                  onPress={handleMessage}
                  className="mt-4 flex-row items-center justify-center bg-orange-500 rounded-2xl px-6 py-3 gap-2"
                >
                  <MessageCircle size={18} color="#fff" />
                  <Text className="text-white font-semibold text-sm">Message</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Rating Summary */}
          {userSummary && userSummary.totalRatings > 0 && (
            <View className="mx-5 mb-6">
              <LinearGradient
                colors={['#27272a', '#1f1f23']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white font-semibold">Seller Rating</Text>
                  <View className="flex-row items-center">
                    <StarRating
                      rating={userSummary.averageRating}
                      size="lg"
                      showNumber
                      showCount
                      count={userSummary.totalRatings}
                    />
                  </View>
                </View>

                {/* Category averages */}
                <StatBar label="Delivery" value={userSummary.avgDelivery} color="#10b981" />
                <StatBar label="Timeliness" value={userSummary.avgTimeliness} color="#3b82f6" />
                <StatBar label="Communication" value={userSummary.avgCommunication} color="#8b5cf6" />
                <StatBar label="Accuracy" value={userSummary.avgAccuracy} color="#f59e0b" />
                {userSummary.avgPackaging > 0 && (
                  <StatBar label="Packaging" value={userSummary.avgPackaging} color="#ec4899" />
                )}

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

          {/* Stats */}
          <View className="flex-row px-5 gap-3 mb-6">
            <View className="flex-1 bg-zinc-900 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <ShoppingBag size={16} color="#10b981" />
                <Text className="text-zinc-400 text-xs ml-[6px]">Active</Text>
              </View>
              <Text className="text-white font-bold text-xl">{activeListings.length}</Text>
            </View>
            <View className="flex-1 bg-zinc-900 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <TrendingUp size={16} color="#3b82f6" />
                <Text className="text-zinc-400 text-xs ml-[6px]">Sold</Text>
              </View>
              <Text className="text-white font-bold text-xl">{soldListings.length}</Text>
            </View>
            <View className="flex-1 bg-zinc-900 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Star size={16} color="#f59e0b" />
                <Text className="text-zinc-400 text-xs ml-[6px]">Reviews</Text>
              </View>
              <Text className="text-white font-bold text-xl">{userRatings.length}</Text>
            </View>
          </View>

          {/* Reviews */}
          <View className="px-5 mb-6">
            <Text className="text-white font-semibold text-lg mb-4">Reviews</Text>
            {userRatings.length > 0 ? (
              userRatings.slice(0, 10).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <View className="bg-zinc-900 rounded-xl p-6 items-center">
                <MessageSquare size={32} color="#3f3f46" />
                <Text className="text-zinc-500 mt-2">No reviews yet</Text>
              </View>
            )}
          </View>

          <View className="h-24" />
        </ScrollView>
      </View>
    </>
  );
}
