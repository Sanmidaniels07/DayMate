'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, ChevronLeft, ChevronRight, Plus, Check, Loader2, Trash2 } from 'lucide-react';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { timeAgo } from '@/lib/time';
import {
  useStories, useCreateStory, useViewStory, useReactToStory, useDeleteStory, useStoryUpload,
  type StoryGroup,
} from '@/hooks/use-stories';
import { useOpenDm } from '@/hooks/use-chat';
import { useSessionStore } from '@/stores/session';
import { api } from '@/lib/api';

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD;
const mediaSrc = (publicId: string, type: 'IMAGE' | 'VIDEO') =>
  type === 'IMAGE'
    ? `https://res.cloudinary.com/${CLOUD}/image/upload/c_limit,w_800/${publicId}`
    : `https://res.cloudinary.com/${CLOUD}/video/upload/c_limit,w_800/${publicId}`;

const SLIDE_DURATION_MS = 5000;

export function Stories() {
  const { data, isLoading } = useStories();
  const groups = data?.data ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [viewingMine, setViewingMine] = useState(false);
  const [creating, setCreating] = useState(false);
  const meId = useSessionStore((s) => s.user?.id);
  const myGroup = groups.find((g) => g.userId === meId);
  const otherGroups = groups.filter((g) => g.userId !== meId);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto px-0.5 pb-1 pt-0.5">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton size-16 shrink-0 rounded-full" />)}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-0.5 pb-1 pt-0.5">
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => (myGroup ? setViewingMine(true) : setCreating(true))}
            className="relative grid size-16 place-items-center rounded-full"
            style={{
              background: myGroup
                ? 'conic-gradient(from 180deg, var(--celebrate), var(--accent), #7C6FE0, var(--celebrate))'
                : 'linear-gradient(135deg, var(--blob-powder), var(--surface-raised))',
            }}
            aria-label={myGroup ? 'View your story' : 'Add your story'}
          >
            <span
              className="grid size-[58px] place-items-center rounded-full border-2 border-dashed bg-[var(--surface)]"
              style={{ borderColor: myGroup ? 'transparent' : 'var(--accent)' }}
            >
              {myGroup ? (
                <BlobAvatar name={myGroup.profile.displayName} tint={myGroup.profile.blobTint} avatarUrl={myGroup.profile.avatarUrl} size={54} />
              ) : (
                <Plus size={20} className="text-accent" />
              )}
            </span>
            {myGroup && (
              <span
                onClick={(e) => { e.stopPropagation(); setCreating(true); }}
                className="absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full bg-accent text-white ring-2 ring-[var(--surface)] transition-transform hover:scale-110"
              >
                <Plus size={13} />
              </span>
            )}
          </motion.button>
          <span className="max-w-[64px] truncate text-[11px] font-medium text-ink-soft">
            {myGroup ? 'Your story' : 'Add story'}
          </span>
        </div>

        {otherGroups.map((g, idx) => (
          <motion.button key={g.userId} onClick={() => setOpenIndex(idx)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ y: -2 }}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div className="relative">
              {!g.viewed && (
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
                  background: g.viewed
                    ? 'var(--hairline)'
                    : 'conic-gradient(from 180deg, var(--celebrate), var(--accent), #7C6FE0, var(--celebrate))',
                }}
              >
                <span className="grid size-full place-items-center rounded-full bg-[var(--surface)] p-[2.5px]">
                  <BlobAvatar name={g.profile.displayName} tint={g.profile.blobTint} avatarUrl={g.profile.avatarUrl} size={54} />
                </span>
              </span>
            </div>
            <span className={`max-w-[64px] truncate text-[11px] ${g.viewed ? 'text-ink-faint' : 'font-medium text-ink'}`}>
              {g.profile.displayName.split(' ')[0]}
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {openIndex !== null && (
          <StoryViewer groups={otherGroups} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
        )}
        {viewingMine && myGroup && (
          <StoryViewer groups={[myGroup]} startIndex={0} onClose={() => setViewingMine(false)} isOwnStory />
        )}
      </AnimatePresence>

      <CreateStoryModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function StoryViewer({
  groups, startIndex, onClose, isOwnStory,
}: { groups: StoryGroup[]; startIndex: number; onClose: () => void; isOwnStory?: boolean }) {
  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reply, setReply] = useState('');
  const [sent, setSent] = useState(false);
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);

  const viewStory = useViewStory();
  const reactToStory = useReactToStory();
  const deleteStory = useDeleteStory();
  const openDm = useOpenDm();

  const group = groups[groupIndex];
  const slide = group?.slides[slideIndex];

  useEffect(() => {
    if (slide && !slide.viewed && !isOwnStory) viewStory.mutate(slide.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide?.id]);

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
  }, [groupIndex, slideIndex, paused]);

  const goNext = () => {
    if (!group) return;
    if (slideIndex < group.slides.length - 1) setSlideIndex((i) => i + 1);
    else if (groupIndex < groups.length - 1) { setGroupIndex((i) => i + 1); setSlideIndex(0); }
    else onClose();
    setLiked(false);
  };
  const goPrev = () => {
    if (slideIndex > 0) setSlideIndex((i) => i - 1);
    else if (groupIndex > 0) { setGroupIndex((i) => i - 1); setSlideIndex(Math.max(0, groups[groupIndex - 1].slides.length - 1)); }
    setLiked(false);
  };

  const sendReply = () => {
    if (!reply.trim() || !group || !slide) return;
    const body = reply.trim();
    setReply('');
    openDm.mutate(group.profile.username, {
      onSuccess: (res) => {
        api(`/chat/conversations/${res.data.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({ body, replyToStoryId: slide.id }),
        }).catch(() => {});
      },
    });
    setSent(true);
    setTimeout(() => setSent(false), 1800);
  };

  const handleDoubleTap = (e: React.MouseEvent) => {
    if (isOwnStory) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300 && slide) {
      setLiked(true);
      reactToStory.mutate({ storyId: slide.id, emoji: '❤️' });
      const rect = e.currentTarget.getBoundingClientRect();
      setBurst({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: now });
      setPaused(false);
    }
    lastTapRef.current = now;
  };

  if (!group || !slide) return null;
  const isVideo = slide.mediaType === 'VIDEO';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/92 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="relative flex h-[92dvh] w-full max-w-[420px] flex-col overflow-hidden rounded-[32px] bg-black text-white shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:h-[85dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video key={slide.id} src={mediaSrc(slide.mediaUrl, 'VIDEO')} autoPlay muted playsInline
            className="absolute inset-0 size-full object-cover" />
        ) : (
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${mediaSrc(slide.mediaUrl, 'IMAGE')})` }}
            key={slide.id}
            initial={{ scale: 1.08, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
        <div className="absolute inset-0 bg-black/15" />

        <div className="absolute inset-x-3 top-3 z-20 flex gap-1.5">
          {group.slides.map((s, i) => (
            <div key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                style={{ width: i < slideIndex ? '100%' : i === slideIndex ? `${progress}%` : '0%', transition: i === slideIndex ? 'none' : 'width 0.2s' }} />
            </div>
          ))}
        </div>

        <div className="relative z-20 mt-6 flex items-center gap-2.5 px-4">
          <span className="rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg, var(--celebrate), white)' }}>
            <BlobAvatar name={group.profile.displayName} tint={group.profile.blobTint} avatarUrl={group.profile.avatarUrl} size={32} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold drop-shadow">{group.profile.displayName}</p>
            <p className="text-[11px] text-white/75">{timeAgo(slide.createdAt)}</p>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full transition-colors hover:bg-white/15">
            <X size={20} />
          </button>
        </div>

        <button className="absolute inset-y-0 left-0 z-10 w-1/3" onClick={goPrev}
          onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} aria-label="Previous" />
        <div
          className="absolute inset-y-0 right-0 z-10 w-2/3 cursor-pointer"
          onClick={(e) => { handleDoubleTap(e); if (Date.now() - lastTapRef.current > 10) goNext(); }}
          onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}
        />

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

        {slide.caption ? (
          <div className="relative z-10 flex flex-1 items-center justify-center px-8 text-center">
            <p className="font-display text-[22px] font-semibold leading-snug drop-shadow-lg">
              {slide.caption}
            </p>
          </div>
        ) : (
          <div className="relative z-10 flex-1" />
        )}

        <button onClick={goPrev} className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur transition-colors hover:bg-white/20 sm:block">
          <ChevronLeft size={18} />
        </button>
        <button onClick={goNext} className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 backdrop-blur transition-colors hover:bg-white/20 sm:block">
          <ChevronRight size={18} />
        </button>

        <div className="relative z-20 flex items-center gap-2 p-4" onClick={(e) => e.stopPropagation()}>
          {isOwnStory ? (
            <button
              onClick={() => slide && deleteStory.mutate(slide.id, { onSuccess: onClose })}
              disabled={deleteStory.isPending}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 text-[14px] font-medium text-white backdrop-blur transition-colors hover:bg-[var(--danger)]/30 disabled:opacity-60"
            >
              {deleteStory.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Trash2 size={16} /> Delete story
                </>
              )}
            </button>
          ) : (
            <>
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
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onFocus={() => setPaused(true)}
                    onBlur={() => setPaused(false)}
                    onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                    placeholder="Send a message…"
                    className="h-11 flex-1 rounded-full border border-white/25 bg-white/10 px-4 text-[14px] text-white outline-none backdrop-blur placeholder:text-white/60 focus:border-white/50"
                  />
                )}
              </AnimatePresence>
              <motion.button whileTap={{ scale: 0.85 }}
                onClick={() => {
                  setLiked((v) => !v);
                  reactToStory.mutate({ storyId: slide.id, emoji: '❤️' });
                }}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 backdrop-blur transition-colors hover:bg-white/20"
              >
                <Heart size={20} className={liked ? 'fill-[var(--celebrate)] text-[var(--celebrate)]' : 'text-white'} />
              </motion.button>
              <AnimatePresence>
                {reply.trim() && !sent && (
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                    onClick={sendReply}
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-charcoal shadow-lg transition-transform active:scale-90"
                  >
                    <Send size={18} />
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CreateStoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { uploadStorySlide } = useStoryUpload();
  const createStory = useCreateStory();
  const [uploading, setUploading] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video');
    setUploading(true);
    const publicId = await uploadStorySlide(file, isVideo ? 'video' : 'image');
    setUploading(false);
    if (publicId) {
      createStory.mutate(
        { mediaUrl: publicId, mediaType: isVideo ? 'VIDEO' : 'IMAGE' },
        { onSuccess: onClose },
      );
    }
    e.target.value = '';
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="card w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <p className="font-display text-lg font-semibold">Add to your story</p>
        <p className="mt-1 text-[13px] text-ink-soft">Photos or short videos — visible for 24 hours.</p>
        <label className="mt-5 flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--hairline)] text-ink-soft transition-colors hover:border-accent hover:text-accent">
          {uploading || createStory.isPending ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <Plus size={24} />
              <span className="text-[13px] font-medium">Choose photo or video</span>
            </>
          )}
          <input type="file" accept="image/*,video/*" className="hidden" onChange={onFile} disabled={uploading || createStory.isPending} />
        </label>
        <button onClick={onClose} className="mt-4 text-[13px] font-medium text-ink-faint">Cancel</button>
      </div>
    </div>
  );
}