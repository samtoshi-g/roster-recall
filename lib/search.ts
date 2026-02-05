import { performance } from 'node:perf_hooks';
import { getDb, prepareStatement } from './db';
import { getCache, makeCacheKey, type SearchCacheValue } from './cache';
import type { SearchResult } from './players';

const HOT_QUERIES = [
  'le',
  'jo',
  'mi',
  'da',
  'br',
  'ch',
  'ste',
  'tom',
  'sid',
  'alex',
  'mat',
  'mar',
  'an'
];

const FAMOUS_QUERIES = [
  'lebron james',
  'stephen curry',
  'kobe bryant',
  'tom brady',
  'peyton manning',
  'mike trout',
  'shohei ohtani',
  'sidney crosby',
  'alex ovechkin'
];

let warmed = false;

export function normalizeQuery(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s.'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runSearch(query: string, league: string, limit = 8): Promise<SearchCacheValue> {
  const db = await getDb();
  const start = performance.now();

  if (!query) {
    return { results: [], ms: 0 };
  }

  // Use LIKE for prefix matching since sql.js doesn't support FTS5
  const searchPattern = `%${query}%`;
  
  let sql: string;
  let params: unknown[];
  
  if (league === 'all') {
    sql = `
      SELECT id, name, team, league, position
      FROM players
      WHERE name_normalized LIKE ?
      ORDER BY 
        CASE WHEN name_normalized LIKE ? THEN 0 ELSE 1 END,
        name
      LIMIT ?
    `;
    params = [searchPattern, `${query}%`, limit];
  } else {
    sql = `
      SELECT id, name, team, league, position
      FROM players
      WHERE name_normalized LIKE ?
      AND league = ?
      ORDER BY 
        CASE WHEN name_normalized LIKE ? THEN 0 ELSE 1 END,
        name
      LIMIT ?
    `;
    params = [searchPattern, league, `${query}%`, limit];
  }

  const stmt = prepareStatement(db, sql);
  const rows = stmt.all(...params) as SearchResult[];
  const ms = performance.now() - start;

  return { results: rows, ms: Math.round(ms) };
}

export async function searchPlayers(rawQuery: string, league: string) {
  const normalized = normalizeQuery(rawQuery);
  const leagueKey = league.toLowerCase();
  const dbLeague = leagueKey === 'all' ? 'all' : leagueKey.toUpperCase();
  
  if (normalized.length < 2) {
    return { results: [], cached: false, ms: 0 };
  }

  const cache = getCache();
  const key = makeCacheKey(normalized, leagueKey);
  const cached = cache.get(key);

  if (cached) {
    return { ...cached, cached: true };
  }

  const result = await runSearch(normalized, dbLeague);
  cache.set(key, result);

  return { ...result, cached: false };
}

export async function warmSearchCache() {
  if (warmed) return;
  warmed = true;
  const cache = getCache();

  const seeds = [...HOT_QUERIES, ...FAMOUS_QUERIES];
  for (const query of seeds) {
    const normalized = normalizeQuery(query);
    const key = makeCacheKey(normalized, 'all');
    if (!cache.has(key)) {
      cache.set(key, await runSearch(normalized, 'all'));
    }
  }
}
