'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useVerifyEmail, useResendOtp } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api';

const RESEND_WAIT_S = 60;

function VerifyInner() {
  const router = useRouter();
  const email = useSearchParams().get('email') ?? '';
  const verify = useVerifyEmail();
  const resend = useResendOtp();
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_WAIT_S);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    verify.mutate({ email, code }, { onSuccess: () => router.replace('/login?verified=1') });
  };

  const doResend = () => {
    if (cooldown > 0 || resend.isPending || !email) return;
    resend.mutate(email, {
      onSettled: () => setCooldown(RESEND_WAIT_S), 
    });
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

          {/* Resend with cooldown */}
          <div className="mt-4">
            {cooldown > 0 ? (
              <p className="text-[13px] text-ink-faint">
                Didn&apos;t get a code? Resend in{' '}
                <span className="font-mono font-semibold text-ink-soft">0:{String(cooldown).padStart(2, '0')}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={doResend}
                disabled={resend.isPending}
                className="text-[13px] font-semibold text-accent disabled:opacity-60"
              >
                {resend.isPending ? 'Sending…' : "Didn't get a code? Resend"}
              </button>
            )}
            {resend.isSuccess && cooldown > 0 && (
              <p className="mt-1 text-[12px] text-[var(--success)]">A fresh code is on its way.</p>
            )}
          </div>

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