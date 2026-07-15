'use client';

interface Props {
  tabs: { key: string; label: string; badge?: number }[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-[var(--radius-pill)] bg-black/[0.04] p-1">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`relative flex-1 rounded-[var(--radius-pill)] py-2 text-[14px] font-medium transition-colors ${
            active === t.key ? 'bg-[var(--surface-raised)] text-ink shadow-[var(--shadow-card)]' : 'text-ink-soft'
          }`}>
          {t.label}
          {t.badge ? (
            <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-celebrate px-1.5 text-[11px] font-bold text-[#3a2c10]">
              {t.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}