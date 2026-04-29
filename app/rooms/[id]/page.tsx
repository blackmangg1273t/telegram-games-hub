'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { GAME_TYPES, getRandomQuestions, checkAnswer, calculatePoints, Question } from '@/lib/gameData'

interface Member { telegram_id: number; score: number; is_ready: boolean; users?: { first_name: string; username: string } }
interface Room { id: string; code: string; game_type: string; status: string; is_public: boolean; host_telegram_id: number; current_round: number; total_rounds: number; max_players: number }

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useTelegram()
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQ, setCurrentQ] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<{ text: string; ok: boolean; points?: number } | null>(null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [scores, setScores] = useState<Record<number, number>>({})
  const [answered, setAnswered] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [roundNum, setRoundNum] = useState(0)
  const [isSolo, setIsSolo] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const roomId = params.id as string

  const fetchRoom = useCallback(async () => {
    const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single()
    setRoom(data); setLoading(false)
  }, [roomId])

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from('room_members').select('*, users(first_name, username)').eq('room_id', roomId)
    setMembers(data || [])
    const s: Record<number, number> = {}
    ;(data || []).forEach((m: Member) => { s[m.telegram_id] = m.score })
    setScores(s)
  }, [roomId])

  useEffect(() => {
    fetchRoom(); fetchMembers()
    const ch = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, p => setRoom(p.new as Room))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` }, fetchMembers)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [roomId, fetchRoom, fetchMembers])

  useEffect(() => {
    if (!user || !room) return
    const isMember = members.some(m => m.telegram_id === user.id)
    if (!isMember && members.length < room.max_players) {
      supabase.from('room_members').insert({ room_id: roomId, telegram_id: user.id }).then(() => fetchMembers())
    }
  }, [user, room, members, roomId, fetchMembers])

  // Init questions when playing starts
  useEffect(() => {
    if (room?.status === 'playing' && questions.length === 0) {
      const qs = getRandomQuestions(room.game_type, room.total_rounds)
      setQuestions(qs)
      setCurrentQ(qs[0])
      setRoundNum(0)
      setTimeLeft(15)
      setImgError(false)
    }
  }, [room?.status, room?.game_type, room?.total_rounds, questions.length])

  // Timer
  useEffect(() => {
    if (room?.status !== 'playing' || !currentQ) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          if (!answered) {
            setResult({ text: `⏰ انتهى الوقت! الإجابة: ${currentQ.name}`, ok: false })
            setTimeout(() => advanceRound(), 2000)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentQ?.id, room?.status])

  function advanceRound() {
    setAnswered(false)
    setAnswer('')
    setResult(null)
    setImgError(false)
    const nextIdx = roundNum + 1
    if (nextIdx < questions.length) {
      setCurrentQ(questions[nextIdx])
      setRoundNum(nextIdx)
      setTimeLeft(15)
      // sync for multiplayer
      if (!isSolo && user?.id === room?.host_telegram_id) {
        supabase.from('rooms').update({ current_round: nextIdx }).eq('id', roomId)
      }
    } else {
      endGame()
    }
  }

  async function endGame() {
    if (!isSolo && user?.id === room?.host_telegram_id) {
      await supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId)
    }
    if (isSolo) {
      // For solo, update stats
      if (user) {
        const myScore = scores[user.id] || 0
        const { data: userData } = await supabase.from('users').select('total_score, games_played, games_won').eq('telegram_id', user.id).single()
        if (userData) {
          await supabase.from('users').update({
            total_score: (userData.total_score || 0) + myScore,
            games_played: (userData.games_played || 0) + 1,
            games_won: (userData.games_won || 0) + 1,
          }).eq('telegram_id', user.id)
        }
        setRoom(r => r ? { ...r, status: 'finished' } : r)
      }
    }
  }

  async function submitAnswer() {
    if (!currentQ || !user || answered) return
    const isCorrect = checkAnswer(answer, currentQ)
    const points = isCorrect ? calculatePoints(timeLeft) : 0
    setAnswered(true)
    if (timerRef.current) clearInterval(timerRef.current)

    if (isCorrect) {
      setResult({ text: `✅ صحيح! +${points} نقطة 🎉`, ok: true, points })
      const newScore = (scores[user.id] || 0) + points
      setScores(s => ({ ...s, [user.id]: newScore }))
      await supabase.from('room_members').update({ score: newScore }).eq('room_id', roomId).eq('telegram_id', user.id)
    } else {
      setResult({ text: `❌ خطأ! الإجابة: ${currentQ.name}`, ok: false })
    }
    setTimeout(() => advanceRound(), 2200)
  }

  const myName = (m: Member) => m.users?.first_name || m.users?.username || 'لاعب'
  const gameInfo = GAME_TYPES.find(g => g.id === room?.game_type)
  const isHost = user?.id === room?.host_telegram_id
  const sortedMembers = [...members].sort((a, b) => (scores[b.telegram_id] || 0) - (scores[a.telegram_id] || 0))
  const isLogoGame = ['logo_guess', 'car_logo', 'brand_logo', 'phone_guess'].includes(room?.game_type || '')

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48 }}>⚙️</div>
      <div style={{ color: '#94a3b8' }}>جاري التحميل...</div>
    </div>
  )
  if (!room) return (
    <div style={{ padding: 24, textAlign: 'center', color: 'white', background: '#0f172a', minHeight: '100vh' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <div style={{ fontSize: 20, marginBottom: 16 }}>الغرفة غير موجودة</div>
      <button onClick={() => router.push('/')} style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: 12, padding: '12px 24px', cursor: 'pointer' }}>الرئيسية</button>
    </div>
  )

  // FINISHED
  if (room.status === 'finished') return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
      <h2 style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 8 }}>انتهت اللعبة!</h2>
      {isSolo && <div style={{ color: '#fbbf24', marginBottom: 16 }}>نقاطك: {scores[user?.id || 0] || 0} ⭐</div>}
      <div style={{ width: '100%', maxWidth: 380 }}>
        {sortedMembers.map((m, i) => (
          <div key={m.telegram_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, marginBottom: 8, background: i === 0 ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.05)', border: i === 0 ? '1px solid rgba(234,179,8,0.4)' : '1px solid transparent' }}>
            <span style={{ fontSize: 24 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
            <span style={{ flex: 1, fontWeight: 'bold' }}>{myName(m)}</span>
            <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{scores[m.telegram_id] || 0} ⭐</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 20, width: '100%', maxWidth: 380 }}>
        <button onClick={() => { setQuestions([]); setRoom(r => r ? { ...r, status: 'playing' } : r); setScores({}) }}
          style={{ flex: 1, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 'bold', cursor: 'pointer' }}>🔄 العب مجدداً</button>
        <button onClick={() => router.push('/')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 14, padding: '14px', cursor: 'pointer' }}>← الرئيسية</button>
      </div>
    </div>
  )

  // PLAYING - LOGO GAME
  if (room.status === 'playing' && isLogoGame) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', padding: 16, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>جولة {roundNum + 1} / {questions.length} {isSolo ? '🎮 منفرد' : ''}</div>
        <div style={{ fontSize: 22, fontWeight: 'bold', color: timeLeft <= 5 ? '#f87171' : timeLeft <= 10 ? '#fbbf24' : '#4ade80' }}>
          {timeLeft > 0 ? `${timeLeft}s ⏱️` : '⏰'}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#1e293b', borderRadius: 4, marginBottom: 20 }}>
        <div style={{ height: '100%', background: timeLeft <= 5 ? '#ef4444' : '#4f46e5', borderRadius: 4, width: `${(roundNum / questions.length) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Logo Image */}
      {currentQ && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 24, marginBottom: 16, width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', flexShrink: 0 }}>
            {!imgError ? (
              <img src={currentQ.image} alt="?" onError={() => setImgError(true)}
                style={{ maxWidth: 180, maxHeight: 180, objectFit: 'contain' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎯</div>
                <div style={{ fontSize: 12 }}>تلميح: {currentQ.hint}</div>
              </div>
            )}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>💡 {currentQ.hint}</div>

          {result ? (
            <div style={{ padding: '16px 24px', borderRadius: 18, textAlign: 'center', width: '100%', maxWidth: 340,
              background: result.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${result.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: result.ok ? '#4ade80' : '#f87171' }}>{result.text}</div>
              {result.ok && result.points && <div style={{ color: '#fbbf24', fontSize: 14, marginTop: 4 }}>إجمالي نقاطك: {scores[user?.id || 0] || 0} ⭐</div>}
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: 340 }}>
              <input value={answer} onChange={e => setAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !answered && submitAnswer()}
                placeholder="اكتب اسم الماركة..."
                autoFocus
                style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '14px 16px', fontSize: 17, textAlign: 'center', color: 'white', outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: 'Segoe UI, system-ui, sans-serif' }}
              />
              <button onClick={submitAnswer} disabled={!answer.trim()}
                style={{ width: '100%', background: answer.trim() ? '#4f46e5' : 'rgba(79,70,229,0.4)', color: 'white', border: 'none', borderRadius: 16, padding: '14px', fontWeight: 'bold', fontSize: 16, cursor: answer.trim() ? 'pointer' : 'not-allowed' }}>
                ✅ إجابتي
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live scores */}
      <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
        <div style={{ color: '#475569', fontSize: 11, marginBottom: 8 }}>النقاط المباشرة</div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
          {sortedMembers.map(m => (
            <div key={m.telegram_id} style={{ textAlign: 'center', minWidth: 56 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.telegram_id === user?.id ? '#4f46e5' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14, margin: '0 auto 4px' }}>
                {myName(m)[0]}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 56 }}>{myName(m).split(' ')[0]}</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#fbbf24' }}>{scores[m.telegram_id] || 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // PLAYING - TIC TAC TOE
  if (room.status === 'playing' && room.game_type === 'tic_tac_toe') return (
    <TicTacToe roomId={roomId} user={user} members={members} room={room} />
  )

  // WAITING LOBBY
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: '32px 16px 16px', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <button onClick={() => router.push('/')} style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', marginBottom: 20 }}>← رجوع</button>

      <div style={{ background: `linear-gradient(135deg,#4f46e5,#7c3aed)`, borderRadius: 24, padding: '24px 20px', marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 10 }}>{gameInfo?.emoji}</div>
        <h1 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>{gameInfo?.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: '6px 16px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 20, letterSpacing: 4 }}>{room.code}</div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{room.is_public ? '🌐 عامة' : '🔒 خاصة'}</span>
        </div>
      </div>

      {/* Solo play option for logo games */}
      {isLogoGame && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, marginBottom: 16 }}>
          <div style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>🎮 وضع اللعب</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setIsSolo(false)}
              style={{ flex: 1, padding: '8px', borderRadius: 10, border: `2px solid ${!isSolo ? '#4f46e5' : 'transparent'}`, background: !isSolo ? 'rgba(79,70,229,0.2)' : 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: '600' }}>
              👥 تعددي
            </button>
            <button onClick={() => setIsSolo(true)}
              style={{ flex: 1, padding: '8px', borderRadius: 10, border: `2px solid ${isSolo ? '#059669' : 'transparent'}`, background: isSolo ? 'rgba(5,150,105,0.2)' : 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: '600' }}>
              🎮 منفرد
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>اللاعبون ({members.length}/{room.max_players})</span>
        <button onClick={() => setShowInvite(!showInvite)}
          style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>📤 دعوة</button>
      </div>

      {showInvite && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 16, textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>شارك الكود مع أصدقائك:</p>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px', fontFamily: 'monospace', fontSize: 28, fontWeight: 'bold', letterSpacing: 8, color: 'white', marginBottom: 8 }}>{room.code}</div>
          <p style={{ color: '#64748b', fontSize: 11 }}>يدخلونه في قسم "دخول بكود"</p>
        </div>
      )}

      {members.map(m => (
        <div key={m.telegram_id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 }}>{myName(m)[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: 15 }}>{myName(m)}</div>
            {m.telegram_id === room.host_telegram_id && <div style={{ color: '#fbbf24', fontSize: 11 }}>👑 المضيف</div>}
          </div>
          <div style={{ color: '#4ade80', fontSize: 13 }}>✓</div>
        </div>
      ))}

      {members.length < 2 && !isSolo && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          في انتظار لاعب آخر...
        </div>
      )}

      {(isHost || isSolo) && (members.length >= 1 || isSolo) && (
        <button onClick={async () => {
          if (isSolo) {
            const qs = getRandomQuestions(room.game_type, room.total_rounds)
            setQuestions(qs); setCurrentQ(qs[0]); setRoundNum(0); setTimeLeft(15)
            setScores({ [user!.id]: 0 })
            setRoom(r => r ? { ...r, status: 'playing' } : r)
          } else {
            await supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId)
          }
        }}
          style={{ width: '100%', background: 'linear-gradient(135deg,#059669,#0d9488)', color: 'white', border: 'none', borderRadius: 16, padding: '16px', fontWeight: 'bold', fontSize: 18, cursor: 'pointer', marginTop: 16 }}>
          🚀 {isSolo ? 'ابدأ منفرداً!' : 'ابدأ اللعبة!'}
        </button>
      )}
      {!isHost && !isSolo && <div style={{ textAlign: 'center', color: '#64748b', padding: 16, fontSize: 13 }}>⏳ في انتظار المضيف...</div>}
    </div>
  )
}

