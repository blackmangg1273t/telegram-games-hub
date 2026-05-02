import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const WEBAPP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://telegram-games-hub.vercel.app'

async function sendMessage(chatId: number | string, text: string, options = {}) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...options }),
  })
  return res.json()
}

async function answerCallbackQuery(id: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id, text }),
  })
}

// Helper: يحدد نوع الزرار - web_app في Private، url في Groups
function makeButton(text: string, url: string, isPrivate: boolean) {
  if (isPrivate) {
    return { text, web_app: { url } }
  }
  return { text, url }
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

    // /start command
    if (text.startsWith('/start')) {
      const gameButtons = {
        inline_keyboard: [
          [makeButton('🎮 فتح صالة الألعاب', WEBAPP_URL, isPrivate)],
          [
            makeButton('🎯 تخمين اللوجو', `${WEBAPP_URL}/game/logo_guess`, isPrivate),
            makeButton('🚗 لوجو السيارات', `${WEBAPP_URL}/game/car_logo`, isPrivate),
          ],
          [
            makeButton('⭕ إكس أو', `${WEBAPP_URL}/game/tic_tac_toe`, isPrivate),
            makeButton('🐍 الثعبان', `${WEBAPP_URL}/game/snake`, isPrivate),
          ],
          [
            makeButton('🕌 الاختبار الإسلامي', `${WEBAPP_URL}/game/islamic`, isPrivate),
          ],
          [
            makeButton('🚪 إنشاء غرفة', `${WEBAPP_URL}/rooms/create`, isPrivate),
            makeButton('🔑 ادخل بكود', `${WEBAPP_URL}/rooms/join`, isPrivate),
          ],
        ]
      }

      const welcomeText = isPrivate
        ? `🎮 <b>أهلاً ${message.from?.first_name || 'لاعب'}!</b>\n\nمرحباً في صالة الألعاب التنافسية!\n\n🎯 خمّن اللوجوهات\n🚗 سيارات وماركات عالمية\n⭕ إكس أو مع أصدقائك\n🐍 لعبة الثعبان\n🕌 الاختبار الإسلامي\n\nاضغط على أي لعبة للبدء! 🚀`
        : `🎮 <b>صالة الألعاب جاهزة!</b>\n\nاضغط على أي زر للعب مع الجميع في المجموعة! 🏆\n\n💡 افتح الرابط وابدأ اللعب!`

      await sendMessage(chatId, welcomeText, { reply_markup: gameButtons })
    }

    // /play command
    else if (text.startsWith('/play')) {
      await sendMessage(chatId, '🎮 اختر لعبتك:', {
        reply_markup: {
          inline_keyboard: [
            [makeButton('🎯 تخمين اللوجو', `${WEBAPP_URL}/game/logo_guess`, isPrivate)],
            [makeButton('🚗 لوجو السيارات', `${WEBAPP_URL}/game/car_logo`, isPrivate)],
            [makeButton('🌍 ماركات عالمية', `${WEBAPP_URL}/game/brand_logo`, isPrivate)],
            [makeButton('📱 خمّن الهاتف', `${WEBAPP_URL}/game/phone_guess`, isPrivate)],
            [makeButton('⭕ إكس أو', `${WEBAPP_URL}/game/tic_tac_toe`, isPrivate)],
            [makeButton('🐍 الثعبان', `${WEBAPP_URL}/game/snake`, isPrivate)],
            [makeButton('🕌 الاختبار الإسلامي', `${WEBAPP_URL}/game/islamic`, isPrivate)],
          ]
        }
      })
    }

    // /room command
    else if (text.startsWith('/room')) {
      await sendMessage(chatId, '🚪 إدارة الغرف:', {
        reply_markup: {
          inline_keyboard: [
            [makeButton('➕ إنشاء غرفة جديدة', `${WEBAPP_URL}/rooms/create`, isPrivate)],
            [makeButton('🔑 ادخل بكود الغرفة', `${WEBAPP_URL}/rooms/join`, isPrivate)],
            [makeButton('🌐 الغرف العامة', WEBAPP_URL, isPrivate)],
          ]
        }
      })
    }

    // /help command
    else if (text.startsWith('/help')) {
      const helpText = `📖 <b>دليل الاستخدام</b>\n\n/start - بدء صالة الألعاب 🎮\n/play - اختيار لعبة للعب 🎯\n/room - إنشاء أو الانضمام لغرفة 🚪\n/help - هذه المساعدة\n\n💡 <b>كيف تلعب مع الأصدقاء؟</b>\n1. أضف البوت لمجموعتك\n2. اضغط /start\n3. أنشئ غرفة وشارك الكود\n4. ادعُ أصدقاءك للانضمام\n5. ابدأ المنافسة! 🏆\n\n🔗 <b>رابط اللعب المباشر:</b>\n${WEBAPP_URL}`

      await sendMessage(chatId, helpText)
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
