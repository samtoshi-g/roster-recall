import type { SearchResult, League } from './players';
import playersJson from '../data/players.json';

export interface PlayerData {
  id: string;
  name: string;
  nameNormalized: string;
  league: League;
  team: string | null;
  position: string | null;
}

// Load players from bundled JSON
const playersData: PlayerData[] = playersJson as PlayerData[];

export function getPlayers(): PlayerData[] {
  return playersData;
}

export function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s.'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchPlayersInMemory(query: string, league: string, limit = 8): SearchResult[] {
  const normalized = normalizeQuery(query);
  if (normalized.length < 2) return [];

  const players = getPlayers();
  const leagueUpper = league.toUpperCase();
  
  const matches = players
    .filter(p => {
      const matchesQuery = p.nameNormalized.includes(normalized);
      const matchesLeague = league === 'all' || p.league === leagueUpper;
      return matchesQuery && matchesLeague;
    })
    .sort((a, b) => {
      // Prioritize prefix matches
      const aStarts = a.nameNormalized.startsWith(normalized) ? 0 : 1;
      const bStarts = b.nameNormalized.startsWith(normalized) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);

  return matches.map(p => ({
    id: p.id,
    name: p.name,
    team: p.team,
    league: p.league,
    position: p.position
  }));
}
