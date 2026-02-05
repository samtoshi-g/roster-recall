import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-center gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 text-2xl">
          <span>🏀</span>
          <span>🏈</span>
          <span>⚾</span>
          <span>🏒</span>
        </div>
        <h1 className="font-display text-5xl sm:text-6xl">RosterRecall</h1>
        <p className="max-w-2xl text-lg text-slate-300">
          Name as many pro athletes as you can in 5 minutes across the NBA, NFL, MLB, and NHL.
          Autocomplete keeps you flying, and duplicates won&apos;t slow you down.
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link
          href="/play"
          className="rounded-2xl border border-accent/40 bg-accent/10 px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-accent transition hover:bg-accent/20"
        >
          Start Game
        </Link>
        <Link
          href="/results"
          className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:bg-white/10"
        >
          View Results
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Five Minute Rush',
            body: 'Timer starts instantly. Hit your personal best by staying in the flow.'
          },
          {
            title: 'Smart Autocomplete',
            body: 'Type two letters, snag a player, and keep rolling.'
          },
          {
            title: 'Share the Score',
            body: 'Copy your results or share directly after the buzzer.'
          }
        ].map((card) => (
          <div key={card.title} className="rounded-2xl border border-white/10 bg-surface px-5 py-5 shadow-glow">
            <p className="text-sm uppercase tracking-[0.2em] text-muted">{card.title}</p>
            <p className="mt-3 text-slate-200">{card.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
