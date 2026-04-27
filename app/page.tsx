'use client'
import { useEffect, useState } from 'react'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { GAME_TYPES } from '@/lib/gameData'
import Link from 'next/link'

export default function Home() {
  const { user, isReady } = useTelegram()
  const [stats, setStats] = useState({ total_score: 0, games_played: 0, games_won: 0 })
  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard' | 'rooms'>('games')
  const [leaderboard, setLeaderboard] = useState<Array<{telegram_id:number;username:string;first_name:string;total_score:number;games_played:number;rank:number}>>([])

  useEffect(() => {
    if (!isReady || !user) return
    registerUser()
    fetchLeaderboard()
  }, [isReady, user])

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

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <div className="text-gray-400 text-lg">جاري التحميل...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-900/50 to-transparent px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-xl font-bold">
            {user?.first_name?.[0] || '?'}
          </div>
          <div>
            <div className="font-bold text-lg">{user?.first_name} {user?.last_name}</div>
            <div className="text-gray-400 text-sm">@{user?.username || 'مجهول'}</div>
          </div>
          <div className="mr-auto bg-yellow-500/20 border border-yellow-500/30 rounded-full px-3 py-1">
            <span className="text-yellow-400 text-sm font-bold">🏆 {stats.total_score}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'نقاط', value: stats.total_score, icon: '⭐' },
            { label: 'مباريات', value: stats.games_played, icon: '🎯' },
            { label: 'انتصارات', value: stats.games_won, icon: '🏆' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 rounded-2xl p-3 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-gray-400 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-6">
        {[
          { id: 'games', label: 'الألعاب', icon: '🎮' },
          { id: 'rooms', label: 'الغرف', icon: '🚪' },
          { id: 'leaderboard', label: 'المتصدرين', icon: '🏆' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'games' | 'leaderboard' | 'rooms')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-gray-400'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Games Tab */}
      {activeTab === 'games' && (
        <div className="px-4 grid grid-cols-2 gap-3 slide-up">
          {GAME_TYPES.map((game) => (
            <Link key={game.id} href={`/game/${game.id}`}>
              <div className={`game-card bg-gradient-to-br ${game.color} rounded-2xl p-4 h-36 flex flex-col justify-between cursor-pointer shadow-lg`}>
                <div className="text-4xl">{game.emoji}</div>
                <div>
                  <div className="font-bold text-white text-sm">{game.name}</div>
                  <div className="text-white/70 text-xs mt-0.5">{game.description}</div>
                  <div className="text-white/50 text-xs mt-1">👥 {game.maxPlayers} لاعبين</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="px-4 slide-up">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Link href="/rooms/create">
              <div className="bg-indigo-600 rounded-2xl p-4 h-28 flex flex-col justify-between cursor-pointer game-card">
                <div className="text-3xl">➕</div>
                <div className="font-bold text-sm">إنشاء غرفة</div>
              </div>
            </Link>
            <Link href="/rooms/join">
              <div className="bg-purple-600 rounded-2xl p-4 h-28 flex flex-col justify-between cursor-pointer game-card">
                <div className="text-3xl">🔑</div>
                <div className="font-bold text-sm">دخول بكود</div>
              </div>
            </Link>
          </div>
          <PublicRooms userId={user?.id} />
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="px-4 slide-up">
          {leaderboard.map((player, i) => (
            <div
              key={player.telegram_id}
              className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${
                player.telegram_id === user?.id ? 'bg-indigo-600/30 border border-indigo-500/30' : 'bg-white/5'
              }`}
            >
              <div className={`text-xl font-bold w-8 text-center ${
                i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'
              }`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`}
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                {(player.first_name || player.username || '?')[0]}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">{player.first_name || player.username}</div>
                <div className="text-gray-400 text-xs">{player.games_played} مباراة</div>
              </div>
              <div className="text-yellow-400 font-bold">{player.total_score} ⭐</div>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-3">🏆</div>
              <div>العب وكن الأول!</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PublicRooms({ userId }: { userId?: number }) {
  const [rooms, setRooms] = useState<Array<{id:string;code:string;game_type:string;status:string;is_public:boolean;host_telegram_id:number;room_members?:Array<unknown>}>>([])
  
  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('*, room_members(telegram_id)')
        .eq('is_public', true)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setRooms(data)
    }
    fetchRooms()

    const channel = supabase.channel('public-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchRooms)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const gameInfo = (type: string) => GAME_TYPES.find(g => g.id === type)

  return (
    <div>
      <div className="text-gray-400 text-sm mb-3 font-medium">🌐 الغرف العامة المتاحة</div>
      {rooms.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          <div className="text-4xl mb-2">🚪</div>
          <div className="text-sm">لا توجد غرف متاحة الآن</div>
        </div>
      ) : (
        rooms.map((room) => {
          const game = gameInfo(room.game_type)
          const memberCount = (room.room_members || []).length
          return (
            <Link key={room.id} href={`/rooms/${room.id}`}>
              <div className="bg-white/5 hover:bg-white/10 rounded-xl p-3 mb-2 flex items-center gap-3 cursor-pointer transition-all">
                <div className="text-3xl">{game?.emoji || '🎮'}</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{game?.name}</div>
                  <div className="text-gray-400 text-xs">كود: {room.code} • 👥 {memberCount} لاعب</div>
                </div>
                <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">انضم</div>
              </div>
            </Link>
          )
        })
      )}
    </div>
  )
}
