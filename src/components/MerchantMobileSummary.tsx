import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useMerchantShop } from '../context/MerchantShopContext'
import { useMerchantDashboardBrief } from '../hooks/useMerchantDashboardBrief'
import { getMerchantShopLevel, shopLevelDisplayName } from '../constants/merchantShopLevels'
import { tr } from '../i18n'

const MerchantMobileSummary: React.FC = () => {
  const { lang } = useLang()
  const { shop } = useMerchantShop()
  const { pendingOrders, todaySales } = useMerchantDashboardBrief(true)

  if (!shop) return null

  const levelInfo = getMerchantShopLevel(shop.level)

  return (
    <div className="mc-mobile-summary">
      <div className="mc-mobile-summary-shop">
        {shop.logo ? (
          <img src={shop.logo} alt="" className="mc-mobile-summary-avatar" />
        ) : (
          <div className="mc-mobile-summary-avatar mc-mobile-summary-avatar--fallback">
            {shop.name.slice(0, 1) || tr(lang, { zh: '店', en: 'S', de: 'S', ja: '店', ko: '매', es: 'T', it: 'N', vi: 'C', fr: 'S' })}
          </div>
        )}
        <div className="mc-mobile-summary-meta">
          <div className="mc-mobile-summary-name">{shop.name}</div>
          <div className="mc-mobile-summary-level">
            <img src={levelInfo.icon} alt="" aria-hidden="true" />
            {shopLevelDisplayName(levelInfo, lang)}
          </div>
        </div>
      </div>
      <div className="mc-mobile-summary-stats">
        <div className="mc-mobile-summary-stat">
          <span className="mc-mobile-summary-stat-label">
            {tr(lang, { zh: '今日销售', en: 'Today', de: 'Heute', ja: '本日の売上', ko: '오늘 매출', es: 'Hoy', it: 'Oggi', vi: 'Hôm nay', fr: 'Aujourd\'hui' })}
          </span>
          <span className="mc-mobile-summary-stat-value">${todaySales.toFixed(2)}</span>
        </div>
        <Link to="/orders" className="mc-mobile-summary-stat mc-mobile-summary-stat--link">
          <span className="mc-mobile-summary-stat-label">
            {tr(lang, { zh: '待处理', en: 'Pending', de: 'Offen', ja: '未処理', ko: '대기 중', es: 'Pendiente', it: 'In attesa', vi: 'Chờ xử lý', fr: 'En attente' })}
          </span>
          <span className="mc-mobile-summary-stat-value">
            {pendingOrders}
            {pendingOrders > 0 && (
              <span className="mc-mobile-summary-badge" aria-hidden="true" />
            )}
          </span>
        </Link>
      </div>
    </div>
  )
}

export default MerchantMobileSummary
