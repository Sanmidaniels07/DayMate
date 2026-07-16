'use client';
import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { PersonRow } from '@/components/features/person-row';
import { useUserSearch } from '@/hooks/use-search';
import { useDebounced } from '@/hooks/use-debounced';

export default function SearchPage() {
  const [q, setQ] = useState('');
  const debounced = useDebounced(q, 350);
  const { data, isFetching } = useUserSearch(debounced);
  const rows = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[length:var(--text-title)] font-semibold">Search</h1>
      <div className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--surface-raised)] px-4">
        <SearchIcon size={18} className="text-ink-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus
          placeholder="Search by name or @username"
          className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-faint" />
      </div>

      {debounced.trim().length < 2 ? (
        <p className="py-8 text-center text-[14px] text-ink-faint">Type at least 2 characters.</p>
      ) : isFetching ? (
        <div className="flex justify-center py-8">
          <span className="size-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-ink-soft">No one found for “{debounced}”.</p>
      ) : (
        <div className="card px-5">
          {rows.map((u) => (
            <PersonRow key={u.username} {...u} subtitle={u.bio ?? `@${u.username}`} />
          ))}
        </div>
      )}
    </div>
  );
}