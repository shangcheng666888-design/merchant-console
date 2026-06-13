import type { Lang } from './lang'
import { toTraditional } from './zhConvert'

/** 文案 map：tw 可选（缺省简繁转换），ja/ko/es/it/vi/fr 可选（缺省回退 en） */
export type TrMap = {
  zh: string
  en: string
  de: string
  ja?: string
  ko?: string
  es?: string
  it?: string
  vi?: string
  fr?: string
  tw?: string
}

export type LabelRecord = {
  labelZh: string
  labelEn: string
  labelDe: string
  labelJa?: string
  labelKo?: string
  labelEs?: string
  labelIt?: string
  labelVi?: string
  labelFr?: string
  labelTw?: string
}

export type BilingualRecord = {
  zh: string
  en: string
  de: string
  ja?: string
  ko?: string
  es?: string
  it?: string
  vi?: string
  fr?: string
  tw?: string
}

export type FieldRecord = {
  zh: string
  en: string
  de: string
  ja?: string
  ko?: string
  es?: string
  it?: string
  vi?: string
  fr?: string
  tw?: string
}

function resolveOptional(value: string | undefined, fallback: string): string {
  return value ?? fallback
}

/** 多语文案选择（inline 场景） */
export function tr(lang: Lang, map: TrMap): string {
  if (lang === 'tw') return map.tw ?? toTraditional(map.zh)
  if (lang === 'fr') return resolveOptional(map.fr, map.en)
  if (lang === 'vi') return resolveOptional(map.vi, map.en)
  if (lang === 'it') return resolveOptional(map.it, map.en)
  if (lang === 'es') return resolveOptional(map.es, map.en)
  if (lang === 'ko') return resolveOptional(map.ko, map.en)
  if (lang === 'ja') return resolveOptional(map.ja, map.en)
  if (lang === 'de') return map.de
  if (lang === 'en') return map.en
  return map.zh
}

/** { labelZh, labelEn, labelDe } 结构 */
export function pickLabel(lang: Lang, item: LabelRecord): string {
  if (lang === 'tw') return item.labelTw ?? toTraditional(item.labelZh)
  if (lang === 'fr') return resolveOptional(item.labelFr, item.labelEn)
  if (lang === 'vi') return resolveOptional(item.labelVi, item.labelEn)
  if (lang === 'it') return resolveOptional(item.labelIt, item.labelEn)
  if (lang === 'es') return resolveOptional(item.labelEs, item.labelEn)
  if (lang === 'ko') return resolveOptional(item.labelKo, item.labelEn)
  if (lang === 'ja') return resolveOptional(item.labelJa, item.labelEn)
  if (lang === 'de') return item.labelDe
  if (lang === 'en') return item.labelEn
  return item.labelZh
}

/** { zh, en, de } 结构 */
export function pickBilingual(lang: Lang, item: BilingualRecord): string {
  if (lang === 'tw') return item.tw ?? toTraditional(item.zh)
  if (lang === 'fr') return resolveOptional(item.fr, item.en)
  if (lang === 'vi') return resolveOptional(item.vi, item.en)
  if (lang === 'it') return resolveOptional(item.it, item.en)
  if (lang === 'es') return resolveOptional(item.es, item.en)
  if (lang === 'ko') return resolveOptional(item.ko, item.en)
  if (lang === 'ja') return resolveOptional(item.ja, item.en)
  if (lang === 'de') return item.de
  if (lang === 'en') return item.en
  return item.zh
}

/** nameZh / nameEn / nameDe 等字段 */
export function pickField(lang: Lang, fields: FieldRecord): string {
  if (lang === 'tw') return fields.tw ?? toTraditional(fields.zh)
  if (lang === 'fr') return resolveOptional(fields.fr, fields.en)
  if (lang === 'vi') return resolveOptional(fields.vi, fields.en)
  if (lang === 'it') return resolveOptional(fields.it, fields.en)
  if (lang === 'es') return resolveOptional(fields.es, fields.en)
  if (lang === 'ko') return resolveOptional(fields.ko, fields.en)
  if (lang === 'ja') return resolveOptional(fields.ja, fields.en)
  if (lang === 'de') return fields.de
  if (lang === 'en') return fields.en
  return fields.zh
}

/** 兼容旧 zh/en 对象 */
export function pickLegacy(
  lang: Lang,
  zh: string,
  en: string,
  de?: string,
  ja?: string,
  ko?: string,
  es?: string,
  it?: string,
  vi?: string,
  fr?: string,
): string {
  if (lang === 'tw') return toTraditional(zh)
  if (lang === 'fr') return resolveOptional(fr, en)
  if (lang === 'vi') return resolveOptional(vi, en)
  if (lang === 'it') return resolveOptional(it, en)
  if (lang === 'es') return resolveOptional(es, en)
  if (lang === 'ko') return resolveOptional(ko, en)
  if (lang === 'ja') return resolveOptional(ja, en)
  if (lang === 'de') return de ?? en
  if (lang === 'en') return en
  return zh
}
