export function TypingDots() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-2xl bg-[var(--surface-raised)] border border-[var(--hairline)] px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span key={i}
          className="size-1.5 rounded-full bg-ink-faint"
          style={{ animation: `typing 1.2s ${i * 0.15}s infinite ease-in-out` }} />
      ))}
    </div>
  );
}