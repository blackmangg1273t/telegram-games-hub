'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { GAME_TYPES, getRandomQuestions } from '@/lib/gameData'

interface Member {
  telegram_id: number
  score: number
  is_ready: boolean
  users?: { first_name: string; username: string }
}

interface Room {
  id: string
  code: string
  game_type: string
  status: string
  is_public: boolean
  host_telegram_id: number
  current_round: number
  total_rounds: number
  max_players: number
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useTelegram()
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState<{name:string;hint:string;emoji:string} | null>(null)
  const [answer, setAnswer] = useState('')
  const [roundResult, setRoundResult] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [questions, setQuestions] = useState<Array<{name:string;hint:string;emoji:string}>>([])
  const [scores, setScores] = useState<Record<number, number>>({})
  const [answered, setAnswered] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  const roomId = params.id as string

  const fetchRoom = useCallback(async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()
    setRoom(data)
    setLoading(false)
  }, [roomId])

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('room_members')
      .select('*, users(first_name, username)')
      .eq('room_id', roomId)
    setMembers(data || [])
    const s: Record<number, number> = {}
    ;(data || []).forEach((m: Member) => { s[m.telegram_id] = m.score })
    setScores(s)
  }, [roomId])

  useEffect(() => {
    fetchRoom()
    fetchMembers()

    const channel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
        setRoom(payload.new as Room)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` }, fetchMembers)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, fetchRoom, fetchMembers])

  // Join room if not member
  useEffect(() => {
    if (!user || !room) return
    const isMember = members.some(m => m.telegram_id === user.id)
    if (!isMember && members.length < room.max_players) {
      supabase.from('room_members').insert({ room_id: roomId, telegram_id: user.id })
        .then(() => fetchMembers())
    }
  }, [user, room, members, roomId, fetchMembers])

  // Game logic
  useEffect(() => {
    if (room?.status === 'playing' && questions.length === 0) {
      const qs = getRandomQuestions(room.game_type, room.total_rounds)
      setQuestions(qs)
      setCurrentQuestion(qs[0])
      setTimeLeft(15)
    }
  }, [room?.status, room?.game_type, room?.total_rounds, questions.length])

  useEffect(() => {
    if (room?.status !== 'playing' || !currentQuestion) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          if (!answered) setRoundResult('⏰ انتهى الوقت!')
          nextRound()
          return 15
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [currentQuestion, room?.status, answered])

  async function startGame() {
    if (!room || !user || user.id !== room.host_telegram_id) return
    await supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId)
  }

  async function submitAnswer() {
    if (!currentQuestion || !user || answered) return
    const isCorrect = answer.trim().toLowerCase() === currentQuestion.name.toLowerCase()
    const points = isCorrect ? Math.ceil(timeLeft * 10) : 0
    setAnswered(true)
    setRoundResult(isCorrect ? `✅ صحيح! +${points} نقطة` : `❌ خطأ! الإجابة: ${currentQuestion.name}`)
    
    if (isCorrect) {
      await supabase.from('room_members').update({ score: (scores[user.id] || 0) + points }).eq('room_id', roomId).eq('telegram_id', user.id)
      setScores(s => ({ ...s, [user.id]: (s[user.id] || 0) + points }))
    }
  }

  function nextRound() {
    const idx = (room?.current_round || 0) + 1
    setAnswered(false)
    setAnswer('')
    setRoundResult(null)
    if (idx < questions.length) {
      setCurrentQuestion(questions[idx])
      setTimeLeft(15)
      if (user?.id === room?.host_telegram_id) {
        supabase.from('rooms').update({ current_round: idx }).eq('id', roomId)
      }
    } else {
      // Game over
      if (user?.id === room?.host_telegram_id) {
        supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId)
        // Update user stats
        members.forEach(async m => {
          const isWinner = m.telegram_id === members.sort((a,b) => b.score - a.score)[0]?.telegram_id
          await supabase.from('users').update({
            games_played: supabase.rpc('increment', { x: 1 }),
            total_score: supabase.rpc('increment', { x: scores[m.telegram_id] || 0 }),
            ...(isWinner ? { games_won: supabase.rpc('increment', { x: 1 }) } : {})
          }).eq('telegram_id', m.telegram_id)
        })
      }
    }
  }

  const gameInfo = GAME_TYPES.find(g => g.id === room?.game_type)
  const isHost = user?.id === room?.host_telegram_id
  const sortedMembers = [...members].sort((a, b) => (scores[b.telegram_id] || 0) - (scores[a.telegram_id] || 0))

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-5xl animate-bounce">⚙️</div>
    </div>
  )

  if (!room) return (
    <div className="p-6 text-center">
      <div className="text-5xl mb-4">😕</div>
      <div className="text-xl mb-4">الغرفة غير موجودة</div>
      <button onClick={() => router.push('/')} className="bg-indigo-600 px-6 py-3 rounded-xl">الرئيسية</button>
    </div>
  )

  // ---- FINISHED STATE ----
  if (room.status === 'finished') {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold mb-6">انتهت اللعبة!</h2>
        {sortedMembers.map((m, i) => (
          <div key={m.telegram_id} className={`w-full flex items-center gap-3 p-3 rounded-xl mb-2 ${i === 0 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5'}`}>
            <span className="text-xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
            <span className="flex-1">{(m.users?.first_name || m.users?.username || '؟')}</span>
            <span className="text-yellow-400 font-bold">{scores[m.telegram_id] || 0} ⭐</span>
          </div>
        ))}
        <button onClick={() => router.push('/')} className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">العودة للرئيسية</button>
      </div>
    )
  }

  // ---- PLAYING STATE - LOGO GUESS ----
  if (room.status === 'playing' && room.game_type !== 'tic_tac_toe') {
    return (
      <div className="min-h-screen flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-400 text-sm">جولة {(room.current_round || 0) + 1}/{room.total_rounds}</div>
          <div className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-green-400'}`}>{timeLeft}s ⏱️</div>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-gray-800 rounded-full mb-6">
          <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${((room.current_round || 0) / room.total_rounds) * 100}%` }} />
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-white/10 rounded-3xl p-10 mb-6 text-center">
              <div className="text-8xl mb-4">{currentQuestion.emoji}</div>
              <div className="text-gray-400 text-sm">تلميح: {currentQuestion.hint}</div>
            </div>

            {roundResult ? (
              <div className={`text-xl font-bold mb-4 p-4 rounded-xl text-center ${roundResult.includes('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {roundResult}
                <button onClick={nextRound} className="block mt-3 text-sm text-white bg-indigo-600 px-4 py-2 rounded-xl mx-auto">التالي ←</button>
              </div>
            ) : (
              <div className="w-full">
                <input
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitAnswer()}
                  placeholder="اكتب إجابتك..."
                  className="w-full bg-white/10 rounded-2xl px-4 py-4 text-lg text-center outline-none border border-white/10 focus:border-indigo-500 mb-3"
                  autoFocus
                />
                <button onClick={submitAnswer} className="w-full bg-indigo-600 rounded-2xl py-4 font-bold text-lg">
                  ✅ إجابتي
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live scores */}
        <div className="mt-4">
          <div className="text-gray-500 text-xs mb-2">النقاط الحالية</div>
          {sortedMembers.slice(0, 3).map(m => (
            <div key={m.telegram_id} className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 flex-1">{m.users?.first_name || '؟'}</span>
              <span className="text-yellow-400 text-sm font-bold">{scores[m.telegram_id] || 0}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---- TIC TAC TOE ----
  if (room.status === 'playing' && room.game_type === 'tic_tac_toe') {
    return <TicTacToe roomId={roomId} user={user} members={members} room={room} />
  }

  // ---- WAITING LOBBY ----
  return (
    <div className="min-h-screen flex flex-col p-4 pt-8">
      <button onClick={() => router.push('/')} className="self-start text-gray-400 mb-6">← رجوع</button>

      <div className={`bg-gradient-to-br ${gameInfo?.color || 'from-indigo-600 to-purple-600'} rounded-3xl p-6 mb-6 text-center`}>
        <div className="text-6xl mb-3">{gameInfo?.emoji}</div>
        <h1 className="text-2xl font-bold">{gameInfo?.name}</h1>
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="bg-black/30 rounded-full px-4 py-1 text-sm font-mono font-bold tracking-wider">{room.code}</div>
          <span className="text-white/70 text-sm">{room.is_public ? '🌐 عامة' : '🔒 خاصة'}</span>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-300">اللاعبون ({members.length}/{room.max_players})</h2>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="bg-indigo-600/20 text-indigo-400 text-sm px-3 py-1 rounded-full"
          >
            📤 دعوة
          </button>
        </div>

        {showInvite && (
          <div className="bg-white/5 rounded-2xl p-4 mb-4 bounce-in">
            <p className="text-gray-300 text-sm mb-2">شارك الكود مع أصدقائك:</p>
            <div className="bg-black/30 rounded-xl p-3 text-center font-mono text-2xl font-bold tracking-widest text-white mb-3">{room.code}</div>
            <p className="text-gray-500 text-xs text-center">أو أرسل رابط الغرفة عبر تيليجرام</p>
          </div>
        )}

        {members.map(m => (
          <div key={m.telegram_id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold">
              {(m.users?.first_name || '?')[0]}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{m.users?.first_name || m.users?.username || 'لاعب'}</div>
              {m.telegram_id === room.host_telegram_id && (
                <div className="text-yellow-400 text-xs">👑 المضيف</div>
              )}
            </div>
            <div className="text-green-400 text-sm">✓ منضم</div>
          </div>
        ))}

        {members.length < 2 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            <div className="text-3xl mb-2">⏳</div>
            في انتظار المزيد من اللاعبين...
          </div>
        )}
      </div>

      {isHost && members.length >= 1 && (
        <button
          onClick={startGame}
          className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-2xl py-4 font-bold text-xl mt-4"
        >
          🚀 ابدأ اللعبة!
        </button>
      )}
      {!isHost && (
        <div className="text-center text-gray-500 py-4">في انتظار المضيف ليبدأ اللعبة...</div>
      )}
    </div>
  )
}

// TicTacToe Component
function TicTacToe({ roomId, user, members, room }: {
  roomId: string
  user: { id: number } | null
  members: Member[]
  room: Room
}) {
  const router = useRouter()
  const [board, setBoard] = useState(Array(9).fill(null))
  const [isX, setIsX] = useState(true)
  const [winner, setWinner] = useState<string | null>(null)

  const players = members.slice(0, 2)
  const myIndex = players.findIndex(p => p.telegram_id === user?.id)
  const mySymbol = myIndex === 0 ? 'X' : 'O'
  const currentSymbol = isX ? 'X' : 'O'
  const isMyTurn = mySymbol === currentSymbol

  function checkWinner(b: (string|null)[]) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for (const [a,bi,c] of lines) {
      if (b[a] && b[a] === b[bi] && b[a] === b[c]) return b[a]
    }
    return b.every(Boolean) ? 'draw' : null
  }

  function handleClick(i: number) {
    if (!isMyTurn || board[i] || winner) return
    const newBoard = [...board]
    newBoard[i] = mySymbol
    setBoard(newBoard)
    setIsX(!isX)
    const w = checkWinner(newBoard)
    if (w) {
      setWinner(w)
      supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-2">⭕❌ إكس أو</h1>
      <div className="text-gray-400 mb-6">
        {winner ? (winner === 'draw' ? '🤝 تعادل!' : `${winner === mySymbol ? '🏆 أنت فزت!' : '😢 خسرت!'}`) : (isMyTurn ? '🟢 دورك' : '🔴 دور الخصم')}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className={`w-24 h-24 rounded-2xl text-5xl font-bold transition-all ${
              cell ? 'bg-white/10' : 'bg-white/5 hover:bg-white/15 active:scale-95'
            } ${cell === 'X' ? 'text-blue-400' : 'text-red-400'}`}
          >
            {cell}
          </button>
        ))}
      </div>

      {winner && (
        <div className="space-y-3">
          <button onClick={() => { setBoard(Array(9).fill(null)); setIsX(true); setWinner(null) }}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold">🔄 لعبة جديدة</button>
          <button onClick={() => router.push('/')} className="w-full bg-white/10 text-white rounded-xl py-3">← الرئيسية</button>
        </div>
      )}

      <div className="mt-6 flex gap-4">
        {players.map((p, i) => (
          <div key={p.telegram_id} className={`text-center ${currentSymbol === (i === 0 ? 'X' : 'O') ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`text-2xl mb-1 ${i === 0 ? 'text-blue-400' : 'text-red-400'}`}>{i === 0 ? '❌' : '⭕'}</div>
            <div className="text-xs text-gray-400">{p.users?.first_name || 'لاعب'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
