import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'
import { useMerchantShop } from '../context/MerchantShopContext'
import { MerchantDashboardCharts } from './MerchantDashboardCharts'
import MerchantDashboardStatIcon from '../components/MerchantDashboardStatIcon'
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
  orderTrend: {
    labels: string[]
    orders: number[]
  }
}

function MetricTile({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="merchant-dashboard-metric-tile">
      <span className="merchant-dashboard-metric-value">{value}</span>
      <span className="merchant-dashboard-metric-label">{label}</span>
    </div>
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
  const [chartData, setChartData] = useState(EMPTY_CHART_DATA)
  const [activeChart, setActiveChart] = useState<'shop' | 'traffic' | 'orders'>('shop')
  const [overviewTab, setOverviewTab] = useState<'shop' | 'traffic' | 'today'>('shop')

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

        let nextChart = EMPTY_CHART_DATA
        const labels = res.orderTrend?.labels ?? []
        const orders = res.orderTrend?.orders ?? []
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

  return (
    <div className="merchant-dashboard merchant-dashboard--v2">
      <section className="merchant-dashboard-hero merchant-dashboard-hero--v2">
        <div className="merchant-dashboard-hero-glow" aria-hidden="true" />
        <div className="merchant-dashboard-hero-inner">
          <div className="merchant-dashboard-hero-main">
            <span className="merchant-dashboard-hero-eyebrow">
              {lang === 'zh' ? '数据仪表盘' : 'Dashboard'}
            </span>
            <h2 className="merchant-dashboard-hero-title">
              {lang === 'zh' ? '今日店铺概况' : 'Today at a glance'}
            </h2>
            <p className="merchant-dashboard-hero-subtitle">
              {lang === 'zh'
                ? '实时掌握店铺经营健康度与今日表现'
                : 'Real-time view of shop health and today\'s performance'}
            </p>
            <div className="merchant-dashboard-hero-tags">
              <span className="merchant-dashboard-hero-tag">
                {lang === 'zh' ? '好评率' : 'Good rating'} · {goodRate.toFixed(1)}%
              </span>
              <span className="merchant-dashboard-hero-tag">
                {lang === 'zh' ? '信用分' : 'Credit'} · {creditScore}
              </span>
              <span className="merchant-dashboard-hero-tag">
                {lang === 'zh' ? '关注' : 'Followers'} · {followers}
              </span>
            </div>
          </div>
          <div className="merchant-dashboard-hero-side">
            <div className="merchant-dashboard-hero-highlight">
              <span className="merchant-dashboard-hero-highlight-label">
                {lang === 'zh' ? '今日销售额' : "Today's sales"}
              </span>
              <span className="merchant-dashboard-hero-highlight-value">${todaySales.toFixed(2)}</span>
            </div>
            <div className="merchant-dashboard-hero-mini-grid">
              <div className="merchant-dashboard-hero-mini">
                <span className="merchant-dashboard-hero-mini-label">
                  {lang === 'zh' ? '今日订单' : 'Orders'}
                </span>
                <span className="merchant-dashboard-hero-mini-value">{todayOrders}</span>
              </div>
              <div className="merchant-dashboard-hero-mini">
                <span className="merchant-dashboard-hero-mini-label">
                  {lang === 'zh' ? '预计利润' : 'Profit'}
                </span>
                <span className="merchant-dashboard-hero-mini-value">${todayProfit.toFixed(2)}</span>
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
        <div className="merchant-dashboard-stats merchant-dashboard-stats--v2">
          <div className="merchant-dashboard-stat merchant-dashboard-stat--products">
            <MerchantDashboardStatIcon variant="products" />
            <span className="merchant-dashboard-stat-value">{productCount}</span>
            <span className="merchant-dashboard-stat-label">
              {lang === 'zh' ? '商品总数' : 'Total products'}
            </span>
          </div>
          <div className="merchant-dashboard-stat merchant-dashboard-stat--sales">
            <MerchantDashboardStatIcon variant="sales" />
            <span className="merchant-dashboard-stat-value">${totalSales.toFixed(2)}</span>
            <span className="merchant-dashboard-stat-label">
              {lang === 'zh' ? '销售总额' : 'Total sales'}
            </span>
          </div>
          <div className="merchant-dashboard-stat merchant-dashboard-stat--orders">
            <MerchantDashboardStatIcon variant="orders" />
            <span className="merchant-dashboard-stat-value">{orderCount}</span>
            <span className="merchant-dashboard-stat-label">
              {lang === 'zh' ? '总订单' : 'Total orders'}
            </span>
          </div>
          <div className="merchant-dashboard-stat merchant-dashboard-stat--profit">
            <MerchantDashboardStatIcon variant="profit" />
            <span className="merchant-dashboard-stat-value">${totalProfit.toFixed(2)}</span>
            <span className="merchant-dashboard-stat-label">
              {lang === 'zh' ? '总利润' : 'Total profit'}
            </span>
          </div>
          <div className="merchant-dashboard-stat merchant-dashboard-stat--pending merchant-dashboard-stat--highlight">
            <MerchantDashboardStatIcon variant="pending" />
            <span className="merchant-dashboard-stat-value">{pendingOrdersCount}</span>
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
          <div className="merchant-dashboard-stat merchant-dashboard-stat--unsettled">
            <MerchantDashboardStatIcon variant="unsettled" />
            <span className="merchant-dashboard-stat-value">${unsettledAmount.toFixed(2)}</span>
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
          <div className="merchant-dashboard-metric-grid">
            {overviewTab === 'shop' && (
              <>
                <MetricTile value={`${goodRate.toFixed(1)}%`} label={lang === 'zh' ? '好评率' : 'Good rating'} />
                <MetricTile value={creditScore} label={lang === 'zh' ? '卖家信用分' : 'Credit score'} />
                <MetricTile value={followers} label={lang === 'zh' ? '店铺关注' : 'Followers'} />
              </>
            )}
            {overviewTab === 'traffic' && (
              <>
                <MetricTile value={visitsToday} label={lang === 'zh' ? '今日访客' : "Today's visitors"} />
                <MetricTile value={visits7d} label={lang === 'zh' ? '7日访客' : '7-day visitors'} />
                <MetricTile value={visits30d} label={lang === 'zh' ? '30日访客' : '30-day visitors'} />
              </>
            )}
            {overviewTab === 'today' && (
              <>
                <MetricTile value={todayOrders} label={lang === 'zh' ? '今日订单' : "Today's orders"} />
                <MetricTile value={`$${todaySales.toFixed(2)}`} label={lang === 'zh' ? '今日销售额' : "Today's sales"} />
                <MetricTile value={`$${todayProfit.toFixed(2)}`} label={lang === 'zh' ? '预计利润' : 'Expected profit'} />
              </>
            )}
          </div>
        </div>
      </section>

      <section className="merchant-dashboard-section merchant-dashboard-overviews merchant-dashboard-overviews--desktop">
        <header className="merchant-dashboard-section-head">
          <h3 className="merchant-dashboard-section-title">
            {lang === 'zh' ? '多维分析' : 'Multi-dimensional analysis'}
          </h3>
        </header>
        <div className="merchant-dashboard-overview-grid">
          <div className="merchant-dashboard-overview-card merchant-dashboard-overview-card--shop">
            <div className="merchant-dashboard-overview-head">
              <span className="merchant-dashboard-overview-dot" aria-hidden="true" />
              <h3 className="merchant-dashboard-overview-title">
                {lang === 'zh' ? '店铺概况' : 'Shop overview'}
              </h3>
            </div>
            <div className="merchant-dashboard-metric-grid merchant-dashboard-metric-grid--compact">
              <MetricTile value={`${goodRate.toFixed(1)}%`} label={lang === 'zh' ? '好评率' : 'Good rating'} />
              <MetricTile value={creditScore} label={lang === 'zh' ? '卖家信用分' : 'Credit score'} />
              <MetricTile value={followers} label={lang === 'zh' ? '店铺关注' : 'Followers'} />
            </div>
          </div>
          <div className="merchant-dashboard-overview-card merchant-dashboard-overview-card--traffic">
            <div className="merchant-dashboard-overview-head">
              <span className="merchant-dashboard-overview-dot" aria-hidden="true" />
              <h3 className="merchant-dashboard-overview-title">
                {lang === 'zh' ? '流量概况' : 'Traffic overview'}
              </h3>
            </div>
            <div className="merchant-dashboard-metric-grid merchant-dashboard-metric-grid--compact">
              <MetricTile value={visitsToday} label={lang === 'zh' ? '今日访客' : "Today's visitors"} />
              <MetricTile value={visits7d} label={lang === 'zh' ? '7日访客' : '7-day visitors'} />
              <MetricTile value={visits30d} label={lang === 'zh' ? '30日访客' : '30-day visitors'} />
            </div>
          </div>
          <div className="merchant-dashboard-overview-card merchant-dashboard-overview-card--today">
            <div className="merchant-dashboard-overview-head">
              <span className="merchant-dashboard-overview-dot" aria-hidden="true" />
              <h3 className="merchant-dashboard-overview-title">
                {lang === 'zh' ? '今日概况' : "Today's overview"}
              </h3>
            </div>
            <div className="merchant-dashboard-metric-grid merchant-dashboard-metric-grid--compact">
              <MetricTile value={todayOrders} label={lang === 'zh' ? '今日订单' : "Today's orders"} />
              <MetricTile value={`$${todaySales.toFixed(2)}`} label={lang === 'zh' ? '今日销售额' : "Today's sales"} />
              <MetricTile value={`$${todayProfit.toFixed(2)}`} label={lang === 'zh' ? '预计利润' : 'Expected profit'} />
            </div>
          </div>
        </div>
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
