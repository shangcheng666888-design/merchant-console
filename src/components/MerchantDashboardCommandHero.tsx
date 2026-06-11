import React from 'react'
import AnimatedMetric, { type AnimatedMetricFormat } from './AnimatedMetric'
import {
  getMerchantShopLevel,
  getNextMerchantShopLevel,
  type MerchantShopLevel,
} from '../constants/merchantShopLevels'

function HealthRing({ value, label }: { value: number; label: string }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, value)) / 100
  const offset = circumference * (1 - progress)

  return (
    <div className="merchant-cmd-health" aria-label={`${label} ${value}`}>
      <svg className="merchant-cmd-health-svg" viewBox="0 0 88 88" aria-hidden="true">
        <defs>
          <linearGradient id="mc-health-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#5b6cff" />
          </linearGradient>
        </defs>
        <circle cx="44" cy="44" r={radius} className="merchant-cmd-health-track" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          className="merchant-cmd-health-progress"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="merchant-cmd-health-center">
        <AnimatedMetric value={value} format="number" className="merchant-cmd-health-value" />
        <span className="merchant-cmd-health-label">{label}</span>
      </div>
    </div>
  )
}

type CmdActionKey = 'orders' | 'plan' | 'finance' | 'wallet'

function CmdActionIcon({ name }: { name: CmdActionKey }) {
  const icons: Record<CmdActionKey, React.ReactNode> = {
    orders: (
      <path d="M8 5.2h8l1.4 2v10.4c0 .6-.5 1-1 1H7.6c-.5 0-1-.4-1-1V7.2L8 5.2zM9.2 12h5.6" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    ),
    plan: (
      <path d="M6 16.2V8.5l3-2.2 3 1.8 4-3.4v7.5M6 16.2h12" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
    finance: (
      <>
        <rect x="5" y="7" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M8 11h8M8 14h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
    wallet: (
      <>
        <rect x="4" y="7" width="16" height="11" rx="2.2" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M4 10.5h16M16 13.5h2.5v2H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

type MetricIconName = 'sales' | 'orders' | 'profit' | 'products' | 'unsettled'

function MetricIcon({ name }: { name: MetricIconName }) {
  const icons: Record<MetricIconName, React.ReactNode> = {
    sales: (
      <>
        <rect x="5" y="7" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M12 9.5v5M10 12h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
    orders: (
      <path d="M8 5.2h8l1.4 2v10.4c0 .6-.5 1-1 1H7.6c-.5 0-1-.4-1-1V7.2L8 5.2z" stroke="currentColor" strokeWidth="1.4" fill="none" />
    ),
    profit: (
      <path d="M6 16.2V9.8l3-2.2 3 1.8 4-3.4v7.2H6z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    ),
    products: (
      <>
        <rect x="6" y="8" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" stroke="currentColor" strokeWidth="1.4" fill="none" />
      </>
    ),
    unsettled: (
      <>
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M12 9v4l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
  }
  return (
    <span className={`merchant-cmd-metric-icon merchant-cmd-metric-icon--${name}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="16" height="16">{icons[name]}</svg>
    </span>
  )
}

interface MetricCellProps {
  icon: MetricIconName
  label: string
  value: number
  format: AnimatedMetricFormat
  valueClassName?: string
}

function MetricCell({ icon, label, value, format, valueClassName = 'merchant-cmd-metric-value' }: MetricCellProps) {
  return (
    <div className="merchant-cmd-metric-cell">
      <MetricIcon name={icon} />
      <span className="merchant-cmd-metric-label">{label}</span>
      <AnimatedMetric value={value} format={format} className={valueClassName} />
    </div>
  )
}

interface CommandHeroProps {
  lang: 'zh' | 'en'
  shopName: string
  shopLogo: string | null
  shopLevel: number
  healthIndex: number
  goodRate: number
  creditScore: number
  followers: number
  totalSales: number
  orderCount: number
  totalProfit: number
  productCount: number
  todaySales: number
  todayOrders: number
  todayProfit: number
  unsettledAmount: number
  pendingOrders: number
  onNavigate: (path: string) => void
}

function levelProgressCopy(
  lang: 'zh' | 'en',
  _current: MerchantShopLevel,
  next: MerchantShopLevel | null,
  totalSales: number,
): { progress: number; label: string } {
  if (!next) {
    return {
      progress: 100,
      label: lang === 'zh' ? '已达最高等级' : 'Max level reached',
    }
  }
  const progress = next.minSales > 0 ? Math.min(100, (totalSales / next.minSales) * 100) : 100
  const remain = Math.max(0, next.minSales - totalSales)
  const nextName = lang === 'zh' ? next.nameZh : next.nameEn
  return {
    progress,
    label:
      lang === 'zh'
        ? `距${nextName}还差 $${remain.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : `$${remain.toLocaleString(undefined, { maximumFractionDigits: 0 })} to ${next.nameEn}`,
  }
}

const MerchantDashboardCommandHero: React.FC<CommandHeroProps> = ({
  lang,
  shopName,
  shopLogo,
  shopLevel,
  healthIndex,
  goodRate,
  creditScore,
  followers,
  totalSales,
  orderCount,
  totalProfit,
  productCount,
  todaySales,
  todayOrders,
  todayProfit,
  unsettledAmount,
  pendingOrders,
  onNavigate,
}) => {
  const levelInfo = getMerchantShopLevel(shopLevel)
  const nextLevel = getNextMerchantShopLevel(shopLevel)
  const { progress: levelProgress, label: levelProgressLabel } = levelProgressCopy(lang, levelInfo, nextLevel, totalSales)

  const dateLabel = new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  const quickActions: { key: CmdActionKey; path: string; zh: string; en: string; badge: number; primary: boolean }[] = [
    { key: 'orders', path: '/orders', zh: '待发货', en: 'Fulfillment', badge: pendingOrders, primary: pendingOrders > 0 },
    { key: 'plan', path: '/plan', zh: '运营计划', en: 'Growth plan', badge: 0, primary: false },
    { key: 'finance', path: '/finance', zh: '财务报告', en: 'Finance', badge: 0, primary: false },
    { key: 'wallet', path: '/wallet', zh: '我的钱包', en: 'Wallet', badge: 0, primary: false },
  ]

  const vitals = [
    {
      label: lang === 'zh' ? '好评率' : 'Rating',
      value: <AnimatedMetric value={goodRate} format="percent" decimals={1} />,
      tone: 'emerald',
    },
    {
      label: lang === 'zh' ? '信用分' : 'Credit',
      value: <AnimatedMetric value={creditScore} format="number" />,
      tone: 'blue',
    },
    {
      label: lang === 'zh' ? '关注' : 'Followers',
      value: <AnimatedMetric value={followers} format="compact" />,
      tone: 'violet',
    },
  ]

  return (
    <section className="merchant-dashboard-hero merchant-dashboard-hero--v2 merchant-dashboard-hero--cmd merchant-dashboard-hero--animated">
      <div className="merchant-dashboard-hero-bg" aria-hidden="true" />
      <div className="merchant-dashboard-hero-shine" aria-hidden="true" />
      <div className="merchant-dashboard-hero-grid" aria-hidden="true" />
      <div className="merchant-dashboard-hero-orb" aria-hidden="true" />
      <span className="merchant-dashboard-hero-corner merchant-dashboard-hero-corner--tl" aria-hidden="true" />
      <span className="merchant-dashboard-hero-corner merchant-dashboard-hero-corner--br" aria-hidden="true" />

      <div className="merchant-cmd-inner">
        <header className="merchant-cmd-header">
          <div className="merchant-cmd-identity">
            <div className={`merchant-cmd-shop-emblem merchant-cmd-shop-emblem--${levelInfo.key}`}>
              <img
                src={shopLogo || levelInfo.icon}
                alt=""
                className={`merchant-cmd-shop-emblem-img${shopLogo ? '' : ' merchant-cmd-shop-emblem-img--icon'}`}
              />
            </div>
            <div className="merchant-cmd-identity-body">
              <h2 className="merchant-cmd-shop-name">{shopName || (lang === 'zh' ? '我的店铺' : 'My shop')}</h2>
              <span className={`merchant-cmd-level-badge merchant-cmd-level-badge--${levelInfo.key}`}>
                <img src={levelInfo.icon} alt="" className="merchant-cmd-level-badge-icon" />
                {lang === 'zh' ? levelInfo.sellerZh : levelInfo.sellerEn}
              </span>
              <button type="button" className="merchant-cmd-level-link" onClick={() => onNavigate('/plan')}>
                {lang === 'zh' ? '查看等级权益' : 'View level benefits'}
              </button>
              <div className="merchant-cmd-level-progress">
                <div className="merchant-cmd-level-progress-meta">
                  <span>{levelProgressLabel}</span>
                  <strong>{Math.round(levelProgress)}%</strong>
                </div>
                <span className="merchant-cmd-level-progress-track" aria-hidden="true">
                  <span
                    className="merchant-cmd-level-progress-fill"
                    style={{ '--mc-bar-scale': String(Math.min(1, levelProgress / 100)) } as React.CSSProperties}
                  />
                </span>
              </div>
            </div>
          </div>
          <div className="merchant-cmd-header-meta">
            <span className="merchant-cmd-date">{dateLabel}</span>
            <div className="merchant-cmd-total-sales">
              <span className="merchant-cmd-total-sales-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path
                    d="M6 16.2V9.8l3-2.2 3 1.8 4-3.4v7.2H6z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinejoin="round"
                  />
                  <path d="M8 13.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <div className="merchant-cmd-total-sales-body">
                <span className="merchant-cmd-total-sales-label">
                  {lang === 'zh' ? '累计销售额' : 'Total sales'}
                </span>
                <AnimatedMetric
                  value={totalSales}
                  format="currency"
                  decimals={0}
                  className="merchant-cmd-total-sales-value"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="merchant-cmd-body">
          <div className="merchant-cmd-metrics-panel">
            <div className="merchant-cmd-metrics-row merchant-cmd-metrics-row--total">
              <MetricCell
                icon="orders"
                label={lang === 'zh' ? '总订单' : 'Total orders'}
                value={orderCount}
                format="number"
              />
              <MetricCell
                icon="profit"
                label={lang === 'zh' ? '总利润' : 'Total profit'}
                value={totalProfit}
                format="currency"
              />
              <MetricCell
                icon="products"
                label={lang === 'zh' ? '商品总数' : 'Total products'}
                value={productCount}
                format="number"
              />
            </div>
            <div className="merchant-cmd-metrics-row merchant-cmd-metrics-row--today">
              <MetricCell
                icon="sales"
                label={lang === 'zh' ? '今日销售额' : "Today's sales"}
                value={todaySales}
                format="currency"
                valueClassName="merchant-cmd-metric-value merchant-cmd-metric-value--hero"
              />
              <MetricCell
                icon="orders"
                label={lang === 'zh' ? '今日订单' : "Today's orders"}
                value={todayOrders}
                format="number"
              />
              <MetricCell
                icon="profit"
                label={lang === 'zh' ? '预计利润' : 'Expected profit'}
                value={todayProfit}
                format="currency"
                valueClassName="merchant-cmd-metric-value merchant-cmd-metric-value--gold"
              />
              <MetricCell
                icon="unsettled"
                label={lang === 'zh' ? '待结算金额' : 'Unsettled amount'}
                value={unsettledAmount}
                format="currency"
              />
            </div>
          </div>

          <div className="merchant-cmd-side-board">
            <HealthRing value={healthIndex} label={lang === 'zh' ? '健康综合分' : 'Health score'} />
            <p className="merchant-cmd-health-note">
              {lang === 'zh' ? '综合好评率与信用分' : 'Combined rating & credit score'}
            </p>
            <div className="merchant-cmd-vitals">
              {vitals.map((item) => (
                <div key={item.label} className={`merchant-cmd-vital merchant-cmd-vital--${item.tone}`}>
                  <span className="merchant-cmd-vital-label">{item.label}</span>
                  <span className="merchant-cmd-vital-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="merchant-cmd-actions">
          {quickActions.map((action) => (
            <button
              key={action.key}
              type="button"
              className={`merchant-cmd-action${action.primary ? ' merchant-cmd-action--primary' : ''}`}
              onClick={() => onNavigate(action.path)}
            >
              <span className="merchant-cmd-action-icon">
                <CmdActionIcon name={action.key} />
              </span>
              <span className="merchant-cmd-action-text">
                {lang === 'zh' ? action.zh : action.en}
                {action.badge > 0 ? (
                  <span className="merchant-cmd-action-badge">{action.badge}</span>
                ) : null}
              </span>
              <span className="merchant-cmd-action-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MerchantDashboardCommandHero
