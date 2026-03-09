import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Flame,
  TrendingUp,
  Star,
  ChevronRight,
  Sparkles,
  Clock,
  Shield,
  Zap,
} from 'lucide-react-native';
import { useMarketplaceStore, type Listing } from '@/lib/marketplace-store';
import { useRatingStore } from '@/lib/rating-store';
import { CrownIcon } from '@/components/CrownIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;

// Animated magma blob component
function MagmaBlob({
  size,
  initialX,
  initialY,
  delay,
  duration,
  color
}: {
  size: number;
  initialX: number;
  initialY: number;
  delay: number;
  duration: number;
  color: string;
}) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    // Vertical floating animation
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-80, { duration: duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Horizontal sway
    translateX.value = withDelay(
      delay + 200,
      withRepeat(
        withSequence(
          withTiming(30, { duration: duration * 0.8, easing: Easing.inOut(Easing.sin) }),
          withTiming(-30, { duration: duration * 0.8, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Scale pulsing
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: duration * 0.6, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.9, { duration: duration * 0.6, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Opacity breathing
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration * 0.5 }),
          withTiming(0.5, { duration: duration * 0.5 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: initialX,
          top: initialY,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[color, '#dc2626', '#7f1d1d']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: size / 3,
        }}
      />
    </Animated.View>
  );
}

// Magma stream/flow component
function MagmaStream({
  width,
  height,
  left,
  delay
}: {
  width: number;
  height: number;
  left: number;
  delay: number;
}) {
  const flowY = useSharedValue(-height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.7, { duration: 1000 }));

    flowY.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + height, {
          duration: 8000 + Math.random() * 4000,
          easing: Easing.linear
        }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: flowY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left,
          width,
          height,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={['transparent', '#f97316', '#ea580c', '#dc2626', '#991b1b', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: width / 2,
        }}
      />
    </Animated.View>
  );
}

// Splash screen with animated magma
function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const titleScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Title entrance
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    titleScale.value = withDelay(300, withSpring(1, { damping: 12 }));

    // Subtitle entrance
    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));

    // Continuous pulse
    pulseScale.value = withDelay(
      1200,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onEnter();
  };

  // Generate magma blobs
  const blobs = [
    { size: 120, x: -20, y: SCREEN_HEIGHT * 0.15, delay: 0, duration: 4000, color: '#f97316' },
    { size: 80, x: SCREEN_WIDTH * 0.7, y: SCREEN_HEIGHT * 0.1, delay: 500, duration: 3500, color: '#ea580c' },
    { size: 150, x: SCREEN_WIDTH * 0.3, y: SCREEN_HEIGHT * 0.65, delay: 200, duration: 4500, color: '#dc2626' },
    { size: 100, x: SCREEN_WIDTH * 0.8, y: SCREEN_HEIGHT * 0.55, delay: 800, duration: 3800, color: '#f97316' },
    { size: 60, x: SCREEN_WIDTH * 0.1, y: SCREEN_HEIGHT * 0.75, delay: 1000, duration: 3200, color: '#fb923c' },
    { size: 90, x: SCREEN_WIDTH * 0.5, y: SCREEN_HEIGHT * 0.85, delay: 300, duration: 4200, color: '#ea580c' },
    { size: 70, x: SCREEN_WIDTH * 0.9, y: SCREEN_HEIGHT * 0.35, delay: 600, duration: 3600, color: '#ef4444' },
    { size: 110, x: -30, y: SCREEN_HEIGHT * 0.5, delay: 400, duration: 4100, color: '#dc2626' },
  ];

  // Generate magma streams
  const streams = [
    { width: 40, height: 300, left: SCREEN_WIDTH * 0.1, delay: 0 },
    { width: 30, height: 250, left: SCREEN_WIDTH * 0.3, delay: 1500 },
    { width: 50, height: 350, left: SCREEN_WIDTH * 0.55, delay: 800 },
    { width: 35, height: 280, left: SCREEN_WIDTH * 0.8, delay: 2200 },
    { width: 25, height: 200, left: SCREEN_WIDTH * 0.2, delay: 3000 },
    { width: 45, height: 320, left: SCREEN_WIDTH * 0.7, delay: 1200 },
  ];

  return (
    <Pressable onPress={handlePress} style={{ flex: 1 }}>
      <View className="flex-1">
        {/* Deep dark background */}
        <LinearGradient
          colors={['#1c0a00', '#0a0000', '#000000', '#0a0000', '#1c0a00']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* Magma streams (flowing lava) */}
        {streams.map((stream, i) => (
          <MagmaStream
            key={`stream-${i}`}
            width={stream.width}
            height={stream.height}
            left={stream.left}
            delay={stream.delay}
          />
        ))}

        {/* Magma blobs */}
        {blobs.map((blob, i) => (
          <MagmaBlob
            key={`blob-${i}`}
            size={blob.size}
            initialX={blob.x}
            initialY={blob.y}
            delay={blob.delay}
            duration={blob.duration}
            color={blob.color}
          />
        ))}

        {/* Central glow */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: SCREEN_HEIGHT * 0.3,
              left: SCREEN_WIDTH * 0.1,
              right: SCREEN_WIDTH * 0.1,
              height: SCREEN_HEIGHT * 0.4,
              borderRadius: SCREEN_WIDTH,
            },
            glowStyle,
          ]}
        >
          <LinearGradient
            colors={['transparent', '#f9731620', '#dc262630', '#f9731620', 'transparent']}
            style={{
              flex: 1,
              borderRadius: SCREEN_WIDTH,
            }}
          />
        </Animated.View>

        {/* Content */}
        <SafeAreaView className="flex-1 items-center justify-center">
          <Animated.View style={[pulseStyle, { alignItems: 'center' }]}>
            {/* Logo/Icon area */}
            <Animated.View style={titleStyle}>
              <View className="mb-6">
                <LinearGradient
                  colors={['#f97316', '#ea580c', '#dc2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#f97316',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 30,
                  }}
                >
                  <Flame size={50} color="#ffffff" strokeWidth={2.5} />
                </LinearGradient>
              </View>
            </Animated.View>

            {/* Title - using cyan/white for contrast against orange magma */}
            <Animated.View style={titleStyle} className="items-center">
              <Text
                style={{
                  fontSize: 42,
                  fontWeight: '900',
                  color: '#ffffff',
                  textShadowColor: '#06b6d4',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 20,
                  letterSpacing: -1,
                }}
              >
                MAGMA
              </Text>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '700',
                  color: '#22d3ee',
                  textShadowColor: '#06b6d4',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 15,
                  letterSpacing: 6,
                  marginTop: -4,
                }}
              >
                MARKETPLACE
              </Text>
            </Animated.View>

            {/* Subtitle */}
            <Animated.View style={subtitleStyle} className="mt-6">
              <Text className="text-zinc-400 text-base text-center">
                Trade Collectibles Securely
              </Text>
            </Animated.View>

            {/* Tap prompt */}
            <Animated.View style={subtitleStyle} className="mt-12">
              <View className="bg-white/10 px-6 py-3 rounded-full border border-white/20">
                <Text className="text-white/80 text-sm font-medium">
                  Tap anywhere to enter
                </Text>
              </View>
            </Animated.View>
          </Animated.View>
        </SafeAreaView>

        {/* Bottom gradient fade */}
        <LinearGradient
          colors={['transparent', '#f9731610', '#dc262620', '#000000']}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 150,
          }}
        />
      </View>
    </Pressable>
  );
}

