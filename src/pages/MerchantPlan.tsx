import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useToast } from '../components/ToastProvider'
import dianpu1 from '../assets/dianpu1.png'
import dianpu2 from '../assets/dianpu2.png'
import dianpu3 from '../assets/dianpu3.png'
import dianpu4 from '../assets/dianpu4.png'
import yunyingjihua from '../assets/yunyingjihua.png'
import liulianggaikuang from '../assets/liulianggaikuang.png'
import paidTiktok from '../assets/paid-tiktok.png'
import paidMeta from '../assets/paid-meta.png'
import paidGoogle from '../assets/paid-google.png'
import { useLang } from '../context/LangContext'
import { useMerchantShop } from '../context/MerchantShopContext'
import { openCrispChat } from '../utils/crispChat'
import { getMerchantShopLevelProgress } from '../constants/merchantShopLevels'

type ShopLevel = 'normal' | 'silver' | 'gold' | 'diamond'

type PaidChannelKey = 'tiktok' | 'meta' | 'google' | 'other'

const LEVELS: {
  key: ShopLevel
  nameZh: string
  nameEn: string
  descZh: string
  descEn: string
  minSales: number
  icon: string
  benefitsZh: string[]
  benefitsEn: string[]
}[] = [
  {
    key: 'normal',
    nameZh: '普通店铺',
    nameEn: 'Standard shop',
    descZh: '入驻即可获得',
    descEn: 'Granted upon joining the platform',
    minSales: 0,
    icon: dianpu1,
    benefitsZh: ['基础店铺展示', '标准客服支持', '平台基础流量', '利润比例：采购价的 10%'],
    benefitsEn: [
      'Basic shop exposure',
      'Standard customer support',
      'Baseline platform traffic',
      'Profit: 10% over purchase price',
    ],
  },
  {
    key: 'silver',
    nameZh: '银牌店铺',
    nameEn: 'Silver shop',
    descZh: '累计销售额 ≥ $10,000',
    descEn: 'Cumulative sales ≥ $10,000',
    minSales: 10000,
    icon: dianpu2,
    benefitsZh: ['搜索加权曝光', '活动优先报名', '专属运营对接', '利润比例：采购价的 15%'],
    benefitsEn: [
      'Boosted search exposure',
      'Priority access to campaigns',
      'Dedicated operations contact',
      'Profit: 15% over purchase price',
    ],
  },
  {
    key: 'gold',
    nameZh: '金牌店铺',
    nameEn: 'Gold shop',
    descZh: '累计销售额 ≥ $50,000',
    descEn: 'Cumulative sales ≥ $50,000',
    minSales: 50000,
    icon: dianpu3,
    benefitsZh: ['首页推荐位', '佣金比例优惠', '专属客服通道', '利润比例：采购价的 20%'],
    benefitsEn: [
      'Homepage recommendation slots',
      'Better commission rate',
      'Dedicated support channel',
      'Profit: 20% over purchase price',
    ],
  },
  {
    key: 'diamond',
    nameZh: '钻石店铺',
    nameEn: 'Diamond shop',
    descZh: '累计销售额 ≥ $100,000',
    descEn: 'Cumulative sales ≥ $100,000',
    minSales: 100000,
    icon: dianpu4,
    benefitsZh: ['顶级流量扶持', '品牌联名机会', '年度荣誉认证', '利润比例：采购价的 25%'],
    benefitsEn: [
      'Top-level traffic support',
      'Brand collaboration opportunities',
      'Annual honor certification',
      'Profit: 25% over purchase price',
    ],
  },
]

const ORGANIC_TIPS_ZH = [
  '将店铺链接发布到社交媒体、社群或私信中，邀请用户进店浏览。',
  '可配合商品主图与优惠活动文案，提高点击率与转化。',
  '持续分享有助于积累自然访客，配合主推商品效果更佳。',
]

const ORGANIC_TIPS_EN = [
  'Share your shop link on social media, groups, or direct messages to invite visits.',
  'Pair the link with product images and promotions to improve click-through and conversion.',
  'Consistent sharing builds organic visitors — feature your top products for better results.',
]

