'use client';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 py-3 text-left disabled:opacity-50"
    >
      <div className="min-w-0">
        <p className="text-[15px] font-medium">{label}</p>
        {description && <p className="text-[13px] text-ink-soft">{description}</p>}
      </div>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-black/15'
      }`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`} />
      </span>
    </button>
  );
}