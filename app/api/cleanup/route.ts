import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * POST /api/cleanup
 * Called by Vercel Cron every 5 minutes (configure in vercel.json).
 * Deletes rooms that:
 *   1. Have expires_at in the past AND still have status = 'waiting'
 *   2. Have 0 members (orphaned/empty rooms)
 *   3. Are 'waiting' but the host is no longer a member
 *   4. Have been in 'waiting' status for too long with only the host
 */
export async function POST(req: NextRequest) {
  // Secure with SETUP_SECRET
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.SETUP_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date().toISOString()
    const idsToDelete: string[] = []

    // 1. Find expired waiting rooms (expires_at in the past)
    const { data: expiredRooms, error: fetchErr } = await supabase
      .from('rooms')
      .select('id')
      .eq('status', 'waiting')
      .lt('expires_at', now)

    if (fetchErr) throw fetchErr
    if (expiredRooms) {
      expiredRooms.forEach((r: { id: string }) => {
        if (!idsToDelete.includes(r.id)) idsToDelete.push(r.id)
      })
    }

    // 2. Find waiting rooms and check their members
    const { data: waitingRooms, error: waitErr } = await supabase
      .from('rooms')
      .select('id, host_telegram_id, code')
      .eq('status', 'waiting')

    if (waitErr) throw waitErr

    if (waitingRooms && waitingRooms.length > 0) {
      // Get all room members for waiting rooms
      const roomIds = waitingRooms.map((r: { id: string }) => r.id)

      const { data: allMembers, error: memErr } = await supabase
        .from('room_members')
        .select('room_id, telegram_id')
        .in('room_id', roomIds)

      if (memErr) throw memErr

      // Group members by room_id
      const membersByRoom: Record<string, number[]> = {}
      if (allMembers) {
        allMembers.forEach((m: { room_id: string; telegram_id: number }) => {
          if (!membersByRoom[m.room_id]) membersByRoom[m.room_id] = []
          membersByRoom[m.room_id].push(m.telegram_id)
        })
      }

      // Check each waiting room
      waitingRooms.forEach((room: { id: string; host_telegram_id: number; code: string }) => {
        const memberIds = membersByRoom[room.id] || []

        // Room has 0 members — orphaned, delete it
        if (memberIds.length === 0) {
          if (!idsToDelete.includes(room.id)) idsToDelete.push(room.id)
        }

        // Host is no longer a member — delete the room
        if (memberIds.length > 0 && !memberIds.includes(room.host_telegram_id)) {
          if (!idsToDelete.includes(room.id)) idsToDelete.push(room.id)
        }
      })
    }

    // 3. Find stale 'playing' rooms (no activity for 30 min — game probably abandoned)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: stalePlayingRooms, error: staleErr } = await supabase
      .from('rooms')
      .select('id')
      .eq('status', 'playing')
      .lt('updated_at', thirtyMinAgo)

    if (staleErr) throw staleErr
    if (stalePlayingRooms) {
      stalePlayingRooms.forEach((r: { id: string }) => {
        if (!idsToDelete.includes(r.id)) idsToDelete.push(r.id)
      })
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'No rooms to clean up' })
    }

    // Delete members first (FK constraint), then rooms
    await supabase.from('room_members').delete().in('room_id', idsToDelete)
    const { error: delErr } = await supabase.from('rooms').delete().in('id', idsToDelete)
    if (delErr) throw delErr

    return NextResponse.json({
      ok: true,
      deleted: idsToDelete.length,
      message: `✅ Cleaned up ${idsToDelete.length} room(s)`,
    })
  } catch (err) {
    console.error('Cleanup error:', err)
    return NextResponse.json({ error: 'Cleanup failed', detail: String(err) }, { status: 500 })
  }
}

// Also allow GET for manual trigger with token in query
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (token !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Reuse POST logic by calling it
  return POST(new NextRequest(req.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.SETUP_SECRET}` },
  }))
}
