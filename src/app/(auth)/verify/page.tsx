'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVerifyEmail } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';

function VerifyInner() {
  const router = useRouter();
  const email = useSearchParams().get('email') ?? '';
  const verify = useVerifyEmail();
  const [code, setCode] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    verify.mutate({ email, code }, { onSuccess: () => router.replace('/login?verified=1') });
  };
  const errorMsg = verify.error instanceof ApiError ? verify.error.message : null;

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 sm:p-10 text-center">
          <h1 className="font-display text-[length:var(--text-title)] font-semibold">Check your email</h1>
          <p className="mt-1 text-[15px] text-ink-soft">
            We sent a 6-digit code to<br /><span className="font-medium text-ink">{email || 'your inbox'}</span>.
          </p>
          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <Input label="Verification code" inputMode="numeric" autoComplete="one-time-code"
              maxLength={6} className="text-center font-mono text-2xl tracking-[0.5em]"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            {errorMsg && <p className="text-[13px] text-danger">{errorMsg}</p>}
            <Button type="submit" loading={verify.isPending} disabled={code.length !== 6} className="w-full">
              Verify
            </Button>
          </form>
          <p className="mt-6 text-[13px] text-ink-soft">
            Wrong email? <Link href="/signup" className="font-semibold text-accent">Start over</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}