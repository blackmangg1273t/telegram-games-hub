import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Called via sendBeacon when host closes the tab/browser
// sendBeacon only supports POST
export async function POST(req: NextRequest) {
  try {
    let roomId: string | null = null

    // sendBeacon sends as text/plain or form data
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await req.json()
      roomId = body.room_id
    } else {
      const text = await req.text()
      try {
        const body = JSON.parse(text)
        roomId = body.room_id
      } catch {
        // try URL params
        const url = new URL(req.url)
        roomId = url.searchParams.get('room_id')
      }
    }

    if (!roomId) {
      return NextResponse.json({ error: 'No room_id' }, { status: 400 })
    }

    await supabase.from('room_members').delete().eq('room_id', roomId)
    await supabase.from('rooms').delete().eq('id', roomId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Room delete error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// Also support GET for fallback
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('room_id')
  if (!roomId) return NextResponse.json({ error: 'No room_id' }, { status: 400 })

  await supabase.from('room_members').delete().eq('room_id', roomId)
  await supabase.from('rooms').delete().eq('id', roomId)

  return NextResponse.json({ ok: true })
}
