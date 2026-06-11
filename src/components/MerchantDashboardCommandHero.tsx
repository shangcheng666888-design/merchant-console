import React from 'react'
import AnimatedMetric, { type AnimatedMetricFormat } from './AnimatedMetric'
import jinridingdan from '../assets/jinridingdan.png'
import jinrixiaoshoue from '../assets/jinrixiaoshoue.png'
import leijixiaoshoue from '../assets/leijixiaoshoue.png'
import zongdingdan from '../assets/zongdingdan.png'
import shangpinzongshu from '../assets/shangpinzongshu.png'
import yujilirun from '../assets/yujilirun.png'
import zonglirun from '../assets/zonglirun.png'
import daijiesuan from '../assets/daijiesuan.png'
import daifahuo from '../assets/daifahuo.png'
import yunyingjihua from '../assets/yunyingjihua.png'
import caiwubaogao from '../assets/caiwubaogao.png'
import wodeqianbao from '../assets/wodeqianbao.png'
import haopinglv from '../assets/haopinglv.png'
import xinyongfen from '../assets/xinyongfen.png'
import guanzhu from '../assets/guanzhu.png'
import {
  getMerchantShopLevel,
  getNextMerchantShopLevel,
  type MerchantShopLevel,
} from '../constants/merchantShopLevels'
import MiniSparkline from './MiniSparkline'

