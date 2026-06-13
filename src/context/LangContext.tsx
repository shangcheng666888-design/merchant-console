import React, { createContext, useContext, useEffect, useState } from 'react'
import { crispLocale, isLang, type Lang } from '../i18n/lang'

export type { Lang }

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
}

const LangContext = createContext<LangContextValue | undefined>(undefined)

const STORAGE_KEY = 'site_lang'

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'zh'
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isLang(stored)) return stored
    } catch {
      // ignore
    }
    return 'zh'
  })

  const setLang = (next: Lang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }, [lang])

  useEffect(() => {
    try {
      const crisp = (window as Window & { $crisp?: { push: (cmd: unknown[]) => void } }).$crisp
      if (crisp && typeof crisp.push === 'function') {
        crisp.push(['config', 'locale', [crispLocale(lang)]])
      }
    } catch {
      // ignore
    }
  }, [lang])

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) {
    throw new Error('useLang must be used within LangProvider')
  }
  return ctx
}
