'use client';
import { useState } from 'react';
import { Trash2, Flag } from 'lucide-react';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { Button } from '@/components/ui/button';
import { timeAgo } from '@/lib/time';
import { useSessionStore } from '@/stores/session';
import { useComments, useAddComment, useDeleteComment, type Comment } from '@/hooks/use-comments';
import { ReportModal } from '@/components/features/report-modal';

export function CommentThread({ postId }: { postId: string }) {
  const comments = useComments(postId);
  const add = useAddComment(postId);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const rows = comments.data?.pages.flatMap((p) => p.data) ?? [];

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    add.mutate(
      { body, parentId: replyTo?.id },
      { onSuccess: () => { setText(''); setReplyTo(null); } },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {comments.isLoading ? (
        <div className="flex justify-center py-6">
          <span className="size-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-ink-soft">Be the first to comment.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((c) => (
            <CommentItem key={c.id} comment={c} postId={postId} onReply={(name) => setReplyTo({ id: c.id, name })} />
          ))}
          {comments.hasNextPage && (
            <button onClick={() => comments.fetchNextPage()} className="text-[13px] text-accent">
              Load more comments
            </button>
          )}
        </div>
      )}

      {/* Composer — pinned feel */}
      <div className="sticky bottom-0 flex flex-col gap-2 bg-surface pt-2">
        {replyTo && (
          <div className="flex items-center justify-between rounded-lg bg-black/[0.04] px-3 py-1.5 text-[13px] text-ink-soft">
            Replying to {replyTo.name}
            <button onClick={() => setReplyTo(null)} className="text-ink-faint">✕</button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={replyTo ? 'Write a reply…' : 'Add a comment…'}
            maxLength={1000}
            className="h-11 flex-1 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--surface-raised)] px-4 text-[15px] outline-none focus:border-accent"
          />
          <Button onClick={submit} loading={add.isPending} disabled={!text.trim()} className="h-11 px-5">
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment, postId, onReply,
}: { comment: Comment; postId: string; onReply: (name: string) => void }) {
  const meId = useSessionStore((s) => s.user?.id);
  const del = useDeleteComment(postId);
  const [reporting, setReporting] = useState(false);
  const p = comment.author.profile;
  if (!p) return null;

  return (
    <div className="flex gap-3">
      <BlobAvatar name={p.displayName} tint={p.blobTint} avatarUrl={p.avatarUrl} size={36} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-[var(--surface-raised)] border border-[var(--hairline)] px-4 py-2.5">
          <p className="text-[14px] font-semibold leading-tight">{p.displayName}</p>
          <p className="mt-0.5 text-[15px] leading-relaxed">{comment.body}</p>
        </div>
        <div className="mt-1 flex items-center gap-3 pl-1 text-[12px] text-ink-faint">
          <span>{timeAgo(comment.createdAt)}</span>
          <button onClick={() => onReply(p.displayName)} className="font-medium">Reply</button>
          <button onClick={() => del.mutate(comment.id)} className="flex items-center gap-1 hover:text-danger">
            <Trash2 size={13} />
          </button>
          <button onClick={() => setReporting(true)} className="hover:text-danger" aria-label="Report comment">
            <Flag size={12} />
          </button>
        </div>

        {/* Inline replies (one level) */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 border-l-2 border-[var(--hairline)] pl-3">
            {comment.replies.map((r) => {
              const rp = r.author.profile;
              if (!rp) return null;
              return (
                <div key={r.id} className="flex gap-2">
                  <BlobAvatar name={rp.displayName} tint={rp.blobTint} avatarUrl={rp.avatarUrl} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="rounded-2xl bg-[var(--surface-raised)] border border-[var(--hairline)] px-3 py-2">
                      <p className="text-[13px] font-semibold leading-tight">{rp.displayName}</p>
                      <p className="mt-0.5 text-[14px] leading-relaxed">{r.body}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-3 pl-1 text-[11px] text-ink-faint">
                      <span>{timeAgo(r.createdAt)}</span>
                      {r.author.profile && meId && (
                        <button onClick={() => del.mutate(r.id)} className="hover:text-danger"><Trash2 size={12} /></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {reporting && (
          <ReportModal targetType="COMMENT" targetId={comment.id} targetLabel="this comment"
            onClose={() => setReporting(false)} />
        )}
      </div>
    </div>
  );
}