function HealthRing({ value, label }: { value: number; label: string }) {
  const radius = 37
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

function HealthFactor({
  label,
  value,
  format,
  decimals,
  tone,
  iconSrc,
}: {
  label: string
  value: number
  format: AnimatedMetricFormat
  decimals?: number
  tone: 'emerald' | 'blue'
  iconSrc?: string
}) {
  return (
    <div className={`merchant-cmd-health-factor merchant-cmd-health-factor--${tone}`}>
      {iconSrc ? (
        <span className="merchant-cmd-health-factor-icon merchant-cmd-health-factor-icon--img" aria-hidden="true">
          <img src={iconSrc} alt="" className="merchant-cmd-health-factor-icon-img" />
        </span>
      ) : null}
      <span className="merchant-cmd-health-factor-label">{label}</span>
      <AnimatedMetric
        value={value}
        format={format}
        decimals={decimals}
        className="merchant-cmd-health-factor-value"
      />
    </div>
  )
}

type CmdActionKey = 'orders' | 'plan' | 'finance' | 'wallet'

function CmdActionIcon({ name, iconSrc }: { name: CmdActionKey; iconSrc?: string }) {
  if (iconSrc) {
    return <img src={iconSrc} alt="" className="merchant-cmd-action-icon-img" />
  }

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

type MetricTone = 'indigo' | 'blue' | 'violet' | 'orange' | 'green' | 'lime' | 'teal'

interface MetricCellProps {
  icon: MetricIconName
  iconSrc?: string
  tone: MetricTone
  label: string
  value: number
  format: AnimatedMetricFormat
  emphasis?: boolean
}

function MetricCell({ icon, iconSrc, tone, label, value, format, emphasis = false }: MetricCellProps) {
  const valueClassName = emphasis
    ? 'merchant-cmd-metric-value merchant-cmd-metric-value--emphasis'
    : 'merchant-cmd-metric-value'

  return (
    <div className={`merchant-cmd-metric-cell merchant-cmd-metric-cell--${tone}`}>
      {iconSrc ? (
        <span className="merchant-cmd-metric-icon merchant-cmd-metric-icon--img" aria-hidden="true">
          <img src={iconSrc} alt="" className="merchant-cmd-metric-icon-img" />
        </span>
      ) : (
        <MetricIcon name={icon} />
      )}
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
  followerSeries: number[]
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
  followerSeries,
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
  const followerWeekGain = followerSeries.reduce((sum, value) => sum + value, 0)

  const dateLabel = new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  const quickActions: { key: CmdActionKey; path: string; zh: string; en: string; badge: number; primary: boolean; iconSrc?: string }[] = [
    { key: 'orders', path: '/orders', zh: '待发货', en: 'Fulfillment', badge: pendingOrders, primary: pendingOrders > 0, iconSrc: daifahuo },
    { key: 'plan', path: '/plan', zh: '运营计划', en: 'Growth plan', badge: 0, primary: false, iconSrc: yunyingjihua },
    { key: 'finance', path: '/finance', zh: '财务报告', en: 'Finance', badge: 0, primary: false, iconSrc: caiwubaogao },
    { key: 'wallet', path: '/wallet', zh: '我的钱包', en: 'Wallet', badge: 0, primary: false, iconSrc: wodeqianbao },
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
            <div className="merchant-cmd-identity-emblem-col">
              <div className={`merchant-cmd-shop-emblem merchant-cmd-shop-emblem--${levelInfo.key}`}>
                <img
                  src={shopLogo || levelInfo.icon}
                  alt=""
                  className={`merchant-cmd-shop-emblem-img${shopLogo ? '' : ' merchant-cmd-shop-emblem-img--icon'}`}
                />
              </div>
              <h2 className="merchant-cmd-shop-name">{shopName || (lang === 'zh' ? '我的店铺' : 'My shop')}</h2>
            </div>
            <div className="merchant-cmd-identity-body">
              <div className="merchant-cmd-level-row">
                <span className={`merchant-cmd-level-badge merchant-cmd-level-badge--${levelInfo.key}`}>
                  <img src={levelInfo.icon} alt="" className="merchant-cmd-level-badge-icon" />
                  {lang === 'zh' ? levelInfo.sellerZh : levelInfo.sellerEn}
                </span>
                <button type="button" className="merchant-cmd-level-link" onClick={() => onNavigate('/plan')}>
                  {lang === 'zh' ? '查看等级权益' : 'View level benefits'}
                </button>
              </div>
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
              <span className="merchant-cmd-total-sales-icon merchant-cmd-total-sales-icon--img" aria-hidden="true">
                <img src={leijixiaoshoue} alt="" className="merchant-cmd-total-sales-icon-img" />
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
                iconSrc={zongdingdan}
                tone="indigo"
                label={lang === 'zh' ? '总订单' : 'Total orders'}
                value={orderCount}
                format="number"
              />
              <MetricCell
                icon="profit"
                iconSrc={zonglirun}
                tone="blue"
                label={lang === 'zh' ? '总利润' : 'Total profit'}
                value={totalProfit}
                format="currency"
              />
              <MetricCell
                icon="products"
                iconSrc={shangpinzongshu}
                tone="violet"
                label={lang === 'zh' ? '商品总数' : 'Total products'}
                value={productCount}
                format="number"
              />
            </div>
            <div className="merchant-cmd-metrics-row merchant-cmd-metrics-row--today">
              <MetricCell
                icon="sales"
                iconSrc={jinrixiaoshoue}
                tone="orange"
                emphasis
                label={lang === 'zh' ? '今日销售额' : "Today's sales"}
                value={todaySales}
                format="currency"
              />
              <MetricCell
                icon="orders"
                iconSrc={jinridingdan}
                tone="green"
                label={lang === 'zh' ? '今日订单' : "Today's orders"}
                value={todayOrders}
                format="number"
              />
              <MetricCell
                icon="profit"
                iconSrc={yujilirun}
                tone="lime"
                label={lang === 'zh' ? '预计利润' : 'Expected profit'}
                value={todayProfit}
                format="currency"
              />
              <MetricCell
                icon="unsettled"
                iconSrc={daijiesuan}
                tone="teal"
                label={lang === 'zh' ? '待结算金额' : 'Unsettled amount'}
                value={unsettledAmount}
                format="currency"
              />
            </div>
          </div>

          <div className="merchant-cmd-side-board">
            <div className="merchant-cmd-health-row">
              <HealthFactor
                label={lang === 'zh' ? '好评率' : 'Rating'}
                value={goodRate}
                format="percent"
                decimals={1}
                tone="emerald"
                iconSrc={haopinglv}
              />
              <HealthRing value={healthIndex} label={lang === 'zh' ? '健康综合分' : 'Health score'} />
              <HealthFactor
                label={lang === 'zh' ? '信用分' : 'Credit'}
                value={creditScore}
                format="number"
                tone="blue"
                iconSrc={xinyongfen}
              />
            </div>
            <div className="merchant-cmd-followers-card">
              <div className="merchant-cmd-followers-pill">
                <span className="merchant-cmd-followers-pill-icon merchant-cmd-followers-pill-icon--img" aria-hidden="true">
                  <img src={guanzhu} alt="" className="merchant-cmd-followers-pill-icon-img" />
                </span>
                <span className="merchant-cmd-followers-pill-label">{lang === 'zh' ? '关注' : 'Followers'}</span>
                <AnimatedMetric value={followers} format="compact" className="merchant-cmd-followers-pill-value" />
              </div>
              <div className="merchant-cmd-followers-trend">
                <div className="merchant-cmd-followers-trend-head">
                  <span className="merchant-cmd-followers-trend-title">
                    {lang === 'zh' ? '7日关注趋势' : '7-day follower trend'}
                  </span>
                  <span className="merchant-cmd-followers-trend-delta">
                    {followerWeekGain > 0 ? `+${followerWeekGain}` : followerWeekGain === 0 ? (lang === 'zh' ? '持平' : 'Flat') : followerWeekGain}
                    {followerWeekGain > 0 ? (
                      <span className="merchant-cmd-followers-trend-delta-label">
                        {lang === 'zh' ? ' 本周' : ' this week'}
                      </span>
                    ) : null}
                  </span>
                </div>
                <MiniSparkline
                  data={followerSeries}
                  color="#8b5cf6"
                  delay={0.2}
                  className="merchant-cmd-followers-sparkline"
                />
              </div>
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
              <span className={`merchant-cmd-action-icon${action.iconSrc ? ' merchant-cmd-action-icon--img' : ''}`}>
                <CmdActionIcon name={action.key} iconSrc={action.iconSrc} />
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
