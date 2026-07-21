'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Users, Compass, Sparkles, Search, Bell, ArrowRight } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useSessionStore } from '@/stores/session';
import { useHomeFeed } from '@/hooks/use-feed';
import { useMyCommunitiesCount, useFriendsCount, useIncomingCount } from '@/hooks/use-dashboard';
import { useUnreadChats } from '@/hooks/use-chat';
import { useUnreadCount } from '@/hooks/use-notifications';
import { Composer } from '@/components/features/composer';
import { BirthdaysToday } from '@/components/features/birthdays-today';
import { PostCard } from '@/components/features/post-card';
import { fadeUp, stagger, CountUp } from '@/components/ui/motion';
import { Stories } from '@/components/features/stories';

export default function HomePage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);

  const { error: meError } = useQuery({
    queryKey: ['me-profile'],
    queryFn: () => api<{ data: { username: string } }>('/profiles/me'),
    retry: false,
  });
  useEffect(() => {
    if (meError instanceof ApiError && meError.status === 404) router.replace('/onboarding');
  }, [meError, router]);

  const feed = useHomeFeed();
  const communities = useMyCommunitiesCount();
  const friends = useFriendsCount();
  const incoming = useIncomingCount();
  const chatUnread = useUnreadChats();
  const alerts = useUnreadCount();

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((e) => {
      if (e[0].isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
    }, { rootMargin: '400px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [feed.hasNextPage, feed.isFetchingNextPage, feed]);

  const posts = feed.data?.pages.flatMap((pg) => pg.data) ?? [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Friends', value: friends.data?.data.length ?? 0, href: '/connections' },
    { label: 'Circles', value: communities.data?.data.length ?? 0, href: '/communities' },
    { label: 'Requests', value: incoming.data?.data.length ?? 0, href: '/connections', accent: true },
  ];
  const actions = [
    { label: 'Discover', sub: 'Find your twins', href: '/discover', icon: Compass, gradient: 'linear-gradient(135deg, var(--blob-powder), var(--accent))' },
    { label: 'Circles', sub: 'Your communities', href: '/communities', icon: Sparkles, gradient: 'linear-gradient(135deg, var(--blob-lavender), #7C6FE0)' },
    { label: 'Messages', sub: chatUnread.data?.data.total ? `${chatUnread.data.data.total} unread` : 'Your chats', href: '/chat', icon: Users, gradient: 'linear-gradient(135deg, var(--blob-sage), #2FA36B)' },
    { label: 'Search', sub: 'Find anyone', href: '/search', icon: Search, gradient: 'linear-gradient(135deg, var(--blob-peach), var(--celebrate))' },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show"
      className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
      {/* ---- LEFT COLUMN: hero + feed ---- */}
      <div className="flex flex-col gap-5">
        <motion.header variants={fadeUp}
          className="relative overflow-hidden rounded-[28px] p-7 text-white"
          style={{ background: 'linear-gradient(150deg, var(--charcoal) 0%, #1F3A8F 100%)' }}>
          <motion.div
            className="absolute -right-10 -top-10 size-56 rounded-full blur-3xl"
            style={{ background: 'var(--accent)' }}
            animate={{ opacity: [0.25, 0.42, 0.25], scale: [1, 1.15, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-16 left-10 size-40 rounded-full blur-3xl"
            style={{ background: 'var(--celebrate)' }}
            animate={{ opacity: [0.08, 0.16, 0.08], scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <div className="relative">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/50">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="mt-3 font-display text-[clamp(2.5rem,2rem+2vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
              {greeting},<br /><span className="italic text-celebrate">{user?.fullName?.split(' ')[0] ?? 'friend'}</span>
            </h1>
            {alerts.data?.data.count ? (
              <Link href="/notifications"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-medium backdrop-blur transition-colors hover:bg-white/20">
                <Bell size={14} className="text-celebrate" />
                {alerts.data.data.count} new
                <ArrowRight size={14} />
              </Link>
            ) : null}
          </div>
        </motion.header>

        <motion.div variants={fadeUp}>
          <Stories />
        </motion.div>

        <motion.div variants={fadeUp}><Composer /></motion.div>
        <div className="flex flex-col gap-4">
          {feed.isLoading ? (
            <div className="flex justify-center py-10">
              <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : posts.length === 0 ? (
            <motion.div variants={fadeUp} className="card p-10 text-center text-ink-soft">
              Quiet for now. Follow some people, or post the first thing.
            </motion.div>
          ) : (
            posts.map((post) => (
              <motion.div key={post.id} variants={fadeUp}>
                <PostCard post={post} />
              </motion.div>
            ))
          )}
        </div>
        <div ref={sentinel} className="h-1" />
      </div>

      {/* ---- RIGHT COLUMN ---- */}
      <motion.aside variants={fadeUp} className="flex flex-col gap-4 lg:sticky lg:top-6">
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <Link key={s.label} href={s.href}
              className="card group relative overflow-hidden flex flex-col items-center gap-1 py-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--glow-accent)]">
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ background: 'linear-gradient(180deg, var(--accent-soft), transparent)' }} />
              <span className={`relative font-display text-[28px] font-semibold ${s.accent && s.value > 0 ? 'text-celebrate' : ''}`}>
                <CountUp value={s.value} />
              </span>
              <span className="relative text-[11px] text-ink-soft">{s.label}</span>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {actions.map((a) => (
            <motion.div key={a.label} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <Link href={a.href}
                className="card group relative flex h-28 flex-col justify-between overflow-hidden p-4">
                <div className="absolute -right-4 -top-4 size-20 rounded-full opacity-25 blur-md transition-all duration-500 group-hover:scale-150 group-hover:opacity-40"
                  style={{ background: a.gradient }} />
                <div className="relative grid size-9 place-items-center rounded-xl shadow-sm" style={{ background: a.gradient }}>
                  <a.icon size={17} className="text-white" />
                </div>
                <div className="relative">
                  <p className="text-[13px] font-semibold leading-tight">{a.label}</p>
                  <p className="text-[11px] text-ink-soft">{a.sub}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <BirthdaysToday />
      </motion.aside>
    </motion.div>
  );
}