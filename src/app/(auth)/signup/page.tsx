'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSignup } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const signup = useSignup();
  const [form, setForm] = useState({
    fullName: '', email: '', birthDate: '', gender: 'PREFER_NOT_TO_SAY', password: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    signup.mutate(form, {
      onSuccess: () => router.push(`/verify?email=${encodeURIComponent(form.email)}`),
    });
  };
  const errorMsg = signup.error instanceof ApiError ? signup.error.message : null;

  return (
    <div className="card p-8 sm:p-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-faint">DayMate</p>
      <h1 className="mt-2 font-display text-[length:var(--text-title)] font-semibold">Create your account</h1>
      <p className="mt-1 text-[15px] text-ink-soft">Find the people who share your day.</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <Input label="Full name" autoComplete="name" required
          value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
        <Input label="Email" type="email" autoComplete="email" required
          value={form.email} onChange={(e) => set('email', e.target.value)} />
        <Input label="Birthday" type="date" required
          value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-ink-soft">Gender</label>
          <select value={form.gender} onChange={(e) => set('gender', e.target.value)}
            className="h-12 rounded-xl border border-[var(--hairline)] bg-[var(--surface-raised)] px-4 text-[15px] text-ink outline-none focus:border-accent">
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </div>
        <Input label="Password" type="password" autoComplete="new-password" required
          value={form.password} onChange={(e) => set('password', e.target.value)}
          hint="At least 8 characters, with a number and a capital letter." />
        {errorMsg && <p className="text-[13px] text-danger">{errorMsg}</p>}
        <Button type="submit" loading={signup.isPending} className="mt-2 w-full">Create account</Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-ink-soft">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-accent">Log in</Link>
      </p>
    </div>
  );
}