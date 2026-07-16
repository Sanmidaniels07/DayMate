'use client';
import { BlobAvatar } from './blob-avatar';
import { usePresenceStore } from '@/hooks/use-presence';

interface Props {
  userId?: string;             
  online?: boolean;            
  name: string;
  tint?: string | null;
  avatarUrl?: string | null;
  size?: number;
  birthday?: boolean;
}

export function PresenceAvatar({ userId, online, size = 44, ...rest }: Props) {
  const liveOnline = usePresenceStore((s) => (userId ? s.online[userId] : undefined));
  const isOnline = online ?? liveOnline ?? false;
  const dot = Math.max(10, Math.round(size * 0.28));

  return (
    <div className="relative inline-block">
      <BlobAvatar size={size} {...rest} />
      {isOnline && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-[var(--surface)] bg-[var(--success)]"
          style={{ width: dot, height: dot }}
          aria-label="Online"
        />
      )}
    </div>
  );
}