'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

export function useCoverUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<string | null> {
    setUploading(true);
    setError(null);
    try {
      const { data: sig } = await api<{ data: {
        signature: string; timestamp: number; apiKey: string; folder: string;
        public_id: string; overwrite: string; transformation?: string; uploadUrl: string;
      } }>('/profiles/me/cover/sign', { method: 'POST' });

      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.apiKey);
      fd.append('timestamp', String(sig.timestamp));
      fd.append('signature', sig.signature);
      fd.append('folder', sig.folder);
      fd.append('public_id', sig.public_id);
      fd.append('overwrite', sig.overwrite);
      if (sig.transformation) fd.append('transformation', sig.transformation);

      const res = await fetch(sig.uploadUrl, { method: 'POST', body: fd });
      if (!res.ok) { setError('Upload failed'); return null; }
      const cloud = await res.json();

      await api('/profiles/me/cover/confirm', {
        method: 'POST',
        body: JSON.stringify({ publicId: cloud.public_id }),
      });

      return cloud.public_id as string;
    } catch {
      setError('Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}