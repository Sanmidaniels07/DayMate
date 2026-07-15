'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useUsernameAvailable(username: string) {
  return useQuery({
    queryKey: ['username-available', username],
    queryFn: () =>
      api<{ data: { available: boolean } }>(
        `/profiles/username-available?username=${encodeURIComponent(username)}`,
      ),
    enabled: username.length >= 3,
    staleTime: 60_000,
  });
}

export function useSetupProfile() {
  return useMutation({
    mutationFn: (body: { username: string; displayName: string; bio?: string; city?: string; country?: string }) =>
      api<{ data: unknown }>('/profiles', { method: 'POST', body: JSON.stringify(body) }),
  });
}

export function useInterests() {
  return useQuery({
    queryKey: ['interests'],
    queryFn: () => api<{ data: { id: string; name: string; slug: string }[] }>('/profiles/interests'),
    staleTime: Infinity, // the catalog is static
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