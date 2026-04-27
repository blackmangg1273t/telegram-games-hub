'use client'
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
    const { data: room } = await supabase.from('rooms').insert({
      code,
      host_telegram_id: user.id,
      game_type: selectedGame,
      is_public: isPublic,
      max_players: game.maxPlayers,
      total_rounds: 10,
    }).select().single()

    if (!room) { setLoading(false); return }

    await supabase.from('room_members').insert({ room_id: room.id, telegram_id: user.id })
    router.push(`/rooms/${room.id}`)
  }

  return (
    <div className="min-h-screen p-4 pt-8">
      <button onClick={() => router.back()} className="text-gray-400 mb-6">← رجوع</button>
      <h1 className="text-2xl font-bold mb-6">🚪 إنشاء غرفة جديدة</h1>

      <h2 className="text-gray-400 text-sm mb-3">اختر نوع اللعبة</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {GAME_TYPES.map(game => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={`p-4 rounded-2xl text-right transition-all border-2 ${
              selectedGame === game.id
                ? 'border-indigo-500 bg-indigo-600/20'
                : 'border-white/5 bg-white/5'
            }`}
          >
            <div className="text-3xl mb-2">{game.emoji}</div>
            <div className="font-semibold text-sm">{game.name}</div>
            <div className="text-gray-400 text-xs mt-0.5">👥 {game.maxPlayers}</div>
          </button>
        ))}
      </div>

      <h2 className="text-gray-400 text-sm mb-3">نوع الغرفة</h2>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setIsPublic(true)}
          className={`p-4 rounded-2xl border-2 transition-all ${isPublic ? 'border-green-500 bg-green-500/20' : 'border-white/5 bg-white/5'}`}
        >
          <div className="text-3xl mb-2">🌐</div>
          <div className="font-semibold text-sm">عامة</div>
          <div className="text-gray-400 text-xs">مفتوحة للجميع</div>
        </button>
        <button
          onClick={() => setIsPublic(false)}
          className={`p-4 rounded-2xl border-2 transition-all ${!isPublic ? 'border-purple-500 bg-purple-500/20' : 'border-white/5 bg-white/5'}`}
        >
          <div className="text-3xl mb-2">🔒</div>
          <div className="font-semibold text-sm">خاصة</div>
          <div className="text-gray-400 text-xs">للأصدقاء فقط</div>
        </button>
      </div>

      <button
        onClick={create}
        disabled={!selectedGame || loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-40"
      >
        {loading ? '⚙️ جاري الإنشاء...' : '🚀 إنشاء الغرفة'}
      </button>
    </div>
  )
}
