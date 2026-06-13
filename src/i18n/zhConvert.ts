import * as OpenCC from 'opencc-js'

let converter: ((text: string) => string) | null = null

function getConverter(): (text: string) => string {
  if (!converter) {
    converter = OpenCC.Converter({ from: 'cn', to: 'tw' }) as (text: string) => string
  }
  return converter
}

/** 简体 → 台湾繁体 */
export function toTraditional(text: string): string {
  if (!text) return text
  try {
    return getConverter()(text)
  } catch {
    return text
  }
}

/** 批量转换对象内所有字符串值（用于登录页等大块 copy） */
export function convertStringRecord<T extends Record<string, string>>(obj: T): T {
  const out = {} as T
  for (const key of Object.keys(obj) as (keyof T)[]) {
    out[key] = toTraditional(String(obj[key])) as T[keyof T]
  }
  return out
}

export function isChineseLang(lang: string): boolean {
  return lang === 'zh' || lang === 'tw'
}
