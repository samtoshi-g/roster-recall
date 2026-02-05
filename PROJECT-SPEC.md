# Sports Guesser — Project Spec

## Overview
A web game where players name as many professional athletes as they can from the 4 major North American sports leagues (NBA, NFL, MLB, NHL) within 5 minutes.

---

## Game Mechanics

### Core Loop
1. Player starts game → 5:00 timer begins
2. Type player name → autocomplete suggests matches
3. Select correct player → +1 point, name added to list
4. Repeat until timer hits 0:00
5. End screen shows results + stats

### Scoring
- 1 point per unique player
- Tracked by league: NBA | NFL | MLB | NHL
- Total score prominently displayed
- No penalties for wrong guesses (just no autocomplete match)

### Timer
- 5:00 countdown (configurable for future modes)
- Visual urgency as time runs low (color change at 1:00, 0:30)
- Audio cue at 1:00, 0:10 (optional, can mute)
- Hard stop at 0:00 — input disabled

### Duplicate Handling
- Client maintains Set of guessed player IDs
- If player already guessed:
  - Input flashes red briefly
  - Toast: "Already guessed!"
  - No point awarded
  - Quick feedback (don't slow down flow)

### Input Behavior
- Single text input, always focused during gameplay
- Autocomplete dropdown appears after 2+ characters
- Debounced API calls (250ms)
- Show top 8 matches max
- Each result shows: Name | Team | League badge
- Click or Enter to select top result
- Arrow keys to navigate dropdown
- ESC to close dropdown

---

## Data Model

### Player Schema
```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,           -- unique ID (league_firstname_lastname_birthyear)
  name TEXT NOT NULL,            -- display name "LeBron James"
  name_normalized TEXT NOT NULL, -- searchable "lebron james"
  first_name TEXT,
  last_name TEXT,
  league TEXT NOT NULL,          -- NBA, NFL, MLB, NHL
  team TEXT,                     -- current/last team
  position TEXT,
  years_active TEXT,             -- "2003-present" or "1990-2005"
  is_active INTEGER DEFAULT 0,   -- 1 if currently playing
  created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Full-text search index
CREATE VIRTUAL TABLE players_fts USING fts5(
  name,
  name_normalized,
  content='players',
  content_rowid='rowid'
);
```

### Data Fields Needed
| Field | Required | Source |
|-------|----------|--------|
| name | ✅ | TheSportsDB |
| league | ✅ | TheSportsDB |
| team | ✅ | TheSportsDB |
| position | Nice-to-have | TheSportsDB |
| years_active | Nice-to-have | May need to derive |
| is_active | Nice-to-have | TheSportsDB |

### Estimated Data Size
| League | Est. Players | Notes |
|--------|--------------|-------|
| NBA | ~5,000 | All-time roster |
| NFL | ~25,000 | High turnover, large rosters |
| MLB | ~20,000 | Long history |
| NHL | ~8,000 | |
| **Total** | **~58,000** | |

SQLite DB size: ~10-15 MB with indexes

---

## Technical Architecture

### Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite with better-sqlite3
- **Cache:** lru-cache (in-memory)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

### Directory Structure
```
/sports-guesser
├── app/
│   ├── page.tsx              # Home/start screen
│   ├── play/page.tsx         # Game screen
│   ├── results/page.tsx      # End screen
│   └── api/
│       ├── search/route.ts   # Autocomplete endpoint
│       └── validate/route.ts # Validate player selection
├── components/
│   ├── Timer.tsx
│   ├── SearchInput.tsx
│   ├── AutocompleteDropdown.tsx
│   ├── PlayerList.tsx
│   ├── ScoreBoard.tsx
│   └── ResultsCard.tsx
├── lib/
│   ├── db.ts                 # SQLite connection
│   ├── cache.ts              # LRU cache wrapper
│   ├── search.ts             # Search logic
│   └── players.ts            # Player data types
├── data/
│   ├── sports.db             # SQLite database
│   └── scripts/
│       └── seed.ts           # Fetch + seed player data
├── public/
│   └── league-logos/         # NBA, NFL, MLB, NHL badges
└── package.json
```

### API Endpoints

#### `GET /api/search?q={query}&league={all|nba|nfl|mlb|nhl}`
**Response:**
```json
{
  "results": [
    {
      "id": "nba_lebron_james_1984",
      "name": "LeBron James",
      "team": "Los Angeles Lakers",
      "league": "NBA",
      "position": "SF"
    }
  ],
  "cached": true,
  "ms": 2
}
```

#### `POST /api/validate`
**Request:**
```json
{
  "playerId": "nba_lebron_james_1984",
  "sessionId": "abc123"
}
```
**Response:**
```json
{
  "valid": true,
  "player": { ... },
  "duplicate": false
}
```

### Caching Strategy

```
Request flow:
1. Normalize query: "LeBron" → "lebron"
2. Check LRU cache for exact query
3. Cache hit → return immediately
4. Cache miss → query SQLite FTS5
5. Store result in cache (TTL: 1 hour)
6. Return results

Cache warming (on startup):
- Pre-populate top 200 common first names
- Pre-populate top 100 famous players
- Keeps hot paths instant
```

**LRU Cache Config:**
- Max entries: 5,000
- TTL: 1 hour
- Key: normalized query + league filter

---

## UX/UI Design

### Screens

#### 1. Home Screen
```
┌─────────────────────────────────┐
│                                 │
│      🏀 ⚾ 🏈 🏒               │
│                                 │
│      SPORTS GUESSER             │
│                                 │
│  Name as many players as you    │
│  can in 5 minutes!              │
│                                 │
│      [ START GAME ]             │
│                                 │
│  Leagues: NBA · NFL · MLB · NHL │
│                                 │
└─────────────────────────────────┘
```

#### 2. Game Screen
```
┌─────────────────────────────────┐
│  ⏱️ 4:32          Score: 47    │
│  NBA:12 NFL:18 MLB:9 NHL:8     │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ mich                    │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ Michael Jordan    NBA 🏀│   │
│  │ Michael Thomas    NFL 🏈│   │
│  │ Michael Trout     MLB ⚾│   │
│  │ Michael Bunting   NHL 🏒│   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│  Recent: LeBron James, Tom     │
│  Brady, Mike Trout, Sidney...  │
└─────────────────────────────────┘
```

#### 3. Results Screen
```
┌─────────────────────────────────┐
│                                 │
│         TIME'S UP!              │
│                                 │
│           147                   │
│         players                 │
│                                 │
│    🏀 NBA    42                 │
│    🏈 NFL    55                 │
│    ⚾ MLB    31                 │
│    🏒 NHL    19                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 📋 Copy Results         │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ 🔄 Play Again           │   │
│  └─────────────────────────┘   │
│                                 │
│  View all players ▼            │
│                                 │
└─────────────────────────────────┘
```

### Visual Design
- **Theme:** Dark mode default (easier on eyes during intense play)
- **Colors:** 
  - NBA: Orange (#F58426)
  - NFL: Blue (#013369)
  - MLB: Red (#CE1141)
  - NHL: Black (#000000)
- **Typography:** System fonts for speed, bold score numbers
- **Animations:** 
  - Score increment: pop animation
  - Timer: pulse when low
  - Input: shake on duplicate

### Mobile Considerations
- Input stays fixed at top (no scroll needed)
- Large touch targets for autocomplete items
- Keyboard always open during gameplay
- Results list scrollable below fold

---

## Edge Cases

### Name Handling
| Case | Example | Solution |
|------|---------|----------|
| Suffixes | "Ken Griffey Jr." | Store normalized without suffix, display with |
| Accents | "José Altuve" | Normalize to "jose altuve" for search |
| Nicknames | "Magic Johnson" | Store both, link to same player |
| Same name | "Michael Jordan (NBA)" vs "Michael Jordan (MLB)" | Unique ID includes league + birth year |
| Name changes | "Ron Artest" → "Metta World Peace" | Store both as aliases |

### Data Quality
- Some players have incomplete data (missing team, etc.)
- Historical players may lack details
- Plan: Include with whatever data available, don't filter out

### Gameplay Edge Cases
| Case | Handling |
|------|----------|
| Rapid typing | Debounce prevents API spam |
| Paste player name | Works normally with autocomplete |
| Browser refresh during game | Game state lost (v1), could persist later |
| Very common names | Show league badge to disambiguate |
| Network error | Show error toast, keep game running |

---

## Data Pipeline

### Initial Seed
1. Fetch all players from TheSportsDB API
   - `/searchplayers.php?p={name}` — by name
   - `/lookup_all_players.php?id={teamId}` — by team
2. Transform to our schema
3. Insert into SQLite
4. Build FTS5 index

### Refresh Strategy
- Weekly cron job to fetch new players
- Check for roster updates
- Upsert into database
- For MVP: manual refresh is fine

### TheSportsDB Notes
- Free tier: 30 req/minute
- Need to fetch by team (iterate all teams in each league)
- League IDs: NBA=4387, NFL=4391, MLB=4424, NHL=4380
- API: `https://www.thesportsdb.com/api/v1/json/{api_key}/`

---

## Future Features (Post-MVP)

### Game Modes
- **Speed Round:** 1 minute, rapid fire
- **League Focus:** Only one league at a time
- **Decade Mode:** Only players from specific era
- **Active Only:** Current rostered players
- **Hall of Fame:** Only HOF inductees

### Social
- **Shareable Results:** "I named 147 players! Can you beat me?"
- **Daily Challenge:** Same seed for everyone, compare scores
- **Leaderboard:** Top scores (requires auth)

### Stats
- Personal best tracking (localStorage)
- Most commonly named players
- Hardest leagues by avg score

---

## Deployment

### Environment
- Vercel (Next.js optimized)
- SQLite file in repo (small enough)
- Environment variables:
  - `THESPORTSDB_API_KEY` (for data refresh)

### Build Process
1. `npm run seed` — Fetch and populate SQLite
2. `npm run build` — Next.js build
3. Deploy to Vercel

### Performance Targets
- Search API: <50ms p95
- Time to Interactive: <2s
- Lighthouse: 90+ on all metrics

---

## Development Phases

### Phase 1: Foundation (Today)
- [ ] Set up Next.js project
- [ ] SQLite schema + FTS5
- [ ] Data seeding script
- [ ] Basic search API

### Phase 2: Game Core (Today)
- [ ] Timer component
- [ ] Search input with autocomplete
- [ ] Score tracking
- [ ] Duplicate detection

### Phase 3: Polish (Today/Tomorrow)
- [ ] Results screen
- [ ] Share functionality
- [ ] Mobile optimization
- [ ] Visual polish

### Phase 4: Deploy
- [ ] GitHub repo
- [ ] Vercel deployment
- [ ] Test with real users

---

## Decisions (Confirmed by Eric)

1. **Leaderboard:** Yes, name entry only (no auth)
2. **Historical depth:** 2000–present only
3. **App name:** RosterRecall
4. **Domain:** Vercel default, add to builtbysam.ai portfolio

---

*Spec complete. Ready to build on your go.*
