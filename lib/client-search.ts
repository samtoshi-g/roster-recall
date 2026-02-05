'use client';

import type { SearchResult, League } from './players';

interface PlayerData {
  id: string;
  name: string;
  nameNormalized: string;
  league: League;
  team: string | null;
  position: string | null;
}

type PrefixIndex = Map<string, PlayerData[]>;

// Module-level state (persists across renders)
let playersData: PlayerData[] | null = null;
let prefixIndex: PrefixIndex | null = null;
let loadPromise: Promise<void> | null = null;

// LRU cache for search results
const CACHE_SIZE = 100;
const searchCache = new Map<string, SearchResult[]>();
const cacheKeys: string[] = [];

function addToCache(key: string, results: SearchResult[]): void {
  if (searchCache.has(key)) return;

  if (cacheKeys.length >= CACHE_SIZE) {
    const oldest = cacheKeys.shift();
    if (oldest) searchCache.delete(oldest);
  }

  searchCache.set(key, results);
  cacheKeys.push(key);
}

function getFromCache(key: string): SearchResult[] | undefined {
  return searchCache.get(key);
}

const PREFIX_MIN = 2;
const PREFIX_MAX = 3;

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

  // Sort buckets alphabetically
  for (const bucket of index.values()) {
    bucket.sort((a, b) => a.name.localeCompare(b.name));
  }

  return index;
}

function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s.'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadPlayersData(): Promise<void> {
  if (playersData && prefixIndex) return;

  if (loadPromise) {
    await loadPromise;
    return;
  }

  loadPromise = (async () => {
    const response = await fetch('/api/players-data');
    const data = await response.json();
    playersData = data.players;
    prefixIndex = buildPrefixIndex(playersData!);
  })();

  await loadPromise;
}

function searchLocal(query: string, league: string, limit: number): SearchResult[] {
  if (!playersData || !prefixIndex) return [];

  const normalized = normalizeQuery(query);
  
  // Require format: "firstname lastname" with at least 2 chars of last name
  const spaceIndex = normalized.indexOf(' ');
  if (spaceIndex === -1) return []; // No space = no results
  
  const queryFirstName = normalized.slice(0, spaceIndex);
  const queryLastName = normalized.slice(spaceIndex + 1).trim();
  
  if (queryFirstName.length < 1 || queryLastName.length < 2) return []; // Need 2+ chars of last name

  const leagueUpper = league.toUpperCase();
  const wantsAllLeagues = league === 'all';
  
  // Use first name as prefix key for index lookup
  const prefixLength = queryFirstName.length >= PREFIX_MAX ? PREFIX_MAX : Math.max(queryFirstName.length, PREFIX_MIN);
  const prefixKey = queryFirstName.slice(0, prefixLength);
  const bucket = prefixIndex.get(prefixKey);

  if (!bucket || bucket.length === 0) return [];

  const results: SearchResult[] = [];

  // Match players where:
  // 1. Player's first name STARTS WITH query first name (prefix match - handles "pat" -> "patrick")
  // 2. Player's last name STARTS WITH query last name
  for (const player of bucket) {
    if (results.length >= limit) break;
    if (!wantsAllLeagues && player.league !== leagueUpper) continue;
    
    // Split player name into first and last
    const playerSpaceIndex = player.nameNormalized.indexOf(' ');
    if (playerSpaceIndex === -1) continue; // Skip players without last name
    
    const playerFirstName = player.nameNormalized.slice(0, playerSpaceIndex);
    const playerLastName = player.nameNormalized.slice(playerSpaceIndex + 1);
    
    // First name prefix match (pat -> patrick)
    if (!playerFirstName.startsWith(queryFirstName)) continue;
    
    // Last name prefix match
    if (!playerLastName.startsWith(queryLastName)) continue;
    
    results.push({
      id: player.id,
      name: player.name,
      team: player.team,
      league: player.league,
      position: player.position
    });
  }

  return results;
}

export interface SearchState {
  results: SearchResult[];
  loading: boolean;
  error: string;
  dataLoaded: boolean;
}

export async function search(
  query: string,
  league: string,
  limit = 15
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // Check cache first
  const cacheKey = `${trimmed.toLowerCase()}:${league}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Ensure data is loaded
  await loadPlayersData();

  // Search locally
  const results = searchLocal(trimmed, league, limit);

  // Cache results
  addToCache(cacheKey, results);

  return results;
}

export function isDataLoaded(): boolean {
  return playersData !== null && prefixIndex !== null;
}

export async function preloadData(): Promise<void> {
  await loadPlayersData();
}
