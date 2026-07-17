'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';
import { ThemeSwitcher } from './theme-switcher';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(form, { onSuccess: () => router.replace('/home') });
  };
  const errorMsg =
    login.error instanceof ApiError
      ? login.error.status === 403
        ? 'Please verify your email first.'
        : login.error.message
      : null;

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 sm:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">DayMate</p>
          <h1 className="mt-2 font-display text-[length:var(--text-title)] font-semibold">
            Welcome back
          </h1>
          <p className="mt-1 text-[15px] text-ink-soft">Your people are waiting.</p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <Input label="Email" type="email" autoComplete="email" required
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[13px] font-medium text-ink-soft">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-12 w-full rounded-xl border border-[var(--hairline)] bg-[var(--surface-raised)] px-4 pr-11 text-[15px] text-ink outline-none transition-shadow placeholder:text-ink-faint focus:border-accent focus:ring-4 focus:ring-[var(--accent-soft)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                  className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition-colors hover:bg-black/[0.04] hover:text-ink-soft"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {errorMsg && <p className="text-[13px] text-danger">{errorMsg}</p>}
            <Button type="submit" loading={login.isPending} className="mt-2 w-full">
              Log in
            </Button>
          </form>

          <p className="mt-6 text-center text-[13px] text-ink-soft">
            New here?{' '}
            <Link href="/signup" className="font-semibold text-accent">Create an account</Link>
          </p>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}