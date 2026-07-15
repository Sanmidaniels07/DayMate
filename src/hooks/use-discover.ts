'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Match {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  blobTint: string | null;
  score: number;
  reasons: string[];
  sharedInterests: number;
}

export function useDiscover() {
  return useQuery({
    queryKey: ['discover'],
    queryFn: () => api<{ data: Match[] }>('/matching/discover?limit=20'),
    staleTime: 5 * 60_000,
  });
}