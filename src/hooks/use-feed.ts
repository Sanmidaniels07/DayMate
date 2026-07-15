'use client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface PostCard {
  id: string;
  body: string | null;
  isBirthdayPost: boolean;
  createdAt: string;
  author: { profile: { username: string; displayName: string; avatarUrl: string | null; blobTint: string | null } | null };
  media: { url: string; type: string; width: number | null; height: number | null }[];
  _count: { comments: number; reactions: number };
}

interface FeedPage {
  data: PostCard[];
  meta: { cursor: string | null; hasMore: boolean };
}

export function useHomeFeed() {
  return useInfiniteQuery({
    queryKey: ['feed', 'home'],
    queryFn: ({ pageParam }) =>
      api<FeedPage>(`/feed/home?limit=15${pageParam ? `&cursor=${pageParam}` : ''}`),
    initialPageParam: '' as string,
    getNextPageParam: (last) => (last.meta.hasMore ? last.meta.cursor : undefined),
  });
}

export function useBirthdaysToday() {
  return useQuery({
    queryKey: ['birthdays-today'],
    queryFn: () =>
      api<{ data: { username: string; displayName: string; avatarUrl: string | null; blobTint: string | null }[] }>(
        '/feed/birthdays-today',
      ),
    staleTime: 60 * 60_000, // birthdays don't change hourly
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { body?: string; media?: unknown[]; isBirthdayPost?: boolean }) =>
      api<{ data: PostCard }>('/feed/posts', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed', 'home'] }),
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) =>
      api<{ data: { emoji: string; reacted: boolean } }>(`/feed/posts/${postId}/reactions`, {
        method: 'POST', body: JSON.stringify({ emoji }),
      }),
    // Optimistic: bump the count instantly, roll back on failure.
    onMutate: async ({ postId }) => {
      await qc.cancelQueries({ queryKey: ['feed', 'home'] });
      const prev = qc.getQueryData(['feed', 'home']);
      qc.setQueryData(['feed', 'home'], (old: { pages: FeedPage[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((pg) => ({
            ...pg,
            data: pg.data.map((p) =>
              p.id === postId ? { ...p, _count: { ...p._count, reactions: p._count.reactions + 1 } } : p,
            ),
          })),
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['feed', 'home'], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['feed', 'home'] }),
  });
}