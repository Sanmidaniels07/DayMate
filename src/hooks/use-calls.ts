'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Call {
  id: string;
  conversationId: string;
  type: 'VOICE' | 'VIDEO';
  status: string;
  initiator: { profile: { username: string; displayName: string; avatarUrl: string | null; blobTint: string | null } | null };
}

export function useIceServers() {
  return useQuery({
    queryKey: ['ice-servers'],
    queryFn: () => api<{ data: { iceServers: RTCIceServer[] } }>('/calls/ice-servers'),
    staleTime: 10 * 60_000,
  });
}
export function useInitiateCall() {
  return useMutation({
    mutationFn: (body: { conversationId: string; type: 'VOICE' | 'VIDEO' }) =>
      api<{ data: { call: Call; calleeOnline: boolean } }>('/calls', { method: 'POST', body: JSON.stringify(body) }),
  });
}
export function useAnswerCall() {
  return useMutation({ mutationFn: (callId: string) => api(`/calls/${callId}/answer`, { method: 'POST' }) });
}
export function useDeclineCall() {
  return useMutation({ mutationFn: (callId: string) => api(`/calls/${callId}/decline`, { method: 'POST' }) });
}
export function useEndCall() {
  return useMutation({ mutationFn: (callId: string) => api(`/calls/${callId}/end`, { method: 'POST' }) });
}

export function useCallHistory(conversationId: string, enabled = false) {
  return useQuery({
    queryKey: ['call-history', conversationId],
    queryFn: () => api<{ data: {
      id: string; type: 'VOICE' | 'VIDEO'; status: string; startedAt: string;
      endedAt: string | null; durationSec: number | null;
      initiator: { profile: { username: string; displayName: string } | null };
    }[] }>(`/calls/history?conversationId=${conversationId}`),
    enabled: enabled && !!conversationId,
  });
}