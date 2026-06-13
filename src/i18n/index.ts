export type { Lang } from './lang'
export {
  SUPPORTED_LANGS,
  LANG_LABELS,
  isLang,
  crispLocale,
  intlLocale,
} from './lang'
export type { TrMap, LabelRecord, BilingualRecord, FieldRecord } from './tr'
export { tr, pickLabel, pickBilingual, pickField, pickLegacy } from './tr'
export { toTraditional, convertStringRecord, isChineseLang } from './zhConvert'