const PAID_CHANNELS: {
  key: PaidChannelKey
  nameZh: string
  nameEn: string
  descZh: string
  descEn: string
  accent: string
  iconLabel: string
  icon?: string
}[] = [
  {
    key: 'tiktok',
    nameZh: 'TikTok 流量',
    nameEn: 'TikTok traffic',
    descZh: '短视频与直播场景投放，适合爆款种草与年轻客群。',
    descEn: 'Short-video and live campaigns for viral products and younger audiences.',
    accent: '#111827',
    iconLabel: 'TT',
    icon: paidTiktok,
  },
  {
    key: 'meta',
    nameZh: 'Meta 流量',
    nameEn: 'Meta traffic',
    descZh: '覆盖 Facebook / Instagram 等 Meta 系平台精准推广。',
    descEn: 'Targeted ads across Facebook, Instagram, and other Meta platforms.',
    accent: '#1877f2',
    iconLabel: 'M',
    icon: paidMeta,
  },
  {
    key: 'google',
    nameZh: 'Google 流量',
    nameEn: 'Google traffic',
    descZh: '搜索与展示广告，捕获有明确购买意图的用户。',
    descEn: 'Search and display ads to reach users with strong purchase intent.',
    accent: '#ea4335',
    iconLabel: 'G',
    icon: paidGoogle,
  },
  {
    key: 'other',
    nameZh: '其他渠道',
    nameEn: 'Other channels',
    descZh: '更多定制化推广方案，由运营顾问为您匹配资源。',
    descEn: 'Custom promotion options matched by our operations team.',
    accent: '#5b6cff',
    iconLabel: '···',
  },
]