function TicTacToe({ roomId, user, members, room }: { roomId: string; user: { id: number } | null; members: Member[]; room: Room }) {
  const router = useRouter()
  const [board, setBoard] = useState(Array(9).fill(null))
  const [isX, setIsX] = useState(true)
  const [winner, setWinner] = useState<string | null>(null)
  const players = members.slice(0, 2)
  const myIdx = players.findIndex(p => p.telegram_id === user?.id)
  const mySymbol = myIdx === 0 ? 'X' : 'O'
  const curSymbol = isX ? 'X' : 'O'

  function checkWinner(b: (string | null)[]) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for (const [a, bi, c] of lines) if (b[a] && b[a] === b[bi] && b[a] === b[c]) return b[a]
    return b.every(Boolean) ? 'draw' : null
  }

  function handleClick(i: number) {
    if (mySymbol !== curSymbol || board[i] || winner) return
    const nb = [...board]; nb[i] = mySymbol
    setBoard(nb); setIsX(!isX)
    const w = checkWinner(nb)
    if (w) { setWinner(w); supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId) }
  }

  const myName = (m: Member) => m.users?.first_name || m.users?.username || 'لاعب'

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>⭕ إكس أو ❌</h1>
      <div style={{ color: '#94a3b8', marginBottom: 24, fontSize: 15 }}>
        {winner ? (winner === 'draw' ? '🤝 تعادل!' : (winner === mySymbol ? '🏆 أنت فزت!' : '😢 خسرت!')) : (mySymbol === curSymbol ? '🟢 دورك' : '🔴 دور الخصم')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
        {board.map((cell, i) => (
          <button key={i} onClick={() => handleClick(i)}
            style={{ width: 88, height: 88, borderRadius: 16, fontSize: 40, fontWeight: 'bold', background: cell ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', color: cell === 'X' ? '#60a5fa' : '#f87171', cursor: 'pointer' }}>
            {cell}
          </button>
        ))}
      </div>
      {winner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 280 }}>
          <button onClick={() => { setBoard(Array(9).fill(null)); setIsX(true); setWinner(null) }}
            style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🔄 لعبة جديدة</button>
          <button onClick={() => router.push('/')} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 12, padding: '12px', cursor: 'pointer' }}>← الرئيسية</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
        {players.map((p, i) => (
          <div key={p.telegram_id} style={{ textAlign: 'center', opacity: curSymbol === (i === 0 ? 'X' : 'O') ? 1 : 0.4 }}>
            <div style={{ fontSize: 28, color: i === 0 ? '#60a5fa' : '#f87171', marginBottom: 4 }}>{i === 0 ? '❌' : '⭕'}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{myName(p)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
