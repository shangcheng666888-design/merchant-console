import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import { useMerchantShop } from '../context/MerchantShopContext'
import { useToast } from './ToastProvider'
import paidTiktok from '../assets/paid-tiktok.png'
import paidMeta from '../assets/paid-meta.png'
import paidGoogle from '../assets/paid-google.png'
import liulianggaikuang from '../assets/liulianggaikuang.png'
import paidPromoLite from '../assets/paid-promo-lite.png'
import MiniSparkline from './MiniSparkline'
import MerchantPaidPromoSelect from './MerchantPaidPromoSelect'
import MerchantPaidPromoAudiencePicker, {
  parseAudienceValues,
  serializeAudienceValues,
} from './MerchantPaidPromoAudiencePicker'

type PaidChannel = 'tiktok' | 'meta' | 'google' | 'other'
type TargetType = 'shop' | 'product'
type PromoStatus = 'pending' | 'awaiting_launch' | 'active' | 'paused' | 'ended' | 'completed'

interface OptionItem {
  value: string
  labelZh: string
  labelEn: string
}

interface PromotionInfo {
  id: number
  shopId: string
  channel: PaidChannel
  status: PromoStatus
  targetType: TargetType | null
  targetListingId: string | null
  targetProductId: string | number | null
  targetProductTitle: string | null
  targetProductImage: string | null
  targetRegion: string | null
  targetAudience: string | null
  merchantConfirmedAt: string | null
  campaignStartAt: string | null
  campaignEndAt: string | null
  campaignDurationValue?: number | null
  campaignDurationUnit?: 'minute' | 'hour' | 'day' | null
  budgetTotal: number | null
  presetImpressions?: number | null
  presetClicks?: number | null
  presetVisits?: number | null
}

interface HistoryItem {
  promotion: PromotionInfo
  metrics: {
    totals: MetricTotals
    presets?: MetricTotals
    isCompleted?: boolean
  }
}

interface MetricPoint {
  date: string
  impressions: number
  clicks: number
  visits: number
  orders: number
  spend: number
  revenue: number
}

interface MetricTotals {
  impressions: number
  clicks: number
  visits: number
  orders: number
  spend: number
  revenue: number
}

interface ListedProduct {
  listingId: string | number
  title: string
  image: string
  price: number
  status: string
}

const CHANNEL_META: Record<PaidChannel, { zh: string; en: string; icon?: string }> = {
  tiktok: { zh: 'TikTok', en: 'TikTok', icon: paidTiktok },
  meta: { zh: 'Meta', en: 'Meta', icon: paidMeta },
  google: { zh: 'Google', en: 'Google', icon: paidGoogle },
  other: { zh: '其他渠道', en: 'Other' },
}

const DEFAULT_REGIONS: OptionItem[] = [
  { value: 'north_america', labelZh: '北美', labelEn: 'North America' },
  { value: 'europe', labelZh: '欧洲', labelEn: 'Europe' },
  { value: 'southeast_asia', labelZh: '东南亚', labelEn: 'Southeast Asia' },
  { value: 'middle_east', labelZh: '中东', labelEn: 'Middle East' },
  { value: 'latin_america', labelZh: '拉美', labelEn: 'Latin America' },
  { value: 'global', labelZh: '全球', labelEn: 'Global' },
]

const DEFAULT_AUDIENCES: OptionItem[] = [
  { value: 'all', labelZh: '全部受众', labelEn: 'All audiences' },
  { value: 'young_adults', labelZh: '年轻群体 18-34', labelEn: 'Young adults 18-34' },
  { value: 'women', labelZh: '女性用户', labelEn: 'Women' },
  { value: 'men', labelZh: '男性用户', labelEn: 'Men' },
  { value: 'parents', labelZh: '家长群体', labelEn: 'Parents' },
  { value: 'high_intent', labelZh: '高购买意向', labelEn: 'High purchase intent' },
]

function isPromotionSetupEditable(promotion: PromotionInfo | null): boolean {
  if (!promotion) return false
  if (promotion.status === 'pending') return true
  if (promotion.status === 'active' && !promotion.merchantConfirmedAt) return true
  return false
}

function isActiveMerchantPromotion(promotion: PromotionInfo | null): boolean {
  if (!promotion) return false
  return !['completed', 'ended', 'paused'].includes(promotion.status)
}

function readAuth(): { userId: string; shopId: string } | null {
  try {
    const raw = window.localStorage.getItem('authUser')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id?: string; shopId?: string }
    const userId = typeof parsed.id === 'string' ? parsed.id.trim() : ''
    const shopId = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
    if (!userId || !shopId) return null
    return { userId, shopId }
  } catch {
    return null
  }
}

function formatDurationLabel(
  value: number | null | undefined,
  unit: PromotionInfo['campaignDurationUnit'],
  lang: 'zh' | 'en',
) {
  if (!value) return '—'
  if (unit === 'minute') return lang === 'zh' ? `${value} 分钟` : `${value} min`
  if (unit === 'hour') return lang === 'zh' ? `${value} 小时` : `${value} hr`
  return lang === 'zh' ? `${value} 天` : `${value} days`
}

