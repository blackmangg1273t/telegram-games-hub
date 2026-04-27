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

  // Snake is single player - start directly
  if (gameType === 'snake') {
    return <SnakeGame />
  }

  if (!game) return <div className="p-4 text-center">لعبة غير موجودة</div>

  async function createRoom(isPublic: boolean) {
    if (!user || loading) return
    setLoading(true)
    
    // Ensure user exists
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
      max_players: game!.maxPlayers,
      total_rounds: 10,
    }).select().single()

    if (error || !room) { setLoading(false); return }

    await supabase.from('room_members').insert({
      room_id: room.id,
      telegram_id: user.id,
    })

    router.push(`/rooms/${room.id}`)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${game.color} p-8 pt-12 flex flex-col items-center text-center`}>
        <button onClick={() => router.back()} className="absolute top-4 right-4 text-white/70 text-2xl">←</button>
        <div className="text-7xl mb-4">{game.emoji}</div>
        <h1 className="text-3xl font-bold text-white mb-2">{game.name}</h1>
        <p className="text-white/80 text-lg">{game.description}</p>
        <div className="flex gap-4 mt-4 text-white/60 text-sm">
          <span>👥 حتى {game.maxPlayers} لاعبين</span>
          <span>⏱️ 10 جولات</span>
          <span>⚡ تنافسي</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-1 bg-gray-950 p-6 pt-8">
        <h2 className="text-xl font-bold mb-6 text-center">ابدأ اللعب</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => createRoom(true)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-2xl p-4 font-bold text-lg flex items-center gap-3 disabled:opacity-50"
          >
            <span className="text-3xl">🌐</span>
            <div className="text-right">
              <div>غرفة عامة</div>
              <div className="text-sm font-normal text-white/70">يمكن لأي شخص الانضمام</div>
            </div>
          </button>

          <button
            onClick={() => createRoom(false)}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4 font-bold text-lg flex items-center gap-3 disabled:opacity-50"
          >
            <span className="text-3xl">🔒</span>
            <div className="text-right">
              <div>غرفة خاصة</div>
              <div className="text-sm font-normal text-white/70">ادعُ أصدقاءك فقط</div>
            </div>
          </button>

          <button
            onClick={() => router.push('/rooms/join')}
            className="w-full bg-white/10 text-white rounded-2xl p-4 font-bold text-lg flex items-center gap-3"
          >
            <span className="text-3xl">🔑</span>
            <div className="text-right">
              <div>ادخل بكود</div>
              <div className="text-sm font-normal text-gray-400">لديك كود غرفة؟</div>
            </div>
          </button>
        </div>

        {loading && (
          <div className="text-center mt-6 text-gray-400">
            <div className="text-3xl animate-spin mb-2">⚙️</div>
            جاري إنشاء الغرفة...
          </div>
        )}

        {/* How to play */}
        <div className="mt-8 bg-white/5 rounded-2xl p-4">
          <h3 className="font-bold mb-3 text-gray-300">🎯 كيف تلعب؟</h3>
          {gameType === 'tic_tac_toe' ? (
            <div className="text-gray-400 text-sm space-y-2">
              <p>• أنت ضد لاعب آخر</p>
              <p>• تناوبا في وضع X أو O</p>
              <p>• من يكمل صف أو عمود أو قطر يفوز</p>
            </div>
          ) : (
            <div className="text-gray-400 text-sm space-y-2">
              <p>• تظهر صورة اللوجو أو الماركة</p>
              <p>• اكتب إجابتك بأسرع ما يمكن</p>
              <p>• كلما كنت أسرع كلما نلت نقاطاً أكثر</p>
              <p>• 10 جولات - أعلى مجموع يفوز</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Snake Game Component
function SnakeGame() {
  const router = useRouter()
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle')
  const [score, setScore] = useState(0)
  const [snake, setSnake] = useState([[10, 10]])
  const [food, setFood] = useState([15, 15])
  const [dir, setDir] = useState([0, 1])
  const [gameLoop, setGameLoop] = useState<ReturnType<typeof setInterval> | null>(null)

  const GRID = 20

  function startGame() {
    setSnake([[10, 10]])
    setFood([Math.floor(Math.random() * GRID), Math.floor(Math.random() * GRID)])
    setDir([0, 1])
    setScore(0)
    setGameState('playing')
    
    const loop = setInterval(() => {
      setSnake(prev => {
        const newHead = [(prev[0][0] + dir[0] + GRID) % GRID, (prev[0][1] + dir[1] + GRID) % GRID]
        if (prev.some(s => s[0] === newHead[0] && s[1] === newHead[1])) {
          clearInterval(loop)
          setGameState('dead')
          return prev
        }
        const newSnake = [newHead, ...prev]
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          setScore(s => s + 10)
          setFood([Math.floor(Math.random() * GRID), Math.floor(Math.random() * GRID)])
        } else {
          newSnake.pop()
        }
        return newSnake
      })
    }, 180)
    setGameLoop(loop)
  }

  function changeDir(newDir: number[]) {
    if (newDir[0] !== -dir[0] || newDir[1] !== -dir[1]) {
      setDir(newDir)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-950 p-4 pt-8">
      <button onClick={() => { if(gameLoop) clearInterval(gameLoop); router.back() }} className="self-start text-gray-400 text-xl mb-4">← رجوع</button>
      <div className="text-4xl mb-2">🐍</div>
      <h1 className="text-2xl font-bold mb-1">لعبة الثعبان</h1>
      <div className="text-yellow-400 font-bold text-xl mb-4">النقاط: {score}</div>

      <div className="border-2 border-green-500/30 rounded-xl overflow-hidden mb-6"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, 14px)`, gridTemplateRows: `repeat(${GRID}, 14px)` }}>
        {Array.from({ length: GRID * GRID }, (_, i) => {
          const row = Math.floor(i / GRID)
          const col = i % GRID
          const isSnake = snake.some(s => s[0] === row && s[1] === col)
          const isHead = snake[0]?.[0] === row && snake[0]?.[1] === col
          const isFood = food[0] === row && food[1] === col
          return (
            <div key={i} style={{ width: 14, height: 14 }}
              className={`${isHead ? 'bg-green-400 rounded-sm' : isSnake ? 'bg-green-600' : isFood ? 'bg-red-500 rounded-full' : 'bg-gray-900'}`}
            />
          )
        })}
      </div>

      {gameState !== 'playing' && (
        <button onClick={startGame} className="bg-green-600 text-white rounded-2xl px-8 py-3 font-bold text-lg mb-6">
          {gameState === 'dead' ? '🔄 العب مجدداً' : '▶️ ابدأ اللعبة'}
        </button>
      )}

      {gameState === 'dead' && <div className="text-red-400 font-bold text-xl mb-4">💀 انتهت اللعبة!</div>}

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2">
        <div />
        <button onClick={() => changeDir([-1, 0])} className="bg-white/10 rounded-xl p-3 text-2xl">⬆️</button>
        <div />
        <button onClick={() => changeDir([0, -1])} className="bg-white/10 rounded-xl p-3 text-2xl">⬅️</button>
        <button onClick={() => changeDir([1, 0])} className="bg-white/10 rounded-xl p-3 text-2xl">⬇️</button>
        <button onClick={() => changeDir([0, 1])} className="bg-white/10 rounded-xl p-3 text-2xl">➡️</button>
      </div>
    </div>
  )
}
