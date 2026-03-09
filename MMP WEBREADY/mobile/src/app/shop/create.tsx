import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Store,
  X,
  Check,
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
  Sparkles,
} from 'lucide-react-native';
import { useShopStore, SHOP_CATEGORIES, type ShopCategory } from '@/lib/shop-store';
import { useAuthStore } from '@/lib/auth-store';

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

// Category selector
function CategorySelector({
  selected,
  onSelect,
}: {
  selected: ShopCategory;
  onSelect: (category: ShopCategory) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {SHOP_CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category.icon] || Store;
        const isSelected = selected === category.value;

        return (
          <Pressable
            key={category.value}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(category.value);
            }}
            className={`flex-row items-center px-4 py-[10px] rounded-xl ${
              isSelected ? 'bg-violet-500' : 'bg-zinc-800'
            }`}
          >
            <Icon size={16} color={isSelected ? '#fff' : '#a1a1aa'} />
            <Text
              className={`ml-2 text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-400'}`}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CreateShopScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createShop = useShopStore((s) => s.createShop);
  const getShopByOwnerId = useShopStore((s) => s.getShopByOwnerId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ShopCategory>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user already has a shop
  const existingShop = user ? getShopByOwnerId(user.id) : undefined;

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to create a shop');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a shop name');
      return;
    }

    setIsSubmitting(true);

    const result = createShop(user.id, user.username, name, description, category);

    setIsSubmitting(false);

    if (result.success && result.shop) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/shop/${result.shop.id}`);
    } else {
      Alert.alert('Error', result.error || 'Failed to create shop');
    }
  };

  // If user already has a shop, redirect them
  if (existingShop) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Create Shop',
            headerStyle: { backgroundColor: '#0f0f23' },
            headerTintColor: '#fff',
          }}
        />
        <View className="flex-1 bg-black items-center justify-center px-5">
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f0f23']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View className="bg-zinc-900 p-6 rounded-2xl items-center">
            <Store size={40} color="#8b5cf6" />
            <Text className="text-white font-bold text-lg mt-4">You already have a shop</Text>
            <Text className="text-zinc-400 text-center mt-2">
              You can only have one shop at a time.
            </Text>
            <Pressable
              onPress={() => router.replace(`/shop/${existingShop.id}`)}
              className="mt-4 bg-violet-500 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">View Your Shop</Text>
            </Pressable>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Create Shop',
          headerStyle: { backgroundColor: '#0f0f23' },
          headerTintColor: '#fff',
          headerBackTitle: 'Cancel',
        }}
      />

      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f0f23']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header illustration */}
            <View className="items-center pt-6 pb-4">
              <View className="bg-violet-500/20 p-6 rounded-full mb-4">
                <Sparkles size={40} color="#8b5cf6" />
              </View>
              <Text className="text-white text-2xl font-bold">Create Your Shop</Text>
              <Text className="text-zinc-400 text-center mt-2 px-10">
                Set up your shop to start selling items on the marketplace
              </Text>
            </View>

            {/* Form */}
            <View className="px-5 pt-4">
              {/* Shop Name */}
              <View className="mb-5">
                <Text className="text-zinc-400 text-sm mb-2 font-medium">Shop Name *</Text>
                <View className="bg-zinc-900 rounded-xl px-4 py-3">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    className="text-white text-base"
                    placeholder="Enter your shop name"
                    placeholderTextColor="#71717a"
                    maxLength={50}
                  />
                </View>
                <Text className="text-zinc-600 text-xs mt-1 ml-1">{`${name.length}/50 characters`}</Text>
              </View>

              {/* Description */}
              <View className="mb-5">
                <Text className="text-zinc-400 text-sm mb-2 font-medium">Description</Text>
                <View className="bg-zinc-900 rounded-xl px-4 py-3">
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    className="text-white text-base"
                    placeholder="Tell buyers what your shop is about..."
                    placeholderTextColor="#71717a"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{ minHeight: 100 }}
                    maxLength={500}
                  />
                </View>
                <Text className="text-zinc-600 text-xs mt-1 ml-1">{`${description.length}/500 characters`}</Text>
              </View>

              {/* Category */}
              <View className="mb-6">
                <Text className="text-zinc-400 text-sm mb-3 font-medium">Category</Text>
                <CategorySelector selected={category} onSelect={setCategory} />
              </View>

              {/* Info card */}
              <View className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 mb-6">
                <Text className="text-violet-400 font-semibold mb-2">Shop Features</Text>
                <Text className="text-violet-300/70 text-sm leading-5">
                  {`• Your shop rating is based on your marketplace reputation\n`}
                  {`• Customers can follow your shop for updates\n`}
                  {`• All your marketplace listings will appear in your shop\n`}
                  {`• You can customize your shop banner and logo later`}
                </Text>
              </View>

              {/* Create button */}
              <Pressable
                onPress={handleCreate}
                disabled={isSubmitting || !name.trim()}
                className={`py-4 rounded-xl items-center ${
                  isSubmitting || !name.trim() ? 'bg-violet-500/50' : 'bg-violet-500'
                }`}
              >
                <Text className="text-white font-bold text-lg">
                  {isSubmitting ? 'Creating...' : 'Create Shop'}
                </Text>
              </Pressable>
            </View>

            <View className="h-24" />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}
