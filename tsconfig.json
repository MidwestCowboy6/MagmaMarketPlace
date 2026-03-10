import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {
  Store,
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
  Save,
  Image as ImageIcon,
  Camera,
  Upload,
  X,
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

// Image picker component
function ImagePickerField({
  label,
  value,
  onChange,
  aspectRatio,
  height,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectRatio: [number, number];
  height: number;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const convertToDataUrl = async (uri: string): Promise<string> => {
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
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        const dataUrl = await convertToDataUrl(result.assets[0].uri);
        if (dataUrl) {
          onChange(dataUrl);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setIsLoading(false);
      }
    } catch (e) {
      console.log('Error picking image:', e);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: aspectRatio,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        const dataUrl = await convertToDataUrl(result.assets[0].uri);
        if (dataUrl) {
          onChange(dataUrl);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setIsLoading(false);
      }
    } catch (e) {
      console.log('Error taking photo:', e);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    onChange('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View className="mb-4">
      <Text className="text-zinc-500 text-xs mb-2">{label}</Text>

      {value ? (
        <View className="relative">
          <Image
            source={{ uri: value }}
            style={{ width: '100%', height, borderRadius: 12 }}
            resizeMode="cover"
          />
          {isLoading && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator color="#fff" />
            </View>
          )}
          <Pressable
            onPress={clearImage}
            className="absolute top-2 right-2 bg-black/60 p-2 rounded-full"
          >
            <X size={16} color="#fff" />
          </Pressable>
          <Pressable
            onPress={pickImage}
            className="absolute bottom-2 right-2 bg-violet-500 px-3 py-[6px] rounded-full flex-row items-center"
          >
            <Upload size={14} color="#fff" />
            <Text className="text-white text-xs font-medium ml-1">Change</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-row gap-3">
          <Pressable
            onPress={takePhoto}
            disabled={isLoading}
            className="flex-1 bg-zinc-800 rounded-xl p-4 items-center justify-center"
            style={{ height }}
          >
            {isLoading ? (
              <ActivityIndicator color="#8b5cf6" />
            ) : (
              <>
                <Camera size={28} color="#8b5cf6" />
                <Text className="text-zinc-400 text-sm mt-2">Take Photo</Text>
              </>
            )}
          </Pressable>
          <Pressable
            onPress={pickImage}
            disabled={isLoading}
            className="flex-1 bg-zinc-800 rounded-xl p-4 items-center justify-center"
            style={{ height }}
          >
            {isLoading ? (
              <ActivityIndicator color="#8b5cf6" />
            ) : (
              <>
                <Upload size={28} color="#8b5cf6" />
                <Text className="text-zinc-400 text-sm mt-2">Upload</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function EditShopScreen() {
  const router = useRouter();
  const { shopId } = useLocalSearchParams<{ shopId: string }>();

  const user = useAuthStore((s) => s.user);
  const getShopById = useShopStore((s) => s.getShopById);
  const updateShop = useShopStore((s) => s.updateShop);

  const shop = shopId ? getShopById(shopId) : undefined;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ShopCategory>('general');
  const [bannerUrl, setBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load shop data
  useEffect(() => {
    if (shop) {
      setName(shop.name);
      setDescription(shop.description);
      setCategory(shop.category);
      setBannerUrl(shop.bannerUrl || '');
      setLogoUrl(shop.logoUrl || '');
      setIsActive(shop.isActive);
    }
  }, [shop]);

  // Check ownership
  const isOwner = user && shop && user.id === shop.ownerId;

  const handleSave = async () => {
    if (!shop || !isOwner) {
      Alert.alert('Error', 'You do not have permission to edit this shop');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a shop name');
      return;
    }

    setIsSubmitting(true);

    const result = updateShop(shop.id, {
      name,
      description,
      category,
      bannerUrl: bannerUrl.trim() || null,
      logoUrl: logoUrl.trim() || null,
      isActive,
    });

    setIsSubmitting(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else {
      Alert.alert('Error', result.error || 'Failed to update shop');
    }
  };

  if (!shop) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Edit Shop',
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

  if (!isOwner) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Edit Shop',
            headerStyle: { backgroundColor: '#0f0f23' },
            headerTintColor: '#fff',
          }}
        />
        <View className="flex-1 bg-black items-center justify-center">
          <Text className="text-zinc-500">You do not own this shop</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Edit Shop',
          headerStyle: { backgroundColor: '#0f0f23' },
          headerTintColor: '#fff',
          headerBackTitle: 'Cancel',
          headerRight: () => (
            <Pressable
              onPress={handleSave}
              disabled={isSubmitting || !name.trim()}
              className="p-2"
            >
              <Save size={22} color={isSubmitting || !name.trim() ? '#71717a' : '#8b5cf6'} />
            </Pressable>
          ),
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
            {/* Form */}
            <View className="px-5 pt-6">
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

              {/* Images section */}
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <ImageIcon size={18} color="#a1a1aa" />
                  <Text className="text-zinc-400 text-sm ml-2 font-medium">Shop Images</Text>
                </View>

                {/* Banner Image */}
                <ImagePickerField
                  label="Banner Image (3:1 ratio)"
                  value={bannerUrl}
                  onChange={setBannerUrl}
                  aspectRatio={[3, 1]}
                  height={100}
                />

                {/* Logo Image */}
                <ImagePickerField
                  label="Profile/Logo Image (1:1 ratio)"
                  value={logoUrl}
                  onChange={setLogoUrl}
                  aspectRatio={[1, 1]}
                  height={120}
                />
              </View>

              {/* Shop Status */}
              <View className="mb-6 bg-zinc-900 rounded-xl p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                    <Text className="text-white font-medium">Shop Active</Text>
                    <Text className="text-zinc-500 text-sm mt-1">
                      When disabled, your shop won't appear in search results
                    </Text>
                  </View>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: '#3f3f46', true: '#8b5cf6' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              {/* Save button */}
              <Pressable
                onPress={handleSave}
                disabled={isSubmitting || !name.trim()}
                className={`py-4 rounded-xl items-center ${
                  isSubmitting || !name.trim() ? 'bg-violet-500/50' : 'bg-violet-500'
                }`}
              >
                <Text className="text-white font-bold text-lg">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
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
