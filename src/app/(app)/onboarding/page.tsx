'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { useSessionStore } from '@/stores/session';
import {
  useUsernameAvailable, useSetupProfile, useInterests, useSetInterests, useUpdateProfile,
} from '@/hooks/use-profile';
import { useDebounced } from '@/hooks/use-debounced';
import { useAvatarUpload } from '@/hooks/use-avatar-upload';
import { ApiError } from '@/lib/api';

const STEPS = ['Name', 'Interests', 'Anniversary', 'Photo'];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.25 } },
};

export default function OnboardingPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [step, setStep] = useState(1);

  return (
    <div className="mx-auto flex flex-col justify-center gap-6 px-4 py-10">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <motion.span
                className={`h-1.5 w-full rounded-full ${
                  n === step ? 'bg-accent' : n < step ? 'bg-accent/50' : 'bg-black/10'
                }`}
                layout transition={{ duration: 0.3 }}
              />
              <span className={`text-[10px] font-medium uppercase tracking-wide ${
                n === step ? 'text-accent' : 'text-ink-faint'
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" variants={fadeUp} initial="hidden" animate="show" exit="exit">
            <StepUsername onNext={() => setStep(2)} defaultName={user?.fullName ?? ''} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" variants={fadeUp} initial="hidden" animate="show" exit="exit">
            <StepInterests onNext={() => setStep(3)} />
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="s3" variants={fadeUp} initial="hidden" animate="show" exit="exit">
            <StepAnniversary onNext={() => setStep(4)} />
          </motion.div>
        )}
        {step === 4 && (
          <motion.div key="s4" variants={fadeUp} initial="hidden" animate="show" exit="exit">
            <StepAvatar onDone={() => router.replace('/home')} name={user?.fullName ?? ''} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepShell({
  eyebrow, title, subtitle, children,
}: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card relative overflow-hidden p-8">
      <motion.div
        className="absolute -right-10 -top-10 size-40 rounded-full opacity-40 blur-2xl"
        style={{ background: 'var(--celebrate)' }}
        animate={{ opacity: [0.25, 0.4, 0.25], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">{eyebrow}</p>
        <h1 className="mt-1 font-display text-[26px] font-semibold leading-tight tracking-[-0.01em]">{title}</h1>
        <p className="mt-1.5 text-[14px] text-ink-soft">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}

function StepUsername({ onNext, defaultName }: { onNext: () => void; defaultName: string }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(defaultName);
  const debounced = useDebounced(username);
  const availability = useUsernameAvailable(debounced);
  const setup = useSetupProfile();

  const clean = /^[a-z0-9_]{3,20}$/.test(debounced);
  const available = clean && availability.data?.data.available;
  const status =
    !username ? null
    : !/^[a-z0-9_]*$/.test(username) ? { msg: 'Lowercase letters, numbers, underscore only', ok: false }
    : username.length < 3 ? { msg: 'At least 3 characters', ok: false }
    : availability.isFetching ? { msg: 'Checking…', ok: null }
    : available ? { msg: `@${username} is available`, ok: true }
    : { msg: 'Taken — try another', ok: false };

  const submit = () => {
    setup.mutate(
      { username: debounced, displayName: displayName.trim() },
      {
        onSuccess: (res) => {
          useSessionStore.getState().setUsername(res.data.username);
          onNext();
        },
        onError: (e) => { if (e instanceof ApiError && e.status === 409) setUsername(''); },
      },
    );
  };
  
  return (
    <StepShell eyebrow="Step 1 of 4" title="Claim your name" subtitle="This is how people find you.">
      <div className="flex flex-col gap-4">
        <Input label="Display name" value={displayName}
          onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
        <div>
          <Input label="Username" value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            maxLength={20} placeholder="maya_s"
            className={status?.ok === true ? 'border-[var(--success)]' : ''} />
          {status && (
            <p className={`mt-1.5 text-[13px] ${
              status.ok === true ? 'text-[var(--success)]' : status.ok === false ? 'text-danger' : 'text-ink-faint'
            }`}>{status.msg}</p>
          )}
        </div>
        <Button className="mt-2 w-full" disabled={!available || !displayName.trim()}
          loading={setup.isPending} onClick={submit}>
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </StepShell>
  );
}

function StepInterests({ onNext }: { onNext: () => void }) {
  const { data } = useInterests();
  const setInterests = useSetInterests();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <StepShell eyebrow="Step 2 of 4" title="What are you into?" subtitle="Pick a few — we'll find your people.">
      <div className="flex flex-wrap gap-2">
        {data?.data.map((it) => {
          const on = selected.has(it.id);
          return (
            <motion.button key={it.id} onClick={() => toggle(it.id)}
              whileTap={{ scale: 0.94 }}
              className={`rounded-[var(--radius-pill)] border px-4 py-2 text-[14px] transition-colors ${
                on ? 'border-transparent bg-accent text-[var(--ink-on-dark)] shadow-sm'
                   : 'border-[var(--hairline)] bg-[var(--surface-raised)] text-ink-soft'
              }`}>
              {it.name}
            </motion.button>
          );
        })}
      </div>
      <Button className="mt-8 w-full" loading={setInterests.isPending}
        disabled={selected.size === 0}
        onClick={() => setInterests.mutate([...selected], { onSuccess: onNext })}>
        Continue{selected.size > 0 ? ` (${selected.size})` : ''} <ArrowRight size={16} />
      </Button>
    </StepShell>
  );
}

function StepAnniversary({ onNext }: { onNext: () => void }) {
  const [date, setDate] = useState('');
  const update = useUpdateProfile();

  const submit = () => {
    if (!date) { onNext(); return; }
    update.mutate({ anniversaryDate: date }, { onSuccess: onNext, onError: onNext });
  };

  return (
    <StepShell
      eyebrow="Step 3 of 4"
      title="Married? Add your day 💍"
      subtitle="Optional — meet other couples who share your anniversary."
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--celebrate-soft)] px-4 py-3">
          <Heart size={18} className="shrink-0 text-[#8a6410]" />
          <p className="text-[13px] leading-snug text-[#6b4e0c]">
            We only use the month and day — never the year. You can add or remove this anytime.
          </p>
        </div>
        <Input label="Wedding anniversary" type="date" value={date}
          onChange={(e) => setDate(e.target.value)} />
        <div className="mt-2 flex gap-2">
          <button onClick={onNext}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] py-3 text-[14px] font-medium text-ink-soft transition-colors hover:bg-black/[0.03]">
            <SkipForward size={15} /> Skip
          </button>
          <Button className="flex-[1.4]" loading={update.isPending} onClick={submit}>
            Continue <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </StepShell>
  );
}

function StepAvatar({ onDone, name }: { onDone: () => void; name: string }) {
  const { upload, uploading, error } = useAvatarUpload();
  const [publicId, setPublicId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const id = await upload(file);
    if (id) setPublicId(id);
  };

  return (
    <StepShell eyebrow="Step 4 of 4" title="Add a face" subtitle="Optional — but it helps people recognize you.">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          {preview ? (
            <img src={preview} alt="" className="size-28 rounded-full object-cover shadow-[var(--shadow-float)]" />
          ) : (
            <BlobAvatar name={name} size={112} />
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center rounded-full bg-black/30">
              <span className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
        <label className="mt-6 cursor-pointer text-[14px] font-semibold text-accent">
          {publicId ? 'Change photo' : 'Choose photo'}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} />
        </label>
        {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
        <Button className="mt-8 w-full" onClick={onDone}>
          {publicId ? 'Finish' : 'Skip for now'}
        </Button>
      </div>
    </StepShell>
  );
}