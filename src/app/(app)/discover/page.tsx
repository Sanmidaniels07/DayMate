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
        <div className="flex justify-center py-12">
          <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : matches.length === 0 ? (
        <div className="card p-10 text-center text-ink-soft">
          No matches yet — add your interests and check back.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => <MatchCard key={m.username} match={m} />)}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  return (
    <Link href={`/u/${match.username}`} className="card flex flex-col gap-3 p-4 transition-shadow hover:shadow-[var(--shadow-float)]">
      <div className="flex items-center gap-3">
        <BlobAvatar name={match.displayName} tint={match.blobTint} avatarUrl={match.avatarUrl} size={48} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight">{match.displayName}</p>
          <p className="text-[13px] text-ink-faint">@{match.username}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {match.reasons.map((reason) => (
          <span key={reason}
            className="rounded-full bg-[var(--celebrate-soft)] px-2.5 py-1 text-[12px] font-medium text-[#8a6410]">
            {reason}
          </span>
        ))}
      </div>
    </Link>
  );
}