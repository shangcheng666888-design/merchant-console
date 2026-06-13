export type Lang = 'zh' | 'tw' | 'en' | 'de' | 'ja' | 'ko' | 'es' | 'it' | 'vi'

export const SUPPORTED_LANGS: Lang[] = ['zh', 'tw', 'en', 'de', 'ja', 'ko', 'es', 'it', 'vi']

export const LANG_LABELS: Record<Lang, string> = {
  zh: '简体中文',
  tw: '繁體中文',
  en: 'English',
  de: 'Deutsch',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  it: 'Italiano',
  vi: 'Tiếng Việt',
}

export function isLang(value: unknown): value is Lang {
  return (
    value === 'zh' ||
    value === 'tw' ||
    value === 'en' ||
    value === 'de' ||
    value === 'ja' ||
    value === 'ko' ||
    value === 'es' ||
    value === 'it' ||
    value === 'vi'
  )
}

/** Crisp 客服 locale */
export function crispLocale(lang: Lang): string {
  if (lang === 'vi') return 'vi'
  if (lang === 'it') return 'it'
  if (lang === 'es') return 'es'
  if (lang === 'ko') return 'ko'
  if (lang === 'ja') return 'ja'
  if (lang === 'de') return 'de'
  if (lang === 'en') return 'en'
  if (lang === 'tw') return 'zh-TW'
  return 'zh'
}

/** Intl 日期/时间 locale */
export function intlLocale(lang: Lang): string {
  if (lang === 'vi') return 'vi-VN'
  if (lang === 'it') return 'it-IT'
  if (lang === 'es') return 'es-ES'
  if (lang === 'ko') return 'ko-KR'
  if (lang === 'ja') return 'ja-JP'
  if (lang === 'de') return 'de-DE'
  if (lang === 'en') return 'en-US'
  if (lang === 'tw') return 'zh-TW'
  return 'zh-CN'
}
