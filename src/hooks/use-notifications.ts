'use client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: { profile: { username: string; displayName: string; avatarUrl: string | null; blobTint: string | null } | null } | null;
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api<{ data: { count: number } }>('/notifications/unread-count'),
    refetchInterval: 60_000, // socket keeps it live; this is the safety net
  });
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: ({ pageParam }) =>
      api<{ data: Notification[]; meta: { cursor: string | null; hasMore: boolean } }>(
        `/notifications?limit=20${pageParam ? `&cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: '' as string,
    getNextPageParam: (last) => (last.meta.hasMore ? last.meta.cursor : undefined),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'list'] });
    },
  });
}