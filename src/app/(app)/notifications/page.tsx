'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { timeAgo } from '@/lib/time';
import { notificationHref } from '@/lib/notification-link';
import {
  useNotifications, useMarkAllRead, useMarkNotificationRead, type Notification,
} from '@/hooks/use-notifications';

export default function NotificationsPage() {
  const feed = useNotifications();
  const markAll = useMarkAllRead();
  const sentinel = useRef<HTMLDivElement>(null);
  const rows = feed.data?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((e) => {
      if (e[0].isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
    }, { rootMargin: '300px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [feed.hasNextPage, feed.isFetchingNextPage, feed]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">Notifications</h1>
        {rows.some((n) => !n.readAt) && (
          <button onClick={() => markAll.mutate()} className="text-[13px] font-semibold text-accent">
            Mark all read
          </button>
        )}
      </div>

      {feed.isLoading ? (
        <div className="flex justify-center py-12">
          <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center text-ink-soft">Nothing yet. Go make some friends 🎉</div>
      ) : (
        <div className="card divide-y divide-[var(--hairline)] px-4">
          {rows.map((n) => <NotificationRow key={n.id} n={n} />)}
        </div>
      )}
      <div ref={sentinel} className="h-1" />
    </div>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  const markRead = useMarkNotificationRead();
  const actor = n.actor?.profile;
  return (
    <Link href={notificationHref(n)} onClick={() => !n.readAt && markRead.mutate(n.id)}
      className={`flex items-start gap-3 py-3 ${!n.readAt ? 'bg-[var(--accent-soft)] -mx-4 px-4' : ''}`}>
      {actor
        ? <BlobAvatar name={actor.displayName} tint={actor.blobTint} avatarUrl={actor.avatarUrl} size={40} />
        : <div className="grid size-10 place-items-center rounded-full bg-[var(--celebrate-soft)] text-lg">🎂</div>}
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-snug">{n.title}</p>
        {n.body && <p className="mt-0.5 truncate text-[13px] text-ink-soft">{n.body}</p>}
        <p className="mt-0.5 text-[12px] text-ink-faint">{timeAgo(n.createdAt)}</p>
      </div>
      {!n.readAt && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />}
    </Link>
  );
}