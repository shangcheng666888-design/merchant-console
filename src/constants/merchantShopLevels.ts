import dianpu1 from '../assets/dianpu1.png'
import dianpu2 from '../assets/dianpu2.png'
import dianpu3 from '../assets/dianpu3.png'
import dianpu4 from '../assets/dianpu4.png'

export type ShopLevelKey = 'normal' | 'silver' | 'gold' | 'diamond'

export interface MerchantShopLevel {
  key: ShopLevelKey
  level: number
  nameZh: string
  nameEn: string
  sellerZh: string
  sellerEn: string
  minSales: number
  icon: string
}

export const MERCHANT_SHOP_LEVELS: MerchantShopLevel[] = [
  {
    key: 'normal',
    level: 1,
    nameZh: '普通店铺',
    nameEn: 'Standard shop',
    sellerZh: '普通卖家',
    sellerEn: 'Standard seller',
    minSales: 0,
    icon: dianpu1,
  },
  {
    key: 'silver',
    level: 2,
    nameZh: '银牌店铺',
    nameEn: 'Silver shop',
    sellerZh: '银牌卖家',
    sellerEn: 'Silver seller',
    minSales: 10000,
    icon: dianpu2,
  },
  {
    key: 'gold',
    level: 3,
    nameZh: '金牌店铺',
    nameEn: 'Gold shop',
    sellerZh: '金牌卖家',
    sellerEn: 'Gold seller',
    minSales: 50000,
    icon: dianpu3,
  },
  {
    key: 'diamond',
    level: 4,
    nameZh: '钻石店铺',
    nameEn: 'Diamond shop',
    sellerZh: '钻石卖家',
    sellerEn: 'Diamond seller',
    minSales: 100000,
    icon: dianpu4,
  },
]

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

/** 当前等级区间内，按累计销售额计算距下一等级的进度（0–100）与剩余金额 */
export function getMerchantShopLevelProgress(level: number, totalSales: number): {
  current: MerchantShopLevel
  next: MerchantShopLevel | null
  progress: number
  remain: number
} {
  const current = getMerchantShopLevel(level)
  const next = getNextMerchantShopLevel(level)
  const sales = Math.max(0, Number(totalSales) || 0)

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
