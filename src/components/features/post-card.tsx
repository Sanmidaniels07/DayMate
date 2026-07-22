import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { BlobAvatar } from "@/components/ui/blob-avatar";
import { timeAgo } from "@/lib/time";
import { useToggleReaction, useEditPost, useDeletePost, type PostCard as Post } from "@/hooks/use-feed";
import { Heart, MessageCircle, Cake, MoreHorizontal, Check, X as XIcon } from "lucide-react";
import Link from "next/link";
import { ReportModal } from "@/components/features/report-modal";
import { ReactionsDetail } from "@/components/features/reactions-detail";
import { useSessionStore } from "@/stores/session";
import { toast } from "@/components/ui/toast";
import dynamic from 'next/dynamic';
import { PostActionsMenu } from "./post-action-menu";

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
const img = (id: string, w = 800) =>
  CLOUD ? `https://res.cloudinary.com/${CLOUD}/image/upload/c_limit,w_${w}/${id}` : "";

export function PostCard({ post }: { post: Post }) {
  const [showPicker, setShowPicker] = useState(false);
  const react = useToggleReaction();
  const p = post.author.profile;
  const [reporting, setReporting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body ?? '');

  const editPost = useEditPost();
  const deletePost = useDeletePost();
  const myUsername = useSessionStore((s) => s.user?.username);
  const isMine = !!myUsername && myUsername === p?.username;

  if (!p) return null;

  const hasReacted = post._count.reactions > 0;

  const saveEdit = () => {
    const body = editBody.trim();
    if (!body) return;
    editPost.mutate({ postId: post.id, body }, {
      onSuccess: () => { setEditing(false); toast.success('Post updated'); },
      onError: () => toast.error('Could not update post'),
    });
  };

  const confirmDelete = () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    deletePost.mutate(post.id, {
      onSuccess: () => toast.success('Post deleted'),
      onError: () => toast.error('Could not delete post'),
    });
  };

    const menuAnchorRef = useRef<HTMLButtonElement>(null);


  return (
    <article
      className="card group relative overflow-hidden transition-all duration-300 hover:shadow-[var(--glow-accent)]"
      style={post.isBirthdayPost ? { boxShadow: '0 0 0 2px var(--celebrate), var(--shadow-card)' } : undefined}
    >
      {post.isBirthdayPost && (
        <div className="relative flex items-center gap-2 overflow-hidden px-5 py-2.5 text-[13px] font-semibold text-[#8a6410]"
          style={{ background: 'linear-gradient(90deg, var(--celebrate-soft), transparent)' }}>
          <motion.span
            className="grid size-5 place-items-center rounded-full bg-[var(--celebrate)]/25"
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
          >
            <Cake size={12} />
          </motion.span>
          Birthday post
        </div>
      )}
      <div className="flex items-center gap-3 p-4 pb-3">
        <BlobAvatar name={p.displayName} tint={p.blobTint} avatarUrl={p.avatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">{p.displayName}</p>
          <p className="flex items-center gap-1 text-[13px] text-ink-faint">
            @{p.username} <span className="text-[10px]">•</span> {timeAgo(post.createdAt)}
          </p>
        </div>
        <button
          ref={menuAnchorRef}
          onClick={() => setMenuOpen(true)}
          className="ml-auto grid size-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-[var(--accent-soft)] hover:text-accent"
          aria-label="Post options"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {editing ? (
        <div className="px-4 pb-3">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            maxLength={2000}
            autoFocus
            className="w-full resize-none rounded-xl border border-[var(--hairline)] bg-[var(--surface-raised)] px-3.5 py-2.5 text-[15px] leading-relaxed outline-none focus:border-accent"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => { setEditing(false); setEditBody(post.body ?? ''); }}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium text-ink-soft hover:bg-[var(--surface-raised)]">
              <XIcon size={14} /> Cancel
            </button>
            <button onClick={saveEdit} disabled={editPost.isPending || !editBody.trim()}
              className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
              <Check size={14} /> {editPost.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        post.body && (
          <p className="whitespace-pre-wrap px-4 pb-3 text-[15px] leading-relaxed">{post.body}</p>
        )
      )}

      {post.media.length > 0 && <MediaGrid media={post.media} img={img} />}

      <div className="flex items-center gap-1 p-2">
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowPicker((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] transition-colors ${
              hasReacted ? 'text-danger' : 'text-ink-soft hover:bg-[var(--accent-soft)] hover:text-accent'
            }`}
          >
            <Heart size={18} className={hasReacted ? 'fill-danger' : ''} />
            {post._count.reactions > 0 && post._count.reactions}
          </motion.button>
          {showPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
              <div className="absolute bottom-11 left-0 z-20 overflow-hidden rounded-2xl shadow-[var(--shadow-float)]">
                <EmojiPicker
                  onEmojiClick={(e) => { react.mutate({ postId: post.id, emoji: e.emoji }); setShowPicker(false); }}
                  height={360} width={300}
                  previewConfig={{ showPreview: false }}
                  searchDisabled={false}
                  skinTonesDisabled
                />
              </div>
            </>
          )}
        </div>

        {post._count.reactions > 0 && (
          <button onClick={() => setShowReactions((v) => !v)}
            className="rounded-full px-2 py-2 text-[13px] text-ink-faint transition-colors hover:text-accent">
            reactions
          </button>
        )}

        <Link href={`/post/${post.id}`}
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-ink-soft transition-colors hover:bg-[var(--accent-soft)] hover:text-accent">
          <MessageCircle size={18} /> {post._count.comments > 0 && post._count.comments}
        </Link>
      </div>

      {showReactions && (
        <div className="px-4 pb-2"><ReactionsDetail postId={post.id} /></div>
      )}

      <PostActionsMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isMine={isMine}
        onEdit={() => setEditing(true)}
        onDelete={confirmDelete}
        onReport={() => setReporting(true)}
        anchorRef={menuAnchorRef}
      />

      {reporting && (
        <ReportModal targetType="POST" targetId={post.id} targetLabel="this post" onClose={() => setReporting(false)} />
      )}
    </article>
  );
}

// MediaGrid unchanged — keep as-is

function MediaGrid({ media, img }: { media: { url: string }[]; img: (id: string, w?: number) => string }) {
  const shown = media.slice(0, 4);
  const overflow = media.length - 4;

  if (shown.length === 1) {
    return <img src={img(shown[0].url)} alt="" loading="lazy" className="max-h-[520px] w-full object-cover" />;
  }
  if (shown.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {shown.map((m) => <img key={m.url} src={img(m.url)} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />)}
      </div>
    );
  }
  if (shown.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        <img src={img(shown[0].url)} alt="" loading="lazy" className="row-span-2 aspect-square w-full object-cover" />
        <img src={img(shown[1].url)} alt="" loading="lazy" className="aspect-[2/1] w-full object-cover" />
        <img src={img(shown[2].url)} alt="" loading="lazy" className="aspect-[2/1] w-full object-cover" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {shown.map((m, i) => {
        const isLastWithOverflow = i === 3 && overflow > 0;
        return (
          <div key={m.url} className="relative aspect-square">
            <img src={img(m.url)} alt="" loading="lazy" className="h-full w-full object-cover" />
            {isLastWithOverflow && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[17px] font-semibold text-white backdrop-blur-[1px]">
                +{overflow}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}