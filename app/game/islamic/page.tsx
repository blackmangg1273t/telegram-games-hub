'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { getIslamicQuestions, getIslamicRank, RANK_SYSTEM, type IslamicQuestion } from '@/lib/islamicQuestions'

type Phase = 'lobby' | 'playing' | 'finished'

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
  const [timeLeft, setTimeLeft] = useState(20)
  const [islamicScore, setIslamicScore] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)
  const correctRef = useRef(0)
  const totalQuestions = 15

  useEffect(() => {
    if (user) loadIslamicScore()
  }, [user])

  async function loadIslamicScore() {
    if (!user) return
    const { data } = await supabase.from('users').select('islamic_score').eq('telegram_id', user.id).single()
    setIslamicScore(data?.islamic_score || 0)
  }

  function startGame() {
    const qs = getIslamicQuestions(totalQuestions)
    setQuestions(qs)
    setCurrent(0)
    setSelected(null)
    setScore(0)
    setCorrect(0)
    setWrong(0)
    setTimeLeft(20)
    scoreRef.current = 0
    correctRef.current = 0
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleTimeout()
          return 20
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [current, phase])

  function handleTimeout() {
    if (selected !== null) return
    setSelected(-1)
    setWrong(w => w + 1)
    setTimeout(() => goNext(), 1800)
  }

  function handleAnswer(idx: number) {
    if (selected !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSelected(idx)
    const q = questions[current]
    const isCorrect = idx === q.correct
    if (isCorrect) {
      const pts = 100 + Math.max(0, timeLeft * 5)
      scoreRef.current += pts
      correctRef.current += 1
      setScore(scoreRef.current)
      setCorrect(correctRef.current)
    } else {
      setWrong(w => w + 1)
    }
    setTimeout(() => goNext(), 1800)
  }

  function goNext() {
    const nextIdx = current + 1
    if (nextIdx >= totalQuestions) {
      finishGame()
    } else {
      setCurrent(nextIdx)
      setSelected(null)
      setTimeLeft(20)
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

  // ── LOBBY ──
  if (phase === 'lobby') return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'Segoe UI,system-ui,sans-serif', padding: '32px 16px 24px' }}>
      <button onClick={() => router.push('/')} style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', marginBottom: 24 }}>← رجوع</button>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 68, marginBottom: 8 }}>🕌</div>
        <h1 style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 6 }}>الاختبار الإسلامي</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>اختبر معرفتك الدينية وارتقِ في الرتب</p>
      </div>

      {/* Rank card */}
      <div style={{ background: `${rank.color}22`, border: `1px solid ${rank.color}44`, borderRadius: 20, padding: 20, marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>{rank.icon}</div>
        <div style={{ fontSize: 18, fontWeight: 'bold', color: rank.color, marginBottom: 4 }}>{rank.rank}</div>
        <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>نقاطك الدينية: {islamicScore.toLocaleString()}</div>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ height: '100%', background: rank.color, width: `${Math.min(100, progress)}%`, borderRadius: 8 }} />
        </div>
        {nextRank
          ? <div style={{ color: '#64748b', fontSize: 11 }}>للوصول لـ "{nextRank.rank}" {nextRank.icon}: {(nextRank.minScore - islamicScore).toLocaleString()} نقطة</div>
          : <div style={{ color: '#fbbf24', fontSize: 13 }}>🏆 أعلى رتبة!</div>}
      </div>

      {/* Ranks list */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
        <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 10 }}>🎖️ سلم الرتب</div>
        {RANK_SYSTEM.map(r => (
          <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: islamicScore >= r.minScore ? 1 : 0.4 }}>
            <span style={{ fontSize: 20 }}>{r.icon}</span>
            <span style={{ flex: 1, fontWeight: '600', color: r.color, fontSize: 13 }}>{r.rank}</span>
            <span style={{ color: '#64748b', fontSize: 11 }}>{r.minScore.toLocaleString()}+</span>
            {islamicScore >= r.minScore && <span>✅</span>}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { icon: '❓', label: `${totalQuestions} سؤال` },
          { icon: '⏱️', label: '20 ثانية' },
          { icon: '⭐', label: '100+ نقطة' },
        ].map(i => (
          <div key={i.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{i.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 'bold' }}>{i.label}</div>
          </div>
        ))}
      </div>

      <button onClick={startGame} style={{ width: '100%', background: 'linear-gradient(135deg,#059669,#0d9488)', color: 'white', border: 'none', borderRadius: 18, padding: '16px', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>
        🕌 ابدأ الاختبار
      </button>
    </div>
  )

  // ── PLAYING ──
  if (phase === 'playing' && q) {
    const catColor = catColors[q.category] || '#6366f1'
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'Segoe UI,system-ui,sans-serif', display: 'flex', flexDirection: 'column', padding: 16 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ color: '#94a3b8', fontSize: 13 }}>{current + 1}/{totalQuestions}</div>
          <div style={{ background: timeLeft <= 5 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', color: timeLeft <= 5 ? '#f87171' : '#4ade80', borderRadius: 20, padding: '4px 12px', fontWeight: 'bold', fontSize: 15 }}>⏱ {timeLeft}s</div>
        </div>

        {/* Progress */}
        <div style={{ height: 4, background: '#1e293b', borderRadius: 4, marginBottom: 8 }}>
          <div style={{ height: '100%', background: catColor, borderRadius: 4, width: `${(current / totalQuestions) * 100}%` }} />
        </div>

        {/* Score row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 14 }}>
          <span>✅ {correct}</span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>⭐ {score}</span>
          <span>❌ {wrong}</span>
        </div>

        {/* Category */}
        <div style={{ display: 'inline-block', background: `${catColor}22`, border: `1px solid ${catColor}55`, color: catColor, borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: '600', marginBottom: 14, alignSelf: 'flex-start' }}>
          {q.category} • {q.difficulty}
        </div>

        {/* Question */}
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: '18px 16px', marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: '600', lineHeight: 1.7, textAlign: 'center' }}>{q.question}</div>
        </div>

        {/* Choices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {q.choices.map((choice, idx) => {
            let bg = 'rgba(255,255,255,0.06)'
            let border = '1px solid rgba(255,255,255,0.1)'
            let color = 'white'
            if (selected !== null) {
              if (idx === q.correct) { bg = 'rgba(16,185,129,0.2)'; border = '2px solid #10b981'; color = '#4ade80' }
              else if (idx === selected) { bg = 'rgba(239,68,68,0.2)'; border = '2px solid #ef4444'; color = '#f87171' }
            }
            return (
              <button key={idx} onClick={() => handleAnswer(idx)} disabled={selected !== null}
                style={{ background: bg, border, color, borderRadius: 14, padding: '13px 14px', textAlign: 'right', fontSize: 14, cursor: selected !== null ? 'default' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 'bold', flexShrink: 0 }}>
                  {['أ','ب','ج','د'][idx]}
                </span>
                <span style={{ flex: 1 }}>{choice}</span>
                {selected !== null && idx === q.correct && <span>✅</span>}
                {selected !== null && idx === selected && idx !== q.correct && <span>❌</span>}
              </button>
            )
          })}
        </div>

        {/* Timer bar */}
        <div style={{ height: 3, background: '#1e293b', borderRadius: 2, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: timeLeft <= 5 ? '#ef4444' : catColor, width: `${(timeLeft / 20) * 100}%`, transition: 'width 1s linear' }} />
        </div>
      </div>
    )
  }

  // ── FINISHED ──
  if (phase === 'finished') {
    const newRank = getIslamicRank(islamicScore)
    const accuracy = Math.round((correct / totalQuestions) * 100)
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'Segoe UI,system-ui,sans-serif', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 10 }}>{newRank.icon}</div>
        <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>انتهى الاختبار!</h2>
        <div style={{ color: newRank.color, fontSize: 17, fontWeight: 'bold', marginBottom: 20 }}>رتبتك: {newRank.rank}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 340, marginBottom: 20 }}>
          {[
            { label: 'النقاط', value: `+${score}`, icon: '⭐', color: '#fbbf24' },
            { label: 'الدقة', value: `${accuracy}%`, icon: '🎯', color: '#60a5fa' },
            { label: 'صحيح', value: correct, icon: '✅', color: '#4ade80' },
            { label: 'خطأ', value: wrong, icon: '❌', color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: s.color }}>{s.value}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: `${newRank.color}22`, border: `1px solid ${newRank.color}44`, borderRadius: 16, padding: '12px 24px', marginBottom: 24, textAlign: 'center', width: '100%', maxWidth: 340 }}>
          <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>إجمالي نقاطك الدينية</div>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: newRank.color }}>{islamicScore.toLocaleString()} ⭐</div>
        </div>

        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 340 }}>
          <button onClick={startGame} style={{ flex: 1, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 'bold', cursor: 'pointer' }}>🔄 مجدداً</button>
          <button onClick={() => router.push('/')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 14, padding: '14px', cursor: 'pointer' }}>← الرئيسية</button>
        </div>
      </div>
    )
  }

  return null
}
