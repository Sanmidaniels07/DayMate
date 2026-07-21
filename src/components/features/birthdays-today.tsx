'use client';
import { motion } from 'framer-motion';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { useBirthdaysToday } from '@/hooks/use-feed';
import Link from 'next/link';

export function BirthdaysToday() {
  const { data } = useBirthdaysToday();
  const people = data?.data ?? [];
  if (people.length === 0) return null;

  return (
    <div className="card relative overflow-hidden p-4" style={{
      background: 'linear-gradient(135deg, var(--celebrate-soft), var(--surface) 60%)',
      borderColor: 'rgb(232 163 61 / 0.25)',
    }}>
      <motion.div
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full blur-2xl"
        style={{ background: 'var(--celebrate)' }}
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <p className="relative mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-[#8a6410]">
        🎂 Birthdays today
      </p>
      <div className="relative flex gap-4 overflow-x-auto pb-1">
        {people.map((p, i) => (
          <motion.div key={p.username}
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 20 }}>
            <Link href={`/u/${p.username}`} className="flex shrink-0 flex-col items-center gap-1.5">
              <BlobAvatar name={p.displayName} tint={p.blobTint} avatarUrl={p.avatarUrl} size={56} birthday />
              <span className="max-w-[64px] truncate text-[12px] text-ink-soft">{p.displayName.split(' ')[0]}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}