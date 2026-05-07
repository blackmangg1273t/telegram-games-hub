'use client'
import { useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabase'

type GameEvent = {
  type: string
  payload: Record<string, unknown>
  sender_id: number
  timestamp: number
}

type GameSyncOptions = {
  roomId: string
  userId: number
  onEvent: (event: GameEvent) => void
}

export function useGameSync({ roomId, userId, onEvent }: GameSyncOptions) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const broadcastEvent = useCallback(async (type: string, payload: Record<string, unknown>) => {
    if (!channelRef.current) return
    await channelRef.current.send({
      type: 'broadcast',
      event: 'game_event',
      payload: {
        type,
        payload,
        sender_id: userId,
        timestamp: Date.now(),
      },
    })
  }, [userId])

  useEffect(() => {
    if (!roomId || !userId) return

    const channel = supabase.channel(`game_sync:${roomId}`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on('broadcast', { event: 'game_event' }, ({ payload }) => {
        onEventRef.current(payload as GameEvent)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [roomId, userId])

  return { broadcastEvent }
}
