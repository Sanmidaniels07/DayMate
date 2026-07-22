'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Profile {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  blobTint: string | null;
  visibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';
  createdAt: string;
}

export function useUsernameAvailable(username: string) {
  return useQuery({
    queryKey: ['username-available', username],
    queryFn: () =>
      api<{ data: { available: boolean } }>(
        `/profiles/username-available?u=${encodeURIComponent(username)}`,
      ),
    enabled: username.length >= 3,
    staleTime: 60_000,
  });
}

export function useSetupProfile() {
  return useMutation({
    mutationFn: (body: { username: string; displayName: string; bio?: string; city?: string; country?: string }) =>
      api<{ data: Profile }>('/profiles/setup', { method: 'POST', body: JSON.stringify(body) }),
  });
}

export function useInterests() {
  return useQuery({
    queryKey: ['interests'],
    queryFn: () => api<{ data: { id: string; name: string; slug: string }[] }>('/profiles/interests'),
    staleTime: Infinity,
  });
}

export function useSetInterests() {
  return useMutation({
    mutationFn: (interestIds: string[]) =>
      api<{ data: unknown }>('/profiles/me/interests', {
        method: 'PUT', body: JSON.stringify({ interestIds }),
      }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/profiles/me', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me-profile'] }),
  });
}