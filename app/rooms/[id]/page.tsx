'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { GAME_TYPES, getRandomQuestions, checkAnswer, calculatePoints, Question } from '@/lib/gameData'
import { getIslamicQuestions, type IslamicQuestion } from '@/lib/islamicQuestions'

interface Member { telegram_id: number; score: number; is_ready: boolean; users?: { first_name: string; username: string } }
interface Room { id: string; code: string; game_type: string; status: string; is_public: boolean; host_telegram_id: number; current_round: number; total_rounds: number; max_players: number }

// Image with multiple fallbacks
function LogoImage({ src, alt, size = 180 }: { src: string; alt: string; size?: number }) {
  const [imgSrc, setImgSrc] = useState(src)
  const [fallbackIndex, setFallbackIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  // Fallback chain: clearbit → logo.dev → unavatar → emoji placeholder
  const getFallbacks = (original: string) => {
    const domain = original.replace('https://logo.clearbit.com/', '')
    return [
      original,
      `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6BeA`,
      `https://unavatar.io/${domain}`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    ]
  }

  useEffect(() => {
    setImgSrc(src)
    setFallbackIndex(0)
    setFailed(false)
  }, [src])

  const handleError = () => {
    const fallbacks = getFallbacks(src)
    const next = fallbackIndex + 1
    if (next < fallbacks.length) {
      setFallbackIndex(next)
      setImgSrc(fallbacks[next])
    } else {
      setFailed(true)
    }
  }

  if (failed) {
    return (
      <div style={{ width: size, height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        <div style={{ fontSize: size * 0.3, marginBottom: 8 }}>🎯</div>
        <div style={{ fontSize: 11, textAlign: 'center' }}>خمّن من التلميح!</div>
      </div>
    )
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      style={{ maxWidth: size, maxHeight: size, objectFit: 'contain', transition: 'opacity 0.3s' }}
    />
  )
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useTelegram()
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [islamicQs, setIslamicQs] = useState<IslamicQuestion[]>([])
  const [currentQ, setCurrentQ] = useState<Question | null>(null)
  const [currentIQ, setCurrentIQ] = useState<IslamicQuestion | null>(null)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<{ text: string; ok: boolean; points?: number } | null>(null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [scores, setScores] = useState<Record<number, number>>({})
  const [answered, setAnswered] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [roundNum, setRoundNum] = useState(0)
  const [isSolo, setIsSolo] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const roomId = params.id as string

  const isIslamic = room?.game_type === 'islamic'
  const isLogoGame = ['logo_guess', 'car_logo', 'brand_logo', 'phone_guess'].includes(room?.game_type || '')

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

  // Init questions when game starts
  useEffect(() => {
    if (room?.status !== 'playing') return
    if (isIslamic && islamicQs.length === 0) {
      const qs = getIslamicQuestions(room.total_rounds || 10)
      setIslamicQs(qs); setCurrentIQ(qs[0]); setRoundNum(0); setTimeLeft(20)
    } else if (isLogoGame && questions.length === 0) {
      const qs = getRandomQuestions(room.game_type, room.total_rounds || 10)
      setQuestions(qs); setCurrentQ(qs[0]); setRoundNum(0); setTimeLeft(15)
    }
  }, [room?.status, room?.game_type, room?.total_rounds, questions.length, islamicQs.length])

  // Timer
  useEffect(() => {
    if (room?.status !== 'playing') return
    if (timerRef.current) clearInterval(timerRef.current)
    const maxTime = isIslamic ? 20 : 15
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          if (!answered) {
            const correctAnswer = isIslamic ? currentIQ?.choices[currentIQ.correct] : currentQ?.name
            setResult({ text: `⏰ انتهى الوقت! الإجابة: ${correctAnswer}`, ok: false })
            setTimeout(() => advanceRound(), 2200)
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentQ?.id, currentIQ?.id, room?.status, answered])

  function advanceRound() {
    setAnswered(false); setAnswer(''); setResult(null); setSelectedChoice(null)
    const nextIdx = roundNum + 1
    const total = isIslamic ? islamicQs.length : questions.length
    if (nextIdx < total) {
      if (isIslamic) setCurrentIQ(islamicQs[nextIdx])
      else setCurrentQ(questions[nextIdx])
      setRoundNum(nextIdx)
      setTimeLeft(isIslamic ? 20 : 15)
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
      if (user) {
        const myScore = scores[user.id] || 0
        const { data: ud } = await supabase.from('users').select('total_score,games_played,games_won,islamic_score').eq('telegram_id', user.id).single()
        if (ud) {
          const updates: Record<string, number> = {
            total_score: (ud.total_score || 0) + myScore,
            games_played: (ud.games_played || 0) + 1,
            games_won: (ud.games_won || 0) + 1,
          }
          if (isIslamic) updates.islamic_score = (ud.islamic_score || 0) + myScore
          await supabase.from('users').update(updates).eq('telegram_id', user.id)
        }
      }
      setRoom(r => r ? { ...r, status: 'finished' } : r)
    }
  }

  async function submitLogoAnswer() {
    if (!currentQ || !user || answered) return
    const isCorrect = checkAnswer(answer, currentQ)
    const pts = isCorrect ? calculatePoints(timeLeft) : 0
    setAnswered(true)
    if (timerRef.current) clearInterval(timerRef.current)
    if (isCorrect) {
      const newScore = (scores[user.id] || 0) + pts
      setResult({ text: `✅ صحيح! +${pts} نقطة 🎉`, ok: true, points: pts })
      setScores(s => ({ ...s, [user.id]: newScore }))
      await supabase.from('room_members').update({ score: newScore }).eq('room_id', roomId).eq('telegram_id', user.id)
    } else {
      setResult({ text: `❌ خطأ! الإجابة: ${currentQ.name}`, ok: false })
    }
    setTimeout(() => advanceRound(), 2200)
  }

  async function submitIslamicAnswer(idx: number) {
    if (!currentIQ || !user || answered) return
    setSelectedChoice(idx)
    setAnswered(true)
    if (timerRef.current) clearInterval(timerRef.current)
    const isCorrect = idx === currentIQ.correct
    const pts = isCorrect ? 100 + Math.max(0, timeLeft * 5) : 0
    if (isCorrect) {
      const newScore = (scores[user.id] || 0) + pts
      setResult({ text: `✅ صحيح! +${pts} نقطة`, ok: true, points: pts })
      setScores(s => ({ ...s, [user.id]: newScore }))
      await supabase.from('room_members').update({ score: newScore }).eq('room_id', roomId).eq('telegram_id', user.id)
    } else {
      setResult({ text: `❌ الإجابة الصحيحة: ${currentIQ.choices[currentIQ.correct]}`, ok: false })
    }
    setTimeout(() => advanceRound(), 2500)
  }

  const myName = (m: Member) => m.users?.first_name || m.users?.username || 'لاعب'
  const gameInfo = GAME_TYPES.find(g => g.id === room?.game_type)
  const isHost = user?.id === room?.host_telegram_id
  const sortedMembers = [...members].sort((a, b) => (scores[b.telegram_id] || 0) - (scores[a.telegram_id] || 0))
  const totalRounds = isIslamic ? islamicQs.length : questions.length

  const catColors: Record<string, string> = {
    'عقيدة': '#8b5cf6', 'قرآن': '#10b981', 'حديث': '#3b82f6',
    'سيرة': '#f59e0b', 'فقه': '#ef4444', 'تاريخ': '#6366f1', 'أخلاق': '#ec4899'
  }

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

  // ── FINISHED ──
  if (room.status === 'finished') return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
      <h2 style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 20 }}>انتهت اللعبة!</h2>
      {sortedMembers.map((m, i) => (
        <div key={m.telegram_id} style={{ width: '100%', maxWidth: 380, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, marginBottom: 8, background: i === 0 ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.05)', border: i === 0 ? '1px solid rgba(234,179,8,0.4)' : 'none' }}>
          <span style={{ fontSize: 24 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
          <span style={{ flex: 1, fontWeight: 'bold' }}>{myName(m)}</span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{scores[m.telegram_id] || 0} ⭐</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, width: '100%', maxWidth: 380 }}>
        <button onClick={() => { setQuestions([]); setIslamicQs([]); setScores({}); setRoom(r => r ? { ...r, status: 'playing' } : r) }}
          style={{ flex: 1, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 'bold', cursor: 'pointer' }}>🔄 مجدداً</button>
        <button onClick={() => router.push('/')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 14, padding: '14px', cursor: 'pointer' }}>← الرئيسية</button>
      </div>
    </div>
  )

  // ── PLAYING ISLAMIC ──
  if (room.status === 'playing' && isIslamic && currentIQ) {
    const catColor = catColors[currentIQ.category] || '#6366f1'
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', padding: 16, fontFamily: 'Segoe UI,system-ui,sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>سؤال {roundNum + 1}/{totalRounds} {isSolo ? '🎮 منفرد' : ''}</div>
          <div style={{ background: timeLeft <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: timeLeft <= 5 ? '#f87171' : '#4ade80', borderRadius: 20, padding: '4px 12px', fontWeight: 'bold' }}>⏱ {timeLeft}s</div>
        </div>
        <div style={{ height: 4, background: '#1e293b', borderRadius: 4, marginBottom: 10 }}>
          <div style={{ height: '100%', background: catColor, borderRadius: 4, width: `${(roundNum / totalRounds) * 100}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          <span>⭐ {scores[user?.id || 0] || 0}</span>
          <span style={{ background: `${catColor}22`, color: catColor, padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{currentIQ.category} • {currentIQ.difficulty}</span>
          <span>👥 {members.length}</span>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: '18px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: '600', lineHeight: 1.7, textAlign: 'center' }}>{currentIQ.question}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {currentIQ.choices.map((choice, idx) => {
            let bg = 'rgba(255,255,255,0.06)'
            let border = '1px solid rgba(255,255,255,0.1)'
            let color = 'white'
            if (answered) {
              if (idx === currentIQ.correct) { bg = 'rgba(16,185,129,0.2)'; border = '2px solid #10b981'; color = '#4ade80' }
              else if (idx === selectedChoice) { bg = 'rgba(239,68,68,0.2)'; border = '2px solid #ef4444'; color = '#f87171' }
            }
            return (
              <button key={idx} onClick={() => submitIslamicAnswer(idx)} disabled={answered}
                style={{ background: bg, border, color, borderRadius: 14, padding: '13px 14px', textAlign: 'right', fontSize: 14, cursor: answered ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 'bold', flexShrink: 0 }}>
                  {['أ', 'ب', 'ج', 'د'][idx]}
                </span>
                <span style={{ flex: 1 }}>{choice}</span>
                {answered && idx === currentIQ.correct && <span>✅</span>}
                {answered && idx === selectedChoice && idx !== currentIQ.correct && <span>❌</span>}
              </button>
            )
          })}
        </div>

        <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: timeLeft <= 5 ? '#ef4444' : catColor, width: `${(timeLeft / 20) * 100}%`, transition: 'width 1s linear' }} />
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {sortedMembers.map(m => (
            <div key={m.telegram_id} style={{ textAlign: 'center', minWidth: 52, flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.telegram_id === user?.id ? '#4f46e5' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13, margin: '0 auto 3px' }}>{myName(m)[0]}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{myName(m).split(' ')[0]}</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#fbbf24' }}>{scores[m.telegram_id] || 0}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── PLAYING LOGO GAME ──
  if (room.status === 'playing' && isLogoGame && currentQ) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', padding: 16, fontFamily: 'Segoe UI,system-ui,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>جولة {roundNum + 1}/{totalRounds} {isSolo ? '🎮 منفرد' : ''}</div>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: timeLeft <= 5 ? '#f87171' : '#4ade80' }}>{timeLeft}s ⏱️</div>
      </div>
      <div style={{ height: 4, background: '#1e293b', borderRadius: 4, marginBottom: 16 }}>
        <div style={{ height: '100%', background: '#4f46e5', borderRadius: 4, width: `${(roundNum / totalRounds) * 100}%` }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Logo image box with fallback chain */}
        <div style={{ background: 'white', borderRadius: 24, padding: 24, marginBottom: 14, width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', flexShrink: 0 }}>
          <LogoImage src={currentQ.image} alt={answered ? currentQ.name : '?'} size={180} />
        </div>

        <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 18 }}>💡 {currentQ.hint}</div>

        {result ? (
          <div style={{ padding: '16px 24px', borderRadius: 18, textAlign: 'center', width: '100%', maxWidth: 340,
            background: result.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${result.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
            <div style={{ fontSize: 17, fontWeight: 'bold', color: result.ok ? '#4ade80' : '#f87171' }}>{result.text}</div>
            {result.ok && <div style={{ color: '#fbbf24', fontSize: 13, marginTop: 4 }}>مجموعك: {scores[user?.id || 0] || 0} ⭐</div>}
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 340 }}>
            <input value={answer} onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !answered && answer.trim() && submitLogoAnswer()}
              placeholder="اكتب اسم الماركة..."
              autoFocus
              style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '14px 16px', fontSize: 17, textAlign: 'center', color: 'white', outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: 'Segoe UI,system-ui,sans-serif' }}
            />
            <button onClick={submitLogoAnswer} disabled={!answer.trim()}
              style={{ width: '100%', background: answer.trim() ? '#4f46e5' : 'rgba(79,70,229,0.4)', color: 'white', border: 'none', borderRadius: 16, padding: '14px', fontWeight: 'bold', fontSize: 16, cursor: answer.trim() ? 'pointer' : 'not-allowed' }}>
              ✅ إجابتي
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
        <div style={{ color: '#475569', fontSize: 11, marginBottom: 8 }}>النقاط المباشرة</div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
          {sortedMembers.map(m => (
            <div key={m.telegram_id} style={{ textAlign: 'center', minWidth: 56, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.telegram_id === user?.id ? '#4f46e5' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14, margin: '0 auto 4px' }}>{myName(m)[0]}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 56 }}>{myName(m).split(' ')[0]}</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#fbbf24' }}>{scores[m.telegram_id] || 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── TIC TAC TOE ──
  if (room.status === 'playing' && room.game_type === 'tic_tac_toe') return (
    <TicTacToe roomId={roomId} user={user} members={members} room={room} />
  )

  // ── WAITING LOBBY ──
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: '32px 16px 16px', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>
      <button onClick={() => router.push('/')} style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', marginBottom: 20 }}>← رجوع</button>

      <div style={{ background: `linear-gradient(135deg,#4f46e5,#7c3aed)`, borderRadius: 24, padding: '24px 20px', marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>{gameInfo?.emoji}</div>
        <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>{gameInfo?.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: '6px 16px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 20, letterSpacing: 4 }}>{room.code}</div>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{room.is_public ? '🌐 عامة' : '🔒 خاصة'}</span>
        </div>
      </div>

      {/* Solo mode toggle for logo & Islamic games */}
      {(isLogoGame || isIslamic) && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, marginBottom: 16 }}>
          <div style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>🎮 وضع اللعب</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setIsSolo(false)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `2px solid ${!isSolo ? '#4f46e5' : 'transparent'}`, background: !isSolo ? 'rgba(79,70,229,0.2)' : 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: '600' }}>
              👥 تعددي
            </button>
            <button onClick={() => setIsSolo(true)} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `2px solid ${isSolo ? '#059669' : 'transparent'}`, background: isSolo ? 'rgba(5,150,105,0.2)' : 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: 12, fontWeight: '600' }}>
              🎮 منفرد
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>اللاعبون ({members.length}/{room.max_players})</span>
        <button onClick={() => setShowInvite(!showInvite)} style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>📤 دعوة</button>
      </div>

      {showInvite && (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 16, textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>شارك الكود مع أصدقائك:</p>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '12px', fontFamily: 'monospace', fontSize: 28, fontWeight: 'bold', letterSpacing: 8, color: 'white', marginBottom: 6 }}>{room.code}</div>
        </div>
      )}

      {members.map(m => (
        <div key={m.telegram_id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 }}>{myName(m)[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600' }}>{myName(m)}</div>
            {m.telegram_id === room.host_telegram_id && <div style={{ color: '#fbbf24', fontSize: 11 }}>👑 المضيف</div>}
          </div>
          <div style={{ color: '#4ade80', fontSize: 13 }}>✓</div>
        </div>
      ))}

      {(isHost || isSolo) && (members.length >= 1 || isSolo) && (
        <button onClick={async () => {
          if (isSolo) {
            const qs = isIslamic ? [] : getRandomQuestions(room.game_type, room.total_rounds)
            const iqs = isIslamic ? getIslamicQuestions(room.total_rounds) : []
            setQuestions(qs); setIslamicQs(iqs)
            if (isIslamic) { setCurrentIQ(iqs[0]); setTimeLeft(20) }
            else { setCurrentQ(qs[0]); setTimeLeft(15) }
            setRoundNum(0); setScores({ [user!.id]: 0 })
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
  const myName = (m: Member) => m.users?.first_name || m.users?.username || 'لاعب'

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

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Segoe UI,system-ui,sans-serif' }}>
      <h1 style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 8 }}>⭕ إكس أو ❌</h1>
      <div style={{ color: '#94a3b8', marginBottom: 20, fontSize: 15 }}>
        {winner ? (winner === 'draw' ? '🤝 تعادل!' : (winner === mySymbol ? '🏆 فزت!' : '😢 خسرت!')) : (mySymbol === curSymbol ? '🟢 دورك' : '🔴 دور الخصم')}
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
        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 280 }}>
          <button onClick={() => { setBoard(Array(9).fill(null)); setIsX(true); setWinner(null) }} style={{ flex: 1, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🔄 مجدداً</button>
          <button onClick={() => router.push('/')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 12, padding: '12px', cursor: 'pointer' }}>← رجوع</button>
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
