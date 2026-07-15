'use client';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { timeAgo } from '@/lib/time';
import { useToggleReaction, type PostCard as Post } from '@/hooks/use-feed';
import { Heart, MessageCircle } from 'lucide-react';

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
const img = (id: string, w = 800) =>
  CLOUD ? `https://res.cloudinary.com/${CLOUD}/image/upload/c_limit,w_${w}/${id}` : '';

export function PostCard({ post }: { post: Post }) {
  const react = useToggleReaction();
  const p = post.author.profile;
   if (!p) return null;

  return (
    <article className={`card overflow-hidden ${post.isBirthdayPost ? 'ring-2 ring-[var(--celebrate)]' : ''}`}>
      {post.isBirthdayPost && (
        <div className="bg-[var(--celebrate-soft)] px-5 py-2 text-[13px] font-semibold text-[#8a6410]">
          🎂 Birthday post
        </div>
      )}
      <div className="flex items-center gap-3 p-4 pb-3">
        <BlobAvatar name={p.displayName} tint={p.blobTint} avatarUrl={p.avatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">{p.displayName}</p>
          <p className="text-[13px] text-ink-faint">@{p.username} · {timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {post.body && <p className="whitespace-pre-wrap px-4 pb-3 text-[15px] leading-relaxed">{post.body}</p>}

      {post.media.length > 0 && (
        <div className={`grid gap-0.5 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.media.map((m) => (
            <img key={m.url} src={img(m.url)} alt="" loading="lazy"
              className="aspect-square w-full object-cover sm:aspect-auto" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 p-2">
        <button onClick={() => react.mutate({ postId: post.id, emoji: '❤️' })}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-ink-soft transition-colors hover:bg-black/[0.03] active:scale-95">
          <Heart size={18} /> {post._count.reactions > 0 && post._count.reactions}
        </button>
        <button className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-ink-soft transition-colors hover:bg-black/[0.03]">
          <MessageCircle size={18} /> {post._count.comments > 0 && post._count.comments}
        </button>
      </div>
    </article>
  );
}