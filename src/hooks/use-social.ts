'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface ProfileView {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  blobTint: string | null;
  isOwner: boolean;
  birthMonth: number;
  birthDay: number;
  ageBracket?: string;
  city?: string | null;
  country?: string | null;
  relationship: {
    isFriend: boolean;
    isFollowing: boolean;
    pendingRequest: { requestId: string; direction: 'incoming' | 'outgoing' } | null;
  } | null;
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => api<{ data: ProfileView }>(`/profiles/${username}`),
    enabled: !!username,
  });
}

function useSocialAction(username: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['profile', username] });
}

export function useSendRequest(username: string) {
  const done = useSocialAction(username);
  return useMutation({
    mutationFn: () => api('/social/requests', { method: 'POST', body: JSON.stringify({ username }) }),
    onSuccess: done,
  });
}
export function useCancelRequest(username: string) {
  const done = useSocialAction(username);
  return useMutation({
    mutationFn: (requestId: string) => api(`/social/requests/${requestId}/cancel`, { method: 'POST' }),
    onSuccess: done,
  });
}
export function useAcceptRequest(username: string) {
  const done = useSocialAction(username);
  return useMutation({
    mutationFn: (requestId: string) => api(`/social/requests/${requestId}/accept`, { method: 'POST' }),
    onSuccess: done,
  });
}
export function useToggleFollow(username: string, isFollowing: boolean) {
  const done = useSocialAction(username);
  return useMutation({
    mutationFn: () =>
      api(`/social/follow/${username}`, { method: isFollowing ? 'DELETE' : 'POST' }),
    onSuccess: done,
  });
}
export function useUnfriend(username: string) {
  const done = useSocialAction(username);
  return useMutation({
    mutationFn: () => api(`/social/friends/${username}`, { method: 'DELETE' }),
    onSuccess: done,
  });
}

export interface RequestRow {
  requestId: string;
  sentAt: string;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    blobTint: string | null;
  };
}

export interface FriendRow {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  blobTint: string | null;
  friendsSince?: string;
}

export function useIncomingRequests() {
  return useQuery({
    queryKey: ['requests', 'incoming'],
    queryFn: () => api<{ data: RequestRow[] }>('/social/requests/incoming'),
  });
}
export function useOutgoingRequests() {
  return useQuery({
    queryKey: ['requests', 'outgoing'],
    queryFn: () => api<{ data: RequestRow[] }>('/social/requests/outgoing'),
  });
}
export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => api<{ data: FriendRow[] }>('/social/friends'),
  });
}
export function useFollowers() {
  return useQuery({
    queryKey: ['followers'],
    queryFn: () => api<{ data: FriendRow[] }>('/social/followers'),
  });
}
export function useFollowing() {
  return useQuery({
    queryKey: ['following'],
    queryFn: () => api<{ data: FriendRow[] }>('/social/following'),
  });
}

/** Accept/decline from the inbox — invalidates the request lists + friends. */
export function useRespondToRequest() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['requests'] });
    qc.invalidateQueries({ queryKey: ['friends'] });
  };
  const accept = useMutation({
    mutationFn: (id: string) => api(`/social/requests/${id}/accept`, { method: 'POST' }),
    onSuccess: invalidate,
  });
  const decline = useMutation({
    mutationFn: (id: string) => api(`/social/requests/${id}/decline`, { method: 'POST' }),
    onSuccess: invalidate,
  });
  return { accept, decline };
}