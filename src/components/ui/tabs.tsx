'use client';
import { motion } from 'framer-motion';

interface Props {
  tabs: { key: string; label: string; badge?: number }[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: Props) {
  const index = tabs.findIndex((t) => t.key === active);
  const width = 100 / tabs.length;

  return (
    <div className="relative flex gap-1 rounded-[var(--radius-pill)] bg-[var(--charcoal)]/[0.06] p-1">
      <motion.div
        className="absolute inset-y-1 rounded-[var(--radius-pill)] shadow-sm"
        style={{
          width: `calc(${width}% - 4px)`,
          background: 'linear-gradient(135deg, var(--accent), var(--charcoal))',
        }}
        animate={{ x: `calc(${index * 100}% + ${index * 4}px)` }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      />
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative z-10 flex-1 rounded-[var(--radius-pill)] py-2 text-[14px] font-medium transition-colors duration-200 ${
              isActive ? 'text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
            {t.badge ? (
              <span
                className={`ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-celebrate text-[#3a2c10]'
                }`}
              >
                {t.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}