function buildShopPublicUrl(shopId: string): string {
  const configured = import.meta.env.VITE_MALL_URL as string | undefined
  if (configured?.trim()) {
    return `${configured.trim().replace(/\/$/, '')}/shops/${encodeURIComponent(shopId)}`
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/shops/${encodeURIComponent(shopId)}`
  }
  return `/shops/${encodeURIComponent(shopId)}`
}

function mapLevel(lvl: number): ShopLevel {
  if (lvl >= 4) return 'diamond'
  if (lvl >= 3) return 'gold'
  if (lvl >= 2) return 'silver'
  return 'normal'
}

const MerchantPlan: React.FC = () => {
  const { lang } = useLang()
  const { showToast } = useToast()
  const { shop } = useMerchantShop()
  const [currentLevel, setCurrentLevel] = useState<ShopLevel>('normal')
  const [shopLevelNum, setShopLevelNum] = useState(1)
  const [totalSales, setTotalSales] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const shopId = shop?.id ?? null
  const shopPublicUrl = useMemo(
    () => (shopId ? buildShopPublicUrl(shopId) : ''),
    [shopId],
  )

  useEffect(() => {
    const readAuth = (): { shopId: string } | null => {
      try {
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
        if (!raw) return null
        const parsed = JSON.parse(raw) as { shopId?: string | null }
        const id = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
        if (!id) return null
        return { shopId: id }
      } catch {
        return null
      }
    }

    const fetchPlan = async () => {
      const auth = readAuth()
      if (!auth) {
        setError(
          lang === 'zh'
            ? '未找到店铺信息，请重新登录商家后台'
            : 'Shop information not found, please log in again.',
        )
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const res = await api.get<{ id: string; level: number; sales: number }>(
          `/api/shops/${encodeURIComponent(auth.shopId)}`,
        )
        const levelVal = Number(res.level ?? 1)
        setShopLevelNum(Number.isFinite(levelVal) ? levelVal : 1)
        setCurrentLevel(mapLevel(levelVal))
        const salesVal = Number(res.sales ?? 0)
        setTotalSales(Number.isFinite(salesVal) ? salesVal : 0)
      } catch {
        setError(
          lang === 'zh'
            ? '无法加载店铺运营计划，请稍后重试'
            : 'Failed to load shop growth plan, please try again later.',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [lang])

  const currentIndex = LEVELS.findIndex((l) => l.key === currentLevel)
  const nextLevel = LEVELS[currentIndex + 1]
  const currentLevelInfo = LEVELS[currentIndex]!

  const { progress, remain } = getMerchantShopLevelProgress(shopLevelNum, totalSales)

  const copyShopLink = async () => {
    if (!shopPublicUrl) {
      showToast(lang === 'zh' ? '暂无店铺链接' : 'Shop link unavailable', 'error')
      return
    }
    try {
      await navigator.clipboard.writeText(shopPublicUrl)
      showToast(lang === 'zh' ? '店铺链接已复制' : 'Shop link copied')
    } catch {
      showToast(lang === 'zh' ? '复制失败，请手动复制' : 'Copy failed, please copy manually', 'error')
    }
  }

  const consultPaidChannel = (channel: PaidChannelKey) => {
    const channelInfo = PAID_CHANNELS.find((c) => c.key === channel)
    openCrispChat({ shopName: shop?.name, shopId: shop?.id })
    showToast(
      lang === 'zh'
        ? `已打开客服，请说明您想购买「${channelInfo?.nameZh ?? '付费流量'}」`
        : `Chat opened — mention you want "${channelInfo?.nameEn ?? 'paid traffic'}"`,
    )
  }

  const scrollToPaid = () => {
    document.getElementById('merchant-plan-paid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="merchant-plan-page merchant-plan-page--v2">
      <header className="merchant-plan-header merchant-plan-header--v2">
        <div className="merchant-plan-header-main">
          <span className="merchant-plan-header-icon" aria-hidden="true">
            <img src={yunyingjihua} alt="" className="merchant-plan-header-icon-img" />
          </span>
          <div>
            <h1 className="merchant-plan-title">
              {lang === 'zh' ? '运营计划' : 'Growth plan'}
            </h1>
            <p className="merchant-plan-subtitle">
              {lang === 'zh'
                ? '通过自然分享与付费推广获取店铺流量，提升曝光与成交'
                : 'Grow traffic through organic sharing and paid promotion to boost exposure and sales.'}
            </p>
          </div>
        </div>
        <div className="merchant-plan-header-stats">
          <div className="merchant-plan-header-stat">
            <span className="merchant-plan-header-stat-value">
              {loading ? '—' : `$${totalSales.toLocaleString()}`}
            </span>
            <span className="merchant-plan-header-stat-label">
              {lang === 'zh' ? '累计销售额' : 'Total sales'}
            </span>
          </div>
          <div className="merchant-plan-header-stat">
            <span className="merchant-plan-header-stat-value">
              {lang === 'zh' ? currentLevelInfo.nameZh : currentLevelInfo.nameEn}
            </span>
            <span className="merchant-plan-header-stat-label">
              {lang === 'zh' ? '当前等级' : 'Current level'}
            </span>
          </div>
        </div>
      </header>

      {error && <div className="merchant-plan-error merchant-plan-error--v2">{error}</div>}

      <div className="merchant-plan-traffic-overview">
        <a href="#merchant-plan-organic" className="merchant-plan-traffic-overview-card merchant-plan-traffic-overview-card--organic">
          <span className="merchant-plan-traffic-overview-kicker">
            {lang === 'zh' ? '自然流量' : 'Organic traffic'}
          </span>
          <span className="merchant-plan-traffic-overview-title">
            {lang === 'zh' ? '分享店铺链接获客' : 'Share your shop link'}
          </span>
          <span className="merchant-plan-traffic-overview-desc">
            {lang === 'zh' ? '零成本，适合社群与私域传播' : 'Free — great for communities and direct outreach'}
          </span>
        </a>
        <a href="#merchant-plan-paid" className="merchant-plan-traffic-overview-card merchant-plan-traffic-overview-card--paid">
          <span className="merchant-plan-traffic-overview-kicker">
            {lang === 'zh' ? '付费流量' : 'Paid traffic'}
          </span>
          <span className="merchant-plan-traffic-overview-title">
            {lang === 'zh' ? '购买平台推广流量' : 'Buy ad platform traffic'}
          </span>
          <span className="merchant-plan-traffic-overview-desc">
            {lang === 'zh' ? 'TikTok / Meta / Google / 其他' : 'TikTok / Meta / Google / Other'}
          </span>
        </a>
      </div>

      <section id="merchant-plan-organic" className="merchant-plan-section merchant-plan-section--v2 merchant-plan-section--organic">
        <div className="merchant-plan-section-head">
          <span className="merchant-plan-section-icon" aria-hidden="true">
            <img src={liulianggaikuang} alt="" />
          </span>
          <div>
            <h2 className="merchant-plan-section-title">
              {lang === 'zh' ? '自然流量' : 'Organic traffic'}
            </h2>
            <p className="merchant-plan-section-desc">
              {lang === 'zh'
                ? '使用您的专属店铺链接，分享给潜在买家，引导其进店浏览与下单。'
                : 'Use your unique shop link and share it with potential buyers to drive visits and orders.'}
            </p>
          </div>
        </div>

        <div className="merchant-plan-link-card">
          <label className="merchant-plan-link-label" htmlFor="merchant-plan-shop-url">
            {lang === 'zh' ? '店铺推广链接' : 'Shop promotion link'}
          </label>
          <div className="merchant-plan-link-row">
            <input
              id="merchant-plan-shop-url"
              type="text"
              className="merchant-plan-link-input"
              readOnly
              value={shopPublicUrl || (lang === 'zh' ? '登录并绑定店铺后显示' : 'Available after shop is linked')}
            />
            <button
              type="button"
              className="merchant-plan-link-copy"
              onClick={copyShopLink}
              disabled={!shopPublicUrl}
            >
              {lang === 'zh' ? '复制链接' : 'Copy link'}
            </button>
          </div>
          {shop?.name ? (
            <p className="merchant-plan-link-hint">
              {lang === 'zh' ? `店铺：${shop.name}` : `Shop: ${shop.name}`}
            </p>
          ) : null}
        </div>

        <ul className="merchant-plan-tips-list merchant-plan-tips-list--v2">
          {(lang === 'zh' ? ORGANIC_TIPS_ZH : ORGANIC_TIPS_EN).map((tip, i) => (
            <li key={i} className="merchant-plan-tips-item merchant-plan-tips-item--v2">
              <span className="merchant-plan-tips-num">{i + 1}</span>
              <span className="merchant-plan-tips-text">{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="merchant-plan-paid" className="merchant-plan-section merchant-plan-section--v2 merchant-plan-section--paid">
        <div className="merchant-plan-section-head">
          <div className="merchant-plan-section-head-copy">
            <h2 className="merchant-plan-section-title">
              {lang === 'zh' ? '付费流量' : 'Paid traffic'}
            </h2>
            <p className="merchant-plan-section-desc">
              {lang === 'zh'
                ? '购买 TikTok、Meta、Google 等平台推广流量，快速获取曝光。选择渠道后联系客服完成购买与投放配置。'
                : 'Purchase traffic from TikTok, Meta, Google, and more. Contact support after selecting a channel to complete purchase and setup.'}
            </p>
          </div>
        </div>

        <div className="merchant-plan-paid-grid">
          {PAID_CHANNELS.map((channel) => (
            <article key={channel.key} className="merchant-plan-paid-card">
              <div
                className={`merchant-plan-paid-card-icon${channel.icon ? ' merchant-plan-paid-card-icon--brand' : ''}`}
                style={
                  channel.icon
                    ? undefined
                    : { background: `linear-gradient(135deg, ${channel.accent} 0%, ${channel.accent}cc 100%)` }
                }
                aria-hidden="true"
              >
                {channel.icon ? (
                  <img src={channel.icon} alt="" className="merchant-plan-paid-card-icon-img" />
                ) : (
                  <span>{channel.iconLabel}</span>
                )}
              </div>
              <h3 className="merchant-plan-paid-card-title">
                {lang === 'zh' ? channel.nameZh : channel.nameEn}
              </h3>
              <p className="merchant-plan-paid-card-desc">
                {lang === 'zh' ? channel.descZh : channel.descEn}
              </p>
              <button
                type="button"
                className="merchant-plan-paid-card-btn"
                onClick={() => consultPaidChannel(channel.key)}
              >
                {lang === 'zh' ? '咨询购买' : 'Consult & buy'}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="merchant-plan-section merchant-plan-section--v2 merchant-plan-section--levels">
        <div className="merchant-plan-section-head merchant-plan-section-head--compact">
          <div>
            <h2 className="merchant-plan-section-title">
              {lang === 'zh' ? '店铺等级与权益' : 'Shop levels & benefits'}
            </h2>
            <p className="merchant-plan-section-desc">
              {lang === 'zh'
                ? '完成对应销售额自动升级；提升等级可解锁更高利润比例与平台扶持'
                : 'Levels upgrade automatically as sales grow — unlock better margins and platform support.'}
            </p>
          </div>
        </div>

        <div className="merchant-plan-current merchant-plan-current--v2">
          <div className="merchant-plan-current-card">
            <div className="merchant-plan-current-top">
              <div className="merchant-plan-current-icon" aria-hidden="true">
                <img src={currentLevelInfo.icon} alt="" className="merchant-plan-icon-img" loading="lazy" />
              </div>
              <div className="merchant-plan-current-info">
                <span className="merchant-plan-current-label">
                  {lang === 'zh' ? '当前等级' : 'Current level'}
                </span>
                <h3 className="merchant-plan-current-name">
                  {lang === 'zh' ? currentLevelInfo.nameZh : currentLevelInfo.nameEn}
                </h3>
                <p className="merchant-plan-current-desc">
                  {lang === 'zh' ? currentLevelInfo.descZh : currentLevelInfo.descEn}
                </p>
              </div>
            </div>
            {nextLevel ? (
              <div className="merchant-plan-current-progress-wrap">
                <div className="merchant-plan-current-progress-head">
                  <span className="merchant-plan-current-progress-text">
                    {lang === 'zh' ? '升级至 ' : 'Upgrade to '}
                    {lang === 'zh' ? nextLevel.nameZh : nextLevel.nameEn}
                    {lang === 'zh' ? '：还需 ' : ': need '}
                    <strong>${remain.toLocaleString()}</strong>
                  </span>
                  <span className="merchant-plan-current-progress-pct">{Math.round(progress)}%</span>
                </div>
                <div className="merchant-plan-current-progress-bar">
                  <div
                    className="merchant-plan-current-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="merchant-plan-current-max">
                {lang === 'zh' ? '您已达到最高等级' : 'You have reached the highest level'}
              </div>
            )}
          </div>
        </div>

        <ul className="merchant-plan-levels-list merchant-plan-levels-list--v2">
          {LEVELS.map((level, index) => {
            const isCurrent = level.key === currentLevel
            const isNextLevel = index === currentIndex + 1
            const isPast = index <= currentIndex
            return (
              <li
                key={level.key}
                className={`merchant-plan-level-item merchant-plan-level-item--v2${
                  isCurrent ? ' merchant-plan-level-item--current' : ''
                }${isPast ? ' merchant-plan-level-item--unlocked' : ''}`}
              >
                <div className="merchant-plan-level-icon" aria-hidden="true">
                  <img src={level.icon} alt="" className="merchant-plan-icon-img" loading="lazy" />
                </div>
                <div className="merchant-plan-level-header">
                  <span className="merchant-plan-level-name">
                    {lang === 'zh' ? level.nameZh : level.nameEn}
                  </span>
                  {isCurrent && (
                    <span className="merchant-plan-level-badge">
                      {lang === 'zh' ? '当前' : 'Current'}
                    </span>
                  )}
                  {isPast && !isCurrent && (
                    <span className="merchant-plan-level-badge merchant-plan-level-badge--done">
                      {lang === 'zh' ? '已达成' : 'Achieved'}
                    </span>
                  )}
                </div>
                <div className="merchant-plan-level-desc">
                  {lang === 'zh' ? level.descZh : level.descEn}
                </div>
                <ul className="merchant-plan-level-benefits">
                  {(lang === 'zh' ? level.benefitsZh : level.benefitsEn).map((b, i) => (
                    <li key={i} className="merchant-plan-level-benefit">
                      <span className="merchant-plan-level-benefit-check" aria-hidden>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                {isNextLevel && (
                  <button type="button" className="merchant-plan-level-upgrade-btn" onClick={scrollToPaid}>
                    {lang === 'zh' ? '获取流量冲刺升级' : 'Get traffic to upgrade'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

export default MerchantPlan
