'use client';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Comment {
  id: string;
  body: string | null;
  parentId: string | null;
  createdAt: string;
  author: { profile: { username: string; displayName: string; avatarUrl: string | null; blobTint: string | null } | null };
  _count: { replies: number; reactions: number };
  replies?: Comment[]; // top-level comments carry their replies inline
}

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam }) =>
      api<{ data: Comment[]; meta: { cursor: string | null; hasMore: boolean } }>(
        `/feed/posts/${postId}/comments?limit=20${pageParam ? `&cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: '' as string,
    getNextPageParam: (last) => (last.meta.hasMore ? last.meta.cursor : undefined),
    enabled: !!postId,
  });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; parentId?: string }) =>
      api<{ data: Comment }>(`/feed/posts/${postId}/comments`, {
        method: 'POST', body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['feed', 'home'] }); // refresh the comment count on the card
    },
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      api(`/feed/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', postId] }),
  });
}