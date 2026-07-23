'use client';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'celebrate' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'text-white hover:opacity-90 shadow-[0_8px_24px_rgba(59,111,234,0.28)]',
  celebrate: 'bg-celebrate text-[#3a2c10] hover:brightness-95',
  ghost: 'bg-transparent text-ink border border-[var(--hairline)] hover:bg-black/[0.03]',
  danger: 'bg-transparent text-danger border border-[var(--danger)]/30 hover:bg-[var(--danger)]/5',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', loading, disabled, children, className = '', style, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] px-6
        text-[15px] font-semibold transition-all active:scale-[0.98]
        disabled:opacity-50 disabled:pointer-events-none ${styles[variant]} ${className}`}
      style={{
        ...(variant === 'primary' ? { background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' } : {}),
        ...style,
      }}
      {...rest}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
});