import { NextResponse } from 'next/server';
import { getPlayers } from '@/lib/players-data';

export const runtime = 'edge';

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
