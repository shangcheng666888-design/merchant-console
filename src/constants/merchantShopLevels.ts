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
