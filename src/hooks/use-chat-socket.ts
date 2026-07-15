'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, SocketEvents } from '@/lib/socket';
import type { Message } from './use-chat';

/**
 * Bridges socket message events into the React Query cache. Mounted once
 * per open thread. The backend fans out message:new to everyone in the
 * room INCLUDING the sender — so this is the single insertion point for
 * new messages, sender and receiver alike (no optimistic double-render).
 */
export function useChatSocket(conversationId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    const onNew = ({ message }: { message: Message }) => {
      if (message.conversationId !== conversationId) {
        // A message in ANOTHER conversation — just bump the list.
        qc.invalidateQueries({ queryKey: ['conversations'] });
        return;
      }
      qc.setQueryData(['messages', conversationId], (old: { pages: { data: Message[] }[]; pageParams: unknown[] } | undefined) => {
        if (!old) return old;
        // Newest page is pages[0]; messages are newest-first, so prepend.
        if (old.pages[0]?.data.some((m) => m.id === message.id)) return old; // dedupe
        const pages = [...old.pages];
        pages[0] = { ...pages[0], data: [message, ...pages[0].data] };
        return { ...old, pages };
      });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    };

    const onEdited = ({ message }: { message: Message }) => {
      qc.setQueryData(['messages', conversationId], (old: { pages: { data: Message[] }[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((pg) => ({
            ...pg, data: pg.data.map((m) => (m.id === message.id ? message : m)),
          })),
        };
      });
    };

    const onDeleted = ({ messageId }: { messageId: string }) => {
      qc.setQueryData(['messages', conversationId], (old: { pages: { data: Message[] }[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((pg) => ({
            ...pg, data: pg.data.map((m) => (m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), body: null } : m)),
          })),
        };
      });
    };

    socket.on(SocketEvents.MESSAGE_NEW, onNew);
    socket.on(SocketEvents.MESSAGE_EDITED, onEdited);
    socket.on(SocketEvents.MESSAGE_DELETED, onDeleted);
    return () => {
      socket.off(SocketEvents.MESSAGE_NEW, onNew);
      socket.off(SocketEvents.MESSAGE_EDITED, onEdited);
      socket.off(SocketEvents.MESSAGE_DELETED, onDeleted);
    };
  }, [conversationId, qc]);
}