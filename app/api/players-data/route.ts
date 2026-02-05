import { NextResponse } from 'next/server';
import { getPlayers } from '@/lib/players-data';

// Use Node runtime for large JSON payload
export const runtime = 'nodejs';

export async function GET() {
  const players = getPlayers();

  return NextResponse.json(
    { players },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
      }
    }
  );
}
