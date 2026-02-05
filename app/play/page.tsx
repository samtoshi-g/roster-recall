'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Timer from '@/components/Timer';
import SearchInput from '@/components/SearchInput';
import ScoreBoard from '@/components/ScoreBoard';
import PlayerList from '@/components/PlayerList';
import type { League, SearchResult } from '@/lib/players';

const initialByLeague: Record<League, number> = {
  NBA: 0,
  NFL: 0,
  MLB: 0,
  NHL: 0
};

const leagueOptions = [
  { label: 'All', value: 'all' },
  { label: 'NBA', value: 'nba' },
  { label: 'NFL', value: 'nfl' },
  { label: 'MLB', value: 'mlb' },
  { label: 'NHL', value: 'nhl' }
];

export default function PlayPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<SearchResult[]>([]);
  const [byLeague, setByLeague] = useState<Record<League, number>>(initialByLeague);
  const [duplicateSignal, setDuplicateSignal] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [running, setRunning] = useState(true);
  const [leagueFilter, setLeagueFilter] = useState('all');
  const guessedIds = useRef<Set<string>>(new Set());
  const statusTimeout = useRef<NodeJS.Timeout | null>(null);

  const total = players.length;

  const handleSelect = (player: SearchResult) => {
    if (statusTimeout.current) {
      clearTimeout(statusTimeout.current);
    }
    if (guessedIds.current.has(player.id)) {
      setDuplicateSignal((value) => value + 1);
      setStatusMessage('Already guessed!');
      statusTimeout.current = setTimeout(() => setStatusMessage(''), 2000);
      return;
    }

    guessedIds.current.add(player.id);
    setPlayers((prev) => [player, ...prev]);
    setByLeague((prev) => ({
      ...prev,
      [player.league]: prev[player.league] + 1
    }));
    setStatusMessage(`+1 ${player.league}`);
    statusTimeout.current = setTimeout(() => setStatusMessage(''), 2000);
  };

  const handleComplete = () => {
    setRunning(false);
    const payload = {
      total,
      byLeague,
      players,
      endedAt: Date.now()
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('rosterRecall:lastGame', JSON.stringify(payload));
    }
  };

  const leaderboardPayload = useMemo(
    () => ({
      total,
      byLeague,
      players
    }),
    [total, byLeague, players]
  );

  const finishGame = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rosterRecall:lastGame', JSON.stringify(leaderboardPayload));
    }
    router.push('/results');
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Timer duration={300} isRunning={running} onComplete={handleComplete} />
        <ScoreBoard total={total} byLeague={byLeague} />
      </div>

      <div className="flex flex-wrap gap-3">
        {leagueOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setLeagueFilter(option.value)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
              leagueFilter === option.value
                ? 'border-accent/60 bg-accent/20 text-accent'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <SearchInput
        onSelect={handleSelect}
        disabled={!running}
        leagueFilter={leagueFilter}
        duplicateSignal={duplicateSignal}
      />

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-surface px-5 py-3 shadow-glow">
        <p className="text-sm text-muted">{running ? 'Keep going!' : "Time's up"}</p>
        <p className={`text-sm font-semibold ${statusMessage.includes('Already') ? 'text-rose-300' : 'text-emerald-300'}`}>
          {statusMessage}
        </p>
        {!running ? (
          <button
            type="button"
            onClick={finishGame}
            className="rounded-full border border-accent/40 bg-accent/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
          >
            View Results
          </button>
        ) : null}
      </div>

      <PlayerList players={players} />
    </main>
  );
}
