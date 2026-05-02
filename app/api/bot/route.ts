import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const WEBAPP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://telegram-games-hub.vercel.app'

async function sendMessage(chatId: number | string, text: string, options = {}) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...options }),
  })
}

async function answerCallbackQuery(id: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id, text }),
  })
}

// بيبني الرابط مع بيانات اليوزر
function buildUrl(path: string, user: { id: number; first_name: string; last_name?: string; username?: string }) {
  const params = new URLSearchParams({
    tg_id: String(user.id),
    tg_name: user.first_name,
    ...(user.last_name && { tg_last: user.last_name }),
    ...(user.username && { tg_username: user.username }),
  })
  return `${WEBAPP_URL}${path}?${params.toString()}`
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()

    if (update.callback_query) {
      await answerCallbackQuery(update.callback_query.id)
    }

    const message = update.message || update.channel_post
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    const text = message.text || ''
    const chatType = message.chat.type
    const isPrivate = chatType === 'private'
    const from = message.from

    // Private: web_app | Group: url مع بيانات اليوزر
    function btn(label: string, path: string) {
      if (isPrivate) {
        return { text: label, web_app: { url: `${WEBAPP_URL}${path}` } }
      }
      return { text: label, url: buildUrl(path, from) }
    }

    if (text.startsWith('/start')) {
      const gameButtons = {
        inline_keyboard: [
          [btn('🎮 فتح صالة الألعاب', '')],
          [
            btn('🎯 تخمين اللوجو', '/game/logo_guess'),
            btn('🚗 لوجو السيارات', '/game/car_logo'),
          ],
          [
            btn('⭕ إكس أو', '/game/tic_tac_toe'),
            btn('🐍 الثعبان', '/game/snake'),
          ],
          [btn('🕌 الاختبار الإسلامي', '/game/islamic')],
          [
            btn('🚪 إنشاء غرفة', '/rooms/create'),
            btn('🔑 ادخل بكود', '/rooms/join'),
          ],
        ]
      }

      const welcomeText = isPrivate
        ? `🎮 <b>أهلاً ${from?.first_name || 'لاعب'}!</b>\n\nمرحباً في صالة الألعاب التنافسية!\n\n🎯 خمّن اللوجوهات\n🚗 سيارات وماركات عالمية\n⭕ إكس أو مع أصدقائك\n🐍 لعبة الثعبان\n🕌 الاختبار الإسلامي\n\nاضغط على أي لعبة للبدء! 🚀`
        : `🎮 <b>صالة الألعاب جاهزة!</b>\n\nاضغط على أي زر للعب مع الجميع في المجموعة! 🏆`

      await sendMessage(chatId, welcomeText, { reply_markup: gameButtons })
    }

    else if (text.startsWith('/play')) {
      await sendMessage(chatId, '🎮 اختر لعبتك:', {
        reply_markup: {
          inline_keyboard: [
            [btn('🎯 تخمين اللوجو', '/game/logo_guess')],
            [btn('🚗 لوجو السيارات', '/game/car_logo')],
            [btn('🌍 ماركات عالمية', '/game/brand_logo')],
            [btn('📱 خمّن الهاتف', '/game/phone_guess')],
            [btn('⭕ إكس أو', '/game/tic_tac_toe')],
            [btn('🐍 الثعبان', '/game/snake')],
            [btn('🕌 الاختبار الإسلامي', '/game/islamic')],
          ]
        }
      })
    }

    else if (text.startsWith('/room')) {
      await sendMessage(chatId, '🚪 إدارة الغرف:', {
        reply_markup: {
          inline_keyboard: [
            [btn('➕ إنشاء غرفة جديدة', '/rooms/create')],
            [btn('🔑 ادخل بكود الغرفة', '/rooms/join')],
            [btn('🌐 الغرف العامة', '')],
          ]
        }
      })
    }

    else if (text.startsWith('/help')) {
      await sendMessage(chatId, `📖 <b>دليل الاستخدام</b>\n\n/start - بدء صالة الألعاب 🎮\n/play - اختيار لعبة للعب 🎯\n/room - إنشاء أو الانضمام لغرفة 🚪\n/help - هذه المساعدة\n\n💡 <b>كيف تلعب مع الأصدقاء؟</b>\n1. أضف البوت لمجموعتك\n2. اضغط /start\n3. أنشئ غرفة وشارك الكود\n4. ادعُ أصدقاءك للانضمام\n5. ابدأ المنافسة! 🏆`)
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
