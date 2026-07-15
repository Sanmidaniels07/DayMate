'use client';
export function ThemeSwitcher() {
  if (process.env.NODE_ENV === 'production') return null;
  const set = (t: string) =>
    t ? document.documentElement.setAttribute('data-theme', t)
      : document.documentElement.removeAttribute('data-theme');
  return (
    <div className="mt-8 flex justify-center gap-2 border-t border-[var(--hairline)] pt-4">
      {[['', 'Fog+Gold'], ['golden', 'Golden hour'], ['night', 'Night garden']].map(([t, label]) => (
        <button key={label} onClick={() => set(t)}
          className="rounded-full border border-[var(--hairline)] px-3 py-1 text-[11px] text-ink-soft">
          {label}
        </button>
      ))}
    </div>
  );
}