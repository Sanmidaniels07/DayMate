'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CommunityCard } from '@/components/features/community-card';
import { useMyCommunities, useBrowseCommunities } from '@/hooks/use-communities';
import { Cake, CalendarDays, Users2, Compass, Sparkles } from 'lucide-react';

const TYPES = [
  { key: '', label: 'All', icon: Sparkles, tint: 'var(--accent)' },
  { key: 'BIRTHDAY', label: 'Birthdays', icon: Cake, tint: 'var(--celebrate)' },
  { key: 'BIRTH_MONTH', label: 'Months', icon: CalendarDays, tint: 'var(--accent)' },
  { key: 'AGE_BRACKET', label: 'Eras', icon: Users2, tint: '#2FA36B' },
] as const;

export default function CommunitiesPage() {
  const [tab, setTab] = useState<'mine' | 'browse'>('mine');

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-display text-[length:var(--text-title)] font-semibold">Communities</h1>
        <p className="mt-1 text-[15px] text-ink-soft">Your birthday circles — the people who share your day.</p>
      </header>

      <PillToggle active={tab} onChange={setTab} />

      {tab === 'mine' ? <MineTab onBrowse={() => setTab('browse')} /> : <BrowseTab />}
    </div>
  );
}

/** A real toggle — sliding gradient knob, icon-labeled, springs into place. */
function PillToggle({
  active, onChange,
}: { active: 'mine' | 'browse'; onChange: (v: 'mine' | 'browse') => void }) {
  const tabs = [
    { key: 'mine' as const, label: 'My circles', icon: Sparkles },
    { key: 'browse' as const, label: 'Browse', icon: Compass },
  ];
  const index = tabs.findIndex((t) => t.key === active);

  return (
    <div className="relative grid grid-cols-2 rounded-[var(--radius-pill)] bg-[var(--charcoal)]/[0.06] p-1.5">
      <motion.div
        className="absolute inset-y-1.5 w-[calc(50%-6px)] rounded-[var(--radius-pill)]"
        style={{ background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' }}
        animate={{ x: index === 0 ? 0 : 'calc(100% + 12px)' }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      />
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-[var(--radius-pill)] py-2.5 text-[14px] font-semibold transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function MineTab({ onBrowse }: { onBrowse: () => void }) {
  const { data, isLoading } = useMyCommunities();
  const rows = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <CardSkeleton /><CardSkeleton /><CardSkeleton />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Compass size={22} />}
        title="No circles yet"
        body="Browse communities built around birthdays, birth months, and age groups — join a few to see them here."
        actionLabel="Browse communities"
        onAction={onBrowse}
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {rows.map((c, i) => (
        <div key={c.id} className="animate-slideup" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
          <CommunityCard community={c} />
        </div>
      ))}
    </div>
  );
}

function BrowseTab() {
  const [type, setType] = useState('');
  const browse = useBrowseCommunities(type || undefined);
  const rows = browse.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const isActive = type === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              style={isActive ? { background: t.tint, borderColor: 'transparent' } : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-[var(--radius-pill)] border px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? 'scale-[1.04] text-white shadow-[0_4px_14px_rgba(22,35,79,0.18)]'
                  : 'border-[var(--hairline)] text-ink-soft hover:border-accent/40 hover:text-ink'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {browse.isLoading ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Compass size={22} />}
          title="Nothing here yet"
          body={type ? "No communities of this type yet — try a different filter." : "No communities to browse yet."}
          actionLabel={type ? 'Clear filter' : undefined}
          onAction={type ? () => setType('') : undefined}
        />
      ) : (
        <>
          {rows.map((c, i) => (
            <div key={c.id} className="animate-slideup" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <CommunityCard community={c} />
            </div>
          ))}
          {browse.hasNextPage && (
            <button
              onClick={() => browse.fetchNextPage()}
              disabled={browse.isFetchingNextPage}
              className="card-interactive card mx-auto px-5 py-2.5 text-[13px] font-medium text-ink-soft disabled:opacity-60"
            >
              {browse.isFetchingNextPage ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="skeleton size-14 shrink-0 rounded-2xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="skeleton h-4 w-2/5 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="skeleton h-6 w-14 shrink-0 rounded-full" />
    </div>
  );
}

function EmptyState({
  icon, title, body, actionLabel, onAction,
}: {
  icon: React.ReactNode; title: string; body: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <div className="mb-1 grid size-12 place-items-center rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--blob-lavender), var(--accent-soft))' }}>
        {icon}
      </div>
      <p className="text-[15px] font-medium">{title}</p>
      <p className="max-w-xs text-[13px] text-ink-soft">{body}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 rounded-full px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}