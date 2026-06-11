import React from 'react'
import AnimatedMetric, { type AnimatedMetricFormat } from './AnimatedMetric'
import MerchantDashboardInsight from './MerchantDashboardInsight'
import MiniSparkline from './MiniSparkline'
import liulianggaikuang from '../assets/liulianggaikuang.png'
import jinrufangke from '../assets/jinrufangke.png'
import qirifangke from '../assets/qirifangke.png'
import zhuanhuashuai from '../assets/zhuanhuashuai.png'

export interface OverviewDashboardData {
  lang: 'zh' | 'en'
  visitsToday: number
  visits7d: number
  visits30d: number
  visitsTotal: number
  orderCount: number
  orderSeries: number[]
  /** Last 7 days daily visitors from shop_daily_visits (index 6 = today). */
  visitSeries: number[]
}

type OverviewVariant = 'traffic'

type MetricTone = 'indigo' | 'blue' | 'gold' | 'emerald' | 'violet'

interface OverviewMetric {
  icon?: React.ReactNode
  iconSrc?: string
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
  insightKicker: string
  lang: 'zh' | 'en'
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

function buildTrafficOverviewCard(data: OverviewDashboardData): OverviewCardConfig {
  const {
    lang,
    visitsToday,
    visits7d,
    visits30d,
    visitsTotal,
    orderCount,
    visitSeries,
  } = data

  const conversionRate = visitsTotal > 0 ? (orderCount / visitsTotal) * 100 : 0
  const visitsYesterday =
    visitSeries.length >= 2 ? Number(visitSeries[visitSeries.length - 2] ?? 0) || 0 : 0
  const visitDelta = pctDelta(visitsToday, visitsYesterday)
  const sparkVisits = visitSeries.length === 7 ? visitSeries : [0, 0, 0, 0, 0, 0, 0]

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
    primaryDeltaLabel: lang === 'zh' ? '今日较昨日' : 'today vs yesterday',
    sparkData: sparkVisits,
    sparkColor: '#4f9cf9',
    metrics: [
      {
        iconSrc: jinrufangke,
        numericValue: visitsToday,
        valueFormat: 'number',
        label: lang === 'zh' ? '今日访客' : "Today's visitors",
        tone: 'blue',
      },
      {
        iconSrc: qirifangke,
        numericValue: visits7d,
        valueFormat: 'number',
        label: lang === 'zh' ? '7日访客' : '7-day visitors',
        tone: 'indigo',
      },
      {
        iconSrc: zhuanhuashuai,
        numericValue: conversionRate,
        valueFormat: 'percent',
        decimals: 2,
        label: lang === 'zh' ? '转化率' : 'Conversion',
        barPercent: Math.min(100, conversionRate * 20),
        tone: 'violet',
      },
    ],
    insight: trafficInsight,
    insightKicker: lang === 'zh' ? '智能摘要' : 'Smart insight',
    lang,
  }
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
      <span className={`merchant-overview-metric-icon${metric.iconSrc ? ' merchant-overview-metric-icon--img' : ''}`} aria-hidden="true">
        {metric.iconSrc ? (
          <img src={metric.iconSrc} alt="" className="merchant-overview-metric-icon-img" />
        ) : (
          metric.icon
        )}
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
    insightKicker,
    lang,
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
          {variant === 'traffic' ? (
            <span className="merchant-dashboard-overview-icon merchant-dashboard-overview-icon--img" aria-hidden="true">
              <img src={liulianggaikuang} alt="" className="merchant-dashboard-overview-icon-img" />
            </span>
          ) : (
            <span className="merchant-dashboard-overview-dot" aria-hidden="true" />
          )}
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

      <MerchantDashboardInsight
        storageKey="merchant-dashboard-traffic-insight-dismissed"
        kicker={insightKicker}
        text={insight}
        lang={lang}
        inCard
        as="footer"
      />
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
