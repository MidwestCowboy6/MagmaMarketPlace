import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth-store';

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        result = await signUp(email, password, username);
      }

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'An error occurred');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f0f23']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 px-6 justify-center">
              {/* Logo / Header */}
              <View className="items-center mb-10">
                <View className="bg-violet-500/20 p-4 rounded-full mb-4">
                  <Sparkles size={40} color="#8b5cf6" />
                </View>
                <Text className="text-white text-3xl font-bold">AniTrack</Text>
                <Text className="text-zinc-400 text-base mt-2">
                  {isLogin ? 'Welcome back!' : 'Create your account'}
                </Text>
              </View>

              {/* Form */}
              <View className="space-y-4">
                {/* Username (Sign Up only) */}
                {!isLogin && (
                  <View className="mb-4">
                    <Text className="text-zinc-400 text-sm mb-2 ml-1">Username</Text>
                    <View className="flex-row items-center bg-zinc-900 rounded-xl px-4">
                      <User size={20} color="#71717a" />
                      <TextInput
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Choose a username"
                        placeholderTextColor="#71717a"
                        className="flex-1 text-white text-base py-4 ml-3"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                )}

                {/* Email */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2 ml-1">Email</Text>
                  <View className="flex-row items-center bg-zinc-900 rounded-xl px-4">
                    <Mail size={20} color="#71717a" />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      placeholderTextColor="#71717a"
                      className="flex-1 text-white text-base py-4 ml-3"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Password */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-sm mb-2 ml-1">Password</Text>
                  <View className="flex-row items-center bg-zinc-900 rounded-xl px-4">
                    <Lock size={20} color="#71717a" />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
                      placeholderTextColor="#71717a"
                      className="flex-1 text-white text-base py-4 ml-3"
                      secureTextEntry={!showPassword}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} className="p-2">
                      {showPassword ? (
                        <EyeOff size={20} color="#71717a" />
                      ) : (
                        <Eye size={20} color="#71717a" />
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* Error Message */}
                {error ? (
                  <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                    <Text className="text-red-400 text-center">{error}</Text>
                  </View>
                ) : null}

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={isLoading}
                  className="bg-violet-500 rounded-xl py-4 flex-row items-center justify-center active:bg-violet-600 mt-2"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text className="text-white font-bold text-lg">
                        {isLogin ? 'Sign In' : 'Create Account'}
                      </Text>
                      <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </Pressable>

                {/* Toggle Mode */}
                <View className="flex-row justify-center mt-6">
                  <Text className="text-zinc-400">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  </Text>
                  <Pressable onPress={toggleMode}>
                    <Text className="text-violet-400 font-semibold">
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Features Preview */}
              <View className="mt-10">
                <Text className="text-zinc-500 text-xs text-center mb-3">
                  UNLOCK THESE FEATURES
                </Text>
                <View className="flex-row justify-center flex-wrap gap-2">
                  {['Wallet', 'Marketplace', 'Trading', 'Collections'].map((feature) => (
                    <View key={feature} className="bg-zinc-800/50 px-3 py-[6px] rounded-full">
                      <Text className="text-zinc-400 text-xs">{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
