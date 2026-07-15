'use client';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { useBirthdaysToday } from '@/hooks/use-feed';
import Link from 'next/link';

export function BirthdaysToday() {
  const { data } = useBirthdaysToday();
  const people = data?.data ?? [];
  if (people.length === 0) return null;

  return (
    <div className="card border-[var(--celebrate)]/30 bg-[var(--celebrate-soft)] p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-[#8a6410]">
        🎂 Birthdays today
      </p>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {people.map((p) => (
          <Link key={p.username} href={`/u/${p.username}`}
            className="flex shrink-0 flex-col items-center gap-1.5">
            <BlobAvatar name={p.displayName} tint={p.blobTint} avatarUrl={p.avatarUrl} size={56} birthday />
            <span className="max-w-[64px] truncate text-[12px] text-ink-soft">{p.displayName.split(' ')[0]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}