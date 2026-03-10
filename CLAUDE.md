import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  type CrownTier,
  CROWN_COLORS,
  CROWN_NAMES,
  TIER_REQUIREMENTS,
} from '@/lib/rating-store';

interface CrownIconProps {
  tier: CrownTier;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showGlow?: boolean;
  animate?: boolean;
}

const SIZES = {
  sm: { icon: 16, container: 24, fontSize: 'text-xs' },
  md: { icon: 20, container: 32, fontSize: 'text-sm' },
  lg: { icon: 28, container: 44, fontSize: 'text-base' },
  xl: { icon: 36, container: 56, fontSize: 'text-lg' },
};

export function CrownIcon({
  tier,
  size = 'md',
  showLabel = false,
  showGlow = true,
  animate = true,
}: CrownIconProps) {
  const colors = CROWN_COLORS[tier];
  const sizeConfig = SIZES[size];
  const glowOpacity = useSharedValue(0.3);
  const rotation = useSharedValue(0);

  const shouldAnimate = animate && (tier === 'platinum' || tier === 'sapphire' || tier === 'gold');
  const shouldRotate = animate && tier === 'sapphire';

  useEffect(() => {
    if (shouldAnimate) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      );
    }

    return () => {
      cancelAnimation(glowOpacity);
    };
  }, [shouldAnimate]);

  useEffect(() => {
    if (shouldRotate) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 2000 }),
          withTiming(-5, { duration: 2000 }),
          withTiming(0, { duration: 2000 })
        ),
        -1,
        false
      );
    }

    return () => {
      cancelAnimation(rotation);
    };
  }, [shouldRotate]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Render different crown styles based on tier
  const renderCrown = () => {
    switch (tier) {
      case 'sapphire':
        // Crystal sapphire crown with special effects
        return (
          <Animated.View style={rotationStyle}>
            <View
              style={{
                width: sizeConfig.container,
                height: sizeConfig.container,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showGlow && (
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: sizeConfig.container * 1.5,
                      height: sizeConfig.container * 1.5,
                      borderRadius: sizeConfig.container,
                      backgroundColor: colors.glow,
                    },
                    glowStyle,
                  ]}
                />
              )}
              <LinearGradient
                colors={['#1e40af', '#3b82f6', '#60a5fa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: sizeConfig.container,
                  height: sizeConfig.container,
                  borderRadius: sizeConfig.container / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#93c5fd',
                }}
              >
                <Crown size={sizeConfig.icon} color="#ffffff" strokeWidth={2.5} />
              </LinearGradient>
              {/* Crystal sparkles */}
              <View
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#ffffff',
                }}
              />
            </View>
          </Animated.View>
        );

      case 'platinum':
        // Shiny platinum crown
        return (
          <View
            style={{
              width: sizeConfig.container,
              height: sizeConfig.container,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showGlow && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: sizeConfig.container * 1.4,
                    height: sizeConfig.container * 1.4,
                    borderRadius: sizeConfig.container,
                    backgroundColor: colors.glow,
                  },
                  glowStyle,
                ]}
              />
            )}
            <LinearGradient
              colors={['#f5f5f5', '#e5e5e5', '#d4d4d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: sizeConfig.container,
                height: sizeConfig.container,
                borderRadius: sizeConfig.container / 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#ffffff',
              }}
            >
              <Crown size={sizeConfig.icon} color="#525252" strokeWidth={2.5} />
            </LinearGradient>
          </View>
        );

      case 'gold':
        // Rich gold crown
        return (
          <View
            style={{
              width: sizeConfig.container,
              height: sizeConfig.container,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showGlow && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: sizeConfig.container * 1.3,
                    height: sizeConfig.container * 1.3,
                    borderRadius: sizeConfig.container,
                    backgroundColor: colors.glow,
                  },
                  glowStyle,
                ]}
              />
            )}
            <LinearGradient
              colors={['#fbbf24', '#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: sizeConfig.container,
                height: sizeConfig.container,
                borderRadius: sizeConfig.container / 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#fde047',
              }}
            >
              <Crown size={sizeConfig.icon} color="#78350f" strokeWidth={2.5} />
            </LinearGradient>
          </View>
        );

      case 'silver':
        // Silver crown
        return (
          <View
            style={{
              width: sizeConfig.container,
              height: sizeConfig.container,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LinearGradient
              colors={['#d1d5db', '#9ca3af', '#6b7280']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: sizeConfig.container,
                height: sizeConfig.container,
                borderRadius: sizeConfig.container / 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            >
              <Crown size={sizeConfig.icon} color="#374151" strokeWidth={2} />
            </LinearGradient>
          </View>
        );

      case 'bronze':
        // Bronze crown
        return (
          <View
            style={{
              width: sizeConfig.container,
              height: sizeConfig.container,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LinearGradient
              colors={['#d97706', '#b45309', '#92400e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: sizeConfig.container,
                height: sizeConfig.container,
                borderRadius: sizeConfig.container / 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#fbbf24',
              }}
            >
              <Crown size={sizeConfig.icon} color="#451a03" strokeWidth={2} />
            </LinearGradient>
          </View>
        );

      case 'coal':
      default:
        // Coal crown (dull, no effects)
        return (
          <View
            style={{
              width: sizeConfig.container,
              height: sizeConfig.container,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#27272a',
              borderRadius: sizeConfig.container / 2,
              borderWidth: 1,
              borderColor: '#3f3f46',
            }}
          >
            <Crown size={sizeConfig.icon} color="#52525b" strokeWidth={2} />
          </View>
        );
    }
  };

  if (showLabel) {
    return (
      <View style={{ alignItems: 'center' }}>
        {renderCrown()}
        <Text
          className={`mt-1 font-medium ${sizeConfig.fontSize}`}
          style={{ color: colors.primary }}
        >
          {CROWN_NAMES[tier]}
        </Text>
        <Text className="text-zinc-500 text-xs">
          {TIER_REQUIREMENTS[tier].description}
        </Text>
      </View>
    );
  }

  return renderCrown();
}

// Star rating display
interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  showCount?: boolean;
  count?: number;
}

export function StarRating({
  rating,
  size = 'md',
  showNumber = true,
  showCount = false,
  count = 0,
}: StarRatingProps) {
  const starSizes = { sm: 12, md: 16, lg: 20 };
  const starSize = starSizes[size];

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View className="flex-row items-center">
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <View key={`full-${i}`} style={{ marginRight: 2 }}>
          <Text style={{ fontSize: starSize, color: '#fbbf24' }}>★</Text>
        </View>
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <View style={{ marginRight: 2, position: 'relative' }}>
          <Text style={{ fontSize: starSize, color: '#3f3f46' }}>★</Text>
          <View
            style={{
              position: 'absolute',
              overflow: 'hidden',
              width: starSize / 2,
            }}
          >
            <Text style={{ fontSize: starSize, color: '#fbbf24' }}>★</Text>
          </View>
        </View>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <View key={`empty-${i}`} style={{ marginRight: 2 }}>
          <Text style={{ fontSize: starSize, color: '#3f3f46' }}>★</Text>
        </View>
      ))}

      {/* Rating number */}
      {showNumber && (
        <Text
          className={`ml-1 font-semibold text-white ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          }`}
        >
          {rating.toFixed(1)}
        </Text>
      )}

      {/* Review count */}
      {showCount && (
        <Text className="ml-1 text-zinc-500 text-xs">
          {`(${count})`}
        </Text>
      )}
    </View>
  );
}

