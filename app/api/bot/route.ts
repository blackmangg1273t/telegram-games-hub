import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
// Hardcoding the URL to ensure absolute consistency with BotFather settings
const WEBAPP_URL = 'https://telegram-games-hub.vercel.app'

async function sendMessage(chatId: number | string, text: string, options = {}) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...options }),
  })
  return await response.json()
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    const message = update.message || update.channel_post || update.edited_message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    let text = message.text || ''
    const chatType = message.chat.type

    if (text.includes('@')) {
      text = text.split(' ')[0].split('@')[0]
    }

    if (text.startsWith('/start') || text.startsWith('/play')) {
      const welcomeText = `🎮 <b>صالة الألعاب جاهزة!</b>\n\nاضغط على الزر أدناه لفتح قائمة الألعاب والبدء في التحدي! 🏆`
      
      const result = await sendMessage(chatId, welcomeText, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 ابدأ اللعب الآن', web_app: { url: WEBAPP_URL } }]
          ]
        }
      })

      if (!result.ok) {
        // Final Fallback if even the main URL fails
        await sendMessage(chatId, `${welcomeText}\n\n🔗 الرابط المباشر:\n${WEBAPP_URL}`)
      }
    }

    else if (text.startsWith('/help')) {
      await sendMessage(chatId, `📖 <b>دليل الاستخدام</b>\n\n/start - فتح صالة الألعاب\n/play - قائمة الألعاب\n/help - عرض المساعدة`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Bot is running!' })
}
