'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { GAME_TYPES, generateRoomCode } from '@/lib/gameData'

export default function CreateRoom() {
  const router = useRouter()
  const { user } = useTelegram()
  const [selectedGame, setSelectedGame] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!user || !selectedGame || loading) return
    setLoading(true)

    await supabase.from('users').upsert({
      telegram_id: user.id,
      username: user.username,
      first_name: user.first_name,
    }, { onConflict: 'telegram_id' })

    const code = generateRoomCode()
    const game = GAME_TYPES.find(g => g.id === selectedGame)!

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    const hostName = user.first_name || user.username || 'مضيف'

    const { data: room } = await supabase.from('rooms').insert({
      code,
      host_telegram_id: user.id,
      host_name: hostName,
      game_type: selectedGame,
      is_public: isPublic,
      max_players: game.maxPlayers,
      total_rounds: selectedGame === 'tic_tac_toe' ? 1 : 10,
      status: 'waiting',
      current_round: 0,
      game_data: {},
      expires_at: expiresAt,
    }).select().single()

    if (!room) { setLoading(false); return }

    await supabase.from('room_members').insert({
      room_id: room.id,
      telegram_id: user.id,
    })

    router.push(`/rooms/${room.id}`)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'Segoe UI,system-ui,sans-serif', padding: '24px 16px 40px' }}>
      <button onClick={() => router.back()}
        style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 15, cursor: 'pointer', marginBottom: 20 }}>
        ← رجوع
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 14 }}>🚪 إنشاء غرفة جديدة</h1>

        {/* Grace period info — prominent card */}
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ fontWeight: 'bold', fontSize: 13, color: '#fbbf24', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⏳</span> مهم — مدة الغرفة
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { icon: '📋', text: 'بعد إنشاء الغرفة، انسخ الكود وأرسله لصديقك', color: '#e2e8f0' },
              { icon: '⏱️', text: 'لديك 5 دقائق قبل أن تُحذف الغرفة تلقائياً', color: '#fbbf24' },
              { icon: '📱', text: 'إذا خرجت من التطبيق، لديك 3 دقائق للعودة', color: '#fb923c' },
              { icon: '🚪', text: 'إذا ضغطت "خروج"، تُحذف الغرفة فوراً', color: '#f87171' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <span style={{ fontSize: 12, color: item.color, lineHeight: 1.6 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game selection */}
      <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 12 }}>اختر نوع اللعبة</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {GAME_TYPES.map(game => (
          <button key={game.id} onClick={() => setSelectedGame(game.id)}
            style={{
              padding: '14px 12px', borderRadius: 18, textAlign: 'right',
              border: `2px solid ${selectedGame === game.id ? '#4f46e5' : 'rgba(255,255,255,0.06)'}`,
              background: selectedGame === game.id ? 'rgba(79,70,229,0.18)' : 'rgba(255,255,255,0.04)',
              cursor: 'pointer', transition: 'all 0.2s', color: 'white',
            }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>{game.emoji}</div>
            <div style={{ fontWeight: '600', fontSize: 13 }}>{game.name}</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>👥 {game.maxPlayers} لاعبين</div>
          </button>
        ))}
      </div>

      {/* Room type */}
      <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: '600', marginBottom: 12 }}>نوع الغرفة</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
        <button onClick={() => setIsPublic(true)}
          style={{ padding: '16px', borderRadius: 18, border: `2px solid ${isPublic ? '#10b981' : 'rgba(255,255,255,0.06)'}`, background: isPublic ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', color: 'white' }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>🌐</div>
          <div style={{ fontWeight: '600', fontSize: 13 }}>عامة</div>
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>تظهر في قائمة الغرف</div>
        </button>
        <button onClick={() => setIsPublic(false)}
          style={{ padding: '16px', borderRadius: 18, border: `2px solid ${!isPublic ? '#8b5cf6' : 'rgba(255,255,255,0.06)'}`, background: !isPublic ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', color: 'white' }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>🔒</div>
          <div style={{ fontWeight: '600', fontSize: 13 }}>خاصة</div>
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>للأصدقاء بالكود فقط</div>
        </button>
      </div>

      <button onClick={create} disabled={!selectedGame || loading}
        style={{ width: '100%', background: selectedGame && !loading ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(79,70,229,0.35)', color: 'white', border: 'none', borderRadius: 20, padding: '17px', fontWeight: 'bold', fontSize: 17, cursor: selectedGame && !loading ? 'pointer' : 'not-allowed', boxShadow: selectedGame ? '0 6px 24px rgba(79,70,229,0.35)' : 'none', transition: 'all 0.2s' }}>
        {loading ? '⚙️ جاري الإنشاء...' : '🚀 إنشاء الغرفة'}
      </button>
    </div>
  )
}
