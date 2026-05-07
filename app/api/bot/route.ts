import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const WEBAPP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://telegram-games-hub.vercel.app'
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || ''

// ─── Telegram API helpers ─────────────────────────────────────────────────

async function callAPI(method: string, body: object) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

const send = (chatId: number | string, text: string, extra: object = {}) =>
  callAPI('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra })

const answerCB = (id: string, text?: string, show_alert = false) =>
  callAPI('answerCallbackQuery', { callback_query_id: id, text, show_alert })

// ─── Inline keyboards ─────────────────────────────────────────────────────

function mainMenuKeyboard() {
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

function groupInviteKeyboard(startParam: string) {
  return {
    inline_keyboard: [[
      { text: '🎮 افتح الألعاب', url: `https://t.me/${BOT_USERNAME}?start=${startParam}` }
    ]]
  }
}

function singleGameKeyboard(gameUrl: string, gameLabel: string) {
  return {
    inline_keyboard: [
      [{ text: `▶️ ${gameLabel}`, web_app: { url: gameUrl } }],
      [{ text: '🏠 كل الألعاب', web_app: { url: WEBAPP_URL } }],
    ]
  }
}

// ─── Game map ─────────────────────────────────────────────────────────────

const GAME_MAP: Record<string, { path: string; name: string; emoji: string }> = {
  logo_guess:  { path: '/game/logo_guess',  name: 'تخمين اللوجو',  emoji: '🎯' },
  car_logo:    { path: '/game/car_logo',    name: 'لوجو السيارات', emoji: '🚗' },
  brand_logo:  { path: '/game/brand_logo',  name: 'ماركات عالمية', emoji: '🌍' },
  phone_guess: { path: '/game/phone_guess', name: 'خمّن الهاتف',   emoji: '📱' },
  tic_tac_toe: { path: '/game/tic_tac_toe', name: 'إكس أو',        emoji: '⭕' },
  snake:       { path: '/game/snake',       name: 'الثعبان',        emoji: '🐍' },
  islamic:     { path: '/game/islamic',     name: 'الاختبار الإسلامي', emoji: '🕌' },
  create_room: { path: '/rooms/create',     name: 'إنشاء غرفة',    emoji: '🚪' },
  join_room:   { path: '/rooms/join',       name: 'دخول بكود',     emoji: '🔑' },
}

// ─── Handle group: nudge user to DM ───────────────────────────────────────

async function handleGroupToDM(chatId: number, userId: number, firstName: string, startParam = 'play') {
  // Notify group
  await send(chatId,
    `👋 <b>${firstName}</b>، تفقد رسالتك الخاصة! 📩\n<i>اللعب في المحادثة الخاصة لتجربة أفضل ✨</i>`,
    { reply_markup: groupInviteKeyboard(startParam) }
  )
  // Try sending DM (may fail if user never started the bot)
  try {
    await send(userId,
      `🎮 <b>أهلاً ${firstName}!</b>\n\nجاهز تلعب؟ اختار لعبتك! 👇`,
      { reply_markup: mainMenuKeyboard() }
    )
  } catch { /* user hasn't started the bot yet */ }
}

// ─── Main webhook handler ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()

    // ── Callback queries ──
    if (update.callback_query) {
      const cb = update.callback_query
      await answerCB(cb.id)
      const data = cb.data as string
      const chatId = cb.message?.chat?.id
      const userId = cb.from?.id
      const firstName = cb.from?.first_name || 'لاعب'

      if (data === 'menu' && chatId) {
        await callAPI('editMessageReplyMarkup', {
          chat_id: chatId,
          message_id: cb.message.message_id,
          reply_markup: mainMenuKeyboard(),
        })
      } else if (data === 'help' && chatId) {
        await send(chatId, helpText(), { reply_markup: { inline_keyboard: [[{ text: '← رجوع للقائمة', callback_data: 'menu' }]] } })
      } else if (data === 'stats' && userId) {
        await handleStats(userId, firstName, chatId || userId)
      }
      return NextResponse.json({ ok: true })
    }

    // ── Messages ──
    const message = update.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    const text = (message.text || '') as string
    const chatType = message.chat.type
    const isPrivate = chatType === 'private'
    const from = message.from
    const firstName = from?.first_name || 'لاعب'
    const userId = from?.id

    const startParam = text.startsWith('/start ') ? text.slice(7).trim() : undefined

    // ── /start ──
    if (text.startsWith('/start')) {
      if (isPrivate) {
        if (startParam && GAME_MAP[startParam]) {
          const game = GAME_MAP[startParam]
          await send(chatId,
            `${game.emoji} <b>أهلاً ${firstName}!</b>\n\nجاهز تلعب <b>${game.name}</b>؟ اضغط للبدء! 👇`,
            { reply_markup: singleGameKeyboard(`${WEBAPP_URL}${game.path}`, `ابدأ ${game.name}`) }
          )
        } else {
          await send(chatId, welcomeText(firstName), { reply_markup: mainMenuKeyboard() })
        }
      } else if (userId) {
        await handleGroupToDM(chatId, userId, firstName, startParam || 'play')
      }
    }

    // ── /play ──
    else if (text.startsWith('/play')) {
      if (isPrivate) {
        await send(chatId, `🎮 <b>اختر لعبتك يا ${firstName}!</b>`, { reply_markup: mainMenuKeyboard() })
      } else if (userId) {
        await handleGroupToDM(chatId, userId, firstName, 'play')
      }
    }

    // ── /room ──
    else if (text.startsWith('/room')) {
      if (isPrivate) {
        await send(chatId, `🚪 <b>إدارة الغرف</b>\n\nأنشئ غرفة خاصة أو ادخل بكود صديقك 👇`, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '➕ إنشاء غرفة جديدة', web_app: { url: `${WEBAPP_URL}/rooms/create` } }],
              [{ text: '🔑 ادخل بكود الغرفة', web_app: { url: `${WEBAPP_URL}/rooms/join` } }],
              [{ text: '🌐 الغرف العامة المتاحة', web_app: { url: WEBAPP_URL } }],
            ]
          }
        })
      } else if (userId) {
        await handleGroupToDM(chatId, userId, firstName, 'create_room')
      }
    }

    // ── /stats ──
    else if (text.startsWith('/stats') && isPrivate && userId) {
      await handleStats(userId, firstName, chatId)
    }

    // ── /top ──
    else if (text.startsWith('/top') && isPrivate) {
      await handleLeaderboard(chatId)
    }

    // ── /help ──
    else if (text.startsWith('/help')) {
      await send(chatId, helpText(), {
        reply_markup: isPrivate
          ? { inline_keyboard: [[{ text: '🎮 فتح الألعاب', web_app: { url: WEBAPP_URL } }]] }
          : groupInviteKeyboard('play')
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Bot error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// ─── Stats handler ────────────────────────────────────────────────────────

async function handleStats(userId: number, firstName: string, chatId: number) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await sb.from('users').select('total_score,games_played,games_won,islamic_score').eq('telegram_id', userId).single()

    if (!data) {
      await send(chatId, `👤 <b>${firstName}</b>\n\nلا يوجد سجل بعد! ابدأ بلعب أول مباراة 🎮`, {
        reply_markup: { inline_keyboard: [[{ text: '🎮 ابدأ اللعب', web_app: { url: WEBAPP_URL } }]] }
      })
      return
    }

    const winRate = data.games_played > 0 ? Math.round((data.games_won / data.games_played) * 100) : 0
    const { getIslamicRank } = await import('@/lib/islamicQuestions')
    const rank = getIslamicRank(data.islamic_score || 0)

    await send(chatId,
      `📊 <b>إحصائياتك يا ${firstName}</b>\n\n` +
      `⭐ <b>إجمالي النقاط:</b> ${(data.total_score || 0).toLocaleString()}\n` +
      `🎯 <b>المباريات:</b> ${data.games_played || 0}\n` +
      `🏆 <b>الانتصارات:</b> ${data.games_won || 0}\n` +
      `📈 <b>معدل الفوز:</b> ${winRate}%\n` +
      `🕌 <b>الرتبة الدينية:</b> ${rank.icon} ${rank.rank}\n` +
      `📿 <b>النقاط الدينية:</b> ${(data.islamic_score || 0).toLocaleString()}`,
      { reply_markup: { inline_keyboard: [[{ text: '🎮 العب الآن', web_app: { url: WEBAPP_URL } }]] } }
    )
  } catch {
    await send(chatId, '⚠️ حدث خطأ في استرجاع الإحصائيات')
  }
}

// ─── Leaderboard handler ──────────────────────────────────────────────────

async function handleLeaderboard(chatId: number) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await sb.from('leaderboard').select('*').limit(10)

    if (!data || data.length === 0) {
      await send(chatId, '🏆 لا يوجد لاعبون بعد! كن الأول!')
      return
    }

    const medals = ['🥇', '🥈', '🥉']
    const lines = data.map((p: { first_name?: string; username?: string; total_score: number }, i: number) => {
      const medal = medals[i] || `${i + 1}.`
      const name = p.first_name || p.username || 'لاعب'
      return `${medal} <b>${name}</b> — ${p.total_score.toLocaleString()} ⭐`
    })

    await send(chatId,
      `🏆 <b>أفضل 10 لاعبين</b>\n\n${lines.join('\n')}\n\n<i>انضم وتنافس معهم! 💪</i>`,
      { reply_markup: { inline_keyboard: [[{ text: '🎮 العب الآن', web_app: { url: WEBAPP_URL } }]] } }
    )
  } catch {
    await send(chatId, '⚠️ حدث خطأ في استرجاع المتصدرين')
  }
}

