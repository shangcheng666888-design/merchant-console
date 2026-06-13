import React from 'react'
import AnimatedMetric, { type AnimatedMetricFormat } from './AnimatedMetric'
import MerchantDashboardInsight from './MerchantDashboardInsight'
import MiniSparkline from './MiniSparkline'
import { DashboardOverviewSkeleton } from './McLoadingSkeletons'
import type { Lang } from '../i18n'
import { tr } from '../i18n'
import liulianggaikuang from '../assets/liulianggaikuang.png'
import jinrufangke from '../assets/jinrufangke.png'
import qirifangke from '../assets/qirifangke.png'
import zhuanhuashuai from '../assets/zhuanhuashuai.png'

export interface OverviewDashboardData {
  lang: Lang
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
  /** When yesterday is 0, show absolute visitor change instead of %. */
  primaryDeltaMode?: 'percent' | 'absolute'
  primaryDeltaLabel?: string
  sparkData: number[]
  sparkColor: string
  metrics: OverviewMetric[]
  insight: string
  insightKicker: string
  lang: Lang
  progress?: { label: string; percent: number; tone: MetricTone }
}

function visitDayDelta(
  today: number,
  yesterday: number,
): { value: number | null; mode: 'percent' | 'absolute' } {
  if (!Number.isFinite(today) || !Number.isFinite(yesterday)) {
    return { value: null, mode: 'percent' }
  }
  if (yesterday === 0) {
    if (today === 0) return { value: 0, mode: 'percent' }
    // 昨日为 0 时环比百分比无定义，展示绝对增量（如今日 110 → ↑110）
    return { value: today - yesterday, mode: 'absolute' }
  }
  return {
    value: ((today - yesterday) / Math.abs(yesterday)) * 100,
    mode: 'percent',
  }
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
  const { value: visitDelta, mode: visitDeltaMode } = visitDayDelta(visitsToday, visitsYesterday)
  const sparkVisits = visitSeries.length === 7 ? visitSeries : [0, 0, 0, 0, 0, 0, 0]

  const trafficInsight =
    conversionRate >= 2
      ? tr(lang, {
          zh: '转化率表现良好，可加大爆款商品推广',
          en: 'Solid conversion rate — consider promoting top sellers',
          de: 'Gute Conversion-Rate — Top-Seller stärker bewerben',
          ja: 'コンバージョン率は良好です。人気商品のプロモーション強化を検討してください。',
          ko: '전환율이 양호합니다. 인기 상품 프로모션을 강화해 보세요.',
          es: 'Buena tasa de conversión: considera promocionar tus productos estrella.', it: 'Buon tasso di conversione: considera di promuovere i prodotti più venduti', vi: 'Tỷ lệ chuyển đổi tốt — hãy cân nhắc quảng bá sản phẩm bán chạy',
        })
      : tr(lang, {
          zh: '访客转化偏低，建议优化商品详情与定价',
          en: 'Conversion is low — refine listings and pricing',
          de: 'Niedrige Conversion — Listings und Preise optimieren',
          ja: 'コンバージョン率が低めです。商品詳細と価格の最適化をおすすめします。',
          ko: '방문 전환율이 낮습니다. 상품 상세와 가격을 최적화해 보세요.',
          es: 'La conversión es baja: optimiza las fichas de producto y los precios.', it: 'La conversione è bassa: ottimizza schede prodotto e prezzi', vi: 'Tỷ lệ chuyển đổi thấp — hãy tối ưu mô tả sản phẩm và giá',
        })

  return {
    variant: 'traffic',
    title: tr(lang, { zh: '流量概况', en: 'Traffic overview', de: 'Traffic-Übersicht', ja: 'トラフィック概要', ko: '트래픽 개요', es: 'Resumen de tráfico', it: 'Panoramica traffico', vi: 'Tổng quan lưu lượng', fr: 'Aperçu du trafic' }),
    code: 'TRAFFIC · 7D',
    primaryNumeric: visits30d,
    primaryFormat: 'compact',
    primaryLabel: tr(lang, { zh: '30日访客', en: '30-day visitors', de: 'Besucher (30 Tage)', ja: '30日間の訪問者', ko: '30일 방문자', es: 'Visitantes en 30 días', it: 'Visitatori in 30 giorni', vi: 'Khách truy cập 30 ngày', fr: 'Visiteurs de 30 jours' }),
    primaryDelta: visitDelta,
    primaryDeltaMode: visitDeltaMode,
    primaryDeltaLabel: tr(lang, { zh: '今日较昨日', en: 'today vs yesterday', de: 'heute vs. gestern', ja: '昨日比（本日）', ko: '어제 대비 오늘', es: 'hoy vs. ayer', it: 'oggi rispetto a ieri', vi: 'hôm nay so với hôm qua', fr: 'aujourd\'hui contre hier' }),
    sparkData: sparkVisits,
    sparkColor: '#4f9cf9',
    metrics: [
      {
        iconSrc: jinrufangke,
        numericValue: visitsToday,
        valueFormat: 'number',
        label: tr(lang, { zh: '今日访客', en: "Today's visitors", de: 'Besucher heute', ja: '本日の訪問者', ko: '오늘 방문자', es: 'Visitantes hoy', it: 'Visitatori di oggi', vi: 'Khách truy cập hôm nay', fr: 'Les visiteurs d\'aujourd\'hui' }),
        tone: 'blue',
      },
      {
        iconSrc: qirifangke,
        numericValue: visits7d,
        valueFormat: 'number',
        label: tr(lang, { zh: '7日访客', en: '7-day visitors', de: 'Besucher (7 Tage)', ja: '7日間の訪問者', ko: '7일 방문자', es: 'Visitantes en 7 días', it: 'Visitatori in 7 giorni', vi: 'Khách truy cập 7 ngày', fr: 'Visiteurs de 7 jours' }),
        tone: 'indigo',
      },
      {
        iconSrc: zhuanhuashuai,
        numericValue: conversionRate,
        valueFormat: 'percent',
        decimals: 2,
        label: tr(lang, { zh: '转化率', en: 'Conversion', de: 'Conversion', ja: 'コンバージョン率', ko: '전환율', es: 'Conversión', it: 'Conversione', vi: 'Chuyển đổi', fr: 'Conversion' }),
        barPercent: Math.min(100, conversionRate * 20),
        tone: 'violet',
      },
    ],
    insight: trafficInsight,
    insightKicker: tr(lang, { zh: '智能摘要', en: 'Smart insight', de: 'Intelligente Zusammenfassung', ja: 'スマートサマリー', ko: '스마트 요약', es: 'Resumen inteligente', it: 'Riepilogo intelligente', vi: 'Tóm tắt thông minh', fr: 'Aperçu intelligent' }),
    lang,
  }
}

