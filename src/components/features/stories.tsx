'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { timeAgo } from '@/lib/time';

interface StorySlide {
  id: string;
  gradient: string;      // layered background
  emoji?: string;        // optional big decorative emoji
  caption: string;
  createdAt: string;
}
interface StoryUser {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  blobTint: string | null;
  viewed: boolean;
  slides: StorySlide[];
}

const DUMMY_STORIES: StoryUser[] = [
  {
    username: 'ire_28', displayName: 'Susan Ireoluwa', avatarUrl: null, blobTint: 'blush', viewed: false,
    slides: [
      { id: 's1', gradient: 'radial-gradient(circle at 30% 20%, var(--celebrate), transparent 60%), radial-gradient(circle at 80% 80%, var(--blob-blush), transparent 55%), linear-gradient(160deg, #D4537E, var(--charcoal))', emoji: '🎂', caption: 'Cake tasting for the big day', createdAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
      { id: 's2', gradient: 'radial-gradient(circle at 70% 30%, var(--accent), transparent 60%), linear-gradient(160deg, var(--charcoal), #1F3A8F)', emoji: '✨', caption: 'Almost ready!', createdAt: new Date(Date.now() - 1 * 3600_000).toISOString() },
    ],
  },
  {
    username: 'sanmi_07', displayName: 'Daniel Omowole', avatarUrl: null, blobTint: 'butter', viewed: false,
    slides: [
      { id: 's3', gradient: 'radial-gradient(circle at 25% 25%, var(--blob-powder), transparent 55%), radial-gradient(circle at 85% 75%, var(--accent), transparent 50%), linear-gradient(160deg, #1F3A8F, var(--charcoal))', emoji: '🚀', caption: 'Shipped a big feature today', createdAt: new Date(Date.now() - 4 * 3600_000).toISOString() },
    ],
  },
  {
    username: 'maya_o', displayName: 'Maya Okafor', avatarUrl: null, blobTint: 'sage', viewed: true,
    slides: [
      { id: 's4', gradient: 'radial-gradient(circle at 30% 30%, var(--blob-sage), transparent 55%), linear-gradient(160deg, #2FA36B, var(--charcoal))', emoji: '🌿', caption: 'Sunday market run', createdAt: new Date(Date.now() - 20 * 3600_000).toISOString() },
    ],
  },
  {
    username: 'tobi_a', displayName: 'Tobi Adewale', avatarUrl: null, blobTint: 'lavender', viewed: true,
    slides: [
      { id: 's5', gradient: 'radial-gradient(circle at 70% 25%, var(--blob-lavender), transparent 55%), linear-gradient(160deg, #7C6FE0, var(--charcoal))', emoji: '🎧', caption: 'Studio session', createdAt: new Date(Date.now() - 22 * 3600_000).toISOString() },
    ],
  },
];

const SLIDE_DURATION_MS = 5000;

export function Stories() {
  const [users, setUsers] = useState(DUMMY_STORIES);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const markViewed = (username: string) =>
    setUsers((prev) => prev.map((u) => (u.username === username ? { ...u, viewed: true } : u)));

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-0.5 pb-1 pt-0.5">
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <motion.button whileTap={{ scale: 0.92 }}
            className="relative grid size-16 place-items-center rounded-full"
            style={{ background: 'linear-gradient(135deg, var(--blob-powder), var(--surface-raised))' }}
            aria-label="Add your story"
          >
            <span className="grid size-[58px] place-items-center rounded-full border-2 border-dashed" style={{ borderColor: 'var(--accent)' }}>
              <Plus size={20} className="text-accent" />
            </span>
          </motion.button>
          <span className="max-w-[64px] truncate text-[11px] font-medium text-ink-soft">Your story</span>
        </div>

        {users.map((u, i) => (
          <motion.button key={u.username} onClick={() => setOpenIndex(i)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -2 }}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div className="relative">
              {!u.viewed && (
                <motion.span
                  className="absolute -inset-1 rounded-full opacity-60 blur-[6px]"
                  style={{ background: 'linear-gradient(135deg, var(--celebrate), var(--accent))' }}
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              <span
                className="relative grid size-16 place-items-center rounded-full p-[2.5px]"
                style={{
                  background: u.viewed
                    ? 'var(--hairline)'
                    : 'conic-gradient(from 180deg, var(--celebrate), var(--accent), #7C6FE0, var(--celebrate))',
                }}
              >
                <span className="grid size-full place-items-center rounded-full bg-[var(--surface)] p-[2.5px]">
                  <BlobAvatar name={u.displayName} tint={u.blobTint} avatarUrl={u.avatarUrl} size={54} />
                </span>
              </span>
            </div>
            <span className={`max-w-[64px] truncate text-[11px] ${u.viewed ? 'text-ink-faint' : 'font-medium text-ink'}`}>
              {u.displayName.split(' ')[0]}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <StoryViewer users={users} startIndex={openIndex} onClose={() => setOpenIndex(null)} onViewed={markViewed} />
        )}
      </AnimatePresence>
    </>
  );
}

function StoryViewer({
  users, startIndex, onClose, onViewed,
}: { users: StoryUser[]; startIndex: number; onClose: () => void; onViewed: (username: string) => void }) {
  const [userIndex, setUserIndex] = useState(startIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [comment, setComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [sent, setSent] = useState(false);
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  const user = users[userIndex];
  const slide = user?.slides[slideIndex];

  useEffect(() => { if (user) onViewed(user.username); }, [user, onViewed]);

  useEffect(() => {
    if (!slide || paused) return;
    setProgress(0);
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const pct = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) goNext();
      else rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIndex, slideIndex, paused]);

  const goNext = () => {
    if (!user) return;
    if (slideIndex < user.slides.length - 1) setSlideIndex((i) => i + 1);
    else if (userIndex < users.length - 1) { setUserIndex((i) => i + 1); setSlideIndex(0); }
    else onClose();
    setLiked(false);
  };
  const goPrev = () => {
    if (slideIndex > 0) setSlideIndex((i) => i - 1);
    else if (userIndex > 0) { setUserIndex((i) => i - 1); setSlideIndex(Math.max(0, users[userIndex - 1].slides.length - 1)); }
    setLiked(false);
  };

  const sendComment = () => {
    if (!comment.trim()) return;
    setComment('');
    setSent(true);
    setTimeout(() => setSent(false), 1800);
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setLiked(true);
      const rect = e.currentTarget.getBoundingClientRect();
      setBurst({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: now });
      setPaused(false);
    }
    lastTapRef.current = now;
  };

  if (!user || !slide) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/92 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="relative flex h-[92dvh] w-full max-w-[420px] flex-col overflow-hidden rounded-[32px] text-white shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:h-[85dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Layered background with a slow drift for texture */}
        <motion.div
          className="absolute inset-0"
          style={{ background: slide.gradient }}
          key={slide.id}
          initial={{ scale: 1.08, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-black/10" />

        {/* Progress bars */}
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1.5">
          {user.slides.map((s, i) => (
            <div key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                style={{ width: i < slideIndex ? '100%' : i === slideIndex ? `${progress}%` : '0%', transition: i === slideIndex ? 'none' : 'width 0.2s' }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="relative z-20 mt-6 flex items-center gap-2.5 px-4">
          <span className="rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, var(--celebrate), white)' }}>
            <BlobAvatar name={user.displayName} tint={user.blobTint} avatarUrl={user.avatarUrl} size={32} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold drop-shadow">{user.displayName}</p>
            <p className="text-[11px] text-white/75">{timeAgo(slide.createdAt)}</p>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full transition-colors hover:bg-white/15">
            <X size={20} />
          </button>
        </div>

        {/* Tap zones */}
        <button className="absolute inset-y-0 left-0 z-10 w-1/3" onClick={goPrev}
          onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} aria-label="Previous" />
        <div
          className="absolute inset-y-0 right-0 z-10 w-2/3 cursor-pointer"
          onClick={(e) => { handleDoubleTap(e); if (Date.now() - lastTapRef.current > 10) goNext(); }}
          onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}
        />

        {/* Heart burst on double-tap */}
        <AnimatePresence>
          {burst && (
            <motion.div
              key={burst.id}
              className="pointer-events-none absolute z-20"
              style={{ left: burst.x - 32, top: burst.y - 32 }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1.1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.9, times: [0, 0.4, 1] }}
              onAnimationComplete={() => setBurst(null)}
            >
              <Heart size={64} className="fill-white text-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Caption + emoji, centered */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          {slide.emoji && (
            <motion.span
              className="text-6xl drop-shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {slide.emoji}
            </motion.span>
          )}
          <p className="font-display text-[26px] font-semibold leading-snug drop-shadow-lg">
            {slide.caption}
          </p>
        </div>

        {/* Desktop chevrons */}
        <button onClick={goPrev} className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur transition-colors hover:bg-white/20 sm:block">
          <ChevronLeft size={18} />
        </button>
        <button onClick={goNext} className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur transition-colors hover:bg-white/20 sm:block">
          <ChevronRight size={18} />
        </button>

        {/* Comment + like bar */}
        <div className="relative z-20 flex items-center gap-2 p-4" onClick={(e) => e.stopPropagation()}>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex h-11 flex-1 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-[13px] font-medium text-[var(--celebrate)] backdrop-blur">
                <Check size={15} /> Sent!
              </motion.div>
            ) : (
              <motion.input
                key="input"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                placeholder="Send a message…"
                className="h-11 flex-1 rounded-full border border-white/25 bg-white/10 px-4 text-[14px] text-white outline-none backdrop-blur placeholder:text-white/60 focus:border-white/50"
              />
            )}
          </AnimatePresence>
          <motion.button whileTap={{ scale: 0.85 }}
            onClick={() => setLiked((v) => !v)}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 backdrop-blur transition-colors hover:bg-white/20"
          >
            <Heart size={20} className={liked ? 'fill-[var(--celebrate)] text-[var(--celebrate)]' : 'text-white'} />
          </motion.button>
          <AnimatePresence>
            {comment.trim() && !sent && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                onClick={sendComment}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-charcoal shadow-lg transition-transform active:scale-90"
              >
                <Send size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}