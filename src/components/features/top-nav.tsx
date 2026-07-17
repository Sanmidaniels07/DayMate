'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const TAGLINES = [
  'find your birthday people',
  'someone shares your day',
  'the circle that shares your cake',
  'connect by the day you were born',
  'your people, your date, your vibe',
];

export function TopNav() {
  const [line, setLine] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setLine((l) => (l + 1) % TAGLINES.length), 3800);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[var(--hairline)] bg-surface/85 px-4 py-2.5 backdrop-blur-md lg:px-8">
      <Link href="/home" className="flex items-center gap-3">
        {/* Self-drawing monogram */}
        <span className="relative grid size-10 place-items-center rounded-2xl bg-charcoal">
          <svg width="26" height="26" viewBox="0 0 44 44" fill="none" aria-hidden>
            <motion.circle
              cx="22" cy="22" r="20" fill="none" stroke="var(--celebrate)" strokeWidth="2.5"
              strokeLinecap="round" strokeDasharray="126"
              initial={{ strokeDashoffset: 126 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.path
              d="M15 13 H23 Q31 13 31 22 Q31 31 23 31 H15 Z" fill="none"
              stroke="#F7F6F2" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
              strokeDasharray="70"
              initial={{ strokeDashoffset: 70 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.circle
              cx="22" cy="22" r="3" fill="var(--celebrate)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, r: [3, 4.5, 3] }}
              transition={{
                opacity: { duration: 0.4, delay: 1.3 },
                r: { duration: 2.6, delay: 1.7, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
          </svg>
        </span>

        {/* Wordmark + rotating tagline */}
        <span className="flex flex-col leading-none">
          <span className="font-display text-[21px] font-semibold tracking-[-0.02em]">
            Day<span className="italic text-celebrate">Mate</span>
          </span>
          <span className="relative mt-0.5 block h-4 min-w-[220px] overflow-hidden">
            <motion.span
              key={line}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute left-0 top-0 whitespace-nowrap text-[11px] leading-4 text-ink-faint"
            >
              {TAGLINES[line]}
            </motion.span>
          </span>
        </span>
      </Link>
    </header>
  );
}