function formatHistoryStatus(status: PromoStatus, lang: 'zh' | 'en') {
  if (status === 'completed') return lang === 'zh' ? '已结算' : 'Completed'
  if (status === 'ended') return lang === 'zh' ? '已结束' : 'Ended'
  if (status === 'paused') return lang === 'zh' ? '已暂停' : 'Paused'
  return status
}

function formatHistoryDate(value: string | null | undefined, lang: 'zh' | 'en') {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function HistoryChannelLogo({ channel }: { channel: PaidChannel }) {
  const icon = CHANNEL_META[channel]?.icon ?? liulianggaikuang
  return (
    <span className="merchant-paid-promo-history-channel" aria-hidden="true">
      <img src={icon} alt="" className="merchant-paid-promo-history-channel-img" />
    </span>
  )
}

function labelForOption(options: OptionItem[], value: string | null, lang: 'zh' | 'en') {
  if (!value) return '—'
  const item = options.find((opt) => opt.value === value)
  if (!item) return value
  return lang === 'zh' ? item.labelZh : item.labelEn
}

function labelsForAudiences(options: OptionItem[], value: string | null, lang: 'zh' | 'en') {
  const parts = parseAudienceValues(value)
  if (parts.length === 0) return '—'
  const separator = lang === 'zh' ? '、' : ', '
  return parts.map((part) => labelForOption(options, part, lang)).join(separator)
}

function warehouseProductId(promo: Pick<PromotionInfo, 'targetProductId' | 'targetListingId'>): string {
  if (promo.targetProductId != null && String(promo.targetProductId).trim()) {
    return String(promo.targetProductId)
  }
  return promo.targetListingId?.trim() || '—'
}

interface MerchantPaidPromotionBoardProps {
  lang: 'zh' | 'en'
}

const MerchantPaidPromotionBoard: React.FC<MerchantPaidPromotionBoardProps> = ({ lang }) => {
  const { showToast } = useToast()
  const { shop } = useMerchantShop()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [promotion, setPromotion] = useState<PromotionInfo | null>(null)
  const [targetSelected, setTargetSelected] = useState(false)
  const [metrics, setMetrics] = useState<{
    series: MetricPoint[]
    totals: MetricTotals
    presets?: MetricTotals
    campaignProgress?: number
    budgetProgress?: number
    isCompleted?: boolean
  } | null>(null)
  const [products, setProducts] = useState<ListedProduct[]>([])
  const [regions, setRegions] = useState<OptionItem[]>(DEFAULT_REGIONS)
  const [audiences, setAudiences] = useState<OptionItem[]>(DEFAULT_AUDIENCES)
  const [targetType, setTargetType] = useState<TargetType>('product')
  const [selectedListingId, setSelectedListingId] = useState('')
  const [targetRegion, setTargetRegion] = useState('')
  const [targetAudiences, setTargetAudiences] = useState<string[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const historyPreviewLimit = 3
  const formDirtyRef = useRef(false)
  const lastPromotionIdRef = useRef<number | null>(null)

  const hydrateFormFromPromotion = useCallback((promo: PromotionInfo) => {
    setTargetType(promo.targetType ?? 'product')
    setSelectedListingId(promo.targetListingId ?? '')
    setTargetRegion(promo.targetRegion ?? '')
    setTargetAudiences(parseAudienceValues(promo.targetAudience))
  }, [])

  const markFormDirty = useCallback(() => {
    formDirtyRef.current = true
  }, [])

  const fetchBoard = useCallback(async () => {
    const auth = readAuth()
    if (!auth) {
      return
    }
    try {
      const res = await api.get<{
        active: boolean
        promotion: PromotionInfo | null
        metrics: {
          series: MetricPoint[]
          totals: MetricTotals
          presets?: MetricTotals
          campaignProgress?: number
          budgetProgress?: number
          isCompleted?: boolean
        } | null
        targetSelected?: boolean
        regions?: OptionItem[]
        audiences?: OptionItem[]
      }>(
        `/api/shops/${encodeURIComponent(auth.shopId)}/paid-promotion?userId=${encodeURIComponent(auth.userId)}`,
      )
      if (!res.active || !res.promotion || !isActiveMerchantPromotion(res.promotion)) {
        setPromotion(null)
        setMetrics(null)
        setTargetSelected(false)
        return
      }
      setPromotion(res.promotion)
      setTargetSelected(Boolean(res.targetSelected))
      setMetrics(res.metrics)
      setRegions(Array.isArray(res.regions) && res.regions.length > 0 ? res.regions : DEFAULT_REGIONS)
      setAudiences(Array.isArray(res.audiences) && res.audiences.length > 0 ? res.audiences : DEFAULT_AUDIENCES)

      const promo = res.promotion
      const promotionChanged = lastPromotionIdRef.current !== promo.id
      if (promotionChanged) {
        lastPromotionIdRef.current = promo.id
        formDirtyRef.current = false
        hydrateFormFromPromotion(promo)
      } else if (!formDirtyRef.current || !isPromotionSetupEditable(promo)) {
        hydrateFormFromPromotion(promo)
      }
    } catch {
      setPromotion(null)
    }
  }, [hydrateFormFromPromotion])

  const fetchHistory = useCallback(async () => {
    const auth = readAuth()
    if (!auth) return
    setHistoryLoading(true)
    try {
      const res = await api.get<{ list: HistoryItem[] }>(
        `/api/shops/${encodeURIComponent(auth.shopId)}/paid-promotion/history?userId=${encodeURIComponent(auth.userId)}`,
      )
      setHistory(Array.isArray(res.list) ? res.list : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    const auth = readAuth()
    if (!auth) return
    try {
      const res = await api.get<{ list: ListedProduct[] }>(
        `/api/shop-products/by-shop/${encodeURIComponent(auth.shopId)}`,
      )
      setProducts((res.list ?? []).filter((item) => item.status === 'on'))
    } catch {
      setProducts([])
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchBoard(), fetchHistory(), fetchProducts()])
      if (!cancelled) setLoading(false)
    }
    void load()
    void api
      .get<{ regions?: OptionItem[]; audiences?: OptionItem[] }>('/api/paid-promotion/options')
      .then((res) => {
        if (Array.isArray(res.regions) && res.regions.length > 0) setRegions(res.regions)
        if (Array.isArray(res.audiences) && res.audiences.length > 0) setAudiences(res.audiences)
      })
      .catch(() => {
        /* use built-in defaults */
      })
    const timer = window.setInterval(() => {
      void Promise.all([fetchBoard(), fetchHistory()])
    }, 8000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [fetchBoard, fetchHistory, fetchProducts])

  const saveTarget = async () => {
    const auth = readAuth()
    if (!auth || !promotion || formLocked) return
    if (targetType === 'product' && !selectedListingId) {
      showToast(lang === 'zh' ? '请选择要推广的商品' : 'Select a product to promote', 'error')
      return
    }
    if (!targetRegion) {
      showToast(lang === 'zh' ? '请选择推广地区' : 'Select a target region', 'error')
      return
    }
    if (targetAudiences.length === 0) {
      showToast(lang === 'zh' ? '请选择受众群体' : 'Select a target audience', 'error')
      return
    }
    const targetAudience = serializeAudienceValues(targetAudiences)
    if (!targetAudience) {
      showToast(lang === 'zh' ? '请选择受众群体' : 'Select a target audience', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await api.patch<{
        success: boolean
        promotion: PromotionInfo
        targetSelected: boolean
      }>(`/api/shops/${encodeURIComponent(auth.shopId)}/paid-promotion`, {
        userId: auth.userId,
        targetType,
        targetListingId: targetType === 'product' ? selectedListingId : undefined,
        targetRegion,
        targetAudience,
        targetAudiences,
      })
      setPromotion(res.promotion)
      setTargetSelected(Boolean(res.targetSelected))
      formDirtyRef.current = false
      lastPromotionIdRef.current = res.promotion.id
      hydrateFormFromPromotion(res.promotion)
      showToast(lang === 'zh' ? '推广方案已提交，等待管理员开启' : 'Promotion submitted — awaiting admin launch')
    } catch (e) {
      showToast(e instanceof Error ? e.message : lang === 'zh' ? '提交失败' : 'Submit failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const visitSeries = useMemo(() => (metrics?.series ?? []).map((point) => point.visits), [metrics])

  const clickRate = useMemo(() => {
    const totals = metrics?.totals
    if (!totals || totals.impressions <= 0) return 0
    return Math.round((totals.clicks / totals.impressions) * 1000) / 10
  }, [metrics])

  const budgetProgressPct = Math.round((metrics?.budgetProgress ?? 0) * 100)

  const selectedProduct = useMemo(() => {
    if (!selectedListingId) return null
    return products.find((item) => String(item.listingId) === selectedListingId) ?? null
  }, [products, selectedListingId])

  const targetReady = targetType === 'shop' || Boolean(selectedListingId)
  const audienceReady = Boolean(targetRegion && targetAudiences.length > 0)

  const activePromotion = isActiveMerchantPromotion(promotion) ? promotion : null
  const channelInfo = activePromotion ? CHANNEL_META[activePromotion.channel] : null
  const formLocked = !isPromotionSetupEditable(activePromotion)
  const showActiveSummary = Boolean(
    activePromotion?.status === 'active' && activePromotion.merchantConfirmedAt && formLocked,
  )
  const regionOptions = regions.length > 0 ? regions : DEFAULT_REGIONS
  const audienceOptions = audiences.length > 0 ? audiences : DEFAULT_AUDIENCES

  if (loading) return null
  if (!activePromotion && history.length === 0 && !historyLoading) return null

  const historyOverflow = history.length > historyPreviewLimit
  const visibleHistory = historyExpanded || !historyOverflow
    ? history
    : history.slice(0, historyPreviewLimit)

  const historySection = (
    <div className="merchant-paid-promo-history">
      <div className="merchant-paid-promo-history-head">
        <div className="merchant-paid-promo-history-head-copy">
          <h4 className="merchant-paid-promo-history-title">
            {lang === 'zh' ? '历史投放记录' : 'Campaign history'}
          </h4>
          <p className="merchant-paid-promo-history-sub">
            {lang === 'zh' ? '已结束推广的完整投放表现' : 'Completed campaign performance archive'}
          </p>
        </div>
        {history.length > 0 ? (
          <span className="merchant-paid-promo-history-count">
            {history.length} {lang === 'zh' ? '条' : 'records'}
          </span>
        ) : null}
      </div>
      {historyLoading && history.length === 0 ? (
        <p className="merchant-paid-promo-empty">{lang === 'zh' ? '加载中…' : 'Loading…'}</p>
      ) : history.length === 0 ? (
        <p className="merchant-paid-promo-empty">
          {lang === 'zh' ? '暂无历史投放记录' : 'No campaign history yet'}
        </p>
      ) : (
        <div className="merchant-paid-promo-history-list">
          {visibleHistory.map((item) => {
            const promo = item.promotion
            const totals = item.metrics?.totals
            const channel = CHANNEL_META[promo.channel]
            const channelLabel = channel?.[lang === 'zh' ? 'zh' : 'en'] ?? promo.channel
            const clickRateHistory =
              totals && totals.impressions > 0
                ? Math.round((totals.clicks / totals.impressions) * 1000) / 10
                : 0
            const targetLabel =
              promo.targetType === 'product'
                ? promo.targetProductTitle ?? (lang === 'zh' ? '单品推广' : 'Product')
                : lang === 'zh'
                  ? '整店推广'
                  : 'Whole shop'
            return (
              <article key={promo.id} className="merchant-paid-promo-history-card">
                <div className="merchant-paid-promo-history-card-top">
                  <HistoryChannelLogo channel={promo.channel} />
                  <div className="merchant-paid-promo-history-card-main">
                    <div className="merchant-paid-promo-history-card-title-row">
                      <strong className="merchant-paid-promo-history-channel-name">{channelLabel}</strong>
                      <span
                        className={`merchant-paid-promo-history-status merchant-paid-promo-history-status--${promo.status}`}
                      >
                        {formatHistoryStatus(promo.status, lang)}
                      </span>
                    </div>
                    <p className="merchant-paid-promo-history-dates">
                      {formatHistoryDate(promo.campaignStartAt, lang)}
                      <span aria-hidden="true"> → </span>
                      {formatHistoryDate(promo.campaignEndAt, lang)}
                    </p>
                    <div className="merchant-paid-promo-history-chips">
                      <span className="merchant-paid-promo-history-chip">
                        {formatDurationLabel(promo.campaignDurationValue, promo.campaignDurationUnit, lang)}
                      </span>
                      <span className="merchant-paid-promo-history-chip">
                        ${(promo.budgetTotal ?? totals?.spend ?? 0).toFixed(2)}
                      </span>
                      <span className="merchant-paid-promo-history-chip merchant-paid-promo-history-chip--target" title={targetLabel}>
                        {targetLabel}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="merchant-paid-promo-history-metrics" role="list">
                  <div className="merchant-paid-promo-history-metric" role="listitem">
                    <small>{lang === 'zh' ? '曝光' : 'Impr.'}</small>
                    <strong>{(totals?.impressions ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="merchant-paid-promo-history-metric" role="listitem">
                    <small>{lang === 'zh' ? '点击' : 'Clicks'}</small>
                    <strong>{(totals?.clicks ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="merchant-paid-promo-history-metric" role="listitem">
                    <small>{lang === 'zh' ? '进店' : 'Visits'}</small>
                    <strong>{(totals?.visits ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="merchant-paid-promo-history-metric" role="listitem">
                    <small>{lang === 'zh' ? '点击率' : 'CTR'}</small>
                    <strong>{clickRateHistory}%</strong>
                  </div>
                  <div className="merchant-paid-promo-history-metric merchant-paid-promo-history-metric--spend" role="listitem">
                    <small>{lang === 'zh' ? '消耗' : 'Spend'}</small>
                    <strong>${(totals?.spend ?? 0).toFixed(2)}</strong>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {historyOverflow ? (
        <button
          type="button"
          className="merchant-paid-promo-history-toggle"
          onClick={() => setHistoryExpanded((prev) => !prev)}
          aria-expanded={historyExpanded}
        >
          {historyExpanded
            ? lang === 'zh'
              ? '收起历史记录'
              : 'Show fewer records'
            : lang === 'zh'
              ? `展开更多（还有 ${history.length - historyPreviewLimit} 条）`
              : `Show more (${history.length - historyPreviewLimit} more)`}
        </button>
      ) : null}
    </div>
  )

  if (!activePromotion) {
    return (
      <section className="merchant-dashboard-section merchant-paid-promo-board" aria-label={lang === 'zh' ? '付费推广历史' : 'Paid promotion history'}>
        <header className="merchant-dashboard-section-head">
          <div className="merchant-paid-promo-board-head">
            <span className="merchant-paid-promo-board-icon merchant-paid-promo-board-icon--lite" aria-hidden="true">
              <img src={paidPromoLite} alt="" className="merchant-paid-promo-board-icon-img" />
            </span>
            <div>
              <h3 className="merchant-dashboard-section-title">
                {lang === 'zh' ? '付费推广' : 'Paid promotion'}
              </h3>
              <p className="merchant-dashboard-section-desc">
                {lang === 'zh' ? '当前无进行中的推广，可查看历史投放数据。' : 'No active campaign. Review past performance below.'}
              </p>
            </div>
          </div>
        </header>
        {historySection}
      </section>
    )
  }

  const promo = activePromotion

  return (
    <section className="merchant-dashboard-section merchant-paid-promo-board" aria-label={lang === 'zh' ? '付费推广看板' : 'Paid promotion board'}>
      <header className="merchant-dashboard-section-head">
        <div className="merchant-paid-promo-board-head">
          <span
            className={`merchant-paid-promo-board-icon${channelInfo?.icon ? ' merchant-paid-promo-board-icon--channel' : ''}`}
            aria-hidden="true"
          >
            {channelInfo?.icon ? (
              <img src={channelInfo.icon} alt="" className="merchant-paid-promo-board-icon-img" />
            ) : (
              <img src={liulianggaikuang} alt="" className="merchant-paid-promo-board-icon-img" />
            )}
          </span>
          <div>
            <h3 className="merchant-dashboard-section-title">
              {lang === 'zh' ? '付费推广看板' : 'Paid promotion board'}
            </h3>
            <p className="merchant-dashboard-section-desc">
              {lang === 'zh'
                ? `当前渠道：${channelInfo?.zh ?? promo.channel} · 选择商品、地区与受众后提交，管理员配置并开启后开始智能投放`
                : `Channel: ${channelInfo?.en ?? promo.channel} · Submit target, region and audience, then admin launches the campaign`}
            </p>
          </div>
        </div>
      </header>

      <div
        className={`merchant-paid-promo-board-body${showActiveSummary ? ' merchant-paid-promo-board-body--active' : ''}`}
      >
        <div
          className={`merchant-paid-promo-target-card${showActiveSummary ? ' merchant-paid-promo-target-card--locked' : ''}`}
        >
          <h4 className="merchant-paid-promo-card-title">
            {showActiveSummary
              ? lang === 'zh'
                ? '推广方案'
                : 'Campaign plan'
              : lang === 'zh'
                ? '推广设置'
                : 'Campaign setup'}
          </h4>

          {showActiveSummary ? (
            <div className="merchant-paid-promo-active-summary">
              {promo.targetType === 'product' ? (
                <div className="merchant-paid-promo-active-summary-product">
                  {promo.targetProductImage ? (
                    <img
                      src={promo.targetProductImage}
                      alt=""
                      className="merchant-paid-promo-active-summary-img"
                    />
                  ) : (
                    <span className="merchant-paid-promo-active-summary-img merchant-paid-promo-active-summary-img--empty">
                      SKU
                    </span>
                  )}
                  <div className="merchant-paid-promo-active-summary-copy">
                    <span className="merchant-paid-promo-active-summary-label">
                      {lang === 'zh' ? '推广单品' : 'Promoted SKU'}
                    </span>
                    <code
                      className="merchant-paid-promo-active-summary-id"
                      title={promo.targetProductTitle ?? undefined}
                    >
                      ID · {warehouseProductId(promo)}
                    </code>
                  </div>
                </div>
              ) : (
                <div className="merchant-paid-promo-active-summary-copy merchant-paid-promo-active-summary-copy--shop">
                  <span className="merchant-paid-promo-active-summary-label">
                    {lang === 'zh' ? '推广目标' : 'Target'}
                  </span>
                  <strong>{lang === 'zh' ? '整店推广' : 'Whole shop'}</strong>
                  <span className="merchant-paid-promo-active-summary-sub">
                    {shop?.name || promo.shopId}
                  </span>
                </div>
              )}
              <div className="merchant-paid-promo-confirmed-meta merchant-paid-promo-confirmed-meta--summary">
                <span>
                  {lang === 'zh' ? '地区：' : 'Region: '}
                  {labelForOption(regionOptions, promo.targetRegion, lang)}
                </span>
                <span>
                  {lang === 'zh' ? '受众：' : 'Audience: '}
                  {labelsForAudiences(audienceOptions, promo.targetAudience, lang)}
                </span>
              </div>
            </div>
          ) : (
            <>
          <div className="merchant-paid-promo-target-tabs">
            <button
              type="button"
              className={`merchant-paid-promo-target-tab${targetType === 'shop' ? ' merchant-paid-promo-target-tab--active' : ''}`}
              onClick={() => {
                if (!formLocked) {
                  markFormDirty()
                  setTargetType('shop')
                }
              }}
              disabled={formLocked}
            >
              {lang === 'zh' ? '推广整店' : 'Promote shop'}
            </button>
            <button
              type="button"
              className={`merchant-paid-promo-target-tab${targetType === 'product' ? ' merchant-paid-promo-target-tab--active' : ''}`}
              onClick={() => {
                if (!formLocked) {
                  markFormDirty()
                  setTargetType('product')
                }
              }}
              disabled={formLocked}
            >
              {lang === 'zh' ? '推广单品' : 'Promote product'}
            </button>
          </div>

          {targetType === 'product' ? (
            <div className="merchant-paid-promo-product-grid">
              {products.length === 0 ? (
                <p className="merchant-paid-promo-empty">
                  {lang === 'zh' ? '暂无在售商品，请先在仓库上架' : 'No on-sale products. List items in warehouse first.'}
                </p>
              ) : (
                products.map((product) => {
                  const id = String(product.listingId)
                  const selected = selectedListingId === id
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`merchant-paid-promo-product-item${selected ? ' merchant-paid-promo-product-item--selected' : ''}`}
                      onClick={() => {
                        if (!formLocked) {
                          markFormDirty()
                          setSelectedListingId(id)
                        }
                      }}
                      disabled={formLocked}
                    >
                      {product.image ? (
                        <img src={product.image} alt="" className="merchant-paid-promo-product-img" />
                      ) : (
                        <span className="merchant-paid-promo-product-img merchant-paid-promo-product-img--empty" />
                      )}
                      <span className="merchant-paid-promo-product-title">{product.title}</span>
                      <span className="merchant-paid-promo-product-price">${product.price.toFixed(2)}</span>
                    </button>
                  )
                })
              )}
            </div>
          ) : (
            <div className="merchant-paid-promo-shop-grid">
              <button
                type="button"
                className="merchant-paid-promo-shop-item merchant-paid-promo-shop-item--selected"
                onClick={() => !formLocked && setTargetType('shop')}
                disabled={formLocked}
              >
                <div className="merchant-paid-promo-shop-item-main">
                  {shop?.logo ? (
                    <img src={shop.logo} alt="" className="merchant-paid-promo-shop-avatar" />
                  ) : (
                    <span className="merchant-paid-promo-shop-avatar merchant-paid-promo-shop-avatar--fallback">
                      {shop?.name?.slice(0, 1) || (lang === 'zh' ? '店' : 'S')}
                    </span>
                  )}
                  <div className="merchant-paid-promo-shop-item-copy">
                    <span className="merchant-paid-promo-shop-item-title">{shop?.name || (lang === 'zh' ? '我的店铺' : 'My shop')}</span>
                    <span className="merchant-paid-promo-shop-item-id">
                      ID · {shop?.id || promo.shopId}
                    </span>
                    <span className="merchant-paid-promo-shop-item-desc">
                      {lang === 'zh' ? '将店铺首页作为付费推广落地页' : 'Use your shop homepage as the landing page'}
                    </span>
                  </div>
                </div>
                <span className="merchant-paid-promo-shop-item-badge">
                  {lang === 'zh' ? '整店推广' : 'Whole shop'}
                </span>
              </button>
            </div>
          )}

          <div className="merchant-paid-promo-select-row merchant-paid-promo-select-row--region">
            <MerchantPaidPromoSelect
              label={lang === 'zh' ? '推广地区' : 'Target region'}
              placeholder={lang === 'zh' ? '请选择地区' : 'Select region'}
              value={targetRegion}
              disabled={formLocked}
              options={regionOptions.map((item) => ({
                value: item.value,
                label: lang === 'zh' ? item.labelZh : item.labelEn,
              }))}
              onChange={(value) => {
                markFormDirty()
                setTargetRegion(value)
              }}
            />
          </div>

          <MerchantPaidPromoAudiencePicker
            label={lang === 'zh' ? '受众群体' : 'Audience'}
            hint={
              lang === 'zh'
                ? '可多选；选择「全部受众」时无需再选其他群体'
                : 'Multi-select supported. Choosing “All audiences” clears other selections.'
            }
            value={targetAudiences}
            disabled={formLocked}
            options={audienceOptions.map((item) => ({
              value: item.value,
              label: lang === 'zh' ? item.labelZh : item.labelEn,
            }))}
            onChange={(values) => {
              markFormDirty()
              setTargetAudiences(values)
            }}
          />

          {!formLocked ? (
            <button
              type="button"
              className="merchant-paid-promo-save-btn"
              onClick={saveTarget}
              disabled={saving || (targetType === 'product' && !selectedListingId) || !targetRegion || targetAudiences.length === 0}
            >
              {saving ? (lang === 'zh' ? '提交中…' : 'Submitting…') : lang === 'zh' ? '确认推广' : 'Confirm promotion'}
            </button>
          ) : null}

          {promo.status === 'awaiting_launch' ? (
            <div className="merchant-paid-promo-status-banner merchant-paid-promo-status-banner--waiting">
              {lang === 'zh'
                ? '推广方案已提交，等待管理员配置投放参数并开启推广。'
                : 'Promotion submitted. Waiting for admin to configure and launch.'}
            </div>
          ) : null}

          {targetSelected && formLocked && !showActiveSummary ? (
            <div className="merchant-paid-promo-confirmed-meta">
              <span>
                {lang === 'zh' ? '地区：' : 'Region: '}
                {labelForOption(regionOptions, promo.targetRegion, lang)}
              </span>
              <span>
                {lang === 'zh' ? '受众：' : 'Audience: '}
                {labelsForAudiences(audienceOptions, promo.targetAudience, lang)}
              </span>
            </div>
          ) : null}
            </>
          )}
        </div>

        {promo.status === 'active' && metrics && promo.merchantConfirmedAt ? (
          <div className="merchant-paid-promo-metrics-card">
            <div className="merchant-paid-promo-metrics-head">
              <h4 className="merchant-paid-promo-card-title">
                {lang === 'zh' ? '推广投放数据' : 'Campaign performance'}
              </h4>
              {promo.targetType === 'product' ? (
                <span
                  className="merchant-paid-promo-metrics-target"
                  title={promo.targetProductTitle ?? undefined}
                >
                  {lang === 'zh' ? '主推：单品 · ID ' : 'Focus: SKU · '}
                  {warehouseProductId(promo)}
                </span>
              ) : (
                <span className="merchant-paid-promo-metrics-target">
                  {lang === 'zh' ? '主推：整店推广' : 'Focus: whole shop'}
                </span>
              )}
            </div>

            <div className="merchant-paid-promo-progress-row">
              <div className="merchant-paid-promo-progress-copy">
                <span>{lang === 'zh' ? '预算消耗进度' : 'Budget consumption'}</span>
                <strong>{budgetProgressPct}%</strong>
              </div>
              <div className="merchant-paid-promo-progress-bar">
                <span style={{ width: `${budgetProgressPct}%` }} />
              </div>
              {promo.budgetTotal != null ? (
                <span className="merchant-paid-promo-progress-sub">
                  ${metrics.totals.spend.toFixed(2)} / ${promo.budgetTotal.toFixed(2)}
                </span>
              ) : null}
            </div>

            <div className="merchant-paid-promo-metrics-grid">
              <div className="merchant-paid-promo-metric">
                <span className="merchant-paid-promo-metric-value">{metrics.totals.impressions.toLocaleString()}</span>
                <span className="merchant-paid-promo-metric-label">{lang === 'zh' ? '曝光' : 'Impressions'}</span>
              </div>
              <div className="merchant-paid-promo-metric">
                <span className="merchant-paid-promo-metric-value">{metrics.totals.clicks.toLocaleString()}</span>
                <span className="merchant-paid-promo-metric-label">{lang === 'zh' ? '点击' : 'Clicks'}</span>
              </div>
              <div className="merchant-paid-promo-metric">
                <span className="merchant-paid-promo-metric-value">{metrics.totals.visits.toLocaleString()}</span>
                <span className="merchant-paid-promo-metric-label">{lang === 'zh' ? '进店' : 'Visits'}</span>
              </div>
              <div className="merchant-paid-promo-metric">
                <span className="merchant-paid-promo-metric-value">${metrics.totals.spend.toFixed(2)}</span>
                <span className="merchant-paid-promo-metric-label">{lang === 'zh' ? '消耗' : 'Spend'}</span>
              </div>
              <div className="merchant-paid-promo-metric">
                <span className="merchant-paid-promo-metric-value">${metrics.totals.revenue.toFixed(2)}</span>
                <span className="merchant-paid-promo-metric-label">{lang === 'zh' ? '成交额' : 'Revenue'}</span>
              </div>
            </div>

            <div className="merchant-paid-promo-sparkline-row">
              <div className="merchant-paid-promo-sparkline-copy">
                <span className="merchant-paid-promo-sparkline-label">{lang === 'zh' ? '进店趋势' : 'Visit trend'}</span>
                <span className="merchant-paid-promo-sparkline-sub">
                  {lang === 'zh' ? `点击率 ${clickRate}%` : `CTR ${clickRate}%`}
                </span>
              </div>
              <MiniSparkline data={visitSeries.length > 0 ? visitSeries : [0, 0, 0, 0, 0, 0, 0]} color="#5b6cff" />
            </div>
            <p className="merchant-paid-promo-sync-hint">
              {lang === 'zh'
                ? '投放进店会按时间段实时计入店铺访客量，仪表盘访客趋势将同步增长。'
                : 'Promoted store visits are added to shop visitor totals over time and reflected on your dashboard.'}
            </p>
          </div>
        ) : isPromotionSetupEditable(promo) ? (
          <div className="merchant-paid-promo-preview-card">
            <div className="merchant-paid-promo-preview-head">
              <div className="merchant-paid-promo-preview-channel">
                <span className="merchant-paid-promo-preview-channel-icon" aria-hidden="true">
                  {channelInfo?.icon ? <img src={channelInfo.icon} alt="" /> : <img src={liulianggaikuang} alt="" />}
                </span>
                <div>
                  <p className="merchant-paid-promo-preview-kicker">
                    {lang === 'zh' ? '投放预览' : 'Campaign preview'}
                  </p>
                  <h4 className="merchant-paid-promo-preview-title">
                    {channelInfo?.[lang === 'zh' ? 'zh' : 'en'] ?? promo.channel}
                    {lang === 'zh' ? ' 付费推广' : ' paid ads'}
                  </h4>
                </div>
              </div>
              <span className="merchant-paid-promo-preview-status">
                {lang === 'zh' ? '待配置' : 'Draft'}
              </span>
            </div>

            <ol className="merchant-paid-promo-preview-steps">
              <li className={`merchant-paid-promo-preview-step${targetReady ? ' merchant-paid-promo-preview-step--done' : ' merchant-paid-promo-preview-step--active'}`}>
                <span className="merchant-paid-promo-preview-step-index">1</span>
                <div>
                  <strong>{lang === 'zh' ? '推广目标' : 'Promotion target'}</strong>
                  <p
                    className="merchant-paid-promo-preview-step-value"
                    title={
                      targetType === 'product' && selectedProduct
                        ? selectedProduct.title
                        : undefined
                    }
                  >
                    {targetType === 'shop'
                      ? lang === 'zh'
                        ? `整店 · ${shop?.name || promo.shopId}`
                        : `Shop · ${shop?.name || promo.shopId}`
                      : selectedProduct
                        ? selectedProduct.title
                        : lang === 'zh'
                          ? '请从左侧选择要推广的商品'
                          : 'Select a product on the left'}
                  </p>
                </div>
              </li>
              <li className={`merchant-paid-promo-preview-step${audienceReady ? ' merchant-paid-promo-preview-step--done' : targetReady ? ' merchant-paid-promo-preview-step--active' : ''}`}>
                <span className="merchant-paid-promo-preview-step-index">2</span>
                <div>
                  <strong>{lang === 'zh' ? '地区与受众' : 'Region & audience'}</strong>
                  <p>
                    {audienceReady
                      ? `${labelForOption(regionOptions, targetRegion, lang)} · ${labelsForAudiences(audienceOptions, serializeAudienceValues(targetAudiences), lang)}`
                      : lang === 'zh'
                        ? '选择投放地区与目标人群'
                        : 'Choose region and audience segment'}
                  </p>
                </div>
              </li>
              <li className={`merchant-paid-promo-preview-step${targetReady && audienceReady ? ' merchant-paid-promo-preview-step--active' : ''}`}>
                <span className="merchant-paid-promo-preview-step-index">3</span>
                <div>
                  <strong>{lang === 'zh' ? '提交开启' : 'Submit for launch'}</strong>
                  <p>
                    {lang === 'zh'
                      ? '确认后由管理员配置预算并开启智能投放'
                      : 'Admin configures budget and launches smart delivery'}
                  </p>
                </div>
              </li>
            </ol>

            <div className="merchant-paid-promo-preview-target">
              {targetType === 'shop' ? (
                <>
                  {shop?.logo ? (
                    <img src={shop.logo} alt="" className="merchant-paid-promo-preview-target-img merchant-paid-promo-preview-target-img--round" />
                  ) : (
                    <span className="merchant-paid-promo-preview-target-img merchant-paid-promo-preview-target-img--round merchant-paid-promo-preview-target-img--fallback">
                      {shop?.name?.slice(0, 1) || (lang === 'zh' ? '店' : 'S')}
                    </span>
                  )}
                  <div>
                    <span className="merchant-paid-promo-preview-target-label">{lang === 'zh' ? '落地页' : 'Landing'}</span>
                    <strong>{shop?.name || (lang === 'zh' ? '店铺首页' : 'Shop homepage')}</strong>
                    <span className="merchant-paid-promo-preview-target-sub">ID · {shop?.id || promo.shopId}</span>
                  </div>
                </>
              ) : selectedProduct ? (
                <>
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt="" className="merchant-paid-promo-preview-target-img" />
                  ) : (
                    <span className="merchant-paid-promo-preview-target-img merchant-paid-promo-preview-target-img--fallback">SKU</span>
                  )}
                  <div>
                    <span className="merchant-paid-promo-preview-target-label">{lang === 'zh' ? '主推商品' : 'Featured SKU'}</span>
                    <strong className="merchant-paid-promo-preview-target-name" title={selectedProduct.title}>
                      {selectedProduct.title}
                    </strong>
                    <span className="merchant-paid-promo-preview-target-sub">${selectedProduct.price.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="merchant-paid-promo-preview-target-empty">
                  <span>{lang === 'zh' ? '选择商品后将在此预览推广落地页' : 'Product preview appears after selection'}</span>
                </div>
              )}
            </div>

            <div className="merchant-paid-promo-preview-metrics">
              <div className="merchant-paid-promo-preview-metric merchant-paid-promo-preview-metric--ghost">
                <span>—</span>
                <small>{lang === 'zh' ? '曝光' : 'Impressions'}</small>
              </div>
              <div className="merchant-paid-promo-preview-metric merchant-paid-promo-preview-metric--ghost">
                <span>—</span>
                <small>{lang === 'zh' ? '点击' : 'Clicks'}</small>
              </div>
              <div className="merchant-paid-promo-preview-metric merchant-paid-promo-preview-metric--ghost">
                <span>—</span>
                <small>{lang === 'zh' ? '进店' : 'Visits'}</small>
              </div>
            </div>
          </div>
        ) : promo.status === 'awaiting_launch' ? (
          <div className="merchant-paid-promo-preview-card merchant-paid-promo-preview-card--waiting">
            <div className="merchant-paid-promo-preview-head">
              <div className="merchant-paid-promo-preview-channel">
                <span className="merchant-paid-promo-preview-channel-icon" aria-hidden="true">
                  {channelInfo?.icon ? <img src={channelInfo.icon} alt="" /> : <img src={liulianggaikuang} alt="" />}
                </span>
                <div>
                  <p className="merchant-paid-promo-preview-kicker">{lang === 'zh' ? '方案已提交' : 'Submitted'}</p>
                  <h4 className="merchant-paid-promo-preview-title">
                    {lang === 'zh' ? '等待管理员开启' : 'Awaiting admin launch'}
                  </h4>
                </div>
              </div>
              <span className="merchant-paid-promo-preview-status merchant-paid-promo-preview-status--waiting">
                {lang === 'zh' ? '审核中' : 'In review'}
              </span>
            </div>
            <ul className="merchant-paid-promo-preview-checklist">
              <li>{lang === 'zh' ? '推广目标已确认' : 'Target confirmed'}</li>
              <li>{lang === 'zh' ? '地区与受众已锁定' : 'Region and audience locked'}</li>
              <li>{lang === 'zh' ? '管理员配置投放参数中' : 'Admin configuring campaign settings'}</li>
            </ul>
            <p className="merchant-paid-promo-preview-footnote">
              {lang === 'zh'
                ? '开启后将展示曝光、点击、进店等实时数据。'
                : 'Live impressions, clicks and visits will appear after launch.'}
            </p>
          </div>
        ) : null}
      </div>

      {historySection}
    </section>
  )
}

export default MerchantPaidPromotionBoard
