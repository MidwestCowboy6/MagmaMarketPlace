import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Send, ChevronLeft } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/api';
import { useSession } from '@/lib/auth/use-session';

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

interface MessageSender {
  id: string;
  name: string;
  displayName?: string;
  avatarUrl?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender: MessageSender;
}

interface ConvParticipant {
  userId: string;
  user: MessageSender;
}

interface Conversation {
  id: string;
  participants: ConvParticipant[];
}

export default function ChatScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api.get<{ messages: Message[] }>(`/api/messages/conversations/${conversationId}/messages`),
    enabled: !!conversationId && !!currentUserId,
    refetchInterval: 3000,
  });

  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get<{ conversations: Conversation[] }>('/api/messages/conversations'),
    enabled: !!currentUserId,
  });

  const messages = messagesData?.messages ?? [];
  const conversation = convsData?.conversations?.find(c => c.id === conversationId);
  const other = conversation?.participants.find(p => p.userId !== currentUserId);
  const otherDisplayName = other?.user.displayName ?? other?.user.name ?? 'User';
  const otherAvatar = other?.user.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(otherDisplayName)}&background=f97316&color=fff&size=80`;

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || !conversationId || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      await api.post(`/api/messages/conversations/${conversationId}/messages`, { text });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (e) {
      console.error('Send failed', e);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  // Group messages by date
  const groupedMessages: Array<{ dateLabel: string; msgs: Message[] }> = [];
  let currentLabel = '';
  for (const msg of messages) {
    const label = formatDateLabel(msg.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      groupedMessages.push({ dateLabel: label, msgs: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <View className="flex-row items-center">
              <Image source={{ uri: otherAvatar }} style={{ width: 34, height: 34, borderRadius: 17, marginRight: 10 }} />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{otherDisplayName}</Text>
            </View>
          ),
          headerStyle: { backgroundColor: '#0f0f23' },
          headerTintColor: '#fff',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginRight: 4 }}>
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <View className="flex-1 bg-black">
        <LinearGradient
          colors={['#0f0f23', '#0a0a1a', '#000000']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 12 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {isLoading ? (
              <View className="items-center mt-20"><ActivityIndicator color="#f97316" /></View>
            ) : messages.length === 0 ? (
              <View className="items-center mt-12 mb-8">
                <Image source={{ uri: otherAvatar }} style={{ width: 64, height: 64, borderRadius: 32, marginBottom: 12 }} />
                <Text className="text-white font-semibold text-lg">{otherDisplayName}</Text>
                <Text className="text-zinc-500 text-sm mt-1 text-center">
                  Say hello! This is the start of your{'\n'}conversation.
                </Text>
              </View>
            ) : null}

            {groupedMessages.map(({ dateLabel, msgs }) => (
              <View key={dateLabel}>
                <View className="items-center my-4">
                  <View className="bg-zinc-800/80 rounded-full px-3 py-1">
                    <Text className="text-zinc-400 text-xs font-medium">{dateLabel}</Text>
                  </View>
                </View>

                {msgs.map((message, idx) => {
                  const isMine = message.senderId === currentUserId;
                  const isLastInGroup = idx === msgs.length - 1 || msgs[idx + 1]?.senderId !== message.senderId;

                  return (
                    <View key={message.id} className={`flex-row mb-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <View style={{ width: 28, marginRight: 8, alignSelf: 'flex-end', marginBottom: 2 }}>
                          {isLastInGroup && (
                            <Image source={{ uri: otherAvatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                          )}
                        </View>
                      )}
                      <View style={{ maxWidth: '72%' }}>
                        <View className={`rounded-2xl px-4 py-3 ${isMine ? 'rounded-tr-sm bg-orange-500' : 'rounded-tl-sm bg-zinc-800'}`}>
                          <Text className={`text-sm leading-5 ${isMine ? 'text-white' : 'text-zinc-100'}`}>{message.text}</Text>
                        </View>
                        {isLastInGroup && (
                          <Text className={`text-xs text-zinc-600 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                            {formatTime(message.createdAt)}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <SafeAreaView edges={['bottom']}>
            <View className="px-4 py-3 flex-row items-end gap-3 border-t border-zinc-900">
              <View className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 px-4 py-3 min-h-12 justify-center">
                <TextInput
                  className="text-white text-sm"
                  placeholder="Message..."
                  placeholderTextColor="#52525b"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                  style={{ maxHeight: 120 }}
                />
              </View>
              <Pressable
                onPress={handleSend}
                disabled={!inputText.trim() || sending}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: inputText.trim() && !sending ? '#f97316' : '#27272a' }}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#71717a" />
                  : <Send size={20} color={inputText.trim() ? '#fff' : '#52525b'} />
                }
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}
