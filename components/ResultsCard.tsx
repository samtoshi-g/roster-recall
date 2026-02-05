'use client';

import { useState } from 'react';
import type { League, SearchResult } from '@/lib/players';

interface ResultsCardProps {
  total: number;
  byLeague: Record<League, number>;
  players: SearchResult[];
}

export default function ResultsCard({ total, byLeague, players }: ResultsCardProps) {
  const [copied, setCopied] = useState(false);

  const summary = `RosterRecall: ${total} players! 🏀 ${byLeague.NBA} | 🏈 ${byLeague.NFL} | ⚾ ${byLeague.MLB} | 🏒 ${byLeague.NHL}`;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (!canShare) return;
    try {
      await navigator.share({ title: 'RosterRecall', text: summary });
    } catch {
      // Ignore user-cancelled share.
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-surface px-6 py-8 shadow-glow">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Final Score</p>
          <p className="font-display text-5xl text-slate-100">{total}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
            <div className="rounded-2xl border border-nba/40 bg-nba/10 px-4 py-3">NBA {byLeague.NBA}</div>
            <div className="rounded-2xl border border-sky-400/40 bg-sky-500/10 px-4 py-3">NFL {byLeague.NFL}</div>
            <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3">MLB {byLeague.MLB}</div>
            <div className="rounded-2xl border border-slate-400/40 bg-white/5 px-4 py-3">NHL {byLeague.NHL}</div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent transition hover:bg-accent/20"
          >
            {copied ? 'Copied!' : 'Copy Results'}
          </button>
          {canShare ? (
            <button
              type="button"
              onClick={handleShare}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:bg-white/10"
            >
              Share
            </button>
          ) : null}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Players Named</p>
          <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-white/5 bg-black/30 px-4 py-3 text-sm text-slate-200">
            {players.length === 0 ? (
              <p className="text-muted">No players logged.</p>
            ) : (
              <ul className="space-y-1">
                {players.map((player) => (
                  <li key={player.id} className="flex justify-between">
                    <span>{player.name}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted">
                      {player.league}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