// ─── Text builders ────────────────────────────────────────────────────────

function welcomeText(name: string) {
  return (
    `🎮 <b>أهلاً ${name}!</b>\n\n` +
    `مرحباً في <b>صالة الألعاب التنافسية</b> 🏆\n\n` +
    `🎯 <b>الألعاب المتاحة:</b>\n` +
    `• تخمين اللوجوهات والماركات\n` +
    `• لوجو السيارات العالمية\n` +
    `• خمّن شركة الهاتف\n` +
    `• إكس أو مع أصدقائك\n` +
    `• لعبة الثعبان\n` +
    `• الاختبار الإسلامي والرتب\n\n` +
    `اختار لعبتك وابدأ المنافسة! 👇`
  )
}

function helpText() {
  return (
    `📖 <b>دليل الاستخدام</b>\n\n` +
    `<b>الأوامر:</b>\n` +
    `/start — بدء صالة الألعاب 🎮\n` +
    `/play — اختيار لعبة 🎯\n` +
    `/room — إنشاء أو الانضمام لغرفة 🚪\n` +
    `/stats — إحصائياتك الشخصية 📊\n` +
    `/top — أفضل 10 لاعبين 🏆\n` +
    `/help — هذه المساعدة 📖\n\n` +
    `<b>💡 كيف تلعب مع الأصدقاء؟</b>\n` +
    `1️⃣ أضف البوت لمجموعتك\n` +
    `2️⃣ اكتب /start في المجموعة\n` +
    `3️⃣ افتح رسالة البوت الخاصة\n` +
    `4️⃣ أنشئ غرفة وشارك الكود\n` +
    `5️⃣ ابدأ المنافسة! 🏆\n\n` +
    `<b>🕌 الاختبار الإسلامي:</b>\n` +
    `أجب عن الأسئلة الدينية واكسب نقاطاً لترتقي في الرتب من مبتدئ حتى حجة الإسلام!`
  )
}

export async function GET() {
  return NextResponse.json({ status: '🤖 Bot is running!', webapp: WEBAPP_URL })
}
