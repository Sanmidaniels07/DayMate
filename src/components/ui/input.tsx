'use client';
import { forwardRef, useId, type InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, className = '', ...rest },
  ref,
) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        aria-invalid={!!error}
        className={`h-12 rounded-xl border bg-[var(--surface-raised)] px-4 text-[15px] text-ink
          placeholder:text-ink-faint outline-none transition-shadow
          ${error ? 'border-[var(--danger)]' : 'border-[var(--hairline)]'}
          focus:border-accent focus:ring-4 focus:ring-[var(--accent-soft)] ${className}`}
        {...rest}
      />
      {error ? (
        <p className="text-[13px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
});