import type { Lang } from '../i18n'
import { tr } from '../i18n'

export function McSkeletonBlock({ className = '' }: { className?: string }) {
  return <span className={`mc-skeleton-block ${className}`.trim()} aria-hidden="true" />
}

export function DashboardChartSkeletonShell({ lang }: { lang: Lang }) {
  return (
    <div className="merchant-dashboard-charts-shell merchant-dashboard-charts-shell--animated" aria-busy="true" aria-label={tr(lang, { zh: '图表加载中', en: 'Loading chart', de: 'Diagramm wird geladen', ja: 'グラフを読み込み中', ko: '차트 로딩 중', es: 'Cargando gráfico', it: 'Caricamento grafico', vi: 'Đang tải biểu đồ', fr: 'Chargement du graphique' })}>
      <div className="merchant-dashboard-chart-switch">
        <span className="mc-skeleton-block mc-skeleton-chart-tab" />
        <span className="mc-skeleton-block mc-skeleton-chart-tab" />
        <span className="mc-skeleton-block mc-skeleton-chart-tab" />
      </div>
      <div className="merchant-dashboard-chart-card merchant-dashboard-chart-card--active">
        <div className="merchant-dashboard-chart-card-head">
          <McSkeletonBlock className="mc-skeleton-chart-title" />
          <McSkeletonBlock className="mc-skeleton-chart-legend" />
        </div>
        <div className="merchant-dashboard-chart-wrap merchant-dashboard-chart-skeleton">
          <div className="merchant-dashboard-chart-skeleton-inner" />
        </div>
      </div>
    </div>
  )
}

export function DashboardOverviewSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <article
      className={`merchant-dashboard-overview-card merchant-dashboard-overview-card--traffic merchant-dashboard-overview-card--skeleton${compact ? ' merchant-dashboard-overview-card--compact' : ''}`}
      aria-busy="true"
      aria-hidden="true"
    >
      <header className="merchant-dashboard-overview-head">
        <div className="merchant-dashboard-overview-head-left">
          <McSkeletonBlock className="mc-skeleton-overview-icon" />
          <div className="mc-skeleton-overview-head-text">
            <McSkeletonBlock className="mc-skeleton-overview-title" />
            <McSkeletonBlock className="mc-skeleton-overview-code" />
          </div>
        </div>
        <McSkeletonBlock className="mc-skeleton-overview-spark" />
      </header>
      <div className="merchant-overview-primary">
        <McSkeletonBlock className="mc-skeleton-overview-primary-value" />
        <McSkeletonBlock className="mc-skeleton-overview-primary-label" />
      </div>
      <div className="merchant-overview-metrics mc-skeleton-overview-metrics">
        {[0, 1, 2].map((i) => (
          <div key={i} className="mc-skeleton-overview-metric">
            <McSkeletonBlock className="mc-skeleton-overview-metric-icon" />
            <McSkeletonBlock className="mc-skeleton-overview-metric-label" />
            <McSkeletonBlock className="mc-skeleton-overview-metric-value" />
          </div>
        ))}
      </div>
    </article>
  )
}

