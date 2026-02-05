import fs from 'fs';
import { parse } from 'csv-parse/sync';

// Process NBA players
const nbaRaw = fs.readFileSync('data/raw/nba_players.csv', 'utf-8');
const nbaRecords = parse(nbaRaw, { columns: true, skip_empty_lines: true });

const nbaPlayers = nbaRecords
  .filter(r => {
    const fromYear = parseInt(r.FROM_YEAR) || 1900;
    const toYear = parseInt(r.TO_YEAR) || 1900;
    return (fromYear >= 2000 || toYear >= 2000) && r.PLAYER_FIRST_NAME && r.PLAYER_LAST_NAME;
  })
  .map(r => {
    const name = `${r.PLAYER_FIRST_NAME} ${r.PLAYER_LAST_NAME}`.trim();
    return {
      id: `nba_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${r.FROM_YEAR || 'unknown'}`,
      name,
      nameNormalized: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      league: 'NBA',
      team: `${r.TEAM_CITY || ''} ${r.TEAM_NAME || ''}`.trim() || null,
      position: r.POSITION || null
    };
  });

// Process NFL players with proper CSV parsing
const nflRaw = fs.readFileSync('data/raw/nfl_players.csv', 'utf-8');
const nflRecords = parse(nflRaw, { columns: true, skip_empty_lines: true });

const nflPlayers = nflRecords
  .filter(r => {
    const lastSeason = parseInt(r.last_season) || 0;
    return lastSeason >= 2000 && r.display_name;
  })
  .map(r => ({
    id: `nfl_${r.display_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${r.last_season || 'unknown'}`,
    name: r.display_name,
    nameNormalized: r.display_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    league: 'NFL',
    team: r.latest_team || null,
    position: r.position || null
  }));

// Dedupe
const dedupe = (players) => {
  const seen = new Set();
  return players.filter(p => {
    const key = `${p.league}_${p.nameNormalized}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

console.log(`NBA: ${nbaPlayers.length} -> ${dedupe(nbaPlayers).length} unique`);
console.log(`NFL: ${nflPlayers.length} -> ${dedupe(nflPlayers).length} unique`);

// Load MLB and NHL we added manually 
const existing = JSON.parse(fs.readFileSync('data/players.json', 'utf-8'));
const mlbNhl = existing.filter(p => p.league === 'MLB' || p.league === 'NHL');

const allPlayers = [...dedupe(nbaPlayers), ...dedupe(nflPlayers), ...mlbNhl];
console.log(`MLB+NHL (kept): ${mlbNhl.length}`);
console.log(`Total: ${allPlayers.length}`);

fs.writeFileSync('data/players.json', JSON.stringify(allPlayers, null, 2));
console.log('Saved!');

// Sample check
const sample = allPlayers.find(p => p.name === 'Patrick Mahomes');
console.log('Sample (Mahomes):', sample);
