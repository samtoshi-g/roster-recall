const fs = require('fs');

// Process NBA players (4,821)
const nbaRaw = fs.readFileSync('data/raw/nba_players.csv', 'utf-8');
const nbaLines = nbaRaw.split('\n').slice(1); // skip header
const nbaPlayers = nbaLines
  .filter(line => line.trim())
  .map(line => {
    const cols = line.split(',');
    const firstName = cols[3] || '';
    const lastName = cols[2] || '';
    const name = `${firstName} ${lastName}`.trim();
    const team = `${cols[8] || ''} ${cols[9] || ''}`.trim();
    const position = cols[12] || '';
    const fromYear = parseInt(cols[25]) || 2000;
    const toYear = parseInt(cols[26]) || 2024;
    
    if (!name || fromYear < 2000) return null;
    
    return {
      id: `nba_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${fromYear}`,
      name,
      nameNormalized: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      league: 'NBA',
      team,
      position
    };
  })
  .filter(p => p && p.name.length > 2);

// Process NFL players (24,357)
const nflRaw = fs.readFileSync('data/raw/nfl_players.csv', 'utf-8');
const nflLines = nflRaw.split('\n').slice(1);
const nflPlayers = nflLines
  .filter(line => line.trim())
  .map(line => {
    const cols = line.split(',');
    const name = cols[1] || '';
    const team = cols[23] || '';
    const position = cols[9] || '';
    const rookieYear = parseInt(cols[21]) || 2000;
    
    if (!name || rookieYear < 2000) return null;
    
    return {
      id: `nfl_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${rookieYear}`,
      name,
      nameNormalized: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      league: 'NFL',
      team,
      position
    };
  })
  .filter(p => p && p.name.length > 2);

// Dedupe by name within league
const dedupe = (players) => {
  const seen = new Set();
  return players.filter(p => {
    const key = `${p.league}_${p.nameNormalized}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const allPlayers = [...dedupe(nbaPlayers), ...dedupe(nflPlayers)];

console.log(`NBA: ${nbaPlayers.length} -> ${dedupe(nbaPlayers).length} unique`);
console.log(`NFL: ${nflPlayers.length} -> ${dedupe(nflPlayers).length} unique`);
console.log(`Total: ${allPlayers.length}`);

// Save
fs.writeFileSync('data/players.json', JSON.stringify(allPlayers, null, 2));
console.log('Saved to data/players.json');
