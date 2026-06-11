import companyLogo from '../assets/company-logo.png'

const brandName = import.meta.env.VITE_BRAND_NAME?.trim() || 'TikTok mall'
const brandLogoUrl = import.meta.env.VITE_BRAND_LOGO_URL?.trim()

export function getMerchantBrand(lang: 'zh' | 'en') {
  return {
    name: brandName,
    productLine: lang === 'zh' ? '卖家中心' : 'Seller Center',
    tagline:
      lang === 'zh'
        ? '海外仓一键代发，速通无忧'
        : 'Overseas warehouse dropshipping, fast and worry-free',
    logo: brandLogoUrl || companyLogo,
  }
}
