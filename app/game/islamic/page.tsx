'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { getIslamicQuestions, getIslamicRank, RANK_SYSTEM, type IslamicQuestion } from '@/lib/islamicQuestions'

type Phase = 'lobby' | 'playing' | 'finished'

const TOTAL_QUESTIONS = 15
const TIMER_SECONDS = 20

export default function IslamicQuizPage() {
  const router = useRouter()
  const { user } = useTelegram()
  const [phase, setPhase] = useState<Phase>('lobby')
  const [questions, setQuestions] = useState<IslamicQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [islamicScore, setIslamicScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [showStreak, setShowStreak] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const streakRef = useRef(0)

  useEffect(() => {
    if (user) loadIslamicScore()
  }, [user])

  async function loadIslamicScore() {
    if (!user) return
    const { data } = await supabase.from('users').select('islamic_score').eq('telegram_id', user.id).single()
    setIslamicScore(data?.islamic_score || 0)
  }

  function startGame() {
    const qs = getIslamicQuestions(TOTAL_QUESTIONS)
    setQuestions(qs)
    setCurrent(0)
    setSelected(null)
    setScore(0)
    setCorrect(0)
    setWrong(0)
    setStreak(0)
    setMaxStreak(0)
    setTimeLeft(TIMER_SECONDS)
    scoreRef.current = 0
    correctRef.current = 0
    streakRef.current = 0
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(TIMER_SECONDS)

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [current, phase])

  function handleTimeout() {
    if (selected !== null) return
    setSelected(-1)
    streakRef.current = 0
    setStreak(0)
    setWrong(w => w + 1)
    setTimeout(() => goNext(), 2000)
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSelected(idx)

    const q = questions[current]
    const isCorrect = idx === q.correct

    if (isCorrect) {
      const speedBonus = Math.max(0, timeLeft * 5)
      const newStreak = streakRef.current + 1
      const streakBonus = newStreak >= 3 ? newStreak * 10 : 0
      const pts = 100 + speedBonus + streakBonus
      scoreRef.current += pts
      correctRef.current += 1
      streakRef.current = newStreak

      setScore(scoreRef.current)
      setCorrect(correctRef.current)
      setStreak(newStreak)
      if (newStreak > maxStreak) setMaxStreak(newStreak)

      if (newStreak >= 3) {
        setShowStreak(true)
        setTimeout(() => setShowStreak(false), 1500)
      }
    } else {
      streakRef.current = 0
      setStreak(0)
      setWrong(w => w + 1)
    }
    setTimeout(() => goNext(), 1800)
  }

  function goNext() {
    const nextIdx = current + 1
    if (nextIdx >= TOTAL_QUESTIONS) {
      finishGame()
    } else {
      setCurrent(nextIdx)
      setSelected(null)
      setTimeLeft(TIMER_SECONDS)
    }
  }

  async function finishGame() {
    setPhase('finished')
    if (!user) return
    const { data } = await supabase.from('users').select('islamic_score,games_played,total_score').eq('telegram_id', user.id).single()
    if (data) {
      const newIs = (data.islamic_score || 0) + scoreRef.current
      await supabase.from('users').update({
        islamic_score: newIs,
        games_played: (data.games_played || 0) + 1,
        total_score: (data.total_score || 0) + scoreRef.current,
      }).eq('telegram_id', user.id)
      setIslamicScore(newIs)
    }
  }

  const rank = getIslamicRank(islamicScore)
  const nextRank = RANK_SYSTEM.find(r => r.minScore > islamicScore)
  const progress = nextRank ? ((islamicScore - rank.minScore) / (nextRank.minScore - rank.minScore)) * 100 : 100
  const q = questions[current]

  const catColors: Record<string, string> = {
    'عقيدة': '#8b5cf6', 'قرآن': '#10b981', 'حديث': '#3b82f6',
    'سيرة': '#f59e0b', 'فقه': '#ef4444', 'تاريخ': '#6366f1', 'أخلاق': '#ec4899'
  }
  const diffColors = { 'سهل': '#4ade80', 'متوسط': '#fbbf24', 'صعب': '#f87171' }

  // ── LOBBY ──
  if (phase === 'lobby') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0c1a0e 0%,#0f172a 100%)', color: 'white', fontFamily: 'Segoe UI,system-ui,sans-serif', padding: '32px 16px 24px' }}>
      <button onClick={() => router.push('/')} style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', marginBottom: 24 }}>← رجوع</button>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 72, marginBottom: 8, filter: 'drop-shadow(0 4px 20px rgba(16,185,129,0.4))' }}>🕌</div>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 6 }}>الاختبار الإسلامي</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>اختبر معرفتك الدينية وارتقِ في الرتب</p>
      </div>

      {/* Rank card */}
      <div style={{ background: `linear-gradient(135deg,${rank.color}22,${rank.color}11)`, border: `1px solid ${rank.color}44`, borderRadius: 24, padding: 20, marginBottom: 20, textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 44 }}>{rank.icon}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', color: rank.color }}>{rank.rank}</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{islamicScore.toLocaleString()} نقطة دينية</div>
          </div>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg,${rank.color},${rank.color}aa)`, width: `${Math.min(100, progress)}%`, borderRadius: 8, transition: 'width 0.5s ease' }} />
        </div>
        {nextRank
          ? <div style={{ color: '#64748b', fontSize: 11 }}>للوصول لـ "{nextRank.rank}" {nextRank.icon}: {(nextRank.minScore - islamicScore).toLocaleString()} نقطة</div>
          : <div style={{ color: '#fbbf24', fontSize: 13 }}>🏆 أعلى رتبة! أنت في القمة!</div>}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { icon: '❓', label: `${TOTAL_QUESTIONS} سؤال`, sub: 'متنوع' },
          { icon: '⏱️', label: '20 ثانية', sub: 'لكل سؤال' },
          { icon: '🔥', label: 'سلسلة', sub: 'نقاط إضافية' },
        ].map(i => (
          <div key={i.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{i.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 'bold' }}>{i.label}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{i.sub}</div>
          </div>
        ))}
      </div>

      {/* Ranks list */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 16, marginBottom: 20 }}>
        <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 12 }}>🎖️ سلم الرتب</div>
        {RANK_SYSTEM.map((r, i) => {
          const isActive = islamicScore >= r.minScore
          const isCurrent = rank.rank === r.rank
          return (
            <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < RANK_SYSTEM.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: isActive ? 1 : 0.35, background: isCurrent ? `${r.color}11` : 'transparent', borderRadius: 8, paddingInline: 6 }}>
              <span style={{ fontSize: 22 }}>{r.icon}</span>
              <span style={{ flex: 1, fontWeight: '600', color: r.color, fontSize: 13 }}>{r.rank}</span>
              <span style={{ color: '#64748b', fontSize: 11 }}>{r.minScore.toLocaleString()}+</span>
              {isCurrent && <span style={{ background: r.color, color: 'black', borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 'bold' }}>أنت</span>}
              {isActive && !isCurrent && <span style={{ color: '#4ade80', fontSize: 14 }}>✅</span>}
            </div>
          )
        })}
      </div>

      <button onClick={startGame}
        style={{ width: '100%', background: 'linear-gradient(135deg,#059669,#047857)', color: 'white', border: 'none', borderRadius: 20, padding: '18px', fontWeight: 'bold', fontSize: 18, cursor: 'pointer', boxShadow: '0 8px 32px rgba(5,150,105,0.4)' }}>
        🕌 ابدأ الاختبار
      </button>
    </div>
  )

  // ── PLAYING ──
  if (phase === 'playing' && q) {
    const catColor = catColors[q.category] || '#6366f1'
    const diffColor = diffColors[q.difficulty] || '#fbbf24'
    const timerPct = (timeLeft / TIMER_SECONDS) * 100
    const timerColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : catColor

    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', padding: '12px 16px 20px', fontFamily: 'Segoe UI,system-ui,sans-serif' }}>

        {/* Streak toast */}
        {showStreak && (
          <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: 'white', borderRadius: 20, padding: '10px 24px', fontWeight: 'bold', fontSize: 16, zIndex: 999, boxShadow: '0 8px 32px rgba(245,158,11,0.5)', animation: 'bounce 0.3s ease' }}>
            🔥 سلسلة {streak}x! +{streak * 10} نقطة إضافية!
          </div>
        )}

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>
            {current + 1}<span style={{ color: '#475569' }}>/{TOTAL_QUESTIONS}</span>
          </div>
          {streak >= 2 && (
            <div style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 'bold' }}>
              🔥 ×{streak}
            </div>
          )}
          <div style={{ background: timeLeft <= 5 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.2)', color: timeLeft <= 5 ? '#f87171' : '#4ade80', borderRadius: 20, padding: '4px 14px', fontWeight: 'bold', fontSize: 15 }}>
            ⏱ {timeLeft}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 5, background: '#1e293b', borderRadius: 4, marginBottom: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: `linear-gradient(90deg,${catColor},${catColor}88)`, borderRadius: 4, width: `${(current / TOTAL_QUESTIONS) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>

        {/* Timer bar */}
        <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: timerColor, width: `${timerPct}%`, transition: 'width 1s linear', borderRadius: 2 }} />
        </div>

        {/* Score & meta row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ color: '#4ade80' }}>✅ {correct}</span>
            <span style={{ color: '#f87171' }}>❌ {wrong}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ background: `${catColor}22`, color: catColor, padding: '2px 8px', borderRadius: 10 }}>{q.category}</span>
            <span style={{ background: `${diffColor}22`, color: diffColor, padding: '2px 8px', borderRadius: 10 }}>{q.difficulty}</span>
          </div>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>⭐ {score}</span>
        </div>

        {/* Question */}
        <div style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${catColor}33`, borderRadius: 20, padding: '20px 16px', marginBottom: 18, flex: 'none' }}>
          <div style={{ fontSize: 16, fontWeight: '600', lineHeight: 1.8, textAlign: 'center' }}>{q.question}</div>
        </div>

        {/* Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {q.choices.map((choice, idx) => {
            let bg = 'rgba(255,255,255,0.06)'
            let border = '1px solid rgba(255,255,255,0.1)'
            let color = 'white'
            let icon = null
            if (selected !== null) {
              if (idx === q.correct) {
                bg = 'rgba(16,185,129,0.18)'
                border = '2px solid #10b981'
                color = '#4ade80'
                icon = '✅'
              } else if (idx === selected) {
                bg = 'rgba(239,68,68,0.18)'
                border = '2px solid #ef4444'
                color = '#f87171'
                icon = '❌'
              }
            }
            return (
              <button key={idx} onClick={() => handleAnswer(idx)} disabled={selected !== null}
                style={{ background: bg, border, color, borderRadius: 14, padding: '14px 14px', textAlign: 'right', fontSize: 14, cursor: selected !== null ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent' }}>
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: selected !== null && idx === q.correct ? '#10b981' : selected !== null && idx === selected ? '#ef4444' : `${catColor}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 'bold', flexShrink: 0, color: selected !== null ? 'white' : catColor }}>
                  {['أ', 'ب', 'ج', 'د'][idx]}
                </span>
                <span style={{ flex: 1 }}>{choice}</span>
                {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── FINISHED ──
  if (phase === 'finished') {
    const newRank = getIslamicRank(islamicScore)
    const accuracy = Math.round((correct / TOTAL_QUESTIONS) * 100)
    const grade = accuracy >= 90 ? { label: 'ممتاز! 🌟', color: '#fbbf24' } : accuracy >= 70 ? { label: 'جيد جداً 👏', color: '#4ade80' } : accuracy >= 50 ? { label: 'جيد 👍', color: '#60a5fa' } : { label: 'تحتاج مراجعة 📚', color: '#f87171' }

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0c1a0e 0%,#0f172a 100%)', color: 'white', fontFamily: 'Segoe UI,system-ui,sans-serif', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Result header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 72, marginBottom: 8 }}>{newRank.icon}</div>
          <h2 style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 4 }}>انتهى الاختبار!</h2>
          <div style={{ color: grade.color, fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>{grade.label}</div>
          <div style={{ color: newRank.color, fontSize: 15 }}>{newRank.rank}</div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 360, marginBottom: 20 }}>
          {[
            { label: 'النقاط المكتسبة', value: `+${score}`, icon: '⭐', color: '#fbbf24' },
            { label: 'الدقة', value: `${accuracy}%`, icon: '🎯', color: '#60a5fa' },
            { label: 'إجابات صحيحة', value: `${correct}/${TOTAL_QUESTIONS}`, icon: '✅', color: '#4ade80' },
            { label: 'أطول سلسلة', value: `${maxStreak}x`, icon: '🔥', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: s.color }}>{s.value}</div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Total score */}
        <div style={{ background: `${newRank.color}22`, border: `1px solid ${newRank.color}44`, borderRadius: 20, padding: '16px 28px', marginBottom: 24, textAlign: 'center', width: '100%', maxWidth: 360 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>إجمالي نقاطك الدينية</div>
          <div style={{ fontSize: 26, fontWeight: 'bold', color: newRank.color }}>{islamicScore.toLocaleString()} ⭐</div>
          {nextRank && (
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 6 }}>
              {(nextRank.minScore - islamicScore).toLocaleString()} نقطة للوصول لـ "{nextRank.rank}" {nextRank.icon}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 360 }}>
          <button onClick={startGame} style={{ flex: 1, background: 'linear-gradient(135deg,#059669,#047857)', color: 'white', border: 'none', borderRadius: 16, padding: '15px', fontWeight: 'bold', fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 20px rgba(5,150,105,0.3)' }}>🔄 العب مجدداً</button>
          <button onClick={() => router.push('/')} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '15px', cursor: 'pointer', fontSize: 15 }}>← الرئيسية</button>
        </div>
      </div>
    )
  }

  return null
}
