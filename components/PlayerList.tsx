'use client';

import type { SearchResult } from '@/lib/players';

interface PlayerListProps {
  players: SearchResult[];
}

const leagueColor: Record<string, string> = {
  NBA: 'border-nba/40 text-nba',
  NFL: 'border-sky-500/40 text-sky-200',
  MLB: 'border-rose-400/40 text-rose-200',
  NHL: 'border-slate-400/40 text-slate-200'
};

export default function PlayerList({ players }: PlayerListProps) {
  const recent = players.slice(0, 12);

  return (
    <div className="rounded-2xl border border-white/10 bg-surface px-5 py-4 shadow-glow">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Recent Picks</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {recent.length === 0 ? (
          <p className="text-sm text-muted">No players yet. Start typing!</p>
        ) : (
          recent.map((player) => (
            <div
              key={player.id}
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                leagueColor[player.league]
              }`}
            >
              {player.name}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
