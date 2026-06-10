import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useMerchantShop } from '../context/MerchantShopContext'
import { useMerchantDashboardBrief } from '../hooks/useMerchantDashboardBrief'
import dianpu1 from '../assets/dianpu1.png'
import dianpu2 from '../assets/dianpu2.png'
import dianpu3 from '../assets/dianpu3.png'
import dianpu4 from '../assets/dianpu4.png'

function getShopLevelLabel(level: number | undefined, lang: 'zh' | 'en'): string {
  const lvl = typeof level === 'number' ? level : 1
  if (lvl >= 4) return lang === 'zh' ? '钻石店铺' : 'Diamond'
  if (lvl >= 3) return lang === 'zh' ? '金牌店铺' : 'Gold'
  if (lvl >= 2) return lang === 'zh' ? '银牌店铺' : 'Silver'
  return lang === 'zh' ? '普通店铺' : 'Standard'
}

function getShopLevelIcon(level: number | undefined): string {
  const lvl = typeof level === 'number' ? level : 1
  if (lvl >= 4) return dianpu4
  if (lvl >= 3) return dianpu3
  if (lvl >= 2) return dianpu2
  return dianpu1
}

const MerchantMobileSummary: React.FC = () => {
  const { lang } = useLang()
  const { shop } = useMerchantShop()
  const { pendingOrders, todaySales } = useMerchantDashboardBrief(true)

  if (!shop) return null

  return (
    <div className="mc-mobile-summary">
      <div className="mc-mobile-summary-shop">
        {shop.logo ? (
          <img src={shop.logo} alt="" className="mc-mobile-summary-avatar" />
        ) : (
          <div className="mc-mobile-summary-avatar mc-mobile-summary-avatar--fallback">
            {shop.name.slice(0, 1) || '店'}
          </div>
        )}
        <div className="mc-mobile-summary-meta">
          <div className="mc-mobile-summary-name">{shop.name}</div>
          <div className="mc-mobile-summary-level">
            <img src={getShopLevelIcon(shop.level)} alt="" aria-hidden="true" />
            {getShopLevelLabel(shop.level, lang)}
          </div>
        </div>
      </div>
      <div className="mc-mobile-summary-stats">
        <div className="mc-mobile-summary-stat">
          <span className="mc-mobile-summary-stat-label">
            {lang === 'zh' ? '今日销售' : 'Today'}
          </span>
          <span className="mc-mobile-summary-stat-value">${todaySales.toFixed(2)}</span>
        </div>
        <Link to="/orders" className="mc-mobile-summary-stat mc-mobile-summary-stat--link">
          <span className="mc-mobile-summary-stat-label">
            {lang === 'zh' ? '待处理' : 'Pending'}
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