export function DashboardHeroMetricsSkeleton() {
  return (
    <div className="merchant-cmd-body merchant-cmd-body--skeleton" aria-busy="true" aria-hidden="true">
      <div className="merchant-cmd-metrics-panel">
        <div className="merchant-cmd-metrics-row merchant-cmd-metrics-row--total">
          {[0, 1, 2].map((i) => (
            <div key={i} className="merchant-cmd-metric-cell merchant-cmd-metric-cell--skeleton">
              <McSkeletonBlock className="mc-skeleton-cmd-metric-icon" />
              <McSkeletonBlock className="mc-skeleton-cmd-metric-label" />
              <McSkeletonBlock className="mc-skeleton-cmd-metric-value" />
            </div>
          ))}
        </div>
        <div className="merchant-cmd-metrics-row merchant-cmd-metrics-row--today">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="merchant-cmd-metric-cell merchant-cmd-metric-cell--skeleton">
              <McSkeletonBlock className="mc-skeleton-cmd-metric-icon" />
              <McSkeletonBlock className="mc-skeleton-cmd-metric-label" />
              <McSkeletonBlock className="mc-skeleton-cmd-metric-value" />
            </div>
          ))}
        </div>
      </div>
      <div className="merchant-cmd-side-board">
        <div className="merchant-cmd-health-row mc-skeleton-cmd-health-row">
          <McSkeletonBlock className="mc-skeleton-cmd-health-factor" />
          <McSkeletonBlock className="mc-skeleton-cmd-health-ring" />
          <McSkeletonBlock className="mc-skeleton-cmd-health-factor" />
        </div>
        <div className="merchant-cmd-followers-card mc-skeleton-cmd-followers">
          <McSkeletonBlock className="mc-skeleton-cmd-followers-pill" />
          <McSkeletonBlock className="mc-skeleton-cmd-followers-chart" />
        </div>
      </div>
    </div>
  )
}

export function PlanHeaderStatsSkeleton() {
  return (
    <div className="merchant-plan-header-stats" aria-busy="true" aria-hidden="true">
      {[0, 1].map((i) => (
        <div key={i} className="merchant-plan-header-stat merchant-plan-header-stat--skeleton">
          <McSkeletonBlock className="mc-skeleton-plan-stat-value" />
          <McSkeletonBlock className="mc-skeleton-plan-stat-label" />
        </div>
      ))}
    </div>
  )
}

export function PlanCurrentLevelSkeleton() {
  return (
    <div className="merchant-plan-current merchant-plan-current--v2" aria-busy="true" aria-hidden="true">
      <div className="merchant-plan-current-card merchant-plan-current-card--skeleton">
        <div className="merchant-plan-current-top">
          <McSkeletonBlock className="mc-skeleton-plan-level-icon" />
          <div className="mc-skeleton-plan-level-copy">
            <McSkeletonBlock className="mc-skeleton-plan-level-kicker" />
            <McSkeletonBlock className="mc-skeleton-plan-level-name" />
            <McSkeletonBlock className="mc-skeleton-plan-level-desc" />
          </div>
        </div>
        <McSkeletonBlock className="mc-skeleton-plan-progress-text" />
        <McSkeletonBlock className="mc-skeleton-plan-progress-bar" />
      </div>
    </div>
  )
}

export function PaidPromoBoardSkeleton({ lang }: { lang: Lang }) {
  return (
    <section
      className="merchant-paid-promo-board merchant-paid-promo-board--skeleton"
      aria-busy="true"
      aria-label={tr(lang, { zh: '推广数据加载中', en: 'Loading promotion data', de: 'Werbedaten werden geladen', ja: 'プロモーションデータを読み込み中', ko: '프로모션 데이터 로딩 중', es: 'Cargando datos de promoción', it: 'Caricamento dati promozione', vi: 'Đang tải dữ liệu quảng cáo', fr: 'Chargement des données de promotion' })}
    >
      <header className="merchant-dashboard-section-head">
        <div className="merchant-paid-promo-board-head">
          <McSkeletonBlock className="mc-skeleton-promo-icon" />
          <div className="mc-skeleton-promo-head-copy">
            <McSkeletonBlock className="mc-skeleton-promo-title" />
            <McSkeletonBlock className="mc-skeleton-promo-sub" />
          </div>
        </div>
      </header>
      <div className="mc-skeleton-promo-card">
        <McSkeletonBlock className="mc-skeleton-promo-line mc-skeleton-promo-line--wide" />
        <McSkeletonBlock className="mc-skeleton-promo-line" />
        <div className="mc-skeleton-promo-metrics">
          {[0, 1, 2].map((i) => (
            <McSkeletonBlock key={i} className="mc-skeleton-promo-metric" />
          ))}
        </div>
      </div>
    </section>
  )
}
