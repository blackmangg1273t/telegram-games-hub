'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTelegram } from '@/lib/useTelegram'
import { supabase } from '@/lib/supabase'
import { generateRoomCode } from '@/lib/gameData'
import { useGameSync } from '@/lib/useGameSync'

const GRID = 18
type Dir = [number, number]
type Cell = [number, number]

function rand(): Cell {
  return [Math.floor(Math.random() * GRID), Math.floor(Math.random() * GRID)]
}

// ═══════════════════════════════════════════════════════════════════════════
// SNAKE PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function SnakePage() {
  const router = useRouter()
  const { user } = useTelegram()
  const [mode, setMode] = useState<'menu' | 'solo' | 'waiting' | 'multi'>('menu')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [roomId, setRoomId] = useState('')
  const [oppData, setOppData] = useState<{ name: string; snake: Cell[]; score: number; alive: boolean }>({
    name: 'خصمك', snake: [], score: 0, alive: true,
  })

  // Solo snake state
  const [snake, setSnake] = useState<Cell[]>([[9, 9]])
  const [food, setFood] = useState<Cell>([5, 5])
  const [score, setScore] = useState(0)
  const [alive, setAlive] = useState(false)
  const [best, setBest] = useState(0)
  const dirRef = useRef<Dir>([0, 1])
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)

  function startSolo() {
    setSnake([[9, 9]])
    setFood(rand())
    setScore(0)
    scoreRef.current = 0
    dirRef.current = [0, 1]
    setAlive(true)
    setMode('solo')
  }

  useEffect(() => {
    if (!alive || mode !== 'solo') return
    if (loopRef.current) clearInterval(loopRef.current)
    loopRef.current = setInterval(() => {
      setSnake(prev => {
        const d = dirRef.current
        const h: Cell = [(prev[0][0] + d[0] + GRID) % GRID, (prev[0][1] + d[1] + GRID) % GRID]
        if (prev.some(c => c[0] === h[0] && c[1] === h[1])) {
          clearInterval(loopRef.current!)
          setAlive(false)
          setBest(b => Math.max(b, scoreRef.current))
          return prev
        }
        const ns = [h, ...prev]
        setFood(f => {
          if (h[0] === f[0] && h[1] === f[1]) {
            scoreRef.current += 10
            setScore(scoreRef.current)
            return rand()
          }
          ns.pop()
          return f
        })
        return ns
      })
    }, 165)
    return () => { if (loopRef.current) clearInterval(loopRef.current) }
  }, [alive, mode])

  function changeDir(d: Dir) {
    const c = dirRef.current
    if (d[0] !== -c[0] || d[1] !== -c[1]) dirRef.current = d
  }

  async function createRoom() {
    if (!user) return
    await supabase.from('users').upsert({ telegram_id: user.id, username: user.username, first_name: user.first_name }, { onConflict: 'telegram_id' })
    const code = generateRoomCode()
    const { data: room } = await supabase.from('rooms').insert({
      code, host_telegram_id: user.id, game_type: 'snake', is_public: false, max_players: 2, total_rounds: 1, game_data: {}
    }).select().single()
    if (!room) return
    await supabase.from('room_members').insert({ room_id: room.id, telegram_id: user.id })
    setRoomId(room.id)
    setRoomCode(code)
    setMode('waiting')
  }

  async function joinRoom() {
    if (!user || !joinCode) return
    const { data: room } = await supabase.from('rooms').select('*').eq('code', joinCode.toUpperCase()).single()
    if (!room) { alert('كود غير صحيح!'); return }
    await supabase.from('users').upsert({ telegram_id: user.id, username: user.username, first_name: user.first_name }, { onConflict: 'telegram_id' })
    const { error } = await supabase.from('room_members').insert({ room_id: room.id, telegram_id: user.id })
    if (error && !error.message.includes('duplicate')) { alert('خطأ في الانضمام'); return }
    setRoomId(room.id)
    setRoomCode(joinCode.toUpperCase())
    setMode('waiting')
  }

  // Wait for opponent to join
  useEffect(() => {
    if (mode !== 'waiting' && mode !== 'multi') return
    const ch = supabase.channel(`snake_lobby:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` }, async () => {
        const { data } = await supabase.from('room_members').select('*,users(first_name)').eq('room_id', roomId)
        if (data && data.length >= 2) {
          const opp = data.find((m: { telegram_id: number }) => m.telegram_id !== user?.id)
          if (opp) {
            setOppData(prev => ({ ...prev, name: (opp as { users?: { first_name?: string } }).users?.first_name || 'خصمك' }))
          }
          if (mode === 'waiting') setMode('multi')
        }
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [mode, roomId, user])

  const S: React.CSSProperties = { fontFamily: 'Segoe UI,system-ui,sans-serif', minHeight: '100vh', background: '#0f172a', color: 'white' }

  // ── MENU ──
  if (mode === 'menu') return (
    <div style={{ ...S, padding: '32px 16px 24px' }}>
      <button onClick={() => router.push('/')} style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', marginBottom: 24 }}>← رجوع</button>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 68 }}>🐍</div>
        <h1 style={{ fontSize: 26, fontWeight: 'bold', margin: '10px 0 6px' }}>لعبة الثعبان</h1>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>العب وحدك أو تحدى صديقك!</p>
        {best > 0 && <div style={{ color: '#fbbf24', fontSize: 14, marginTop: 6 }}>🏆 أفضل نتيجة: {best}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <button onClick={startSolo} style={{ background: 'linear-gradient(135deg,#059669,#0d9488)', color: 'white', border: 'none', borderRadius: 18, padding: '18px', fontWeight: 'bold', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>🎮</span>
          <div style={{ textAlign: 'right' }}>
            <div>العب منفرداً</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>تحدّ نفسك واكسب أعلى نقطة</div>
          </div>
        </button>
        <button onClick={createRoom} style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', borderRadius: 18, padding: '18px', fontWeight: 'bold', fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>👥</span>
          <div style={{ textAlign: 'right' }}>
            <div>تحدّ صديقك</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>أنشئ غرفة وشارك الكود</div>
          </div>
        </button>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 16 }}>
          <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 10 }}>🔑 انضم بكود صديقك</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="XXXXXX"
              style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '10px 14px', color: 'white', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold', letterSpacing: 4, textAlign: 'center', outline: 'none' }} />
            <button onClick={joinRoom} disabled={joinCode.length < 6}
              style={{ background: joinCode.length >= 6 ? '#4f46e5' : 'rgba(79,70,229,0.4)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 'bold', cursor: joinCode.length >= 6 ? 'pointer' : 'not-allowed' }}>
              انضم
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── WAITING ──
  if (mode === 'waiting') return (
    <div style={{ ...S, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
      <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>في انتظار صديقك...</h2>
      <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>شارك الكود معه</p>
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 32px', fontFamily: 'monospace', fontSize: 32, fontWeight: 'bold', letterSpacing: 8, marginBottom: 24 }}>{roomCode}</div>
      <button onClick={() => { setMode('menu'); setRoomCode(''); setRoomId('') }} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', cursor: 'pointer' }}>إلغاء</button>
    </div>
  )

  // ── SOLO GAME ──
  if (mode === 'solo') return (
    <div style={{ ...S, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 320, marginBottom: 12 }}>
        <button onClick={() => { if (loopRef.current) clearInterval(loopRef.current); setMode('menu') }} style={{ color: '#94a3b8', background: 'none', border: 'none', fontSize: 15, cursor: 'pointer' }}>← رجوع</button>
        <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 18 }}>⭐ {score}</div>
      </div>
      <div style={{ border: '2px solid rgba(34,197,94,0.3)', borderRadius: 10, overflow: 'hidden', display: 'grid', gridTemplateColumns: `repeat(${GRID},16px)`, gridTemplateRows: `repeat(${GRID},16px)`, marginBottom: 20 }}>
        {Array.from({ length: GRID * GRID }, (_, i) => {
          const r = Math.floor(i / GRID), c = i % GRID
          const isHead = snake[0]?.[0] === r && snake[0]?.[1] === c
          const isBody = !isHead && snake.some(s => s[0] === r && s[1] === c)
          const isFood = food[0] === r && food[1] === c
          return <div key={i} style={{ width: 16, height: 16, background: isHead ? '#4ade80' : isBody ? '#16a34a' : isFood ? '#ef4444' : '#0a0f1e', borderRadius: isFood ? '50%' : isHead ? 3 : 0 }} />
        })}
      </div>
      {!alive && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ color: '#f87171', fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>💀 انتهت اللعبة! نقاطك: {score}</div>
          <button onClick={startSolo} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 14, padding: '12px 28px', fontWeight: 'bold', cursor: 'pointer', fontSize: 15 }}>🔄 العب مجدداً</button>
        </div>
      )}
      <DPad changeDir={changeDir} />
    </div>
  )

  // ── MULTIPLAYER ──
  if (mode === 'multi') return (
    <MultiSnake
      roomId={roomId}
      user={user}
      oppData={oppData}
      setOppData={setOppData}
      onBack={() => { setMode('menu'); setRoomCode(''); setRoomId('') }}
    />
  )

  return null
}

