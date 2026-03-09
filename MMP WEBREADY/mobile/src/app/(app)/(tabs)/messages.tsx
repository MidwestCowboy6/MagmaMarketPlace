import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { MessageCircle, Search, X, ChevronRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/api';
import { useSession } from '@/lib/auth/use-session';
import Animated, { FadeInDown } from 'react-native-reanimated';

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface UserResult {
  id: string;
  name: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

interface ConvMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt: string;
}

interface ConvParticipant {
  userId: string;
  unreadCount: number;
  user: UserResult;
}

interface Conversation {
  id: string;
  updatedAt: string;
  participants: ConvParticipant[];
  messages: ConvMessage[];
}

export default function MessagesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [startingConv, setStartingConv] = useState<string | null>(null);

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { data: convsData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get<{ conversations: Conversation[] }>('/api/messages/conversations'),
    enabled: !!currentUserId,
    refetchInterval: 5000,
  });

  const { data: searchData } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: () => api.get<{ users: UserResult[] }>(`/api/users?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.trim().length > 1,
  });

  const conversations = convsData?.conversations ?? [];
  const searchResults = searchData?.users ?? [];

  const handleOpenConversation = (conversationId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat/${conversationId}`);
  };

  const handleStartConversation = async (otherUserId: string) => {
    setStartingConv(otherUserId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await api.post<{ conversation: Conversation }>('/api/messages/conversations', { otherUserId });
      setSearchQuery('');
      setIsSearching(false);
      router.push(`/chat/${res.conversation.id}`);
    } catch (e) {
      console.error('Failed to start conversation', e);
    } finally {
      setStartingConv(null);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <LinearGradient
        colors={['#0f0f23', '#0a0a1a', '#000000']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-2 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-3xl font-bold tracking-tight">Messages</Text>
            <View className="bg-orange-500/20 border border-orange-500/30 w-10 h-10 rounded-full items-center justify-center">
              <MessageCircle size={20} color="#f97316" />
            </View>
          </View>

          <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800">
            <Search size={16} color="#71717a" />
            <TextInput
              className="flex-1 ml-2 text-white text-sm"
              placeholder="Search users to message..."
              placeholderTextColor="#52525b"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setIsSearching(text.length > 0);
              }}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => { setSearchQuery(''); setIsSearching(false); }} hitSlop={8}>
                <X size={16} color="#71717a" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Search Results */}
        {isSearching && (
          <View className="mx-5 mb-4 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            {searchResults.length === 0 ? (
              <View className="p-4 items-center">
                <Text className="text-zinc-500 text-sm">
                  {searchQuery.length < 2 ? 'Type to search users...' : 'No users found'}
                </Text>
              </View>
            ) : (
              searchResults.map((u, idx) => (
                <Pressable
                  key={u.id}
                  onPress={() => handleStartConversation(u.id)}
                  disabled={startingConv === u.id}
                  className="flex-row items-center px-4 py-3"
                  style={idx < searchResults.length - 1 ? { borderBottomWidth: 0.5, borderBottomColor: '#27272a' } : {}}
                >
                  <Image
                    source={{ uri: u.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName ?? u.name)}&background=f97316&color=fff&size=80` }}
                    style={{ width: 42, height: 42, borderRadius: 21 }}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold text-sm">{u.displayName ?? u.name}</Text>
                    {u.username && <Text className="text-zinc-500 text-xs">@{u.username}</Text>}
                  </View>
                  {startingConv === u.id
                    ? <ActivityIndicator size="small" color="#f97316" />
                    : <MessageCircle size={16} color="#f97316" />
                  }
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Conversations List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View className="items-center mt-20">
              <ActivityIndicator color="#f97316" />
            </View>
          ) : conversations.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(100)} className="items-center mt-20">
              <View className="bg-zinc-900 w-20 h-20 rounded-full items-center justify-center mb-4">
                <MessageCircle size={36} color="#3f3f46" />
              </View>
              <Text className="text-white font-semibold text-lg mb-2">No messages yet</Text>
              <Text className="text-zinc-500 text-sm text-center leading-5">
                Search for a user above to start{'\n'}a conversation
              </Text>
            </Animated.View>
          ) : (
            conversations.map((conv, idx) => {
              const other = conv.participants.find((p) => p.userId !== currentUserId);
              if (!other) return null;
              const myParticipant = conv.participants.find(p => p.userId === currentUserId);
              const unread = myParticipant?.unreadCount ?? 0;
              const lastMsg = conv.messages[0];
              const isLastMine = lastMsg?.senderId === currentUserId;
              const displayName = other.user.displayName ?? other.user.name;
              const avatar = other.user.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=f97316&color=fff&size=80`;

              return (
                <Animated.View key={conv.id} entering={FadeInDown.delay(idx * 40)}>
                  <Pressable
                    onPress={() => handleOpenConversation(conv.id)}
                    className="flex-row items-center py-4"
                    style={idx < conversations.length - 1 ? { borderBottomWidth: 0.5, borderBottomColor: '#18181b' } : {}}
                  >
                    <View className="relative">
                      <Image source={{ uri: avatar }} style={{ width: 52, height: 52, borderRadius: 26 }} />
                      {unread > 0 && (
                        <View className="absolute -top-1 -right-1 bg-orange-500 rounded-full min-w-5 h-5 items-center justify-center" style={{ paddingHorizontal: 4 }}>
                          <Text className="text-white text-xs font-bold">{unread > 99 ? '99+' : unread}</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-white font-semibold text-base">{displayName}</Text>
                        <Text className="text-zinc-500 text-xs">{timeAgo(conv.updatedAt)}</Text>
                      </View>
                      <View className="flex-row items-center">
                        {isLastMine && <Text className="text-zinc-600 text-sm mr-1">You: </Text>}
                        <Text className={`text-sm flex-1 ${unread > 0 ? 'text-zinc-200 font-medium' : 'text-zinc-500'}`} numberOfLines={1}>
                          {lastMsg?.text ?? 'Start a conversation'}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color="#3f3f46" style={{ marginLeft: 8 }} />
                  </Pressable>
                </Animated.View>
              );
            })
          )}
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
