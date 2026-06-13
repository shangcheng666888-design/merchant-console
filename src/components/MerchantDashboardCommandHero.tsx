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
import walletMain from '../assets/wallet-main.png'
import haopinglv from '../assets/haopinglv.png'
import xinyongfen from '../assets/xinyongfen.png'
import guanzhu from '../assets/guanzhu.png'
import {
  getMerchantShopLevel,
  getMerchantShopLevelProgress,
  shopLevelDisplayName,
  shopLevelSellerTitle,
} from '../constants/merchantShopLevels'
import MiniSparkline from './MiniSparkline'
import { DashboardHeroMetricsSkeleton, McSkeletonBlock } from './McLoadingSkeletons'
import type { Lang } from '../i18n'
import { intlLocale, tr } from '../i18n'

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
  lang: Lang
  shopName: string
  shopId?: string
  shopLogo: string | null
  shopLevel: number
  healthIndex: number
  goodRate: number
  creditScore: number
  followers: number
  followerSeries: number[]
  /** 店铺累计销售额 shops.sales，用于等级进度与展示 */
  levelSales: number
  levelLocked?: boolean
  levelSalesBaseline?: number | null
  orderCount: number
  totalProfit: number
  productCount: number
  todaySales: number
  todayOrders: number
  expectedProfit: number
  unsettledAmount: number
  pendingOrders: number
  metricsLoading?: boolean
  onNavigate: (path: string) => void
}

function formatLevelProgressLabel(
  lang: Lang,
  next: ReturnType<typeof getMerchantShopLevelProgress>['next'],
  remain: number,
): string {
  if (!next) {
    return tr(lang, { zh: '已达最高等级', en: 'Max level reached', de: 'Höchstes Level erreicht', ja: '最高レベルに到達しました', ko: '최고 등급 달성', es: 'Nivel máximo alcanzado', it: 'Livello massimo raggiunto', vi: 'Đã đạt cấp cao nhất' })
  }
  const nextName = shopLevelDisplayName(next, lang)
  const remainText = remain.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return tr(lang, {
    zh: `距${nextName}还差 $${remainText}`,
    en: `$${remainText} to ${next.nameEn}`,
    de: `Noch $${remainText} bis ${nextName}`,
    ja: `次の${nextName}まであと $${remainText}`,
    ko: `다음 ${nextName}까지 $${remainText} 남음`,
    es: `$${remainText} para ${nextName}`,
    it: `$${remainText} per ${nextName}`, vi: `Còn $${remainText} để lên ${nextName}`,
  })
}

