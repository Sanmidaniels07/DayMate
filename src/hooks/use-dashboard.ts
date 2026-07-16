'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useMyCommunitiesCount() {
  return useQuery({
    queryKey: ['communities', 'mine'],
    queryFn: () => api<{ data: unknown[] }>('/communities/mine'),
    staleTime: 5 * 60_000,
  });
}
export function useFriendsCount() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => api<{ data: unknown[] }>('/social/friends'),
    staleTime: 5 * 60_000,
  });
}
export function useIncomingCount() {
  return useQuery({
    queryKey: ['requests', 'incoming'],
    queryFn: () => api<{ data: unknown[] }>('/social/requests/incoming'),
    staleTime: 60_000,
  });
}