'use client';

import type { SearchResult } from '@/lib/players';

interface AutocompleteDropdownProps {
  results: SearchResult[];
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: (player: SearchResult) => void;
}

const leagueColor: Record<string, string> = {
  NBA: 'bg-nba',
  NFL: 'bg-nfl',
  MLB: 'bg-mlb',
  NHL: 'bg-nhl'
};

export default function AutocompleteDropdown({
  results,
  activeIndex,
  onHover,
  onSelect
}: AutocompleteDropdownProps) {
  return (
    <div className="absolute left-0 right-0 top-full z-20 mt-3 overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-glow">
      {results.map((player, index) => (
        <button
          key={player.id}
          type="button"
          onMouseEnter={() => onHover(index)}
          onClick={() => onSelect(player)}
          className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition ${
            index === activeIndex ? 'bg-white/10' : 'hover:bg-white/5'
          }`}
        >
          <div>
            <p className="text-base font-semibold text-slate-100">{player.name}</p>
            <p className="text-xs text-muted">{player.team || 'Team TBD'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${leagueColor[player.league]}`}></span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
              {player.league}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
