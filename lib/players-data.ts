import type { SearchResult, League } from './players';

export interface PlayerData {
  id: string;
  name: string;
  nameNormalized: string;
  league: League;
  team: string | null;
  position: string | null;
}

// Will be populated by seed script
let playersData: PlayerData[] = [];

// Initial sample data for testing
const samplePlayers: PlayerData[] = [
  { id: 'nba_lebron_james_1984', name: 'LeBron James', nameNormalized: 'lebron james', league: 'NBA', team: 'Los Angeles Lakers', position: 'Forward' },
  { id: 'nba_stephen_curry_1988', name: 'Stephen Curry', nameNormalized: 'stephen curry', league: 'NBA', team: 'Golden State Warriors', position: 'Guard' },
  { id: 'nba_kevin_durant_1988', name: 'Kevin Durant', nameNormalized: 'kevin durant', league: 'NBA', team: 'Phoenix Suns', position: 'Forward' },
  { id: 'nba_kobe_bryant_1978', name: 'Kobe Bryant', nameNormalized: 'kobe bryant', league: 'NBA', team: 'Los Angeles Lakers', position: 'Guard' },
  { id: 'nba_michael_jordan_1963', name: 'Michael Jordan', nameNormalized: 'michael jordan', league: 'NBA', team: 'Chicago Bulls', position: 'Guard' },
  { id: 'nba_giannis_antetokounmpo_1994', name: 'Giannis Antetokounmpo', nameNormalized: 'giannis antetokounmpo', league: 'NBA', team: 'Milwaukee Bucks', position: 'Forward' },
  { id: 'nba_luka_doncic_1999', name: 'Luka Dončić', nameNormalized: 'luka doncic', league: 'NBA', team: 'Dallas Mavericks', position: 'Guard' },
  { id: 'nba_jayson_tatum_1998', name: 'Jayson Tatum', nameNormalized: 'jayson tatum', league: 'NBA', team: 'Boston Celtics', position: 'Forward' },
  { id: 'nfl_tom_brady_1977', name: 'Tom Brady', nameNormalized: 'tom brady', league: 'NFL', team: 'Tampa Bay Buccaneers', position: 'Quarterback' },
  { id: 'nfl_patrick_mahomes_1995', name: 'Patrick Mahomes', nameNormalized: 'patrick mahomes', league: 'NFL', team: 'Kansas City Chiefs', position: 'Quarterback' },
  { id: 'nfl_josh_allen_1996', name: 'Josh Allen', nameNormalized: 'josh allen', league: 'NFL', team: 'Buffalo Bills', position: 'Quarterback' },
  { id: 'nfl_lamar_jackson_1997', name: 'Lamar Jackson', nameNormalized: 'lamar jackson', league: 'NFL', team: 'Baltimore Ravens', position: 'Quarterback' },
  { id: 'nfl_jalen_hurts_1998', name: 'Jalen Hurts', nameNormalized: 'jalen hurts', league: 'NFL', team: 'Philadelphia Eagles', position: 'Quarterback' },
  { id: 'nfl_travis_kelce_1989', name: 'Travis Kelce', nameNormalized: 'travis kelce', league: 'NFL', team: 'Kansas City Chiefs', position: 'Tight End' },
  { id: 'mlb_mike_trout_1991', name: 'Mike Trout', nameNormalized: 'mike trout', league: 'MLB', team: 'Los Angeles Angels', position: 'Center Field' },
  { id: 'mlb_shohei_ohtani_1994', name: 'Shohei Ohtani', nameNormalized: 'shohei ohtani', league: 'MLB', team: 'Los Angeles Dodgers', position: 'Pitcher/DH' },
  { id: 'mlb_aaron_judge_1992', name: 'Aaron Judge', nameNormalized: 'aaron judge', league: 'MLB', team: 'New York Yankees', position: 'Right Field' },
  { id: 'mlb_mookie_betts_1992', name: 'Mookie Betts', nameNormalized: 'mookie betts', league: 'MLB', team: 'Los Angeles Dodgers', position: 'Right Field' },
  { id: 'mlb_ronald_acuna_1997', name: 'Ronald Acuña Jr.', nameNormalized: 'ronald acuna jr', league: 'MLB', team: 'Atlanta Braves', position: 'Right Field' },
  { id: 'nhl_sidney_crosby_1987', name: 'Sidney Crosby', nameNormalized: 'sidney crosby', league: 'NHL', team: 'Pittsburgh Penguins', position: 'Center' },
  { id: 'nhl_alex_ovechkin_1985', name: 'Alex Ovechkin', nameNormalized: 'alex ovechkin', league: 'NHL', team: 'Washington Capitals', position: 'Left Wing' },
  { id: 'nhl_connor_mcdavid_1997', name: 'Connor McDavid', nameNormalized: 'connor mcdavid', league: 'NHL', team: 'Edmonton Oilers', position: 'Center' },
  { id: 'nhl_nathan_mackinnon_1995', name: 'Nathan MacKinnon', nameNormalized: 'nathan mackinnon', league: 'NHL', team: 'Colorado Avalanche', position: 'Center' },
  { id: 'nhl_auston_matthews_1997', name: 'Auston Matthews', nameNormalized: 'auston matthews', league: 'NHL', team: 'Toronto Maple Leafs', position: 'Center' },
];

export function getPlayers(): PlayerData[] {
  if (playersData.length === 0) {
    return samplePlayers;
  }
  return playersData;
}

export function setPlayers(data: PlayerData[]) {
  playersData = data;
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
