import { NextResponse } from 'next/server';
import { searchPlayersInMemory, normalizeQuery } from '@/lib/players-data';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const league = (searchParams.get('league') || 'all').toLowerCase();

  const start = performance.now();
  const results = searchPlayersInMemory(query, league);
  const ms = Math.round(performance.now() - start);

  return NextResponse.json({
    results,
    cached: false,
    ms
  });
}