// Compact seller badge showing crown + rating
interface SellerBadgeProps {
  tier: CrownTier;
  rating: number;
  reviewCount: number;
  isVerified?: boolean;
  isTopSeller?: boolean;
  compact?: boolean;
}

export function SellerBadge({
  tier,
  rating,
  reviewCount,
  isVerified = false,
  isTopSeller = false,
  compact = false,
}: SellerBadgeProps) {
  if (compact) {
    return (
      <View className="flex-row items-center">
        <CrownIcon tier={tier} size="sm" showGlow={false} animate={false} />
        {reviewCount > 0 && (
          <Text className="text-amber-400 text-xs font-medium ml-1">
            {rating.toFixed(1)}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className="flex-row items-center bg-zinc-900 rounded-lg px-2 py-1">
      <CrownIcon tier={tier} size="sm" showGlow={false} animate={false} />
      <View className="ml-2">
        <View className="flex-row items-center">
          <StarRating rating={rating} size="sm" showNumber={false} />
          <Text className="text-white text-xs font-medium ml-1">
            {rating > 0 ? rating.toFixed(1) : 'New'}
          </Text>
        </View>
        {reviewCount > 0 && (
          <Text className="text-zinc-500 text-xs">
            {`${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`}
          </Text>
        )}
      </View>
      {(isVerified || isTopSeller) && (
        <View className="ml-2 flex-row">
          {isTopSeller && (
            <View className="bg-amber-500/20 px-[6px] py-[2px] rounded">
              <Text className="text-amber-400 text-xs font-bold">TOP</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
