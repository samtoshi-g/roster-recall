'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AutocompleteDropdown from './AutocompleteDropdown';
import type { SearchResult } from '@/lib/players';

interface SearchInputProps {
  onSelect: (player: SearchResult) => void;
  disabled?: boolean;
  leagueFilter: string;
  duplicateSignal: number;
}

export default function SearchInput({
  onSelect,
  disabled,
  leagueFilter,
  duplicateSignal
}: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [duplicateSignal]);

  useEffect(() => {
    if (!duplicateSignal) return;
    setShake(true);
    const timeout = setTimeout(() => setShake(false), 300);
    return () => clearTimeout(timeout);
  }, [duplicateSignal]);

  useEffect(() => {
    if (disabled) return;
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ q: query, league: leagueFilter });
        const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Search failed');
        }
        const data = await response.json();
        const nextResults = data.results || [];
        setResults(nextResults);
        setActiveIndex(0);
        setOpen(nextResults.length > 0);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError('Network hiccup. Keep going!');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [query, leagueFilter, disabled]);

  const handleSelect = (player: SearchResult) => {
    onSelect(player);
    setQuery('');
    setResults([]);
    setOpen(false);
    setActiveIndex(0);
  };

  const visibleResults = useMemo(() => results.slice(0, 8), [results]);

  return (
    <div className="relative w-full">
      <div
        className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-surface px-4 py-3 shadow-glow transition ${
          shake ? 'animate-shake border-rose-400/60' : 'focus-within:border-accent/60'
        }`}
      >
        <span className="text-sm uppercase tracking-[0.2em] text-muted">Name</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (!open || visibleResults.length === 0) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((prev) => (prev + 1) % visibleResults.length);
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((prev) => (prev - 1 + visibleResults.length) % visibleResults.length);
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSelect(visibleResults[activeIndex]);
            }
            if (event.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder="Start typing a player name..."
          disabled={disabled}
          className="flex-1 bg-transparent text-lg font-semibold text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        {loading && (
          <span className="text-xs text-muted">...</span>
        )}
      </div>
      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
      {open && visibleResults.length > 0 ? (
        <AutocompleteDropdown
          results={visibleResults}
          activeIndex={activeIndex}
          onHover={setActiveIndex}
          onSelect={handleSelect}
        />
      ) : null}
    </div>
  );
}
