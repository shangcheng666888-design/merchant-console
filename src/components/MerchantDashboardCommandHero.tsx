import React from 'react'
import AnimatedMetric from './AnimatedMetric'

function getLevelLabel(level: number, lang: 'zh' | 'en'): string {
  if (level >= 4) return lang === 'zh' ? '钻石卖家' : 'Diamond'
  if (level >= 3) return lang === 'zh' ? '金牌卖家' : 'Gold'
  if (level >= 2) return lang === 'zh' ? '银牌卖家' : 'Silver'
  return lang === 'zh' ? '普通卖家' : 'Standard'
}

function HealthRing({ value, label }: { value: number; label: string }) {
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, value)) / 100
  const offset = circumference * (1 - progress)

  return (
    <div className="merchant-cmd-health" aria-label={`${label} ${value}`}>
      <svg className="merchant-cmd-health-svg" viewBox="0 0 96 96" aria-hidden="true">
        <defs>
          <linearGradient id="mc-health-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#5b6cff" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r={radius} className="merchant-cmd-health-track" />
        <circle
          cx="48"
          cy="48"
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

interface CommandHeroProps {
  lang: 'zh' | 'en'
  shopName: string
  shopLevel: number
  healthIndex: number
  todaySales: number
  todayOrders: number
  todayProfit: number
  pendingOrders: number
  onNavigate: (path: string) => void
}

const MerchantDashboardCommandHero: React.FC<CommandHeroProps> = ({
  lang,
  shopName,
  shopLevel,
  healthIndex,
  todaySales,
  todayOrders,
  todayProfit,
  pendingOrders,
  onNavigate,
}) => {
  const now = new Date()
  const dateLabel = now.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  const quickActions = [
    {
      key: 'orders',
      path: '/orders',
      zh: '待发货',
      en: 'Fulfillment',
      badge: pendingOrders,
      primary: pendingOrders > 0,
    },
    {
      key: 'plan',
      path: '/plan',
      zh: '运营计划',
      en: 'Growth plan',
      badge: 0,
      primary: false,
    },
    {
      key: 'finance',
      path: '/finance',
      zh: '财务报告',
      en: 'Finance',
      badge: 0,
      primary: false,
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
          <div className="merchant-cmd-header-main">
            <span className="merchant-cmd-eyebrow">{lang === 'zh' ? '经营指挥台' : 'Command center'}</span>
            <div className="merchant-cmd-title-row">
              <h2 className="merchant-cmd-shop-name">{shopName || (lang === 'zh' ? '我的店铺' : 'My shop')}</h2>
              <span className="merchant-cmd-level-badge">{getLevelLabel(shopLevel, lang)}</span>
            </div>
          </div>
          <div className="merchant-cmd-header-meta">
            <span className="merchant-cmd-date">{dateLabel}</span>
            <span className="merchant-dashboard-hero-live">
              <span className="merchant-dashboard-hero-live-dot" aria-hidden="true" />
              {lang === 'zh' ? '实时同步' : 'Live sync'}
            </span>
          </div>
        </header>

        <div className="merchant-cmd-metrics">
          <div className="merchant-cmd-metric merchant-cmd-metric--primary">
            <span className="merchant-cmd-metric-label">{lang === 'zh' ? '今日销售额' : "Today's sales"}</span>
            <AnimatedMetric value={todaySales} format="currency" className="merchant-cmd-metric-value merchant-cmd-metric-value--hero" />
          </div>
          <div className="merchant-cmd-metric">
            <span className="merchant-cmd-metric-label">{lang === 'zh' ? '今日订单' : "Today's orders"}</span>
            <AnimatedMetric value={todayOrders} format="number" className="merchant-cmd-metric-value" />
          </div>
          <div className="merchant-cmd-metric">
            <span className="merchant-cmd-metric-label">{lang === 'zh' ? '预计利润' : 'Expected profit'}</span>
            <AnimatedMetric value={todayProfit} format="currency" className="merchant-cmd-metric-value merchant-cmd-metric-value--gold" />
          </div>
          <HealthRing value={healthIndex} label={lang === 'zh' ? '健康分' : 'Health'} />
        </div>

        <div className="merchant-cmd-actions">
          {quickActions.map((action) => (
            <button
              key={action.key}
              type="button"
              className={`merchant-cmd-action${action.primary ? ' merchant-cmd-action--primary' : ''}`}
              onClick={() => onNavigate(action.path)}
            >
              {lang === 'zh' ? action.zh : action.en}
              {action.badge > 0 ? (
                <span className="merchant-cmd-action-badge">{action.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default MerchantDashboardCommandHero
