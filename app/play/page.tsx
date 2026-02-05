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

export default function PlayPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<SearchResult[]>([]);
  const [byLeague, setByLeague] = useState<Record<League, number>>(initialByLeague);
  const [duplicateSignal, setDuplicateSignal] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [running, setRunning] = useState(true);
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
    <main className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Header: Timer + Score */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Timer duration={300} isRunning={running} onComplete={handleComplete} />
        <ScoreBoard total={total} byLeague={byLeague} />
      </div>

      {/* Search Input */}
      <SearchInput
        onSelect={handleSelect}
        disabled={!running}
        leagueFilter="all"
        duplicateSignal={duplicateSignal}
      />

      {/* Status feedback (only shows when there's a message) */}
      {statusMessage && (
        <div className={`text-center text-sm font-semibold ${statusMessage.includes('Already') ? 'text-rose-300' : 'text-emerald-300'}`}>
          {statusMessage}
        </div>
      )}

      {/* Time's up overlay */}
      {!running && (
        <div className="flex items-center justify-center gap-4 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4">
          <p className="text-lg font-semibold text-slate-100">Time&apos;s up!</p>
          <button
            type="button"
            onClick={finishGame}
            className="rounded-full border border-accent/40 bg-accent/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent transition hover:bg-accent/30"
          >
            View Results
          </button>
        </div>
      )}

      {/* Recent picks */}
      <PlayerList players={players} />
    </main>
  );
}
