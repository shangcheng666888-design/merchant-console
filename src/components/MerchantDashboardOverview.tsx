import React from 'react'
import AnimatedMetric, { type AnimatedMetricFormat } from './AnimatedMetric'

export interface OverviewDashboardData {
  lang: 'zh' | 'en'
  visitsToday: number
  visits7d: number
  visits30d: number
  visitsTotal: number
  orderCount: number
  orderSeries: number[]
}

type OverviewVariant = 'traffic'

type MetricTone = 'indigo' | 'blue' | 'gold' | 'emerald' | 'violet'

interface OverviewMetric {
  icon: React.ReactNode
  value?: React.ReactNode
  numericValue?: number
  valueFormat?: AnimatedMetricFormat
  decimals?: number
  label: string
  delta?: number | null
  deltaLabel?: string
  barPercent?: number
  tone?: MetricTone
}

interface OverviewCardConfig {
  variant: OverviewVariant
  title: string
  code: string
  primaryNumeric: number
  primaryFormat?: AnimatedMetricFormat
  primaryDecimals?: number
  primaryLabel: string
  primaryDelta?: number | null
  primaryDeltaLabel?: string
  sparkData: number[]
  sparkColor: string
  metrics: OverviewMetric[]
  insight: string
  progress?: { label: string; percent: number; tone: MetricTone }
}

function pctDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null
  if (previous === 0) {
    if (current === 0) return 0
    return 100
  }
  return ((current - previous) / Math.abs(previous)) * 100
}

function buildVisitSeries(visitsTotal: number, orderSeries: number[]): number[] {
  const visits30d = Math.max(0, Math.round(visitsTotal))
  const visitsPerDay = visits30d > 0 ? visits30d / 30 : 0
  const maxOrders = Math.max(...orderSeries, 1)
  return orderSeries.map((orders) => {
    const weight = 0.65 + (orders / maxOrders) * 0.35
    return Math.max(0, Math.round(visitsPerDay * weight))
  })
}

function buildTrafficOverviewCard(data: OverviewDashboardData): OverviewCardConfig {
  const {
    lang,
    visitsToday,
    visits7d,
    visits30d,
    visitsTotal,
    orderCount,
    orderSeries,
  } = data

  const conversionRate = visitsTotal > 0 ? (orderCount / visitsTotal) * 100 : 0
  const visitSeries = buildVisitSeries(visitsTotal, orderSeries)
  const visitDelta = pctDelta(visitsToday, visitSeries.length >= 2 ? visitSeries[visitSeries.length - 2] : 0)

  const trafficInsight =
    conversionRate >= 2
      ? lang === 'zh'
        ? '转化率表现良好，可加大爆款商品推广'
        : 'Solid conversion rate — consider promoting top sellers'
      : lang === 'zh'
        ? '访客转化偏低，建议优化商品详情与定价'
        : 'Conversion is low — refine listings and pricing'

  return {
    variant: 'traffic',
    title: lang === 'zh' ? '流量概况' : 'Traffic overview',
    code: 'TRAFFIC · 7D',
    primaryNumeric: visits30d,
    primaryFormat: 'compact',
    primaryLabel: lang === 'zh' ? '30日访客' : '30-day visitors',
    primaryDelta: visitDelta,
    primaryDeltaLabel: lang === 'zh' ? '较昨日' : 'vs yesterday',
    sparkData: visitSeries,
    sparkColor: '#4f9cf9',
    metrics: [
      {
        icon: <OverviewIcon name="visitors" />,
        numericValue: visitsToday,
        valueFormat: 'number',
        label: lang === 'zh' ? '今日访客' : "Today's visitors",
        tone: 'blue',
      },
      {
        icon: <OverviewIcon name="trend" />,
        numericValue: visits7d,
        valueFormat: 'number',
        label: lang === 'zh' ? '7日访客' : '7-day visitors',
        tone: 'indigo',
      },
      {
        icon: <OverviewIcon name="conversion" />,
        numericValue: conversionRate,
        valueFormat: 'percent',
        decimals: 2,
        label: lang === 'zh' ? '转化率' : 'Conversion',
        barPercent: Math.min(100, conversionRate * 20),
        tone: 'violet',
      },
    ],
    insight: trafficInsight,
  }
}

