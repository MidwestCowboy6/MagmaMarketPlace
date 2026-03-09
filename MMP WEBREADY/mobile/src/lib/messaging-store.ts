import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantUsernames: Record<string, string>; // userId -> username
  participantDisplayNames: Record<string, string>; // userId -> displayName
  participantAvatars: Record<string, string | null>; // userId -> avatarUrl
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: string | null;
  unreadCount: Record<string, number>; // userId -> unread count
  createdAt: string;
}

interface MessagingState {
  conversations: Record<string, Conversation>;
  messages: Record<string, Message[]>; // conversationId -> messages

  // Actions
  getOrCreateConversation: (
    currentUserId: string,
    currentUsername: string,
    currentDisplayName: string,
    currentAvatarUrl: string | null,
    otherUserId: string,
    otherUsername: string,
    otherDisplayName: string,
    otherAvatarUrl: string | null
  ) => string; // returns conversationId
  sendMessage: (conversationId: string, senderId: string, senderUsername: string, text: string) => void;
  markAsRead: (conversationId: string, userId: string) => void;
  getConversationsForUser: (userId: string) => Conversation[];
  getUnreadCountForUser: (userId: string) => number;
}

function generateId(prefix: string): string {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export const useMessagingStore = create<MessagingState>()(
  persist(
    (set, get) => ({
      conversations: {},
      messages: {},

      getOrCreateConversation: (
        currentUserId,
        currentUsername,
        currentDisplayName,
        currentAvatarUrl,
        otherUserId,
        otherUsername,
        otherDisplayName,
        otherAvatarUrl
      ) => {
        const { conversations } = get();

        // Find existing conversation between these two users
        const existing = Object.values(conversations).find((c) => {
          return (
            c.participantIds.includes(currentUserId) &&
            c.participantIds.includes(otherUserId) &&
            c.participantIds.length === 2
          );
        });

        if (existing) {
          // Update participant info in case it changed
          set((state) => ({
            conversations: {
              ...state.conversations,
              [existing.id]: {
                ...existing,
                participantUsernames: {
                  [currentUserId]: currentUsername,
                  [otherUserId]: otherUsername,
                },
                participantDisplayNames: {
                  [currentUserId]: currentDisplayName,
                  [otherUserId]: otherDisplayName,
                },
                participantAvatars: {
                  [currentUserId]: currentAvatarUrl,
                  [otherUserId]: otherAvatarUrl,
                },
              },
            },
          }));
          return existing.id;
        }

        // Create new conversation
        const conversationId = generateId('conv');
        const now = new Date().toISOString();
        const newConversation: Conversation = {
          id: conversationId,
          participantIds: [currentUserId, otherUserId],
          participantUsernames: {
            [currentUserId]: currentUsername,
            [otherUserId]: otherUsername,
          },
          participantDisplayNames: {
            [currentUserId]: currentDisplayName,
            [otherUserId]: otherDisplayName,
          },
          participantAvatars: {
            [currentUserId]: currentAvatarUrl,
            [otherUserId]: otherAvatarUrl,
          },
          lastMessage: null,
          lastMessageAt: null,
          lastMessageSenderId: null,
          unreadCount: {
            [currentUserId]: 0,
            [otherUserId]: 0,
          },
          createdAt: now,
        };

        set((state) => ({
          conversations: {
            ...state.conversations,
            [conversationId]: newConversation,
          },
          messages: {
            ...state.messages,
            [conversationId]: [],
          },
        }));

        return conversationId;
      },

      sendMessage: (conversationId, senderId, senderUsername, text) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const { conversations, messages } = get();
        const conversation = conversations[conversationId];
        if (!conversation) return;

        const messageId = generateId('msg');
        const now = new Date().toISOString();

        const newMessage: Message = {
          id: messageId,
          conversationId,
          senderId,
          senderUsername,
          text: trimmed,
          createdAt: now,
          read: false,
        };

        // Increment unread count for all participants except sender
        const updatedUnreadCount = { ...conversation.unreadCount };
        for (const participantId of conversation.participantIds) {
          if (participantId !== senderId) {
            updatedUnreadCount[participantId] = (updatedUnreadCount[participantId] || 0) + 1;
          }
        }

        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] || []), newMessage],
          },
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              lastMessage: trimmed,
              lastMessageAt: now,
              lastMessageSenderId: senderId,
              unreadCount: updatedUnreadCount,
            },
          },
        }));
      },

      markAsRead: (conversationId, userId) => {
        const { conversations } = get();
        const conversation = conversations[conversationId];
        if (!conversation) return;

        set((state) => ({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...conversation,
              unreadCount: {
                ...conversation.unreadCount,
                [userId]: 0,
              },
            },
          },
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).map((m) =>
              m.senderId !== userId ? { ...m, read: true } : m
            ),
          },
        }));
      },

      getConversationsForUser: (userId) => {
        const { conversations } = get();
        return Object.values(conversations)
          .filter((c) => c.participantIds.includes(userId))
          .sort((a, b) => {
            const aTime = a.lastMessageAt || a.createdAt;
            const bTime = b.lastMessageAt || b.createdAt;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
          });
      },

      getUnreadCountForUser: (userId) => {
        const { conversations } = get();
        return Object.values(conversations)
          .filter((c) => c.participantIds.includes(userId))
          .reduce((total, c) => total + (c.unreadCount[userId] || 0), 0);
      },
    }),
    {
      name: 'messaging-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
