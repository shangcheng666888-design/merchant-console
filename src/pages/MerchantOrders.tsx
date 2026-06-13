import React, { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api/client'
import { useToast } from '../components/ToastProvider'
import { useLang } from '../context/LangContext'
import { tr, pickBilingual, type Lang } from '../i18n'
import { useMerchantSync } from '../hooks/useMerchantSync'
import MerchantDashboardInsight from '../components/MerchantDashboardInsight'
import MerchantOrderStatusTabIcon, {
  type MerchantOrderTabStatus,
} from '../components/MerchantOrderStatusTabIcon'
import ordersHeaderIcon from '../assets/dianpudingdan.png'
import ordersTotalIcon from '../assets/zongdingdan.png'
import ordersPendingIcon from '../assets/daifahuo.png'
import ordersTransitIcon from '../assets/jinridingdan.png'
import { formatDateTime } from '../utils/datetime'

type OrderStatus =
  | 'all'
  | 'pending_pay'
  | 'paid'   // 店铺待支付（客户已付，店铺未发货结算）
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'return_pending'
  | 'returned'
  | 'refund_pending'
  | 'refunded'
  | 'cancelled'

const STATUS_TABS: MerchantOrderTabStatus[] = [
  'all',
  'paid',
  'shipped',
  'in_transit',
  'delivered',
  'completed',
  'return_pending',
  'returned',
  'refund_pending',
  'refunded',
  'cancelled',
]

const STATUS_LABEL_MAP: Record<OrderStatus, { zh: string; en: string; de: string; ja: string; ko: string; es: string; it: string; vi: string }> = {
  all: { zh: '全部', en: 'All', de: 'Alle', ja: 'すべて', ko: '전체', es: 'Todos', it: 'Tutti', vi: 'Tất cả' },
  pending_pay: { zh: '待付款', en: 'Awaiting payment', de: 'Zahlung ausstehend', ja: '支払い待ち', ko: '결제 대기', es: 'Pago pendiente', it: 'In attesa di pagamento', vi: 'Chờ thanh toán' },
  paid: { zh: '待支付', en: 'To ship', de: 'Zu versenden', ja: '発送待ち', ko: '발송 대기', es: 'Por enviar', it: 'Da spedire', vi: 'Chờ giao' },
  shipped: { zh: '正在出库', en: 'Preparing shipment', de: 'Versandvorbereitung', ja: '出荷準備中', ko: '출고 준비 중', es: 'Preparando envío', it: 'Preparazione spedizione', vi: 'Đang chuẩn bị giao hàng' },
  in_transit: { zh: '正在配送', en: 'In transit', de: 'Unterwegs', ja: '配送中', ko: '배송 중', es: 'En tránsito', it: 'In consegna', vi: 'Đang giao' },
  delivered: { zh: '已签收', en: 'Delivered', de: 'Zugestellt', ja: '配達完了', ko: '배송 완료', es: 'Entregado', it: 'Consegnato', vi: 'Đã giao' },
  completed: { zh: '订单完成', en: 'Completed', de: 'Abgeschlossen', ja: '注文完了', ko: '주문 완료', es: 'Completado', it: 'Completato', vi: 'Hoàn tất' },
  return_pending: { zh: '申请退货', en: 'Return requested', de: 'Rückgabe beantragt', ja: '返品申請中', ko: '반품 신청', es: 'Devolución solicitada', it: 'Reso richiesto', vi: 'Yêu cầu trả hàng' },
  returned: { zh: '已退货', en: 'Returned', de: 'Zurückgegeben', ja: '返品済み', ko: '반품 완료', es: 'Devuelto', it: 'Reso effettuato', vi: 'Đã trả hàng' },
  refund_pending: { zh: '正在退款', en: 'Refund in progress', de: 'Erstattung läuft', ja: '返金処理中', ko: '환불 처리 중', es: 'Reembolso en proceso', it: 'Rimborso in corso', vi: 'Đang hoàn tiền' },
  refunded: { zh: '已退款', en: 'Refunded', de: 'Erstattet', ja: '返金済み', ko: '환불 완료', es: 'Reembolsado', it: 'Rimborsato', vi: 'Đã hoàn tiền' },
  cancelled: { zh: '已取消', en: 'Cancelled', de: 'Storniert', ja: 'キャンセル済み', ko: '취소됨', es: 'Cancelado', it: 'Annullato', vi: 'Đã hủy' },
}

function getStatusTabLabel(status: OrderStatus, lang: Lang): string {
  const entry = STATUS_LABEL_MAP[status]
  if (!entry) return status
  return pickBilingual(lang, entry)
}

function getStatusLabel(status: Exclude<OrderStatus, 'all'>, lang: Lang): string {
  const entry = STATUS_LABEL_MAP[status]
  if (!entry) return status
  return pickBilingual(lang, entry)
}

/** 后端订单状态 -> 店铺后台 Tab 状态 */
const API_STATUS_TO_TAB: Record<string, Exclude<OrderStatus, 'all'>> = {
  pending: 'pending_pay',
  paid: 'paid',
  shipped: 'shipped',
  in_transit: 'in_transit',
  delivered: 'delivered',
  completed: 'completed',
  return_pending: 'return_pending',
  returned: 'returned',
  refund_pending: 'refund_pending',
  refunded: 'refunded',
  cancelled: 'cancelled',
}

interface OrderItem {
  id: string
  orderNo: string
  createdAt: string
  buyer: string
  productCodes: string
  amount: number
  /** 采购总价（店铺成本），来自后端计算字段 */
  procurementTotal: number
  status: Exclude<OrderStatus, 'all'>
  firstProductTitle: string
  firstProductImage?: string
  totalItems: number
}

interface OrderDetailProduct {
  sku: string
  /** 规格明文，如「黑色 / L码」，无则显示「规格」不显示 UUID */
  specDisplay: string
  name: string
  qty: number
  price: number
  image?: string
}

interface OrderDetail extends OrderItem {
  products: OrderDetailProduct[]
  address: string
  trackingNo?: string
}

function getAuthShopId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return null
    const shopId = (JSON.parse(raw) as { shopId?: string | null })?.shopId
    if (typeof shopId !== 'string') return null
    const trimmed = shopId.trim()
    return trimmed ? trimmed : null
  } catch {
    return null
  }
}

interface ApiOrder {
  id: string
  orderNumber: string
  shopId: string
  userId: string
  amount: number
  procurementTotal?: number
  status: string
  trackingNo?: string
  items: Array<{ id: string; productId?: string; title: string; price: number; quantity: number; image?: string; spec?: string }>
  address: {
    recipient?: string
    email?: string
    phoneCode?: string
    phone?: string
    country?: string
    province?: string
    city?: string
    postal?: string
    detail?: string
  }
  createdAt: string
}

// 简单的内存 + 本地缓存：用于页面切换或刷新时保留上一次的订单列表，避免白屏
const ORDERS_CACHE_KEY_PREFIX = 'merchantOrders:'
let cachedApiOrders: ApiOrder[] | null = null
let cachedBuyerAccounts: Record<string, string> | null = null

if (typeof window !== 'undefined') {
  const initialShopId = getAuthShopId()
  if (initialShopId) {
    try {
      const raw = window.localStorage.getItem(`${ORDERS_CACHE_KEY_PREFIX}${initialShopId}`)
      if (raw) {
        const parsed = JSON.parse(raw) as ApiOrder[]
        if (Array.isArray(parsed)) {
          cachedApiOrders = parsed
        }
      }
    } catch {
      // ignore cache error
    }
  }
}

