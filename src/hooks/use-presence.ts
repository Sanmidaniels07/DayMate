'use client';
import { useEffect } from 'react';
import { create } from 'zustand';
import { useQuery } from '@tanstack/react-query';
import { getSocket, SocketEvents } from '@/lib/socket';
import { api } from '@/lib/api';

/** A live map of userId → online, updated by the presence:changed socket event. */
interface PresenceStore {
  online: Record<string, boolean>;
  setOnline: (userId: string, online: boolean) => void;
}
export const usePresenceStore = create<PresenceStore>((set) => ({
  online: {},
  setOnline: (userId, online) =>
    set((s) => ({ online: { ...s.online, [userId]: online } })),
}));

/** Mount once (in the app layout) — bridges presence:changed into the store. */
export function usePresenceSocket() {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onChange = ({ userId, online }: { userId: string; online: boolean }) => {
      usePresenceStore.getState().setOnline(userId, online);
    };
    socket.on(SocketEvents.PRESENCE_CHANGED, onChange);
    return () => { socket.off(SocketEvents.PRESENCE_CHANGED, onChange); };
  }, []);
}

/** Fetch a user's presence by username (for profile pages). */
export function usePresence(username: string, enabled = true) {
  return useQuery({
    queryKey: ['presence', username],
    queryFn: () => api<{ data: { online: boolean; lastSeenAt: string | null } }>(`/profiles/${username}/presence`),
    enabled: enabled && !!username,
    staleTime: 30_000,
  });
}