// Featured listing card with premium design
function FeaturedCard({ listing, index, onPress }: { listing: Listing; index: number; onPress: () => void }) {
  const scale = useSharedValue(1);
  const getUserSummary = useRatingStore((s) => s.getUserSummary);
  const sellerRating = getUserSummary(listing.sellerId);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).springify()}
      style={[{ width: CARD_WIDTH, marginRight: 16 }, animatedStyle]}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View className="bg-zinc-900 rounded-3xl overflow-hidden">
          {/* Image */}
          <View className="h-48 bg-zinc-800">
            {listing.imageUrl ? (
              <Image
                source={{ uri: listing.imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Sparkles size={40} color="#3f3f46" />
              </View>
            )}
            {/* Price badge */}
            <View className="absolute top-3 right-3">
              <BlurView intensity={80} tint="dark" className="rounded-xl overflow-hidden">
                <View className="px-3 py-[6px]">
                  <Text className="text-white font-bold text-sm">
                    {listing.price} AVAX
                  </Text>
                </View>
              </BlurView>
            </View>
            {/* Type badge */}
            <View className="absolute top-3 left-3 bg-orange-500 px-[10px] py-1 rounded-lg">
              <Text className="text-white text-xs font-bold uppercase">
                {listing.listingType}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View className="p-4">
            <Text className="text-white font-semibold text-base" numberOfLines={1}>
              {listing.title}
            </Text>
            <Text className="text-zinc-500 text-sm mt-1" numberOfLines={1}>
              {listing.category} • {listing.itemType}
            </Text>

            {/* Seller info */}
            <View className="flex-row items-center mt-3 pt-3 border-t border-zinc-800">
              <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center mr-2">
                <Text className="text-zinc-400 text-xs font-bold">
                  {listing.sellerUsername?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-zinc-300 text-sm font-medium">
                    {listing.sellerUsername}
                  </Text>
                  {sellerRating && (
                    <CrownIcon tier={sellerRating.crownTier} size="sm" />
                  )}
                </View>
                {sellerRating && sellerRating.totalRatings > 0 && (
                  <View className="flex-row items-center mt-[2px]">
                    <Star size={10} color="#f59e0b" fill="#f59e0b" />
                    <Text className="text-zinc-500 text-xs ml-1">
                      {sellerRating.averageRating.toFixed(1)} ({sellerRating.totalRatings})
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Compact listing card for grid/list
function ListingCard({ listing, index, onPress }: { listing: Listing; index: number; onPress: () => void }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        className="bg-zinc-900/80 rounded-2xl overflow-hidden mb-3 active:opacity-80"
      >
        <View className="flex-row">
          <View className="w-24 h-24 bg-zinc-800">
            {listing.imageUrl ? (
              <Image
                source={{ uri: listing.imageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Sparkles size={24} color="#3f3f46" />
              </View>
            )}
          </View>
          <View className="flex-1 p-3 justify-between">
            <View>
              <Text className="text-white font-medium text-sm" numberOfLines={1}>
                {listing.title}
              </Text>
              <Text className="text-zinc-500 text-xs mt-[2px]">
                {listing.category} • {listing.itemType}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-orange-400 font-bold text-sm">
                {listing.price} AVAX
              </Text>
              <View className="bg-zinc-800 px-2 py-[2px] rounded">
                <Text className="text-zinc-400 text-xs capitalize">{listing.listingType}</Text>
              </View>
            </View>
          </View>
          <View className="justify-center pr-3">
            <ChevronRight size={18} color="#52525b" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Stats card
function StatsCard({ title, value, icon: Icon, color, delay }: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      className="flex-1 bg-zinc-900/60 rounded-2xl p-4 mr-3 last:mr-0"
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-2"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={20} color={color} />
      </View>
      <Text className="text-white font-bold text-xl">{value}</Text>
      <Text className="text-zinc-500 text-xs mt-[2px]">{title}</Text>
    </Animated.View>
  );
}

// Quick action button
function QuickAction({ icon: Icon, label, color, onPress, delay }: {
  icon: React.ElementType;
  label: string;
  color: string;
  onPress: () => void;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        className="items-center mr-6 active:opacity-70"
      >
        <View
          className="w-14 h-14 rounded-2xl items-center justify-center mb-[6px]"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={24} color={color} />
        </View>
        <Text className="text-zinc-400 text-xs">{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

// Main content screen
function MainContent() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const listings = useMarketplaceStore((s) => s.listings);

  // Convert Record to array and get active listings
  const allListings = Object.values(listings);
  const activeListings = allListings.filter((l: Listing) => l.status === 'active');

  // Featured: most recent or highest priced
  const featuredListings = [...activeListings]
    .sort((a, b) => b.price - a.price)
    .slice(0, 5);

  // Recent listings
  const recentListings = [...activeListings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  // Stats
  const totalListings = activeListings.length;
  const totalVolume = activeListings.reduce((sum: number, l: Listing) => sum + l.price, 0);
  const avgPrice = totalListings > 0 ? totalVolume / totalListings : 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const navigateToMarket = () => {
    router.push('/(tabs)/marketplace');
  };

  return (
    <Animated.View entering={FadeIn.duration(500)} className="flex-1 bg-black">
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
            <View className="flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-orange-500/20 items-center justify-center mr-3">
                    <Flame size={22} color="#f97316" />
                  </View>
                  <View>
                    <Text className="text-white text-2xl font-bold tracking-tight">
                      Magma Market
                    </Text>
                    <Text className="text-zinc-500 text-sm">
                      Collectibles Marketplace
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <View className="px-5 mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              <QuickAction
                icon={TrendingUp}
                label="Browse"
                color="#f97316"
                onPress={navigateToMarket}
                delay={100}
              />
              <QuickAction
                icon={Zap}
                label="Sell"
                color="#22c55e"
                onPress={navigateToMarket}
                delay={150}
              />
              <QuickAction
                icon={Shield}
                label="Escrow"
                color="#3b82f6"
                onPress={navigateToMarket}
                delay={200}
              />
              <QuickAction
                icon={Clock}
                label="Auctions"
                color="#a855f7"
                onPress={navigateToMarket}
                delay={250}
              />
            </ScrollView>
          </View>

          {/* Stats Row */}
          <View className="px-5 mb-6">
            <View className="flex-row">
              <StatsCard
                title="Active Listings"
                value={totalListings.toString()}
                icon={Sparkles}
                color="#f97316"
                delay={100}
              />
              <StatsCard
                title="Total Volume"
                value={`${totalVolume.toFixed(1)}`}
                icon={TrendingUp}
                color="#22c55e"
                delay={150}
              />
              <StatsCard
                title="Avg Price"
                value={`${avgPrice.toFixed(2)}`}
                icon={Star}
                color="#eab308"
                delay={200}
              />
            </View>
          </View>

          {/* Featured Listings */}
          {featuredListings.length > 0 && (
            <View className="mb-6">
              <View className="px-5 flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="bg-orange-500/20 p-[6px] rounded-lg mr-2">
                    <Flame size={16} color="#f97316" />
                  </View>
                  <Text className="text-white font-semibold text-lg">Featured</Text>
                </View>
                <Pressable
                  onPress={navigateToMarket}
                  className="flex-row items-center active:opacity-70"
                >
                  <Text className="text-orange-400 text-sm mr-1">See All</Text>
                  <ChevronRight size={16} color="#fb923c" />
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                {featuredListings.map((listing, index) => (
                  <FeaturedCard
                    key={listing.id}
                    listing={listing}
                    index={index}
                    onPress={navigateToMarket}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Recent Listings */}
          <View className="px-5 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="bg-emerald-500/20 p-[6px] rounded-lg mr-2">
                  <Clock size={16} color="#10b981" />
                </View>
                <Text className="text-white font-semibold text-lg">Recent Listings</Text>
              </View>
              <Pressable
                onPress={navigateToMarket}
                className="flex-row items-center active:opacity-70"
              >
                <Text className="text-emerald-400 text-sm mr-1">View All</Text>
                <ChevronRight size={16} color="#34d399" />
              </Pressable>
            </View>

            {recentListings.length > 0 ? (
              recentListings.map((listing, index) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  index={index}
                  onPress={navigateToMarket}
                />
              ))
            ) : (
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                className="bg-zinc-900/50 rounded-2xl p-8 items-center"
              >
                <View className="bg-zinc-800/50 w-16 h-16 rounded-2xl items-center justify-center mb-4">
                  <Sparkles size={32} color="#52525b" />
                </View>
                <Text className="text-white font-semibold text-lg mb-1">
                  No Listings Yet
                </Text>
                <Text className="text-zinc-500 text-center text-sm mb-4">
                  Be the first to list something on Magma Market!
                </Text>
                <Pressable
                  onPress={navigateToMarket}
                  className="bg-orange-500 px-6 py-3 rounded-xl active:bg-orange-600"
                >
                  <Text className="text-white font-semibold">Create Listing</Text>
                </Pressable>
              </Animated.View>
            )}
          </View>

          {/* Trust badges */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="px-5 mb-8"
          >
            <View className="bg-zinc-900/40 rounded-2xl p-4">
              <View className="flex-row items-center justify-around">
                <View className="items-center">
                  <Shield size={20} color="#3b82f6" />
                  <Text className="text-zinc-400 text-xs mt-1">Escrow</Text>
                </View>
                <View className="w-px h-8 bg-zinc-800" />
                <View className="items-center">
                  <Star size={20} color="#eab308" />
                  <Text className="text-zinc-400 text-xs mt-1">Ratings</Text>
                </View>
                <View className="w-px h-8 bg-zinc-800" />
                <View className="items-center">
                  <Zap size={20} color="#22c55e" />
                  <Text className="text-zinc-400 text-xs mt-1">Fast</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <View className="h-24" />
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const [showSplash, setShowSplash] = useState(true);

  const handleEnter = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onEnter={handleEnter} />;
  }

  return <MainContent />;
}
