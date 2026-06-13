/** 商家端统一用浏览器本地时区展示时间（不写 timeZone，由用户设备决定） */

export function resolveDisplayLocale(lang?: 'zh' | 'en'): string | undefined {
  if (lang === 'zh') return 'zh-CN'
  if (lang === 'en') return 'en-US'
  return typeof navigator !== 'undefined' && navigator.language ? navigator.language : undefined
}

function toDate(input: string | number | Date): Date | null {
  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return null
  return d
}

export function formatDateTime(
  input: string | number | Date | null | undefined,
  lang?: 'zh' | 'en',
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!input) return ''
  const d = toDate(input)
  if (!d) return typeof input === 'string' ? input : ''
  const base: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }
  return d.toLocaleString(resolveDisplayLocale(lang), { ...base, ...options })
}

export function formatDate(
  input: string | number | Date | null | undefined,
  lang?: 'zh' | 'en',
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!input) return ''
  const d = toDate(input)
  if (!d) return typeof input === 'string' ? input : ''
  const base: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  return d.toLocaleDateString(resolveDisplayLocale(lang), { ...base, ...options })
}

/** API 返回的 YYYY-MM-DD 日历日，按本地日历格式化（避免 UTC 偏移） */
export function formatCalendarDateKey(
  dateKey: string | null | undefined,
  lang?: 'zh' | 'en',
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateKey) return ''
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim())
  if (!match) return dateKey
  const local = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return formatDate(local, lang, options)
}
