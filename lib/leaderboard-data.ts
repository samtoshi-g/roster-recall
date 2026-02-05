import type { ScoreEntry } from './players';

// In-memory leaderboard (resets on server restart)
// For persistence, you'd use a database like Vercel KV, Planetscale, etc.
let leaderboard: ScoreEntry[] = [];

export function getLeaderboard(limit = 20): ScoreEntry[] {
  return leaderboard
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return b.created_at - a.created_at;
    })
    .slice(0, limit);
}

export function addScore(entry: Omit<ScoreEntry, 'id' | 'created_at'>): string {
  const id = crypto.randomUUID();
  const created_at = Math.floor(Date.now() / 1000);
  
  leaderboard.push({
    ...entry,
    id,
    created_at
  });
  
  // Keep only top 100 scores
  if (leaderboard.length > 100) {
    leaderboard = getLeaderboard(100);
  }
  
  return id;
}
