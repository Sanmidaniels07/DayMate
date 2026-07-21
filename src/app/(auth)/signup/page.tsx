'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Cake, Users, MessageCircle, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSignup } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { SignupHero } from '@/components/features/sign-up-hero';

const HERO_POINTS = [
  { icon: Cake, text: 'Meet people who share your exact birthday', gradient: 'linear-gradient(135deg, var(--blob-blush), var(--celebrate))' },
  { icon: Users, text: 'Join circles for your day, month, and age', gradient: 'linear-gradient(135deg, var(--blob-lavender), #7C6FE0)' },
  { icon: MessageCircle, text: 'Chat, call, and celebrate together', gradient: 'linear-gradient(135deg, var(--blob-powder), var(--accent))' },
  { icon: Sparkles, text: 'Discover your birthday twins nearby', gradient: 'linear-gradient(135deg, var(--blob-sage), #2FA36B)' },
];

const BLOBS = [
  { tint: 'var(--blob-powder)', x: '10%', y: '16%', size: 64, delay: 0 },
  { tint: 'var(--blob-blush)', x: '74%', y: '10%', size: 48, delay: 0.3 },
  { tint: 'var(--blob-lavender)', x: '80%', y: '60%', size: 72, delay: 0.6 },
  { tint: 'var(--blob-sage)', x: '16%', y: '70%', size: 56, delay: 0.9 },
  { tint: 'var(--blob-butter)', x: '46%', y: '82%', size: 44, delay: 1.2 },
  { tint: 'var(--blob-peach)', x: '55%', y: '30%', size: 38, delay: 1.5 },
];

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

const MAX_BIRTH_DATE = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13); 
  return d.toISOString().slice(0, 10);
})();

export default function SignupPage() {
  const router = useRouter();
  const signup = useSignup();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', birthDate: '', gender: 'PREFER_NOT_TO_SAY', password: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { phone, ...rest } = form;
    signup.mutate(
      { ...rest, ...(phone.trim() ? { phone: phone.trim() } : {}) },
      { onSuccess: () => router.push(`/verify?email=${encodeURIComponent(form.email)}`) },
    );
  };
  const errorMsg = signup.error instanceof ApiError ? signup.error.message : null;

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ---- Hero half ---- */}
       <div className="hidden lg:block">
        <SignupHero />
      </div>

      {/* ---- Form half ---- */}
      <div className="relative flex items-center justify-center overflow-hidden px-6 py-10"
        style={{ background: 'var(--canvas)' }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 500px 300px at 90% 0%, var(--accent-soft), transparent 60%), radial-gradient(ellipse 400px 250px at 0% 100%, var(--celebrate-soft), transparent 55%)',
          }}
        />
        <div className="relative w-full max-w-md">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint lg:hidden">DayMate</p>
          <h2 className="mt-2 font-display text-[length:var(--text-title)] font-semibold lg:mt-0">
            Create your account
          </h2>
          <p className="mt-1 text-[15px] text-ink-soft">Find the people who share your day.</p>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
            <Input label="Full name" autoComplete="name" required
              value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
            <Input label="Email" type="email" autoComplete="email" required
              value={form.email} onChange={(e) => set('email', e.target.value)} />
            <Input label="Phone number" type="tel" autoComplete="tel"
              placeholder="080… (optional)"
              hint="Optional — lets you log in with your phone too."
              value={form.phone} onChange={(e) => set('phone', e.target.value)} />
             <DatePicker
              label="Birthday"
              value={form.birthDate}
              onChange={(v) => set('birthDate', v)}
              maxDate={MAX_BIRTH_DATE}
              placeholder="Select your birthday"
            />
            <Select
              label="Gender"
              value={form.gender}
              onChange={(v) => set('gender', v)}
              options={GENDER_OPTIONS}
            />

            <div className="relative">
              <Input label="Password" type={showPassword ? 'text' : 'password'}
                autoComplete="new-password" required
                value={form.password} onChange={(e) => set('password', e.target.value)}
                hint="At least 8 characters, with a number and a capital letter." />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-[38px] grid size-8 place-items-center rounded-full text-ink-faint transition-colors hover:bg-[var(--accent-soft)] hover:text-accent">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {errorMsg && <p className="text-[13px] text-danger">{errorMsg}</p>}

            <motion.button
              type="submit"
              disabled={signup.isPending}
              whileTap={{ scale: 0.98 }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(59,111,234,0.28)] transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' }}
            >
              {signup.isPending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                'Create account'
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-[13px] text-ink-soft">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-accent">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}