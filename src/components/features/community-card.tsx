'use client';
import Link from 'next/link';
import { ChevronRight, Users } from 'lucide-react';
import { communityGlyph } from '@/lib/communities';
import type { Community, MyCommunity } from '@/hooks/use-communities';

// Per-type gradient identity — each community type gets its own warm/cool pairing
const TYPE_GRADIENT: Record<string, string> = {
  BIRTHDAY: 'linear-gradient(135deg, var(--blob-blush), var(--celebrate))',
  BIRTH_MONTH: 'linear-gradient(135deg, var(--blob-powder), var(--accent))',
  AGE_BRACKET: 'linear-gradient(135deg, var(--blob-sage), #2FA36B)',
  ANNIVERSARY: 'linear-gradient(135deg, var(--blob-blush), #D4537E)',
};

export function CommunityCard({ community }: { community: Community | MyCommunity }) {
  const glyph = communityGlyph(community);
  const joinMethod = 'joinMethod' in community ? community.joinMethod : undefined;
  const gradient = TYPE_GRADIENT[(community as any).type ?? ''] ?? 'linear-gradient(135deg, var(--blob-lavender), var(--accent))';

  return (
    <Link
      href={`/communities/${community.id}`}
      className="card group relative flex items-center gap-3.5 overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--glow-accent)] active:scale-[0.98]"
    >
      {/* Ambient tint bleeding from the emblem, barely visible */}
      <div
        className="pointer-events-none absolute -left-6 -top-6 size-24 rounded-full opacity-[0.06] blur-2xl transition-opacity duration-300 group-hover:opacity-[0.12]"
        style={{ background: gradient }}
      />

      <div
        className="relative grid size-14 shrink-0 place-items-center rounded-2xl text-[26px] shadow-[0_4px_14px_rgba(22,35,79,0.14)] ring-1 ring-white/40 transition-transform duration-300 group-hover:scale-[1.06] group-hover:rotate-[-3deg]"
        style={{ background: gradient }}
      >
        <span className="drop-shadow-sm">{glyph.emoji}</span>
      </div>

      <div className="relative min-w-0 flex-1">
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

      <div className="relative flex shrink-0 items-center gap-2">
        {typeof community.memberCount === 'number' && (
          <span className="flex items-center gap-1 rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-[12px] font-medium text-ink-faint">
            <Users size={12} />
            {community.memberCount}
          </span>
        )}
        <ChevronRight
          size={18}
          className="text-ink-faint/50 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent"
        />
      </div>
    </Link>
  );
}