// ── D-Pad ──
function DPad({ changeDir }: { changeDir: (d: Dir) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gap: 8, marginTop: 8 }}>
      <div /><button onClick={() => changeDir([-1, 0])} style={btnStyle}>⬆️</button><div />
      <button onClick={() => changeDir([0, -1])} style={btnStyle}>⬅️</button>
      <button onClick={() => changeDir([1, 0])} style={btnStyle}>⬇️</button>
      <button onClick={() => changeDir([0, 1])} style={btnStyle}>➡️</button>
    </div>
  )
}
const btnStyle: React.CSSProperties = { width: 56, height: 56, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, fontSize: 22, cursor: 'pointer', color: 'white' }

// ═══════════════════════════════════════════════════════════════════════════
// MULTIPLAYER SNAKE — REAL-TIME SYNCED
// ═══════════════════════════════════════════════════════════════════════════
function MultiSnake({ roomId, user, oppData, setOppData, onBack }: {
  roomId: string
  user: { id: number; first_name: string } | null
  oppData: { name: string; snake: Cell[]; score: number; alive: boolean }
  setOppData: React.Dispatch<React.SetStateAction<{ name: string; snake: Cell[]; score: number; alive: boolean }>>
  onBack: () => void
}) {
  const G = 16
  const [snake, setSnake] = useState<Cell[]>([[4, 4]])
  const [food, setFood] = useState<Cell>([8, 8])
  const [score, setScore] = useState(0)
  const [alive, setAlive] = useState(false)
  const [started, setStarted] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const dirRef = useRef<Dir>([0, 1])
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const scoreRef = useRef(0)

  function randG(): Cell { return [Math.floor(Math.random() * G), Math.floor(Math.random() * G)] }

  const { broadcastEvent } = useGameSync({
    roomId,
    userId: user?.id || 0,
    onEvent: useCallback((event) => {
      if (event.type === 'SNAKE_STATE') {
        const { snake: s, score: sc, alive: a } = event.payload as { snake: Cell[]; score: number; alive: boolean }
        setOppData(prev => ({ ...prev, snake: s, score: sc, alive: a }))
        if (!a && !alive) setGameEnded(true)
      }
    }, [alive, setOppData])
  })

  function start() {
    setSnake([[4, 4]])
    setFood(randG())
    setScore(0)
    scoreRef.current = 0
    dirRef.current = [0, 1]
    setAlive(true)
    setStarted(true)
    setGameEnded(false)
  }

  useEffect(() => {
    if (!alive || !started) return
    if (loopRef.current) clearInterval(loopRef.current)
    loopRef.current = setInterval(() => {
      setSnake(prev => {
        const d = dirRef.current
        const h: Cell = [(prev[0][0] + d[0] + G) % G, (prev[0][1] + d[1] + G) % G]
        if (prev.some(c => c[0] === h[0] && c[1] === h[1])) {
          clearInterval(loopRef.current!)
          setAlive(false)
          const finalScore = scoreRef.current
          // Broadcast death
          broadcastEvent('SNAKE_STATE', { snake: prev, score: finalScore, alive: false })
          // Update DB
          if (user) supabase.from('room_members').update({ score: finalScore }).eq('room_id', roomId).eq('telegram_id', user.id)
          return prev
        }
        const ns = [h, ...prev]
        setFood(f => {
          if (h[0] === f[0] && h[1] === f[1]) {
            scoreRef.current += 10
            setScore(scoreRef.current)
            const newFood = randG()
            // Broadcast state with new score
            broadcastEvent('SNAKE_STATE', { snake: ns, score: scoreRef.current, alive: true })
            if (user) supabase.from('room_members').update({ score: scoreRef.current }).eq('room_id', roomId).eq('telegram_id', user.id)
            return newFood
          }
          ns.pop()
          return f
        })
        return ns
      })
    }, 170)
    return () => { if (loopRef.current) clearInterval(loopRef.current) }
  }, [alive, started, broadcastEvent, roomId, user])

  function changeDir(d: Dir) { const c = dirRef.current; if (d[0] !== -c[0] || d[1] !== -c[1]) dirRef.current = d }

  const myWin = !alive && !oppData.alive ? score > oppData.score : (!alive && oppData.alive ? false : (alive && !oppData.alive ? true : null))
  const resultText = myWin === true ? '🏆 أنت فزت!' : myWin === false ? '😢 خسرت!' : '🤝 تعادل!'

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'Segoe UI,system-ui,sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 16px 24px' }}>
      {/* Scoreboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: G * 17 + 4, marginBottom: 12 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>أنت {alive ? '🟢' : '💀'}</div>
          <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: 18 }}>🐍 {score}</div>
        </div>
        <div style={{ color: '#475569', fontSize: 18, fontWeight: 'bold', alignSelf: 'center' }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{oppData.name} {oppData.alive ? '🟢' : '💀'}</div>
          <div style={{ color: '#f87171', fontWeight: 'bold', fontSize: 18 }}>🐍 {oppData.score}</div>
        </div>
      </div>

      {/* My board */}
      <div style={{ border: '2px solid rgba(99,102,241,0.4)', borderRadius: 10, overflow: 'hidden', display: 'grid', gridTemplateColumns: `repeat(${G},17px)`, gridTemplateRows: `repeat(${G},17px)`, marginBottom: 12 }}>
        {Array.from({ length: G * G }, (_, i) => {
          const r = Math.floor(i / G), c = i % G
          const isHead = snake[0]?.[0] === r && snake[0]?.[1] === c
          const isBody = !isHead && snake.some(s => s[0] === r && s[1] === c)
          const isFood = food[0] === r && food[1] === c
          return <div key={i} style={{ width: 17, height: 17, background: isHead ? '#4ade80' : isBody ? '#16a34a' : isFood ? '#f59e0b' : '#0a0f1e', borderRadius: isFood ? '50%' : isHead ? 3 : 0 }} />
        })}
      </div>

      {!started ? (
        <button onClick={start} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: 14, padding: '12px 32px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', marginBottom: 12 }}>▶️ ابدأ</button>
      ) : !alive ? (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ color: '#f87171', fontSize: 17, marginBottom: 4 }}>💀 نقاطك: {score}</div>
          {(gameEnded || !oppData.alive) && (
            <>
              <div style={{ color: myWin === true ? '#4ade80' : myWin === false ? '#f87171' : '#fbbf24', fontWeight: 'bold', fontSize: 16, marginBottom: 10 }}>{resultText}</div>
              <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', cursor: 'pointer' }}>← رجوع</button>
            </>
          )}
        </div>
      ) : null}

      {started && alive && <DPad changeDir={changeDir} />}
    </div>
  )
}
