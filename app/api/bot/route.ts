import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const WEBAPP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://telegram-games-hub.vercel.app'
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || ''

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

function privateButtons() {
  return {
    inline_keyboard: [
      [{ text: '🎮 فتح صالة الألعاب', web_app: { url: WEBAPP_URL } }],
      [
        { text: '🎯 تخمين اللوجو', web_app: { url: `${WEBAPP_URL}/game/logo_guess` } },
        { text: '🚗 لوجو السيارات', web_app: { url: `${WEBAPP_URL}/game/car_logo` } },
      ],
      [
        { text: '🌍 ماركات عالمية', web_app: { url: `${WEBAPP_URL}/game/brand_logo` } },
        { text: '📱 خمّن الهاتف', web_app: { url: `${WEBAPP_URL}/game/phone_guess` } },
      ],
      [
        { text: '⭕ إكس أو', web_app: { url: `${WEBAPP_URL}/game/tic_tac_toe` } },
        { text: '🐍 الثعبان', web_app: { url: `${WEBAPP_URL}/game/snake` } },
      ],
      [{ text: '🕌 الاختبار الإسلامي', web_app: { url: `${WEBAPP_URL}/game/islamic` } }],
      [
        { text: '🚪 إنشاء غرفة', web_app: { url: `${WEBAPP_URL}/rooms/create` } },
        { text: '🔑 ادخل بكود', web_app: { url: `${WEBAPP_URL}/rooms/join` } },
      ],
    ]
  }
}

async function handleGroupCommand(groupChatId: number, userId: number, firstName: string, startParam?: string) {
  await sendMessage(groupChatId,
    `👋 <b>${firstName}</b>، تفقد رسالتك الخاصة! 📩\n\n<i>اللعب بيتم في المحادثة الخاصة عشان تجربة أفضل ✨</i>`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 افتح الألعاب', url: `https://t.me/${BOT_USERNAME}?start=${startParam || 'play'}` }
        ]]
      }
    }
  )

  try {
    await sendMessage(userId,
      `🎮 <b>أهلاً ${firstName}!</b>\n\nجاهز تلعب؟ اختار لعبتك! 👇`,
      { reply_markup: privateButtons() }
    )
  } catch {
    // اليوزر لم يبدأ البوت في الخاص بعد
  }
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
    const firstName = from?.first_name || 'لاعب'
    const userId = from?.id

    const startParam = text.startsWith('/start ') ? text.split(' ')[1] : undefined

    const gameMap: Record<string, string> = {
      'logo_guess': '/game/logo_guess',
      'car_logo': '/game/car_logo',
      'brand_logo': '/game/brand_logo',
      'phone_guess': '/game/phone_guess',
      'tic_tac_toe': '/game/tic_tac_toe',
      'snake': '/game/snake',
      'islamic': '/game/islamic',
      'create_room': '/rooms/create',
      'join_room': '/rooms/join',
    }

    if (text.startsWith('/start')) {
      if (isPrivate) {
        if (startParam && gameMap[startParam]) {
          await sendMessage(chatId, `🎮 <b>أهلاً ${firstName}!</b>\n\nاضغط للبدء! 👇`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '▶️ العب الآن', web_app: { url: `${WEBAPP_URL}${gameMap[startParam]}` } }],
                [{ text: '🏠 الصفحة الرئيسية', web_app: { url: WEBAPP_URL } }],
              ]
            }
          })
        } else {
          await sendMessage(chatId,
            `🎮 <b>أهلاً ${firstName}!</b>\n\nمرحباً في صالة الألعاب التنافسية!\n\n🎯 خمّن اللوجوهات\n🚗 سيارات وماركات عالمية\n⭕ إكس أو مع أصدقائك\n🐍 لعبة الثعبان\n🕌 الاختبار الإسلامي\n\nاختار لعبتك! 👇`,
            { reply_markup: privateButtons() }
          )
        }
      } else if (userId) {
        await handleGroupCommand(chatId, userId, firstName, startParam || 'play')
      }
    }

    else if (text.startsWith('/play')) {
      if (isPrivate) {
        await sendMessage(chatId, '🎮 اختر لعبتك:', { reply_markup: privateButtons() })
      } else if (userId) {
        await handleGroupCommand(chatId, userId, firstName, 'play')
      }
    }

    else if (text.startsWith('/room')) {
      if (isPrivate) {
        await sendMessage(chatId, '🚪 إدارة الغرف:', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '➕ إنشاء غرفة جديدة', web_app: { url: `${WEBAPP_URL}/rooms/create` } }],
              [{ text: '🔑 ادخل بكود الغرفة', web_app: { url: `${WEBAPP_URL}/rooms/join` } }],
              [{ text: '🌐 الغرف العامة', web_app: { url: WEBAPP_URL } }],
            ]
          }
        })
      } else if (userId) {
        await handleGroupCommand(chatId, userId, firstName, 'create_room')
      }
    }

    else if (text.startsWith('/help')) {
      await sendMessage(chatId,
        `📖 <b>دليل الاستخدام</b>\n\n/start - بدء صالة الألعاب 🎮\n/play - اختيار لعبة للعب 🎯\n/room - إنشاء أو الانضمام لغرفة 🚪\n/help - هذه المساعدة\n\n💡 <b>كيف تلعب مع الأصدقاء؟</b>\n1. أضف البوت لمجموعتك\n2. اضغط /start في المجموعة\n3. افتح الرسالة الخاصة من البوت\n4. أنشئ غرفة وشارك الكود\n5. ابدأ المنافسة! 🏆`
      )
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
