import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

async function sendMessage(chatId: number | string, text: string, options = {}) {
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...options }),
  })
  if (!response.ok) {
    const errorData = await response.json()
    console.error('Telegram API Error:', errorData)
  }
}

async function answerCallbackQuery(id: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id, text }),
  })
}

export async function POST(req: NextRequest) {
  try {
    // Determine the base URL dynamically from the request headers
    const host = req.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const dynamicBaseUrl = `${protocol}://${host}`
    
    // Priority: ENV variable > Dynamic Host > Fallback
    const WEBAPP_URL = process.env.NEXT_PUBLIC_APP_URL || dynamicBaseUrl || 'https://telegram-games-hub.vercel.app'
    
    const update = await req.json()
    
    if (update.callback_query) {
      await answerCallbackQuery(update.callback_query.id)
    }

    const message = update.message || update.channel_post || update.edited_message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    let text = message.text || ''
    const chatType = message.chat.type

    // Remove bot username from commands
    if (text.includes('@')) {
      const parts = text.split(' ')
      const commandPart = parts[0]
      if (commandPart.startsWith('/')) {
        text = commandPart.split('@')[0] + (parts.length > 1 ? ' ' + parts.slice(1).join(' ') : '')
      }
    }

    // /start command
    if (text.startsWith('/start')) {
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
            { text: '🚪 إنشاء غرفة', web_app: { url: `${WEBAPP_URL}/rooms/create` } },
            { text: '🔑 ادخل بكود', web_app: { url: `${WEBAPP_URL}/rooms/join` } },
          ],
        ]
      }

      const welcomeText = chatType === 'private'
        ? `🎮 <b>أهلاً ${message.from?.first_name || 'لاعب'}!</b>\n\nمرحباً في صالة الألعاب التنافسية!\n\n🎯 خمّن اللوجوهات\n🚗 سيارات وماركات عالمية\n⭕ إكس أو مع أصدقائك\n🐍 لعبة الثعبان\n\nاضغط على أي لعبة للبدء! 🚀`
        : `🎮 <b>صالة الألعاب جاهزة!</b>\n\nاضغط على أي زر للعب مع الجميع في المجموعة! 🏆`

      await sendMessage(chatId, welcomeText, { reply_markup: gameButtons })
    }

    // /play command
    else if (text.startsWith('/play')) {
      await sendMessage(chatId, '🎮 اختر لعبتك:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎯 تخمين اللوجو', web_app: { url: `${WEBAPP_URL}/game/logo_guess` } }],
            [{ text: '🚗 لوجو السيارات', web_app: { url: `${WEBAPP_URL}/game/car_logo` } }],
            [{ text: '🌍 ماركات عالمية', web_app: { url: `${WEBAPP_URL}/game/brand_logo` } }],
            [{ text: '📱 خمّن الهاتف', web_app: { url: `${WEBAPP_URL}/game/phone_guess` } }],
            [{ text: '⭕ إكس أو', web_app: { url: `${WEBAPP_URL}/game/tic_tac_toe` } }],
            [{ text: '🐍 الثعبان', web_app: { url: `${WEBAPP_URL}/game/snake` } }],
          ]
        }
      })
    }

    // /room command
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

    // /help command
    else if (text.startsWith('/help')) {
      await sendMessage(chatId, `📖 <b>دليل الاستخدام</b>\n\n/start - بدء البوت وعرض الألعاب\n/play - اختيار لعبة للعب\n/room - إنشاء أو الانضمام لغرفة\n/help - هذه المساعدة\n\n💡 <b>كيف تلعب مع الأصدقاء؟</b>\n1. أضف البوت لمجموعتك\n2. اضغط /start\n3. أنشئ غرفة وشارك الكود\n4. ادعُ أصدقاءك للانضمام\n5. ابدأ المنافسة! 🏆`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Bot error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Bot is running! 🤖' })
}
