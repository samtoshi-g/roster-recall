import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'sports.db');

async function quickSeed() {
  const SQL = await initSqlJs();
  
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new SQL.Database();
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

  const testPlayers = [
    ['nba_lebron_james_1984', 'LeBron James', 'lebron james', 'LeBron', 'James', 'NBA', 'Los Angeles Lakers', 'Forward', '2003-present', 1],
    ['nba_stephen_curry_1988', 'Stephen Curry', 'stephen curry', 'Stephen', 'Curry', 'NBA', 'Golden State Warriors', 'Guard', '2009-present', 1],
    ['nba_kevin_durant_1988', 'Kevin Durant', 'kevin durant', 'Kevin', 'Durant', 'NBA', 'Phoenix Suns', 'Forward', '2007-present', 1],
    ['nba_kobe_bryant_1978', 'Kobe Bryant', 'kobe bryant', 'Kobe', 'Bryant', 'NBA', 'Los Angeles Lakers', 'Guard', '1996-2016', 0],
    ['nba_michael_jordan_1963', 'Michael Jordan', 'michael jordan', 'Michael', 'Jordan', 'NBA', 'Chicago Bulls', 'Guard', '1984-2003', 0],
    ['nfl_tom_brady_1977', 'Tom Brady', 'tom brady', 'Tom', 'Brady', 'NFL', 'Tampa Bay Buccaneers', 'Quarterback', '2000-2023', 0],
    ['nfl_patrick_mahomes_1995', 'Patrick Mahomes', 'patrick mahomes', 'Patrick', 'Mahomes', 'NFL', 'Kansas City Chiefs', 'Quarterback', '2017-present', 1],
    ['nfl_josh_allen_1996', 'Josh Allen', 'josh allen', 'Josh', 'Allen', 'NFL', 'Buffalo Bills', 'Quarterback', '2018-present', 1],
    ['mlb_mike_trout_1991', 'Mike Trout', 'mike trout', 'Mike', 'Trout', 'MLB', 'Los Angeles Angels', 'Center Field', '2011-present', 1],
    ['mlb_shohei_ohtani_1994', 'Shohei Ohtani', 'shohei ohtani', 'Shohei', 'Ohtani', 'MLB', 'Los Angeles Dodgers', 'Pitcher/DH', '2018-present', 1],
    ['mlb_aaron_judge_1992', 'Aaron Judge', 'aaron judge', 'Aaron', 'Judge', 'MLB', 'New York Yankees', 'Right Field', '2016-present', 1],
    ['nhl_sidney_crosby_1987', 'Sidney Crosby', 'sidney crosby', 'Sidney', 'Crosby', 'NHL', 'Pittsburgh Penguins', 'Center', '2005-present', 1],
    ['nhl_alex_ovechkin_1985', 'Alex Ovechkin', 'alex ovechkin', 'Alex', 'Ovechkin', 'NHL', 'Washington Capitals', 'Left Wing', '2005-present', 1],
    ['nhl_connor_mcdavid_1997', 'Connor McDavid', 'connor mcdavid', 'Connor', 'McDavid', 'NHL', 'Edmonton Oilers', 'Center', '2015-present', 1],
    ['nba_giannis_antetokounmpo_1994', 'Giannis Antetokounmpo', 'giannis antetokounmpo', 'Giannis', 'Antetokounmpo', 'NBA', 'Milwaukee Bucks', 'Forward', '2013-present', 1],
  ];

  for (const p of testPlayers) {
    db.run(
      `INSERT OR REPLACE INTO players (id, name, name_normalized, first_name, last_name, league, team, position, years_active, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      p
    );
  }

  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  console.log('Quick seed complete. Added 15 test players.');
}

quickSeed().catch(console.error);
