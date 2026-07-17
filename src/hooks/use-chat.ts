'use client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { FriendRow } from './use-social'; 


export interface ConversationParticipant {
  userId: string;
  isAdmin?: boolean;
  lastReadAt?: string | null;
  user: { profile: { username: string; displayName: string; avatarUrl: string | null; blobTint: string | null } | null };
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  title: string | null;
  avatarUrl: string | null;
  lastMessageAt: string | null;
  participants: ConversationParticipant[];
  latestMessage: { id: string; type: string; body: string | null; senderId: string; createdAt: string } | null;
}

export interface Message {
  id: string;
  conversationId: string;
  type: string;
  body: string | null;
  mediaUrl: string | null;
  senderId?: string;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  sender: { profile: { username: string; displayName: string; avatarUrl: string | null; blobTint: string | null } | null };
  replyTo?: { id: string; body: string | null; sender: { profile: { displayName: string } | null } } | null;
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api<{ data: Conversation[] }>('/chat/conversations?limit=30'),
  });
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) =>
      api<{ data: Message[]; meta: { cursor: string | null; hasMore: boolean } }>(
        `/chat/conversations/${conversationId}/messages?limit=30${pageParam ? `&cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: '' as string,
    getNextPageParam: (last) => (last.meta.hasMore ? last.meta.cursor : undefined),
    enabled: !!conversationId,
  });
}

// use-chat.ts — updated useSendMessage
export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api<{ data: Message }>(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST', body: JSON.stringify({ body }),
      }),
    onSuccess: (res) => {
      const message = res.data;
      qc.setQueryData(
        ['messages', conversationId],
        (old: { pages: { data: Message[]; meta: any }[]; pageParams: unknown[] } | undefined) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;
          return {
            ...old,
            pages: [{ ...firstPage, data: [message, ...firstPage.data] }, ...rest],
          };
        },
      );
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useOpenDm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      api<{ data: Conversation }>('/chat/conversations/dm', {
        method: 'POST', body: JSON.stringify({ username }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useMarkRead(conversationId: string) {
  return useMutation({
    mutationFn: () => api(`/chat/conversations/${conversationId}/read`, { method: 'POST' }),
  });
}

export function useConversationDetail(conversationId: string) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => api<{ data: Conversation }>(`/chat/conversations/${conversationId}`),
    enabled: !!conversationId,
  });
}

export function useUnreadChats() {
  return useQuery({
    queryKey: ['chat', 'unread'],
    queryFn: () => api<{ data: { total: number; byConversation: Record<string, number> } }>('/chat/unread'),
    refetchInterval: 60_000,
  });
}


export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; usernames: string[] }) =>
      api<{ data: Conversation }>('/chat/conversations/group', {
        method: 'POST', body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}


export function useAddGroupMember(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      api(`/chat/conversations/${conversationId}/members`, {
        method: 'POST', body: JSON.stringify({ username }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversation', conversationId] }),
  });
}

export function useRemoveGroupMember(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      api(`/chat/conversations/${conversationId}/members/${username}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversation', conversationId] }),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      api(`/chat/conversations/${conversationId}/leave`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useDeleteMessage(conversationId: string) {
  return useMutation({
    mutationFn: (messageId: string) =>
      api(`/chat/conversations/${conversationId}/messages/${messageId}`, { method: 'DELETE' }),
  });
}

export function useEditMessage(conversationId: string) {
  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: string }) =>
      api(`/chat/conversations/${conversationId}/messages/${messageId}`, {
        method: 'PATCH', body: JSON.stringify({ body }),
      }),
  });
}