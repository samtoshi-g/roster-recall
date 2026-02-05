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

// Nickname -> full name mappings for first name matching
const NICKNAMES: Record<string, string[]> = {
  // Common nicknames
  steph: ['stephen', 'stephanie'],
  mike: ['michael', 'miguel'],
  matt: ['matthew', 'matthias'],
  tom: ['thomas', 'tommy'],
  tommy: ['thomas'],
  chris: ['christopher', 'christian', 'christina'],
  dave: ['david'],
  rob: ['robert', 'roberto'],
  bob: ['robert'],
  bobby: ['robert'],
  jim: ['james', 'jimmy'],
  jimmy: ['james'],
  bill: ['william'],
  billy: ['william'],
  will: ['william'],
  tony: ['anthony', 'antonio'],
  alex: ['alexander', 'alexandra', 'alexis', 'alejandro'],
  nick: ['nicholas', 'nicolas'],
  dan: ['daniel', 'danny'],
  danny: ['daniel'],
  joe: ['joseph', 'jose'],
  joey: ['joseph'],
  ben: ['benjamin', 'benedict'],
  sam: ['samuel', 'samantha'],
  sammy: ['samuel'],
  ed: ['edward', 'edwin', 'eduardo'],
  eddie: ['edward', 'edwin'],
  ted: ['theodore', 'edward'],
  teddy: ['theodore'],
  rick: ['richard', 'ricardo', 'eric', 'frederick'],
  ricky: ['richard', 'ricardo'],
  dick: ['richard'],
  jack: ['john', 'jackson'],
  johnny: ['john', 'jonathan'],
  jon: ['jonathan', 'john'],
  andy: ['andrew', 'anderson'],
  drew: ['andrew'],
  pete: ['peter'],
  steve: ['steven', 'stephen'],
  stevie: ['steven', 'stephen'],
  greg: ['gregory'],
  gregg: ['gregory'],
  jeff: ['jeffrey', 'geoffrey'],
  geoff: ['geoffrey', 'jeffrey'],
  ken: ['kenneth', 'kendrick'],
  kenny: ['kenneth'],
  larry: ['lawrence', 'lamar'],
  lenny: ['leonard'],
  len: ['leonard'],
  manny: ['manuel', 'emmanuel'],
  freddy: ['frederick', 'alfredo'],
  fred: ['frederick', 'alfred', 'alfredo'],
  charlie: ['charles'],
  chuck: ['charles'],
  chas: ['charles'],
  pat: ['patrick', 'patricia'],
  paddy: ['patrick'],
  patty: ['patricia', 'patrick'],
  ray: ['raymond', 'ramon'],
  ronnie: ['ronald', 'aaron'],
  ron: ['ronald'],
  reggie: ['reginald'],
  frank: ['francis', 'franklin'],
  frankie: ['francis', 'franklin'],
  hank: ['henry', 'harold'],
  harry: ['harold', 'henry', 'harrison'],
  hal: ['harold', 'henry'],
  wally: ['walter', 'wallace'],
  walt: ['walter'],
  vic: ['victor', 'vincent'],
  vinnie: ['vincent'],
  vinny: ['vincent'],
  vin: ['vincent'],
  artie: ['arthur'],
  art: ['arthur'],
  bernie: ['bernard'],
  bern: ['bernard'],
  gerry: ['gerald', 'gerard'],
  jerry: ['gerald', 'jerome', 'jeremiah'],
  marty: ['martin'],
  matty: ['matthew'],
  mikey: ['michael'],
  nate: ['nathan', 'nathaniel'],
  phil: ['phillip', 'philip'],
  richie: ['richard'],
  rudy: ['rudolph', 'rodolfo'],
  terry: ['terrence', 'terence'],
  theo: ['theodore'],
  tim: ['timothy'],
  timmy: ['timothy'],
  trey: ['tremaine'],
  ty: ['tyler', 'tyrone', 'tyson'],
  zach: ['zachary', 'zachariah'],
  zack: ['zachary'],
};

// Build reverse lookup: full name -> nicknames that map to it
const FULL_TO_NICKNAMES: Record<string, string[]> = {};
for (const [nick, fulls] of Object.entries(NICKNAMES)) {
  for (const full of fulls) {
    if (!FULL_TO_NICKNAMES[full]) {
      FULL_TO_NICKNAMES[full] = [];
    }
    FULL_TO_NICKNAMES[full].push(nick);
  }
}

// Check if query first name matches player first name
// Matches if: prefix match OR nickname match
function firstNameMatches(queryFirst: string, playerFirst: string): boolean {
  // Direct prefix match (handles "pat" -> "patrick" naturally)
  if (playerFirst.startsWith(queryFirst)) return true;
  
  // Check if query is a nickname that maps to the player's first name
  const possibleFullNames = NICKNAMES[queryFirst];
  if (possibleFullNames && possibleFullNames.some(full => playerFirst.startsWith(full))) {
    return true;
  }
  
  // Check if any nickname of the player's name matches the query as a prefix
  // e.g., searching "ste" should match "Stephen" even though we also have "steph" -> "stephen"
  const nicknamesForPlayer = FULL_TO_NICKNAMES[playerFirst];
  if (nicknamesForPlayer && nicknamesForPlayer.some(nick => nick.startsWith(queryFirst))) {
    return true;
  }
  
  return false;
}

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
    const response = await fetch('/data.json');
    const data = await response.json();
    playersData = data;
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
  
  // Get all prefix keys to search (original + nickname expansions)
  const prefixLength = Math.min(PREFIX_MAX, Math.max(queryFirstName.length, PREFIX_MIN));
  const prefixKeys = new Set<string>();
  
  // Add direct prefix from query
  prefixKeys.add(queryFirstName.slice(0, prefixLength));
  
  // Add prefixes from nickname expansions (e.g., "mike" -> also search "mic" from "michael")
  const fullNameExpansions = NICKNAMES[queryFirstName];
  if (fullNameExpansions) {
    for (const fullName of fullNameExpansions) {
      if (fullName.length >= prefixLength) {
        prefixKeys.add(fullName.slice(0, prefixLength));
      }
    }
  }
  
  // Collect players from all matching buckets
  const candidatePlayers = new Set<PlayerData>();
  for (const prefixKey of prefixKeys) {
    const bucket = prefixIndex.get(prefixKey);
    if (bucket) {
      for (const player of bucket) {
        candidatePlayers.add(player);
      }
    }
  }
  
  if (candidatePlayers.size === 0) return [];

  const results: SearchResult[] = [];

  // Match players where:
  // 1. Player's first name matches query first name (prefix OR nickname match)
  // 2. Player's last name STARTS WITH query last name
  for (const player of candidatePlayers) {
    if (results.length >= limit) break;
    if (!wantsAllLeagues && player.league !== leagueUpper) continue;
    
    // Split player name into first and last
    const playerSpaceIndex = player.nameNormalized.indexOf(' ');
    if (playerSpaceIndex === -1) continue; // Skip players without last name
    
    const playerFirstName = player.nameNormalized.slice(0, playerSpaceIndex);
    const playerLastName = player.nameNormalized.slice(playerSpaceIndex + 1);
    
    // First name match (prefix OR nickname)
    if (!firstNameMatches(queryFirstName, playerFirstName)) continue;
    
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
