'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { GAME_TYPES, getRandomQuestions, checkAnswer, calculatePoints, Question } from '@/lib/gameData'
import { getIslamicQuestions, type IslamicQuestion } from '@/lib/islamicQuestions'
import { useGameSync } from '@/lib/useGameSync'

interface Member {
  telegram_id: number; score: number; is_ready: boolean
  users?: { first_name: string; username: string }
}
interface Room {
  id: string; code: string; game_type: string; status: string
  is_public: boolean; host_telegram_id: number; current_round: number
  total_rounds: number; max_players: number
  game_data?: Record<string, unknown>
  host_name?: string
  expires_at?: string
}

const GRACE_PERIOD_SECONDS = 180 // 3 دقائق
const EXPIRY_SECONDS = 300       // 5 دقائق

// ── Logo image with fallback ──────────────────────────────────────────────
function LogoImage({ src, alt, size = 180 }: { src: string; alt: string; size?: number }) {
  const [imgSrc, setImgSrc] = useState(src)
  const [fi, setFi] = useState(0)
  const [failed, setFailed] = useState(false)
  const getFallbacks = (o: string) => {
    const d = o.replace('https://logo.clearbit.com/', '')
    return [o, `https://img.logo.dev/${d}?token=pk_X-1ZO13GSgeOoUrIuJ6BeA`, `https://unavatar.io/${d}`, `https://www.google.com/s2/favicons?domain=${d}&sz=256`]
  }
  useEffect(() => { setImgSrc(src); setFi(0); setFailed(false) }, [src])
  const onErr = () => {
    const fb = getFallbacks(src); const n = fi + 1
    if (n < fb.length) { setFi(n); setImgSrc(fb[n]) } else setFailed(true)
  }
  if (failed) return (
    <div style={{ width: size, height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
      <div style={{ fontSize: size * 0.3 }}>🎯</div>
      <div style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }}>خمّن من التلميح!</div>
    </div>
  )
  return <img src={imgSrc} alt={alt} onError={onErr} style={{ maxWidth: size, maxHeight: size, objectFit: 'contain' }} />
}

// ── Live member count dots ────────────────────────────────────────────────
function MemberDots({ count, max }: { count: number; max: number }) {
  const color = count >= max ? '#4ade80' : count > 1 ? '#fbbf24' : '#94a3b8'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 12px' }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{
            width: i < count ? 10 : 8, height: i < count ? 10 : 8,
            borderRadius: '50%', background: i < count ? color : 'rgba(255,255,255,0.12)',
            transition: 'all 0.3s', boxShadow: i < count ? `0 0 6px ${color}88` : 'none',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 13, color, fontWeight: 'bold' }}>{count}</span>
      <span style={{ fontSize: 11, color: '#64748b' }}>/ {max}</span>
    </div>
  )
}

