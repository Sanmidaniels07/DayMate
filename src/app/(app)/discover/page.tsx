'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, Cake, MapPin, Heart, Sparkles, Users } from 'lucide-react';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { useDiscover, type Match } from '@/hooks/use-discover';

function reasonStyle(reason: string): { bg: string; fg: string; icon: typeof Cake } {
  const r = reason.toLowerCase();
  if (r.includes('twin') || r.includes('birthday')) return { bg: 'var(--celebrate-soft)', fg: '#8a6410', icon: Cake };
  if (r.includes('anniversary')) return { bg: '#D4537E22', fg: '#9c3a5a', icon: Heart };
  if (r.includes('city') || r.includes('country')) return { bg: 'var(--accent-soft)', fg: 'var(--accent)', icon: MapPin };
  return { bg: 'var(--blob-lavender)', fg: '#5b4a9e', icon: Sparkles };
}

const VIBE_CARDS = [
  { icon: Cake, label: 'Birthdays', sub: 'Twins & month-mates', gradient: 'linear-gradient(150deg, #D4537E, var(--celebrate))', rotate: -3 },
  { icon: MapPin, label: 'Nearby', sub: 'Same city & country', gradient: 'linear-gradient(150deg, var(--accent), var(--charcoal))', rotate: 2 },
  { icon: Sparkles, label: 'Interests', sub: 'What you\u2019re into', gradient: 'linear-gradient(150deg, #7C6FE0, var(--charcoal))', rotate: -2 },
  { icon: Heart, label: 'Anniversaries', sub: 'Couples who match', gradient: 'linear-gradient(150deg, #D4537E, #7C6FE0)', rotate: 3 },
];

export default function DiscoverPage() {
  const { data, isLoading } = useDiscover();
  const matches = data?.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* ---- Compact identity card ---- */}
      <div className="relative overflow-hidden rounded-[24px] p-5 text-white sm:p-6"
        style={{ background: 'linear-gradient(150deg, var(--charcoal) 0%, #1F3A8F 100%)' }}>
        <motion.div
          className="absolute -right-8 -top-8 size-40 rounded-full blur-3xl"
          style={{ background: 'var(--accent)' }}
          animate={{ opacity: [0.2, 0.36, 0.2], scale: [1, 1.15, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative flex items-center gap-3">
          <motion.span
            className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <Compass size={20} className="text-celebrate" />
          </motion.span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">Discover</p>
            <h1 className="font-display text-[20px] font-semibold leading-tight tracking-[-0.01em]">
              People who share <span className="italic text-celebrate">your day</span>
            </h1>
          </div>
        </div>
      </div>

      {/* ---- Vibe cards — diagonal, small, decorative-but-informative ---- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {VIBE_CARDS.map((v, i) => (
          <motion.div
            key={v.label}
            className="group relative overflow-hidden rounded-2xl p-4 shadow-[0_8px_24px_rgba(22,35,79,0.14)]"
            style={{ background: v.gradient }}
            initial={{ opacity: 0, y: 16, rotate: 0, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, rotate: v.rotate, scale: 1 }}
            whileHover={{ rotate: 0, scale: 1.05, y: -3 }}
            transition={{
              opacity: { duration: 0.4, delay: i * 0.08 },
              y: { duration: 0.4, delay: i * 0.08, type: 'spring', stiffness: 220 },
              rotate: { duration: 0.4, delay: i * 0.08, type: 'spring', stiffness: 160 },
              scale: { duration: 0.25 },
            }}
          >
            <motion.div
              className="pointer-events-none absolute -right-5 -top-5 size-16 rounded-full bg-white/10 blur-lg"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative flex flex-col gap-2 text-white">
              <span className="grid size-8 place-items-center rounded-xl bg-white/15">
                <v.icon size={15} />
              </span>
              <div>
                <p className="text-[13px] font-semibold leading-tight">{v.label}</p>
                <p className="mt-0.5 text-[10.5px] leading-snug text-white/75">{v.sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-label="Loading matches" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => <MatchCardSkeleton key={i} />)}
        </div>
      ) : matches.length === 0 ? (
        <div className="card relative overflow-hidden flex flex-col items-center gap-3 p-12 text-center">
          <div className="absolute inset-0 opacity-40" style={{
            background: 'radial-gradient(ellipse 300px 200px at 50% 0%, var(--accent-soft), transparent 60%)',
          }} />
          <div className="relative grid size-16 place-items-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, var(--blob-lavender), var(--accent))' }}>
            <Users size={28} className="text-white" />
          </div>
          <div className="relative">
            <p className="font-display text-lg font-semibold">No matches yet</p>
            <p className="mt-1 max-w-xs text-[13px] text-ink-soft">
              Add a few interests to your profile and we&apos;ll start surfacing people who share them.
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="relative mt-1 rounded-full px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_6px_20px_rgba(59,111,234,0.25)] transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' }}
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
  const [hovered, setHovered] = useState(false);
  const topReason = match.reasons[0];
  const accentGradient = topReason && reasonStyle(topReason).fg === '#8a6410'
    ? 'linear-gradient(135deg, var(--blob-blush), var(--celebrate))'
    : topReason && reasonStyle(topReason).fg === 'var(--accent)'
    ? 'linear-gradient(135deg, var(--blob-powder), var(--accent))'
    : 'linear-gradient(135deg, var(--blob-lavender), #7C6FE0)';

  return (
    <Link
      href={`/u/${match.username}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="card group relative animate-slideup flex flex-col gap-3 overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--glow-accent)]"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <motion.div
        className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full blur-2xl"
        style={{ background: accentGradient }}
        animate={{ opacity: hovered ? 0.25 : 0.08 }}
        transition={{ duration: 0.3 }}
      />

      <div className="relative flex items-center gap-3">
        <div className="rounded-full p-[2.5px]" style={{ background: accentGradient }}>
          <div className="rounded-full bg-[var(--surface)] p-[2px]">
            <BlobAvatar name={match.displayName} tint={match.blobTint} avatarUrl={match.avatarUrl} size={48} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight">{match.displayName}</p>
          <p className="text-[13px] text-ink-faint">@{match.username}</p>
        </div>
      </div>

      {match.reasons.length > 0 && (
        <div className="relative flex flex-wrap gap-1.5" aria-label="Shared reasons">
          {match.reasons.map((reason) => {
            const style = reasonStyle(reason);
            const Icon = style.icon;
            return (
              <span key={reason}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium"
                style={{ background: style.bg, color: style.fg }}
              >
                <Icon size={11} />
                {reason}
              </span>
            );
          })}
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