function OverviewIcon({
  name,
}: {
  name: 'visitors' | 'trend' | 'conversion'
}) {
  const paths: Record<typeof name, React.ReactNode> = {
    visitors: (
      <>
        <circle cx="9" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <circle cx="15.5" cy="10.2" r="1.8" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M5.8 17.2c.8-2.2 2.6-3.4 4.2-3.4s3.4 1.2 4.2 3.4M13.1 17.2c.5-1.5 1.6-2.4 2.9-2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
    trend: (
      <path d="M5 16.5 9.2 11.8 12.4 14.2 18.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    conversion: (
      <>
        <path d="M5 18V8.5l4-2.2 4 2.2V18" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
        <path d="M9.5 12.2h5M9.5 15h3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
  }

  return (
    <svg className="merchant-overview-metric-icon-svg" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function MiniSparkline({ data, color, delay = 0 }: { data: number[]; color: string; delay?: number }) {
  if (!data.length) return null

  const width = 108
  const height = 36
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const gradId = `spark-${color.replace('#', '')}`

  const points = data.map((value, index) => {
    const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 6) - 3
    return { x, y }
  })

  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `0,${height} ${line} ${width},${height}`
  const last = points[points.length - 1]

  return (
    <svg
      className="merchant-overview-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ '--mc-spark-delay': `${delay}s` } as React.CSSProperties}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon className="merchant-overview-sparkline-area" points={area} fill={`url(#${gradId})`} />
      <polyline
        className="merchant-overview-sparkline-line"
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
      />
      {last ? <circle className="merchant-overview-sparkline-dot" cx={last.x} cy={last.y} r="2.8" fill={color} /> : null}
    </svg>
  )
}

function DeltaBadge({
  value,
  label,
}: {
  value: number | null | undefined
  label: string
}) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null

  const up = value >= 0
  const flat = Math.abs(value) < 0.05

  return (
    <span className={`merchant-overview-delta${flat ? ' merchant-overview-delta--flat' : up ? ' merchant-overview-delta--up' : ' merchant-overview-delta--down'}`}>
      {flat ? '—' : up ? '↑' : '↓'}
      {!flat ? `${Math.abs(value).toFixed(1)}%` : '0%'}
      <span className="merchant-overview-delta-label">{label}</span>
    </span>
  )
}

function MetricValue({ metric }: { metric: OverviewMetric }) {
  if (typeof metric.numericValue === 'number') {
    return (
      <AnimatedMetric
        className="merchant-overview-metric-value"
        value={metric.numericValue}
        format={metric.valueFormat ?? 'number'}
        decimals={metric.decimals}
      />
    )
  }
  return <span className="merchant-overview-metric-value">{metric.value}</span>
}

function OverviewMetricCell({ metric, index = 0 }: { metric: OverviewMetric; index?: number }) {
  const tone = metric.tone ?? 'indigo'
  const barScale = typeof metric.barPercent === 'number'
    ? Math.min(1, Math.max(0, metric.barPercent / 100))
    : null

  return (
    <div
      className={`merchant-overview-metric merchant-overview-metric--${tone}`}
      style={{ '--mc-metric-delay': `${0.12 + index * 0.08}s` } as React.CSSProperties}
    >
      <span className="merchant-overview-metric-icon" aria-hidden="true">
        {metric.icon}
      </span>
      <div className="merchant-overview-metric-body">
        <MetricValue metric={metric} />
        <span className="merchant-overview-metric-label">{metric.label}</span>
        {metric.delta !== undefined ? (
          <DeltaBadge value={metric.delta} label={metric.deltaLabel ?? ''} />
        ) : null}
        {barScale !== null ? (
          <span className="merchant-overview-microbar" aria-hidden="true">
            <span
              className="merchant-overview-microbar-fill"
              style={{ '--mc-bar-scale': String(barScale) } as React.CSSProperties}
            />
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function OverviewCard({
  config,
  compact = false,
  index = 0,
}: {
  config: OverviewCardConfig
  compact?: boolean
  index?: number
}) {
  const {
    variant,
    title,
    code,
    primaryNumeric,
    primaryFormat = 'number',
    primaryDecimals,
    primaryLabel,
    primaryDelta,
    primaryDeltaLabel,
    sparkData,
    sparkColor,
    metrics,
    insight,
    progress,
  } = config

  const progressScale = progress ? Math.min(1, Math.max(0, progress.percent / 100)) : null

  return (
    <article
      className={`merchant-dashboard-overview-card merchant-dashboard-overview-card--${variant}${compact ? ' merchant-dashboard-overview-card--compact' : ''}`}
      style={{ '--mc-stagger': `${0.08 + index * 0.12}s` } as React.CSSProperties}
    >
      <div className="merchant-dashboard-overview-card-bg" aria-hidden="true" />
      <div className="merchant-dashboard-overview-card-glow" aria-hidden="true" />

      <header className="merchant-dashboard-overview-head">
        <div className="merchant-dashboard-overview-head-left">
          <span className="merchant-dashboard-overview-dot" aria-hidden="true" />
          <div>
            <h3 className="merchant-dashboard-overview-title">{title}</h3>
            <span className="merchant-dashboard-overview-code">{code}</span>
          </div>
        </div>
        <MiniSparkline data={sparkData} color={sparkColor} delay={0.15 + index * 0.1} />
      </header>

      <div className="merchant-overview-primary">
        <div className="merchant-overview-primary-main">
          <AnimatedMetric
            className="merchant-overview-primary-value"
            value={primaryNumeric}
            format={primaryFormat}
            decimals={primaryDecimals}
          />
          <span className="merchant-overview-primary-label">{primaryLabel}</span>
          {primaryDelta !== undefined ? (
            <DeltaBadge value={primaryDelta} label={primaryDeltaLabel ?? ''} />
          ) : null}
        </div>
        {progress ? (
          <div className="merchant-overview-progress">
            <div className="merchant-overview-progress-head">
              <span>{progress.label}</span>
              <strong>{Math.round(progress.percent)}%</strong>
            </div>
            <span className="merchant-overview-progress-track" aria-hidden="true">
              <span
                className={`merchant-overview-progress-fill merchant-overview-progress-fill--${progress.tone}`}
                style={{ '--mc-bar-scale': String(progressScale) } as React.CSSProperties}
              />
            </span>
          </div>
        ) : null}
      </div>

      <div className="merchant-overview-metrics">
        {metrics.map((metric, metricIndex) => (
          <OverviewMetricCell key={metric.label} metric={metric} index={metricIndex} />
        ))}
      </div>

      <footer className="merchant-overview-insight">
        <span className="merchant-overview-insight-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path
              d="M12 3a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1.3A7 7 0 0 0 12 3z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M10 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <p>{insight}</p>
      </footer>
    </article>
  )
}

interface MerchantDashboardOverviewProps {
  data: OverviewDashboardData
  mode: 'grid' | 'single'
}

export const MerchantDashboardOverview: React.FC<MerchantDashboardOverviewProps> = ({
  data,
  mode,
}) => {
  const config = buildTrafficOverviewCard(data)

  if (mode === 'single') {
    return <OverviewCard config={config} compact />
  }

  return (
    <div className="merchant-dashboard-overview-grid merchant-dashboard-overview-grid--animated">
      <OverviewCard config={config} index={0} />
    </div>
  )
}
