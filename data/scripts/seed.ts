import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.THESPORTSDB_API_KEY || '3';
const BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
const DB_PATH = path.join(process.cwd(), 'data', 'sports.db');

const LEAGUES = [
  { name: 'NBA', id: '4387' },
  { name: 'NFL', id: '4391' },
  { name: 'MLB', id: '4424' },
  { name: 'NHL', id: '4380' }
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseYear(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s.'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: string) {
  return normalizeName(value).replace(/\s+/g, '_');
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { first: parts[0], last: '' };
  }
  return {
    first: parts.slice(0, -1).join(' '),
    last: parts[parts.length - 1]
  };
}

function isLikely2000Plus(player: Record<string, string | null>) {
  const signingYear = parseYear(player.strSigning || player.strSigned || player.dateSigned);
  if (signingYear) return signingYear >= 2000;

  const descriptionYear = parseYear(player.strDescriptionEN || player.strDescription);
  if (descriptionYear) return descriptionYear >= 2000;

  const birthYear = parseYear(player.strBirthDate || player.dateBorn || player.strBorn);
  if (birthYear) return birthYear >= 1965;

  return true;
}

async function fetchJson(path: string) {
  const response = await fetch(`${BASE_URL}/${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${path}`);
  }
  return response.json();
}

async function seed() {
  const SQL = await initSqlJs();
  
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const reset = process.argv.includes('--reset');
  let db: InstanceType<typeof SQL.Database>;
  
  if (reset || !fs.existsSync(DB_PATH)) {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_normalized TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        league TEXT NOT NULL,
        team TEXT,
        position TEXT,
        years_active TEXT,
        is_active INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS players_name_normalized_idx ON players(name_normalized);
      CREATE INDEX IF NOT EXISTS players_league_idx ON players(league);

      CREATE TABLE IF NOT EXISTS scores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        total INTEGER NOT NULL,
        nba INTEGER NOT NULL,
        nfl INTEGER NOT NULL,
        mlb INTEGER NOT NULL,
        nhl INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS scores_created_at_idx ON scores(created_at DESC);
    `);
  } else {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  }

  const seen = new Set<string>();
  let total = 0;

  for (const league of LEAGUES) {
    console.log(`Fetching teams for ${league.name}...`);
    const teamsResponse = await fetchJson(`lookup_all_teams.php?id=${league.id}`);
    const teams = teamsResponse?.teams || [];

    for (const team of teams) {
      const teamId = team.idTeam;
      if (!teamId) continue;

      console.log(`Fetching players for ${team.strTeam || teamId} (${league.name})...`);
      const playersResponse = await fetchJson(`lookup_all_players.php?id=${teamId}`);
      const players = playersResponse?.player || [];

      for (const player of players) {
        if (!player?.strPlayer) continue;
        if (!isLikely2000Plus(player)) continue;

        const fullName = player.strPlayer as string;
        const normalized = normalizeName(fullName);
        const { first, last } = splitName(fullName);
        const birthYear = parseYear(player.strBirthDate || player.dateBorn || player.strBorn) || 'unknown';

        const baseId = `${league.name.toLowerCase()}_${slugify(fullName)}_${birthYear}`;
        let id = baseId;
        let counter = 2;
        while (seen.has(id)) {
          id = `${baseId}_${counter}`;
          counter += 1;
        }
        seen.add(id);

        const status = String(player.strStatus || player.strActive || '').toLowerCase();
        const isActive = status.includes('active') ? 1 : 0;
        const yearsActive =
          player.strYears || player.strYear || player.strSigning || player.strSigned || null;

        db.run(
          `INSERT OR REPLACE INTO players
           (id, name, name_normalized, first_name, last_name, league, team, position, years_active, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            fullName,
            normalized,
            first || null,
            last || null,
            league.name,
            player.strTeam || player.strTeam2 || null,
            player.strPosition || null,
            yearsActive,
            isActive
          ]
        );
        total += 1;
      }

      // Rate limit: 30 req/min = 2 seconds between requests
      await sleep(2100);
    }
  }

  // Save database
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  
  console.log(`Seed complete. Inserted ${total} players.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
