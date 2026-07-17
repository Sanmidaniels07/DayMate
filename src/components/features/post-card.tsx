"use client";
import { useState } from "react";
import { BlobAvatar } from "@/components/ui/blob-avatar";
import { timeAgo } from "@/lib/time";
import { useToggleReaction, type PostCard as Post } from "@/hooks/use-feed";
import { Heart, MessageCircle, Cake, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { ReportModal } from "@/components/features/report-modal";
import { ReactionsDetail } from "@/components/features/reactions-detail";
import dynamic from 'next/dynamic';


const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
const img = (id: string, w = 800) =>
  CLOUD
    ? `https://res.cloudinary.com/${CLOUD}/image/upload/c_limit,w_${w}/${id}`
    : "";

export function PostCard({ post }: { post: Post }) {
  const [showPicker, setShowPicker] = useState(false);
  const react = useToggleReaction();
  const p = post.author.profile;
  const [reporting, setReporting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  if (!p) return null;

  return (
    <article
      className={`card overflow-hidden transition-shadow hover:shadow-md ${post.isBirthdayPost ? "ring-2 ring-[var(--celebrate)]" : ""}`}
    >
      {post.isBirthdayPost && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-[var(--celebrate-soft)] to-transparent px-5 py-2.5 text-[13px] font-semibold text-[#8a6410]">
          <span className="grid size-5 place-items-center rounded-full bg-[var(--celebrate)]/25">
            <Cake size={12} />
          </span>
          Birthday post
        </div>
      )}
      <div className="flex items-center gap-3 p-4 pb-3">
        <BlobAvatar
          name={p.displayName}
          tint={p.blobTint}
          avatarUrl={p.avatarUrl}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">
            {p.displayName}
          </p>
          <p className="flex items-center gap-1 text-[13px] text-ink-faint">
            @{p.username} <span className="text-[10px]">•</span>{" "}
            {timeAgo(post.createdAt)}
          </p>
        </div>
        <button
          onClick={() => setReporting(true)}
          className="ml-auto grid size-8 place-items-center rounded-full text-ink-faint hover:bg-black/[0.04]"
          aria-label="Report post"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {post.body && (
        <p className="whitespace-pre-wrap px-4 pb-3 text-[15px] leading-relaxed">
          {post.body}
        </p>
      )}

      {post.media.length > 0 && <MediaGrid media={post.media} img={img} />}

     <div className="flex items-center gap-1 p-2">
        <div className="relative">
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-ink-soft transition-colors hover:bg-black/[0.03] active:scale-95"
          >
            <Heart size={18} /> {post._count.reactions > 0 && post._count.reactions}
          </button>
          {showPicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
              <div className="absolute bottom-11 left-0 z-20">
                <EmojiPicker
                  onEmojiClick={(e) => {
                    react.mutate({ postId: post.id, emoji: e.emoji });
                    setShowPicker(false);
                  }}
                  height={360}
                  width={300}
                  previewConfig={{ showPreview: false }}
                  searchDisabled={false}
                  skinTonesDisabled
                />
              </div>
            </>
          )}
        </div>

        {/* Tappable count → reaction breakdown (fixes the orphaned showReactions) */}
        {post._count.reactions > 0 && (
          <button onClick={() => setShowReactions((v) => !v)}
            className="rounded-full px-2 py-2 text-[13px] text-ink-faint hover:text-ink-soft">
            reactions
          </button>
        )}

        <Link
          href={`/post/${post.id}`}
          className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-2 text-[14px] text-ink-soft transition-colors hover:bg-[var(--surface-raised)]"
        >
          <MessageCircle size={18} /> {post._count.comments > 0 && post._count.comments}
        </Link>
      </div>

      {showReactions && (
        <div className="px-4 pb-2"><ReactionsDetail postId={post.id} /></div>
      )}

      {reporting && (
        <ReportModal
          targetType="POST"
          targetId={post.id}
          targetLabel="this post"
          onClose={() => setReporting(false)}
        />
      )}
    </article>
  );
}

function MediaGrid({
  media,
  img,
}: {
  media: { url: string }[];
  img: (id: string, w?: number) => string;
}) {
  const shown = media.slice(0, 4);
  const overflow = media.length - 4;

  if (shown.length === 1) {
    return (
      <img
        src={img(shown[0].url)}
        alt=""
        loading="lazy"
        className="max-h-[520px] w-full object-cover"
      />
    );
  }

  if (shown.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {shown.map((m) => (
          <img
            key={m.url}
            src={img(m.url)}
            alt=""
            loading="lazy"
            className="aspect-[4/5] w-full object-cover"
          />
        ))}
      </div>
    );
  }

  if (shown.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        <img
          src={img(shown[0].url)}
          alt=""
          loading="lazy"
          className="row-span-2 aspect-square w-full object-cover"
        />
        <img
          src={img(shown[1].url)}
          alt=""
          loading="lazy"
          className="aspect-[2/1] w-full object-cover"
        />
        <img
          src={img(shown[2].url)}
          alt=""
          loading="lazy"
          className="aspect-[2/1] w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-0.5">
      {shown.map((m, i) => {
        const isLastWithOverflow = i === 3 && overflow > 0;
        return (
          <div key={m.url} className="relative aspect-square">
            <img
              src={img(m.url)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
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
