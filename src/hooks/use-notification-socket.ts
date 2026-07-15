'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, SocketEvents } from '@/lib/socket';

export function useNotificationSocket() {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    };
    socket.on(SocketEvents.NOTIFICATION_NEW, onNew);
    return () => { socket.off(SocketEvents.NOTIFICATION_NEW, onNew); };
  }, [qc]);
}