'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

interface SignResponse {
  data: {
    signature: string; timestamp: number; apiKey: string; cloudName: string;
    folder: string; public_id: string; transformation?: string; uploadUrl: string;
  };
}

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File): Promise<string | null> {
    setUploading(true);
    setError(null);
    try {
      // 1. Get a signed grant from our backend
      const { data: sig } = await api<SignResponse>('/profiles/me/avatar/sign', { method: 'POST' });

      // 2. Upload directly to Cloudinary (bytes never touch our server)
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sig.apiKey);
      fd.append('timestamp', String(sig.timestamp));
      fd.append('signature', sig.signature);
      fd.append('folder', sig.folder);
      fd.append('public_id', sig.public_id);
      fd.append('overwrite', 'true');
      if (sig.transformation) fd.append('transformation', sig.transformation);

      const cloudRes = await fetch(sig.uploadUrl, { method: 'POST', body: fd });
      if (!cloudRes.ok) throw new Error('Upload failed');
      const cloud = await cloudRes.json();

      // 3. Confirm with our backend — it validates the public id is ours,
      // and we pass the Cloudinary version so re-uploads bust the CDN cache
      // (the public_id is fixed via overwrite:true, so without a version
      // stamp the delivery URL never changes and the old image stays cached).
      await api('/profiles/me/avatar/confirm', {
        method: 'POST', body: JSON.stringify({ publicId: cloud.public_id, version: cloud.version }),
      });
      return cloud.public_id as string;
    } catch {
      setError('Could not upload that image. Try another.');
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading, error };
}