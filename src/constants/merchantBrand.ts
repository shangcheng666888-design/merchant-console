import companyLogo from '../assets/company-logo.png'
import type { Lang } from '../i18n/lang'
import { tr } from '../i18n/tr'

const brandName = import.meta.env.VITE_BRAND_NAME?.trim() || 'TikTok mall'
const brandLogoUrl = import.meta.env.VITE_BRAND_LOGO_URL?.trim()

export function getMerchantBrand(lang: Lang) {
  return {
    name: brandName,
    productLine: tr(lang, {
      zh: '卖家中心',
      en: 'Seller Center',
      de: 'Verkäuferzentrum',
      ja: 'セラーセンター',
      ko: '셀러 센터',
      es: 'Centro de vendedores',
      it: 'Centro venditori',
      vi: 'Trung tâm người bán',
      fr: 'Centre vendeur',
    }),
    tagline: tr(lang, {
      zh: '海外仓一键代发，速通无忧',
      en: 'Overseas warehouse dropshipping, fast and worry-free',
      de: 'Dropshipping aus Auslandslagern – schnell und sorgenfrei',
      ja: '海外倉庫からのドロップシッピング、迅速で安心',
      ko: '해외 창고 드롭배송, 빠르고 안심',
      es: 'Dropshipping desde almacenes en el extranjero, rápido y sin preocupaciones',
      it: 'Dropshipping da magazzini esteri, veloce e senza pensieri',
      vi: 'Dropship từ kho nước ngoài, nhanh chóng và yên tâm',
      fr: 'Dropshipping depuis des entrepôts à l\'étranger, rapide et sans souci',
    }),
    logo: brandLogoUrl || companyLogo,
  }
}
