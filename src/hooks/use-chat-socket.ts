'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, SocketEvents } from '@/lib/socket';
import { mergeMessage, type Message } from './use-chat';

export function useChatSocket(conversationId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    const onNew = ({ message }: { message: Message }) => {
      if (message.conversationId !== conversationId) {
        qc.invalidateQueries({ queryKey: ['conversations'] });
        return;
      }
      mergeMessage(qc, conversationId, message);
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