function formatOrderAddress(addr: ApiOrder['address'], lang: Lang): string {
  if (!addr) return '—'
  const parts: string[] = []
  const labelMaps = {
    recipient: { zh: '收件人：', en: 'Recipient: ', de: 'Empfänger: ' , ja: '受取人：', ko: '수령인: ', es: 'Destinatario: ', it: 'Destinatario: ', vi: 'Người nhận: ' },
    phone: { zh: '电话：', en: 'Phone: ', de: 'Telefon: ' , ja: '電話：', ko: '전화: ', es: 'Teléfono: ', it: 'Telefono: ', vi: 'Điện thoại: ' },
    email: { zh: '邮箱：', en: 'Email: ', de: 'E-Mail: ' , ja: 'メール：', ko: '이메일: ', es: 'Correo: ', it: 'Email: ', vi: 'Email: ' },
    region: { zh: '地区：', en: 'Region: ', de: 'Region: ' , ja: '地域：', ko: '지역: ', es: 'Región: ', it: 'Regione: ', vi: 'Khu vực: ' },
    postal: { zh: '邮编：', en: 'Postal code: ', de: 'PLZ: ' , ja: '郵便番号：', ko: '우편번호: ', es: 'Código postal: ', it: 'CAP: ', vi: 'Mã bưu điện: ' },
    detail: { zh: '详细地址：', en: 'Address: ', de: 'Adresse: ' , ja: '詳細住所：', ko: '상세 주소: ', es: 'Dirección: ', it: 'Indirizzo: ', vi: 'Địa chỉ: ' },
  }
  const label = (key: keyof typeof labelMaps) => pickBilingual(lang, labelMaps[key])
  // 店铺侧隐私规则：只展示收件人姓名与国家/省份/城市，其余字段统一做掩码处理
  if (addr.recipient) parts.push(`${label('recipient')}${addr.recipient}`)
  const region = [addr.country, addr.province, addr.city].filter(Boolean).join(' ')
  if (region) parts.push(`${label('region')}${region}`)
  if (addr.phone || addr.phoneCode) {
    parts.push(`${label('phone')}******`)
  }
  if (addr.email) {
    parts.push(`${label('email')}***`)
  }
  if (addr.postal) {
    parts.push(`${label('postal')}***`)
  }
  if (addr.detail) {
    parts.push(`${label('detail')}***`)
  }
  return parts.join('  ')
}

/** 统一规格文案：无规格或占位内容时不显示，只保留真正的颜色/尺码等文字 */
function normalizeSpecDisplay(raw: string | null | undefined): string {
  if (!raw) return '—'
  const s = String(raw).trim()
  if (!s) return '—'
  if (s === '规格') return '—'
  return s
}

/** 缩短商品名，超出部分用省略号 */
function truncateProductName(name: string, maxLen: number = 16): string {
  const s = typeof name === 'string' ? name.trim() : ''
  if (!s) return '—'
  if (s.length <= maxLen) return s
  return s.slice(0, maxLen) + '…'
}

function calcOrderProfit(amount: number, procurementTotal: number): { profit: number; ratio: number } {
  const profit = Math.round((amount - procurementTotal) * 100) / 100
  const ratio =
    procurementTotal > 0 ? Math.round((profit / procurementTotal) * 1000) / 10 : 0
  return { profit, ratio }
}

const ORDER_SKELETON_COUNT = 4

const OrderCardSkeleton: React.FC = () => (
  <article className="merchant-orders-card merchant-orders-card--v2 merchant-orders-card--skeleton" aria-hidden="true">
    <div className="merchant-orders-card-top">
      <div className="merchant-orders-card-top-left">
        <span className="mc-skeleton merchant-orders-skeleton-chip" />
        <span className="mc-skeleton merchant-orders-skeleton-order-no" />
      </div>
      <span className="mc-skeleton merchant-orders-skeleton-status" />
    </div>
    <div className="merchant-orders-card-main">
      <div className="merchant-orders-card-product">
        <span className="mc-skeleton merchant-orders-skeleton-thumb" />
        <div className="merchant-orders-card-product-body">
          <span className="mc-skeleton merchant-orders-skeleton-title" />
          <span className="mc-skeleton merchant-orders-skeleton-title merchant-orders-skeleton-title--short" />
          <div className="merchant-orders-card-meta-row">
            <span className="mc-skeleton merchant-orders-skeleton-chip-row" />
            <span className="mc-skeleton merchant-orders-skeleton-chip-row" />
          </div>
        </div>
      </div>
    </div>
    <div className="merchant-orders-card-bar">
      <div className="merchant-orders-card-pricing merchant-orders-card-pricing--skeleton">
        <span className="mc-skeleton merchant-orders-skeleton-price" />
        <span className="mc-skeleton merchant-orders-skeleton-price" />
        <span className="mc-skeleton merchant-orders-skeleton-price" />
      </div>
      <div className="merchant-orders-card-actions">
        <span className="mc-skeleton merchant-orders-skeleton-btn" />
        <span className="mc-skeleton merchant-orders-skeleton-btn merchant-orders-skeleton-btn--primary" />
      </div>
    </div>
  </article>
)

