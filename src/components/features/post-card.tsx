'use client';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { timeAgo } from '@/lib/time';
import { useToggleReaction, type PostCard as Post } from '@/hooks/use-feed';
import { Heart, MessageCircle, Cake } from 'lucide-react';
import Link from 'next/link';

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
const img = (id: string, w = 800) =>
  CLOUD ? `https://res.cloudinary.com/${CLOUD}/image/upload/c_limit,w_${w}/${id}` : '';

export function PostCard({ post }: { post: Post }) {
  const react = useToggleReaction();
  const p = post.author.profile;
  if (!p) return null;

  return (
    <article className={`card overflow-hidden transition-shadow hover:shadow-md ${post.isBirthdayPost ? 'ring-2 ring-[var(--celebrate)]' : ''}`}>
      {post.isBirthdayPost && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-[var(--celebrate-soft)] to-transparent px-5 py-2.5 text-[13px] font-semibold text-[#8a6410]">
          <span className="grid size-5 place-items-center rounded-full bg-[var(--celebrate)]/25">
            <Cake size={12} />
          </span>
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
      </div>

      {post.body && <p className="whitespace-pre-wrap px-4 pb-3 text-[15px] leading-relaxed">{post.body}</p>}

      {post.media.length > 0 && <MediaGrid media={post.media} img={img} />}

      <div className="flex items-center gap-1 p-2">
        {/* Reverted to always-outline: `hasReacted` isn't on the PostCard
            type, so there's no per-user state to key the filled heart off
            yet. See note below for how to wire it up properly. */}
        <button
          onClick={() => react.mutate({ postId: post.id, emoji: '❤️' })}
          className="group flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-ink-soft transition-colors hover:bg-[var(--surface-raised)] active:scale-95"
        >
          <Heart size={18} className="transition-transform group-active:scale-125" />
          {post._count.reactions > 0 && post._count.reactions}
        </button>
        <Link href={`/post/${post.id}`}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-ink-soft transition-colors hover:bg-[var(--surface-raised)]">
          <MessageCircle size={18} /> {post._count.comments > 0 && post._count.comments}
        </Link>
      </div>
    </article>
  );
}

function MediaGrid({ media, img }: { media: { url: string }[]; img: (id: string, w?: number) => string }) {
  const shown = media.slice(0, 4);
  const overflow = media.length - 4;

  if (shown.length === 1) {
    return (
      <img src={img(shown[0].url)} alt="" loading="lazy"
        className="max-h-[520px] w-full object-cover" />
    );
  }

  if (shown.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {shown.map((m) => (
          <img key={m.url} src={img(m.url)} alt="" loading="lazy"
            className="aspect-[4/5] w-full object-cover" />
        ))}
      </div>
    );
  }

  if (shown.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        <img src={img(shown[0].url)} alt="" loading="lazy"
          className="row-span-2 aspect-square w-full object-cover" />
        <img src={img(shown[1].url)} alt="" loading="lazy"
          className="aspect-[2/1] w-full object-cover" />
        <img src={img(shown[2].url)} alt="" loading="lazy"
          className="aspect-[2/1] w-full object-cover" />
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