// ── Expiry countdown banner (5-min grace for code sharing) ───────────────
function ExpiryBanner({ expiresAt, onExpired }: { expiresAt: string; onExpired: () => void }) {
  const [secs, setSecs] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setSecs(diff)
      if (diff <= 0) onExpired()
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpired])

  if (dismissed || secs <= 0) return null
  const mins = Math.floor(secs / 60)
  const s = secs % 60
  const urgent = secs <= 60
  const pct = (secs / EXPIRY_SECONDS) * 100

  return (
    <div style={{
      background: urgent ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)',
      border: `1px solid ${urgent ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.3)'}`,
      borderRadius: 16, padding: '12px 14px', marginBottom: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>{urgent ? '⚠️' : '⏳'}</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 13, color: urgent ? '#f87171' : '#fbbf24', marginBottom: 3 }}>
              {urgent ? 'الغرفة ستُحذف خلال دقيقة!' : 'مهلة مشاركة الكود'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
              اضغط <strong style={{ color: 'white' }}>📋 نسخ</strong> وأرسل الكود لصديقك قبل انتهاء الوقت.
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 22, color: urgent ? '#f87171' : '#fbbf24', lineHeight: 1 }}>
            {mins}:{s.toString().padStart(2, '0')}
          </div>
          <button onClick={() => setDismissed(true)}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 11, marginTop: 4 }}>
            إخفاء
          </button>
        </div>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: urgent ? '#ef4444' : '#f59e0b', borderRadius: 4, transition: 'width 1s linear' }} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useTelegram()
  const roomId = params.id as string

  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [roomDeleted, setRoomDeleted] = useState(false)
  const [copied, setCopied] = useState(false)

  const [gameStarted, setGameStarted] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [islamicQs, setIslamicQs] = useState<IslamicQuestion[]>([])
  const [roundNum, setRoundNum] = useState(0)
  const [currentQ, setCurrentQ] = useState<Question | null>(null)
  const [currentIQ, setCurrentIQ] = useState<IslamicQuestion | null>(null)
  const [scores, setScores] = useState<Record<number, number>>({})
  const [gameFinished, setGameFinished] = useState(false)

  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<{ text: string; ok: boolean } | null>(null)
  const [answered, setAnswered] = useState(false)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(15)
  const [isSolo, setIsSolo] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const questionsRef = useRef<Question[]>([])
  const islamicQsRef = useRef<IslamicQuestion[]>([])

  const isIslamic = room?.game_type === 'islamic'
  const isLogoGame = ['logo_guess', 'car_logo', 'brand_logo', 'phone_guess'].includes(room?.game_type || '')
  const isTicTacToe = room?.game_type === 'tic_tac_toe'
  const isHost = user?.id === room?.host_telegram_id

  const [hostAway, setHostAway] = useState(false)
  const [graceSeconds, setGraceSeconds] = useState(0)
  const graceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Delete room ───────────────────────────────────────────────────────
  const deleteRoom = useCallback(async () => {
    await supabase.from('room_members').delete().eq('room_id', roomId)
    await supabase.from('rooms').delete().eq('id', roomId)
    setRoomDeleted(true)
  }, [roomId])

  // ── sendBeacon delete (reliable on tab/browser close) ─────────────────
  useEffect(() => {
    if (!isHost || !room) return

    const sendBeaconDelete = () => {
      const body = JSON.stringify({ room_id: roomId })
      // Try sendBeacon for reliability on tab close
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/rooms/delete', new Blob([body], { type: 'application/json' }))
      }
    }

    window.addEventListener('beforeunload', sendBeaconDelete)
    window.addEventListener('pagehide', sendBeaconDelete)

    return () => {
      window.removeEventListener('beforeunload', sendBeaconDelete)
      window.removeEventListener('pagehide', sendBeaconDelete)
    }
  }, [isHost, room, roomId])

  // ── Leave handler ─────────────────────────────────────────────────────
  const handleLeave = useCallback(async () => {
    if (!user) return
    // Remove beforeunload listener before programmatic navigation
    if (isHost) {
      await deleteRoom()
    } else {
      await supabase.from('room_members').delete().eq('room_id', roomId).eq('telegram_id', user.id)
    }
    router.push('/')
  }, [user, isHost, roomId, deleteRoom, router])

  // ── Heartbeat ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const beat = () => {
      supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('telegram_id', user.id).then()
    }
    beat()
    const id = setInterval(beat, 30000)
    return () => clearInterval(id)
  }, [user])

  // ── Visibility change: grace period ──────────────────────────────────
  useEffect(() => {
    if (!isHost || !room) return

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setHostAway(true)
        setGraceSeconds(GRACE_PERIOD_SECONDS)
        if (graceTimerRef.current) clearInterval(graceTimerRef.current)
        graceTimerRef.current = setInterval(() => {
          setGraceSeconds(prev => {
            if (prev <= 1) {
              if (graceTimerRef.current) clearInterval(graceTimerRef.current)
              deleteRoom()
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setHostAway(false)
        if (graceTimerRef.current) clearInterval(graceTimerRef.current)
        setGraceSeconds(0)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (graceTimerRef.current) clearInterval(graceTimerRef.current)
    }
  }, [isHost, room, deleteRoom])

  // ── Detect host left via realtime ─────────────────────────────────────
  useEffect(() => {
    if (!room || !user) return
    if (room.status === 'waiting' && members.length > 0) {
      const hostPresent = members.some(m => m.telegram_id === room.host_telegram_id)
      if (!hostPresent) deleteRoom()
    }
    if (members.length === 0 && room.status === 'waiting') deleteRoom()
  }, [members, room, user, deleteRoom])

  // ── Copy code ─────────────────────────────────────────────────────────
  const copyCode = useCallback(() => {
    if (!room?.code) return
    navigator.clipboard.writeText(room.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [room?.code])

  // ── Game sync ─────────────────────────────────────────────────────────
  const { broadcastEvent } = useGameSync({
    roomId, userId: user?.id || 0,
    onEvent: useCallback((event) => {
      if (event.type === 'GAME_START') {
        const { questions: qs, islamicQs: iqs, roundNum: rn } = event.payload as {
          questions: Question[]; islamicQs: IslamicQuestion[]; roundNum: number
        }
        questionsRef.current = qs || []; islamicQsRef.current = iqs || []
        setQuestions(qs || []); setIslamicQs(iqs || [])
        setRoundNum(rn || 0); setCurrentQ(qs?.[rn] || null); setCurrentIQ(iqs?.[rn] || null)
        setGameStarted(true); setGameFinished(false)
        setAnswered(false); setAnswer(''); setResult(null); setSelectedChoice(null)
        setTimeLeft(iqs?.length > 0 ? 20 : 15); setScores({})
      } else if (event.type === 'ROUND_ADVANCE') {
        const { nextIdx } = event.payload as { nextIdx: number }
        const total = islamicQsRef.current.length > 0 ? islamicQsRef.current.length : questionsRef.current.length
        if (nextIdx >= total) { setGameFinished(true); setGameStarted(false) }
        else {
          setRoundNum(nextIdx)
          setCurrentQ(questionsRef.current[nextIdx] || null)
          setCurrentIQ(islamicQsRef.current[nextIdx] || null)
          setAnswered(false); setAnswer(''); setResult(null); setSelectedChoice(null)
          setTimeLeft(islamicQsRef.current.length > 0 ? 20 : 15)
        }
      } else if (event.type === 'SCORE_UPDATE') {
        const { userId: uid, newScore } = event.payload as { userId: number; newScore: number }
        setScores(s => ({ ...s, [uid]: newScore }))
      }
    }, [])
  })

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchRoom = useCallback(async () => {
    const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single()
    if (data) setRoom(data); else setRoomDeleted(true)
    setLoading(false)
  }, [roomId])

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from('room_members')
      .select('*, users(first_name, username)').eq('room_id', roomId)
    if (data) {
      setMembers(data)
      const s: Record<number, number> = {}
      data.forEach((m: Member) => { s[m.telegram_id] = m.score || 0 })
      setScores(prev => ({ ...s, ...prev }))
    }
  }, [roomId])

  useEffect(() => {
    fetchRoom(); fetchMembers()
    const ch = supabase.channel(`room_watch:${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        p => { if (p.new) setRoom(p.new as Room) })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => setRoomDeleted(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
        fetchMembers)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [roomId, fetchRoom, fetchMembers])

  // ── Auto-join ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !room) return
    const already = members.some(m => m.telegram_id === user.id)
    if (!already && members.length < room.max_players) {
      supabase.from('room_members')
        .insert({ room_id: roomId, telegram_id: user.id })
        .then(() => fetchMembers())
    }
  }, [user, room, members, roomId, fetchMembers])

  // ── Timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameStarted || gameFinished) return
    if (timerRef.current) clearInterval(timerRef.current)
    const max = isIslamic ? 20 : 15
    setTimeLeft(max)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); if (!answered) handleTimeout(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNum, gameStarted, gameFinished])

  const handleTimeout = useCallback(() => {
    if (answered) return
    setAnswered(true)
    const ans = isIslamic ? currentIQ?.choices[currentIQ.correct] : currentQ?.name
    setResult({ text: `⏰ انتهى الوقت! الإجابة: ${ans}`, ok: false })
    setTimeout(() => advance(), 2200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, isIslamic, currentIQ, currentQ])

  const advance = useCallback(() => {
    if (isSolo) {
      const next = roundNum + 1
      const total = isIslamic ? islamicQsRef.current.length : questionsRef.current.length
      if (next >= total) { setGameFinished(true); setGameStarted(false) }
      else {
        setRoundNum(next); setCurrentQ(questionsRef.current[next] || null); setCurrentIQ(islamicQsRef.current[next] || null)
        setAnswered(false); setAnswer(''); setResult(null); setSelectedChoice(null)
        setTimeLeft(isIslamic ? 20 : 15)
      }
    } else if (isHost) {
      const next = roundNum + 1
      broadcastEvent('ROUND_ADVANCE', { nextIdx: next })
      const total = isIslamic ? islamicQsRef.current.length : questionsRef.current.length
      if (next >= total) { setGameFinished(true); setGameStarted(false) }
      else {
        setRoundNum(next); setCurrentQ(questionsRef.current[next] || null); setCurrentIQ(islamicQsRef.current[next] || null)
        setAnswered(false); setAnswer(''); setResult(null); setSelectedChoice(null)
        setTimeLeft(isIslamic ? 20 : 15)
      }
    } else { setAnswered(false); setAnswer(''); setResult(null); setSelectedChoice(null) }
  }, [isSolo, isHost, roundNum, isIslamic, broadcastEvent])

  const startGame = useCallback(async () => {
    const qs = isLogoGame ? getRandomQuestions(room!.game_type, room!.total_rounds || 10) : []
    const iqs = isIslamic ? getIslamicQuestions(room!.total_rounds || 15) : []
    questionsRef.current = qs; islamicQsRef.current = iqs
    if (isSolo) {
      setQuestions(qs); setIslamicQs(iqs)
      setCurrentQ(qs[0] || null); setCurrentIQ(iqs[0] || null)
      setRoundNum(0); setScores({ [user!.id]: 0 })
      setGameStarted(true); setGameFinished(false)
      setAnswered(false); setAnswer(''); setResult(null)
      setTimeLeft(isIslamic ? 20 : 15)
    } else {
      const gd = { questions: qs, islamicQs: iqs, roundNum: 0 }
      await supabase.from('rooms').update({ status: 'playing', game_data: gd, current_round: 0 }).eq('id', roomId)
      await broadcastEvent('GAME_START', gd)
      setQuestions(qs); setIslamicQs(iqs)
      setCurrentQ(qs[0] || null); setCurrentIQ(iqs[0] || null)
      setRoundNum(0); setGameStarted(true); setGameFinished(false)
      setAnswered(false); setAnswer(''); setResult(null); setTimeLeft(isIslamic ? 20 : 15); setScores({})
    }
  }, [room, isLogoGame, isIslamic, isSolo, user, roomId, broadcastEvent])

  const submitLogo = useCallback(async () => {
    if (!currentQ || !user || answered) return
    if (timerRef.current) clearInterval(timerRef.current)
    setAnswered(true)
    const ok = checkAnswer(answer, currentQ)
    const pts = ok ? calculatePoints(timeLeft) : 0
    if (ok) {
      const ns = (scores[user.id] || 0) + pts
      setResult({ text: `✅ صحيح! +${pts} نقطة 🎉`, ok: true })
      setScores(s => ({ ...s, [user.id]: ns }))
      await supabase.from('room_members').update({ score: ns }).eq('room_id', roomId).eq('telegram_id', user.id)
      if (!isSolo) await broadcastEvent('SCORE_UPDATE', { userId: user.id, newScore: ns })
    } else { setResult({ text: `❌ خطأ! الإجابة: ${currentQ.name}`, ok: false }) }
    setTimeout(() => advance(), 2200)
  }, [currentQ, user, answered, answer, timeLeft, scores, roomId, isSolo, broadcastEvent, advance])

  const submitIslamic = useCallback(async (idx: number) => {
    if (!currentIQ || !user || answered) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSelectedChoice(idx); setAnswered(true)
    const ok = idx === currentIQ.correct
    const pts = ok ? 100 + Math.max(0, timeLeft * 5) : 0
    if (ok) {
      const ns = (scores[user.id] || 0) + pts
      setResult({ text: `✅ صحيح! +${pts} نقطة`, ok: true })
      setScores(s => ({ ...s, [user.id]: ns }))
      await supabase.from('room_members').update({ score: ns }).eq('room_id', roomId).eq('telegram_id', user.id)
      if (!isSolo) await broadcastEvent('SCORE_UPDATE', { userId: user.id, newScore: ns })
    } else { setResult({ text: `❌ الإجابة: ${currentIQ.choices[currentIQ.correct]}`, ok: false }) }
    setTimeout(() => advance(), 2500)
  }, [currentIQ, user, answered, timeLeft, scores, roomId, isSolo, broadcastEvent, advance])

  const restart = useCallback(async () => {
    setGameFinished(false); setGameStarted(false)
    setQuestions([]); setIslamicQs([]); setScores({})
    setRoundNum(0); setCurrentQ(null); setCurrentIQ(null)
    questionsRef.current = []; islamicQsRef.current = []
    if (!isSolo) await supabase.from('rooms').update({ status: 'waiting', current_round: 0 }).eq('id', roomId)
  }, [isSolo, roomId])

  const myName = (m: Member) => m.users?.first_name || m.users?.username || 'لاعب'
  const gameInfo = GAME_TYPES.find(g => g.id === room?.game_type)
  const sorted = [...members].sort((a, b) => (scores[b.telegram_id] || 0) - (scores[a.telegram_id] || 0))
  const totalRounds = isIslamic ? (islamicQsRef.current.length || 15) : (questionsRef.current.length || 10)
  const hostDisplayName = room
    ? (members.find(m => m.telegram_id === room.host_telegram_id)?.users?.first_name || room.host_name || 'المضيف')
    : 'المضيف'
  const catColors: Record<string, string> = {
    'عقيدة': '#8b5cf6', 'قرآن': '#10b981', 'حديث': '#3b82f6',
    'سيرة': '#f59e0b', 'فقه': '#ef4444', 'تاريخ': '#6366f1', 'أخلاق': '#ec4899'
  }

  // ── Room deleted ──────────────────────────────────────────────────────
  if (roomDeleted) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'Segoe UI,system-ui,sans-serif', padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🚪</div>
      <h2 style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>الغرفة لم تعد موجودة</h2>
      <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28, lineHeight: 1.8, maxWidth: 300 }}>
        غادر المضيف الغرفة أو انتهت مهلة الـ 5 دقائق،<br />لذلك تم حذفها تلقائياً.
      </p>
      <button onClick={() => router.push('/')}
        style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', borderRadius: 16, padding: '14px 36px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
        🏠 العودة للرئيسية
      </button>
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48 }}>⚙️</div>
      <div style={{ color: '#94a3b8' }}>جاري التحميل...</div>
    </div>
  )

  if (!room) return null

  // ── TicTacToe ──────────────────────────────────────────────────────────
  if ((gameStarted || room.status === 'playing') && isTicTacToe)
    return <TicTacToe roomId={roomId} user={user} members={members} room={room} isSolo={isSolo} onBack={restart} />

  // ── Finished ───────────────────────────────────────────────────────────
  if (gameFinished) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>
      <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
      <h2 style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 20 }}>انتهت اللعبة!</h2>
      {sorted.map((m, i) => (
        <div key={m.telegram_id} style={{ width: '100%', maxWidth: 380, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, marginBottom: 8, background: i === 0 ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.05)', border: i === 0 ? '1px solid rgba(234,179,8,0.4)' : 'none' }}>
          <span style={{ fontSize: 24 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
          <span style={{ flex: 1, fontWeight: 'bold' }}>{myName(m)}</span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{scores[m.telegram_id] || 0} ⭐</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, width: '100%', maxWidth: 380 }}>
        <button onClick={restart} style={{ flex: 1, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 'bold', cursor: 'pointer' }}>🔄 مجدداً</button>
        <button onClick={() => router.push('/')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 14, padding: '14px', cursor: 'pointer' }}>← الرئيسية</button>
      </div>
    </div>
  )

  // ── Playing Islamic ────────────────────────────────────────────────────
  if (gameStarted && isIslamic && currentIQ) {
    const cc = catColors[currentIQ.category] || '#6366f1'
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', padding: 16, fontFamily: 'Segoe UI,system-ui,sans-serif' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>سؤال {roundNum + 1}/{totalRounds}</div>
          <div style={{ background: timeLeft <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: timeLeft <= 5 ? '#f87171' : '#4ade80', borderRadius: 20, padding: '4px 12px', fontWeight: 'bold' }}>⏱ {timeLeft}s</div>
        </div>
        <div style={{ height: 4, background: '#1e293b', borderRadius: 4, marginBottom: 10 }}>
          <div style={{ height: '100%', background: cc, borderRadius: 4, width: `${(roundNum / totalRounds) * 100}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          <span>⭐ {scores[user?.id || 0] || 0}</span>
          <span style={{ background: `${cc}22`, color: cc, padding: '2px 8px', borderRadius: 10 }}>{currentIQ.category} • {currentIQ.difficulty}</span>
          <span>👥 {members.length}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: '18px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: '600', lineHeight: 1.7, textAlign: 'center' }}>{currentIQ.question}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {currentIQ.choices.map((choice, idx) => {
            let bg = 'rgba(255,255,255,0.06)', border = '1px solid rgba(255,255,255,0.1)', color = 'white'
            if (answered) {
              if (idx === currentIQ.correct) { bg = 'rgba(16,185,129,0.2)'; border = '2px solid #10b981'; color = '#4ade80' }
              else if (idx === selectedChoice) { bg = 'rgba(239,68,68,0.2)'; border = '2px solid #ef4444'; color = '#f87171' }
            }
            return (
              <button key={idx} onClick={() => submitIslamic(idx)} disabled={answered}
                style={{ background: bg, border, color, borderRadius: 14, padding: '13px 14px', textAlign: 'right', fontSize: 14, cursor: answered ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 'bold', flexShrink: 0 }}>
                  {['أ','ب','ج','د'][idx]}
                </span>
                <span style={{ flex: 1 }}>{choice}</span>
                {answered && idx === currentIQ.correct && <span>✅</span>}
                {answered && idx === selectedChoice && idx !== currentIQ.correct && <span>❌</span>}
              </button>
            )
          })}
        </div>
        <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: timeLeft <= 5 ? '#ef4444' : cc, width: `${(timeLeft / 20) * 100}%`, transition: 'width 1s linear' }} />
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {sorted.map(m => (
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

  // ── Playing Logo ───────────────────────────────────────────────────────
  if (gameStarted && isLogoGame && currentQ) return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', padding: 16, fontFamily: 'Segoe UI,system-ui,sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: '#94a3b8', fontSize: 13 }}>جولة {roundNum + 1}/{totalRounds}</div>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: timeLeft <= 5 ? '#f87171' : '#4ade80' }}>{timeLeft}s ⏱️</div>
      </div>
      <div style={{ height: 4, background: '#1e293b', borderRadius: 4, marginBottom: 16 }}>
        <div style={{ height: '100%', background: '#4f46e5', borderRadius: 4, width: `${(roundNum / totalRounds) * 100}%` }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: 24, marginBottom: 14, width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', flexShrink: 0 }}>
          <LogoImage src={currentQ.image} alt={answered ? currentQ.name : '?'} size={180} />
        </div>
        <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 18 }}>💡 {currentQ.hint}</div>
        {result ? (
          <div style={{ padding: '16px 24px', borderRadius: 18, textAlign: 'center', width: '100%', maxWidth: 340, background: result.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${result.ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
            <div style={{ fontSize: 17, fontWeight: 'bold', color: result.ok ? '#4ade80' : '#f87171' }}>{result.text}</div>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 340 }}>
            <input value={answer} onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !answered && answer.trim() && submitLogo()}
              placeholder="اكتب اسم الماركة..." autoFocus
              style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '14px 16px', fontSize: 17, textAlign: 'center', color: 'white', outline: 'none', marginBottom: 10, boxSizing: 'border-box', fontFamily: 'Segoe UI,system-ui,sans-serif' }} />
            <button onClick={submitLogo} disabled={!answer.trim()}
              style={{ width: '100%', background: answer.trim() ? '#4f46e5' : 'rgba(79,70,229,0.4)', color: 'white', border: 'none', borderRadius: 16, padding: '14px', fontWeight: 'bold', fontSize: 16, cursor: answer.trim() ? 'pointer' : 'not-allowed' }}>
              ✅ إجابتي
            </button>
          </div>
        )}
      </div>
      <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }}>
          {sorted.map(m => (
            <div key={m.telegram_id} style={{ textAlign: 'center', minWidth: 56, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.telegram_id === user?.id ? '#4f46e5' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14, margin: '0 auto 4px' }}>{myName(m)[0]}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{myName(m).split(' ')[0]}</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#fbbf24' }}>{scores[m.telegram_id] || 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════
  // WAITING LOBBY
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: '20px 16px 40px', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>
      <button onClick={handleLeave}
        style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 15, cursor: 'pointer', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 6 }}>
        ← {isHost ? 'مغادرة وحذف الغرفة' : 'مغادرة الغرفة'}
      </button>

      {/* Host away grace banner */}
      {hostAway && isHost && graceSeconds > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 16, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 13, color: '#f87171', marginBottom: 3 }}>غادرت التطبيق — الغرفة ستُحذف!</div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>ارجع خلال المهلة للاحتفاظ بالغرفة.</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 22, color: '#f87171' }}>
                {Math.floor(graceSeconds / 60)}:{(graceSeconds % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ height: '100%', width: `${(graceSeconds / GRACE_PERIOD_SECONDS) * 100}%`, background: '#ef4444', borderRadius: 4, transition: 'width 1s linear' }} />
          </div>
        </div>
      )}

      {/* 5-min expiry banner (only when host alone) */}
      {isHost && members.length <= 1 && room.expires_at && !hostAway && (
        <ExpiryBanner expiresAt={room.expires_at} onExpired={deleteRoom} />
      )}

      {/* Room header card */}
      <div style={{ background: 'linear-gradient(135deg,#312e81,#4f46e5,#7c3aed)', borderRadius: 24, padding: '22px 20px', marginBottom: 16, boxShadow: '0 8px 32px rgba(79,70,229,0.3)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 6 }}>{gameInfo?.emoji}</div>
          <h1 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 3 }}>غرفة {hostDisplayName}</h1>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 14 }}>{gameInfo?.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 14, padding: '9px 20px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 24, letterSpacing: 6, color: 'white', userSelect: 'all' }}>
              {room.code}
            </div>
            <button onClick={copyCode}
              style={{ background: copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.15)', border: `1px solid ${copied ? '#10b981' : 'rgba(255,255,255,0.25)'}`, borderRadius: 12, padding: '9px 16px', color: copied ? '#4ade80' : 'white', cursor: 'pointer', fontSize: 13, fontWeight: 'bold', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              {copied ? '✅ تم' : '📋 نسخ'}
            </button>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 8 }}>
            {room.is_public ? '🌐 غرفة عامة' : '🔒 غرفة خاصة'}
          </div>
        </div>
      </div>

      {/* How-to-share tip */}
      <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)', borderRadius: 16, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 13, color: '#a5b4fc', marginBottom: 5 }}>كيف تدعو صديقك؟</div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.75 }}>
              ① اضغط <strong style={{ color: 'white' }}>📋 نسخ</strong> لنسخ الكود<br />
              ② ارجع لتيليجرام وأرسله لصديقك<br />
              ③ اطلب منه يفتح البوت ويدخل الكود<br />
              <span style={{ color: '#fbbf24' }}>⏳ لديك 5 دقائق قبل حذف الغرفة تلقائياً</span><br />
              <span style={{ color: '#f87171' }}>⚠️ إذا أغلقت التطبيق تماماً، تُحذف الغرفة فوراً</span>
            </div>
          </div>
        </div>
      </div>

      {/* Non-host info */}
      {!isHost && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '10px 14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>ℹ️</span>
            <span>إذا غادر <strong style={{ color: '#fbbf24' }}>صاحب الغرفة</strong> أو أغلق التطبيق، ستُحذف الغرفة تلقائياً.</span>
          </div>
        </div>
      )}

      {/* Members section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: '600', fontSize: 14, color: '#cbd5e1' }}>اللاعبون في الغرفة</span>
        <MemberDots count={members.length} max={room.max_players} />
      </div>

      {/* Real members */}
      {members.map(m => (
        <div key={m.telegram_id}
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: m.telegram_id === user?.id ? 'rgba(79,70,229,0.18)' : 'rgba(255,255,255,0.04)', border: m.telegram_id === user?.id ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '11px 14px', marginBottom: 8, transition: 'all 0.2s' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: m.telegram_id === room.host_telegram_id ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : '#1e293b', border: m.telegram_id === room.host_telegram_id ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 17, flexShrink: 0 }}>
            {myName(m)[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '600', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {myName(m)}
              {m.telegram_id === user?.id && <span style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 8, padding: '1px 8px', fontSize: 10 }}>أنت</span>}
            </div>
            {m.telegram_id === room.host_telegram_id && (
              <div style={{ color: '#fbbf24', fontSize: 11, marginTop: 2 }}>👑 المضيف • صاحب الغرفة</div>
            )}
          </div>
          <div style={{ color: '#4ade80', fontSize: 20 }}>✓</div>
        </div>
      ))}

      {/* Empty slots */}
      {Array.from({ length: Math.max(0, room.max_players - members.length) }).map((_, i) => (
        <div key={`slot-${i}`}
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14, padding: '11px 14px', marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>👤</div>
          <div style={{ color: '#334155', fontSize: 13 }}>مكان فارغ — في انتظار لاعب...</div>
        </div>
      ))}

      {/* Solo mode toggle */}
      {(isLogoGame || isIslamic) && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 14, marginTop: 16 }}>
          <div style={{ color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginBottom: 10 }}>🎮 وضع اللعب</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setIsSolo(false)}
              style={{ flex: 1, padding: '10px', borderRadius: 12, border: `2px solid ${!isSolo ? '#4f46e5' : 'transparent'}`, background: !isSolo ? 'rgba(79,70,229,0.2)' : 'rgba(255,255,255,0.04)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: '600' }}>
              👥 تعددي
            </button>
            <button onClick={() => setIsSolo(true)}
              style={{ flex: 1, padding: '10px', borderRadius: 12, border: `2px solid ${isSolo ? '#059669' : 'transparent'}`, background: isSolo ? 'rgba(5,150,105,0.2)' : 'rgba(255,255,255,0.04)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: '600' }}>
              🎮 منفرد
            </button>
          </div>
        </div>
      )}

      {/* Start / wait */}
      {(isHost || isSolo) ? (
        <button onClick={startGame}
          style={{ width: '100%', background: 'linear-gradient(135deg,#059669,#0d9488)', color: 'white', border: 'none', borderRadius: 18, padding: '17px', fontWeight: 'bold', fontSize: 17, cursor: 'pointer', marginTop: 18, boxShadow: '0 6px 24px rgba(5,150,105,0.3)', transition: 'all 0.2s' }}>
          🚀 {isSolo ? 'ابدأ منفرداً!' : `ابدأ اللعبة! (${members.length} لاعب${members.length !== 1 ? 'ين' : ''})`}
        </button>
      ) : (
        <div style={{ textAlign: 'center', padding: '22px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, marginTop: 18 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
          <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 5 }}>في انتظار المضيف</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>سيبدأ <strong style={{ color: '#a5b4fc' }}>{hostDisplayName}</strong> اللعبة قريباً...</div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// TIC TAC TOE
// ══════════════════════════════════════════════════════════════════════════
function TicTacToe({ roomId, user, members, room, isSolo, onBack }: {
  roomId: string; user: { id: number; first_name: string } | null
  members: Member[]; room: Room; isSolo: boolean; onBack: () => void
}) {
  const router = useRouter()
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null))
  const [currentTurn, setCurrentTurn] = useState<'X' | 'O'>('X')
  const [winner, setWinner] = useState<string | null>(null)
  const [gameOver, setGameOver] = useState(false)

  const players = members.slice(0, 2)
  const hostId = room.host_telegram_id
  const mySymbol = user?.id === hostId ? 'X' : 'O'
  const isMulti = !isSolo && players.length >= 2
  const isMyTurn = currentTurn === mySymbol
  const canPlay = isSolo ? true : isMulti ? isMyTurn : true
  const myName = (m: Member) => m.users?.first_name || m.users?.username || 'لاعب'

  const { broadcastEvent } = useGameSync({
    roomId, userId: user?.id || 0,
    onEvent: useCallback((ev) => {
      if (ev.type === 'TTT_MOVE') {
        const { newBoard, nextTurn, winner: w, gameOver: go } = ev.payload as { idx: number; symbol: string; nextTurn: 'X'|'O'; newBoard: (string|null)[]; winner: string|null; gameOver: boolean }
        setBoard(newBoard); setCurrentTurn(nextTurn)
        if (w) setWinner(w); if (go) setGameOver(go)
      } else if (ev.type === 'TTT_RESET') {
        setBoard(Array(9).fill(null)); setCurrentTurn('X'); setWinner(null); setGameOver(false)
      }
    }, [])
  })

  function checkW(b: (string|null)[]) {
    for (const [a,bi,c] of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]])
      if (b[a] && b[a]===b[bi] && b[a]===b[c]) return b[a]
    return b.every(Boolean) ? 'draw' : null
  }

  function click(i: number) {
    if (board[i] || gameOver || !canPlay) return
    const sym = isSolo ? currentTurn : mySymbol
    const nb = [...board]; nb[i] = sym
    const w = checkW(nb); const go = !!w
    const next: 'X'|'O' = currentTurn==='X'?'O':'X'
    setBoard(nb); setCurrentTurn(next)
    if (w) { setWinner(w); setGameOver(true) }
    if (isMulti) broadcastEvent('TTT_MOVE', { idx:i, symbol:sym, nextTurn:next, newBoard:nb, winner:w, gameOver:go })
    else if (isSolo && !w && next==='O') setTimeout(() => {
      const empty = nb.reduce<number[]>((a,v,j)=>{ if(!v) a.push(j); return a },[])
      if (empty.length>0) {
        const ai=empty[Math.floor(Math.random()*empty.length)]
        const nb2=[...nb]; nb2[ai]='O'; const w2=checkW(nb2)
        setBoard(nb2); setCurrentTurn('X'); if(w2){setWinner(w2);setGameOver(true)}
      }
    }, 400)
  }

  function reset() {
    setBoard(Array(9).fill(null)); setCurrentTurn('X'); setWinner(null); setGameOver(false)
    if (isMulti) broadcastEvent('TTT_RESET', {})
  }

  const host = players.find(p=>p.telegram_id===hostId)
  const guest = players.find(p=>p.telegram_id!==hostId)
  const status = winner==='draw'?'🤝 تعادل!':winner?(winner===mySymbol?'🏆 فزت!':isSolo&&winner==='O'?'🤖 فاز الـ AI!':'😢 خسرت!'):isMulti?(isMyTurn?'🟢 دورك!':'🔴 دور الخصم...'): `${currentTurn==='X'?'❌':'⭕'} دور ${currentTurn}`

  return (
    <div style={{ minHeight:'100vh', background:'#0f172a', color:'white', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Segoe UI,system-ui,sans-serif' }}>
      <h1 style={{ fontSize:26, fontWeight:'bold', marginBottom:8 }}>⭕ إكس أو ❌</h1>
      {isMulti && (
        <div style={{ display:'flex', gap:20, marginBottom:16, alignItems:'center' }}>
          <div style={{ textAlign:'center', opacity:currentTurn==='X'?1:0.4 }}>
            <div style={{ fontSize:28, color:'#60a5fa', marginBottom:4 }}>❌</div>
            <div style={{ fontSize:12, color:'#94a3b8' }}>{host?myName(host):'X'}</div>
            {user?.id===hostId && <div style={{ fontSize:10, color:'#6366f1' }}>(أنت)</div>}
          </div>
          <div style={{ color:'#475569', fontSize:20, fontWeight:'bold' }}>VS</div>
          <div style={{ textAlign:'center', opacity:currentTurn==='O'?1:0.4 }}>
            <div style={{ fontSize:28, color:'#f87171', marginBottom:4 }}>⭕</div>
            <div style={{ fontSize:12, color:'#94a3b8' }}>{guest?myName(guest):'O'}</div>
            {user?.id!==hostId && <div style={{ fontSize:10, color:'#6366f1' }}>(أنت)</div>}
          </div>
        </div>
      )}
      <div style={{ marginBottom:20, fontSize:17, fontWeight:'bold', color:winner?'#fbbf24':canPlay?'#4ade80':'#f87171' }}>{status}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
        {board.map((c,i)=>(
          <button key={i} onClick={()=>click(i)}
            style={{ width:88, height:88, borderRadius:16, fontSize:40, fontWeight:'bold', background:c?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.05)', border:'2px solid rgba(255,255,255,0.1)', color:c==='X'?'#60a5fa':'#f87171', cursor:(!c&&canPlay&&!gameOver)?'pointer':'default' }}>
            {c}
          </button>
        ))}
      </div>
      {gameOver ? (
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={reset} style={{ background:'#4f46e5', color:'white', border:'none', borderRadius:12, padding:'12px 24px', fontWeight:'bold', cursor:'pointer' }}>🔄 مجدداً</button>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,0.1)', color:'white', border:'none', borderRadius:12, padding:'12px 24px', cursor:'pointer' }}>← رجوع</button>
        </div>
      ) : (
        <button onClick={()=>router.push('/')} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:14 }}>← الرئيسية</button>
      )}
    </div>
  )
}
