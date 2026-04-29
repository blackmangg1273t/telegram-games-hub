'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function JoinRoom() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function join() {
    if (code.length < 6 || loading) return
    setLoading(true)
    setError('')

    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (!room) {
      setError('❌ الكود غير صحيح أو الغرفة غير موجودة')
      setLoading(false)
      return
    }

    if (room.status === 'finished') {
      setError('⚠️ اللعبة انتهت بالفعل')
      setLoading(false)
      return
    }

    router.push(`/rooms/${room.id}`)
  }

  return (
    <div className="min-h-screen flex flex-col p-6 pt-12">
      <button onClick={() => router.back()} className="self-start text-gray-400 mb-8">← رجوع</button>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-7xl mb-6">🔑</div>
        <h1 className="text-2xl font-bold mb-2">ادخل بكود</h1>
        <p className="text-gray-400 mb-8 text-center">اطلب الكود من صاحب الغرفة وادخله هنا</p>

        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
          placeholder="XXXXXX"
          className="w-full max-w-xs bg-white/10 rounded-2xl px-4 py-4 text-3xl text-center font-mono font-bold tracking-[0.5em] outline-none border border-white/10 focus:border-indigo-500 mb-4 uppercase"
          maxLength={6}
        />

        {error && (
          <div className="text-red-400 text-sm mb-4 text-center">{error}</div>
        )}

        <button
          onClick={join}
          disabled={code.length < 6 || loading}
          className="w-full max-w-xs bg-indigo-600 text-white rounded-2xl py-4 font-bold text-lg disabled:opacity-40"
        >
          {loading ? '⏳ جاري البحث...' : '🚀 ادخل الغرفة'}
        </button>
      </div>
    </div>
  )
}
