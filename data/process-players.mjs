import fs from 'fs';

// Process NBA players (FROM_YEAR >= 2000 OR TO_YEAR >= 2000)
const nbaRaw = fs.readFileSync('data/raw/nba_players.csv', 'utf-8');
const nbaLines = nbaRaw.split('\n').slice(1);
const nbaPlayers = nbaLines
  .filter(line => line.trim())
  .map(line => {
    const cols = line.split(',');
    const firstName = cols[3] || '';
    const lastName = cols[2] || '';
    const name = `${firstName} ${lastName}`.trim();
    const team = `${cols[8] || ''} ${cols[9] || ''}`.trim();
    const position = cols[12] || '';
    const fromYear = parseInt(cols[25]) || 1900;
    const toYear = parseInt(cols[26]) || 1900;
    
    // Include if they played any time 2000+
    if (!name || (fromYear < 2000 && toYear < 2000)) return null;
    
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

// Process NFL players - use last_season >= 2000
// display_name=1, position=17, last_season=27, latest_team=28
const nflRaw = fs.readFileSync('data/raw/nfl_players.csv', 'utf-8');
const nflLines = nflRaw.split('\n').slice(1);
const nflPlayers = nflLines
  .filter(line => line.trim())
  .map(line => {
    const cols = line.split(',');
    const name = cols[1] || ''; // display_name
    const position = cols[17] || ''; // position
    const team = cols[28] || ''; // latest_team
    const lastSeason = parseInt(cols[27]) || 0; // last_season
    
    // Include if they played through 2000+
    if (!name || lastSeason < 2000) return null;
    
    return {
      id: `nfl_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${lastSeason}`,
      name,
      nameNormalized: name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      league: 'NFL',
      team,
      position
    };
  })
  .filter(p => p && p.name.length > 2);

// Dedupe by normalized name within league
const dedupe = (players) => {
  const seen = new Set();
  return players.filter(p => {
    const key = `${p.league}_${p.nameNormalized}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const deduped = {
  nba: dedupe(nbaPlayers),
  nfl: dedupe(nflPlayers)
};

console.log(`NBA: ${nbaPlayers.length} -> ${deduped.nba.length} unique (2000+)`);
console.log(`NFL: ${nflPlayers.length} -> ${deduped.nfl.length} unique (2000+)`);

const allPlayers = [...deduped.nba, ...deduped.nfl];
console.log(`Total: ${allPlayers.length}`);

fs.writeFileSync('data/players.json', JSON.stringify(allPlayers, null, 2));
console.log('Saved to data/players.json');
