'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { useSessionStore } from '@/stores/session';
import { useHomeFeed } from '@/hooks/use-feed';
import { Composer } from '@/components/features/composer';
import { BirthdaysToday } from '@/components/features/birthdays-today';
import { PostCard } from '@/components/features/post-card';

export default function HomePage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);

  // Profile gate: no profile → onboarding.
  const { error: meError } = useQuery({
    queryKey: ['me-profile'],
    queryFn: () => api<{ data: { username: string } }>('/profiles/me'),
    retry: false,
  });
  useEffect(() => {
    if (meError instanceof ApiError && meError.status === 404) router.replace('/onboarding');
  }, [meError, router]);

  const feed = useHomeFeed();
  const sentinel = useRef<HTMLDivElement>(null);

  // Infinite scroll: fetch the next page when the sentinel enters view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) {
        feed.fetchNextPage();
      }
    }, { rootMargin: '400px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [feed.hasNextPage, feed.isFetchingNextPage, feed]);

  const posts = feed.data?.pages.flatMap((pg) => pg.data) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <header className="mb-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mt-1 font-display text-[length:var(--text-display)] font-semibold leading-[1.05]">
          Hi, {user?.fullName?.split(' ')[0] ?? 'there'}
        </h1>
      </header>

      <BirthdaysToday />
      <Composer />

      {feed.isLoading ? (
        <div className="flex justify-center py-12">
          <span className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center text-ink-soft">
          Quiet for now. Follow some people, or post the first thing.
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}

      <div ref={sentinel} className="h-1" />
      {feed.isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <span className="size-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}
    </div>
  );
}