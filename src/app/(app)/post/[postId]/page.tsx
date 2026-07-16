'use client';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { usePost, useDeletePost } from '@/hooks/use-feed';
import { useMyProfile } from '@/hooks/use-settings';
import { PostCard } from '@/components/features/post-card';
import { CommentThread } from '@/components/features/comment-thread';

export default function PostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = use(params);
  const { data, isLoading, error } = usePost(postId);
  const router = useRouter();
  const me = useMyProfile();
  const del = useDeletePost();
  const isMine = data?.data.author.profile?.username === me.data?.data.username;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/home"><ArrowLeft size={22} /></Link>
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">Post</h1>
        {isMine && (
          <button onClick={() => del.mutate(postId, { onSuccess: () => router.replace('/home') })}
            className="ml-auto flex items-center gap-1 text-[13px] text-danger">
            <Trash2 size={15} /> Delete
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : error || !data ? (
        <div className="card p-10 text-center text-ink-soft">This post isn&apos;t available.</div>
      ) : (
        <>
          <PostCard post={data.data} />
          <div className="card p-5">
            <CommentThread postId={postId} />
          </div>
        </>
      )}
    </div>
  );
}