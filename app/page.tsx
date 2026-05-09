'use client'
import { useEffect, useState, useCallback } from 'react'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { GAME_TYPES } from '@/lib/gameData'
import Link from 'next/link'

interface UserStats { total_score: number; games_played: number; games_won: number }
interface LeaderboardEntry { telegram_id: number; username: string; first_name: string; total_score: number; games_played: number; rank: number }
interface Room {
  id: string; code: string; game_type: string; status: string
  is_public: boolean; host_telegram_id: number; host_name?: string
  expires_at?: string; created_at?: string
  room_members?: { telegram_id: number }[]
  users?: { first_name?: string; username?: string } | null
}

// ── Live member count dot indicator ──
function MemberDots({ count, max }: { count: number; max: number }) {
  const color = count >= max ? '#4ade80' : count > 1 ? '#fbbf24' : '#94a3b8'
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: Math.min(max, 8) }).map((_, i) => (
        <div key={i} style={{
          width: i < count ? 9 : 7, height: i < count ? 9 : 7,
          borderRadius: '50%',
          background: i < count ? color : 'rgba(255,255,255,0.12)',
          boxShadow: i < count ? `0 0 5px ${color}88` : 'none',
          transition: 'all 0.3s',
          flexShrink: 0,
        }} />
      ))}
    </div>
  )
}

// ── Grace period countdown badge ──
function GraceBadge({ expiresAt }: { expiresAt: string }) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setSecs(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  if (secs <= 0) return null
  const mins = Math.floor(secs / 60)
  const s = secs % 60
  const urgent = secs <= 60
  return (
    <div style={{
      background: urgent ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)',
      border: `1px solid ${urgent ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.3)'}`,
      borderRadius: 10, padding: '2px 8px',
      fontSize: 11, fontFamily: 'monospace',
      color: urgent ? '#f87171' : '#fbbf24',
      fontWeight: 'bold', whiteSpace: 'nowrap',
    }}>
      ⏳ {mins}:{s.toString().padStart(2, '0')}
    </div>
  )
}

