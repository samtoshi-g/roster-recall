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

const PREFIX_MIN = 2;
const PREFIX_MAX = 3;

type PrefixIndex = Map<string, PlayerData[]>;

function addToIndex(index: PrefixIndex, key: string, player: PlayerData): void {
  const bucket = index.get(key);
  if (bucket) {
    bucket.push(player);
  } else {
    index.set(key, [player]);
  }
}

function buildPrefixIndex(players: PlayerData[]): PrefixIndex {
  const index: PrefixIndex = new Map();

  for (const player of players) {
    const normalized = player.nameNormalized;
    if (normalized.length < PREFIX_MIN) continue;

    addToIndex(index, normalized.slice(0, PREFIX_MIN), player);
    if (normalized.length >= PREFIX_MAX) {
      addToIndex(index, normalized.slice(0, PREFIX_MAX), player);
    }
  }

  for (const bucket of index.values()) {
    bucket.sort((a, b) => a.name.localeCompare(b.name));
  }

  return index;
}

const prefixIndex = buildPrefixIndex(playersData);

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
  if (normalized.length < PREFIX_MIN) return [];

  const leagueUpper = league.toUpperCase();
  const wantsAllLeagues = league === 'all';
  const prefixLength = normalized.length >= PREFIX_MAX ? PREFIX_MAX : PREFIX_MIN;
  const prefixKey = normalized.slice(0, prefixLength);
  const bucket = prefixIndex.get(prefixKey);

  if (!bucket || bucket.length === 0) return [];

  const results: SearchResult[] = [];

  const pushResult = (player: PlayerData) => {
    results.push({
      id: player.id,
      name: player.name,
      team: player.team,
      league: player.league,
      position: player.position
    });
  };

  // Pass 1: prefix matches in name order
  for (const player of bucket) {
    if (results.length >= limit) break;
    if (!wantsAllLeagues && player.league !== leagueUpper) continue;
    if (player.nameNormalized.startsWith(normalized)) {
      pushResult(player);
    }
  }

  // Pass 2: substring matches (excluding prefix matches), in name order
  if (results.length < limit) {
    for (const player of bucket) {
      if (results.length >= limit) break;
      if (!wantsAllLeagues && player.league !== leagueUpper) continue;
      if (player.nameNormalized.startsWith(normalized)) continue;
      if (player.nameNormalized.includes(normalized)) {
        pushResult(player);
      }
    }
  }

  return results;
}
