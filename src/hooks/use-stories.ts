'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface StorySlide {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption: string | null;
  createdAt: string;
  viewed: boolean;
}

export interface StoryGroup {
  userId: string;
  profile: { username: string; displayName: string; avatarUrl: string | null; blobTint: string | null };
  viewed: boolean;
  slides: StorySlide[];
}

export function useStories() {
  return useQuery({
    queryKey: ['stories'],
    queryFn: () => api<{ data: StoryGroup[] }>('/stories'),
    staleTime: 30_000,
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO'; caption?: string }) =>
      api<{ data: StorySlide }>('/stories', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useViewStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) => api(`/stories/${storyId}/view`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}

export function useReactToStory() {
  return useMutation({
    mutationFn: ({ storyId, emoji }: { storyId: string; emoji: string }) =>
      api<{ data: { reacted: boolean; emoji?: string } }>(`/stories/${storyId}/react`, {
        method: 'POST', body: JSON.stringify({ emoji }),
      }),
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) => api(`/stories/${storyId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories'] }),
  });
}

/** Signed upload grant, mirroring useAvatarUpload's pattern for stories. */
export function useStoryUpload() {
  async function uploadStorySlide(file: File, kind: 'image' | 'video'): Promise<string | null> {
    try {
      const { data: sig } = await api<{ data: {
        signature: string; timestamp: number; apiKey: string; folder: string;
        public_id: string; transformation?: string; uploadUrl: string; resourceType: string;
      } }>(`/stories/media/sign?kind=${kind}`, { method: 'POST' });

      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.apiKey);
      fd.append('timestamp', String(sig.timestamp));
      fd.append('signature', sig.signature);
      fd.append('folder', sig.folder);
      fd.append('public_id', sig.public_id);
      if (sig.transformation) fd.append('transformation', sig.transformation);

      const res = await fetch(sig.uploadUrl, { method: 'POST', body: fd });
      if (!res.ok) return null;
      const cloud = await res.json();
      return cloud.public_id as string;
    } catch {
      return null;
    }
  }
  return { uploadStorySlide };
}