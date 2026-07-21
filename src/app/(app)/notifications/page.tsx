'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MessageCircle, PhoneMissed, Cake, UserPlus, Heart, MessageSquare, Users, Megaphone } from 'lucide-react';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { timeAgo } from '@/lib/time';
import { notificationHref } from '@/lib/notification-link';
import {
  useNotifications, useMarkAllRead, useMarkNotificationRead, type Notification,
} from '@/hooks/use-notifications';

// Type-specific gradient + icon — gives each notification kind a visual identity
// when there's no actor avatar to fall back on (or as a subtle corner badge when there is).
const TYPE_STYLE: Record<string, { icon: typeof Bell; gradient: string }> = {
  FRIEND_REQUEST: { icon: UserPlus, gradient: 'linear-gradient(135deg, var(--blob-powder), var(--accent))' },
  FRIEND_ACCEPTED: { icon: UserPlus, gradient: 'linear-gradient(135deg, var(--blob-sage), #2FA36B)' },
  NEW_MESSAGE: { icon: MessageCircle, gradient: 'linear-gradient(135deg, var(--blob-powder), var(--accent))' },
  MISSED_CALL: { icon: PhoneMissed, gradient: 'linear-gradient(135deg, var(--blob-peach), #E15252)' },
  UPCOMING_BIRTHDAY: { icon: Cake, gradient: 'linear-gradient(135deg, var(--blob-blush), var(--celebrate))' },
  BIRTHDAY_TODAY: { icon: Cake, gradient: 'linear-gradient(135deg, var(--blob-blush), var(--celebrate))' },
  POST_REACTION: { icon: Heart, gradient: 'linear-gradient(135deg, var(--blob-blush), #D4537E)' },
  POST_COMMENT: { icon: MessageSquare, gradient: 'linear-gradient(135deg, var(--blob-lavender), #7C6FE0)' },
  COMMUNITY_JOINED: { icon: Users, gradient: 'linear-gradient(135deg, var(--blob-lavender), #7C6FE0)' },
  ANNOUNCEMENT: { icon: Megaphone, gradient: 'linear-gradient(135deg, var(--charcoal), var(--accent))' },
};

export default function NotificationsPage() {
  const feed = useNotifications();
  const markAll = useMarkAllRead();
  const sentinel = useRef<HTMLDivElement>(null);
  const rows = feed.data?.pages.flatMap((p) => p.data) ?? [];
  const unreadCount = rows.filter((n) => !n.readAt).length;

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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[length:var(--text-title)] font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="mt-0.5 text-[13px] text-ink-soft">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => markAll.mutate()}
            className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-accent transition-colors hover:bg-[var(--accent-soft)]"
          >
            Mark all read
          </motion.button>
        )}
      </header>

      {feed.isLoading ? (
        <div className="flex justify-center py-12">
          <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <div className="grid size-14 place-items-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, var(--blob-blush), var(--celebrate))' }}>
            <Bell size={24} className="text-white" />
          </div>
          <div>
            <p className="font-display text-[16px] font-semibold">Nothing yet</p>
            <p className="mt-1 max-w-xs text-[13px] text-ink-soft">Go make some friends — we&apos;ll let you know when things happen 🎉</p>
          </div>
        </div>
      ) : (
        <div className="card divide-y divide-[var(--hairline)] px-2 sm:px-3">
          <AnimatePresence initial={false}>
            {rows.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.03 }}
              >
                <NotificationRow n={n} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <div ref={sentinel} className="h-1" />
    </div>
  );
}

function NotificationRow({ n }: { n: Notification }) {
  const markRead = useMarkNotificationRead();
  const actor = n.actor?.profile;
  const style = TYPE_STYLE[n.type] ?? { icon: Bell, gradient: 'linear-gradient(135deg, var(--blob-lavender), var(--accent))' };
  const Icon = style.icon;
  const unread = !n.readAt;

  return (
    <Link href={notificationHref(n)} onClick={() => unread && markRead.mutate(n.id)}
      className={`group relative flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors ${
        unread ? 'bg-[var(--accent-soft)]/50 hover:bg-[var(--accent-soft)]' : 'hover:bg-[var(--surface-raised)]'
      }`}
    >
      {/* Left accent bar for unread — subtle, not a whole-row wash */}
      {unread && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
          style={{ background: 'linear-gradient(180deg, var(--accent), var(--charcoal))' }} />
      )}

      <div className="relative shrink-0">
        {actor ? (
          <BlobAvatar name={actor.displayName} tint={actor.blobTint} avatarUrl={actor.avatarUrl} size={42} />
        ) : (
          <div className="grid size-10 place-items-center rounded-full shadow-sm" style={{ background: style.gradient }}>
            <Icon size={18} className="text-white" />
          </div>
        )}
        {/* Small type badge in the corner, even when there's an avatar */}
        {actor && (
          <div className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full ring-2 ring-[var(--surface)] shadow-sm"
            style={{ background: style.gradient }}>
            <Icon size={10} className="text-white" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-[14px] leading-snug ${unread ? 'font-medium text-ink' : 'text-ink'}`}>{n.title}</p>
        {n.body && <p className="mt-0.5 truncate text-[13px] text-ink-soft">{n.body}</p>}
        <p className="mt-0.5 text-[12px] text-ink-faint">{timeAgo(n.createdAt)}</p>
      </div>

      {unread && (
        <motion.span
          className="mt-1.5 size-2 shrink-0 rounded-full"
          style={{ background: 'var(--accent)' }}
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </Link>
  );
}