'use client';
import Link from 'next/link';
import { BlobAvatar } from '@/components/ui/blob-avatar';

interface Props {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  blobTint: string | null;
  subtitle?: string;
  action?: React.ReactNode;
}

export function PersonRow({ username, displayName, avatarUrl, blobTint, subtitle, action }: Props) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/u/${username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <BlobAvatar name={displayName} tint={blobTint} avatarUrl={avatarUrl} size={44} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold leading-tight">{displayName}</p>
          <p className="truncate text-[13px] text-ink-faint">{subtitle ?? `@${username}`}</p>
        </div>
      </Link>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}