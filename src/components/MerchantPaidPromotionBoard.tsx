import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api/client'
import { useMerchantShop } from '../context/MerchantShopContext'
import { useMerchantSync } from '../hooks/useMerchantSync'
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
import { PaidPromoBoardSkeleton } from './McLoadingSkeletons'
import { formatCalendarDateKey, formatDateTime } from '../utils/datetime'
import type { Lang } from '../i18n'
import { pickBilingual, pickLabel, tr } from '../i18n'

type PaidChannel = 'tiktok' | 'meta' | 'google' | 'other'
type TargetType = 'shop' | 'product'
type PromoStatus = 'pending' | 'awaiting_launch' | 'active' | 'paused' | 'ended' | 'completed'

interface OptionItem {
  value: string
  labelZh: string
  labelEn: string
  labelDe: string
  labelJa: string
  labelKo: string
  labelEs: string
  labelIt: string
  labelVi: string
  labelFr: string
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
    series?: MetricPoint[]
    totals: MetricTotals
    presets?: MetricTotals
    campaignProgress?: number
    budgetProgress?: number
    isCompleted?: boolean
    isForceEnded?: boolean
  } | null
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

const CHANNEL_META: Record<PaidChannel, { zh: string; en: string; de: string; ja: string; ko: string; es: string; it: string; vi: string
  fr: string; icon?: string }> = {
  tiktok: { zh: 'TikTok', en: 'TikTok', de: 'TikTok', ja: 'TikTok', ko: 'TikTok', es: 'TikTok', it: 'TikTok', vi: 'TikTok', fr: 'Tik Tok', icon: paidTiktok },
  meta: { zh: 'Meta', en: 'Meta', de: 'Meta', ja: 'Meta', ko: 'Meta', es: 'Meta', it: 'Meta', vi: 'Meta', fr: 'Méta', icon: paidMeta },
  google: { zh: 'Google', en: 'Google', de: 'Google', ja: 'Google', ko: 'Google', es: 'Google', it: 'Google', vi: 'Google', fr: 'Google', icon: paidGoogle },
  other: { zh: '其他渠道', en: 'Other', de: 'Andere Kanäle', ja: 'その他のチャネル', ko: '기타 채널', es: 'Otros canales', it: 'Altri canali', vi: 'Kênh khác', fr: 'Autre' },
}

const DEFAULT_REGIONS: OptionItem[] = [
  { value: 'north_america', labelZh: '北美', labelEn: 'North America', labelDe: 'Nordamerika', labelJa: '北米', labelKo: '북미', labelEs: 'Norteamérica', labelIt: 'Nord America', labelVi: 'Bắc Mỹ', labelFr: 'Amérique du Nord' },
  { value: 'europe', labelZh: '欧洲', labelEn: 'Europe', labelDe: 'Europa', labelJa: 'ヨーロッパ', labelKo: '유럽', labelEs: 'Europa', labelIt: 'Europa', labelVi: 'Châu Âu', labelFr: 'Europe' },
  { value: 'southeast_asia', labelZh: '东南亚', labelEn: 'Southeast Asia', labelDe: 'Südostasien', labelJa: '東南アジア', labelKo: '동남아시아', labelEs: 'Sudeste asiático', labelIt: 'Sud-est asiatico', labelVi: 'Đông Nam Á', labelFr: 'Asie du Sud-Est' },
  { value: 'middle_east', labelZh: '中东', labelEn: 'Middle East', labelDe: 'Naher Osten', labelJa: '中東', labelKo: '중동', labelEs: 'Oriente Medio', labelIt: 'Medio Oriente', labelVi: 'Trung Đông', labelFr: 'Moyen-Orient' },
  { value: 'latin_america', labelZh: '拉美', labelEn: 'Latin America', labelDe: 'Lateinamerika', labelJa: 'ラテンアメリカ', labelKo: '중남미', labelEs: 'Latinoamérica', labelIt: 'America Latina', labelVi: 'Mỹ Latinh', labelFr: 'Amérique latine' },
  { value: 'global', labelZh: '全球', labelEn: 'Global', labelDe: 'Global', labelJa: '全世界', labelKo: '글로벌', labelEs: 'Global', labelIt: 'Globale', labelVi: 'Toàn cầu', labelFr: 'Mondial' },
]

const DEFAULT_AUDIENCES: OptionItem[] = [
  { value: 'all', labelZh: '全部受众', labelEn: 'All audiences', labelDe: 'Alle Zielgruppen', labelJa: 'すべてのオーディエンス', labelKo: '전체 오디언스', labelEs: 'Todas las audiencias', labelIt: 'Tutti i pubblici', labelVi: 'Tất cả đối tượng', labelFr: 'Tous publics' },
  { value: 'young_adults', labelZh: '年轻群体 18-34', labelEn: 'Young adults 18-34', labelDe: 'Junge Erwachsene 18–34', labelJa: '若年層 18–34歳', labelKo: '청년층 18–34세', labelEs: 'Jóvenes 18-34', labelIt: 'Giovani adulti 18-34', labelVi: 'Thanh niên 18–34', labelFr: 'Jeunes adultes 18-34' },
  { value: 'women', labelZh: '女性用户', labelEn: 'Women', labelDe: 'Frauen', labelJa: '女性', labelKo: '여성', labelEs: 'Mujeres', labelIt: 'Donne', labelVi: 'Nữ', labelFr: 'Femmes' },
  { value: 'men', labelZh: '男性用户', labelEn: 'Men', labelDe: 'Männer', labelJa: '男性', labelKo: '남성', labelEs: 'Hombres', labelIt: 'Uomini', labelVi: 'Nam', labelFr: 'Hommes' },
  { value: 'parents', labelZh: '家长群体', labelEn: 'Parents', labelDe: 'Eltern', labelJa: '保護者', labelKo: '부모', labelEs: 'Padres', labelIt: 'Genitori', labelVi: 'Phụ huynh', labelFr: 'Parents' },
  { value: 'high_intent', labelZh: '高购买意向', labelEn: 'High purchase intent', labelDe: 'Hohe Kaufabsicht', labelJa: '購買意欲が高い', labelKo: '구매 의향 높음', labelEs: 'Alta intención de compra', labelIt: 'Alta intenzione di acquisto', labelVi: 'Ý định mua cao', labelFr: 'Intention d\'achat élevée' },
]

function isPromotionSetupEditable(promotion: PromotionInfo | null): boolean {
  if (!promotion) return false
  if (promotion.status === 'pending') return true
  if (promotion.status === 'active' && !promotion.merchantConfirmedAt) return true
  return false
}

function isCurrentMerchantPromotion(promotion: PromotionInfo | null): boolean {
  if (!promotion) return false
  return !['completed', 'ended'].includes(promotion.status)
}

function hasLaunchedCampaign(promotion: PromotionInfo | null): boolean {
  return Boolean(promotion?.campaignStartAt)
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
  lang: Lang,
) {
  if (!value) return '—'
  if (unit === 'minute') return tr(lang, { zh: `${value} 分钟`, en: `${value} min`, de: `${value} Min.`, ja: `${value} 分`, ko: `${value}분`, es: `${value} min`, it: `${value} min`, vi: `${value} phút` })
  if (unit === 'hour') return tr(lang, { zh: `${value} 小时`, en: `${value} hr`, de: `${value} Std.`, ja: `${value} 時間`, ko: `${value}시간`, es: `${value} h`, it: `${value} h`, vi: `${value} giờ` })
  return tr(lang, { zh: `${value} 天`, en: `${value} days`, de: `${value} Tage`, ja: `${value} 日`, ko: `${value}일`, es: `${value} días`, it: `${value} giorni`, vi: `${value} ngày` })
}

function formatHistoryStatus(status: PromoStatus, lang: Lang) {
  if (status === 'completed') return tr(lang, { zh: '已结算', en: 'Completed', de: 'Abgeschlossen', ja: '精算済み', ko: '정산 완료', es: 'Completada', it: 'Completata', vi: 'Hoàn tất', fr: 'Terminé'})
  if (status === 'ended') return tr(lang, { zh: '已强制结束', en: 'Force ended', de: 'Beendet', ja: '強制終了', ko: '강제 종료', es: 'Finalizada forzosamente', it: 'Terminata forzatamente', vi: 'Kết thúc cưỡng bức', fr: 'Forcer terminé'})
  if (status === 'paused') return tr(lang, { zh: '已暂停', en: 'Paused', de: 'Pausiert', ja: '一時停止中', ko: '일시 중지', es: 'Pausada', it: 'In pausa', vi: 'Tạm dừng', fr: 'En pause'})
  return status
}

function getChannelLabel(channel: PaidChannel, lang: Lang): string {
  const meta = CHANNEL_META[channel]
  return meta ? pickBilingual(lang, meta) : channel
}

function HistoryChannelLogo({ channel }: { channel: PaidChannel }) {
  const icon = CHANNEL_META[channel]?.icon ?? liulianggaikuang
  return (
    <span className="merchant-paid-promo-history-channel" aria-hidden="true">
      <img src={icon} alt="" className="merchant-paid-promo-history-channel-img" />
    </span>
  )
}

