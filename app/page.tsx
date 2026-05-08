'use client'
import { useEffect, useState } from 'react'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { GAME_TYPES } from '@/lib/gameData'
import Link from 'next/link'

interface UserStats { total_score: number; games_played: number; games_won: number }
interface LeaderboardEntry { telegram_id: number; username: string; first_name: string; total_score: number; games_played: number; rank: number }
interface Room { id: string; code: string; game_type: string; status: string; is_public: boolean; host_telegram_id: number; host_name?: string; expires_at?: string; room_members?: unknown[] }

export default function Home() {
  const { user, isReady } = useTelegram()
  const [stats, setStats] = useState<UserStats>({ total_score: 0, games_played: 0, games_won: 0 })
  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard' | 'rooms' | 'profile'>('games')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    if (!isReady || !user) return
    registerUser()
    fetchLeaderboard()
    fetchOnlineCount()
    fetchPublicRooms()
  }, [isReady, user])

  // Realtime online count
  useEffect(() => {
    const interval = setInterval(fetchOnlineCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Realtime rooms subscription + periodic refresh
  useEffect(() => {
    // Subscribe to rooms table changes
    const channel = supabase
      .channel('public_rooms_watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchPublicRooms()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, () => {
        fetchPublicRooms()
      })
      .subscribe()

    // Also refresh every 15 seconds as a safety net
    const interval = setInterval(fetchPublicRooms, 15000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  async function registerUser() {
    if (!user) return
    await supabase.from('users').upsert({
      telegram_id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'telegram_id' })
    const { data } = await supabase.from('users').select('total_score,games_played,games_won').eq('telegram_id', user.id).single()
    if (data) setStats(data)
  }

  async function fetchLeaderboard() {
    const { data } = await supabase.from('leaderboard').select('*').limit(20)
    if (data) setLeaderboard(data)
  }

  async function fetchOnlineCount() {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('last_seen', fiveMinAgo)
    setOnlineCount(count || 0)
  }

  async function fetchPublicRooms() {
    const { data } = await supabase
      .from('rooms')
      .select('*, room_members(telegram_id)')
      .eq('is_public', true)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      // Filter out rooms with 0 members (orphaned/empty rooms)
      const validRooms = data.filter(room => {
        const memberCount = (room.room_members as unknown[])?.length || 0
        return memberCount > 0
      })
      setRooms(validRooms)
    }
  }

  if (!isReady) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 56 }}>🎮</div>
      <div style={{ color: '#94a3b8', fontSize: 16 }}>جاري التحميل...</div>
    </div>
  )

  if (isReady && !user) return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#0f172a", flexDirection: "column",
      gap: 16, padding: 24, textAlign: "center", fontFamily: "Segoe UI, system-ui, sans-serif"
    }}>
      <div style={{ fontSize: 64 }}>🎮</div>
      <div style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
        افتح اللعبة من تيليجرام!
      </div>
      <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
        اللعبة بتشتغل جوه تيليجرام فقط.<br />
        افتح البوت وابدأ اللعب من هناك 👇
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'Segoe UI, system-ui, sans-serif', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, rgba(79,70,229,0.4) 0%, transparent 100%)', padding: '20px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold', flexShrink: 0 }}>
            {user?.first_name?.[0] || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 'bold', fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.first_name} {user?.last_name}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>@{user?.username || 'لاعب'}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: 13, color: '#fbbf24', fontWeight: 'bold' }}>
              🏆 {stats.total_score}
            </div>
            <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '2px 8px', fontSize: 11, color: '#4ade80' }}>
              🟢 {onlineCount} متصل الآن
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'النقاط', value: stats.total_score, icon: '⭐' },
            { label: 'المباريات', value: stats.games_played, icon: '🎯' },
            { label: 'الانتصارات', value: stats.games_won, icon: '🏆' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>{s.value}</div>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
        {[
          { id: 'games', label: 'الألعاب', icon: '🎮' },
          { id: 'rooms', label: 'الغرف', icon: '🚪' },
          { id: 'leaderboard', label: 'المتصدرون', icon: '🏆' },
          { id: 'profile', label: 'البروفايل', icon: '👤' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as 'games' | 'leaderboard' | 'rooms' | 'profile')}
            style={{ flex: 1, padding: '8px 4px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: '600', transition: 'all 0.2s',
              background: activeTab === tab.id ? '#4f46e5' : 'rgba(255,255,255,0.06)',
              color: activeTab === tab.id ? 'white' : '#94a3b8' }}>
            <div>{tab.icon}</div>
            <div>{tab.label}</div>
          </button>
        ))}
      </div>

      {/* GAMES TAB */}
      {activeTab === 'games' && (
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {GAME_TYPES.map(game => (
            <Link key={game.id} href={game.route || `/game/${game.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: `linear-gradient(135deg, ${game.color.replace('from-', '').replace(' to-', ', ')})`.replace('from-purple-600, to-pink-600', '#9333ea, #db2777').replace('from-blue-600, to-cyan-600', '#2563eb, #0891b2').replace('from-orange-600, to-red-600', '#ea580c, #dc2626').replace('from-green-600, to-teal-600', '#16a34a, #0d9488').replace('from-yellow-600, to-orange-600', '#ca8a04, #ea580c').replace('from-emerald-600, to-green-600', '#059669, #16a34a'),
                borderRadius: 20, padding: 16, height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                className="game-card">
                <div style={{ fontSize: 40 }}>{game.emoji}</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'white', fontSize: 13 }}>{game.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>{game.description}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 4 }}>👥 {game.maxPlayers} لاعبين</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ROOMS TAB */}
      {activeTab === 'rooms' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <Link href="/rooms/create" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 20, padding: 16, height: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }} className="game-card">
                <div style={{ fontSize: 32 }}>➕</div>
                <div style={{ fontWeight: 'bold', fontSize: 13 }}>إنشاء غرفة</div>
              </div>
            </Link>
            <Link href="/rooms/join" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', borderRadius: 20, padding: 16, height: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }} className="game-card">
                <div style={{ fontSize: 32 }}>🔑</div>
                <div style={{ fontWeight: 'bold', fontSize: 13 }}>دخول بكود</div>
              </div>
            </Link>
          </div>

          {/* Grace period explanation banner */}
          <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: 16, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 13, color: '#a5b4fc', marginBottom: 4 }}>كيف تعمل الغرف؟</div>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.7 }}>
                عند إنشاء غرفة، لديك <strong style={{ color: '#fbbf24' }}>5 دقائق</strong> لمشاركة الكود مع أصدقائك قبل أن تُحذف تلقائياً.
                إذا غادر صاحب الغرفة، تُحذف الغرفة فوراً. الغرف الفارغة لا تظهر هنا.
              </div>
            </div>
          </div>

          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12, fontWeight: '600' }}>🌐 الغرف العامة المتاحة ({rooms.length})</div>
          {rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🚪</div>
              <div style={{ fontSize: 13 }}>لا توجد غرف الآن — كن أول من ينشئ واحدة!</div>
            </div>
          ) : rooms.map(room => {
            const game = GAME_TYPES.find(g => g.id === room.game_type)
            const memberCount = (room.room_members as unknown[])?.length || 0
            const hostName = room.host_name || 'مضيف'
            return (
              <Link key={room.id} href={`/rooms/${room.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 14px', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s'
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `linear-gradient(135deg, ${game?.id === 'islamic' ? '#059669, #0d9488' : game?.id === 'tic_tac_toe' ? '#9333ea, #db2777' : '#4f46e5, #7c3aed'})`,
                    fontSize: 24, flexShrink: 0
                  }}>
                    {game?.emoji || '🎮'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: 13, marginBottom: 3 }}>{game?.name || 'لعبة'}</div>
                    <div style={{ color: '#94a3b8', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>👑 {hostName}</span>
                      <span style={{ color: '#475569' }}>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>👥 {memberCount}/{game?.maxPlayers || 8}</span>
                      <span style={{ color: '#475569' }}>•</span>
                      <span style={{ fontFamily: 'monospace', color: '#a5b4fc', letterSpacing: 1 }}>{room.code}</span>
                    </div>
                  </div>
                  <div style={{
                    background: memberCount > 1 ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.15)',
                    color: memberCount > 1 ? '#4ade80' : '#fbbf24',
                    fontSize: 11, padding: '5px 12px', borderRadius: 20, fontWeight: 'bold', whiteSpace: 'nowrap'
                  }}>
                    {memberCount > 1 ? 'انضم' : 'انتظار'}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {activeTab === 'leaderboard' && (
        <div style={{ padding: '0 16px' }}>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
              <div>العب وكن الأول!</div>
            </div>
          ) : leaderboard.map((p, i) => (
            <div key={p.telegram_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 14, marginBottom: 8,
              background: p.telegram_id === user?.id ? 'rgba(79,70,229,0.25)' : 'rgba(255,255,255,0.05)',
              border: p.telegram_id === user?.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent' }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', width: 32, textAlign: 'center', color: i === 0 ? '#fbbf24' : i === 1 ? '#cbd5e1' : i === 2 ? '#d97706' : '#64748b' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>
                {(p.first_name || p.username || '?')[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: '600', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.first_name || p.username}</div>
                <div style={{ color: '#64748b', fontSize: 11 }}>{p.games_played} مباراة</div>
              </div>
              <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 14 }}>{p.total_score} ⭐</div>
            </div>
          ))}
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <ProfileTab user={user} stats={stats} leaderboard={leaderboard} />
      )}
    </div>
  )
}

function ProfileTab({ user, stats, leaderboard }: { user: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string } | null; stats: UserStats; leaderboard: LeaderboardEntry[] }) {
  const rank = leaderboard.findIndex(p => p.telegram_id === user?.id) + 1
  const winRate = stats.games_played > 0 ? Math.round((stats.games_won / stats.games_played) * 100) : 0

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Profile Card */}
      <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(139,92,246,0.3))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 24, padding: 24, marginBottom: 20, textAlign: 'center' }}>
        {/* Avatar */}
        {user?.photo_url ? (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
            <img src={user.photo_url} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #6366f1', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', margin: '0 auto 12px', border: '3px solid rgba(99,102,241,0.5)' }}>
            {user?.first_name?.[0] || '?'}
          </div>
        )}

        {/* Name - handles decorative Unicode */}
        <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4, unicodeBidi: 'plaintext', direction: 'ltr', textAlign: 'center' }}>
          {user?.first_name} {user?.last_name}
        </div>
        <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>@{user?.username || 'لاعب'}</div>

        {/* Rank Badge */}
        {rank > 0 && (
          <div style={{ display: 'inline-block', background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.4)', borderRadius: 20, padding: '6px 16px', fontSize: 14, color: '#fbbf24', fontWeight: 'bold', marginBottom: 16 }}>
            🏆 المركز #{rank} عالمياً
          </div>
        )}

        {/* Telegram Note */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '8px 12px', fontSize: 11, color: '#64748b' }}>
          💡 لتغيير صورتك البروفايل أو اسمك، غيّرها في تيليجرام وستُحدَّث هنا
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'إجمالي النقاط', value: stats.total_score, icon: '⭐', color: '#fbbf24' },
          { label: 'المباريات', value: stats.games_played, icon: '🎯', color: '#60a5fa' },
          { label: 'الانتصارات', value: stats.games_won, icon: '🏆', color: '#4ade80' },
          { label: 'معدل الفوز', value: `${winRate}%`, icon: '📊', color: '#f472b6' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: s.color }}>{s.value}</div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16 }}>
        <div style={{ fontWeight: '600', marginBottom: 12, color: '#cbd5e1' }}>🎖️ الإنجازات</div>
        {[
          { icon: '🎯', label: 'لاعب نشيط', desc: 'لعبت أكثر من 5 مباريات', unlocked: stats.games_played >= 5 },
          { icon: '🏆', label: 'بطل', desc: 'فزت بـ 3 مباريات', unlocked: stats.games_won >= 3 },
          { icon: '⭐', label: 'جامع النقاط', desc: 'جمعت 1000 نقطة', unlocked: stats.total_score >= 1000 },
          { icon: '🔥', label: 'محترف', desc: 'فزت بـ 10 مباريات', unlocked: stats.games_won >= 10 },
        ].map(a => (
          <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: a.unlocked ? 1 : 0.4 }}>
            <div style={{ fontSize: 24, filter: a.unlocked ? 'none' : 'grayscale(100%)' }}>{a.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: '600' }}>{a.label}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{a.desc}</div>
            </div>
            {a.unlocked && <div style={{ fontSize: 16 }}>✅</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