function DeltaBadge({
  value,
  label,
  mode = 'percent',
}: {
  value: number | null | undefined
  label: string
  mode?: 'percent' | 'absolute'
}) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null

  const up = value >= 0
  const flat = mode === 'percent' ? Math.abs(value) < 0.05 : value === 0

  return (
    <span className={`merchant-overview-delta${flat ? ' merchant-overview-delta--flat' : up ? ' merchant-overview-delta--up' : ' merchant-overview-delta--down'}`}>
      {flat ? '—' : up ? '↑' : '↓'}
      {!flat
        ? mode === 'absolute'
          ? Math.abs(Math.round(value)).toLocaleString()
          : `${Math.abs(value).toFixed(1)}%`
        : mode === 'absolute'
          ? '0'
          : '0%'}
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
    primaryDeltaMode = 'percent',
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
            <DeltaBadge value={primaryDelta} label={primaryDeltaLabel ?? ''} mode={primaryDeltaMode} />
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
  loading?: boolean
}

export const MerchantDashboardOverview: React.FC<MerchantDashboardOverviewProps> = ({
  data,
  mode,
  loading = false,
}) => {
  if (loading) {
    return mode === 'single' ? (
      <DashboardOverviewSkeleton compact />
    ) : (
      <div className="merchant-dashboard-overview-grid merchant-dashboard-overview-grid--animated">
        <DashboardOverviewSkeleton />
      </div>
    )
  }

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
