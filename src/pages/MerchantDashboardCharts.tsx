import React, { useEffect, useState } from 'react'
import { DashboardChartSkeletonShell } from '../components/McLoadingSkeletons'
import { pickField, tr, type Lang } from '../i18n'

export type ChartDataItem = { name: string; 评分: number; 访客: number; 订单: number }
type ActiveChart = 'shop' | 'traffic' | 'orders'

interface MerchantDashboardChartsProps {
  chartData: ChartDataItem[]
  activeChart: ActiveChart
  setActiveChart: (v: ActiveChart) => void
  formatXAxisLabel: (value: string | number) => string
  lang: Lang
  dataLoading?: boolean
}

const formatXAxisLabelDefault = (v: string | number) => String(v)

const CHART_THEME = {
  shop: { stroke: '#5b6cff', gradId: 'mcChartShop', gradTop: '#5b6cff' },
  traffic: { stroke: '#4f9cf9', gradId: 'mcChartTraffic', gradTop: '#4f9cf9' },
  orders: { stroke: '#8b7cf6', gradId: 'mcChartOrders', gradTop: '#8b7cf6' },
} as const

function ChartGradientDefs() {
  return (
    <defs>
      <linearGradient id="mcChartShop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5b6cff" stopOpacity={0.32} />
        <stop offset="100%" stopColor="#5b6cff" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="mcChartTraffic" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4f9cf9" stopOpacity={0.32} />
        <stop offset="100%" stopColor="#4f9cf9" stopOpacity={0.02} />
      </linearGradient>
      <linearGradient id="mcChartOrders" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8b7cf6" stopOpacity={0.32} />
        <stop offset="100%" stopColor="#8b7cf6" stopOpacity={0.02} />
      </linearGradient>
    </defs>
  )
}

const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #e3e7f3',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(26, 31, 54, 0.1)',
  fontSize: 12,
}

const CHART_TABS = [
  { id: 'shop' as const, zh: '店铺评分', en: 'Shop score', de: 'Shop-Bewertung', ja: 'ショップ評価', ko: '점포 평점', es: 'Puntuación de tienda', it: 'Punteggio negozio', vi: 'Điểm cửa hàng', fr: 'Note de la boutique' },
  { id: 'traffic' as const, zh: '流量', en: 'Traffic', de: 'Traffic', ja: 'トラフィック', ko: '트래픽', es: 'Tráfico', it: 'Traffico', vi: 'Lưu lượng', fr: 'Trafic' },
  { id: 'orders' as const, zh: '订单趋势', en: 'Orders', de: 'Bestellungen', ja: '注文トレンド', ko: '주문 추세', es: 'Pedidos', it: 'Ordini', vi: 'Đơn hàng', fr: 'Commandes' },
]

const CHART_CARDS = [
  {
    id: 'shop' as const,
    titleZh: '店铺概况趋势',
    titleEn: 'Shop overview trend',
    titleDe: 'Shop-Übersichtstrend',
    titleJa: 'ショップ概要トレンド',
    titleKo: '점포 개요 추세',
    titleEs: 'Tendencia general de la tienda',
    titleIt: 'Tendenza panoramica negozio',
    titleVi: 'Xu hướng tổng quan cửa hàng',
    dataKey: '评分' as const,
    theme: CHART_THEME.shop,
  },
  {
    id: 'traffic' as const,
    titleZh: '流量趋势',
    titleEn: 'Traffic trend',
    titleDe: 'Traffic-Trend',
    titleJa: 'トラフィックトレンド',
    titleKo: '트래픽 추세',
    titleEs: 'Tendencia de tráfico',
    titleIt: 'Tendenza del traffico',
    titleVi: 'Xu hướng lưu lượng',
    dataKey: '访客' as const,
    theme: CHART_THEME.traffic,
  },
  {
    id: 'orders' as const,
    titleZh: '订单趋势',
    titleEn: 'Order trend',
    titleDe: 'Bestelltrend',
    titleJa: '注文トレンド',
    titleKo: '주문 추세',
    titleEs: 'Tendencia de pedidos',
    titleIt: 'Tendenza ordini',
    titleVi: 'Xu hướng đơn hàng',
    dataKey: '订单' as const,
    theme: CHART_THEME.orders,
  },
]

export const MerchantDashboardCharts: React.FC<MerchantDashboardChartsProps> = ({
  chartData,
  activeChart,
  setActiveChart,
  formatXAxisLabel = formatXAxisLabelDefault,
  lang,
  dataLoading = false,
}) => {
  const [Recharts, setRecharts] = useState<typeof import('recharts') | null>(null)

  useEffect(() => {
    import('recharts').then((m) => setRecharts(m))
  }, [])

  if (dataLoading || !Recharts) {
    return <DashboardChartSkeletonShell lang={lang} />
  }

  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts

  return (
    <div className="merchant-dashboard-charts-shell merchant-dashboard-charts-shell--animated">
      <div className="merchant-dashboard-chart-switch">
        {CHART_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`merchant-dashboard-chart-tab${
              activeChart === tab.id ? ' merchant-dashboard-chart-tab--active' : ''
            }`}
            onClick={() => setActiveChart(tab.id)}
          >
            {pickField(lang, { zh: tab.zh, en: tab.en, de: tab.de, ja: tab.ja, ko: tab.ko, es: tab.es, it: tab.it, vi: tab.vi })}
          </button>
        ))}
      </div>

      <div className="merchant-dashboard-charts merchant-dashboard-charts--v2">
        {CHART_CARDS.map((card) => (
          <div
            key={card.id}
            className={`merchant-dashboard-chart-card${
              activeChart === card.id ? ' merchant-dashboard-chart-card--active' : ''
            }`}
          >
            <div className="merchant-dashboard-chart-card-head">
              <h3 className="merchant-dashboard-chart-title">
                {pickField(lang, { zh: card.titleZh, en: card.titleEn, de: card.titleDe, ja: card.titleJa, ko: card.titleKo, es: card.titleEs, it: card.titleIt, vi: card.titleVi })}
              </h3>
              <span
                className="merchant-dashboard-chart-legend"
                style={{ color: card.theme.stroke }}
              >
                ● {tr(lang, { zh: '近7日', en: '7 days', de: '7 Tage', ja: '直近7日', ko: '최근 7일', es: '7 días', it: '7 giorni', vi: '7 ngày', fr: '7 jours' })}
              </span>
            </div>
            <div className="merchant-dashboard-chart-wrap">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -8, bottom: 4 }}>
                  <ChartGradientDefs />
                  <CartesianGrid strokeDasharray="4 4" stroke="#eceff8" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6b7289' }}
                    stroke="#d1d5e4"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatXAxisLabel(value)}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7289' }}
                    stroke="#d1d5e4"
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: '#1a1f36', fontWeight: 600, marginBottom: 4 }}
                    labelFormatter={(value) => formatXAxisLabel(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey={card.dataKey}
                    stroke={card.theme.stroke}
                    fill={`url(#${card.theme.gradId})`}
                    strokeWidth={2.5}
                    isAnimationActive
                    animationDuration={1400}
                    animationEasing="ease-out"
                    dot={{ r: 3, fill: card.theme.stroke, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: card.theme.stroke, stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
