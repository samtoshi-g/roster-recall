import { NextResponse } from 'next/server';
import { getLeaderboard, addScore } from '@/lib/leaderboard-data';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || 20), 100);

  const results = getLeaderboard(limit);

  return NextResponse.json({ results });
}

export async function POST(request: Request) {
  const body = await request.json();

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const total = Number(body.total || 0);
  const nba = Number(body.nba || 0);
  const nfl = Number(body.nfl || 0);
  const mlb = Number(body.mlb || 0);
  const nhl = Number(body.nhl || 0);

  if (!name || name.length > 32) {
    return NextResponse.json({ error: 'Name required (max 32 chars).' }, { status: 400 });
  }

  if ([total, nba, nfl, mlb, nhl].some((value) => Number.isNaN(value) || value < 0)) {
    return NextResponse.json({ error: 'Invalid score values.' }, { status: 400 });
  }

  const id = addScore({ name, total, nba, nfl, mlb, nhl });

  return NextResponse.json({ id });
}
