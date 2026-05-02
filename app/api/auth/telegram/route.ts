import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function validateTelegramInitData(initData: string): Record<string, string> | null {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    params.delete('hash')

    // Sort and create check string
    const checkArr: string[] = []
    params.forEach((val, key) => checkArr.push(`${key}=${val}`))
    checkArr.sort()
    const checkString = checkArr.join('\n')

    // HMAC-SHA256 with "WebAppData" key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest()

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex')

    if (calculatedHash !== hash) return null

    // Check auth_date (optional: reject if > 24h old)
    const authDate = parseInt(params.get('auth_date') || '0')
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) return null // 24 hours

    const result: Record<string, string> = {}
    params.forEach((val, key) => { result[key] = val })
    return result
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json()

    if (!initData) {
      return NextResponse.json({ error: 'No initData provided' }, { status: 400 })
    }

    // In development mode with test data, allow bypass
    const isDev = process.env.NODE_ENV === 'development'
    let userData: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string } | null = null

    if (isDev && initData === 'dev_mode') {
      // Development fallback
      userData = {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      }
    } else {
      const validated = validateTelegramInitData(initData)
      if (!validated) {
        return NextResponse.json({ error: 'Invalid initData' }, { status: 401 })
      }

      const userStr = validated['user']
      if (!userStr) {
        return NextResponse.json({ error: 'No user in initData' }, { status: 400 })
      }

      userData = JSON.parse(userStr)
    }

    if (!userData) {
      return NextResponse.json({ error: 'Failed to parse user' }, { status: 400 })
    }

    // Upsert user in Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .upsert({
        telegram_id: userData.id,
        username: userData.username || null,
        first_name: userData.first_name || '',
        last_name: userData.last_name || null,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'telegram_id' })
      .select('*')
      .single()

    if (error) {
      console.error('Supabase upsert error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: userData.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        photo_url: userData.photo_url,
      },
      dbUser: user,
    })
  } catch (err) {
    console.error('Auth error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
