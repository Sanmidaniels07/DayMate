'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';
import { ThemeSwitcher } from './theme-switcher';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [form, setForm] = useState({ email: '', password: '' });

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
    <div className="card p-8 sm:p-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">DayMate</p>
      <h1 className="mt-2 font-display text-[length:var(--text-title)] font-semibold">
        Welcome back
      </h1>
      <p className="mt-1 text-[15px] text-ink-soft">Your people are waiting.</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <Input label="Email" type="email" autoComplete="email" required
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Password" type="password" autoComplete="current-password" required
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
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
  );
}