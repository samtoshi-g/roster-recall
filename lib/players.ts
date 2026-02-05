export type League = 'NBA' | 'NFL' | 'MLB' | 'NHL';

export interface PlayerRow {
  id: string;
  name: string;
  name_normalized: string;
  first_name: string | null;
  last_name: string | null;
  league: League;
  team: string | null;
  position: string | null;
  years_active: string | null;
  is_active: number;
}

export interface SearchResult {
  id: string;
  name: string;
  team: string | null;
  league: League;
  position: string | null;
}

export interface ScoreEntry {
  id: string;
  name: string;
  total: number;
  nba: number;
  nfl: number;
  mlb: number;
  nhl: number;
  created_at: number;
}

export const LEAGUES: League[] = ['NBA', 'NFL', 'MLB', 'NHL'];
