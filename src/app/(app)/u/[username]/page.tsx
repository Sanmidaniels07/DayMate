"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PresenceAvatar } from "@/components/ui/presence-avatar";
import { getBlobTintVar } from "@/components/ui/blob-avatar";
import { Button } from "@/components/ui/button";
import { RelationshipButton } from "@/components/features/relationship-button";
import { ReportModal } from "@/components/features/report-modal";
import { useProfile, useToggleFollow } from "@/hooks/use-social";
import { usePresence } from "@/hooks/use-presence";
import { useAuthorFeed } from "@/hooks/use-feed";
import { useCoverUpload } from "@/hooks/use-cover-upload";
import { PostCard } from "@/components/features/post-card";
import { MONTHS } from "@/lib/months";
import { timeAgo } from "@/lib/time";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { Cake, MapPin, MoreHorizontal, MessageCircle, Camera, Loader2, BadgeCheck } from "lucide-react";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;

function useBlock(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/social/block/${username}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", username] }),
  });
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, error } = useProfile(username);

  const p = data?.data;
  const follow = useToggleFollow(username, p?.relationship?.isFollowing ?? false);
  const presence = usePresence(username, !p?.isOwner);
  const timeline = useAuthorFeed(username);
  const posts = timeline.data?.pages.flatMap((pg) => pg.data) ?? [];
  const [reporting, setReporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const block = useBlock(username);

  // Cover photo — real upload, persisted via /profiles/me/cover/sign + /confirm.
  const { upload: uploadCover, uploading: coverUploading } = useCoverUpload();

  const onCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const publicId = await uploadCover(file);
    if (publicId) {
      toast.success("Cover photo updated");
      qc.invalidateQueries({ queryKey: ["profile", username] });
    } else {
      toast.error("Could not upload cover photo");
    }
    e.target.value = "";
  };

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
        <Link href="/discover"
          className="mt-1 rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white transition-transform active:scale-95">
          Back to Discover
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Friends", value: (p as any).friendCount ?? 0, color: "linear-gradient(135deg, var(--blob-peach), #E8703D)" },
    { label: "Circles", value: (p as any).communityCount ?? 0, color: "linear-gradient(135deg, var(--blob-lavender), #7C6FE0)" },
    { label: "Posts", value: (p as any).postCount ?? posts.length, color: "linear-gradient(135deg, var(--charcoal), var(--accent))" },
  ];

  // Real cover, read from the profile response (persists across reloads).
  const coverUrl = (p as any).coverUrl as string | null | undefined;
  const hasCover = !!coverUrl;
  const coverSrc = hasCover
    ? `https://res.cloudinary.com/${CLOUD}/image/upload/c_fill,w_1200,h_400,q_auto,f_auto/${coverUrl}`
    : null;

  const isOnline = !p.isOwner ? presence.data?.data.online : undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* ---- Identity card ---- */}
      <div className="card overflow-hidden !p-0">
        {/* ---- Cover — clips the image, does NOT contain the avatar ---- */}
        <div className="relative h-56 w-full overflow-hidden sm:h-64">
          {hasCover ? (
            <img src={coverSrc!} alt="" className="size-full object-cover" />
          ) : (
            <div
              className="size-full"
              style={{
                background: `linear-gradient(120deg, ${getBlobTintVar(p.blobTint)}, var(--accent-soft) 45%, var(--celebrate-soft) 90%)`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

          {p.isOwner && (
            <label className="absolute right-4 top-4 z-20 flex cursor-pointer items-center gap-1.5 rounded-full bg-black/40 px-3.5 py-2 text-[13px] font-medium text-white backdrop-blur-md transition-colors hover:bg-black/55">
              {coverUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              {coverUploading ? "Uploading…" : hasCover ? "Edit cover" : "Add cover"}
              <input type="file" accept="image/*" className="hidden" onChange={onCoverFile} disabled={coverUploading} />
            </label>
          )}
        </div>

        {/* ---- Avatar + content — a SIBLING of the cover, never clipped ---- */}
        <div className="relative px-5 sm:px-6">
          <div className="absolute -top-12 left-0 sm:-top-14 sm:left-0">
            <div className="relative">
              <div
                className="rounded-full p-[3.5px] shadow-[0_10px_28px_rgba(22,35,79,0.28)]"
                style={{
                  background: isOnline
                    ? "conic-gradient(from 180deg, var(--celebrate), var(--accent), #7C6FE0, var(--celebrate))"
                    : "linear-gradient(135deg, var(--accent), var(--charcoal))",
                }}
              >
                <div className="rounded-full bg-[var(--surface)] p-[3px]">
                  <PresenceAvatar
                    name={p.displayName}
                    tint={p.blobTint}
                    avatarUrl={p.avatarUrl}
                    size={104}
                    online={undefined}
                  />
                </div>
              </div>
              {isOnline && (
                <span className="absolute bottom-2 left-1.5 size-4 rounded-full border-[3px] border-[var(--surface)] bg-[var(--success)] shadow-sm sm:size-[18px]" />
              )}
              {p.relationship?.isFriend && (
                <span className="absolute -right-0.5 bottom-1 grid size-7 place-items-center rounded-full border-[3px] border-[var(--surface)] shadow-sm"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--charcoal))" }}>
                  <BadgeCheck size={13} className="text-white" />
                </span>
              )}
            </div>
          </div>

          <div className="pb-5 pt-16 sm:pt-[4.5rem]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="font-display text-[24px] font-semibold italic leading-tight tracking-tight">
                    {p.displayName}
                  </h1>
                  {p.relationship?.isFriend && <BadgeCheck size={18} className="text-accent" />}
                </div>
                <p className="text-[14px] font-medium text-accent">@{p.username}</p>

                {!p.isOwner && presence.data?.data && !isOnline && presence.data.data.lastSeenAt && (
                  <p className="mt-0.5 text-[12px] text-ink-faint">
                    Last seen {timeAgo(presence.data.data.lastSeenAt)}
                  </p>
                )}
                {isOnline && (
                  <p className="mt-0.5 text-[12px] font-medium text-[var(--success)]">● Online now</p>
                )}

                {p.bio && (
                  <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ink-soft">{p.bio}</p>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-1">
                    <div
                      className="grid size-11 place-items-center rounded-full text-[13px] font-bold text-white shadow-[0_4px_12px_rgba(22,35,79,0.18)]"
                      style={{ background: s.color }}
                    >
                      {s.value}
                    </div>
                    <span className="text-[10px] text-ink-faint">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {p.isOwner ? (
                <Button variant="ghost" onClick={() => router.push("/me/edit")}>
                  Edit profile
                </Button>
              ) : (
                <>
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={() => follow.mutate()}
                    disabled={follow.isPending}
                    className={`rounded-full px-4 py-2 text-[14px] font-semibold shadow-sm transition-opacity ${
                      p.relationship?.isFollowing ? "border border-[var(--hairline)] text-ink" : "text-white"
                    }`}
                    style={!p.relationship?.isFollowing ? { background: "linear-gradient(135deg, var(--accent), var(--charcoal))" } : undefined}
                  >
                    {p.relationship?.isFollowing ? "Following" : "Follow"}
                  </motion.button>
                  <RelationshipButton profile={p} />
                  {p.relationship?.isFriend && (
                    <Link href={`/chat?with=${p.username}`}
                      className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--accent-soft)] hover:text-accent"
                      aria-label="Message">
                      <MessageCircle size={18} />
                    </Link>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen((v) => !v)}
                      aria-label={`More options for @${p.username}`}
                      className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--accent-soft)] hover:text-accent"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] shadow-[var(--shadow-float)]">
                          <button
                            onClick={() => { setMenuOpen(false); setReporting(true); }}
                            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] hover:bg-[var(--accent-soft)]"
                          >
                            Report @{p.username}
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              block.mutate(undefined, { onSuccess: () => toast.success(`Blocked @${p.username}`) });
                            }}
                            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-danger hover:bg-[var(--danger)]/5"
                          >
                            Block @{p.username}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--hairline)] pt-4">
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--celebrate-soft)] px-3 py-1.5 text-[13px] font-medium text-[#8a6410]">
                <Cake size={14} />
                {MONTHS[p.birthMonth - 1]} {p.birthDay}
              </span>
              {p.city && (
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[13px] font-medium text-accent">
                  <MapPin size={14} />
                  {p.city}{p.country ? `, ${p.country}` : ""}
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
      </div>

      {/* ---- Posts ---- */}
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
      <div className="card overflow-hidden !p-0">
        <div className="skeleton h-56 rounded-none sm:h-64" />
        <div className="px-5 pb-5 pt-16 sm:px-6">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton mt-2 h-3.5 w-24 rounded" />
          <div className="skeleton mt-4 h-9 w-32 rounded-full" />
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