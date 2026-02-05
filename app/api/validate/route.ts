import { NextResponse } from 'next/server';
import { getPlayers } from '@/lib/players-data';



export async function POST(request: Request) {
  const body = await request.json();
  const playerId = typeof body.playerId === 'string' ? body.playerId.trim() : '';

  if (!playerId) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const players = getPlayers();
  const player = players.find(p => p.id === playerId);

  if (!player) {
    return NextResponse.json({ valid: false, duplicate: false });
  }

  return NextResponse.json({ 
    valid: true, 
    player: {
      id: player.id,
      name: player.name,
      team: player.team,
      league: player.league,
      position: player.position
    }, 
    duplicate: false 
  });
}
