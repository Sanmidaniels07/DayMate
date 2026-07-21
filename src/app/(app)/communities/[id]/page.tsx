'use client';
import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Cake, CalendarDays, Users2, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PersonRow } from '@/components/features/person-row';
import { communityGlyph } from '@/lib/communities';
import {
  useCommunity, useCommunityMembers, useJoinCommunity, useLeaveCommunity,
} from '@/hooks/use-communities';

const EMBLEMS: Record<string, { icon: typeof Cake; gradient: string }> = {
  BIRTHDAY: { icon: Cake, gradient: 'linear-gradient(135deg, var(--blob-blush), var(--celebrate))' },
  BIRTH_MONTH: { icon: CalendarDays, gradient: 'linear-gradient(135deg, var(--blob-powder), var(--accent))' },
  AGE_BRACKET: { icon: Users2, gradient: 'linear-gradient(135deg, var(--blob-sage), #2FA36B)' },
  ANNIVERSARY: { icon: Heart, gradient: 'linear-gradient(135deg, var(--blob-blush), #D4537E)' },
};

function CommunityEmblem({ type, size = 88 }: { type?: string; size?: number }) {
  const e = EMBLEMS[type ?? ''] ?? { icon: Sparkles, gradient: 'linear-gradient(135deg, var(--blob-lavender), var(--accent))' };
  const Icon = e.icon;
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="grid shrink-0 place-items-center rounded-[28px] shadow-[0_10px_28px_rgba(22,35,79,0.22)] ring-4 ring-[var(--surface)]"
      style={{ width: size, height: size, background: e.gradient }}
    >
      <Icon size={size * 0.4} strokeWidth={1.6} className="text-white drop-shadow-sm" />
    </motion.div>
  );
}

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useCommunity(id);
  const members = useCommunityMembers(id);
  const join = useJoinCommunity(id);
  const leave = useLeaveCommunity(id);

  if (isLoading) return <DetailSkeleton />;

  if (!data) {
    return (
      <div className="card flex flex-col items-center gap-2 p-10 text-center">
        <p className="text-[15px] font-medium">This community isn&apos;t available</p>
        <p className="max-w-xs text-[13px] text-ink-soft">It may have been removed or never existed.</p>
        <Link href="/communities"
          className="mt-2 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90">
          Back to Communities
        </Link>
      </div>
    );
  }

  const c = data.data;
  const glyph = communityGlyph(c);
  const memberRows = members.data?.pages.flatMap((p) => p.data) ?? [];
  const membership = c.membership;
  const gradient = EMBLEMS[c.type ?? '']?.gradient ?? 'linear-gradient(135deg, var(--blob-lavender), var(--accent))';

  return (
    <div className="flex flex-col gap-5">
      <Link href="/communities" aria-label="Back to communities"
        className="grid size-9 w-fit place-items-center rounded-full text-ink-soft transition-colors hover:bg-black/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
        <ArrowLeft size={20} />
      </Link>

      <div className="card animate-slideup relative overflow-hidden">
        {/* Full gradient banner instead of a flat tint fade */}
        <div className="relative h-24" style={{ background: gradient }}>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
        </div>
        <div className="-mt-12 flex flex-col items-center gap-3 px-8 pb-8 text-center">
          <CommunityEmblem type={c.type} />
          <div>
            <h1 className="font-display text-2xl font-semibold">{c.name}</h1>
            <p className="mt-1 text-[14px] text-ink-soft">{glyph.sub}</p>
          </div>
          {typeof c.memberCount === 'number' && (
            <p className="rounded-full px-3 py-1 font-mono text-[13px] text-ink-faint" style={{ background: 'var(--accent-soft)' }}>
              {c.memberCount} members
            </p>
          )}

          {!membership ? (
            <Button loading={join.isPending} onClick={() => join.mutate()} className="mt-2 active:scale-95">
              Join circle
            </Button>
          ) : membership.joinMethod === 'MANUAL' ? (
            <Button variant="ghost" loading={leave.isPending} onClick={() => leave.mutate()} className="mt-2">
              Leave circle
            </Button>
          ) : (
            <div className="mt-2 flex flex-col items-center gap-1">
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[13px] font-medium text-accent">
                You&apos;re in this circle
              </span>
              <p className="text-[12px] text-ink-faint">Auto-joined · manage in Settings</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-ink-faint">Members</h2>
        <div className="card px-5">
          {members.isLoading ? (
            <div className="flex flex-col divide-y divide-[var(--hairline)]">
              <PersonRowSkeleton /><PersonRowSkeleton /><PersonRowSkeleton />
            </div>
          ) : memberRows.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-ink-soft">No members to show.</p>
          ) : (
            memberRows.map((m) => <PersonRow key={m.username} {...m} />)
          )}
        </div>
        {members.hasNextPage && (
          <button
            onClick={() => members.fetchNextPage()}
            disabled={members.isFetchingNextPage}
            className="card-interactive card mx-auto px-5 py-2.5 text-[13px] font-medium text-ink-soft disabled:opacity-60"
          >
            {members.isFetchingNextPage ? 'Loading…' : 'Load more members'}
          </button>
        )}
      </div>
    </div>
  );
}

function PersonRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="skeleton size-9 shrink-0 rounded-full" />
      <div className="skeleton h-3.5 w-32 rounded" />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="skeleton size-9 rounded-full" />
      <div className="card overflow-hidden">
        <div className="skeleton h-24 rounded-none" />
        <div className="-mt-12 flex flex-col items-center gap-3 px-8 pb-8">
          <div className="skeleton size-[88px] rounded-[28px] ring-4 ring-[var(--surface)]" />
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-3.5 w-28 rounded" />
        </div>
      </div>
      <div className="card px-5">
        <PersonRowSkeleton /><PersonRowSkeleton /><PersonRowSkeleton />
      </div>
    </div>
  );
}