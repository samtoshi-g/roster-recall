'use client';

import type { League } from '@/lib/players';

interface ScoreBoardProps {
  total: number;
  byLeague: Record<League, number>;
}

const leagueBadge: Record<League, string> = {
  NBA: 'bg-nba/20 text-nba border-nba/40',
  NFL: 'bg-nfl/20 text-sky-200 border-sky-400/40',
  MLB: 'bg-mlb/20 text-rose-200 border-rose-400/40',
  NHL: 'bg-nhl/20 text-slate-100 border-slate-400/40'
};

export default function ScoreBoard({ total, byLeague }: ScoreBoardProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="rounded-2xl border border-white/10 bg-surface px-4 py-3 shadow-glow">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Score</p>
        <p className="font-display text-3xl text-slate-100">{total}</p>
      </div>
      {(Object.keys(byLeague) as League[]).map((league) => (
        <div
          key={league}
          className={`rounded-2xl border px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] ${leagueBadge[league]}`}
        >
          {league}: {byLeague[league]}
        </div>
      ))}
    </div>
  );
}
