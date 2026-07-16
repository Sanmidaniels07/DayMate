'use client';
import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';
import { communityGlyph } from '@/lib/communities';
import type { Community, MyCommunity } from '@/hooks/use-communities';

export function CommunityCard({ community }: { community: Community | MyCommunity }) {
  const glyph = communityGlyph(community);
  const joinMethod = 'joinMethod' in community ? community.joinMethod : undefined;

  return (
    <Link
      href={`/communities/${community.id}`}
      className="card group flex items-center gap-3.5 p-4 transition-all duration-200 hover:shadow-[var(--shadow-float)] active:scale-[0.98]"
    >
      <div className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--celebrate-soft)] text-[26px] shadow-sm ring-1 ring-black/[0.03] transition-transform duration-200 group-hover:scale-105">
        {glyph.emoji}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold leading-tight">{community.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="truncate text-[13px] text-ink-soft">{glyph.sub}</p>
          {joinMethod === 'AUTO' && (
            <span className="shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              Auto
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {typeof community.memberCount === 'number' && (
          <span className="flex items-center gap-1 rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-[12px] font-medium text-ink-faint">
            <Users size={12} />
            {community.memberCount}
          </span>
        )}
        <ChevronRight
          size={18}
          className="text-ink-faint/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink-faint"
        />
      </div>
    </Link>
  );
}