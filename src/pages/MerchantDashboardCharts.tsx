import React, { useEffect, useState } from 'react'
import type { Lang } from '../context/LangContext'

export type ChartDataItem = { name: string; 评分: number; 访客: number; 订单: number }
type ActiveChart = 'shop' | 'traffic' | 'orders'

interface MerchantDashboardChartsProps {
  chartData: ChartDataItem[]
  activeChart: ActiveChart
  setActiveChart: (v: ActiveChart) => void
  formatXAxisLabel: (value: string | number) => string
  lang: Lang
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

export const MerchantDashboardCharts: React.FC<MerchantDashboardChartsProps> = ({
  chartData,
  activeChart,
  setActiveChart,
  formatXAxisLabel = formatXAxisLabelDefault,
  lang,
}) => {
  const [Recharts, setRecharts] = useState<typeof import('recharts') | null>(null)

  useEffect(() => {
    import('recharts').then((m) => setRecharts(m))
  }, [])

  const tabs = [
    { id: 'shop' as const, zh: '店铺评分', en: 'Shop score' },
    { id: 'traffic' as const, zh: '流量', en: 'Traffic' },
    { id: 'orders' as const, zh: '订单趋势', en: 'Orders' },
  ]

  const chartCards = [
    {
      id: 'shop' as const,
      titleZh: '店铺概况趋势',
      titleEn: 'Shop overview trend',
      dataKey: '评分' as const,
      theme: CHART_THEME.shop,
    },
    {
      id: 'traffic' as const,
      titleZh: '流量趋势',
      titleEn: 'Traffic trend',
      dataKey: '访客' as const,
      theme: CHART_THEME.traffic,
    },
    {
      id: 'orders' as const,
      titleZh: '订单趋势',
      titleEn: 'Order trend',
      dataKey: '订单' as const,
      theme: CHART_THEME.orders,
    },
  ]

  if (!Recharts) {
    return (
      <div className="merchant-dashboard-charts-shell merchant-dashboard-charts-shell--animated">
        <div className="merchant-dashboard-chart-switch">
          <span className="merchant-dashboard-chart-tab merchant-dashboard-chart-tab--active">
            {lang === 'zh' ? '店铺评分' : 'Shop score'}
          </span>
        </div>
        <div className="merchant-dashboard-chart-card merchant-dashboard-chart-card--active">
          <h3 className="merchant-dashboard-chart-title">
            {lang === 'zh' ? '店铺概况趋势' : 'Shop overview trend'}
          </h3>
          <div className="merchant-dashboard-chart-wrap merchant-dashboard-chart-skeleton" aria-hidden>
            <div className="merchant-dashboard-chart-skeleton-inner" />
          </div>
        </div>
      </div>
    )
  }

  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = Recharts

  return (
    <div className="merchant-dashboard-charts-shell merchant-dashboard-charts-shell--animated">
      <div className="merchant-dashboard-chart-switch">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`merchant-dashboard-chart-tab${
              activeChart === tab.id ? ' merchant-dashboard-chart-tab--active' : ''
            }`}
            onClick={() => setActiveChart(tab.id)}
          >
            {lang === 'zh' ? tab.zh : tab.en}
          </button>
        ))}
      </div>

      <div className="merchant-dashboard-charts merchant-dashboard-charts--v2">
        {chartCards.map((card) => (
          <div
            key={card.id}
            className={`merchant-dashboard-chart-card${
              activeChart === card.id ? ' merchant-dashboard-chart-card--active' : ''
            }`}
          >
            <div className="merchant-dashboard-chart-card-head">
              <h3 className="merchant-dashboard-chart-title">
                {lang === 'zh' ? card.titleZh : card.titleEn}
              </h3>
              <span
                className="merchant-dashboard-chart-legend"
                style={{ color: card.theme.stroke }}
              >
                ● {lang === 'zh' ? '近7日' : '7 days'}
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
