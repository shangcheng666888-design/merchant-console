import React from 'react'
import AnimatedMetric from './AnimatedMetric'
import MerchantDashboardStatIcon from './MerchantDashboardStatIcon'

function BentoSparkline({ data, color = '#5b6cff' }: { data: number[]; color?: string }) {
  if (!data.length) return null

  const width = 140
  const height = 40
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const gradId = `bento-spark-${color.replace('#', '')}`

  const points = data.map((value, index) => {
    const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 8) - 4
    return `${x},${y}`
  }).join(' ')

  const area = `0,${height} ${points} ${width},${height}`

  return (
    <svg className="merchant-bento-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline
        className="merchant-bento-sparkline-line"
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
      />
    </svg>
  )
}

interface BentoStatsProps {
  lang: 'zh' | 'en'
  totalSales: number
  orderCount: number
  totalProfit: number
  productCount: number
  pendingOrders: number
  unsettledAmount: number
  salesSeries: number[]
  onNavigateOrders: () => void
}

const MerchantDashboardBentoStats: React.FC<BentoStatsProps> = ({
  lang,
  totalSales,
  orderCount,
  totalProfit,
  productCount,
  pendingOrders,
  unsettledAmount,
  salesSeries,
  onNavigateOrders,
}) => {
  return (
    <div className="merchant-bento-grid merchant-bento-grid--animated">
      <article className="merchant-bento-card merchant-bento-card--sales merchant-dashboard-stat--sales" style={{ '--mc-stagger': '0.05s' } as React.CSSProperties}>
        <div className="merchant-bento-card-top">
          <MerchantDashboardStatIcon variant="sales" />
          <span className="merchant-bento-card-tag">{lang === 'zh' ? '近7日走势' : '7-day trend'}</span>
        </div>
        <AnimatedMetric value={totalSales} format="currency" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {lang === 'zh' ? '销售总额' : 'Total sales'}
        </span>
        <BentoSparkline data={salesSeries} color="#1d6fd8" />
      </article>

      <article className="merchant-bento-card merchant-bento-card--orders merchant-dashboard-stat--orders" style={{ '--mc-stagger': '0.1s' } as React.CSSProperties}>
        <MerchantDashboardStatIcon variant="orders" />
        <AnimatedMetric value={orderCount} format="number" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {lang === 'zh' ? '总订单' : 'Total orders'}
        </span>
      </article>

      <article className="merchant-bento-card merchant-bento-card--profit merchant-dashboard-stat--profit" style={{ '--mc-stagger': '0.15s' } as React.CSSProperties}>
        <MerchantDashboardStatIcon variant="profit" />
        <AnimatedMetric value={totalProfit} format="currency" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {lang === 'zh' ? '总利润' : 'Total profit'}
        </span>
      </article>

      <article className="merchant-bento-card merchant-bento-card--products merchant-dashboard-stat--products" style={{ '--mc-stagger': '0.2s' } as React.CSSProperties}>
        <MerchantDashboardStatIcon variant="products" />
        <AnimatedMetric value={productCount} format="number" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {lang === 'zh' ? '商品总数' : 'Total products'}
        </span>
      </article>

      <article
        className={`merchant-bento-card merchant-bento-card--pending merchant-dashboard-stat--pending${pendingOrders > 0 ? ' merchant-bento-card--alert' : ''}`}
        style={{ '--mc-stagger': '0.25s' } as React.CSSProperties}
      >
        <MerchantDashboardStatIcon variant="pending" />
        <AnimatedMetric value={pendingOrders} format="number" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {lang === 'zh' ? '待处理订单' : 'Pending orders'}
        </span>
        {pendingOrders > 0 ? (
          <button type="button" className="merchant-bento-action" onClick={onNavigateOrders}>
            {lang === 'zh' ? '立即处理' : 'View orders'}
          </button>
        ) : null}
      </article>

      <article className="merchant-bento-card merchant-bento-card--unsettled merchant-dashboard-stat--unsettled" style={{ '--mc-stagger': '0.3s' } as React.CSSProperties}>
        <MerchantDashboardStatIcon variant="unsettled" />
        <AnimatedMetric value={unsettledAmount} format="currency" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {lang === 'zh' ? '待结算金额' : 'Unsettled amount'}
        </span>
      </article>
    </div>
  )
}

export default MerchantDashboardBentoStats
