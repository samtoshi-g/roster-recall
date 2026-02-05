'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import AutocompleteDropdown from './AutocompleteDropdown';
import type { SearchResult } from '@/lib/players';
import { search, preloadData, isDataLoaded } from '@/lib/client-search';

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
  const searchIdRef = useRef(0);

  // Preload player data on mount
  useEffect(() => {
    preloadData().catch(() => {
      // Silently fail - will retry on first search
    });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [duplicateSignal]);

  useEffect(() => {
    if (!duplicateSignal) return;
    setShake(true);
    const timeout = setTimeout(() => setShake(false), 300);
    return () => clearTimeout(timeout);
  }, [duplicateSignal]);

  const performSearch = useCallback(async (searchQuery: string, searchId: number) => {
    try {
      // Show loading only if data not yet loaded
      if (!isDataLoaded()) {
        setLoading(true);
      }
      setError('');

      const searchResults = await search(searchQuery, leagueFilter, 15);

      // Ignore if a newer search was triggered
      if (searchIdRef.current !== searchId) return;

      setResults(searchResults);
      setActiveIndex(0);
      setOpen(searchResults.length > 0);
    } catch {
      if (searchIdRef.current !== searchId) return;
      setError('Search error. Keep going!');
    } finally {
      if (searchIdRef.current === searchId) {
        setLoading(false);
      }
    }
  }, [leagueFilter]);

  useEffect(() => {
    if (disabled) return;
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const searchId = ++searchIdRef.current;

    // If data is loaded, search immediately for instant feedback
    // Otherwise use debounce to avoid multiple data load attempts
    const debounceMs = isDataLoaded() ? 0 : 150;

    const handle = setTimeout(() => {
      performSearch(query, searchId);
    }, debounceMs);

    return () => {
      clearTimeout(handle);
    };
  }, [query, leagueFilter, disabled, performSearch]);

  const handleSelect = (player: SearchResult) => {
    onSelect(player);
    setQuery('');
    setResults([]);
    setOpen(false);
    setActiveIndex(0);
  };

  const visibleResults = useMemo(() => results.slice(0, 15), [results]);

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
