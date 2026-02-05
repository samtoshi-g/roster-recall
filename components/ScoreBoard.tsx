'use client';

import type { League } from '@/lib/players';

interface ScoreBoardProps {
  total: number;
  byLeague: Record<League, number>;
}

const leagueColors: Record<League, string> = {
  NBA: 'text-nba',
  NFL: 'text-sky-300',
  MLB: 'text-rose-300',
  NHL: 'text-slate-300'
};

export default function ScoreBoard({ total, byLeague }: ScoreBoardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface px-4 py-3 shadow-glow">
      <div className="border-r border-white/10 pr-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Score</p>
        <p className="font-display text-3xl text-slate-100">{total}</p>
      </div>
      <div className="flex items-center gap-3 text-sm font-semibold">
        {(Object.keys(byLeague) as League[]).map((league) => (
          <span key={league} className={leagueColors[league]}>
            {league} {byLeague[league]}
          </span>
        ))}
      </div>
    </div>
  );
}
