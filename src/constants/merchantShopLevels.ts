import dianpu1 from '../assets/dianpu1.png'
import dianpu2 from '../assets/dianpu2.png'
import dianpu3 from '../assets/dianpu3.png'
import dianpu4 from '../assets/dianpu4.png'
import type { Lang } from '../i18n/lang'
import { pickField } from '../i18n/tr'

export type ShopLevelKey = 'normal' | 'silver' | 'gold' | 'diamond'

export interface MerchantShopLevel {
  key: ShopLevelKey
  level: number
  nameZh: string
  nameEn: string
  nameDe: string
  nameJa: string
  nameKo: string
  nameEs: string
  nameIt: string
  nameVi: string
  nameFr: string
  sellerZh: string
  sellerEn: string
  sellerDe: string
  sellerJa: string
  sellerKo: string
  sellerEs: string
  sellerIt: string
  sellerVi: string
  sellerFr: string
  minSales: number
  icon: string
}

export const MERCHANT_SHOP_LEVELS: MerchantShopLevel[] = [
  {
    key: 'normal',
    level: 1,
    nameZh: '普通店铺',
    nameEn: 'Standard shop',
    nameDe: 'Standard-Shop',
    nameJa: 'スタンダードショップ',
    nameKo: '스탠다드 샵',
    nameEs: 'Tienda estándar',
    nameIt: 'Negozio standard',
    nameVi: 'Cửa hàng tiêu chuẩn',
    nameFr: 'Boutique standard',
    sellerZh: '普通卖家',
    sellerEn: 'Standard seller',
    sellerDe: 'Standard-Verkäufer',
    sellerJa: 'スタンダードセラー',
    sellerKo: '스탠다드 셀러',
    sellerEs: 'Vendedor estándar',
    sellerIt: 'Venditore standard',
    sellerVi: 'Người bán tiêu chuẩn',
    sellerFr: 'Vendeur standard',
    minSales: 0,
    icon: dianpu1,
  },
  {
    key: 'silver',
    level: 2,
    nameZh: '银牌店铺',
    nameEn: 'Silver shop',
    nameDe: 'Silber-Shop',
    nameJa: 'シルバーショップ',
    nameKo: '실버 샵',
    nameEs: 'Tienda plata',
    nameIt: 'Negozio argento',
    nameVi: 'Cửa hàng bạc',
    nameFr: 'Boutique argent',
    sellerZh: '银牌卖家',
    sellerEn: 'Silver seller',
    sellerDe: 'Silber-Verkäufer',
    sellerJa: 'シルバーセラー',
    sellerKo: '실버 셀러',
    sellerEs: 'Vendedor plata',
    sellerIt: 'Venditore argento',
    sellerVi: 'Người bán bạc',
    sellerFr: 'Vendeur argent',
    minSales: 10000,
    icon: dianpu2,
  },
  {
    key: 'gold',
    level: 3,
    nameZh: '金牌店铺',
    nameEn: 'Gold shop',
    nameDe: 'Gold-Shop',
    nameJa: 'ゴールドショップ',
    nameKo: '골드 샵',
    nameEs: 'Tienda oro',
    nameIt: 'Negozio oro',
    nameVi: 'Cửa hàng vàng',
    nameFr: 'Boutique or',
    sellerZh: '金牌卖家',
    sellerEn: 'Gold seller',
    sellerDe: 'Gold-Verkäufer',
    sellerJa: 'ゴールドセラー',
    sellerKo: '골드 셀러',
    sellerEs: 'Vendedor oro',
    sellerIt: 'Venditore oro',
    sellerVi: 'Người bán vàng',
    sellerFr: 'Vendeur or',
    minSales: 50000,
    icon: dianpu3,
  },
  {
    key: 'diamond',
    level: 4,
    nameZh: '钻石店铺',
    nameEn: 'Diamond shop',
    nameDe: 'Diamant-Shop',
    nameJa: 'ダイヤモンドショップ',
    nameKo: '다이아몬드 샵',
    nameEs: 'Tienda diamante',
    nameIt: 'Negozio diamante',
    nameVi: 'Cửa hàng kim cương',
    nameFr: 'Boutique diamant',
    sellerZh: '钻石卖家',
    sellerEn: 'Diamond seller',
    sellerDe: 'Diamant-Verkäufer',
    sellerJa: 'ダイヤモンドセラー',
    sellerKo: '다이아몬드 셀러',
    sellerEs: 'Vendedor diamante',
    sellerIt: 'Venditore diamante',
    sellerVi: 'Người bán kim cương',
    sellerFr: 'Vendeur diamant',
    minSales: 100000,
    icon: dianpu4,
  },
]

