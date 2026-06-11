import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'
import { useMerchantShop } from '../context/MerchantShopContext'
import { MerchantDashboardCharts } from './MerchantDashboardCharts'
import MerchantDashboardStatIcon from '../components/MerchantDashboardStatIcon'
import { MerchantDashboardOverview, type OverviewVariant } from '../components/MerchantDashboardOverview'
import AnimatedMetric from '../components/AnimatedMetric'
import { openCrispChat } from '../utils/crispChat'

const EMPTY_CHART_DATA = [
  { name: 'Mon', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Tue', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Wed', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Thu', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Fri', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Sat', 评分: 0, 访客: 0, 订单: 0 },
  { name: 'Sun', 评分: 0, 访客: 0, 订单: 0 },
]

interface DashboardData {
  productCount: number
  totalSales: number
  orderCount: number
  totalProfit: number
  pendingOrders: number
  unsettledAmount: number
  creditScore: number
  goodRate: number
  followers: number
  visitsTotal: number
  todayOrders: number
  todaySales: number
  todayProfit: number
  shopLevel?: number
  orderTrend: {
    labels: string[]
    orders: number[]
    sales?: number[]
  }
}

const EMPTY_ORDER_SERIES = [0, 0, 0, 0, 0, 0, 0]
const EMPTY_SALES_SERIES = [0, 0, 0, 0, 0, 0, 0]

function HeroIcon({ name }: { name: 'rating' | 'credit' | 'followers' | 'sales' | 'orders' | 'profit' }) {
  const paths: Record<'rating' | 'credit' | 'followers' | 'sales' | 'orders' | 'profit', React.ReactNode> = {
    rating: <path d="M12 3.2l2.2 4.5 4.9.7-3.5 3.4.8 4.9L12 14.8 7.6 16.7l.8-4.9-3.5-3.4 4.9-.7L12 3.2z" fill="currentColor" />,
    credit: (
      <>
        <path d="M12 4.2 5.8 7.2v5.6c0 3.2 2.7 6.2 6.2 7.2 3.5-1 6.2-4 6.2-7.2V7.2L12 4.2z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M9.2 12.2 11 14l3.8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    followers: (
      <>
        <circle cx="9" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <circle cx="15.5" cy="10.2" r="1.8" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M5.8 17.2c.8-2.2 2.6-3.4 4.2-3.4s3.4 1.2 4.2 3.4M13.1 17.2c.5-1.5 1.6-2.4 2.9-2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
    sales: (
      <>
        <circle cx="12" cy="12" r="7.2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M12 8v4l2.8 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    orders: (
      <>
        <path d="M8 5.2h8l1.4 2v10.4c0 .6-.5 1-1 1H7.6c-.5 0-1-.4-1-1V7.2L8 5.2z" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M9 5.2v2h6V5.2M9.2 12h5.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
    profit: (
      <>
        <path d="M6 16.2V9.8l3-2.2 3 1.8 4-3.4v7.2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
        <path d="M6 16.2h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </>
    ),
  }
  return (
    <svg className="merchant-dashboard-hero-metric-icon-svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

const MerchantDashboard: React.FC = () => {
  const navigate = useNavigate()
  const { lang } = useLang()
  const { shop } = useMerchantShop()
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [productCount, setProductCount] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [unsettledAmount, setUnsettledAmount] = useState(0)
  const [goodRate, setGoodRate] = useState(0)
  const [creditScore, setCreditScore] = useState(0)
  const [followers, setFollowers] = useState(0)
  const [visitsTotal, setVisitsTotal] = useState(0)
  const [todayOrders, setTodayOrders] = useState(0)
  const [todaySales, setTodaySales] = useState(0)
  const [todayProfit, setTodayProfit] = useState(0)
  const [shopLevel, setShopLevel] = useState(1)
  const [orderSeries, setOrderSeries] = useState(EMPTY_ORDER_SERIES)
  const [salesSeries, setSalesSeries] = useState(EMPTY_SALES_SERIES)
  const [chartData, setChartData] = useState(EMPTY_CHART_DATA)
  const [activeChart, setActiveChart] = useState<'shop' | 'traffic' | 'orders'>('shop')
  const [overviewTab, setOverviewTab] = useState<OverviewVariant>('shop')
  const [dashboardMounted, setDashboardMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDashboardMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const healthIndex = Math.round((goodRate + Math.min(creditScore, 100)) / 2)

  useEffect(() => {
    const readAuth = (): { shopId: string } | null => {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
        if (!raw) return null
        const parsed = JSON.parse(raw) as { shopId?: string | null }
        const shopId = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
        if (!shopId) return null
        return { shopId }
      } catch {
        return null
      }
    }

    const auth = readAuth()
    if (!auth) {
      return
    }

    const cacheKey = `merchantDashboard:${auth.shopId}`

    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(cacheKey) : null
      if (raw) {
        const cached = JSON.parse(raw) as {
          productCount?: number
          totalSales?: number
          orderCount?: number
          totalProfit?: number
          pendingOrders?: number
          unsettledAmount?: number
          creditScore?: number
          goodRate?: number
          followers?: number
          visitsTotal?: number
          todayOrders?: number
          todaySales?: number
          todayProfit?: number
          shopLevel?: number
          orderSeries?: number[]
          salesSeries?: number[]
          chartData?: typeof EMPTY_CHART_DATA
        }
        setProductCount(cached.productCount ?? 0)
        setTotalSales(Number(cached.totalSales ?? 0))
        setOrderCount(cached.orderCount ?? 0)
        setTotalProfit(Number(cached.totalProfit ?? 0))
        setPendingOrdersCount(cached.pendingOrders ?? 0)
        setUnsettledAmount(Number(cached.unsettledAmount ?? 0))
        setCreditScore(Number(cached.creditScore ?? 0))
        setGoodRate(Number(cached.goodRate ?? 0))
        setFollowers(Number(cached.followers ?? 0))
        setVisitsTotal(Number(cached.visitsTotal ?? 0))
        setTodayOrders(cached.todayOrders ?? 0)
        setTodaySales(Number(cached.todaySales ?? 0))
        setTodayProfit(Number(cached.todayProfit ?? 0))
        setShopLevel(Number(cached.shopLevel ?? 1))
        if (Array.isArray(cached.orderSeries) && cached.orderSeries.length === 7) {
          setOrderSeries(cached.orderSeries)
        }
        if (Array.isArray(cached.salesSeries) && cached.salesSeries.length === 7) {
          setSalesSeries(cached.salesSeries)
        }
        if (Array.isArray(cached.chartData) && cached.chartData.length === 7) {
          setChartData(cached.chartData)
        }
      }
    } catch {
      // ignore cache errors
    }

    const fetchDashboard = async () => {
      try {
        const res = await api.get<DashboardData>(`/api/shops/${encodeURIComponent(auth.shopId)}/dashboard`)
        const nextProductCount = res.productCount ?? 0
        const nextTotalSales = Number(res.totalSales ?? 0)
        const nextOrderCount = res.orderCount ?? 0
        const nextTotalProfit = Number(res.totalProfit ?? 0)
        const nextPendingOrders = res.pendingOrders ?? 0
        const nextUnsettledAmount = Number(res.unsettledAmount ?? 0)
        const nextCreditScore = Number(res.creditScore ?? 0)
        const nextFollowers = Number(res.followers ?? 0)
        const rate = Number(res.goodRate ?? 0)
        const nextGoodRate = Number.isFinite(rate) ? Math.max(0, Math.min(100, rate)) : 0
        const nextVisitsTotal = Number(res.visitsTotal ?? 0)
        const nextTodayOrders = res.todayOrders ?? 0
        const nextTodaySales = Number(res.todaySales ?? 0)
        const nextTodayProfit = Number(res.todayProfit ?? 0)
        const nextShopLevel = Number(res.shopLevel ?? 1)

        let nextChart = EMPTY_CHART_DATA
        const labels = res.orderTrend?.labels ?? []
        const orders = res.orderTrend?.orders ?? []
        const sales = res.orderTrend?.sales ?? []
        const nextOrderSeries =
          orders.length === 7 ? orders.map((value) => Number(value) || 0) : EMPTY_ORDER_SERIES
        const nextSalesSeries =
          sales.length === 7 ? sales.map((value) => Number(value) || 0) : nextOrderSeries.map(() => 0)

        if (labels.length === 7 && orders.length === 7) {
          const visits30d = Math.max(0, Math.round(nextVisitsTotal))
          const visits7d = Math.max(0, Math.round((visits30d / 30) * 7))
          const visitsPerDay = visits7d > 0 ? Math.max(0, Math.round((visits7d / 7) * 10) / 10) : 0
          nextChart = labels.map((name, idx) => ({
            name,
            评分: nextGoodRate / 20,
            访客: visitsPerDay,
            订单: orders[idx] ?? 0,
          }))
        }

        setProductCount(nextProductCount)
        setTotalSales(nextTotalSales)
        setOrderCount(nextOrderCount)
        setTotalProfit(nextTotalProfit)
        setPendingOrdersCount(nextPendingOrders)
        setUnsettledAmount(nextUnsettledAmount)
        setCreditScore(nextCreditScore)
        setFollowers(nextFollowers)
        setGoodRate(nextGoodRate)
        setVisitsTotal(nextVisitsTotal)
        setTodayOrders(nextTodayOrders)
        setTodaySales(nextTodaySales)
        setTodayProfit(nextTodayProfit)
        setShopLevel(nextShopLevel)
        setOrderSeries(nextOrderSeries)
        setSalesSeries(nextSalesSeries)
        setChartData(nextChart)

        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              cacheKey,
              JSON.stringify({
                productCount: nextProductCount,
                totalSales: nextTotalSales,
                orderCount: nextOrderCount,
                totalProfit: nextTotalProfit,
                pendingOrders: nextPendingOrders,
                unsettledAmount: nextUnsettledAmount,
                creditScore: nextCreditScore,
                goodRate: nextGoodRate,
                followers: nextFollowers,
                visitsTotal: nextVisitsTotal,
                todayOrders: nextTodayOrders,
                todaySales: nextTodaySales,
                todayProfit: nextTodayProfit,
                shopLevel: nextShopLevel,
                orderSeries: nextOrderSeries,
                salesSeries: nextSalesSeries,
                chartData: nextChart,
              }),
            )
          }
        } catch {
          // ignore cache write errors
        }
      } catch {
        // keep defaults
      }
    }

    fetchDashboard()

    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') fetchDashboard()
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible)
    }
    const timer = window.setInterval(fetchDashboard, 5000)
    return () => {
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [])

  const visits30d = Math.max(0, Math.round(visitsTotal))
  const visits7d = Math.max(0, Math.round((visits30d / 30) * 7))
  const visitsToday = Math.max(0, Math.round(visits30d / 30))

  const formatXAxisLabel = (value: string | number): string => {
    const v = String(value)
    const zhFromEn: Record<string, string> = {
      Mon: '周一',
      Tue: '周二',
      Wed: '周三',
      Thu: '周四',
      Fri: '周五',
      Sat: '周六',
      Sun: '周日',
    }
    const enFromZh: Record<string, string> = {
      周一: 'Mon',
      周二: 'Tue',
      周三: 'Wed',
      周四: 'Thu',
      周五: 'Fri',
      周六: 'Sat',
      周日: 'Sun',
    }

    if (lang === 'zh') {
      return zhFromEn[v] ?? v
    }
    return enFromZh[v] ?? v
  }

  const overviewTabs = [
    { id: 'shop' as const, zh: '店铺概况', en: 'Shop', icon: '★' },
    { id: 'traffic' as const, zh: '流量概况', en: 'Traffic', icon: '↗' },
    { id: 'today' as const, zh: '今日概况', en: 'Today', icon: '◎' },
  ]

  const overviewData = {
    lang,
    goodRate,
    creditScore,
    followers,
    shopLevel,
    visitsToday,
    visits7d,
    visits30d,
    visitsTotal,
    orderCount,
    todayOrders,
    todaySales,
    todayProfit,
    pendingOrders: pendingOrdersCount,
    orderSeries,
    salesSeries,
  }

  return (
    <div className={`merchant-dashboard merchant-dashboard--v2${dashboardMounted ? ' merchant-dashboard--mounted' : ''}`}>
      <section className="merchant-dashboard-hero merchant-dashboard-hero--v2 merchant-dashboard-hero--animated">
        <div className="merchant-dashboard-hero-bg" aria-hidden="true" />
        <div className="merchant-dashboard-hero-shine" aria-hidden="true" />
        <div className="merchant-dashboard-hero-grid" aria-hidden="true" />
        <div className="merchant-dashboard-hero-orb" aria-hidden="true" />
        <span className="merchant-dashboard-hero-corner merchant-dashboard-hero-corner--tl" aria-hidden="true" />
        <span className="merchant-dashboard-hero-corner merchant-dashboard-hero-corner--br" aria-hidden="true" />

        <div className="merchant-dashboard-hero-inner">
          <div className="merchant-dashboard-hero-head">
            <div className="merchant-dashboard-hero-head-bar">
              <span className="merchant-dashboard-hero-eyebrow">
                {lang === 'zh' ? '数据仪表盘' : 'Dashboard'}
              </span>
              <span className="merchant-dashboard-hero-live">
                <span className="merchant-dashboard-hero-live-dot" aria-hidden="true" />
                {lang === 'zh' ? '实时同步' : 'Live sync'}
              </span>
            </div>
            <h2 className="merchant-dashboard-hero-title">
              {lang === 'zh' ? '今日店铺概况' : 'Today at a glance'}
            </h2>
            <p className="merchant-dashboard-hero-subtitle">
              {lang === 'zh'
                ? '实时掌握店铺经营健康度与今日表现'
                : 'Real-time view of shop health and today\'s performance'}
            </p>
            <div className="merchant-dashboard-hero-tags-row">
              <span className="merchant-dashboard-hero-tag-pill">
                {lang === 'zh' ? '健康指数' : 'Health index'}
                <strong>
                  <AnimatedMetric value={healthIndex} format="number" duration={900} />
                </strong>
              </span>
              <span className="merchant-dashboard-hero-tag-pill merchant-dashboard-hero-tag-pill--muted">
                {lang === 'zh' ? '7日趋势' : '7-day trend'}
                <strong>{lang === 'zh' ? '稳定' : 'Stable'}</strong>
              </span>
            </div>
          </div>

          <div className="merchant-dashboard-hero-data">
            <div className="merchant-dashboard-hero-block">
              <div className="merchant-dashboard-hero-block-head">
                <span className="merchant-dashboard-hero-block-title">
                  {lang === 'zh' ? '店铺健康度' : 'Shop health'}
                </span>
                <span className="merchant-dashboard-hero-block-code">SHOP · METRICS</span>
              </div>
              <div className="merchant-dashboard-hero-shop-row">
                <div className="merchant-dashboard-hero-shop-item merchant-dashboard-hero-shop-item--rating">
                  <span className="merchant-dashboard-hero-metric-icon merchant-dashboard-hero-metric-icon--rating">
                    <HeroIcon name="rating" />
                  </span>
                  <div className="merchant-dashboard-hero-shop-text">
                    <span className="merchant-dashboard-hero-shop-label">
                      {lang === 'zh' ? '好评率' : 'Rating'}
                    </span>
                    <span className="merchant-dashboard-hero-shop-value">
                      <AnimatedMetric value={goodRate} format="percent" decimals={1} />
                    </span>
                  </div>
                  <span className="merchant-dashboard-hero-microbar" aria-hidden="true">
                    <span
                      className="merchant-dashboard-hero-microbar-fill"
                      style={{ '--mc-bar-scale': String(Math.min(1, goodRate / 100)) } as React.CSSProperties}
                    />
                  </span>
                </div>
                <div className="merchant-dashboard-hero-shop-divider" aria-hidden="true" />
                <div className="merchant-dashboard-hero-shop-item merchant-dashboard-hero-shop-item--credit">
                  <span className="merchant-dashboard-hero-metric-icon merchant-dashboard-hero-metric-icon--credit">
                    <HeroIcon name="credit" />
                  </span>
                  <div className="merchant-dashboard-hero-shop-text">
                    <span className="merchant-dashboard-hero-shop-label">
                      {lang === 'zh' ? '信用分' : 'Credit'}
                    </span>
                    <span className="merchant-dashboard-hero-shop-value">
                      <AnimatedMetric value={creditScore} format="number" />
                    </span>
                  </div>
                  <span className="merchant-dashboard-hero-microbar" aria-hidden="true">
                    <span
                      className="merchant-dashboard-hero-microbar-fill"
                      style={{ '--mc-bar-scale': String(Math.min(1, creditScore / 100)) } as React.CSSProperties}
                    />
                  </span>
                </div>
                <div className="merchant-dashboard-hero-shop-divider" aria-hidden="true" />
                <div className="merchant-dashboard-hero-shop-item merchant-dashboard-hero-shop-item--followers">
                  <span className="merchant-dashboard-hero-metric-icon merchant-dashboard-hero-metric-icon--followers">
                    <HeroIcon name="followers" />
                  </span>
                  <div className="merchant-dashboard-hero-shop-text">
                    <span className="merchant-dashboard-hero-shop-label">
                      {lang === 'zh' ? '关注' : 'Followers'}
                    </span>
                    <span className="merchant-dashboard-hero-shop-value">
                      <AnimatedMetric value={followers} format="compact" />
                    </span>
                  </div>
                  <span className="merchant-dashboard-hero-microbar" aria-hidden="true">
                    <span
                      className="merchant-dashboard-hero-microbar-fill merchant-dashboard-hero-microbar-fill--violet"
                      style={{ '--mc-bar-scale': String(Math.min(1, (followers * 5) / 100)) } as React.CSSProperties}
                    />
                  </span>
                </div>
              </div>
            </div>

            <div className="merchant-dashboard-hero-block">
              <div className="merchant-dashboard-hero-block-head">
                <span className="merchant-dashboard-hero-block-title">
                  {lang === 'zh' ? '今日交易' : 'Today\'s trading'}
                </span>
                <span className="merchant-dashboard-hero-block-code merchant-dashboard-hero-block-code--gold">
                  {lang === 'zh' ? '实时' : 'LIVE'} · {new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="merchant-dashboard-hero-today-row">
                <div className="merchant-dashboard-hero-today-item merchant-dashboard-hero-today-item--sales">
                  <span className="merchant-dashboard-hero-metric-icon merchant-dashboard-hero-metric-icon--sales">
                    <HeroIcon name="sales" />
                  </span>
                  <span className="merchant-dashboard-hero-today-label">
                    {lang === 'zh' ? '今日销售额' : "Today's sales"}
                  </span>
                  <span className="merchant-dashboard-hero-today-value">
                    <AnimatedMetric value={todaySales} format="currency" />
                  </span>
                </div>
                <div className="merchant-dashboard-hero-today-item">
                  <span className="merchant-dashboard-hero-metric-icon merchant-dashboard-hero-metric-icon--orders">
                    <HeroIcon name="orders" />
                  </span>
                  <span className="merchant-dashboard-hero-today-label">
                    {lang === 'zh' ? '今日订单' : 'Orders'}
                  </span>
                  <span className="merchant-dashboard-hero-today-value">
                    <AnimatedMetric value={todayOrders} format="number" />
                  </span>
                </div>
                <div className="merchant-dashboard-hero-today-item">
                  <span className="merchant-dashboard-hero-metric-icon merchant-dashboard-hero-metric-icon--profit">
                    <HeroIcon name="profit" />
                  </span>
                  <span className="merchant-dashboard-hero-today-label">
                    {lang === 'zh' ? '预计利润' : 'Profit'}
                  </span>
                  <span className="merchant-dashboard-hero-today-value">
                    <AnimatedMetric value={todayProfit} format="currency" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {pendingOrdersCount > 0 && (
        <button
          type="button"
          className="merchant-dashboard-pending-bar"
          onClick={() => navigate('/orders')}
        >
          <span className="merchant-dashboard-pending-bar-icon" aria-hidden="true">!</span>
          <span className="merchant-dashboard-pending-bar-text">
            {lang === 'zh'
              ? `您有 ${pendingOrdersCount} 笔待处理订单`
              : `${pendingOrdersCount} pending order(s) need attention`}
          </span>
          <span className="merchant-dashboard-pending-bar-action">
            {lang === 'zh' ? '去处理 →' : 'View →'}
          </span>
        </button>
      )}

      <section className="merchant-dashboard-section">
        <header className="merchant-dashboard-section-head">
          <h3 className="merchant-dashboard-section-title">
            {lang === 'zh' ? '核心指标' : 'Key metrics'}
          </h3>
          <p className="merchant-dashboard-section-desc">
            {lang === 'zh' ? '累计经营数据一览' : 'Cumulative business overview'}
          </p>
        </header>
        <div className="merchant-dashboard-stats merchant-dashboard-stats--v2 merchant-dashboard-stats--animated">
          <div className="merchant-dashboard-stat merchant-dashboard-stat--products" style={{ '--mc-stagger': '0.05s' } as React.CSSProperties}>
            <MerchantDashboardStatIcon variant="products" />
            <span className="merchant-dashboard-stat-value">
              <AnimatedMetric value={productCount} format="number" />
            </span>
            <span className="merchant-dashboard-stat-label">
              {lang === 'zh' ? '商品总数' : 'Total products'}
            </span>
          </div>
          <div className="merchant-dashboard-stat merchant-dashboard-stat--sales" style={{ '--mc-stagger': '0.1s' } as React.CSSProperties}>
            <MerchantDashboardStatIcon variant="sales" />
            <span className="merchant-dashboard-stat-value">
              <AnimatedMetric value={totalSales} format="currency" />
            </span>
            <span className="merchant-dashboard-stat-label">
              {lang === 'zh' ? '销售总额' : 'Total sales'}
            </span>
          </div>
          <div className="merchant-dashboard-stat merchant-dashboard-stat--orders" style={{ '--mc-stagger': '0.15s' } as React.CSSProperties}>
            <MerchantDashboardStatIcon variant="orders" />
            <span className="merchant-dashboard-stat-value">
              <AnimatedMetric value={orderCount} format="number" />
            </span>
            <span className="merchant-dashboard-stat-label">
              {lang === 'zh' ? '总订单' : 'Total orders'}
            </span>
          </div>
          <div className="merchant-dashboard-stat merchant-dashboard-stat--profit" style={{ '--mc-stagger': '0.2s' } as React.CSSProperties}>
            <MerchantDashboardStatIcon variant="profit" />
            <span className="merchant-dashboard-stat-value">
              <AnimatedMetric value={totalProfit} format="currency" />
            </span>
            <span className="merchant-dashboard-stat-label">
              {lang === 'zh' ? '总利润' : 'Total profit'}
            </span>
          </div>
          <div
            className="merchant-dashboard-stat merchant-dashboard-stat--pending merchant-dashboard-stat--highlight"
            style={{ '--mc-stagger': '0.25s' } as React.CSSProperties}
          >
            <MerchantDashboardStatIcon variant="pending" />
            <span className="merchant-dashboard-stat-value">
              <AnimatedMetric value={pendingOrdersCount} format="number" />
            </span>
            <span className="merchant-dashboard-stat-label">
              {lang === 'zh' ? '待处理订单' : 'Pending orders'}
            </span>
            {pendingOrdersCount > 0 && (
              <button
                type="button"
                className="merchant-dashboard-stat-btn"
                onClick={() => navigate('/orders')}
              >
                {lang === 'zh' ? '立即处理' : 'View orders'}
              </button>
            )}
          </div>
          <div className="merchant-dashboard-stat merchant-dashboard-stat--unsettled" style={{ '--mc-stagger': '0.3s' } as React.CSSProperties}>
            <MerchantDashboardStatIcon variant="unsettled" />
            <span className="merchant-dashboard-stat-value">
              <AnimatedMetric value={unsettledAmount} format="currency" />
            </span>
            <span className="merchant-dashboard-stat-label">
              {lang === 'zh' ? '待结算金额' : 'Unsettled amount'}
            </span>
          </div>
        </div>
      </section>

      <section className="merchant-dashboard-segments" aria-label={lang === 'zh' ? '数据概况' : 'Overview'}>
        <header className="merchant-dashboard-section-head merchant-dashboard-section-head--inset">
          <h3 className="merchant-dashboard-section-title">
            {lang === 'zh' ? '数据概况' : 'Overview'}
          </h3>
        </header>
        <div className="merchant-dashboard-segments-tabs" role="tablist">
          {overviewTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={overviewTab === tab.id}
              className={`merchant-dashboard-segments-tab${
                overviewTab === tab.id ? ' merchant-dashboard-segments-tab--active' : ''
              }`}
              onClick={() => setOverviewTab(tab.id)}
            >
              <span className="merchant-dashboard-segments-tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
              {lang === 'zh' ? tab.zh : tab.en}
            </button>
          ))}
        </div>
        <div className="merchant-dashboard-segments-panel" role="tabpanel">
          <MerchantDashboardOverview data={overviewData} mode="single" activeVariant={overviewTab} />
        </div>
      </section>

      <section className="merchant-dashboard-section merchant-dashboard-overviews merchant-dashboard-overviews--desktop">
        <header className="merchant-dashboard-section-head">
          <h3 className="merchant-dashboard-section-title">
            {lang === 'zh' ? '多维分析' : 'Multi-dimensional analysis'}
          </h3>
          <p className="merchant-dashboard-section-desc">
            {lang === 'zh' ? '核心维度趋势、环比与智能洞察' : 'Trends, deltas, and actionable insights'}
          </p>
        </header>
        <MerchantDashboardOverview data={overviewData} mode="grid" />
      </section>

      <section className="merchant-dashboard-section merchant-dashboard-section--charts">
        <header className="merchant-dashboard-section-head">
          <h3 className="merchant-dashboard-section-title">
            {lang === 'zh' ? '趋势分析' : 'Trend analysis'}
          </h3>
          <p className="merchant-dashboard-section-desc">
            {lang === 'zh' ? '近 7 日数据走势' : 'Last 7 days at a glance'}
          </p>
        </header>
        <MerchantDashboardCharts
          chartData={chartData}
          activeChart={activeChart}
          setActiveChart={setActiveChart}
          formatXAxisLabel={formatXAxisLabel}
          lang={lang}
        />
      </section>

      <button
        type="button"
        className="merchant-dashboard-fab merchant-dashboard-fab--chat"
        aria-label={lang === 'zh' ? '客服' : 'Customer service'}
        onClick={() => openCrispChat({ shopName: shop?.name, shopId: shop?.id })}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      </button>
      <button
        type="button"
        className="merchant-dashboard-fab merchant-dashboard-fab--feedback"
        aria-label={lang === 'zh' ? '反馈' : 'Feedback'}
        onClick={() => openCrispChat({ shopName: shop?.name, shopId: shop?.id })}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </button>
    </div>
  )
}

export default MerchantDashboard
