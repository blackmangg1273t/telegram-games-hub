import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
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

    // Handle bot username in groups (/start@botname -> /start)
    if (text.includes('@')) {
      const parts = text.split(' ')
      const commandPart = parts[0]
      if (commandPart.startsWith('/')) {
        text = commandPart.split('@')[0] + (parts.length > 1 ? ' ' + parts.slice(1).join(' ') : '')
      }
    }

    const gameButtons = {
      inline_keyboard: [
        [{ text: '🎮 فتح صالة الألعاب', web_app: { url: WEBAPP_URL } }],
        [
          { text: '🎯 تخمين اللوجو', web_app: { url: `${WEBAPP_URL}/game/logo_guess` } },
          { text: '🚗 لوجو السيارات', web_app: { url: `${WEBAPP_URL}/game/car_logo` } },
        ],
        [
          { text: '⭕ إكس أو', web_app: { url: `${WEBAPP_URL}/game/tic_tac_toe` } },
          { text: '🐍 الثعبان', web_app: { url: `${WEBAPP_URL}/game/snake` } },
        ],
        [
          { text: '🕌 الاختبار الإسلامي', web_app: { url: `${WEBAPP_URL}/game/islamic` } },
          { text: '🚪 إنشاء غرفة', web_app: { url: `${WEBAPP_URL}/rooms/create` } },
        ],
      ]
    }

    if (text.startsWith('/start')) {
      const welcomeText = chatType === 'private'
        ? `🎮 <b>أهلاً ${message.from?.first_name || 'لاعب'}!</b>\n\nمرحباً في صالة الألعاب التنافسية!\n\n🎯 خمّن اللوجوهات\n🚗 سيارات وماركات عالمية\n⭕ إكس أو مع أصدقائك\n🐍 لعبة الثعبان\n\nاضغط على أي لعبة للبدء! 🚀`
        : `🎮 <b>صالة الألعاب جاهزة!</b>\n\nاضغط على أي زر للعب مع الجميع في المجموعة! 🏆`

      await sendMessage(chatId, welcomeText, { reply_markup: gameButtons })
    }

    else if (text.startsWith('/play')) {
      await sendMessage(chatId, '🎮 اختر لعبتك:', { reply_markup: gameButtons })
    }

    else if (text.startsWith('/room')) {
      await sendMessage(chatId, '🚪 إدارة الغرف:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ إنشاء غرفة جديدة', web_app: { url: `${WEBAPP_URL}/rooms/create` } }],
            [{ text: '🔑 ادخل بكود الغرفة', web_app: { url: `${WEBAPP_URL}/rooms/join` } }],
            [{ text: '🌐 الغرف العامة', web_app: { url: `${WEBAPP_URL}` } }],
          ]
        }
      })
    }

    else if (text.startsWith('/help')) {
      await sendMessage(chatId, `📖 <b>دليل الاستخدام</b>\n\n/start - بدء البوت\n/play - قائمة الألعاب\n/room - الغرف\n/help - المساعدة`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Bot is running!' })
}