export function shopLevelDisplayName(level: MerchantShopLevel, lang: Lang): string {
  return pickField(lang, { zh: level.nameZh, en: level.nameEn, de: level.nameDe, ja: level.nameJa, ko: level.nameKo, es: level.nameEs, it: level.nameIt, vi: level.nameVi, fr: level.nameFr })
}

export function shopLevelSellerTitle(level: MerchantShopLevel, lang: Lang): string {
  return pickField(lang, { zh: level.sellerZh, en: level.sellerEn, de: level.sellerDe, ja: level.sellerJa, ko: level.sellerKo, es: level.sellerEs, it: level.sellerIt, vi: level.sellerVi, fr: level.sellerFr })
}

export function mapShopLevelNumber(level: number): ShopLevelKey {
  if (level >= 4) return 'diamond'
  if (level >= 3) return 'gold'
  if (level >= 2) return 'silver'
  return 'normal'
}

export function getMerchantShopLevel(level: number): MerchantShopLevel {
  const key = mapShopLevelNumber(level)
  return MERCHANT_SHOP_LEVELS.find((item) => item.key === key) ?? MERCHANT_SHOP_LEVELS[0]
}

export function getNextMerchantShopLevel(level: number): MerchantShopLevel | null {
  const index = MERCHANT_SHOP_LEVELS.findIndex((item) => item.key === mapShopLevelNumber(level))
  if (index < 0 || index >= MERCHANT_SHOP_LEVELS.length - 1) return null
  return MERCHANT_SHOP_LEVELS[index + 1] ?? null
}

export interface MerchantShopLevelProgressOptions {
  levelLocked?: boolean
  levelSalesBaseline?: number | null
}

/** 锁定态：跳过已达门槛，找第一个尚未达到的下一档 */
export function findNextUnmetShopLevel(level: number, totalSales: number): MerchantShopLevel | null {
  const sales = Math.max(0, Number(totalSales) || 0)
  const currentIndex = MERCHANT_SHOP_LEVELS.findIndex((item) => item.key === mapShopLevelNumber(level))
  const startIndex = currentIndex < 0 ? 1 : currentIndex + 1
  for (let i = startIndex; i < MERCHANT_SHOP_LEVELS.length; i += 1) {
    const tier = MERCHANT_SHOP_LEVELS[i]
    if (sales < tier.minSales) {
      return tier
    }
  }
  return null
}

/** 当前等级区间内，按累计销售额计算距下一等级的进度（0–100）与剩余金额 */
export function getMerchantShopLevelProgress(
  level: number,
  totalSales: number,
  opts?: MerchantShopLevelProgressOptions,
): {
  current: MerchantShopLevel
  next: MerchantShopLevel | null
  progress: number
  remain: number
} {
  const current = getMerchantShopLevel(level)
  const sales = Math.max(0, Number(totalSales) || 0)

  if (opts?.levelLocked) {
    const baseline = Math.max(
      0,
      Number(opts.levelSalesBaseline ?? sales) || 0,
    )
    const next = findNextUnmetShopLevel(level, sales)
    if (!next) {
      return { current, next: null, progress: 100, remain: 0 }
    }
    const span = next.minSales - baseline
    const progress =
      span > 0
        ? Math.min(100, Math.max(0, ((sales - baseline) / span) * 100))
        : sales >= next.minSales
          ? 100
          : 0
    const remain = Math.max(0, next.minSales - sales)
    return { current, next, progress, remain }
  }

  const next = getNextMerchantShopLevel(level)

  if (!next) {
    return { current, next: null, progress: 100, remain: 0 }
  }

  const span = next.minSales - current.minSales
  const progress =
    span > 0
      ? Math.min(100, Math.max(0, ((sales - current.minSales) / span) * 100))
      : sales >= next.minSales
        ? 100
        : 0
  const remain = Math.max(0, next.minSales - sales)

  return { current, next, progress, remain }
}
