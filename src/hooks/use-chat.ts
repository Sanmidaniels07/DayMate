'use client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSessionStore } from '@/stores/session';
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
  pending?: boolean;
  failed?: boolean;
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

type MessagesCache = { pages: { data: Message[]; meta: any }[]; pageParams: unknown[] };

/**
 * The single source of truth for inserting/replacing a message in the
 * cache. Every insertion path — send mutation success, media send success,
 * and the socket's message:new handler — must go through this so they all
 * share one dedupe rule. That's what actually prevents duplicates: not any
 * one caller being careful, but there being exactly one way to write.
 */
export function mergeMessage(
  qc: QueryClient,
  conversationId: string,
  message: Message,
  replaceId?: string,
) {
  qc.setQueryData(['messages', conversationId], (old: MessagesCache | undefined) => {
    if (!old) return old;
    const [firstPage, ...rest] = old.pages;
    const alreadyPresent = firstPage.data.some((m) => m.id === message.id);
    if (alreadyPresent && !replaceId) return old; // exact duplicate — the bug this fixes
    const withoutOldEntries = firstPage.data.filter(
      (m) => m.id !== message.id && m.id !== replaceId,
    );
    return { ...old, pages: [{ ...firstPage, data: [message, ...withoutOldEntries] }, ...rest] };
  });
}

export function markMessageFailed(qc: QueryClient, conversationId: string, tempId: string) {
  qc.setQueryData(['messages', conversationId], (old: MessagesCache | undefined) => {
    if (!old) return old;
    const [firstPage, ...rest] = old.pages;
    return {
      ...old,
      pages: [
        { ...firstPage, data: firstPage.data.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)) },
        ...rest,
      ],
    };
  });
}

export function removeMessage(qc: QueryClient, conversationId: string, id: string) {
  qc.setQueryData(['messages', conversationId], (old: MessagesCache | undefined) => {
    if (!old) return old;
    const [firstPage, ...rest] = old.pages;
    return { ...old, pages: [{ ...firstPage, data: firstPage.data.filter((m) => m.id !== id) }, ...rest] };
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const meId = useSessionStore((s) => s.user?.id);

  return useMutation({
    mutationFn: (body: string) =>
      api<{ data: Message }>(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST', body: JSON.stringify({ body }),
      }),
    onMutate: (body: string) => {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      mergeMessage(qc, conversationId, {
        id: tempId,
        conversationId,
        type: 'TEXT',
        body,
        mediaUrl: null,
        senderId: meId,
        editedAt: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        sender: { profile: null },
        pending: true,
      });
      return { tempId };
    },
    onSuccess: (res, _body, context) => {
      mergeMessage(qc, conversationId, res.data, context?.tempId);
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (_err, _body, context) => {
      if (context?.tempId) markMessageFailed(qc, conversationId, context.tempId);
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