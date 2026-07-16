"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PresenceAvatar } from "@/components/ui/presence-avatar";
import { getBlobTintVar } from "@/components/ui/blob-avatar";
import { Button } from "@/components/ui/button";
import { RelationshipButton } from "@/components/features/relationship-button";
import { ReportModal } from "@/components/features/report-modal";
import { useProfile, useToggleFollow } from "@/hooks/use-social";
import { usePresence } from "@/hooks/use-presence";
import { useAuthorFeed } from "@/hooks/use-feed";
import { PostCard } from "@/components/features/post-card";
import { MONTHS } from "@/lib/months";
import { timeAgo } from "@/lib/time";
import { Cake, MapPin, MoreHorizontal } from "lucide-react";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const router = useRouter();
  const { data, isLoading, error } = useProfile(username);

  const p = data?.data;
  const follow = useToggleFollow(
    username,
    p?.relationship?.isFollowing ?? false,
  );
  const presence = usePresence(username, !p?.isOwner);
  const timeline = useAuthorFeed(username);
  const posts = timeline.data?.pages.flatMap((pg) => pg.data) ?? [];
  const [reporting, setReporting] = useState(false);

  if (isLoading) return <ProfileSkeleton />;

  if (error || !p) {
    return (
      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-[var(--surface-raised)] text-ink-faint">
          <MapPin size={24} />
        </div>
        <div>
          <p className="text-[15px] font-semibold">This profile isn&apos;t available</p>
          <p className="mt-1 max-w-xs text-[13px] text-ink-faint">
            It may have been removed, or the username might be wrong.
          </p>
        </div>
        <Link
          href="/discover"
          className="mt-1 rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white transition-transform active:scale-95"
        >
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card overflow-hidden">
        <div
          className="h-28"
          style={{
            background: `linear-gradient(135deg, ${getBlobTintVar(p.blobTint)}, color-mix(in srgb, ${getBlobTintVar(p.blobTint)} 55%, black))`,
          }}
        />
        <div className="px-5 pb-5">
          <div className="-mt-11 flex items-end justify-between">
            <div className="rounded-full shadow-lg ring-4 ring-[var(--surface)]">
              <PresenceAvatar
                name={p.displayName}
                tint={p.blobTint}
                avatarUrl={p.avatarUrl}
                size={84}
                online={!p.isOwner ? presence.data?.data.online : undefined}
              />
            </div>
            {p.isOwner ? (
              <Button variant="ghost" onClick={() => router.push("/me/edit")}>
                Edit profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => follow.mutate()}
                  disabled={follow.isPending}
                  className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-all active:scale-95 ${
                    p.relationship?.isFollowing
                      ? "border border-[var(--hairline)] text-ink"
                      : "bg-accent text-white shadow-sm hover:opacity-90"
                  }`}
                >
                  {p.relationship?.isFollowing ? "Following" : "Follow"}
                </button>
                <RelationshipButton profile={p} />
                <button
                  onClick={() => setReporting(true)}
                  aria-label={`More options for @${p.username}`}
                  className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  <MoreHorizontal size={20} />
                </button>
              </div>
            )}
          </div>

          <h1 className="mt-3 text-[22px] font-semibold leading-tight tracking-tight">
            {p.displayName}
          </h1>
          <p className="text-[14px] text-ink-faint">@{p.username}</p>

          {!p.isOwner && presence.data?.data && (
            <p className="mt-0.5 text-[12px] text-ink-faint">
              {presence.data.data.online ? (
                <span className="text-[var(--success)]">● Online now</span>
              ) : presence.data.data.lastSeenAt ? (
                `Last seen ${timeAgo(presence.data.data.lastSeenAt)}`
              ) : null}
            </p>
          )}

          {p.bio && (
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              {p.bio}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface-raised)] px-3 py-1.5 text-[13px] font-medium text-ink-soft">
              <Cake size={14} className="text-ink-faint" />
              {MONTHS[p.birthMonth - 1]} {p.birthDay}
            </span>
            {p.city && (
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface-raised)] px-3 py-1.5 text-[13px] font-medium text-ink-soft">
                <MapPin size={14} className="text-ink-faint" />
                {p.city}
                {p.country ? `, ${p.country}` : ""}
              </span>
            )}
            {p.ageBracket && (
              <span className="flex items-center rounded-full bg-[var(--surface-raised)] px-3 py-1.5 font-mono text-[13px] text-ink-faint">
                {p.ageBracket}
              </span>
            )}
          </div>
        </div>
      </div>

      {!p.isOwner && p.relationship?.isFriend && (
        <Link href={`/chat?with=${p.username}`}>
          <Button variant="primary" className="w-full">
            Message
          </Button>
        </Link>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="px-1 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
          Posts
        </h2>
        {timeline.isLoading ? (
          <div className="flex flex-col gap-3" aria-label="Loading posts" aria-busy="true">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-10 text-center text-[14px] text-ink-faint">
            {p.isOwner ? "You haven't posted yet." : "No posts yet."}
          </div>
        ) : (
          <>
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
            {timeline.hasNextPage && (
              <button
                onClick={() => timeline.fetchNextPage()}
                disabled={timeline.isFetchingNextPage}
                className="card-interactive card mx-auto px-5 py-2.5 text-[13px] font-medium text-ink-soft transition-opacity disabled:opacity-60"
              >
                {timeline.isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            )}
          </>
        )}
      </div>

      {reporting && (
        <ReportModal targetType="USER" targetId={p.username} targetLabel={`@${p.username}`}
          onClose={() => setReporting(false)} />
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="card overflow-hidden">
        <div className="skeleton h-28 rounded-none" />
        <div className="px-5 pb-5">
          <div className="-mt-11 flex items-end justify-between">
            <div className="skeleton size-[84px] rounded-full ring-4 ring-[var(--surface)]" />
            <div className="skeleton h-9 w-24 rounded-full" />
          </div>
          <div className="skeleton mt-4 h-5 w-40 rounded" />
          <div className="skeleton mt-2 h-3.5 w-24 rounded" />
          <div className="skeleton mt-4 h-3.5 w-56 rounded" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="skeleton size-9 shrink-0 rounded-full" />
        <div className="skeleton h-3.5 w-28 rounded" />
      </div>
      <div className="skeleton h-3.5 w-full rounded" />
      <div className="skeleton h-3.5 w-4/5 rounded" />
    </div>
  );
}