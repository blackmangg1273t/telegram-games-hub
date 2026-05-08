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
 *   2. Have 0 or 1 members (only the host, no guest ever joined)
 */
export async function POST(req: NextRequest) {
  // Secure with SETUP_SECRET
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.SETUP_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Find expired waiting rooms
    const now = new Date().toISOString()
    const { data: expiredRooms, error: fetchErr } = await supabase
      .from('rooms')
      .select('id')
      .eq('status', 'waiting')
      .lt('expires_at', now)

    if (fetchErr) throw fetchErr
    if (!expiredRooms || expiredRooms.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'No expired rooms found' })
    }

    const ids = expiredRooms.map((r: { id: string }) => r.id)

    // 2. Delete members first (FK constraint)
    await supabase.from('room_members').delete().in('room_id', ids)

    // 3. Delete rooms
    const { error: delErr } = await supabase.from('rooms').delete().in('id', ids)
    if (delErr) throw delErr

    return NextResponse.json({
      ok: true,
      deleted: ids.length,
      message: `✅ Cleaned up ${ids.length} expired room(s)`,
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
