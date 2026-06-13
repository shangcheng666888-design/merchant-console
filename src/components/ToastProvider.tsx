import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLang } from '../context/LangContext'
import { tr } from '../i18n/tr'

export type ToastType = 'success' | 'error'

export interface ToastPayload {
  title: string
  message?: string
  type?: ToastType
}

interface ToastState extends ToastPayload {
  type: ToastType
}

interface ToastContextValue {
  showToast: (input: string | ToastPayload, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const TOAST_DURATION = {
  success: 2800,
  error: 4000,
} as const

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lang } = useLang()
  const [toast, setToast] = useState<ToastState | null>(null)
  const timerRef = useRef<number | null>(null)
  const toastSeparator = tr(lang, { zh: '：', en: ': ', de: ': ', ja: ': ', ko: ': ', es: ': ', it: ': ', vi: ': ', fr: ': ' })

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const showToast = useCallback(
    (input: string | ToastPayload, legacyType: ToastType = 'success') => {
      const next: ToastState =
        typeof input === 'string'
          ? { title: input, type: legacyType }
          : {
              title: input.title,
              message: input.message,
              type: input.type ?? 'success',
            }

      clearTimer()
      setToast(next)

      const duration = TOAST_DURATION[next.type]
      timerRef.current = window.setTimeout(() => {
        setToast(null)
      }, duration)
    },
    [clearTimer],
  )

  useEffect(
    () => () => {
      clearTimer()
    },
    [clearTimer],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="app-toast" role="status">
          <span className="app-toast-icon" aria-hidden="true">
            {toast.type === 'error' ? '✕' : '✔'}
          </span>
          <span className="app-toast-text">
            {toast.message ? `${toast.title}${toastSeparator}${toast.message}` : toast.title}
          </span>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
