'use client';
import Link from 'next/link';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { useDiscover, type Match } from '@/hooks/use-discover';

export default function DiscoverPage() {
  const { data, isLoading } = useDiscover();
  const matches = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">Discover</h1>
        <p className="mt-1 text-[15px] text-ink-soft">People who share your day, your month, your vibe.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Loading matches" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => <MatchCardSkeleton key={i} />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-10 text-center">
          <p className="text-[15px] font-medium">No matches yet</p>
          <p className="max-w-xs text-[13px] text-ink-soft">
            Add a few interests to your profile and we'll start surfacing people who share them.
          </p>
          <Link
            href="/profile/edit"
            className="mt-2 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Edit your profile
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m, i) => <MatchCard key={m.username} match={m} index={i} />)}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, index }: { match: Match; index: number }) {
  return (
    <Link
      href={`/u/${match.username}`}
      className="card card-interactive animate-slideup flex flex-col gap-3 p-4"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex items-center gap-3">
        <BlobAvatar name={match.displayName} tint={match.blobTint} avatarUrl={match.avatarUrl} size={48} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight">{match.displayName}</p>
          <p className="text-[13px] text-ink-faint">@{match.username}</p>
        </div>
      </div>
      {match.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Shared reasons">
          {match.reasons.map((reason) => (
            <span key={reason}
              className="rounded-full bg-[var(--celebrate-soft)] px-2.5 py-1 text-[12px] font-medium text-[#8a6410]">
              {reason}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

function MatchCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="skeleton size-12 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="skeleton h-3 w-1/3 rounded" />
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}