const MerchantDashboardCommandHero: React.FC<CommandHeroProps> = ({
  lang,
  shopName,
  shopId = '',
  shopLogo,
  shopLevel,
  healthIndex,
  goodRate,
  creditScore,
  followers,
  followerSeries,
  levelSales,
  levelLocked = false,
  levelSalesBaseline = null,
  orderCount,
  totalProfit,
  productCount,
  todaySales,
  todayOrders,
  expectedProfit,
  unsettledAmount,
  pendingOrders,
  metricsLoading = false,
  onNavigate,
}) => {
  const levelInfo = getMerchantShopLevel(shopLevel)
  const {
    next: nextLevel,
    progress: levelProgress,
    remain: levelRemain,
  } = getMerchantShopLevelProgress(shopLevel, levelSales, {
    levelLocked,
    levelSalesBaseline,
  })
  const levelProgressLabel = formatLevelProgressLabel(lang, nextLevel, levelRemain)
  const followerWeekGain = followerSeries.reduce((sum, value) => sum + value, 0)

  const dateLabel = new Date().toLocaleDateString(intlLocale(lang), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  const displayShopName = shopName || tr(lang, { zh: '我的店铺', en: 'My shop', de: 'Mein Shop', ja: 'マイ店舗', ko: '내 매장', es: 'Mi tienda', it: 'Il mio negozio', vi: 'Cửa hàng của tôi' })
  const shopIdLabel = shopId
    ? `${tr(lang, { zh: '店铺 ID', en: 'Shop ID', de: 'Shop-ID', ja: '店舗 ID', ko: '매장 ID', es: 'ID de la tienda', it: 'ID negozio', vi: 'ID cửa hàng' })} · ${shopId}`
    : ''

  const quickActions: { key: CmdActionKey; path: string; zh: string; en: string; de: string; ja: string; ko: string; es: string; it: string; vi: string; badge: number; primary: boolean; iconSrc?: string }[] = [
    { key: 'orders', path: '/orders', zh: '待发货', en: 'Fulfillment', de: 'Versand', ja: '発送待ち', ko: '발송 대기', es: 'Envíos', it: 'Evasione ordini', vi: 'Giao hàng', badge: pendingOrders, primary: pendingOrders > 0, iconSrc: daifahuo },
    { key: 'plan', path: '/plan', zh: '运营计划', en: 'Growth plan', de: 'Wachstumsplan', ja: '運営プラン', ko: '운영 플랜', es: 'Plan de crecimiento', it: 'Piano di crescita', vi: 'Kế hoạch tăng trưởng', badge: 0, primary: false, iconSrc: yunyingjihua },
    { key: 'finance', path: '/finance', zh: '财务报告', en: 'Finance', de: 'Finanzen', ja: '財務レポート', ko: '재무 보고서', es: 'Finanzas', it: 'Finanze', vi: 'Tài chính', badge: 0, primary: false, iconSrc: caiwubaogao },
    { key: 'wallet', path: '/wallet', zh: '我的钱包', en: 'Wallet', de: 'Wallet', ja: 'ウォレット', ko: '내 지갑', es: 'Cartera', it: 'Portafoglio', vi: 'Ví', badge: 0, primary: false, iconSrc: walletMain },
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
          <span className="merchant-cmd-date">{dateLabel}</span>

          <div className="merchant-cmd-identity">
            <div className={`merchant-cmd-shop-emblem merchant-cmd-shop-emblem--${levelInfo.key}`}>
              <img
                src={shopLogo || levelInfo.icon}
                alt=""
                className={`merchant-cmd-shop-emblem-img${shopLogo ? '' : ' merchant-cmd-shop-emblem-img--icon'}`}
              />
            </div>

            <div className="merchant-cmd-identity-body">
              <div className="merchant-cmd-shop-head">
                <h2 className="merchant-cmd-shop-name" title={displayShopName}>
                  {displayShopName}
                </h2>
                {shopId ? (
                  <span className="merchant-cmd-shop-id" title={shopId}>
                    {shopIdLabel}
                  </span>
                ) : null}
              </div>

              <div className="merchant-cmd-level-row">
                <span className={`merchant-cmd-level-badge merchant-cmd-level-badge--${levelInfo.key}`}>
                  <img src={levelInfo.icon} alt="" className="merchant-cmd-level-badge-icon" />
                  {shopLevelSellerTitle(levelInfo, lang)}
                </span>
                <button type="button" className="merchant-cmd-level-link" onClick={() => onNavigate('/plan')}>
                  {tr(lang, { zh: '查看等级权益', en: 'View level benefits', de: 'Level-Vorteile anzeigen', ja: 'レベル特典を見る', ko: '등급 혜택 보기', es: 'Ver beneficios del nivel', it: 'Vedi vantaggi del livello', vi: 'Xem quyền lợi cấp bậc' })}
                </button>
              </div>

              <div className={`merchant-cmd-level-progress${metricsLoading ? ' merchant-cmd-level-progress--skeleton' : ''}`}>
                {metricsLoading ? (
                  <>
                    <McSkeletonBlock className="mc-skeleton-cmd-progress-meta" />
                    <McSkeletonBlock className="mc-skeleton-cmd-progress-track" />
                  </>
                ) : (
                  <>
                    <div className="merchant-cmd-level-progress-meta">
                      <span>{levelProgressLabel}</span>
                      <strong>{Math.round(levelProgress)}%</strong>
                    </div>
                    <span
                      className="merchant-cmd-level-progress-track"
                      role="progressbar"
                      aria-valuenow={Math.round(levelProgress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={levelProgressLabel}
                    >
                      <span
                        className="merchant-cmd-level-progress-fill"
                        style={{ width: `${Math.min(100, Math.max(0, levelProgress))}%` }}
                      />
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="merchant-cmd-total-sales">
            <span className="merchant-cmd-total-sales-icon merchant-cmd-total-sales-icon--img" aria-hidden="true">
              <img src={leijixiaoshoue} alt="" className="merchant-cmd-total-sales-icon-img" />
            </span>
            <div className="merchant-cmd-total-sales-body">
              <span className="merchant-cmd-total-sales-label">
                {tr(lang, { zh: '累计销售额', en: 'Total sales', de: 'Gesamtumsatz', ja: '累計売上', ko: '누적 매출', es: 'Ventas acumuladas', it: 'Vendite totali', vi: 'Tổng doanh thu' })}
              </span>
              {metricsLoading ? (
                <McSkeletonBlock className="merchant-cmd-total-sales-value merchant-cmd-total-sales-value--skeleton" />
              ) : (
                <AnimatedMetric
                  value={levelSales}
                  format="currency"
                  decimals={0}
                  className="merchant-cmd-total-sales-value"
                />
              )}
            </div>
          </div>
        </header>

        {metricsLoading ? (
          <DashboardHeroMetricsSkeleton />
        ) : (
        <div className="merchant-cmd-body">
          <div className="merchant-cmd-metrics-panel">
            <div className="merchant-cmd-metrics-row merchant-cmd-metrics-row--total">
              <MetricCell
                icon="orders"
                iconSrc={zongdingdan}
                tone="indigo"
                label={tr(lang, { zh: '总订单', en: 'Total orders', de: 'Bestellungen gesamt', ja: '注文合計', ko: '총 주문', es: 'Pedidos totales', it: 'Ordini totali', vi: 'Tổng đơn hàng' })}
                value={orderCount}
                format="number"
              />
              <MetricCell
                icon="profit"
                iconSrc={zonglirun}
                tone="blue"
                label={tr(lang, { zh: '总利润', en: 'Total profit', de: 'Gesamtgewinn', ja: '利益合計', ko: '총 이익', es: 'Beneficio total', it: 'Profitto totale', vi: 'Tổng lợi nhuận' })}
                value={totalProfit}
                format="currency"
              />
              <MetricCell
                icon="products"
                iconSrc={shangpinzongshu}
                tone="violet"
                label={tr(lang, { zh: '商品总数', en: 'Total products', de: 'Produkte gesamt', ja: '商品数', ko: '총 상품 수', es: 'Productos totales', it: 'Prodotti totali', vi: 'Tổng sản phẩm' })}
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
                label={tr(lang, { zh: '今日销售额', en: "Today's sales", de: 'Umsatz heute', ja: '本日の売上', ko: '오늘 매출', es: 'Ventas de hoy', it: 'Vendite di oggi', vi: 'Doanh thu hôm nay' })}
                value={todaySales}
                format="currency"
              />
              <MetricCell
                icon="orders"
                iconSrc={jinridingdan}
                tone="green"
                label={tr(lang, { zh: '今日订单', en: "Today's orders", de: 'Bestellungen heute', ja: '本日の注文', ko: '오늘 주문', es: 'Pedidos de hoy', it: 'Ordini di oggi', vi: 'Đơn hàng hôm nay' })}
                value={todayOrders}
                format="number"
              />
              <MetricCell
                icon="profit"
                iconSrc={yujilirun}
                tone="lime"
                label={tr(lang, { zh: '预计利润', en: 'Expected profit', de: 'Erwarteter Gewinn', ja: '見込み利益', ko: '예상 이익', es: 'Beneficio estimado', it: 'Profitto stimato', vi: 'Lợi nhuận dự kiến' })}
                value={expectedProfit}
                format="currency"
              />
              <MetricCell
                icon="unsettled"
                iconSrc={daijiesuan}
                tone="teal"
                label={tr(lang, { zh: '待结算金额', en: 'Unsettled amount', de: 'Ausstehender Betrag', ja: '未精算金額', ko: '미정산 금액', es: 'Importe pendiente de liquidar', it: 'Importo da liquidare', vi: 'Số tiền chờ thanh toán' })}
                value={unsettledAmount}
                format="currency"
              />
            </div>
          </div>

          <div className="merchant-cmd-side-board">
            <div className="merchant-cmd-health-row">
              <HealthFactor
                label={tr(lang, { zh: '好评率', en: 'Rating', de: 'Bewertung', ja: '評価', ko: '좋은 평가율', es: 'Valoración', it: 'Valutazione', vi: 'Đánh giá' })}
                value={goodRate}
                format="percent"
                decimals={1}
                tone="emerald"
                iconSrc={haopinglv}
              />
              <HealthRing value={healthIndex} label={tr(lang, { zh: '健康综合分', en: 'Health score', de: 'Gesundheitswert', ja: '健全性スコア', ko: '건강 종합 점수', es: 'Puntuación de salud', it: 'Punteggio salute', vi: 'Điểm sức khỏe' })} />
              <HealthFactor
                label={tr(lang, { zh: '信用分', en: 'Credit', de: 'Kreditwert', ja: '信用スコア', ko: '신용 점수', es: 'Puntuación de crédito', it: 'Credito', vi: 'Điểm tín dụng' })}
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
                <span className="merchant-cmd-followers-pill-label">{tr(lang, { zh: '关注', en: 'Followers', de: 'Follower', ja: 'フォロワー', ko: '팔로워', es: 'Seguidores', it: 'Follower', vi: 'Người theo dõi' })}</span>
                <AnimatedMetric value={followers} format="compact" className="merchant-cmd-followers-pill-value" />
              </div>
              <div className="merchant-cmd-followers-trend">
                <div className="merchant-cmd-followers-trend-head">
                  <span className="merchant-cmd-followers-trend-title">
                    {tr(lang, { zh: '7日关注趋势', en: '7-day follower trend', de: '7-Tage-Follower-Trend', ja: '7日間のフォロワー推移', ko: '7일 팔로워 추이', es: 'Tendencia de seguidores en 7 días', it: 'Andamento follower in 7 giorni', vi: 'Xu hướng người theo dõi 7 ngày' })}
                  </span>
                  <span className="merchant-cmd-followers-trend-delta">
                    {followerWeekGain > 0 ? `+${followerWeekGain}` : followerWeekGain === 0 ? tr(lang, { zh: '持平', en: 'Flat', de: 'Unverändert', ja: '横ばい', ko: '변동 없음', es: 'Sin cambios', it: 'Stabile', vi: 'Ổn định' }) : followerWeekGain}
                    {followerWeekGain > 0 ? (
                      <span className="merchant-cmd-followers-trend-delta-label">
                        {tr(lang, { zh: ' 本周', en: ' this week', de: ' diese Woche', ja: ' 今週', ko: ' 이번 주', es: ' esta semana', it: ' questa settimana', vi: ' tuần này' })}
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
        )}

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
                {tr(lang, { zh: action.zh, en: action.en, de: action.de, ja: action.ja, ko: action.ko, es: action.es, it: action.it, vi: action.vi })}
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