export default function Home() {
  const { user, isReady } = useTelegram()
  const [stats, setStats] = useState<UserStats>({ total_score: 0, games_played: 0, games_won: 0 })
  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard' | 'rooms' | 'profile'>('games')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [rooms, setRooms] = useState<Room[]>([])
  // Per-room member counts (updated live)
  const [roomMemberCounts, setRoomMemberCounts] = useState<Record<string, number>>({})

  const fetchPublicRooms = useCallback(async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*, room_members(telegram_id), users!rooms_host_telegram_id_fkey(first_name, username)')
      .eq('is_public', true)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      const validRooms = data.filter(room => {
        const memberCount = (room.room_members as { telegram_id: number }[])?.length || 0
        return memberCount > 0
      })
      setRooms(validRooms)
      // Build member count map
      const counts: Record<string, number> = {}
      validRooms.forEach(r => {
        counts[r.id] = (r.room_members as { telegram_id: number }[])?.length || 0
      })
      setRoomMemberCounts(counts)
    }
  }, [])

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

  // Realtime rooms + members subscription
  useEffect(() => {
    const channel = supabase
      .channel('public_rooms_watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        fetchPublicRooms()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, async (payload) => {
        // Fast update: just re-fetch member counts for existing rooms
        fetchPublicRooms()

        // If someone left (DELETE), check if room should be removed
        if (payload.eventType === 'DELETE') {
          const roomId = (payload.old as { room_id?: string })?.room_id
          if (roomId) {
            const { count } = await supabase
              .from('room_members')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', roomId)
            if (count === 0) {
              setRooms(prev => prev.filter(r => r.id !== roomId))
              setRoomMemberCounts(prev => { const n = { ...prev }; delete n[roomId]; return n })
            }
          }
        }
      })
      .subscribe()

    const interval = setInterval(fetchPublicRooms, 10000)
    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [fetchPublicRooms])

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
      <div style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>افتح اللعبة من تيليجرام!</div>
      <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>
        اللعبة بتشتغل جوه تيليجرام فقط.<br />افتح البوت وابدأ اللعب من هناك 👇
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
          {/* Action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Link href="/rooms/create" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 20, padding: 16, height: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }} className="game-card">
                <div style={{ fontSize: 32 }}>➕</div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 13 }}>إنشاء غرفة</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 }}>عامة أو خاصة</div>
                </div>
              </div>
            </Link>
            <Link href="/rooms/join" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', borderRadius: 20, padding: 16, height: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }} className="game-card">
                <div style={{ fontSize: 32 }}>🔑</div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 13 }}>دخول بكود</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 }}>ادخل كود صديقك</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Info banner: grace period explanation */}
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 13, color: '#a5b4fc', marginBottom: 4 }}>كيف تعمل الغرف؟</div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.75 }}>
                  ✅ <strong style={{ color: '#e2e8f0' }}>عند إنشاء غرفة</strong> — لديك <strong style={{ color: '#fbbf24' }}>5 دقائق</strong> لمشاركة الكود قبل أن تُحذف تلقائياً.<br />
                  ⚠️ <strong style={{ color: '#e2e8f0' }}>إذا غادرت التطبيق</strong> — الغرفة تظل محجوزة <strong style={{ color: '#fb923c' }}>3 دقائق</strong> ثم تُحذف إن لم تعُد.<br />
                  🚪 <strong style={{ color: '#e2e8f0' }}>إذا خرجت نهائياً</strong> — تُحذف الغرفة فوراً وتختفي من القائمة.
                </div>
              </div>
            </div>
          </div>

          {/* Live rooms list */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontWeight: '600', fontSize: 14, color: '#cbd5e1' }}>
              🌐 الغرف العامة المتاحة
            </span>
            <span style={{ background: rooms.length > 0 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)', color: rooms.length > 0 ? '#a5b4fc' : '#64748b', fontSize: 12, fontWeight: 'bold', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(99,102,241,0.2)' }}>
              {rooms.length} غرفة
            </span>
          </div>

          {rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🚪</div>
              <div style={{ fontSize: 14, marginBottom: 6 }}>لا توجد غرف متاحة الآن</div>
              <div style={{ fontSize: 12, color: '#334155' }}>كن أول من ينشئ غرفة وادعُ أصدقاءك!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rooms.map(room => {
                const game = GAME_TYPES.find(g => g.id === room.game_type)
                const memberCount = roomMemberCounts[room.id] ?? ((room.room_members as { telegram_id: number }[])?.length || 0)
                const maxPlayers = game?.maxPlayers || 8
                const isFull = memberCount >= maxPlayers
                // Host name: from joined users table or host_name field
                const hostName = (room.users as { first_name?: string; username?: string } | null)?.first_name
                  || (room.users as { first_name?: string; username?: string } | null)?.username
                  || room.host_name
                  || 'مضيف'
                // Game gradient color
                const gradientMap: Record<string, string> = {
                  logo_guess: '#9333ea, #db2777', car_logo: '#2563eb, #0891b2',
                  brand_logo: '#ea580c, #dc2626', phone_guess: '#16a34a, #0d9488',
                  tic_tac_toe: '#ca8a04, #ea580c', snake: '#059669, #16a34a',
                  islamic: '#0f766e, #047857',
                }
                const grad = gradientMap[room.game_type] || '#4f46e5, #7c3aed'

                return (
                  <Link key={room.id} href={`/rooms/${room.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isFull ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 18, padding: '14px 14px', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Game icon */}
                        <div style={{
                          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                          background: `linear-gradient(135deg, ${grad})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                        }}>
                          {game?.emoji || '🎮'}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Top row: game name + code */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <span style={{ fontWeight: '700', fontSize: 14, color: 'white' }}>
                              {game?.name || 'لعبة'}
                            </span>
                            <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#818cf8', background: 'rgba(99,102,241,0.15)', padding: '1px 7px', borderRadius: 6, letterSpacing: 1 }}>
                              {room.code}
                            </span>
                          </div>

                          {/* Host row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                            <span style={{ fontSize: 14 }}>👑</span>
                            <span style={{ color: '#94a3b8', fontSize: 12 }}>{hostName}</span>
                          </div>

                          {/* Member count dots + numbers */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MemberDots count={memberCount} max={maxPlayers} />
                            <span style={{ fontSize: 12, color: isFull ? '#f87171' : memberCount > 1 ? '#fbbf24' : '#94a3b8', fontWeight: '600' }}>
                              {memberCount}/{maxPlayers} لاعب
                            </span>
                          </div>
                        </div>

                        {/* Right side: status + timer */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                          <div style={{
                            background: isFull ? 'rgba(239,68,68,0.15)' : memberCount > 1 ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)',
                            color: isFull ? '#f87171' : memberCount > 1 ? '#fbbf24' : '#4ade80',
                            border: `1px solid ${isFull ? 'rgba(239,68,68,0.3)' : memberCount > 1 ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)'}`,
                            borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 'bold',
                          }}>
                            {isFull ? '🔴 ممتلئة' : memberCount > 1 ? '🟡 جاهزة' : '🟢 انضم'}
                          </div>
                          {room.expires_at && (
                            <GraceBadge expiresAt={room.expires_at} />
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
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
      <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(139,92,246,0.3))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 24, padding: 24, marginBottom: 20, textAlign: 'center' }}>
        {user?.photo_url ? (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
            <img src={user.photo_url} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #6366f1', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
        ) : (
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', margin: '0 auto 12px', border: '3px solid rgba(99,102,241,0.5)' }}>
            {user?.first_name?.[0] || '?'}
          </div>
        )}
        <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4, unicodeBidi: 'plaintext', direction: 'ltr', textAlign: 'center' }}>
          {user?.first_name} {user?.last_name}
        </div>
        <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>@{user?.username || 'لاعب'}</div>
        {rank > 0 && (
          <div style={{ display: 'inline-block', background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.4)', borderRadius: 20, padding: '6px 16px', fontSize: 14, color: '#fbbf24', fontWeight: 'bold', marginBottom: 16 }}>
            🏆 المركز #{rank} عالمياً
          </div>
        )}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '8px 12px', fontSize: 11, color: '#64748b' }}>
          💡 لتغيير صورتك البروفايل أو اسمك، غيّرها في تيليجرام وستُحدَّث هنا
        </div>
      </div>
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
