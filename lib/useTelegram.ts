'use client'
import { useEffect, useState } from 'react'

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

  useEffect(() => {
    const webApp = window.Telegram?.WebApp

    if (webApp && webApp.initDataUnsafe?.user) {
      // ✅ فتح جوه تيليجرام كـ Mini App - بيانات حقيقية دايماً
      webApp.ready()
      webApp.expand()
      setTg(webApp)
      setUser(webApp.initDataUnsafe.user)
      setIsReady(true)
      return
    }

    // Dev mode fallback فقط - مش بيشتغل في Production
    if (process.env.NODE_ENV === 'development') {
      setUser({
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      })
    }

    setIsReady(true)
  }, [])

  return { tg, user, isReady }
}