function maskAccount(account: string): string {
  const trimmed = account.trim()
  if (!trimmed) return '—'
  if (trimmed.includes('@')) {
    const [name, domain] = trimmed.split('@')
    if (name.length <= 2) return `${name[0] ?? ''}***@${domain}`
    return `${name[0]}***${name[name.length - 1]}@${domain}`
  }
  if (/^\d{6,}$/.test(trimmed)) {
    return `${trimmed.slice(0, 3)}****${trimmed.slice(-3)}`
  }
  if (trimmed.length <= 2) return `${trimmed[0] ?? ''}*`
  return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`
}

const MerchantOrders: React.FC = () => {
  const { lang } = useLang()
  const [activeStatus, setActiveStatus] = useState<OrderStatus>('all')
  const [orderNoSearch, setOrderNoSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detailOrder, setDetailOrder] = useState<OrderItem | null>(null)
  // 结算弹窗使用独立的选中订单，避免触发详情抽屉
  const [settleOrder, setSettleOrder] = useState<OrderItem | null>(null)
  const [apiOrders, setApiOrders] = useState<ApiOrder[]>(cachedApiOrders ?? [])
  const [loading, setLoading] = useState(!cachedApiOrders)
  const [refreshing, setRefreshing] = useState(false)
  const [shipModalOpen, setShipModalOpen] = useState(false)
  const [shipSubmitting, setShipSubmitting] = useState(false)
  const [settlePreview, setSettlePreview] = useState<{
    orderAmount: number
    procurementTotal: number
    walletBalance: number
  } | null>(null)
  const [settlePreviewLoading, setSettlePreviewLoading] = useState(false)
  const [settlePreviewError, setSettlePreviewError] = useState<string | null>(null)
  const [buyerAccounts, setBuyerAccounts] = useState<Record<string, string>>({})
  const pageSize = 10
  const { showToast } = useToast()

  useEffect(() => {
    if (!shipModalOpen || !settleOrder) {
      setSettlePreview(null)
      setSettlePreviewError(null)
      return
    }
    let cancelled = false
    setSettlePreviewLoading(true)
    setSettlePreviewError(null)
    api
      .get<{ orderAmount: number; procurementTotal: number; walletBalance: number }>(
        `/api/orders/${settleOrder.id}/ship-preview`,
      )
      .then((res) => {
        if (cancelled) return
        setSettlePreview({
          orderAmount: res.orderAmount ?? 0,
          procurementTotal: res.procurementTotal ?? 0,
          walletBalance: res.walletBalance ?? 0,
        })
      })
      .catch((e: any) => {
        if (cancelled) return
        const msg =
          e && typeof e?.message === 'string' && e.message.trim()
            ? e.message.trim()
            : tr(lang, { zh: '无法加载结算信息', en: 'Failed to load settlement information', de: 'Abrechnungsinformationen konnten nicht geladen werden',
        ja: '精算情報を読み込めませんでした', ko: '정산 정보를 불러오지 못했습니다', es: 'No se pudo cargar la información de liquidación', it: 'Impossibile caricare le informazioni di liquidazione', vi: 'Không thể tải thông tin thanh toán'})
        setSettlePreviewError(msg)
      })
      .finally(() => {
        if (!cancelled) setSettlePreviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [shipModalOpen, settleOrder?.id])

  const loadOrders = React.useCallback(
    (mode: 'silent' | 'initial' | 'refresh' = 'initial') => {
      const shopId = getAuthShopId()
      if (!shopId) {
        setApiOrders([])
        cachedApiOrders = []
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (mode === 'initial') setLoading(true)
      if (mode === 'refresh') setRefreshing(true)

      const cacheBust = mode === 'refresh' ? `&_t=${Date.now()}` : ''
      const ordersPath = `/api/orders?shop=${encodeURIComponent(shopId)}${cacheBust}`

      api
        .get<{ list: ApiOrder[] }>(ordersPath)
        .then(async (res) => {
          if (!res?.list) return
          const list = res.list
          setApiOrders(list)
          cachedApiOrders = list
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(
                `${ORDERS_CACHE_KEY_PREFIX}${shopId}`,
                JSON.stringify(list),
              )
            }
          } catch {
            // ignore cache write error
          }
          const ids = Array.from(new Set(list.map((o) => o.userId).filter((id): id is string => !!id)))
          if (ids.length === 0) return
          try {
            const results = await Promise.all(
              ids.map(async (id) => {
                try {
                  const u = await api.get<{ account?: string }>(
                    `/api/users/${encodeURIComponent(id)}`,
                  )
                  const label = u.account
                    ? maskAccount(u.account)
                    : tr(lang, { zh: `用户 ${id}`, en: `User ${id}`, de: `Benutzer ${id}`, ja: `ユーザー ${id}`, ko: '사용자 ${id}', es: `Usuario ${id}`, it: `Utente ${id}`, vi: `Người dùng ${id}`})
                  return { id, label }
                } catch {
                  return {
                    id,
                    label: tr(lang, { zh: `用户 ${id}`, en: `User ${id}`, de: `Benutzer ${id}`, ja: `ユーザー ${id}`, ko: '사용자 ${id}', es: `Usuario ${id}`, it: `Utente ${id}`, vi: `Người dùng ${id}`}),
                  }
                }
              }),
            )
            setBuyerAccounts((prev) => {
              const next = { ...prev }
              for (const { id, label } of results) {
                if (!next[id]) next[id] = label
              }
              cachedBuyerAccounts = next
              return next
            })
          } catch {
            // ignore buyer fetch error
          }
        })
        .catch(() => {
          if (mode === 'refresh') {
            showToast(
              tr(lang, { zh: '刷新失败，请稍后重试', en: 'Refresh failed, please try again', de: 'Aktualisierung fehlgeschlagen, bitte später erneut versuchen', ja: '更新に失敗しました。しばらくしてから再度お試しください', ko: '새로고침에 실패했습니다. 잠시 후 다시 시도해 주세요.', es: 'Error al actualizar, inténtalo más tarde', it: 'Aggiornamento non riuscito, riprova più tardi', vi: 'Làm mới thất bại, vui lòng thử lại'}),
              'error',
            )
          } else if (mode === 'initial') {
            setApiOrders([])
            cachedApiOrders = []
          }
        })
        .finally(() => {
          if (mode === 'initial') setLoading(false)
          if (mode === 'refresh') setRefreshing(false)
        })
    },
    [lang, showToast],
  )

  useEffect(() => {
    // 首次进入：如果有缓存，先用缓存渲染，再静默刷新；否则正常加载
    if (cachedApiOrders && cachedApiOrders.length > 0) {
      setApiOrders(cachedApiOrders)
      if (cachedBuyerAccounts) {
        setBuyerAccounts(cachedBuyerAccounts)
      }
      loadOrders('silent')
    } else {
      loadOrders('initial')
    }
  }, [loadOrders])

  useMerchantSync(['orders', 'all'], () => {
    if (getAuthShopId()) loadOrders('silent')
  }, { immediate: false })

  const orderList = useMemo(
    () =>
      apiOrders.map<OrderItem>((o) => {
        const status = API_STATUS_TO_TAB[o.status] ?? 'paid'
        const items = o.items ?? []
        const first = items[0]
        const totalItems = items.reduce((sum, it) => sum + (it.quantity ?? 0), 0)
        const buyerLabel = o.userId
          ? buyerAccounts[o.userId] ??
            tr(lang, { zh: `用户 ${o.userId}`, en: `User ${o.userId}`, de: `Benutzer ${o.userId}`, ja: `ユーザー ${o.userId}`, ko: '사용자 ${o.userId}', es: `Usuario ${o.userId}`, it: `Utente ${o.userId}`, vi: `Người dùng ${o.userId}`})
          : '—'
        const separator = tr(lang, { zh: '、', en: ', ', de: ', ', ja: '、', ko: ', ', es: ', ', it: ', ', vi: ', '})
        return {
          id: o.id,
          orderNo: o.orderNumber,
          createdAt: o.createdAt,
          buyer: buyerLabel,
          productCodes:
            items
              .map(
                (i) => `${truncateProductName(i.title, 14)} x${i.quantity}`,
              )
              .join(separator) || '—',
          amount: o.amount,
          procurementTotal: typeof o.procurementTotal === 'number' ? o.procurementTotal : 0,
          status,
          firstProductTitle: truncateProductName(first?.title ?? '', 16),
          firstProductImage: first?.image,
          totalItems: totalItems || items.length || 0,
        }
      }),
    [apiOrders, buyerAccounts, lang],
  )
  const orderDetail: OrderDetail | null = detailOrder
    ? (() => {
        const o = apiOrders.find((x) => x.id === detailOrder.id)
        if (o) {
          return {
            ...detailOrder,
            products: (o.items ?? []).map((i) => ({
              sku: i.id,
              specDisplay: normalizeSpecDisplay(i.spec),
              name: i.title,
              qty: i.quantity,
              price: i.price,
              image: i.image,
            })),
            address: formatOrderAddress(o.address, lang),
            trackingNo: o.trackingNo,
          }
        }
        return { ...detailOrder, products: [], address: '—' }
      })()
    : null

  useEffect(() => {
    if (!orderDetail && !shipModalOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.body.classList.add('mc-overlay-open')
    return () => {
      document.body.style.overflow = prevOverflow
      document.body.classList.remove('mc-overlay-open')
    }
  }, [orderDetail, shipModalOpen])

  const filteredOrders = useMemo(() => {
    let list = orderList
    if (activeStatus !== 'all') list = list.filter((o) => o.status === activeStatus)
    if (orderNoSearch.trim()) list = list.filter((o) => o.orderNo.toLowerCase().includes(orderNoSearch.trim().toLowerCase()))
    return list
  }, [orderList, activeStatus, orderNoSearch])

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<OrderStatus, number>> = { all: orderList.length }
    for (const order of orderList) {
      counts[order.status] = (counts[order.status] ?? 0) + 1
    }
    return counts
  }, [orderList])

  const inTransitCount =
    (statusCounts.shipped ?? 0) + (statusCounts.in_transit ?? 0)

  const pendingShipCount = statusCounts.paid ?? 0

  const ordersInsightText = useMemo(() => {
    if (pendingShipCount <= 0) return ''
    if (pendingShipCount === 1) {
      return tr(lang, {
        zh: '您有 1 笔订单待发货，建议在 24 小时内完成发货结算，有助于提升店铺权重与曝光。',
        en: 'You have 1 order waiting to ship. Complete shipment within 24 hours to improve shop ranking and exposure.',
        de: 'Sie haben 1 Bestellung zum Versand. Schließen Sie die Versandabrechnung innerhalb von 24 Stunden ab, um Shop-Ranking und Sichtbarkeit zu verbessern.', ja: '発送待ちの注文が1件あります。24時間以内に発送精算を完了すると、ショップの評価と露出の向上に役立ちます。', ko: '발송 대기 주문이 1건 있습니다. 24시간 내 발송·정산을 완료하면 쇼핑몰 순위와 노출 향상에 도움이 됩니다.', es: 'Tienes 1 pedido por enviar. Completa el envío en 24 horas para mejorar ranking y visibilidad.', it: 'Hai 1 ordine da spedire. Completa la spedizione entro 24 ore per migliorare ranking e visibilità del negozio.', vi: 'Bạn có 1 đơn chờ giao. Hoàn tất giao hàng trong 24 giờ để cải thiện hạng và độ hiển thị cửa hàng.'})
    }
    return tr(lang, {
      zh: `您有 ${pendingShipCount} 笔订单待发货，建议尽快处理，24 小时内发货有助于提升店铺权重与曝光。`,
      en: `You have ${pendingShipCount} orders waiting to ship. Process them soon—shipping within 24 hours helps your shop ranking and exposure.`,
      de: `Sie haben ${pendingShipCount} Bestellungen zum Versand. Bearbeiten Sie diese bald – Versand innerhalb von 24 Stunden verbessert Ranking und Sichtbarkeit.`, ja: `発送待ちの注文が ${pendingShipCount} 件あります。24時間以内の発送はショップの評価と露出の向上に役立ちます。`, ko: '발송 대기 주문이 ${pendingShipCount}건 있습니다. 24시간 내 발송은 쇼핑몰 순위와 노출 향상에 도움이 됩니다.', es: `Tienes ${pendingShipCount} pedidos por enviar. Procésalos pronto — enviar en 24 horas mejora ranking y visibilidad.`, it: `Hai ${pendingShipCount} ordini da spedire. Processali presto — spedire entro 24 ore migliora ranking e visibilità del negozio.`, vi: `Bạn có ${pendingShipCount} đơn chờ giao. Xử lý sớm — giao trong 24 giờ giúp nâng hạng và tăng độ hiển thị cửa hàng.`})
  }, [pendingShipCount, lang])

  const isTransitFilterActive =
    activeStatus === 'shipped' || activeStatus === 'in_transit'

  const applyStatFilter = (filter: 'all' | 'paid' | 'transit') => {
    if (filter === 'all') {
      setActiveStatus('all')
    } else if (filter === 'paid') {
      setActiveStatus('paid')
    } else {
      const shipped = statusCounts.shipped ?? 0
      const inTransit = statusCounts.in_transit ?? 0
      setActiveStatus(inTransit > 0 && shipped === 0 ? 'in_transit' : 'shipped')
    }
    setPage(1)
  }

  const showInitialSkeleton = loading && apiOrders.length === 0

  const handleShip = async () => {
    if (!settleOrder) return
    setShipSubmitting(true)
    try {
      const res = await api.post<{ success?: boolean; status?: string; settleAmount?: number; walletBalance?: number }>(
        `/api/orders/${settleOrder.id}/merchant-ship`,
        {},
      )
      setApiOrders((prev) =>
        prev.map((o) =>
          o.id === settleOrder.id
            ? { ...o, status: res.status ?? 'shipped' }
            : o,
        ),
      )
      // 如果详情抽屉正打开同一单，也同步状态
      setDetailOrder((prev) =>
        prev && prev.id === settleOrder.id ? { ...prev, status: (res.status as any) ?? 'shipped' } : prev,
      )
      setShipModalOpen(false)
      setSettleOrder(null)
      if (typeof res.settleAmount === 'number') {
        showToast(
          tr(lang, {
            zh: `发货成功，本次已从店铺余额扣除采购总价 $${res.settleAmount.toFixed(2)}`,
            en: `Shipment successful. Purchase total $${res.settleAmount.toFixed(2)} has been deducted from your shop balance.`,
            de: `Versand erfolgreich. Einkaufssumme $${res.settleAmount.toFixed(2)} wurde vom Shop-Guthaben abgezogen.`, ja: `発送完了。仕入れ合計 $${res.settleAmount.toFixed(2)} をショップ残高から差し引きました`, ko: '발송 완료. 구매 총액 $${res.settleAmount.toFixed(2)}이(가) 쇼핑몰 잔액에서 차감되었습니다.', es: `Envío exitoso. Se descontó $${res.settleAmount.toFixed(2)} del saldo de la tienda por el total de compra.`, it: `Spedizione riuscita. Totale acquisto $${res.settleAmount.toFixed(2)} detratto dal saldo del negozio.`, vi: `Giao hàng thành công. Tổng nhập $${res.settleAmount.toFixed(2)} đã trừ khỏi số dư cửa hàng.`}),
          'success',
        )
      } else {
        showToast(
          tr(lang, { zh: '发货成功', en: 'Shipment successful', de: 'Versand erfolgreich', ja: '発送が完了しました', ko: '발송이 완료되었습니다', es: 'Envío exitoso', it: 'Spedizione riuscita', vi: 'Giao hàng thành công'}),
          'success',
        )
      }
    } catch (e: any) {
      const msg: string =
        e?.response?.message ||
        e?.message ||
        (tr(lang, {
          zh: '发货失败，请稍后重试',
          en: 'Shipment failed, please try again later',
          de: 'Versand fehlgeschlagen, bitte später erneut versuchen', ja: '発送に失敗しました。しばらくしてから再度お試しください', ko: '발송에 실패했습니다. 잠시 후 다시 시도해 주세요.', es: 'Error al enviar, inténtalo más tarde', it: 'Spedizione non riuscita, riprova più tardi', vi: 'Giao hàng thất bại, vui lòng thử lại sau'}))
      showToast(msg, 'error')
    } finally {
      setShipSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const currentOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="merchant-orders-page merchant-orders-page--v2">
      <header className="merchant-orders-header merchant-orders-header--v2">
        <div className="merchant-orders-header-main">
          <span className="merchant-orders-header-icon" aria-hidden="true">
            <img src={ordersHeaderIcon} alt="" className="merchant-orders-header-icon-img" />
          </span>
          <div className="merchant-orders-header-copy">
            <h1 className="merchant-orders-title">
              {tr(lang, { zh: '店铺订单', en: 'Shop orders', de: 'Shop-Bestellungen', ja: 'ショップ注文', ko: '쇼핑몰 주문', es: 'Pedidos de la tienda', it: 'Ordini del negozio', vi: 'Đơn hàng cửa hàng'})}
            </h1>
            <p className="merchant-orders-subtitle">
              {tr(lang, {
                zh: '积极处理订单有助于提升店铺权重，增加曝光率',
                en: 'Actively handling orders helps improve your shop ranking and exposure.',
                de: 'Aktive Bestellbearbeitung verbessert Shop-Ranking und Sichtbarkeit.', ja: '注文を迅速に処理すると、ショップの評価と露出が向上します', ko: '주문을 적극적으로 처리하면 쇼핑몰 순위와 노출이 향상됩니다.', es: 'Gestionar pedidos con prontitud mejora el ranking y la visibilidad de tu tienda.', it: 'Gestire gli ordini con prontezza migliora ranking e visibilità del negozio.', vi: 'Xử lý đơn hàng tích cực giúp nâng hạng cửa hàng và tăng độ hiển thị.'})}
            </p>
          </div>
        </div>
        <div className="merchant-orders-stats" role="group" aria-label={tr(lang, { zh: '订单快捷筛选', en: 'Order quick filters', de: 'Schnellfilter für Bestellungen', ja: '注文クイックフィルター', ko: '주문 빠른 필터', es: 'Filtros rápidos de pedidos', it: 'Filtri rapidi ordini', vi: 'Lọc đơn hàng nhanh'})}>
          <button
            type="button"
            className={`merchant-orders-stat merchant-orders-stat--total${
              activeStatus === 'all' ? ' merchant-orders-stat--active' : ''
            }`}
            onClick={() => applyStatFilter('all')}
            aria-pressed={activeStatus === 'all'}
          >
            <span className="merchant-orders-stat-icon" aria-hidden="true">
              <img src={ordersTotalIcon} alt="" />
            </span>
            <div className="merchant-orders-stat-body">
              <span className="merchant-orders-stat-value">{statusCounts.all ?? 0}</span>
              <span className="merchant-orders-stat-label">
                {tr(lang, { zh: '全部订单', en: 'All orders', de: 'Alle Bestellungen', ja: 'すべての注文', ko: '전체 주문', es: 'Todos los pedidos', it: 'Tutti gli ordini', vi: 'Tất cả đơn hàng'})}
              </span>
            </div>
          </button>
          <button
            type="button"
            className={`merchant-orders-stat merchant-orders-stat--pending${
              activeStatus === 'paid' ? ' merchant-orders-stat--active' : ''
            }`}
            onClick={() => applyStatFilter('paid')}
            aria-pressed={activeStatus === 'paid'}
          >
            <span className="merchant-orders-stat-icon" aria-hidden="true">
              <img src={ordersPendingIcon} alt="" />
            </span>
            <div className="merchant-orders-stat-body">
              <span className="merchant-orders-stat-value">{statusCounts.paid ?? 0}</span>
              <span className="merchant-orders-stat-label">
                {tr(lang, { zh: '待发货', en: 'To ship', de: 'Zu versenden', ja: '発送待ち', ko: '발송 대기', es: 'Por enviar', it: 'Da spedire', vi: 'Chờ giao'})}
              </span>
            </div>
          </button>
          <button
            type="button"
            className={`merchant-orders-stat merchant-orders-stat--transit${
              isTransitFilterActive ? ' merchant-orders-stat--active' : ''
            }`}
            onClick={() => applyStatFilter('transit')}
            aria-pressed={isTransitFilterActive}
          >
            <span className="merchant-orders-stat-icon" aria-hidden="true">
              <img src={ordersTransitIcon} alt="" />
            </span>
            <div className="merchant-orders-stat-body">
              <span className="merchant-orders-stat-value">{inTransitCount}</span>
              <span className="merchant-orders-stat-label">
                {tr(lang, { zh: '配送中', en: 'In transit', de: 'Unterwegs', ja: '配送中', ko: '배송 중', es: 'En tránsito', it: 'In consegna', vi: 'Đang giao'})}
              </span>
            </div>
          </button>
        </div>
      </header>

      {pendingShipCount > 0 && ordersInsightText ? (
        <MerchantDashboardInsight
          storageKey="merchant-orders-pending-insight-dismissed"
          className="merchant-orders-insight"
          iconSrc={ordersPendingIcon}
          kicker={tr(lang, { zh: '发货提醒', en: 'Shipping reminder', de: 'Versanderinnerung', ja: '発送リマインダー', ko: '발송 알림', es: 'Recordatorio de envío', it: 'Promemoria spedizione', vi: 'Nhắc giao hàng'})}
          text={ordersInsightText}
          lang={lang}
          actionLabel={tr(lang, { zh: '查看待发货', en: 'View to ship', de: 'Zu versenden anzeigen', ja: '発送待ちを表示', ko: '발송 대기 보기', es: 'Ver por enviar', it: 'Vedi da spedire', vi: 'Xem chờ giao'})}
          onAction={() => applyStatFilter('paid')}
        />
      ) : null}

      <section className="merchant-orders-section merchant-orders-section--v2">
        <div className="merchant-orders-toolbar merchant-orders-toolbar--v2">
          <div className="merchant-orders-tabs merchant-orders-tabs--v2">
            {STATUS_TABS.map((statusKey) => {
              const tabCount = statusCounts[statusKey] ?? 0
              return (
                <button
                  key={statusKey}
                  type="button"
                  className={`merchant-orders-tab${
                    activeStatus === statusKey ? ' merchant-orders-tab--active' : ''
                  }`}
                  onClick={() => {
                    setActiveStatus(statusKey)
                    setPage(1)
                  }}
                >
                  <span className="merchant-orders-tab-icon" aria-hidden="true">
                    <MerchantOrderStatusTabIcon status={statusKey} />
                  </span>
                  <span className="merchant-orders-tab-label">
                    {getStatusTabLabel(statusKey, lang)}
                  </span>
                  {tabCount > 0 && (
                    <span className="merchant-orders-tab-count">{tabCount}</span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="merchant-orders-search merchant-orders-search--v2">
            <label className="merchant-orders-search-field">
              <span className="merchant-orders-search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                className="merchant-orders-search-input"
                placeholder={tr(lang, { zh: '搜索订单号', en: 'Search by order number', de: 'Nach Bestellnummer suchen', ja: '注文番号で検索', ko: '주문번호 검색', es: 'Buscar por número de pedido', it: 'Cerca per numero ordine', vi: 'Tìm theo mã đơn hàng'})}
                value={orderNoSearch}
                onChange={(e) => {
                  setOrderNoSearch(e.target.value)
                  setPage(1)
                }}
              />
            </label>
            <button
              type="button"
              className={`merchant-orders-refresh-btn${
                refreshing ? ' merchant-orders-refresh-btn--loading' : ''
              }`}
              onClick={() => loadOrders('refresh')}
              disabled={refreshing || loading}
              aria-label={
                refreshing
                  ? tr(lang, { zh: '刷新中', en: 'Refreshing', de: 'Refreshing', ja: '更新中', ko: '새로고침 중', es: 'Actualizando', it: 'Aggiornamento', vi: 'Đang làm mới'})
                  : tr(lang, { zh: '刷新订单列表', en: 'Refresh order list', de: 'Bestellliste aktualisieren', ja: '注文一覧を更新', ko: '주문 목록 새로고침', es: 'Actualizar lista de pedidos', it: 'Aggiorna elenco ordini', vi: 'Làm mới danh sách đơn hàng'})
              }
              title={
                tr(lang, { zh: '刷新订单列表（管理员修改状态后会同步显示）', en: 'Refresh order list (sync changes made in admin)', de: 'Bestellliste aktualisieren (Änderungen aus dem Admin synchronisieren)', ja: '注文一覧を更新（管理画面での変更を同期）', ko: '주문 목록 새로고침(관리자 변경 사항 동기화)', es: 'Actualizar lista de pedidos (sincronizar cambios del admin)', it: 'Aggiorna elenco ordini (sincronizza modifiche admin)', vi: 'Làm mới danh sách đơn (đồng bộ thay đổi từ quản trị)'})
              }
            >
              <svg
                className="merchant-orders-refresh-icon"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 11-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
            </button>
          </div>
        </div>

        <div
          className={`merchant-orders-table-wrap${
            refreshing ? ' merchant-orders-table-wrap--refreshing' : ''
          }`}
        >
          {refreshing && (
            <div className="merchant-orders-refresh-overlay" role="status" aria-live="polite">
              <span className="merchant-orders-refresh-overlay-spinner" aria-hidden="true" />
              <span className="merchant-orders-refresh-overlay-text">
                {tr(lang, { zh: '正在刷新订单…', en: 'Refreshing orders…', de: 'Bestellungen werden aktualisiert…', ja: '注文を更新中…', ko: '주문 새로고침 중…', es: 'Actualizando pedidos…', it: 'Aggiornamento ordini…', vi: 'Đang làm mới đơn hàng…'})}
              </span>
            </div>
          )}
          {showInitialSkeleton ? (
            <div className="merchant-orders-card-list">
              {Array.from({ length: ORDER_SKELETON_COUNT }, (_, index) => (
                <OrderCardSkeleton key={index} />
              ))}
            </div>
          ) : currentOrders.length === 0 ? (
            <div className="merchant-orders-empty">
              <div className="merchant-orders-empty-icon" aria-hidden="true">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" /></svg>
              </div>
              <p className="merchant-orders-empty-text">
                {tr(lang, { zh: '暂无订单', en: 'No orders yet', de: 'Noch keine Bestellungen', ja: '注文がありません', ko: '주문이 없습니다', es: 'Aún no hay pedidos', it: 'Nessun ordine', vi: 'Chưa có đơn hàng'})}
              </p>
              <p className="merchant-orders-empty-hint">
                {tr(lang, { zh: '切换状态或修改搜索条件试试', en: 'Try switching status or changing search conditions.', de: 'Versuchen Sie, den Status zu wechseln oder die Suchbedingungen zu ändern.', ja: 'ステータスを切り替えるか、検索条件を変更してみてください', ko: '상태를 변경하거나 검색 조건을 수정해 보세요.', es: 'Prueba cambiar el estado o los criterios de búsqueda.', it: 'Prova a cambiare stato o criteri di ricerca.', vi: 'Thử đổi trạng thái hoặc điều kiện tìm kiếm.'})}
              </p>
            </div>
          ) : (
            <div className="merchant-orders-card-list merchant-orders-card-list--animated">
              {currentOrders.map((order, index) => {
                const { profit, ratio } = calcOrderProfit(order.amount, order.procurementTotal)
                return (
                <article
                  key={order.id}
                  className={`merchant-orders-card merchant-orders-card--v2${
                    order.status === 'paid' ? ' merchant-orders-card--urgent' : ''
                  }`}
                  style={{ '--mc-stagger': `${index * 0.055}s` } as React.CSSProperties}
                >
                  <div className="merchant-orders-card-top">
                    <div className="merchant-orders-card-top-left">
                      <span className="merchant-orders-card-chip">
                        {tr(lang, { zh: '订单号', en: 'Order', de: 'Bestellung', ja: '注文番号', ko: '주문', es: 'Pedido', it: 'Ordine', vi: 'Đơn hàng'})}
                      </span>
                      <span className="merchant-orders-card-order-no">{order.orderNo}</span>
                    </div>
                    <span
                      className={`merchant-orders-status merchant-orders-status--${order.status}`}
                    >
                      {getStatusLabel(order.status, lang)}
                    </span>
                  </div>

                  <div className="merchant-orders-card-main">
                    <div className="merchant-orders-card-product">
                      <div className="merchant-orders-card-thumb">
                        {order.firstProductImage ? (
                          <img
                            src={order.firstProductImage}
                            alt={
                              order.firstProductTitle ||
                              (tr(lang, { zh: '商品图片', en: 'Product image', de: 'Produktbild', ja: '商品画像', ko: '상품 이미지', es: 'Imagen del producto', it: 'Immagine prodotto', vi: 'Ảnh sản phẩm'}))
                            }
                            loading="lazy"
                          />
                        ) : (
                          <span className="merchant-orders-card-thumb-fallback" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                              <path d="M3 6h18" />
                              <path d="M16 10a4 4 0 01-8 0" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="merchant-orders-card-product-body">
                        <h3 className="merchant-orders-card-product-title" title={order.firstProductTitle || order.productCodes}>
                          {order.firstProductTitle || order.productCodes || '—'}
                        </h3>
                        <div className="merchant-orders-card-meta-row">
                          <span className="merchant-orders-card-meta-chip">
                            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
                              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            {formatDateTime(order.createdAt, lang)}
                          </span>
                          <span className="merchant-orders-card-meta-chip">
                            <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                              <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                              <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                            {order.buyer}
                          </span>
                          {order.totalItems > 0 && (
                            <span className="merchant-orders-card-meta-chip merchant-orders-card-meta-chip--qty">
                              {tr(lang, {
                                zh: `${order.totalItems} 件`,
                                en: `${order.totalItems} items`,
                                de: `${order.totalItems} Artikel`, ja: `${order.totalItems} 点`, ko: '${order.totalItems}개', es: `${order.totalItems} artículos`, it: `${order.totalItems} articoli`, vi: `${order.totalItems} sản phẩm`})}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="merchant-orders-card-bar">
                    <div className="merchant-orders-card-pricing">
                      <div className="merchant-orders-card-price-block">
                        <span className="merchant-orders-card-price-label">
                          {tr(lang, { zh: '买家实付', en: 'Paid', de: 'Bezahlt', ja: '購入者支払額', ko: '구매자 결제', es: 'Pagado', it: 'Pagato', vi: 'Đã thanh toán'})}
                        </span>
                        <span className="merchant-orders-card-price-value">
                          ${order.amount.toFixed(2)}
                        </span>
                      </div>
                      <span className="merchant-orders-card-price-sep" aria-hidden="true" />
                      <div className="merchant-orders-card-price-block merchant-orders-card-price-block--cost">
                        <span className="merchant-orders-card-price-label">
                          {tr(lang, { zh: '采购成本', en: 'Cost', de: 'Einkaufskosten', ja: '仕入れコスト', ko: '원가', es: 'Costo', it: 'Costo', vi: 'Chi phí'})}
                        </span>
                        <span className="merchant-orders-card-price-value merchant-orders-card-price-value--muted">
                          ${order.procurementTotal.toFixed(2)}
                        </span>
                      </div>
                      <span className="merchant-orders-card-price-sep" aria-hidden="true" />
                      <div className="merchant-orders-card-price-block merchant-orders-card-price-block--profit">
                        <span className="merchant-orders-card-price-label">
                          {tr(lang, { zh: '预估利润', en: 'Profit', de: 'Geschätzter Gewinn', ja: '見込み利益', ko: '예상 이익', es: 'Ganancia', it: 'Profitto', vi: 'Lợi nhuận'})}
                        </span>
                        <span
                          className={`merchant-orders-card-price-value merchant-orders-card-price-value--profit${
                            profit < 0 ? ' merchant-orders-card-price-value--negative' : ''
                          }`}
                        >
                          ${profit.toFixed(2)}
                          {order.procurementTotal > 0 && (
                            <em className="merchant-orders-card-profit-ratio">
                              {ratio}%
                            </em>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="merchant-orders-card-actions">
                      <button
                        type="button"
                        className="merchant-orders-action-btn"
                        onClick={() => setDetailOrder(order)}
                      >
                        {tr(lang, { zh: '查看详情', en: 'Details', de: 'Details', ja: '詳細を見る', ko: '상세 보기', es: 'Detalles', it: 'Dettagli', vi: 'Chi tiết'})}
                      </button>
                      {order.status === 'paid' && (
                        <button
                          type="button"
                          className="merchant-orders-action-btn merchant-orders-action-btn--primary"
                          onClick={() => { setSettleOrder(order); setShipModalOpen(true) }}
                        >
                          {tr(lang, { zh: '立即发货', en: 'Ship now', de: 'Jetzt versenden', ja: '今すぐ発送', ko: '지금 발송', es: 'Enviar ahora', it: 'Spedisci ora', vi: 'Giao hàng ngay'})}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )})}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="merchant-orders-pagination">
            <button
              type="button"
              className="merchant-orders-page-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {tr(lang, { zh: '上一页', en: 'Previous', de: 'Zurück', ja: '前へ', ko: '이전', es: 'Anterior', it: 'Precedente', vi: 'Trước'})}
            </button>
            <span className="merchant-orders-page-info">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="merchant-orders-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {tr(lang, { zh: '下一页', en: 'Next', de: 'Weiter', ja: '次へ', ko: '다음', es: 'Siguiente', it: 'Successivo', vi: 'Tiếp'})}
            </button>
          </div>
        )}
      </section>

      {/* 结算弹窗打开时，暂时隐藏抽屉与其遮罩，避免“阴影残留/叠加” */}
      {orderDetail && !shipModalOpen
        ? createPortal(
            <>
              <div
                className="merchant-orders-drawer-overlay"
                onClick={() => setDetailOrder(null)}
                role="presentation"
                aria-hidden="true"
              />
              <aside
                className="merchant-orders-drawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="merchant-orders-drawer-title"
              >
            <div className="merchant-orders-drawer-head">
              <h2
                id="merchant-orders-drawer-title"
                className="merchant-orders-drawer-title"
              >
                {tr(lang, { zh: '订单详情', en: 'Order details', de: 'Bestelldetails', ja: '注文詳細', ko: '주문 상세', es: 'Detalle del pedido', it: 'Dettagli ordine', vi: 'Chi tiết đơn hàng'})}
              </h2>
              <button
                type="button"
                className="merchant-orders-drawer-close"
                onClick={() => setDetailOrder(null)}
                aria-label={tr(lang, { zh: '关闭', en: 'Close', de: 'Schließen', ja: '閉じる', ko: '닫기', es: 'Cerrar', it: 'Chiudi', vi: 'Đóng'})}
              >
                ×
              </button>
            </div>
            <div className="merchant-orders-drawer-body">
              <section className="merchant-orders-detail-block">
                <h3 className="merchant-orders-detail-block-title">
                  {tr(lang, { zh: '基本信息', en: 'Basic info', de: 'Grundinformationen', ja: '基本情報', ko: '기본 정보', es: 'Información básica', it: 'Informazioni di base', vi: 'Thông tin cơ bản'})}
                </h3>
                <dl className="merchant-orders-detail-dl">
                  <dt>{tr(lang, { zh: '订单号', en: 'Order No.', de: 'Bestellnr.', ja: '注文番号', ko: '주문번호', es: 'N.º de pedido', it: 'N. ordine', vi: 'Mã đơn hàng'})}</dt>
                  <dd>{orderDetail.orderNo}</dd>
                  <dt>{tr(lang, { zh: '下单时间', en: 'Order time', de: 'Bestellzeit', ja: '注文日時', ko: '주문 일시', es: 'Fecha del pedido', it: 'Data ordine', vi: 'Thời gian đặt hàng'})}</dt>
                  <dd>{formatDateTime(orderDetail.createdAt, lang)}</dd>
                  <dt>{tr(lang, { zh: '订单状态', en: 'Order status', de: 'Bestellstatus', ja: '注文ステータス', ko: '주문 상태', es: 'Estado del pedido', it: 'Stato ordine', vi: 'Trạng thái đơn hàng'})}</dt>
                  <dd>
                    <span className={`merchant-orders-status merchant-orders-status--${orderDetail.status}`}>
                      {getStatusLabel(orderDetail.status, lang)}
                    </span>
                  </dd>
                </dl>
              </section>

              <section className="merchant-orders-detail-block">
                <h3 className="merchant-orders-detail-block-title">
                  {tr(lang, { zh: '买家信息', en: 'Buyer info', de: 'Käuferinformationen', ja: '購入者情報', ko: '구매자 정보', es: 'Datos del comprador', it: 'Info acquirente', vi: 'Thông tin người mua'})}
                </h3>
                <div className="merchant-orders-detail-buyer-row">
                  <dl className="merchant-orders-detail-dl">
                    <dt>{tr(lang, { zh: '买家', en: 'Buyer', de: 'Käufer', ja: '購入者', ko: '구매자', es: 'Comprador', it: 'Acquirente', vi: 'Người mua'})}</dt>
                    <dd>{orderDetail.buyer}</dd>
                  </dl>
                </div>
              </section>

              <section className="merchant-orders-detail-block">
                <h3 className="merchant-orders-detail-block-title">
                  {tr(lang, { zh: '商品信息', en: 'Products', de: 'Produkte', ja: '商品情報', ko: '상품 정보', es: 'Productos', it: 'Prodotti', vi: 'Sản phẩm'})}
                </h3>
                <ul className="merchant-orders-detail-products">
                  {orderDetail.products.map((p, i) => (
                    <li key={i} className="merchant-orders-detail-product">
                      {p.image && (
                        <div className="merchant-orders-detail-product-thumb">
                          <img src={p.image} alt={p.name} loading="lazy" />
                        </div>
                      )}
                      <div className="merchant-orders-detail-product-main">
                        <span className="merchant-orders-detail-product-name" title={p.name}>
                          {truncateProductName(p.name, 24)}
                        </span>
                        <span className="merchant-orders-detail-product-meta">
                          {p.specDisplay} × {p.qty}
                        </span>
                      </div>
                      <span className="merchant-orders-detail-product-price">
                        ${(p.price * p.qty).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="merchant-orders-detail-block">
                <h3 className="merchant-orders-detail-block-title">
                  {tr(lang, { zh: '订单金额', en: 'Order amount', de: 'Bestellbetrag', ja: '注文金額', ko: '주문 금액', es: 'Monto del pedido', it: 'Importo ordine', vi: 'Số tiền đơn hàng'})}
                </h3>
                <div className="merchant-orders-detail-amount-row">
                  <span>{tr(lang, { zh: '买家实付金额', en: 'Buyer paid amount', de: 'Vom Käufer bezahlter Betrag', ja: '購入者支払金額', ko: '구매자 결제 금액', es: 'Monto pagado por el comprador', it: 'Importo pagato dall\'acquirente', vi: 'Số tiền người mua đã trả'})}</span>
                  <strong>${orderDetail.amount.toFixed(2)}</strong>
                </div>
                <div className="merchant-orders-detail-amount-row merchant-orders-detail-amount-row--sub">
                  <span>{tr(lang, { zh: '采购总价', en: 'Purchase total', de: 'Einkaufssumme', ja: '仕入れ合計', ko: '구매 총액', es: 'Total de compra', it: 'Totale acquisto', vi: 'Tổng giá nhập'})}</span>
                  <span>${orderDetail.procurementTotal.toFixed(2)}</span>
                </div>
              </section>

              <section className="merchant-orders-detail-block">
                <h3 className="merchant-orders-detail-block-title">
                  {tr(lang, { zh: '收货地址', en: 'Shipping address', de: 'Lieferadresse', ja: '配送先住所', ko: '배송지', es: 'Dirección de envío', it: 'Indirizzo di spedizione', vi: 'Địa chỉ giao hàng'})}
                </h3>
                <p className="merchant-orders-detail-address">{orderDetail.address}</p>
              </section>

              {orderDetail.trackingNo && (
                <section className="merchant-orders-detail-block">
                  <h3 className="merchant-orders-detail-block-title">
                    {tr(lang, { zh: '物流信息', en: 'Logistics', de: 'Logistik', ja: '配送情報', ko: '배송 정보', es: 'Logística', it: 'Logistica', vi: 'Vận chuyển'})}
                  </h3>
                  <dl className="merchant-orders-detail-dl">
                    <dt>{tr(lang, { zh: '物流单号', en: 'Tracking No.', de: 'Sendungsnr.', ja: '追跡番号', ko: '운송장 번호', es: 'N.º de seguimiento', it: 'N. tracking', vi: 'Mã vận đơn'})}</dt>
                    <dd className="merchant-orders-detail-tracking">{orderDetail.trackingNo}</dd>
                  </dl>
                </section>
              )}

              <section className="merchant-orders-detail-actions">
                {orderDetail.status === 'paid' && (
                  <button
                    type="button"
                    className="merchant-orders-detail-btn merchant-orders-detail-btn--primary"
                    onClick={() => { setSettleOrder(orderDetail); setShipModalOpen(true) }}
                  >
                    {tr(lang, { zh: '发货', en: 'Ship', de: 'Versenden', ja: '発送', ko: '발송', es: 'Enviar', it: 'Spedisci', vi: 'Giao hàng'})}
                  </button>
                )}
                {orderDetail.status === 'shipped' && orderDetail.trackingNo && (
                  <button type="button" className="merchant-orders-detail-btn">
                    {tr(lang, { zh: '更新物流', en: 'Update logistics', de: 'Logistik aktualisieren', ja: '配送情報を更新', ko: '배송 정보 업데이트', es: 'Actualizar logística', it: 'Aggiorna logistica', vi: 'Cập nhật vận chuyển'})}
                  </button>
                )}
                <button
                  type="button"
                  className="merchant-orders-detail-btn"
                  onClick={() => setDetailOrder(null)}
                >
                  {tr(lang, { zh: '关闭', en: 'Close', de: 'Schließen', ja: '閉じる', ko: '닫기', es: 'Cerrar', it: 'Chiudi', vi: 'Đóng'})}
                </button>
              </section>
            </div>
          </aside>
            </>,
            document.body,
          )
        : null}

      {shipModalOpen && settleOrder
        ? createPortal(
            <div className="merchant-orders-ship-overlay" role="dialog" aria-modal="true" aria-labelledby="merchant-orders-settle-title">
          <div
            className="merchant-orders-ship-backdrop"
            onClick={() => { setShipModalOpen(false); setSettleOrder(null) }}
            aria-hidden="true"
          />
          <div className="merchant-orders-settle-modal" onClick={(e) => e.stopPropagation()}>
            <div className="merchant-orders-settle-head">
              <h2 id="merchant-orders-settle-title" className="merchant-orders-settle-title">
                {tr(lang, { zh: '发货结算', en: 'Shipment settlement', de: 'Versandabrechnung', ja: '発送精算', ko: '발송 정산', es: 'Liquidación de envío', it: 'Liquidazione spedizione', vi: 'Thanh toán giao hàng'})}
              </h2>
              <p className="merchant-orders-settle-order-no">
                {tr(lang, { zh: '订单号：', en: 'Order No: ', de: 'Order No: ', ja: '注文番号：', ko: '주문번호: ', es: 'N.º de pedido: ', it: 'N. ordine: ', vi: 'Mã đơn hàng: '})}
                {settleOrder.orderNo}
              </p>
            </div>
            {settlePreviewLoading && (
              <div className="merchant-orders-settle-loading">
                {tr(lang, { zh: '加载结算信息中…', en: 'Loading settlement info…', de: 'Abrechnungsinformationen werden geladen…', ja: '精算情報を読み込み中…', ko: '정산 정보 불러오는 중…', es: 'Cargando información de liquidación…', it: 'Caricamento info liquidazione…', vi: 'Đang tải thông tin thanh toán…'})}
              </div>
            )}
            {settlePreviewError && (
              <div className="merchant-orders-settle-error">{settlePreviewError}</div>
            )}
            {!settlePreviewLoading && !settlePreviewError && settlePreview && (() => {
              const { orderAmount, procurementTotal, walletBalance } = settlePreview
              const profitAmount = Math.round((orderAmount - procurementTotal) * 100) / 100
              const profitRatio = procurementTotal > 0
                ? Math.round((profitAmount / procurementTotal) * 1000) / 10
                : 0
              const expectedTotal = orderAmount
              const canSettle = walletBalance >= procurementTotal
              return (
                <>
                  <div className="merchant-orders-settle-card">
                    <div className="merchant-orders-settle-row merchant-orders-settle-row--amount">
                      <span className="merchant-orders-settle-label">
                        {tr(lang, { zh: '订单金额（买家实付）', en: 'Order amount (buyer paid)', de: 'Bestellbetrag (Käufer bezahlt)', ja: '注文金額（購入者支払額）', ko: '주문 금액(구매자 결제)', es: 'Monto del pedido (pagado por el comprador)', it: 'Importo ordine (pagato dall\'acquirente)', vi: 'Số tiền đơn hàng (người mua đã trả)'})}
                      </span>
                      <span className="merchant-orders-settle-value">${orderAmount.toFixed(2)}</span>
                    </div>
                    <div className="merchant-orders-settle-row">
                      <span className="merchant-orders-settle-label">
                        {tr(lang, { zh: '采购总价', en: 'Purchase total', de: 'Einkaufssumme', ja: '仕入れ合計', ko: '구매 총액', es: 'Total de compra', it: 'Totale acquisto', vi: 'Tổng giá nhập'})}
                      </span>
                      <span className="merchant-orders-settle-value">${procurementTotal.toFixed(2)}</span>
                    </div>
                    <div className="merchant-orders-settle-row merchant-orders-settle-row--profit">
                      <span className="merchant-orders-settle-label">
                        {tr(lang, { zh: '利润金额', en: 'Profit amount', de: 'Gewinnbetrag', ja: '利益額', ko: '이익 금액', es: 'Monto de ganancia', it: 'Importo profitto', vi: 'Số tiền lợi nhuận'})}
                      </span>
                      <span className="merchant-orders-settle-value merchant-orders-settle-value--profit">
                        ${profitAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="merchant-orders-settle-row">
                      <span className="merchant-orders-settle-label">
                        {tr(lang, { zh: '利润比', en: 'Profit ratio', de: 'Gewinnquote', ja: '利益率', ko: '이익률', es: 'Margen de ganancia', it: 'Margine di profitto', vi: 'Tỷ suất lợi nhuận'})}
                      </span>
                      <span className="merchant-orders-settle-value merchant-orders-settle-value--ratio">
                        {profitRatio}%
                      </span>
                    </div>
                    <div className="merchant-orders-settle-divider" />
                    <div className="merchant-orders-settle-row merchant-orders-settle-row--total">
                      <span className="merchant-orders-settle-label">
                        {tr(lang, { zh: '预计回款总额', en: 'Expected total payout', de: 'Erwartete Gesamtauszahlung', ja: '見込み入金合計', ko: '예상 입금 총액', es: 'Total estimado a recibir', it: 'Totale stimato da incassare', vi: 'Tổng tiền nhận dự kiến'})}
                      </span>
                      <span className="merchant-orders-settle-value merchant-orders-settle-value--total">
                        ${expectedTotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="merchant-orders-settle-wallet">
                      <span className="merchant-orders-settle-label">
                        {tr(lang, { zh: '当前店铺余额', en: 'Current shop balance', de: 'Aktuelles Shop-Guthaben', ja: '現在のショップ残高', ko: '현재 쇼핑몰 잔액', es: 'Saldo actual de la tienda', it: 'Saldo attuale del negozio', vi: 'Số dư cửa hàng hiện tại'})}
                      </span>
                      <span className={`merchant-orders-settle-value ${!canSettle ? 'merchant-orders-settle-value--insufficient' : ''}`}>
                        ${walletBalance.toFixed(2)}
                        {!canSettle && (
                          <em className="merchant-orders-settle-insufficient">
                            {tr(lang, { zh: '（余额不足）', en: '(Insufficient balance)', de: '(Unzureichendes Guthaben)', ja: '（残高不足）', ko: '(잔액 부족)', es: '(Saldo insuficiente)', it: '(Saldo insufficiente)', vi: '(Số dư không đủ)'})}
                          </em>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="merchant-orders-settle-actions">
                    <button
                      type="button"
                      className="merchant-orders-settle-btn"
                      onClick={() => { setShipModalOpen(false); setSettleOrder(null) }}
                    >
                      {tr(lang, { zh: '取消', en: 'Cancel', de: 'Abbrechen', ja: 'キャンセル', ko: '취소', es: 'Cancelar', it: 'Annulla', vi: 'Hủy'})}
                    </button>
                    <button
                      type="button"
                      className="merchant-orders-settle-btn merchant-orders-settle-btn--primary"
                      disabled={shipSubmitting || !canSettle}
                      onClick={handleShip}
                    >
                      {shipSubmitting
                        ? tr(lang, { zh: '提交中…', en: 'Submitting…', de: 'Submitting…', ja: '送信中…', ko: '제출 중…', es: 'Enviando…', it: 'Invio in corso…', vi: 'Đang gửi…'})
                        : tr(lang, { zh: '确认发货并结算', en: 'Confirm shipment and settle', de: 'Versand bestätigen und abrechnen', ja: '発送・精算を確認', ko: '발송 및 정산 확인', es: 'Confirmar envío y liquidar', it: 'Conferma spedizione e liquidazione', vi: 'Xác nhận giao hàng và thanh toán'})}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default MerchantOrders
