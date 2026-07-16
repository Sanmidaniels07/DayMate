'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () =>
      api<{ data: { username: string; displayName: string; avatarUrl: string | null; blobTint: string | null; bio: string | null }[] }>(
        `/profiles/search?q=${encodeURIComponent(query)}`,
      ),
    enabled: query.trim().length >= 2, // backend requires min 2
    staleTime: 30_000,
  });
}