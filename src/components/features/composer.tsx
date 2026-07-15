'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCreatePost } from '@/hooks/use-feed';
import { useSessionStore } from '@/stores/session';
import { BlobAvatar } from '@/components/ui/blob-avatar';

export function Composer() {
  const [body, setBody] = useState('');
  const create = useCreatePost();
  const user = useSessionStore((s) => s.user);

  const post = () => {
    if (!body.trim()) return;
    create.mutate({ body: body.trim() }, { onSuccess: () => setBody('') });
  };

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <BlobAvatar name={user?.fullName ?? ''} size={40} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's the occasion?"
          rows={body ? 3 : 1}
          maxLength={2000}
          className="flex-1 resize-none bg-transparent pt-2 text-[15px] outline-none placeholder:text-ink-faint"
        />
      </div>
      {body && (
        <div className="mt-3 flex items-center justify-between pl-[52px]">
          <span className="font-mono text-[12px] text-ink-faint">{body.length}/2000</span>
          <Button onClick={post} loading={create.isPending} className="h-10 px-5">Post</Button>
        </div>
      )}
    </div>
  );
}