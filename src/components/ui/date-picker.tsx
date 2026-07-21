'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function parseDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtLabel(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type PickerView = 'days' | 'months' | 'years';

export function DatePicker({ label, value, onChange, placeholder = 'Select a date', minDate, maxDate }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<PickerView>('days');
  const selected = parseDate(value);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  const min = minDate ? parseDate(minDate) : null;
  const max = maxDate ? parseDate(maxDate) : null;

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) { setViewDate(selected ?? new Date()); setView('days'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const changeMonth = (delta: number) => setViewDate(new Date(year, month + delta, 1));

  const isDisabled = (d: Date) => !!((min && d < min) || (max && d > max));

  const pick = (d: Date) => {
    if (isDisabled(d)) return;
    onChange(fmt(d));
    setOpen(false);
  };

  // Bounds for the year grid — falls back to a sensible ±100y window if no min/max given.
  const yearMin = min?.getFullYear() ?? year - 100;
  const yearMax = max?.getFullYear() ?? year + 100;
  const years: number[] = [];
  for (let y = yearMax; y >= yearMin; y--) years.push(y);

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
      {label && <label className="text-[13px] font-medium text-ink-soft">{label}</label>}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-[var(--surface-raised)] px-4 text-left text-[15px] outline-none transition-all ${
          open ? 'border-accent shadow-[0_0_0_4px_var(--accent-soft)]' : 'border-[var(--hairline)] hover:border-accent/40'
        }`}
      >
        <span className={selected ? 'text-ink' : 'text-ink-faint'}>
          {selected ? fmtLabel(selected) : placeholder}
        </span>
        <Calendar size={17} className={open ? 'text-accent' : 'text-ink-faint'} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-full z-30 mt-2 w-[300px] overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--surface)] p-3 shadow-[var(--shadow-float)]"
          >
            {/* Header — chevrons navigate; center label opens month/year quick-pick */}
            <div className="mb-2 flex items-center justify-between px-1">
              <button type="button"
                onClick={() => view === 'days' ? changeMonth(-1) : setViewDate(new Date(year - 1, month, 1))}
                className="grid size-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--accent-soft)] hover:text-accent">
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() => setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'days')}
                className="rounded-full px-3 py-1 font-display text-[14px] font-semibold transition-colors hover:bg-[var(--accent-soft)] hover:text-accent"
              >
                {view === 'days' ? `${MONTH_NAMES[month]} ${year}` : view === 'months' ? year : `${years[years.length - 1]}–${years[0]}`}
              </button>

              <button type="button"
                onClick={() => view === 'days' ? changeMonth(1) : setViewDate(new Date(year + 1, month, 1))}
                className="grid size-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-[var(--accent-soft)] hover:text-accent">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* ---- Days view ---- */}
            {view === 'days' && (
              <>
                <div className="mb-1 grid grid-cols-7">
                  {WEEKDAYS.map((w, i) => (
                    <span key={i} className="grid h-8 place-items-center text-[11px] font-medium text-ink-faint">{w}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {cells.map((d, i) => {
                    if (!d) return <span key={i} />;
                    const disabled = isDisabled(d);
                    const isSelected = selected && isSameDay(d, selected);
                    const isToday = isSameDay(d, new Date());
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={disabled}
                        onClick={() => pick(d)}
                        className={`relative grid h-9 place-items-center rounded-full text-[13px] transition-colors ${
                          disabled
                            ? 'cursor-not-allowed text-ink-faint/40'
                            : isSelected
                            ? 'font-semibold text-white shadow-sm'
                            : 'text-ink hover:bg-[var(--accent-soft)]'
                        }`}
                        style={isSelected ? { background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' } : undefined}
                      >
                        {d.getDate()}
                        {isToday && !isSelected && <span className="absolute bottom-1 size-1 rounded-full bg-accent" />}
                      </button>
                    );
                  })}
                </div>
                {!isDisabled(new Date()) && (
                  <button
                    type="button"
                    onClick={() => pick(new Date())}
                    className="mt-2 w-full rounded-xl px-3 py-2 text-center text-[13px] font-medium text-accent transition-colors hover:bg-[var(--accent-soft)]"
                  >
                    Today
                  </button>
                )}
              </>
            )}

            {/* ---- Months view ---- */}
            {view === 'months' && (
              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_SHORT.map((m, i) => {
                  const isCurrent = i === month;
                  const monthDate = new Date(year, i, 1);
                  const monthDisabled = (min && new Date(year, i + 1, 0) < min) || (max && monthDate > max);
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={!!monthDisabled}
                      onClick={() => { setViewDate(new Date(year, i, 1)); setView('days'); }}
                      className={`rounded-xl py-2.5 text-[13px] font-medium transition-colors ${
                        monthDisabled
                          ? 'cursor-not-allowed text-ink-faint/40'
                          : isCurrent
                          ? 'text-white shadow-sm'
                          : 'text-ink hover:bg-[var(--accent-soft)]'
                      }`}
                      style={isCurrent ? { background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' } : undefined}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ---- Years view ---- */}
            {view === 'years' && (
              <div className="grid max-h-[240px] grid-cols-3 gap-1.5 overflow-y-auto pr-1">
                {years.map((y) => {
                  const isCurrent = y === year;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => { setViewDate(new Date(y, month, 1)); setView('months'); }}
                      className={`rounded-xl py-2.5 text-[13px] font-medium transition-colors ${
                        isCurrent ? 'text-white shadow-sm' : 'text-ink hover:bg-[var(--accent-soft)]'
                      }`}
                      style={isCurrent ? { background: 'linear-gradient(135deg, var(--accent), var(--charcoal))' } : undefined}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}