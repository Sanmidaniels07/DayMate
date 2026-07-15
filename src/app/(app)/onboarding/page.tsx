'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BlobAvatar } from '@/components/ui/blob-avatar';
import { useSessionStore } from '@/stores/session';
import {
  useUsernameAvailable, useSetupProfile, useInterests, useSetInterests,
} from '@/hooks/use-profile';
import { useDebounced } from '@/hooks/use-debounced';
import { useAvatarUpload } from '@/hooks/use-avatar-upload';
import { ApiError } from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const [step, setStep] = useState(1);

  return (
    <div className="flex flex-col gap-6">
      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {[1, 2, 3].map((n) => (
          <span key={n}
            className={`h-1.5 rounded-full transition-all ${
              n === step ? 'w-8 bg-accent' : n < step ? 'w-4 bg-accent/40' : 'w-4 bg-black/10'
            }`} />
        ))}
      </div>

      {step === 1 && <StepUsername onNext={() => setStep(2)} defaultName={user?.fullName ?? ''} />}
      {step === 2 && <StepInterests onNext={() => setStep(3)} />}
      {step === 3 && <StepAvatar onDone={() => router.replace('/home')} name={user?.fullName ?? ''} />}
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
      { onSuccess: onNext,
        onError: (e) => { if (e instanceof ApiError && e.status === 409) setUsername(''); } },
    );
  };

  return (
    <div className="card p-8">
      <h1 className="font-display text-[length:var(--text-title)] font-semibold">Claim your name</h1>
      <p className="mt-1 text-[15px] text-ink-soft">This is how people find you.</p>
      <div className="mt-6 flex flex-col gap-4">
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
          Continue
        </Button>
      </div>
    </div>
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
    <div className="card p-8">
      <h1 className="font-display text-[length:var(--text-title)] font-semibold">What are you into?</h1>
      <p className="mt-1 text-[15px] text-ink-soft">Pick a few — we&apos;ll find your people.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {data?.data.map((it) => {
          const on = selected.has(it.id);
          return (
            <button key={it.id} onClick={() => toggle(it.id)}
              className={`rounded-[var(--radius-pill)] border px-4 py-2 text-[14px] transition-all active:scale-95 ${
                on ? 'border-transparent bg-accent text-[var(--ink-on-dark)]'
                   : 'border-[var(--hairline)] bg-[var(--surface-raised)] text-ink-soft'
              }`}>
              {it.name}
            </button>
          );
        })}
      </div>
      <Button className="mt-8 w-full" loading={setInterests.isPending}
        disabled={selected.size === 0}
        onClick={() => setInterests.mutate([...selected], { onSuccess: onNext })}>
        Continue{selected.size > 0 ? ` (${selected.size})` : ''}
      </Button>
    </div>
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
    <div className="card flex flex-col items-center p-8 text-center">
      <h1 className="font-display text-[length:var(--text-title)] font-semibold">Add a face</h1>
      <p className="mt-1 text-[15px] text-ink-soft">Optional — but it helps.</p>
      <div className="relative mt-8">
        {preview ? (
          <img src={preview} alt="" className="size-28 rounded-full object-cover" />
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
      <div className="mt-8 flex w-full flex-col gap-2">
        <Button className="w-full" onClick={onDone}>{publicId ? 'Finish' : 'Skip for now'}</Button>
      </div>
    </div>
  );
}