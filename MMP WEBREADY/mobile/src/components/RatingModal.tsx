import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  Star,
  Truck,
  Clock,
  MessageSquare,
  CheckCircle,
  Package,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from 'lucide-react-native';
import {
  useRatingStore,
  type RatingCategories,
} from '@/lib/rating-store';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  transactionId: string;
  listingId: string;
  ratedUserId: string;
  ratedUsername: string;
  raterId: string;
  raterUsername: string;
  ratingType: 'buyer_to_seller' | 'seller_to_buyer';
  itemType: 'physical' | 'digital' | 'nft';
  itemTitle: string;
}

// Star input component
function StarInput({
  value,
  onChange,
  label,
  icon: Icon,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Icon size={16} color="#71717a" />
        <Text className="text-zinc-400 text-sm ml-2">{label}</Text>
      </View>
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => {
              onChange(star);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="pr-2"
          >
            <Text
              style={{
                fontSize: 28,
                color: star <= value ? '#fbbf24' : '#3f3f46',
              }}
            >
              ★
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// Sentiment selector
function SentimentSelector({
  value,
  onChange,
}: {
  value: 'positive' | 'negative' | 'neutral';
  onChange: (value: 'positive' | 'negative' | 'neutral') => void;
}) {
  const sentiments: { value: 'positive' | 'negative' | 'neutral'; icon: React.ElementType; label: string; color: string; bgColor: string }[] = [
    { value: 'positive', icon: ThumbsUp, label: 'Positive', color: '#10b981', bgColor: 'bg-emerald-500/20' },
    { value: 'neutral', icon: Minus, label: 'Neutral', color: '#f59e0b', bgColor: 'bg-amber-500/20' },
    { value: 'negative', icon: ThumbsDown, label: 'Negative', color: '#ef4444', bgColor: 'bg-red-500/20' },
  ];

  return (
    <View className="mb-4">
      <Text className="text-zinc-400 text-sm mb-3">Overall Experience</Text>
      <View className="flex-row gap-3">
        {sentiments.map((s) => (
          <Pressable
            key={s.value}
            onPress={() => {
              onChange(s.value);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            className={`flex-1 py-3 rounded-xl items-center ${
              value === s.value ? s.bgColor : 'bg-zinc-900'
            }`}
            style={{
              borderWidth: value === s.value ? 2 : 1,
              borderColor: value === s.value ? s.color : '#3f3f46',
            }}
          >
            <s.icon size={24} color={value === s.value ? s.color : '#71717a'} />
            <Text
              className="mt-1 text-sm font-medium"
              style={{ color: value === s.value ? s.color : '#71717a' }}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function RatingModal({
  visible,
  onClose,
  transactionId,
  listingId,
  ratedUserId,
  ratedUsername,
  raterId,
  raterUsername,
  ratingType,
  itemType,
  itemTitle,
}: RatingModalProps) {
  const submitRating = useRatingStore((s) => s.submitRating);

  const [categories, setCategories] = useState<RatingCategories>({
    delivery: 5,
    timeliness: 5,
    communication: 5,
    accuracy: 5,
    packaging: 5,
  });
  const [sentiment, setSentiment] = useState<'positive' | 'negative' | 'neutral'>('positive');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!comment.trim()) {
      setError('Please add a comment about your experience');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Comment must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = submitRating({
      transactionId,
      listingId,
      raterId,
      raterUsername,
      ratedUserId,
      ratedUsername,
      ratingType,
      categories,
      sentiment,
      comment: comment.trim(),
      itemType,
    });

    setIsSubmitting(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
      // Reset form
      setCategories({
        delivery: 5,
        timeliness: 5,
        communication: 5,
        accuracy: 5,
        packaging: 5,
      });
      setSentiment('positive');
      setComment('');
    } else {
      setError(result.error || 'Failed to submit rating');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const updateCategory = (key: keyof RatingCategories, value: number) => {
    setCategories((prev) => ({ ...prev, [key]: value }));
  };

  const isRatingSeller = ratingType === 'buyer_to_seller';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
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
          <Text className="text-white font-bold text-lg">
            {isRatingSeller ? 'Rate Seller' : 'Rate Buyer'}
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Item info */}
          <View className="bg-zinc-900 rounded-xl p-4 mb-6">
            <Text className="text-zinc-400 text-sm mb-1">
              {isRatingSeller ? 'Rating seller for' : 'Rating buyer for'}
            </Text>
            <Text className="text-white font-semibold text-lg" numberOfLines={2}>
              {itemTitle}
            </Text>
            <Text className="text-violet-400 text-sm mt-1">
              {`@${ratedUsername}`}
            </Text>
          </View>

          {/* Sentiment */}
          <SentimentSelector value={sentiment} onChange={setSentiment} />

          {/* Rating categories */}
          <View className="bg-zinc-900/50 rounded-xl p-4 mb-4">
            <Text className="text-white font-semibold mb-4">Rate by Category</Text>

            <StarInput
              value={categories.delivery}
              onChange={(v) => updateCategory('delivery', v)}
              label="Delivery Effectiveness"
              icon={Truck}
            />

            <StarInput
              value={categories.timeliness}
              onChange={(v) => updateCategory('timeliness', v)}
              label="Timeliness"
              icon={Clock}
            />

            <StarInput
              value={categories.communication}
              onChange={(v) => updateCategory('communication', v)}
              label="Communication"
              icon={MessageSquare}
            />

            <StarInput
              value={categories.accuracy}
              onChange={(v) => updateCategory('accuracy', v)}
              label="Item as Described"
              icon={CheckCircle}
            />

            {itemType === 'physical' && (
              <StarInput
                value={categories.packaging}
                onChange={(v) => updateCategory('packaging', v)}
                label="Packaging Quality"
                icon={Package}
              />
            )}
          </View>

          {/* Comment */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-sm mb-2">Your Review *</Text>
            <TextInput
              value={comment}
              onChangeText={(text) => {
                setComment(text);
                setError('');
              }}
              placeholder="Share your experience with this transaction..."
              placeholderTextColor="#71717a"
              className="bg-zinc-900 rounded-xl px-4 py-3 text-white min-h-[100px]"
              multiline
              textAlignVertical="top"
            />
            <Text className="text-zinc-500 text-xs mt-1">
              {`${comment.length}/500 characters`}
            </Text>
          </View>

          {/* Error */}
          {error ? (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Submit button */}
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`rounded-xl py-4 items-center mb-8 ${
              isSubmitting ? 'bg-violet-500/50' : 'bg-violet-500'
            }`}
          >
            <View className="flex-row items-center">
              <Star size={20} color="#fff" />
              <Text className="text-white font-bold ml-2">
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </Text>
            </View>
          </Pressable>

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Quick rating button component for transaction cards
interface RateButtonProps {
  onPress: () => void;
  hasRated: boolean;
}

export function RateButton({ onPress, hasRated }: RateButtonProps) {
  if (hasRated) {
    return (
      <View className="flex-row items-center bg-emerald-500/20 px-3 py-[6px] rounded-lg">
        <CheckCircle size={14} color="#10b981" />
        <Text className="text-emerald-400 text-sm ml-1">Rated</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-amber-500/20 px-3 py-[6px] rounded-lg active:bg-amber-500/30"
    >
      <Star size={14} color="#f59e0b" />
      <Text className="text-amber-400 text-sm ml-1">Rate</Text>
    </Pressable>
  );
}
