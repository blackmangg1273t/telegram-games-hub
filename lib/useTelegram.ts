'use client'
import { useEffect, useState, useRef } from 'react'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  language_code?: string
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    chat?: { id: number; type: string; title?: string }
    start_param?: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  ready(): void
  expand(): void
  close(): void
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    show(): void
    hide(): void
    enable(): void
    disable(): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export function useTelegram() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const authAttempted = useRef(false)

  useEffect(() => {
    if (authAttempted.current) return
    authAttempted.current = true

    async function init() {
      const webApp = window.Telegram?.WebApp

      // Determine initData to send
      let initDataToSend: string | null = null

      if (webApp?.initData) {
        // Real Telegram Mini App
        webApp.ready()
        webApp.expand()
        setTg(webApp)
        initDataToSend = webApp.initData
      } else if (process.env.NODE_ENV === 'development') {
        // Dev mode fallback
        initDataToSend = 'dev_mode'
      } else {
        // Not in Telegram and not dev mode
        setIsReady(true)
        return
      }

      // Validate with server
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: initDataToSend }),
        })

        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser(data.user)
          }
        }
      } catch (err) {
        console.error('Auth failed:', err)
      }

      setIsReady(true)
    }

    init()
  }, [])

  return { tg, user, isReady }
}
