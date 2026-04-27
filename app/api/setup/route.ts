import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  
  if (token !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://telegram-games-hub.vercel.app'
  const webhookUrl = `${APP_URL}/api/bot`

  // Set webhook
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'callback_query', 'inline_query'] })
  })
  
  const data = await res.json()

  // Set bot commands
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'start', description: 'بدء صالة الألعاب 🎮' },
        { command: 'play', description: 'اختيار لعبة للعب 🎯' },
        { command: 'room', description: 'إنشاء أو الانضمام لغرفة 🚪' },
        { command: 'help', description: 'المساعدة والتعليمات 📖' },
      ]
    })
  })

  return NextResponse.json({ 
    webhook: data,
    url: webhookUrl,
    message: 'Bot setup complete! ✅'
  })
}
