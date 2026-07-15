'use client';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'celebrate' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-accent text-[var(--ink-on-dark)] hover:bg-[var(--accent-hover)]',
  celebrate: 'bg-celebrate text-[#3a2c10] hover:brightness-95',
  ghost: 'bg-transparent text-ink border border-[var(--hairline)] hover:bg-black/[0.03]',
  danger: 'bg-transparent text-danger border border-[var(--danger)]/30 hover:bg-[var(--danger)]/5',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', loading, disabled, children, className = '', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] px-6
        text-[15px] font-semibold transition-all active:scale-[0.98]
        disabled:opacity-50 disabled:pointer-events-none ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});