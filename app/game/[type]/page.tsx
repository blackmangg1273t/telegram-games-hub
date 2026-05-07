'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { GAME_TYPES, generateRoomCode } from '@/lib/gameData'

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useTelegram()
  const [loading, setLoading] = useState(false)

  const gameType = params.type as string
  const game = GAME_TYPES.find(g => g.id === gameType)

  // Snake has its own dedicated page
  if (gameType === 'snake') {
    router.replace('/game/snake')
    return null
  }

  if (!game) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 18 }}>لعبة غير موجودة</div>
        <button onClick={() => router.push('/')} style={{ marginTop: 16, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', cursor: 'pointer' }}>← الرئيسية</button>
      </div>
    </div>
  )

  async function createRoom(isPublic: boolean) {
    if (!user || loading) return
    setLoading(true)

    await supabase.from('users').upsert({
      telegram_id: user.id,
      username: user.username,
      first_name: user.first_name,
    }, { onConflict: 'telegram_id' })

    const code = generateRoomCode()
    const { data: room, error } = await supabase.from('rooms').insert({
      code,
      host_telegram_id: user.id,
      game_type: gameType,
      is_public: isPublic,
      max_players: game.maxPlayers,
      total_rounds: gameType === 'tic_tac_toe' ? 1 : 10,
      status: 'waiting',
      current_round: 0,
      game_data: {},
    }).select().single()

    if (error || !room) { setLoading(false); return }

    await supabase.from('room_members').insert({ room_id: room.id, telegram_id: user.id })
    router.push(`/rooms/${room.id}`)
    setLoading(false)
  }

  // Parse gradient color string from game config
  const gradientMap: Record<string, string> = {
    'from-purple-600 to-pink-600': 'linear-gradient(135deg, #9333ea, #db2777)',
    'from-blue-600 to-cyan-600': 'linear-gradient(135deg, #2563eb, #0891b2)',
    'from-orange-600 to-red-600': 'linear-gradient(135deg, #ea580c, #dc2626)',
    'from-green-600 to-teal-600': 'linear-gradient(135deg, #16a34a, #0d9488)',
    'from-yellow-600 to-orange-600': 'linear-gradient(135deg, #ca8a04, #ea580c)',
    'from-emerald-600 to-green-600': 'linear-gradient(135deg, #059669, #16a34a)',
    'from-teal-700 to-emerald-700': 'linear-gradient(135deg, #0f766e, #047857)',
  }
  const heroGradient = gradientMap[game.color] || 'linear-gradient(135deg, #4f46e5, #7c3aed)'

  const howToPlay: Record<string, { icon: string; tips: string[] }> = {
    tic_tac_toe: { icon: '⭕', tips: ['أنت ضد لاعب آخر', 'تناوبا في وضع X أو O', 'من يكمل صف أو عمود أو قطر يفوز', 'المضيف يلعب بـ X والضيف بـ O'] },
    logo_guess:  { icon: '🎯', tips: ['تظهر صورة اللوجو', 'اكتب اسم الشركة أو الماركة', 'كلما كنت أسرع كلما نلت نقاطاً أكثر', '10 جولات - أعلى مجموع يفوز'] },
    car_logo:    { icon: '🚗', tips: ['خمّن لوجو السيارة', 'الإجابة بالعربي أو الإنجليزي', 'تقبل اللقطب والأسماء المشابهة', '10 جولات تنافسية'] },
    brand_logo:  { icon: '🌍', tips: ['ماركات عالمية شهيرة', 'من تقنية لرياضة لطعام ومشروبات', 'الإجابة بالعربي أو الإنجليزي', '10 جولات - أعلى مجموع يفوز'] },
    phone_guess: { icon: '📱', tips: ['خمّن شركة الهاتف', 'من Apple إلى Xiaomi وما بينهم', 'الإجابة بالعربي أو الإنجليزي', '10 جولات تنافسية'] },
    islamic:     { icon: '🕌', tips: ['أسئلة دينية متنوعة', '4 اختيارات لكل سؤال', '20 ثانية للإجابة', 'ارتقِ في الرتب وسجّل النقاط'] },
  }
  const guide = howToPlay[gameType] || howToPlay.logo_guess

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI,system-ui,sans-serif', background: '#0f172a', color: 'white' }}>
      {/* Hero */}
      <div style={{ background: heroGradient, padding: '48px 24px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
        <button onClick={() => router.back()} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 20, color: 'white', padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}>← رجوع</button>
        <div style={{ fontSize: 72, marginBottom: 12, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>{game.emoji}</div>
        <h1 style={{ fontSize: 30, fontWeight: 'bold', marginBottom: 8, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{game.name}</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 16 }}>{game.description}</p>
        <div style={{ display: 'flex', gap: 16, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
          <span style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: 20 }}>👥 حتى {game.maxPlayers} لاعبين</span>
          {gameType !== 'tic_tac_toe' && <span style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: 20 }}>⏱️ {gameType === 'islamic' ? '15 سؤال' : '10 جولات'}</span>}
          <span style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: 20 }}>⚡ تنافسي</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ flex: 1, padding: '24px 16px 32px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#e2e8f0' }}>ابدأ اللعب</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {/* Public room */}
          <button onClick={() => createRoom(true)} disabled={loading}
            style={{ background: loading ? 'rgba(5,150,105,0.4)' : 'linear-gradient(135deg,#059669,#0d9488)', color: 'white', border: 'none', borderRadius: 20, padding: '16px 20px', fontWeight: 'bold', fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}>
            <span style={{ fontSize: 32 }}>🌐</span>
            <div style={{ textAlign: 'right' }}>
              <div>غرفة عامة</div>
              <div style={{ fontSize: 12, fontWeight: 'normal', color: 'rgba(255,255,255,0.7)' }}>يمكن لأي شخص الانضمام من القائمة</div>
            </div>
          </button>

          {/* Private room */}
          <button onClick={() => createRoom(false)} disabled={loading}
            style={{ background: loading ? 'rgba(79,70,229,0.4)' : 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', borderRadius: 20, padding: '16px 20px', fontWeight: 'bold', fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}>
            <span style={{ fontSize: 32 }}>🔒</span>
            <div style={{ textAlign: 'right' }}>
              <div>غرفة خاصة</div>
              <div style={{ fontSize: 12, fontWeight: 'normal', color: 'rgba(255,255,255,0.7)' }}>ادعُ أصدقاءك بكود سري</div>
            </div>
          </button>

          {/* Join by code */}
          <button onClick={() => router.push('/rooms/join')}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', borderRadius: 20, padding: '16px 20px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 32 }}>🔑</span>
            <div style={{ textAlign: 'right' }}>
              <div>ادخل بكود</div>
              <div style={{ fontSize: 12, fontWeight: 'normal', color: '#94a3b8' }}>لديك كود غرفة؟ ادخل منه</div>
            </div>
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginBottom: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8, animation: 'spin 1s linear infinite' }}>⚙️</div>
            جاري إنشاء الغرفة...
          </div>
        )}

        {/* How to play */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '16px 20px' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: 12, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{guide.icon}</span> كيف تلعب؟
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {guide.tips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#94a3b8', fontSize: 14 }}>
                <span style={{ background: 'rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }}>{i + 1}</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
