import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Flame, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { authClient } from '@/lib/auth/auth-client';
import { useInvalidateSession } from '@/lib/auth/use-session';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const invalidateSession = useInvalidateSession();

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (isSignUp && !name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isSignUp) {
      const result = await authClient.signUp.email({
        email: trimmedEmail,
        password,
        name: name.trim(),
      });

      setLoading(false);

      if (result.error) {
        setError(result.error.message ?? 'Failed to create account. Try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await invalidateSession();
        router.replace('/(app)/(tabs)/profile');
      }
    } else {
      const result = await authClient.signIn.email({
        email: trimmedEmail,
        password,
      });

      setLoading(false);

      if (result.error) {
        setError(result.error.message ?? 'Invalid credentials. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await invalidateSession();
        router.replace('/(app)/(tabs)/profile');
      }
    }
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#1a0800', '#0f0500', '#000000']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1 px-6 justify-center"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Logo */}
          <Animated.View entering={FadeInDown.delay(0)} className="items-center mb-12">
            <View className="w-20 h-20 rounded-3xl bg-orange-500/20 border border-orange-500/40 items-center justify-center mb-6">
              <Flame size={40} color="#f97316" />
            </View>
            <Text className="text-white text-4xl font-bold tracking-tight mb-2">Magma Market</Text>
            <Text className="text-zinc-400 text-base text-center leading-6">
              The premier collectibles marketplace{'\n'}powered by Avalanche
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(100)}>
            {isSignUp && (
              <>
                <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">Name</Text>
                <View className="flex-row items-center bg-zinc-900 border border-zinc-700 rounded-2xl px-4 mb-3">
                  <TextInput
                    className="flex-1 text-white text-base py-4"
                    placeholder="Your name"
                    placeholderTextColor="#52525b"
                    value={name}
                    onChangeText={(t) => { setName(t); setError(null); }}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </>
            )}

            <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">Email address</Text>
            <View className="flex-row items-center bg-zinc-900 border border-zinc-700 rounded-2xl px-4 mb-3">
              <Mail size={18} color="#71717a" />
              <TextInput
                className="flex-1 ml-3 text-white text-base py-4"
                placeholder="you@example.com"
                placeholderTextColor="#52525b"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">Password</Text>
            <View className="flex-row items-center bg-zinc-900 border border-zinc-700 rounded-2xl px-4 mb-3">
              <Lock size={18} color="#71717a" />
              <TextInput
                className="flex-1 ml-3 text-white text-base py-4"
                placeholder="Enter your password"
                placeholderTextColor="#52525b"
                value={password}
                onChangeText={(t) => { setPassword(t); setError(null); }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            {error && (
              <Animated.Text entering={FadeInUp} className="text-red-400 text-sm mb-3 ml-1">
                {error}
              </Animated.Text>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="rounded-2xl overflow-hidden mt-1"
            >
              <LinearGradient
                colors={loading ? ['#7c3d12', '#7c3d12'] : ['#ea580c', '#f97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text className="text-white font-bold text-base">
                      {isSignUp ? 'Create account' : 'Sign in'}
                    </Text>
                    <ArrowRight size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="mt-6"
            >
              <Text className="text-zinc-400 text-sm text-center leading-5">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text className="text-orange-400 font-semibold">
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </Text>
              </Text>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