function MerchantPaidPromoHistoryDetailModal({
  item,
  lang,
  regionOptions,
  audienceOptions,
  onClose,
}: {
  item: HistoryItem
  lang: Lang
  regionOptions: OptionItem[]
  audienceOptions: OptionItem[]
  onClose: () => void
}) {
  const promo = item.promotion
  const metrics = item.metrics
  const totals = metrics?.totals
  const series = metrics?.series ?? []
  const channelLabelText = getChannelLabel(promo.channel, lang)
  const budgetTotal = promo.budgetTotal ?? metrics?.presets?.spend ?? 0
  const spend = totals?.spend ?? 0
  const budgetProgressPct = Math.min(
    100,
    Math.round((metrics?.budgetProgress ?? (budgetTotal > 0 ? spend / budgetTotal : 0)) * 100),
  )
  const campaignProgressPct = Math.min(100, Math.round((metrics?.campaignProgress ?? 0) * 100))
  const clickRate =
    totals && totals.impressions > 0 ? Math.round((totals.clicks / totals.impressions) * 1000) / 10 : 0
  const visitSeries = series.map((point) => point.visits)
  const targetIsProduct = promo.targetType === 'product'
  const targetLabel = targetIsProduct
    ? tr(lang, { zh: '单品推广', en: 'Product promotion', de: 'Produktwerbung', ja: '単品プロモーション', ko: '단일 상품 프로모션', es: 'Promoción de producto', it: 'Promozione prodotto', vi: 'Quảng cáo sản phẩm', fr: 'Promotion du produit'})
    : tr(lang, { zh: '整店推广', en: 'Whole shop', de: 'Gesamter Shop', ja: '店舗全体プロモーション', ko: '전체 매장 프로모션', es: 'Toda la tienda', it: 'Intero negozio', vi: 'Toàn bộ cửa hàng', fr: 'Boutique entière'})

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('mc-overlay-open')
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.classList.remove('mc-overlay-open')
    }
  }, [])

  return createPortal(
    <div
      className="merchant-paid-promo-history-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="merchant-paid-promo-history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="merchant-paid-promo-history-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="merchant-paid-promo-history-modal-head">
          <div className="merchant-paid-promo-history-modal-head-main">
            <HistoryChannelLogo channel={promo.channel} />
            <div>
              <h3 id="merchant-paid-promo-history-modal-title" className="merchant-paid-promo-history-modal-title">
                {tr(lang, { zh: '投放详情', en: 'Campaign details', de: 'Kampagnendetails', ja: '配信詳細', ko: '캠페인 상세', es: 'Detalles de la campaña', it: 'Dettagli campagna', vi: 'Chi tiết chiến dịch', fr: 'Détails de la campagne' })}
              </h3>
              <p className="merchant-paid-promo-history-modal-subtitle">
                {channelLabelText}
                <span aria-hidden="true"> · </span>
                {formatHistoryStatus(promo.status, lang)}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="merchant-paid-promo-history-modal-close"
            onClick={onClose}
            aria-label={tr(lang, { zh: '关闭', en: 'Close', de: 'Schließen', ja: '閉じる', ko: '닫기', es: 'Cerrar', it: 'Chiudi', vi: 'Đóng', fr: 'Fermer'})}
          >
            ×
          </button>
        </div>

        <div className="merchant-paid-promo-history-modal-body">
          <div className="merchant-paid-promo-history-modal-meta">
            <span>
              {formatDateTime(promo.campaignStartAt, lang) || '—'}
              <span aria-hidden="true"> → </span>
              {formatDateTime(promo.campaignEndAt, lang) || '—'}
            </span>
            <span>{formatDurationLabel(promo.campaignDurationValue, promo.campaignDurationUnit, lang)}</span>
          </div>

          <div className="merchant-paid-promo-history-modal-config">
            <div className="merchant-paid-promo-history-modal-config-row">
              <span>{tr(lang, { zh: '推广目标', en: 'Target', de: 'Ziel', ja: 'プロモーション対象', ko: '프로모션 대상', es: 'Objetivo de promoción', it: 'Obiettivo', vi: 'Mục tiêu', fr: 'Cible'})}</span>
              <strong>{targetLabel}</strong>
            </div>
            {targetIsProduct ? (
              <div className="merchant-paid-promo-history-modal-product">
                {promo.targetProductImage ? (
                  <img src={promo.targetProductImage} alt="" className="merchant-paid-promo-history-modal-product-img" />
                ) : (
                  <span className="merchant-paid-promo-history-modal-product-img merchant-paid-promo-history-modal-product-img--empty">
                    SKU
                  </span>
                )}
                <div>
                  <strong title={promo.targetProductTitle ?? undefined}>
                    {promo.targetProductTitle ?? tr(lang, { zh: '推广商品', en: 'Product', de: 'Produkt', ja: 'プロモーション商品', ko: '프로모션 상품', es: 'SKU promocionado', it: 'Prodotto', vi: 'Sản phẩm', fr: 'Produit'})}
                  </strong>
                  <code>ID · {warehouseProductId(promo)}</code>
                </div>
              </div>
            ) : null}
            <div className="merchant-paid-promo-history-modal-config-row">
              <span>{tr(lang, { zh: '地区', en: 'Region', de: 'Region', ja: '地域', ko: '지역', es: 'Región', it: 'Regione', vi: 'Khu vực', fr: 'Région'})}</span>
              <strong>{labelForOption(regionOptions, promo.targetRegion, lang)}</strong>
            </div>
            <div className="merchant-paid-promo-history-modal-config-row">
              <span>{tr(lang, { zh: '受众', en: 'Audience', de: 'Zielgruppe', ja: 'オーディエンス', ko: '타겟', es: 'Audiencia', it: 'Pubblico', vi: 'Đối tượng', fr: 'Public'})}</span>
              <strong>{labelsForAudiences(audienceOptions, promo.targetAudience, lang)}</strong>
            </div>
          </div>

          <div className="merchant-paid-promo-history-modal-progress">
            <div className="merchant-paid-promo-history-modal-progress-item">
              <div className="merchant-paid-promo-history-modal-progress-copy">
                <span>{tr(lang, { zh: '预算消耗', en: 'Budget spent', de: 'Budgetverbrauch', ja: '予算消化', ko: '예산 소진', es: 'Presupuesto consumido', it: 'Budget consumato', vi: 'Ngân sách đã dùng', fr: 'Budget dépensé'})}</span>
                <strong>{budgetProgressPct}%</strong>
              </div>
              <div className="merchant-paid-promo-progress-bar">
                <span style={{ width: `${budgetProgressPct}%` }} />
              </div>
              <small>
                ${spend.toFixed(2)} / ${budgetTotal.toFixed(2)}
              </small>
            </div>
            {campaignProgressPct > 0 && campaignProgressPct < 100 ? (
              <div className="merchant-paid-promo-history-modal-progress-item">
                <div className="merchant-paid-promo-history-modal-progress-copy">
                  <span>{tr(lang, { zh: '投放进度', en: 'Campaign progress', de: 'Kampagnenfortschritt', ja: '配信進捗', ko: '캠페인 진행률', es: 'Progreso de la campaña', it: 'Avanzamento campagna', vi: 'Tiến độ chiến dịch', fr: 'Progression de la campagne'})}</span>
                  <strong>{campaignProgressPct}%</strong>
                </div>
                <div className="merchant-paid-promo-progress-bar merchant-paid-promo-progress-bar--muted">
                  <span style={{ width: `${campaignProgressPct}%` }} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="merchant-paid-promo-history-modal-metrics" role="list">
            <div className="merchant-paid-promo-history-modal-metric" role="listitem">
              <small>{tr(lang, { zh: '曝光', en: 'Impressions', de: 'Impressionen', ja: 'インプレッション', ko: '노출', es: 'Impresiones', it: 'Impressioni', vi: 'Lượt hiển thị', fr: 'Impressions'})}</small>
              <strong>{(totals?.impressions ?? 0).toLocaleString()}</strong>
            </div>
            <div className="merchant-paid-promo-history-modal-metric" role="listitem">
              <small>{tr(lang, { zh: '点击', en: 'Clicks', de: 'Klicks', ja: 'クリック', ko: '클릭', es: 'Clics', it: 'Clic', vi: 'Lượt nhấp', fr: 'Clics'})}</small>
              <strong>{(totals?.clicks ?? 0).toLocaleString()}</strong>
            </div>
            <div className="merchant-paid-promo-history-modal-metric" role="listitem">
              <small>{tr(lang, { zh: '进店', en: 'Visits', de: 'Besuche', ja: '来店', ko: '방문', es: 'Visitas', it: 'Visite', vi: 'Lượt vào cửa hàng', fr: 'Visites'})}</small>
              <strong>{(totals?.visits ?? 0).toLocaleString()}</strong>
            </div>
            <div className="merchant-paid-promo-history-modal-metric" role="listitem">
              <small>{tr(lang, { zh: '点击率', en: 'CTR', de: 'CTR', ja: 'CTR', ko: 'CTR', es: 'CTR', it: 'CTR', vi: 'CTR', fr: 'CTR' })}</small>
              <strong>{clickRate}%</strong>
            </div>
            <div className="merchant-paid-promo-history-modal-metric" role="listitem">
              <small>{tr(lang, { zh: '消耗', en: 'Spend', de: 'Ausgaben', ja: '消化額', ko: '소진액', es: 'Gasto', it: 'Spesa', vi: 'Chi phí', fr: 'Dépenser'})}</small>
              <strong>${spend.toFixed(2)}</strong>
            </div>
            <div className="merchant-paid-promo-history-modal-metric" role="listitem">
              <small>{tr(lang, { zh: '成交额', en: 'Revenue', de: 'Umsatz', ja: '売上高', ko: '거래액', es: 'Ingresos', it: 'Ricavi', vi: 'Doanh thu', fr: 'Revenu'})}</small>
              <strong>${(totals?.revenue ?? 0).toFixed(2)}</strong>
            </div>
          </div>

          <div className="merchant-paid-promo-history-modal-sparkline">
            <div className="merchant-paid-promo-sparkline-copy">
              <span className="merchant-paid-promo-sparkline-label">{tr(lang, { zh: '进店趋势', en: 'Visit trend', de: 'Besuchstrend', ja: '来店トレンド', ko: '방문 추이', es: 'Tendencia de visitas', it: 'Andamento visite', vi: 'Xu hướng lượt vào cửa hàng', fr: 'Tendance des visites'})}</span>
              <span className="merchant-paid-promo-sparkline-sub">
                {tr(lang, { zh: `共 ${series.length} 个统计日`, en: `${series.length} tracked day(s)`, de: `${series.length} erfasste Tag(e)`, ja: `${series.length} 日分のデータ`, ko: `총 ${series.length}일 데이터`, es: `${series.length} día(s) registrado(s)`, it: `${series.length} giorno/i registrato/i`, vi: `${series.length} ngày có dữ liệu` })}
              </span>
            </div>
            <MiniSparkline data={visitSeries.length > 0 ? visitSeries : [0, 0, 0, 0, 0, 0, 0]} color="#5b6cff" />
          </div>

          {series.length > 1 ? (
            <div className="merchant-paid-promo-history-modal-series">
              <h4>{tr(lang, { zh: '分日数据', en: 'Daily breakdown', de: 'Tagesübersicht', ja: '日別データ', ko: '일별 데이터', es: 'Desglose diario', it: 'Dettaglio giornaliero', vi: 'Dữ liệu theo ngày', fr: 'Répartition quotidienne'})}</h4>
              <div className="merchant-paid-promo-history-modal-series-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{tr(lang, { zh: '日期', en: 'Date', de: 'Datum', ja: '日付', ko: '날짜', es: 'Fecha', it: 'Data', vi: 'Ngày', fr: 'Date'})}</th>
                      <th>{tr(lang, { zh: '曝光', en: 'Impr.', de: 'Impr.', ja: 'Imp.', ko: '노출', es: 'Impresiones', it: 'Imp.', vi: 'Hiển thị', fr: 'Impr.'})}</th>
                      <th>{tr(lang, { zh: '点击', en: 'Clicks', de: 'Klicks', ja: 'クリック', ko: '클릭', es: 'Clics', it: 'Clic', vi: 'Lượt nhấp', fr: 'Clics'})}</th>
                      <th>{tr(lang, { zh: '进店', en: 'Visits', de: 'Besuche', ja: '来店', ko: '방문', es: 'Visitas', it: 'Visite', vi: 'Lượt vào cửa hàng', fr: 'Visites'})}</th>
                      <th>{tr(lang, { zh: '消耗', en: 'Spend', de: 'Ausgaben', ja: '消化額', ko: '소진액', es: 'Gasto', it: 'Spesa', vi: 'Chi phí', fr: 'Dépenser'})}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((row) => (
                      <tr key={row.date}>
                        <td>{formatCalendarDateKey(row.date, lang)}</td>
                        <td>{row.impressions.toLocaleString()}</td>
                        <td>{row.clicks.toLocaleString()}</td>
                        <td>{row.visits.toLocaleString()}</td>
                        <td>${row.spend.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function labelForOption(options: OptionItem[], value: string | null, lang: Lang) {
  if (!value) return '—'
  const item = options.find((opt) => opt.value === value)
  if (!item) return value
  return pickLabel(lang, item)
}

function labelsForAudiences(options: OptionItem[], value: string | null, lang: Lang) {
  const parts = parseAudienceValues(value)
  if (parts.length === 0) return '—'
  const separator = tr(lang, { zh: '、', en: ', ', de: ', ', ja: '、', ko: ', ', es: ', ', it: ', ', vi: ', ', fr: ', ' })
  return parts.map((part) => labelForOption(options, part, lang)).join(separator)
}

function warehouseProductId(promo: Pick<PromotionInfo, 'targetProductId' | 'targetListingId'>): string {
  if (promo.targetProductId != null && String(promo.targetProductId).trim()) {
    return String(promo.targetProductId)
  }
  return promo.targetListingId?.trim() || '—'
}

interface MerchantPaidPromotionBoardProps {
  lang: Lang
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
  const [historyDetailItem, setHistoryDetailItem] = useState<HistoryItem | null>(null)
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
      if (!res.active || !res.promotion || !isCurrentMerchantPromotion(res.promotion)) {
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
    if (!historyDetailItem) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHistoryDetailItem(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [historyDetailItem])

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
    return () => {
      cancelled = true
    }
  }, [fetchBoard, fetchHistory, fetchProducts])

  useMerchantSync(['promotion', 'dashboard', 'all'], () => {
    void Promise.all([fetchBoard(), fetchHistory()])
  }, { immediate: false })

  const saveTarget = async () => {
    const auth = readAuth()
    if (!auth || !promotion || formLocked) return
    if (targetType === 'product' && !selectedListingId) {
      showToast(tr(lang, { zh: '请选择要推广的商品', en: 'Select a product to promote', de: 'Bitte ein Produkt zur Werbung auswählen', ja: 'プロモーションする商品を選択してください', ko: '프로모션할 상품을 선택하세요', es: 'Selecciona un producto para promocionar', it: 'Seleziona un prodotto da promuovere', vi: 'Vui lòng chọn sản phẩm cần quảng cáo', fr: 'Sélectionnez un produit à promouvoir' }), 'error')
      return
    }
    if (!targetRegion) {
      showToast(tr(lang, { zh: '请选择推广地区', en: 'Select a target region', de: 'Bitte eine Zielregion auswählen', ja: 'プロモーション地域を選択してください', ko: '프로모션 지역을 선택하세요', es: 'Selecciona una región objetivo', it: 'Seleziona una regione target', vi: 'Vui lòng chọn khu vực quảng cáo', fr: 'Sélectionnez une région cible' }), 'error')
      return
    }
    if (targetAudiences.length === 0) {
      showToast(tr(lang, { zh: '请选择受众群体', en: 'Select a target audience', de: 'Bitte eine Zielgruppe auswählen', ja: 'ターゲットオーディエンスを選択してください', ko: '타겟 오디언스를 선택하세요', es: 'Selecciona una audiencia objetivo', it: 'Seleziona un pubblico target', vi: 'Vui lòng chọn đối tượng mục tiêu', fr: 'Sélectionnez un public cible' }), 'error')
      return
    }
    const targetAudience = serializeAudienceValues(targetAudiences)
    if (!targetAudience) {
      showToast(tr(lang, { zh: '请选择受众群体', en: 'Select a target audience', de: 'Bitte eine Zielgruppe auswählen', ja: 'ターゲットオーディエンスを選択してください', ko: '타겟 오디언스를 선택하세요', es: 'Selecciona una audiencia objetivo', it: 'Seleziona un pubblico target', vi: 'Vui lòng chọn đối tượng mục tiêu', fr: 'Sélectionnez un public cible' }), 'error')
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
      showToast(tr(lang, { zh: '推广方案已提交，等待管理员开启', en: 'Promotion submitted — awaiting admin launch', de: 'Werbeplan eingereicht — Warten auf Admin-Freigabe', ja: 'プロモーション案を送信しました。管理者による開始をお待ちください', ko: '프로모션 플랜이 제출되었습니다. 관리자 시작을 기다리는 중', es: 'Promoción enviada: en espera de activación por el administrador', it: 'Promozione inviata: in attesa di attivazione da parte dell\'amministratore', vi: 'Đã gửi quảng cáo — chờ quản trị viên kích hoạt', fr: 'Promotion soumise – en attente de lancement par l\'administrateur' }))
    } catch (e) {
      showToast(e instanceof Error ? e.message : tr(lang, { zh: '提交失败', en: 'Submit failed', de: 'Einreichung fehlgeschlagen', ja: '送信に失敗しました', ko: '제출 실패', es: 'Error al enviar', it: 'Invio non riuscito', vi: 'Gửi thất bại', fr: 'Échec de la soumission' }), 'error')
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

  const activePromotion = isCurrentMerchantPromotion(promotion) ? promotion : null
  const channelInfo = activePromotion ? CHANNEL_META[activePromotion.channel] : null
  const formLocked = !isPromotionSetupEditable(activePromotion)
  const isPausedCampaign = activePromotion?.status === 'paused'
  const showActiveSummary = Boolean(
    activePromotion
    && (activePromotion.status === 'active' || activePromotion.status === 'paused')
    && activePromotion.merchantConfirmedAt
    && formLocked
    && hasLaunchedCampaign(activePromotion),
  )
  const showCampaignMetrics = Boolean(
    showActiveSummary && metrics && hasLaunchedCampaign(activePromotion),
  )
  const regionOptions = regions.length > 0 ? regions : DEFAULT_REGIONS
  const audienceOptions = audiences.length > 0 ? audiences : DEFAULT_AUDIENCES

  const historyDetailModal = historyDetailItem ? (
    <MerchantPaidPromoHistoryDetailModal
      item={historyDetailItem}
      lang={lang}
      regionOptions={regionOptions}
      audienceOptions={audienceOptions}
      onClose={() => setHistoryDetailItem(null)}
    />
  ) : null

  if (loading) return <PaidPromoBoardSkeleton lang={lang} />
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
            {tr(lang, { zh: '历史投放记录', en: 'Campaign history', de: 'Kampagnenverlauf', ja: '配信履歴', ko: '캠페인 이력', es: 'Historial de campañas', it: 'Storico campagne', vi: 'Lịch sử chiến dịch', fr: 'Historique de la campagne'})}
          </h4>
          <p className="merchant-paid-promo-history-sub">
            {tr(lang, { zh: '点击每条记录查看详细投放数据', en: 'Tap a record to view full campaign details', de: 'Tippen Sie auf einen Eintrag für Details', ja: '各レコードをタップして配信詳細を表示', ko: '각 기록을 탭하여 상세 캠페인 데이터 확인', es: 'Toca un registro para ver los detalles completos de la campaña', it: 'Tocca un record per i dettagli completi della campagna', vi: 'Nhấn vào từng bản ghi để xem chi tiết chiến dịch', fr: 'Appuyez sur un enregistrement pour afficher tous les détails de la campagne' })}
          </p>
        </div>
        {history.length > 0 ? (
          <span className="merchant-paid-promo-history-count">
            {history.length} {tr(lang, { zh: '条', en: 'records', de: 'Einträge', ja: '件', ko: '건', es: 'registros', it: 'record', vi: 'bản ghi', fr: 'enregistrements'})}
          </span>
        ) : null}
      </div>
      {historyLoading && history.length === 0 ? (
        <p className="merchant-paid-promo-empty">{tr(lang, { zh: '加载中…', en: 'Loading…', de: 'Wird geladen…', ja: '読み込み中…', ko: '로딩 중…', es: 'Cargando…', it: 'Caricamento…', vi: 'Đang tải…', fr: 'Chargement…'})}</p>
      ) : history.length === 0 ? (
        <p className="merchant-paid-promo-empty">
          {tr(lang, { zh: '暂无历史投放记录', en: 'No campaign history yet', de: 'Noch kein Kampagnenverlauf', ja: '配信履歴はまだありません', ko: '캠페인 이력이 없습니다', es: 'Aún no hay historial de campañas', it: 'Nessuno storico campagne', vi: 'Chưa có lịch sử chiến dịch', fr: 'Pas encore d\'historique de campagne' })}
        </p>
      ) : (
        <div className="merchant-paid-promo-history-list">
          {visibleHistory.map((item) => {
            const promo = item.promotion
            const totals = item.metrics?.totals
            const channelLabelText = getChannelLabel(promo.channel, lang)
            const clickRateHistory =
              totals && totals.impressions > 0
                ? Math.round((totals.clicks / totals.impressions) * 1000) / 10
                : 0
            const targetLabel =
              promo.targetType === 'product'
                ? promo.targetProductTitle ?? tr(lang, { zh: '单品推广', en: 'Product', de: 'Produkt', ja: '単品プロモーション', ko: '단일 상품 프로모션', es: 'Promoción de producto', it: 'Prodotto', vi: 'Sản phẩm', fr: 'Produit'})
                : tr(lang, { zh: '整店推广', en: 'Whole shop', de: 'Gesamter Shop', ja: '店舗全体プロモーション', ko: '전체 매장 프로모션', es: 'Toda la tienda', it: 'Intero negozio', vi: 'Toàn bộ cửa hàng', fr: 'Boutique entière'})
            return (
              <article
                key={promo.id}
                className="merchant-paid-promo-history-card merchant-paid-promo-history-card--clickable"
                role="button"
                tabIndex={0}
                onClick={() => setHistoryDetailItem(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setHistoryDetailItem(item)
                  }
                }}
              >
                <div className="merchant-paid-promo-history-card-top">
                  <HistoryChannelLogo channel={promo.channel} />
                  <div className="merchant-paid-promo-history-card-main">
                    <div className="merchant-paid-promo-history-card-title-row">
                      <strong className="merchant-paid-promo-history-channel-name">{channelLabelText}</strong>
                      <span
                        className={`merchant-paid-promo-history-status merchant-paid-promo-history-status--${promo.status}`}
                      >
                        {formatHistoryStatus(promo.status, lang)}
                      </span>
                    </div>
                    <p className="merchant-paid-promo-history-dates">
                      {formatDateTime(promo.campaignStartAt, lang) || '—'}
                      <span aria-hidden="true"> → </span>
                      {formatDateTime(promo.campaignEndAt, lang) || '—'}
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
                    <small>{tr(lang, { zh: '曝光', en: 'Impr.', de: 'Impr.', ja: 'Imp.', ko: '노출', es: 'Impresiones', it: 'Imp.', vi: 'Hiển thị', fr: 'Impr.'})}</small>
                    <strong>{(totals?.impressions ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="merchant-paid-promo-history-metric" role="listitem">
                    <small>{tr(lang, { zh: '点击', en: 'Clicks', de: 'Klicks', ja: 'クリック', ko: '클릭', es: 'Clics', it: 'Clic', vi: 'Lượt nhấp', fr: 'Clics'})}</small>
                    <strong>{(totals?.clicks ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="merchant-paid-promo-history-metric" role="listitem">
                    <small>{tr(lang, { zh: '进店', en: 'Visits', de: 'Besuche', ja: '来店', ko: '방문', es: 'Visitas', it: 'Visite', vi: 'Lượt vào cửa hàng', fr: 'Visites'})}</small>
                    <strong>{(totals?.visits ?? 0).toLocaleString()}</strong>
                  </div>
                  <div className="merchant-paid-promo-history-metric" role="listitem">
                    <small>{tr(lang, { zh: '点击率', en: 'CTR', de: 'CTR', ja: 'CTR', ko: 'CTR', es: 'CTR', it: 'CTR', vi: 'CTR', fr: 'CTR' })}</small>
                    <strong>{clickRateHistory}%</strong>
                  </div>
                  <div className="merchant-paid-promo-history-metric merchant-paid-promo-history-metric--spend" role="listitem">
                    <small>{tr(lang, { zh: '消耗', en: 'Spend', de: 'Ausgaben', ja: '消化額', ko: '소진액', es: 'Gasto', it: 'Spesa', vi: 'Chi phí', fr: 'Dépenser'})}</small>
                    <strong>${(totals?.spend ?? 0).toFixed(2)}</strong>
                  </div>
                </div>
                <p className="merchant-paid-promo-history-card-hint">
                  {tr(lang, { zh: '点击查看详情', en: 'Tap for details', de: 'Tippen für Details', ja: 'タップして詳細を表示', ko: '탭하여 상세 보기', es: 'Toca para ver detalles', it: 'Tocca per i dettagli', vi: 'Nhấn để xem chi tiết', fr: 'Appuyez pour plus de détails' })}
                </p>
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
            ? tr(lang, { zh: '收起历史记录', en: 'Show fewer records', de: 'Weniger anzeigen', ja: '履歴を折りたたむ', ko: '이력 접기', es: 'Mostrar menos registros', it: 'Mostra meno record', vi: 'Thu gọn lịch sử', fr: 'Afficher moins d\'enregistrements' })
            : tr(lang, {
                zh: `展开更多（还有 ${history.length - historyPreviewLimit} 条）`,
                en: `Show more (${history.length - historyPreviewLimit} more)`,
                de: `Mehr anzeigen (${history.length - historyPreviewLimit} weitere)`,
                ja: `もっと見る（あと ${history.length - historyPreviewLimit} 件）`,
                ko: `더 보기 (${history.length - historyPreviewLimit}건 더 있음)`,
                es: `Ver más (${history.length - historyPreviewLimit} más)`,
                it: `Mostra altro (${history.length - historyPreviewLimit} in più)`, vi: `Xem thêm (còn ${history.length - historyPreviewLimit} bản ghi)`,
              })}
        </button>
      ) : null}
    </div>
  )

  if (!activePromotion) {
    return (
      <>
      <section className="merchant-dashboard-section merchant-paid-promo-board" aria-label={tr(lang, { zh: '付费推广历史', en: 'Paid promotion history', de: 'Bezahlte Werbung – Verlauf', ja: '有料プロモーション履歴', ko: '유료 프로모션 이력', es: 'Historial de promoción de pago', it: 'Storico promozioni a pagamento', vi: 'Lịch sử quảng cáo trả phí', fr: 'Historique des promotions payantes'})}>
        <header className="merchant-dashboard-section-head">
          <div className="merchant-paid-promo-board-head">
            <span className="merchant-paid-promo-board-icon merchant-paid-promo-board-icon--lite" aria-hidden="true">
              <img src={paidPromoLite} alt="" className="merchant-paid-promo-board-icon-img" />
            </span>
            <div>
              <h3 className="merchant-dashboard-section-title">
                {tr(lang, { zh: '付费推广', en: 'Paid promotion', de: 'Bezahlte Werbung', ja: '有料プロモーション', ko: '유료 프로모션', es: 'Promoción de pago', it: 'Promozione a pagamento', vi: 'Quảng cáo trả phí', fr: 'Promotion payante'})}
              </h3>
              <p className="merchant-dashboard-section-desc">
                {tr(lang, { zh: '当前无进行中的推广，可查看历史投放数据。', en: 'No active campaign. Review past performance below.', de: 'Keine aktive Kampagne. Vergangene Daten unten einsehen.', ja: '進行中のプロモーションはありません。過去の配信データをご確認ください。', ko: '진행 중인 프로모션이 없습니다. 과거 캠페인 데이터를 확인하세요.', es: 'No hay campaña activa. Revisa el rendimiento pasado a continuación.', it: 'Nessuna campagna attiva. Consulta le prestazioni passate qui sotto.', vi: 'Không có chiến dịch đang chạy. Xem dữ liệu quảng cáo trước đây bên dưới.', fr: 'Aucune campagne active. Passez en revue les performances passées ci-dessous.' })}
              </p>
            </div>
          </div>
        </header>
        {historySection}
      </section>
      {historyDetailModal}
      </>
    )
  }

  const promo = activePromotion

  return (
    <>
    <section className="merchant-dashboard-section merchant-paid-promo-board" aria-label={tr(lang, { zh: '付费推广看板', en: 'Paid promotion board', de: 'Werbe-Dashboard', ja: '有料プロモーションダッシュボード', ko: '유료 프로모션 보드', es: 'Panel de promoción de pago', it: 'Pannello promozioni a pagamento', vi: 'Bảng quảng cáo trả phí', fr: 'Tableau de promotion payant'})}>
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
              {tr(lang, { zh: '付费推广看板', en: 'Paid promotion board', de: 'Werbe-Dashboard', ja: '有料プロモーションダッシュボード', ko: '유료 프로모션 보드', es: 'Panel de promoción de pago', it: 'Pannello promozioni a pagamento', vi: 'Bảng quảng cáo trả phí', fr: 'Tableau de promotion payant'})}
            </h3>
            <p className="merchant-dashboard-section-desc">
              {isPausedCampaign
                ? tr(lang, {
                    zh: `当前渠道：${channelInfo?.zh ?? promo.channel} · 推广已暂停，投放数据停留在暂停时的进度`,
                    en: `Channel: ${channelInfo?.en ?? promo.channel} · Campaign paused; metrics are frozen at the pause point`,
                    es: `Canal: ${channelInfo?.es ?? channelInfo?.en ?? promo.channel} · Campaña pausada; las métricas están congeladas en el punto de pausa`,
                    it: `Canale: ${channelInfo?.it ?? channelInfo?.en ?? promo.channel} · Campagna in pausa; le metriche sono congelate al punto di pausa`, vi: `Kênh: ${channelInfo?.vi ?? channelInfo?.en ?? promo.channel} · Chiến dịch đã tạm dừng; dữ liệu được giữ nguyên tại thời điểm tạm dừng`,
                    de: `Kanal: ${channelInfo?.de ?? promo.channel} · Kampagne pausiert; Daten eingefroren`,
                    ja: `チャネル：${channelInfo?.ja ?? promo.channel} · プロモーションは一時停止中。配信データは停止時点で固定されています`,
                    ko: `현재 채널: ${channelInfo?.ko ?? channelInfo?.en ?? promo.channel} · 프로모션이 일시 중지되었습니다. 데이터는 중지 시점에 고정됩니다`,
                  })
                : tr(lang, {
                    zh: `当前渠道：${channelInfo?.zh ?? promo.channel} · 选择商品、地区与受众后提交，管理员配置并开启后开始智能投放`,
                    en: `Channel: ${channelInfo?.en ?? promo.channel} · Submit target, region and audience, then admin launches the campaign`,
                    es: `Canal: ${channelInfo?.es ?? channelInfo?.en ?? promo.channel} · Envía objetivo, región y audiencia; el administrador activará la campaña`,
                    it: `Canale: ${channelInfo?.it ?? channelInfo?.en ?? promo.channel} · Invia obiettivo, regione e pubblico; l'amministratore avvierà la campagna`, vi: `Kênh: ${channelInfo?.vi ?? channelInfo?.en ?? promo.channel} · Gửi mục tiêu, khu vực và đối tượng, sau đó quản trị viên sẽ kích hoạt chiến dịch`,
                    de: `Kanal: ${channelInfo?.de ?? promo.channel} · Ziel, Region und Zielgruppe einreichen, dann startet der Admin die Kampagne`,
                    ja: `チャネル：${channelInfo?.ja ?? promo.channel} · 商品・地域・オーディエンスを選択して送信後、管理者が設定・開始すると配信が始まります`,
                    ko: `현재 채널: ${channelInfo?.ko ?? channelInfo?.en ?? promo.channel} · 상품, 지역, 타겟 선택 후 제출하면 관리자가 설정·시작합니다`,
                  })}
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
              ? tr(lang, { zh: '推广方案', en: 'Campaign plan', de: 'Werbeplan', ja: 'プロモーション案', ko: '프로모션 플랜', es: 'Plan de campaña', it: 'Piano campagna', vi: 'Kế hoạch quảng cáo', fr: 'Plan de campagne'})
              : tr(lang, { zh: '推广设置', en: 'Campaign setup', de: 'Werbeeinstellungen', ja: 'プロモーション設定', ko: '프로모션 설정', es: 'Configuración de campaña', it: 'Configurazione campagna', vi: 'Thiết lập quảng cáo', fr: 'Configuration de la campagne'})}
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
                      {tr(lang, { zh: '推广单品', en: 'Promoted SKU', de: 'Beworbenes Produkt', ja: 'プロモーション商品', ko: '프로모션 상품', es: 'SKU promocionado', it: 'SKU promosso', vi: 'SKU được quảng cáo', fr: 'SKU promu'})}
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
                    {tr(lang, { zh: '推广目标', en: 'Target', de: 'Ziel', ja: 'プロモーション対象', ko: '프로모션 대상', es: 'Objetivo de promoción', it: 'Obiettivo', vi: 'Mục tiêu', fr: 'Cible'})}
                  </span>
                  <strong>{tr(lang, { zh: '整店推广', en: 'Whole shop', de: 'Gesamter Shop', ja: '店舗全体プロモーション', ko: '전체 매장 프로모션', es: 'Toda la tienda', it: 'Intero negozio', vi: 'Toàn bộ cửa hàng', fr: 'Boutique entière'})}</strong>
                  <span className="merchant-paid-promo-active-summary-sub">
                    {shop?.name || promo.shopId}
                  </span>
                </div>
              )}
              <div className="merchant-paid-promo-confirmed-meta merchant-paid-promo-confirmed-meta--summary">
                <span>
                  {tr(lang, { zh: '地区：', en: 'Region: ', de: 'Region: ', ja: '地域：', ko: '지역: ', es: 'Región: ', it: 'Regione: ', vi: 'Khu vực: ', fr: 'Région:'})}
                  {labelForOption(regionOptions, promo.targetRegion, lang)}
                </span>
                <span>
                  {tr(lang, { zh: '受众：', en: 'Audience: ', de: 'Zielgruppe: ', ja: 'オーディエンス：', ko: '타겟: ', es: 'Audiencia: ', it: 'Pubblico: ', vi: 'Đối tượng: ', fr: 'Public:'})}
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
              {tr(lang, { zh: '推广整店', en: 'Promote shop', de: 'Shop bewerben', ja: '店舗全体をプロモーション', ko: '전체 매장 프로모션', es: 'Toda la tienda', it: 'Promuovi negozio', vi: 'Quảng cáo toàn cửa hàng', fr: 'Promouvoir la boutique'})}
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
              {tr(lang, { zh: '推广单品', en: 'Promote product', de: 'Produkt bewerben', ja: '単品をプロモーション', ko: '프로모션 상품', es: 'SKU promocionado', it: 'Promuovi prodotto', vi: 'Quảng cáo sản phẩm', fr: 'Promouvoir le produit'})}
            </button>
          </div>

          {targetType === 'product' ? (
            <div className="merchant-paid-promo-product-grid">
              {products.length === 0 ? (
                <p className="merchant-paid-promo-empty">
                  {tr(lang, { zh: '暂无在售商品，请先在仓库上架', en: 'No on-sale products. List items in warehouse first.', de: 'Keine aktiven Produkte. Bitte zuerst im Lager einstellen.', ja: '販売中の商品がありません。まず倉庫で出品してください。', ko: '판매 중인 상품이 없습니다. 먼저 창고에서 상품을 등록하세요.', es: 'No hay productos en venta. Publica artículos en el almacén primero.', it: 'Nessun prodotto in vendita. Pubblica prima gli articoli in magazzino.', vi: 'Chưa có sản phẩm đang bán. Hãy đăng sản phẩm trong kho trước.', fr: 'Aucun produit en vente. Répertoriez d\'abord les articles dans l\'entrepôt.' })}
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
                      {shop?.name?.slice(0, 1) || tr(lang, { zh: '店', en: 'S', de: 'S', ja: '店', ko: '매', es: 'T', it: 'N', vi: 'C', fr: 'S'})}
                    </span>
                  )}
                  <div className="merchant-paid-promo-shop-item-copy">
                    <span className="merchant-paid-promo-shop-item-title">{shop?.name || tr(lang, { zh: '我的店铺', en: 'My shop', de: 'Mein Shop', ja: 'マイ店舗', ko: '내 매장', es: 'Mi tienda', it: 'Il mio negozio', vi: 'Cửa hàng của tôi', fr: 'Ma boutique'})}</span>
                    <span className="merchant-paid-promo-shop-item-id">
                      ID · {shop?.id || promo.shopId}
                    </span>
                    <span className="merchant-paid-promo-shop-item-desc">
                      {tr(lang, { zh: '将店铺首页作为付费推广落地页', en: 'Use your shop homepage as the landing page', de: 'Shop-Startseite als Landingpage nutzen', ja: '店舗トップページをランディングページとして使用', ko: '매장 홈페이지를 유료 프로모션 랜딩 페이지로 사용', es: 'Usa la página principal de tu tienda como página de destino', it: 'Usa la homepage del negozio come pagina di destinazione', vi: 'Dùng trang chủ cửa hàng làm trang đích quảng cáo', fr: 'Utilisez la page d\'accueil de votre boutique comme page de destination' })}
                    </span>
                  </div>
                </div>
                <span className="merchant-paid-promo-shop-item-badge">
                  {tr(lang, { zh: '整店推广', en: 'Whole shop', de: 'Gesamter Shop', ja: '店舗全体プロモーション', ko: '전체 매장 프로모션', es: 'Toda la tienda', it: 'Intero negozio', vi: 'Toàn bộ cửa hàng', fr: 'Boutique entière'})}
                </span>
              </button>
            </div>
          )}

          <div className="merchant-paid-promo-select-row merchant-paid-promo-select-row--region">
            <MerchantPaidPromoSelect
              label={tr(lang, { zh: '推广地区', en: 'Target region', de: 'Zielregion', ja: 'プロモーション地域', ko: '프로모션 지역', es: 'Región objetivo', it: 'Regione target', vi: 'Khu vực quảng cáo', fr: 'Région cible'})}
              placeholder={tr(lang, { zh: '请选择地区', en: 'Select region', de: 'Region auswählen', ja: '地域を選択', ko: '지역을 선택하세요', es: 'Seleccionar región', it: 'Seleziona regione', vi: 'Chọn khu vực', fr: 'Sélectionnez une région'})}
              value={targetRegion}
              disabled={formLocked}
              options={regionOptions.map((item) => ({
                value: item.value,
                label: pickLabel(lang, item),
              }))}
              onChange={(value) => {
                markFormDirty()
                setTargetRegion(value)
              }}
            />
          </div>

          <MerchantPaidPromoAudiencePicker
            label={tr(lang, { zh: '受众群体', en: 'Audience', de: 'Zielgruppe', ja: 'ターゲットオーディエンス', ko: '타겟 오디언스', es: 'Audiencia', it: 'Pubblico', vi: 'Đối tượng', fr: 'Public'})}
            hint={
              tr(lang, {
              zh: '可多选；选择「全部受众」时无需再选其他群体',
              en: 'Multi-select supported. Choosing “All audiences” clears other selections.',
              de: 'Mehrfachauswahl möglich. „Alle Zielgruppen" hebt andere Auswahlen auf.',
              ja: '複数選択可能。「すべてのオーディエンス」を選ぶと他の選択は解除されます。',
              ko: '다중 선택 가능. 「전체 오디언스」 선택 시 다른 그룹은 해제됩니다.',
              es: 'Selección múltiple disponible. Al elegir «Todas las audiencias» se deseleccionan las demás.', it: 'Selezione multipla disponibile. Scegliendo «Tutti i pubblici» vengono deselezionati gli altri.', vi: 'Có thể chọn nhiều. Chọn «Tất cả đối tượng» sẽ bỏ chọn các nhóm khác.',
            })
            }
            value={targetAudiences}
            disabled={formLocked}
            options={audienceOptions.map((item) => ({
              value: item.value,
              label: pickLabel(lang, item),
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
              {saving ? tr(lang, { zh: '提交中…', en: 'Submitting…', de: 'Wird eingereicht…', ja: '送信中…', ko: '제출 중…', es: 'Enviando…', it: 'Invio in corso…', vi: 'Đang gửi…', fr: 'Soumission…'}) : tr(lang, { zh: '确认推广', en: 'Confirm promotion', de: 'Werbung bestätigen', ja: 'プロモーションを確定', ko: '프로모션 확정', es: 'Confirmar promoción', it: 'Conferma promozione', vi: 'Xác nhận quảng cáo'})}
            </button>
          ) : null}

          {promo.status === 'awaiting_launch' ? (
            <div className="merchant-paid-promo-status-banner merchant-paid-promo-status-banner--waiting">
              {tr(lang, {
                zh: '推广方案已提交，等待管理员配置投放参数并开启推广。',
                en: 'Promotion submitted. Waiting for admin to configure and launch.',
                de: 'Werbeplan eingereicht. Warten auf Admin-Konfiguration und Freigabe.',
                ja: 'プロモーション案を送信しました。管理者による配信設定・開始をお待ちください。',
                ko: '프로모션 플랜이 제출되었습니다. 관리자가 캠페인 설정 및 시작을 진행합니다.',
                es: 'Promoción enviada. En espera de que el administrador configure y active la campaña.', it: 'Promozione inviata. In attesa che l\'amministratore configuri e avvii la campagna.', vi: 'Đã gửi quảng cáo. Đang chờ quản trị viên cấu hình và kích hoạt.',
              })}
            </div>
          ) : null}

          {isPausedCampaign ? (
            <div className="merchant-paid-promo-status-banner merchant-paid-promo-status-banner--paused">
              {tr(lang, {
                zh: '推广已由管理员暂停，当前投放数据停留在暂停进度，恢复后将继续释放剩余数据。',
                en: 'This campaign is paused by admin. Metrics stay at the pause point and will resume when reactivated.',
                de: 'Kampagne vom Admin pausiert. Daten bleiben eingefroren und werden bei Reaktivierung fortgesetzt.',
                ja: '管理者によりプロモーションが一時停止されました。配信データは停止時点で固定され、再開後に残りのデータが反映されます。',
                ko: '관리자에 의해 프로모션이 일시 중지되었습니다. 데이터는 중지 시점에 고정되며 재개 후 남은 데이터가 반영됩니다.',
                es: 'El administrador ha pausado la campaña. Las métricas permanecen en el punto de pausa y se reanudarán al reactivarla.', it: 'L\'amministratore ha messo in pausa la campagna. Le metriche restano al punto di pausa e riprenderanno alla riattivazione.', vi: 'Quản trị viên đã tạm dừng chiến dịch. Dữ liệu giữ nguyên tại thời điểm tạm dừng và sẽ tiếp tục khi được kích hoạt lại.',
              })}
            </div>
          ) : null}

          {targetSelected && formLocked && !showActiveSummary ? (
            <div className="merchant-paid-promo-confirmed-meta">
              <span>
                {tr(lang, { zh: '地区：', en: 'Region: ', de: 'Region: ', ja: '地域：', ko: '지역: ', es: 'Región: ', it: 'Regione: ', vi: 'Khu vực: ', fr: 'Région:'})}
                {labelForOption(regionOptions, promo.targetRegion, lang)}
              </span>
              <span>
                {tr(lang, { zh: '受众：', en: 'Audience: ', de: 'Zielgruppe: ', ja: 'オーディエンス：', ko: '타겟: ', es: 'Audiencia: ', it: 'Pubblico: ', vi: 'Đối tượng: ', fr: 'Public:'})}
                {labelsForAudiences(audienceOptions, promo.targetAudience, lang)}
              </span>
            </div>
          ) : null}
            </>
          )}
        </div>

        {showCampaignMetrics && metrics ? (
          <div className={`merchant-paid-promo-metrics-card${isPausedCampaign ? ' merchant-paid-promo-metrics-card--paused' : ''}`}>
            <div className="merchant-paid-promo-metrics-head">
              <h4 className="merchant-paid-promo-card-title">
                {isPausedCampaign
                  ? tr(lang, { zh: '推广投放数据（已暂停）', en: 'Campaign performance (paused)', de: 'Kampagnendaten (pausiert)', ja: '配信データ（一時停止中）', ko: '캠페인 성과 (일시 중지)', es: 'Rendimiento de campaña (pausada)', it: 'Prestazioni campagna (in pausa)', vi: 'Dữ liệu quảng cáo (đã tạm dừng)', fr: 'Performances de la campagne (en veille)'})
                  : tr(lang, { zh: '推广投放数据', en: 'Campaign performance', de: 'Kampagnendaten', ja: '配信データ', ko: '캠페인 성과', es: 'Rendimiento de campaña', it: 'Prestazioni campagna', vi: 'Dữ liệu quảng cáo', fr: 'Performances de la campagne'})}
              </h4>
              {promo.targetType === 'product' ? (
                <span
                  className="merchant-paid-promo-metrics-target"
                  title={promo.targetProductTitle ?? undefined}
                >
                  {tr(lang, { zh: '主推：单品 · ID ', en: 'Focus: SKU · ', de: 'Fokus: Produkt · ', ja: 'メイン：単品 · ID ', ko: '메인: 단일 상품 · ID ', es: 'Enfoque: SKU · ', it: 'Focus: SKU · ', vi: 'Trọng tâm: SKU · ', fr: 'Focus : SKU ·'})}
                  {warehouseProductId(promo)}
                </span>
              ) : (
                <span className="merchant-paid-promo-metrics-target">
                  {tr(lang, { zh: '主推：整店推广', en: 'Focus: whole shop', de: 'Fokus: Gesamter Shop', ja: 'メイン：店舗全体プロモーション', ko: '메인: 전체 매장 프로모션', es: 'Enfoque: toda la tienda', it: 'Focus: intero negozio', vi: 'Trọng tâm: toàn cửa hàng', fr: 'Focus : toute la boutique'})}
                </span>
              )}
            </div>

            <div className="merchant-paid-promo-progress-row">
              <div className="merchant-paid-promo-progress-copy">
                <span>{tr(lang, { zh: '预算消耗进度', en: 'Budget consumption', de: 'Budgetverbrauch', ja: '予算消化率', ko: '예산 소진률', es: 'Consumo de presupuesto', it: 'Consumo del budget', vi: 'Tiến độ tiêu ngân sách', fr: 'Consommation budgétaire'})}</span>
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
                <span className="merchant-paid-promo-metric-label">{tr(lang, { zh: '曝光', en: 'Impressions', de: 'Impressionen', ja: 'インプレッション', ko: '노출', es: 'Impresiones', it: 'Impressioni', vi: 'Lượt hiển thị', fr: 'Impressions'})}</span>
              </div>
              <div className="merchant-paid-promo-metric">
                <span className="merchant-paid-promo-metric-value">{metrics.totals.clicks.toLocaleString()}</span>
                <span className="merchant-paid-promo-metric-label">{tr(lang, { zh: '点击', en: 'Clicks', de: 'Klicks', ja: 'クリック', ko: '클릭', es: 'Clics', it: 'Clic', vi: 'Lượt nhấp', fr: 'Clics'})}</span>
              </div>
              <div className="merchant-paid-promo-metric">
                <span className="merchant-paid-promo-metric-value">{metrics.totals.visits.toLocaleString()}</span>
                <span className="merchant-paid-promo-metric-label">{tr(lang, { zh: '进店', en: 'Visits', de: 'Besuche', ja: '来店', ko: '방문', es: 'Visitas', it: 'Visite', vi: 'Lượt vào cửa hàng', fr: 'Visites'})}</span>
              </div>
              <div className="merchant-paid-promo-metric">
                <span className="merchant-paid-promo-metric-value">${metrics.totals.spend.toFixed(2)}</span>
                <span className="merchant-paid-promo-metric-label">{tr(lang, { zh: '消耗', en: 'Spend', de: 'Ausgaben', ja: '消化額', ko: '소진액', es: 'Gasto', it: 'Spesa', vi: 'Chi phí', fr: 'Dépenser'})}</span>
              </div>
              <div className="merchant-paid-promo-metric">
                <span className="merchant-paid-promo-metric-value">${metrics.totals.revenue.toFixed(2)}</span>
                <span className="merchant-paid-promo-metric-label">{tr(lang, { zh: '成交额', en: 'Revenue', de: 'Umsatz', ja: '売上高', ko: '거래액', es: 'Ingresos', it: 'Ricavi', vi: 'Doanh thu', fr: 'Revenu'})}</span>
              </div>
            </div>

            <div className="merchant-paid-promo-sparkline-row">
              <div className="merchant-paid-promo-sparkline-copy">
                <span className="merchant-paid-promo-sparkline-label">{tr(lang, { zh: '进店趋势', en: 'Visit trend', de: 'Besuchstrend', ja: '来店トレンド', ko: '방문 추이', es: 'Tendencia de visitas', it: 'Andamento visite', vi: 'Xu hướng lượt vào cửa hàng', fr: 'Tendance des visites'})}</span>
                <span className="merchant-paid-promo-sparkline-sub">
                  {tr(lang, { zh: `点击率 ${clickRate}%`, en: `CTR ${clickRate}%`, de: `CTR ${clickRate}%`, ja: `CTR ${clickRate}%`, ko: `CTR ${clickRate}%`, es: `CTR ${clickRate}%`, it: `CTR ${clickRate}%`, vi: `CTR ${clickRate}%` })}
                </span>
              </div>
              <MiniSparkline data={visitSeries.length > 0 ? visitSeries : [0, 0, 0, 0, 0, 0, 0]} color="#5b6cff" />
            </div>
            <p className="merchant-paid-promo-sync-hint">
              {isPausedCampaign
                ? tr(lang, {
                  zh: '暂停期间进店数据不再增长，管理员恢复投放后会继续计入店铺访客。',
                  en: 'Visit totals stay frozen while paused and resume syncing after the campaign is reactivated.',
                  de: 'Besuche bleiben während der Pause eingefroren und werden nach Reaktivierung fortgesetzt.',
                  ja: '一時停止中は来店データは増加しません。再開後、店舗訪問者数に反映されます。',
                  ko: '일시 중지 중에는 방문 데이터가 증가하지 않습니다. 재개 후 매장 방문자 수에 반영됩니다.',
                  es: 'Las visitas permanecen congeladas durante la pausa y se reanudan al reactivar la campaña.', it: 'Le visite restano congelate durante la pausa e riprendono alla riattivazione della campagna.', vi: 'Lượt vào cửa hàng không tăng khi tạm dừng và sẽ tiếp tục đồng bộ sau khi chiến dịch được kích hoạt lại.',
                })
                : tr(lang, {
                  zh: '投放进店会按时间段实时计入店铺访客量，仪表盘访客趋势将同步增长。',
                  en: 'Promoted store visits are added to shop visitor totals over time and reflected on your dashboard.',
                  de: 'Werbebesuche werden fortlaufend zu den Shop-Besuchern gezählt und im Dashboard angezeigt.',
                  ja: 'プロモーション経由の来店はリアルタイムで店舗訪問者数に加算され、ダッシュボードのトレンドに反映されます。',
                  ko: '프로모션 방문은 실시간으로 매장 방문자 수에 반영되며 대시보드 추이에 동기화됩니다.',
                  es: 'Las visitas promocionadas se suman al total de visitantes de la tienda y se reflejan en tu panel.', it: 'Le visite promosse vengono aggiunte ai visitatori del negozio e si riflettono sulla dashboard.', vi: 'Lượt vào cửa hàng từ quảng cáo được cộng dần vào tổng khách truy cập và phản ánh trên bảng điều khiển.',
                })}
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
                    {tr(lang, { zh: '投放预览', en: 'Campaign preview', de: 'Kampagnenvorschau', ja: '配信プレビュー', ko: '캠페인 미리보기', es: 'Vista previa de campaña', it: 'Anteprima campagna', vi: 'Xem trước chiến dịch', fr: 'Aperçu de la campagne'})}
                  </p>
                  <h4 className="merchant-paid-promo-preview-title">
                    {channelInfo ? pickBilingual(lang, channelInfo) : promo.channel}
                    {tr(lang, { zh: ' 付费推广', en: ' paid ads', de: ' bezahlte Werbung', ja: ' 有料プロモーション', ko: ' 유료 프로모션', es: ' publicidad de pago', it: ' pubblicità a pagamento', vi: ' quảng cáo trả phí', fr: 'annonces payantes'})}
                  </h4>
                </div>
              </div>
              <span className="merchant-paid-promo-preview-status">
                {tr(lang, { zh: '待配置', en: 'Draft', de: 'Entwurf', ja: '下書き', ko: '설정 대기', es: 'Borrador', it: 'Bozza', vi: 'Bản nháp', fr: 'Brouillon'})}
              </span>
            </div>

            <ol className="merchant-paid-promo-preview-steps">
              <li className={`merchant-paid-promo-preview-step${targetReady ? ' merchant-paid-promo-preview-step--done' : ' merchant-paid-promo-preview-step--active'}`}>
                <span className="merchant-paid-promo-preview-step-index">1</span>
                <div>
                  <strong>{tr(lang, { zh: '推广目标', en: 'Promotion target', de: 'Werbeziel', ja: 'プロモーション対象', ko: '프로모션 대상', es: 'Objetivo de promoción', it: 'Obiettivo promozione', vi: 'Mục tiêu quảng cáo', fr: 'Objectif de promotion'})}</strong>
                  <p
                    className="merchant-paid-promo-preview-step-value"
                    title={
                      targetType === 'product' && selectedProduct
                        ? selectedProduct.title
                        : undefined
                    }
                  >
                    {targetType === 'shop'
                      ? tr(lang, {
                        zh: `整店 · ${shop?.name || promo.shopId}`,
                        en: `Shop · ${shop?.name || promo.shopId}`,
                        de: `Shop · ${shop?.name || promo.shopId}`,
                        ja: `店舗 · ${shop?.name || promo.shopId}`,
                        ko: `매장 · ${shop?.name || promo.shopId}`,
                        es: `Tienda · ${shop?.name || promo.shopId}`,
                        it: `Negozio · ${shop?.name || promo.shopId}`, vi: `Cửa hàng · ${shop?.name || promo.shopId}`,
                      })
                      : selectedProduct
                        ? selectedProduct.title
                        : tr(lang, {
                          zh: '请从左侧选择要推广的商品',
                          en: 'Select a product on the left',
                          de: 'Bitte links ein Produkt auswählen',
                          ja: '左側からプロモーションする商品を選択してください',
                          ko: '왼쪽에서 프로모션할 상품을 선택하세요',
                          es: 'Selecciona un producto a la izquierda', it: 'Seleziona un prodotto a sinistra', vi: 'Chọn sản phẩm ở bên trái',
                        })}
                  </p>
                </div>
              </li>
              <li className={`merchant-paid-promo-preview-step${audienceReady ? ' merchant-paid-promo-preview-step--done' : targetReady ? ' merchant-paid-promo-preview-step--active' : ''}`}>
                <span className="merchant-paid-promo-preview-step-index">2</span>
                <div>
                  <strong>{tr(lang, { zh: '地区与受众', en: 'Region & audience', de: 'Region & Zielgruppe', ja: '地域とオーディエンス', ko: '지역 및 타겟', es: 'Región y audiencia', it: 'Regione e pubblico', vi: 'Khu vực và đối tượng', fr: 'Région et public'})}</strong>
                  <p>
                    {audienceReady
                      ? `${labelForOption(regionOptions, targetRegion, lang)} · ${labelsForAudiences(audienceOptions, serializeAudienceValues(targetAudiences), lang)}`
                      : tr(lang, {
                        zh: '选择投放地区与目标人群',
                        en: 'Choose region and audience segment',
                        de: 'Region und Zielgruppe auswählen',
                        ja: '配信地域とターゲット層を選択',
                        ko: '배포 지역과 타겟층을 선택하세요',
                        es: 'Elige región y segmento de audiencia', it: 'Scegli regione e segmento di pubblico', vi: 'Chọn khu vực và phân khúc đối tượng',
                      })}
                  </p>
                </div>
              </li>
              <li className={`merchant-paid-promo-preview-step${targetReady && audienceReady ? ' merchant-paid-promo-preview-step--active' : ''}`}>
                <span className="merchant-paid-promo-preview-step-index">3</span>
                <div>
                  <strong>{tr(lang, { zh: '提交开启', en: 'Submit for launch', de: 'Zur Freigabe einreichen', ja: '開始申請', ko: '시작 신청', es: 'Enviar para activación', it: 'Invia per attivazione', vi: 'Gửi để kích hoạt', fr: 'Soumettre pour le lancement'})}</strong>
                  <p>
                    {tr(lang, {
                      zh: '确认后由管理员配置预算并开启智能投放',
                      en: 'Admin configures budget and launches smart delivery',
                      de: 'Nach Bestätigung konfiguriert der Admin Budget und startet die Kampagne',
                      ja: '確定後、管理者が予算を設定しスマート配信を開始します',
                      ko: '확정 후 관리자가 예산을 설정하고 스마트 배포를 시작합니다',
                      es: 'Tras confirmar, el administrador configura el presupuesto y activa la entrega inteligente', it: 'L\'amministratore configura il budget e avvia la distribuzione intelligente', vi: 'Quản trị viên cấu hình ngân sách và bật phân phối thông minh',
                    })}
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
                      {shop?.name?.slice(0, 1) || tr(lang, { zh: '店', en: 'S', de: 'S', ja: '店', ko: '매', es: 'T', it: 'N', vi: 'C', fr: 'S'})}
                    </span>
                  )}
                  <div>
                    <span className="merchant-paid-promo-preview-target-label">{tr(lang, { zh: '落地页', en: 'Landing', de: 'Landingpage', ja: 'ランディングページ', ko: '랜딩 페이지', es: 'Destino', it: 'Destinazione', vi: 'Trang đích', fr: 'Atterrissage'})}</span>
                    <strong>{shop?.name || tr(lang, { zh: '店铺首页', en: 'Shop homepage', de: 'Shop-Startseite', ja: '店舗トップページ', ko: '매장 홈페이지', es: 'Página principal de la tienda', it: 'Homepage del negozio', vi: 'Trang chủ cửa hàng', fr: 'Page d\'accueil de la boutique'})}</strong>
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
                    <span className="merchant-paid-promo-preview-target-label">{tr(lang, { zh: '主推商品', en: 'Featured SKU', de: 'Hauptprodukt', ja: 'メイン商品', ko: '메인 상품', es: 'SKU destacado', it: 'SKU in evidenza', vi: 'Sản phẩm trọng tâm', fr: 'UGS en vedette'})}</span>
                    <strong className="merchant-paid-promo-preview-target-name" title={selectedProduct.title}>
                      {selectedProduct.title}
                    </strong>
                    <span className="merchant-paid-promo-preview-target-sub">${selectedProduct.price.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="merchant-paid-promo-preview-target-empty">
                  <span>{tr(lang, { zh: '选择商品后将在此预览推广落地页', en: 'Product preview appears after selection', de: 'Produktvorschau erscheint nach Auswahl', ja: '商品選択後、ここにランディングページのプレビューが表示されます', ko: '상품 선택 후 여기에 랜딩 페이지 미리보기가 표시됩니다', es: 'La vista previa del producto aparece tras la selección', it: 'L\'anteprima del prodotto compare dopo la selezione', vi: 'Xem trước sản phẩm sẽ hiển thị sau khi chọn', fr: 'L\'aperçu du produit apparaît après la sélection' })}</span>
                </div>
              )}
            </div>

            <div className="merchant-paid-promo-preview-metrics">
              <div className="merchant-paid-promo-preview-metric merchant-paid-promo-preview-metric--ghost">
                <span>—</span>
                <small>{tr(lang, { zh: '曝光', en: 'Impressions', de: 'Impressionen', ja: 'インプレッション', ko: '노출', es: 'Impresiones', it: 'Impressioni', vi: 'Lượt hiển thị', fr: 'Impressions'})}</small>
              </div>
              <div className="merchant-paid-promo-preview-metric merchant-paid-promo-preview-metric--ghost">
                <span>—</span>
                <small>{tr(lang, { zh: '点击', en: 'Clicks', de: 'Klicks', ja: 'クリック', ko: '클릭', es: 'Clics', it: 'Clic', vi: 'Lượt nhấp', fr: 'Clics'})}</small>
              </div>
              <div className="merchant-paid-promo-preview-metric merchant-paid-promo-preview-metric--ghost">
                <span>—</span>
                <small>{tr(lang, { zh: '进店', en: 'Visits', de: 'Besuche', ja: '来店', ko: '방문', es: 'Visitas', it: 'Visite', vi: 'Lượt vào cửa hàng', fr: 'Visites'})}</small>
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
                  <p className="merchant-paid-promo-preview-kicker">{tr(lang, { zh: '方案已提交', en: 'Submitted', de: 'Eingereicht', ja: '送信済み', ko: '제출 완료', es: 'Enviada', it: 'Inviata', vi: 'Đã gửi', fr: 'Soumis'})}</p>
                  <h4 className="merchant-paid-promo-preview-title">
                    {tr(lang, { zh: '等待管理员开启', en: 'Awaiting admin launch', de: 'Warten auf Admin-Freigabe', ja: '管理者による開始待ち', ko: '관리자 시작 대기', es: 'En espera de activación por el administrador', it: 'In attesa di attivazione da parte dell\'amministratore', vi: 'Chờ quản trị viên kích hoạt', fr: 'En attente du lancement de l\'administrateur'})}
                  </h4>
                </div>
              </div>
              <span className="merchant-paid-promo-preview-status merchant-paid-promo-preview-status--waiting">
                {tr(lang, { zh: '审核中', en: 'In review', de: 'In Prüfung', ja: '審査中', ko: '심사 중', es: 'En revisión', it: 'In revisione', vi: 'Đang xem xét', fr: 'En revue'})}
              </span>
            </div>
            <ul className="merchant-paid-promo-preview-checklist">
              <li>{tr(lang, { zh: '推广目标已确认', en: 'Target confirmed', de: 'Ziel bestätigt', ja: 'プロモーション対象を確認済み', ko: '프로모션 대상 확인 완료', es: 'Objetivo confirmado', it: 'Obiettivo confermato', vi: 'Đã xác nhận mục tiêu', fr: 'Cible confirmée' })}</li>
              <li>{tr(lang, { zh: '地区与受众已锁定', en: 'Region and audience locked', de: 'Region und Zielgruppe gesperrt', ja: '地域とオーディエンスを確定済み', ko: '지역 및 타겟 확정 완료', es: 'Región y audiencia bloqueadas', it: 'Regione e pubblico bloccati', vi: 'Đã khóa khu vực và đối tượng', fr: 'Région et audience verrouillées' })}</li>
              <li>{tr(lang, { zh: '管理员配置投放参数中', en: 'Admin configuring campaign settings', de: 'Admin konfiguriert Kampagneneinstellungen', ja: '管理者が配信パラメータを設定中', ko: '관리자가 캠페인 설정 중', es: 'El administrador configura los parámetros de la campaña', it: 'L\'amministratore sta configurando i parametri della campagna', vi: 'Quản trị viên đang cấu hình tham số chiến dịch', fr: 'Administrateur configurant les paramètres de la campagne' })}</li>
            </ul>
            <p className="merchant-paid-promo-preview-footnote">
              {tr(lang, {
                zh: '开启后将展示曝光、点击、进店等实时数据。',
                en: 'Live impressions, clicks and visits will appear after launch.',
                de: 'Nach Start werden Impressionen, Klicks und Besuche live angezeigt.',
                ja: '開始後、インプレッション・クリック・来店などのリアルタイムデータが表示されます。',
                ko: '시작 후 노출, 클릭, 방문 등 실시간 데이터가 표시됩니다.',
                es: 'Tras la activación se mostrarán impresiones, clics y visitas en tiempo real.', it: 'Dopo l\'avvio compariranno impressioni, clic e visite in tempo reale.', vi: 'Sau khi kích hoạt sẽ hiển thị lượt hiển thị, nhấp và vào cửa hàng theo thời gian thực.',
              })}
            </p>
          </div>
        ) : null}
      </div>

      {historySection}
    </section>
    {historyDetailModal}
    </>
  )
}

export default MerchantPaidPromotionBoard
