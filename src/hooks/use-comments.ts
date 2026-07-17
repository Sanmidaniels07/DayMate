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
  replies?: Comment[]; 
}

interface CommentsPage {
  data: Comment[];
  meta: { cursor: string | null; hasMore: boolean };
}


function bumpFeedCommentCount(
  qc: ReturnType<typeof useQueryClient>,
  postId: string,
  delta: number,
) {
  qc.setQueryData(
    ['feed', 'home'],
    (old: { pages: { data: { id: string; _count: { comments: number; reactions: number } }[] }[] } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((pg) => ({
          ...pg,
          data: pg.data.map((p) =>
            p.id === postId
              ? { ...p, _count: { ...p._count, comments: Math.max(0, p._count.comments + delta) } }
              : p,
          ),
        })),
      };
    },
  );
}

export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam }) =>
      api<CommentsPage>(
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
    onSuccess: (res, { parentId }) => {
      const comment = res.data;

      qc.setQueryData(
        ['comments', postId],
        (old: { pages: CommentsPage[]; pageParams: unknown[] } | undefined) => {
          if (!old) return old;
          const [firstPage, ...rest] = old.pages;

          if (!parentId) {
            return { ...old, pages: [{ ...firstPage, data: [comment, ...firstPage.data] }, ...rest] };
          }

          return {
            ...old,
            pages: old.pages.map((pg) => ({
              ...pg,
              data: pg.data.map((c) =>
                c.id === parentId
                  ? {
                      ...c,
                      replies: [...(c.replies ?? []), comment],
                      _count: { ...c._count, replies: c._count.replies + 1 },
                    }
                  : c,
              ),
            })),
          };
        },
      );

      bumpFeedCommentCount(qc, postId, +1);
    },
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      api(`/feed/comments/${commentId}`, { method: 'DELETE' }),
   
    onMutate: async (commentId: string) => {
      await qc.cancelQueries({ queryKey: ['comments', postId] });
      const prev = qc.getQueryData(['comments', postId]);

      qc.setQueryData(
        ['comments', postId],
        (old: { pages: CommentsPage[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((pg) => ({
              ...pg,
             
              data: pg.data
                .filter((c) => c.id !== commentId)
                .map((c) =>
                  c.replies?.some((r) => r.id === commentId)
                    ? {
                        ...c,
                        replies: c.replies.filter((r) => r.id !== commentId),
                        _count: { ...c._count, replies: Math.max(0, c._count.replies - 1) },
                      }
                    : c,
                ),
            })),
          };
        },
      );

      bumpFeedCommentCount(qc, postId, -1);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['comments', postId], ctx.prev);
      bumpFeedCommentCount(qc, postId, +1); // undo the optimistic decrement
    },
  });
}