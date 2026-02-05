#!/usr/bin/env node
/**
 * Process raw player CSVs into a single JSON file for RosterRecall
 * Filters to players active 2000-present where possible
 * Outputs format expected by lib/players-data.ts
 */

const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '../data/raw');
const OUT_FILE = path.join(__dirname, '../data/players.json');

// Simple CSV parser (handles quoted fields)
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = (values[i] || '').trim());
    return obj;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function cleanName(first, last) {
  const f = (first || '').trim();
  const l = (last || '').trim();
  if (!f && !l) return null;
  return `${f} ${l}`.trim();
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s.'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateId(name, league, index) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `${league.toLowerCase()}-${slug}-${index}`;
}

// Process NBA
function processNBA() {
  console.log('Processing NBA...');
  const content = fs.readFileSync(path.join(RAW_DIR, 'nba_players.csv'), 'utf-8');
  const rows = parseCSV(content);
  const players = [];
  
  for (const row of rows) {
    const fromYear = parseInt(row.FROM_YEAR) || 0;
    const toYear = parseInt(row.TO_YEAR) || 0;
    
    // Filter: played in 2000 or later
    if (fromYear >= 2000 || toYear >= 2000) {
      const name = cleanName(row.PLAYER_FIRST_NAME, row.PLAYER_LAST_NAME);
      if (name) {
        players.push({
          name,
          league: 'NBA',
          team: row.TEAM_NAME || null,
          position: row.POSITION || null
        });
      }
    }
  }
  
  console.log(`  NBA: ${players.length} players (2000-present)`);
  return players;
}

// Process NFL
function processNFL() {
  console.log('Processing NFL...');
  const content = fs.readFileSync(path.join(RAW_DIR, 'nfl_players.csv'), 'utf-8');
  const rows = parseCSV(content);
  const players = [];
  
  for (const row of rows) {
    const rookieSeason = parseInt(row.rookie_season) || 0;
    const lastSeason = parseInt(row.last_season) || 0;
    
    // Filter: played in 2000 or later
    if (rookieSeason >= 2000 || lastSeason >= 2000) {
      // Prefer display_name, fallback to first+last
      let name = row.display_name;
      if (!name) name = cleanName(row.first_name, row.last_name);
      if (name) {
        players.push({
          name,
          league: 'NFL',
          team: row.latest_team || null,
          position: row.position || null
        });
      }
    }
  }
  
  console.log(`  NFL: ${players.length} players (2000-present)`);
  return players;
}

// Process MLB
function processMLB() {
  console.log('Processing MLB...');
  const content = fs.readFileSync(path.join(RAW_DIR, 'mlb_players.csv'), 'utf-8');
  const rows = parseCSV(content);
  const players = [];
  
  for (const row of rows) {
    // debut and finalGame are YYYY-MM-DD format
    const debutYear = row.debut ? parseInt(row.debut.split('-')[0]) : 0;
    const finalYear = row.finalGame ? parseInt(row.finalGame.split('-')[0]) : 0;
    
    // Filter: played in 2000 or later
    if (debutYear >= 2000 || finalYear >= 2000) {
      const name = cleanName(row.nameFirst, row.nameLast);
      if (name) {
        players.push({
          name,
          league: 'MLB',
          team: null, // CSV doesn't have team
          position: row.bats && row.throws ? `${row.bats}/${row.throws}` : null
        });
      }
    }
  }
  
  console.log(`  MLB: ${players.length} players (2000-present)`);
  return players;
}

// Process NHL (no date filtering available - include all)
function processNHL() {
  console.log('Processing NHL...');
  const content = fs.readFileSync(path.join(RAW_DIR, 'nhl_players.csv'), 'utf-8');
  const rows = parseCSV(content);
  const players = [];
  
  for (const row of rows) {
    // No date info available, include all NHL players
    const name = cleanName(row['First Name'], row['Last Name']);
    if (name) {
      players.push({
        name,
        league: 'NHL',
        team: null,
        position: row.Position || null
      });
    }
  }
  
  console.log(`  NHL: ${players.length} players (all-time, no date filter available)`);
  return players;
}

// Main
function main() {
  console.log('=== Processing Player Datasets ===\n');
  
  const nba = processNBA();
  const nfl = processNFL();
  const mlb = processMLB();
  const nhl = processNHL();
  
  // Combine and dedupe by name+league
  const all = [...nba, ...nfl, ...mlb, ...nhl];
  const seen = new Set();
  const unique = [];
  
  for (const p of all) {
    const key = `${p.name.toLowerCase()}|${p.league}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total unique players: ${unique.length}`);
  console.log(`  NBA: ${unique.filter(p => p.league === 'NBA').length}`);
  console.log(`  NFL: ${unique.filter(p => p.league === 'NFL').length}`);
  console.log(`  MLB: ${unique.filter(p => p.league === 'MLB').length}`);
  console.log(`  NHL: ${unique.filter(p => p.league === 'NHL').length}`);
  
  // Sort alphabetically by name
  unique.sort((a, b) => a.name.localeCompare(b.name));
  
  // Generate full player objects with id and nameNormalized
  const finalPlayers = unique.map((p, i) => ({
    id: generateId(p.name, p.league, i),
    name: p.name,
    nameNormalized: normalizeName(p.name),
    league: p.league,
    team: p.team,
    position: p.position
  }));
  
  // Write output
  fs.writeFileSync(OUT_FILE, JSON.stringify(finalPlayers));
  const stats = fs.statSync(OUT_FILE);
  console.log(`\nWritten to: ${OUT_FILE}`);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

main();
