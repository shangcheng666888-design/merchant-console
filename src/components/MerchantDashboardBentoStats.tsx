import React from 'react'
import AnimatedMetric from './AnimatedMetric'
import MerchantDashboardStatIcon from './MerchantDashboardStatIcon'
import type { Lang } from '../i18n'
import { tr } from '../i18n'

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
  lang: Lang
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
          <span className="merchant-bento-card-tag">{tr(lang, { zh: '近7日走势', en: '7-day trend', de: '7-Tage-Trend', ja: '直近7日の推移', ko: '최근 7일 추이', es: 'Tendencia de 7 días', it: 'Andamento in 7 giorni', vi: 'Xu hướng 7 ngày' })}</span>
        </div>
        <AnimatedMetric value={totalSales} format="currency" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {tr(lang, { zh: '销售总额', en: 'Total sales', de: 'Gesamtumsatz', ja: '売上合計', ko: '총 매출', es: 'Ventas totales', it: 'Vendite totali', vi: 'Tổng doanh thu' })}
        </span>
        <BentoSparkline data={salesSeries} color="#1d6fd8" />
      </article>

      <article className="merchant-bento-card merchant-bento-card--orders merchant-dashboard-stat--orders" style={{ '--mc-stagger': '0.1s' } as React.CSSProperties}>
        <MerchantDashboardStatIcon variant="orders" />
        <AnimatedMetric value={orderCount} format="number" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {tr(lang, { zh: '总订单', en: 'Total orders', de: 'Bestellungen gesamt', ja: '注文合計', ko: '총 주문', es: 'Pedidos totales', it: 'Ordini totali', vi: 'Tổng đơn hàng' })}
        </span>
      </article>

      <article className="merchant-bento-card merchant-bento-card--profit merchant-dashboard-stat--profit" style={{ '--mc-stagger': '0.15s' } as React.CSSProperties}>
        <MerchantDashboardStatIcon variant="profit" />
        <AnimatedMetric value={totalProfit} format="currency" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {tr(lang, { zh: '总利润', en: 'Total profit', de: 'Gesamtgewinn', ja: '利益合計', ko: '총 이익', es: 'Beneficio total', it: 'Profitto totale', vi: 'Tổng lợi nhuận' })}
        </span>
      </article>

      <article className="merchant-bento-card merchant-bento-card--products merchant-dashboard-stat--products" style={{ '--mc-stagger': '0.2s' } as React.CSSProperties}>
        <MerchantDashboardStatIcon variant="products" />
        <AnimatedMetric value={productCount} format="number" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {tr(lang, { zh: '商品总数', en: 'Total products', de: 'Produkte gesamt', ja: '商品数', ko: '총 상품 수', es: 'Productos totales', it: 'Prodotti totali', vi: 'Tổng sản phẩm' })}
        </span>
      </article>

      <article
        className={`merchant-bento-card merchant-bento-card--pending merchant-dashboard-stat--pending${pendingOrders > 0 ? ' merchant-bento-card--alert' : ''}`}
        style={{ '--mc-stagger': '0.25s' } as React.CSSProperties}
      >
        <MerchantDashboardStatIcon variant="pending" />
        <AnimatedMetric value={pendingOrders} format="number" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {tr(lang, { zh: '待处理订单', en: 'Pending orders', de: 'Offene Bestellungen', ja: '未処理の注文', ko: '처리 대기 주문', es: 'Pedidos pendientes', it: 'Ordini in sospeso', vi: 'Đơn chờ xử lý' })}
        </span>
        {pendingOrders > 0 ? (
          <button type="button" className="merchant-bento-action" onClick={onNavigateOrders}>
            {tr(lang, { zh: '立即处理', en: 'View orders', de: 'Bestellungen anzeigen', ja: '注文を確認', ko: '지금 처리', es: 'Ver pedidos', it: 'Vedi ordini', vi: 'Xem đơn hàng' })}
          </button>
        ) : null}
      </article>

      <article className="merchant-bento-card merchant-bento-card--unsettled merchant-dashboard-stat--unsettled" style={{ '--mc-stagger': '0.3s' } as React.CSSProperties}>
        <MerchantDashboardStatIcon variant="unsettled" />
        <AnimatedMetric value={unsettledAmount} format="currency" className="merchant-bento-value merchant-dashboard-stat-value" />
        <span className="merchant-bento-label merchant-dashboard-stat-label">
          {tr(lang, { zh: '待结算金额', en: 'Unsettled amount', de: 'Ausstehender Betrag', ja: '未精算金額', ko: '미정산 금액', es: 'Importe pendiente de liquidar', it: 'Importo da liquidare', vi: 'Số tiền chờ thanh toán' })}
        </span>
      </article>
    </div>
  )
}

export default MerchantDashboardBentoStats
