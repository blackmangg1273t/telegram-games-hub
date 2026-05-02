import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (token !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Delete in order (foreign keys first)
  const { error: membersErr } = await supabase.from('room_members').delete().gte('id', 0)
  const { error: roomsErr } = await supabase.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  const { error: usersErr } = await supabase.from('users').delete().gte('telegram_id', 0)

  if (membersErr || roomsErr || usersErr) {
    return NextResponse.json({
      error: 'Partial failure',
      membersErr,
      roomsErr,
      usersErr,
    }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message: '✅ All users, rooms, and members deleted successfully!',
    note: 'Users will be re-created automatically when they open the app via Telegram',
  })
}
