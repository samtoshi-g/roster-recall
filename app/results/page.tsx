'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ResultsCard from '@/components/ResultsCard';
import type { League, ScoreEntry, SearchResult } from '@/lib/players';

interface GameResult {
  total: number;
  byLeague: Record<League, number>;
  players: SearchResult[];
  endedAt?: number;
}

export default function ResultsPage() {
  const [result, setResult] = useState<GameResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('rosterRecall:lastGame');
    if (raw) {
      try {
        setResult(JSON.parse(raw));
      } catch {
        setResult(null);
      }
    }
  }, []);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const response = await fetch('/api/leaderboard?limit=20');
      if (!response.ok) return;
      const data = await response.json();
      setLeaderboard(data.results || []);
    };

    loadLeaderboard();
  }, []);

  const submitScore = async () => {
    if (!result) return;
    setStatus('Submitting...');
    const response = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        total: result.total,
        nba: result.byLeague.NBA,
        nfl: result.byLeague.NFL,
        mlb: result.byLeague.MLB,
        nhl: result.byLeague.NHL
      })
    });

    if (!response.ok) {
      setStatus('Could not submit score.');
      return;
    }

    setStatus('Score saved!');
    setName('');
    const data = await response.json();
    setLeaderboard((prev) => [
      {
        id: data.id,
        name: name.trim(),
        total: result.total,
        nba: result.byLeague.NBA,
        nfl: result.byLeague.NFL,
        mlb: result.byLeague.MLB,
        nhl: result.byLeague.NHL,
        created_at: Math.floor(Date.now() / 1000)
      },
      ...prev
    ]);
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Results</p>
          <h1 className="font-display text-4xl text-slate-100">Time&apos;s Up</h1>
        </div>
        <Link
          href="/play"
          className="rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
        >
          Play Again
        </Link>
      </div>

      {result ? (
        <ResultsCard total={result.total} byLeague={result.byLeague} players={result.players} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-surface px-6 py-6 text-slate-200">
          <p>No game results yet. Start a round to see your stats.</p>
          <Link href="/play" className="mt-4 inline-block text-accent">
            Jump into a game →
          </Link>
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-surface px-6 py-6 shadow-glow">
          <h2 className="text-sm uppercase tracking-[0.2em] text-muted">Leaderboard</h2>
          <div className="mt-4 space-y-3">
            {leaderboard.length === 0 ? (
              <p className="text-sm text-muted">No scores yet.</p>
            ) : (
              leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">#{index + 1}</span>
                    <p className="text-sm font-semibold text-slate-100">{entry.name}</p>
                  </div>
                  <div className="text-sm text-slate-200">{entry.total}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface px-6 py-6 shadow-glow">
          <h2 className="text-sm uppercase tracking-[0.2em] text-muted">Submit Score</h2>
          <p className="mt-2 text-sm text-slate-300">
            Add your name to the leaderboard. No account needed.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            <button
              type="button"
              onClick={submitScore}
              disabled={!result || result.total === 0 || name.trim().length < 2}
              className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent transition hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit
            </button>
            {status ? <p className="text-xs text-muted">{status}</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
