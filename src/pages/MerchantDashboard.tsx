import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'
import { useMerchantShop } from '../context/MerchantShopContext'
import { MerchantDashboardCharts } from './MerchantDashboardCharts'
import MerchantDashboardCommandHero from '../components/MerchantDashboardCommandHero'
import { MerchantDashboardOverview } from '../components/MerchantDashboardOverview'
import { buildDashboardInsight } from '../utils/buildDashboardInsight'
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

  const overviewData = {
    lang,
    visitsToday,
    visits7d,
    visits30d,
    visitsTotal,
    orderCount,
    orderSeries,
  }

  const yesterdaySales = salesSeries.length >= 2 ? salesSeries[salesSeries.length - 2] : 0
  const insightText = buildDashboardInsight({
    lang,
    healthIndex,
    todayOrders,
    todaySales,
    yesterdaySales,
    pendingOrders: pendingOrdersCount,
    goodRate,
  })

  return (
    <div className={`merchant-dashboard merchant-dashboard--v2${dashboardMounted ? ' merchant-dashboard--mounted' : ''}`}>
      <MerchantDashboardCommandHero
        lang={lang}
        shopName={shop?.name ?? ''}
        shopLogo={shop?.logo ?? null}
        shopLevel={shopLevel}
        healthIndex={healthIndex}
        goodRate={goodRate}
        creditScore={creditScore}
        followers={followers}
        totalSales={totalSales}
        orderCount={orderCount}
        totalProfit={totalProfit}
        productCount={productCount}
        todaySales={todaySales}
        todayOrders={todayOrders}
        todayProfit={todayProfit}
        unsettledAmount={unsettledAmount}
        pendingOrders={pendingOrdersCount}
        onNavigate={navigate}
      />

      <section className="merchant-dashboard-insight" aria-live="polite">
        <span className="merchant-dashboard-insight-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16">
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
        <div className="merchant-dashboard-insight-body">
          <span className="merchant-dashboard-insight-kicker">
            {lang === 'zh' ? '智能摘要' : 'Smart insight'}
          </span>
          <p className="merchant-dashboard-insight-text">{insightText}</p>
        </div>
      </section>

      <section className="merchant-dashboard-segments" aria-label={lang === 'zh' ? '流量概况' : 'Traffic overview'}>
        <header className="merchant-dashboard-section-head merchant-dashboard-section-head--inset">
          <h3 className="merchant-dashboard-section-title">
            {lang === 'zh' ? '流量概况' : 'Traffic overview'}
          </h3>
        </header>
        <div className="merchant-dashboard-segments-panel" role="region">
          <MerchantDashboardOverview data={overviewData} mode="single" />
        </div>
      </section>

      <section className="merchant-dashboard-section merchant-dashboard-overviews merchant-dashboard-overviews--desktop">
        <header className="merchant-dashboard-section-head">
          <h3 className="merchant-dashboard-section-title">
            {lang === 'zh' ? '流量概况' : 'Traffic overview'}
          </h3>
          <p className="merchant-dashboard-section-desc">
            {lang === 'zh' ? '访客趋势、转化率与智能洞察' : 'Visitor trends, conversion, and insights'}
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
