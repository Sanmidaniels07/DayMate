'use client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Community {
  id: string;
  type: 'BIRTHDAY' | 'BIRTH_MONTH' | 'AGE_BRACKET';
  name: string;
  month?: number | null;
  day?: number | null;
  bracket?: string | null;
  memberCount?: number;
}

export interface MyCommunity extends Community {
  joinMethod: 'AUTO' | 'MANUAL';
}

export interface CommunityDetail extends Community {
  membership: { joinMethod: 'AUTO' | 'MANUAL' } | null; // null if not a member
}

export interface MemberRow {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  blobTint: string | null;
}

export function useMyCommunities() {
  return useQuery({
    queryKey: ['communities', 'mine'],
    queryFn: () => api<{ data: MyCommunity[] }>('/communities/mine'),
  });
}

export function useBrowseCommunities(type?: string) {
  return useInfiniteQuery({
    queryKey: ['communities', 'browse', type ?? 'all'],
    queryFn: ({ pageParam }) =>
      api<{ data: Community[]; meta: { cursor: string | null; hasMore: boolean } }>(
        `/communities?limit=20${type ? `&type=${type}` : ''}${pageParam ? `&cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: '' as string,
    getNextPageParam: (last) => (last.meta.hasMore ? last.meta.cursor : undefined),
  });
}

export function useCommunity(id: string) {
  return useQuery({
    queryKey: ['community', id],
    queryFn: () => api<{ data: CommunityDetail }>(`/communities/${id}`),
    enabled: !!id,
  });
}

export function useCommunityMembers(id: string) {
  return useInfiniteQuery({
    queryKey: ['community', id, 'members'],
    queryFn: ({ pageParam }) =>
      api<{ data: MemberRow[]; meta: { cursor: string | null; hasMore: boolean } }>(
        `/communities/${id}/members?limit=30${pageParam ? `&cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: '' as string,
    getNextPageParam: (last) => (last.meta.hasMore ? last.meta.cursor : undefined),
    enabled: !!id,
  });
}

export function useJoinCommunity(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/communities/${id}/join`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', id] });
      qc.invalidateQueries({ queryKey: ['communities', 'mine'] });
    },
  });
}

export function useLeaveCommunity(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/communities/${id}/leave`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', id] });
      qc.invalidateQueries({ queryKey: ['communities', 'mine'] });
    },
  });
}

export function useAutoJoin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      api('/communities/auto-join', { method: 'PATCH', body: JSON.stringify({ enabled }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communities', 'mine'] }),
  });
}