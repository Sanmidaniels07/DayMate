'use client';
import { motion } from 'framer-motion';
import { Cake, Users, MessageCircle, Sparkles } from 'lucide-react';

const HERO_POINTS = [
  {
    icon: Cake, title: 'Birthday twins', text: 'Meet people who share your exact birthday',
    gradient: 'linear-gradient(150deg, #D4537E, var(--celebrate))', rotate: -4,
  },
  {
    icon: Users, title: 'Your circles', text: 'Join circles for your day, month, and age',
    gradient: 'linear-gradient(150deg, #7C6FE0, var(--charcoal))', rotate: 3,
  },
  {
    icon: MessageCircle, title: 'Real talk', text: 'Chat, call, and celebrate together',
    gradient: 'linear-gradient(150deg, var(--accent), var(--charcoal))', rotate: -3,
  },
  {
    icon: Sparkles, title: 'Discover', text: 'Find your birthday twins nearby',
    gradient: 'linear-gradient(150deg, #2FA36B, var(--charcoal))', rotate: 4,
  },
];

const BLOBS = [
  { tint: 'var(--blob-powder)', x: '8%', y: '14%', size: 60, delay: 0 },
  { tint: 'var(--blob-blush)', x: '78%', y: '8%', size: 44, delay: 0.3 },
  { tint: 'var(--blob-lavender)', x: '84%', y: '58%', size: 64, delay: 0.6 },
  { tint: 'var(--blob-sage)', x: '10%', y: '75%', size: 50, delay: 0.9 },
];

export function SignupHero() {
  return (
    <div className="relative flex h-full flex-col justify-center overflow-hidden p-14 text-white"
      style={{ background: 'linear-gradient(150deg, var(--charcoal) 0%, #1F3A8F 100%)' }}>
      {/* Ambient glows */}
      <motion.div
        className="absolute -left-24 -top-24 size-96 rounded-full blur-3xl"
        style={{ background: 'var(--accent)' }}
        animate={{ opacity: [0.2, 0.36, 0.2], scale: [1, 1.15, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-20 right-10 size-72 rounded-full blur-3xl"
        style={{ background: 'var(--celebrate)' }}
        animate={{ opacity: [0.06, 0.14, 0.06], scale: [1, 1.2, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
      {BLOBS.map((b, i) => (
        <motion.div key={i} className="absolute rounded-full shadow-lg"
          style={{ left: b.x, top: b.y, width: b.size, height: b.size, background: b.tint }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.5, scale: 1, y: [0, -10, 0] }}
          transition={{
            opacity: { duration: 0.5, delay: b.delay },
            scale: { duration: 0.5, delay: b.delay, type: 'spring' },
            y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: b.delay },
          }} />
      ))}

      {/* Headline */}
      <div className="relative">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/50">DayMate</p>
        <h1 className="mt-6 font-display text-[3rem] font-semibold leading-[1.03] tracking-[-0.02em]">
          The people who<br /><span className="italic text-celebrate">share your day</span>
        </h1>
      </div>

      {/* ---- Diagonal card grid ---- */}
      <div className="relative mt-12 grid grid-cols-2 gap-4">
        {HERO_POINTS.map((p, i) => (
          <motion.div
            key={p.title}
            className="group relative overflow-hidden rounded-2xl p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)]"
            style={{
              background: p.gradient,
              marginTop: i % 2 === 1 ? '1.5rem' : 0,
            }}
            initial={{ opacity: 0, y: 24, rotate: 0, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotate: p.rotate, scale: 1 }}
            whileHover={{ rotate: 0, scale: 1.04, y: -4 }}
            transition={{
              opacity: { duration: 0.5, delay: 0.5 + i * 0.12 },
              y: { duration: 0.5, delay: 0.5 + i * 0.12, type: 'spring', stiffness: 200 },
              rotate: { duration: 0.5, delay: 0.5 + i * 0.12, type: 'spring', stiffness: 150 },
              scale: { duration: 0.3 },
            }}
          >
            <motion.div
              className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-white/10 blur-xl"
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative flex flex-col gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
                <p.icon size={17} className="text-white" />
              </span>
              <div>
                <p className="font-display text-[15px] font-semibold leading-tight">{p.title}</p>
                <p className="mt-0.5 text-[12px] leading-snug text-white/80">{p.text}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}