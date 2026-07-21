'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MyProfile {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  blobTint: string | null;
  visibility: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';
  showBirthYear: boolean;
  showAge: boolean;
  showAnniversary: boolean;
  showLocation: boolean;
  showOnlineStatus: boolean;
  city: string | null;
  country: string | null;
  anniversaryMonth: number | null;
  anniversaryDay: number | null;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  anniversaryDate?: string | null;   
  showAnniversary?: boolean;
  visibility?: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';
  showBirthYear?: boolean;
  showAge?: boolean;
  showLocation?: boolean;
  showOnlineStatus?: boolean;
  blobTint?: string;
}


export function useMyProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: () => api<{ data: MyProfile }>('/profiles/me'),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileInput) =>   
      api<{ data: MyProfile }>('/profiles/me', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['me-profile'] });
    },
  });
}

export interface NotificationPrefs {
  emailBirthdayDigest: boolean;
  emailFriendRequests: boolean;
  pushMessages: boolean;
  pushCalls: boolean;
  pushBirthdays: boolean;
  pushSocial: boolean;
}

export function useNotificationPrefs() {
  return useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => api<{ data: NotificationPrefs }>('/notifications/preferences'),
  });
}

export function useUpdatePrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<NotificationPrefs>) =>
      api('/notifications/preferences', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-prefs'] }),
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blocked'],
    queryFn: () => api<{ data: { username: string; displayName: string; avatarUrl: string | null; blobTint: string | null }[] }>('/social/blocked'),
  });
}

export function useUnblock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => api(`/social/block/${username}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocked'] }),
  });
}