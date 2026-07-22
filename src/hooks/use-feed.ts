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
    onSuccess: (res) => {
      const newPost = res.data;
      qc.setQueryData(
        ['feed', 'home'],
        (old: { pages: FeedPage[]; pageParams: unknown[] } | undefined) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;
          return { ...old, pages: [{ ...firstPage, data: [newPost, ...firstPage.data] }, ...rest] };
        },
      );
    },
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  const applyDelta = (postId: string, delta: number) => {
    qc.setQueryData(['feed', 'home'], (old: { pages: FeedPage[] } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((pg) => ({
          ...pg,
          data: pg.data.map((p) =>
            p.id === postId
              ? { ...p, _count: { ...p._count, reactions: Math.max(0, p._count.reactions + delta) } }
              : p,
          ),
        })),
      };
    });
  };

  return useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) =>
      api<{ data: { emoji: string; reacted: boolean } }>(`/feed/posts/${postId}/reactions`, {
        method: 'POST', body: JSON.stringify({ emoji }),
      }),
    
    onMutate: async ({ postId }) => {
      await qc.cancelQueries({ queryKey: ['feed', 'home'] });
      const prev = qc.getQueryData(['feed', 'home']);
      applyDelta(postId, +1);
      return { prev };
    },
    onSuccess: (res, { postId }) => {
      
      if (!res.data.reacted) applyDelta(postId, -2);
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['feed', 'home'], ctx.prev),
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => api<{ data: PostCard }>(`/feed/posts/${postId}`),
    enabled: !!postId,
  });
}

export function useAuthorFeed(username: string) {
  return useInfiniteQuery({
    queryKey: ['feed', 'by', username],
    queryFn: ({ pageParam }) =>
      api<{ data: PostCard[]; meta: { cursor: string | null; hasMore: boolean } }>(
        `/feed/by/${username}?limit=15${pageParam ? `&cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: '' as string,
    getNextPageParam: (last) => (last.meta.hasMore ? last.meta.cursor : undefined),
    enabled: !!username,
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api(`/feed/posts/${postId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed', 'home'] }),
  });
}

export function usePostMedia() {
  return async (file: File): Promise<{ publicId: string; type: 'image' } | null> => {
    try {
      const { data: sig } = await api<{ data: {
        signature: string; timestamp: number; apiKey: string; folder: string;
        public_id: string; transformation?: string; uploadUrl: string;
      } }>('/feed/posts/media/sign', { method: 'POST' });
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.apiKey);
      fd.append('timestamp', String(sig.timestamp));
      fd.append('signature', sig.signature);
      fd.append('folder', sig.folder);
      fd.append('public_id', sig.public_id);
      if (sig.transformation) fd.append('transformation', sig.transformation);
      const res = await fetch(sig.uploadUrl, { method: 'POST', body: fd });
      if (!res.ok) return null;
      const cloud = await res.json();
      return { publicId: cloud.public_id, type: 'image' };
    } catch { return null; }
  };
}

export function usePostReactions(postId: string, enabled = false) {
  return useQuery({
    queryKey: ['reactions', postId],
    queryFn: () => api<{ data: { emoji: string; count: number; reactedByMe: boolean }[] }>(
      `/feed/posts/${postId}/reactions`,
    ),
    enabled: enabled && !!postId,
  });
}

export function useEditPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: string }) =>
      api<{ data: PostCard }>(`/feed/posts/${postId}`, {
        method: 'PATCH', body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

