import React, { useState, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useToast } from '../components/ToastProvider'
import { api } from '../api/client'
import { getCategoryNameZh } from '../constants/categoryNameZh'
import { useLang } from '../context/LangContext'
import { tr, toTraditional, type Lang } from '../i18n'

function formatCategoryLabel(lang: Lang, name: string | null | undefined): string {
  const raw = name || ''
  if (lang === 'zh') return getCategoryNameZh(raw) || raw
  if (lang === 'tw') return toTraditional(getCategoryNameZh(raw) || raw)
  return raw
}
import { useMerchantSync } from '../hooks/useMerchantSync'
import warehouseHeaderIcon from '../assets/cangku.png'
import warehouseTotalIcon from '../assets/shangpinzongshu.png'
import warehouseOnIcon from '../assets/jinrixiaoshoue.png'
import warehouseOffIcon from '../assets/yixiajia.png'
import MerchantDashboardInsight from '../components/MerchantDashboardInsight'
import MerchantConfirmModal, { type MerchantConfirmVariant } from '../components/MerchantConfirmModal'

interface WarehouseItem {
  /** 店铺上架记录唯一 ID（listingId） */
  id: string
  listingId: string
  /** 供货商品编号（products.product_id） */
  productId: string
  productCode: string
  productName: string
  stock: number
  price: number
  supplyPrice: number
  /** 'on' 供货中 / 'off' 已下架 */
  status: 'on' | 'off'
  image?: string
  /** 多图列表，用于卡片主图轮播（优先使用） */
  images?: string[]
  /** 是否主推（展示优先） */
  recommended?: boolean
}

function profitRatio(price: number, supplyPrice: number): string {
  if (supplyPrice <= 0) return '—'
  const pct = ((price - supplyPrice) / supplyPrice) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

interface CatalogItem {
  id: string
  name: string
  supplyPrice: number
  suggestedPrice: number
  category: string
  /** 多图列表，用于详情轮播 */
  images: string[]
  /** 商品描述 */
  description: string
  /** 款式，如颜色、尺寸等 */
  styles: string[]
  /** 后端商品详情是否已加载 */
  loaded?: boolean
  status?: 'on' | 'off'
}

interface CategoryItem {
  id: string
  parent_id: string | null
  level: number
  name: string
}

const PAGE_SIZE = 12
const PROCURE_VISIBLE_CATEGORIES = 8

function ProcureCategoryExpandIcon({ expanded }: { expanded: boolean }) {
  if (expanded) {
    return (
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor" opacity="0.35" />
        <rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity="0.35" />
        <rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity="0.35" />
        <rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity="0.35" />
        <path
          d="M7 15h6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <rect x="2" y="2" width="7" height="7" rx="2" fill="currentColor" opacity="0.95" />
      <rect x="11" y="2" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="2" y="11" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
      <rect x="11" y="11" width="7" height="7" rx="2" fill="currentColor" opacity="0.3" />
      <circle cx="15.5" cy="15.5" r="3.6" fill="currentColor" />
      <path
        d="M15.5 13.7v3.6M13.7 15.5h3.6"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
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

function getAuthUserId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return null
    return (JSON.parse(raw) as { id?: string })?.id ?? null
  } catch {
    return null
  }
}

interface ApiShopProduct {
  listingId: string
  productId: string
  status: 'on' | 'off'
  listedAt: string | null
  title: string
  image: string
  images?: string[]
  price: number
  supplyPrice: number | null
  category: string | null
  subCategory: string | null
  recommended?: boolean
}

function MerchantWarehouseDetailModal({
  title,
  subtitle,
  titleId,
  lang,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  titleId: string
  lang: Lang
  onClose: () => void
  children: React.ReactNode
}) {
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
      className="merchant-warehouse-detail-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="merchant-warehouse-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="merchant-warehouse-detail-modal-head">
          <div className="merchant-warehouse-detail-modal-head-main">
            <div>
              <h3 id={titleId} className="merchant-warehouse-detail-modal-title">
                {title}
              </h3>
              {subtitle ? (
                <p className="merchant-warehouse-detail-modal-subtitle">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            className="merchant-warehouse-detail-modal-close"
            onClick={onClose}
            aria-label={tr(lang, { zh: '关闭', en: 'Close', de: 'Schließen', ja: '閉じる', ko: '닫기', es: 'Cerrar', it: 'Chiudi', vi: 'Đóng', fr: 'Fermer'})}
          >
            ×
          </button>
        </div>
        <div className="merchant-warehouse-detail-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

const MerchantWarehouse: React.FC = () => {
  const { showToast } = useToast()
  const { lang } = useLang()
  const [tab, setTab] = useState<'mine' | 'procure'>('mine')
  const [myProducts, setMyProducts] = useState<WarehouseItem[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'on' | 'off'>('all')
  const [procureSearchInput, setProcureSearchInput] = useState('')
  const [procureSearch, setProcureSearch] = useState('')
  const [procureCategoryId, setProcureCategoryId] = useState<string>('') // 只按大分类筛选，空为全部
  const [minePage, setMinePage] = useState(1)
  const [procurePage, setProcurePage] = useState(1)
  /** 采购详情弹层：当前选中的商品，null 表示关闭 */
  const [procureDetailItem, setProcureDetailItem] = useState<CatalogItem | null>(null)
  /** 我的商品详情弹层 */
  const [mineDetailItem, setMineDetailItem] = useState<WarehouseItem | null>(null)
  /** 我的商品详情补充数据（主图、描述，从供货详情 API 拉取） */
  const [mineDetailEnriched, setMineDetailEnriched] = useState<{ images: string[]; description: string } | null>(null)
  /** 我的商品详情内多图轮播当前下标 */
  const [mineDetailImageIndex, setMineDetailImageIndex] = useState(0)
  /** 详情内多图轮播当前下标（采购） */
  const [detailImageIndex, setDetailImageIndex] = useState(0)
  /** 定价弹层：当前要改价的商品，null 表示关闭（已不再使用，定价交由系统自动完成） */
  const [_pricingItem, _setPricingItem] = useState<WarehouseItem | null>(null)
  /** 定价弹层内输入的新售价（字符串，用于受控输入，已废弃） */
  const [_pricingInput, _setPricingInput] = useState('')
  /** 采购定价并上架弹层：当前要采购的商品，null 表示关闭（已废弃，采购时系统自动定价） */
  const [_procurePricingItem, setProcurePricingItem] = useState<CatalogItem | null>(null)
  /** 采购定价弹层内输入的售价（已废弃） */
  const [_procurePricingInput, setProcurePricingInput] = useState('')
  /** 供货商品列表（来自后端） */
  const [procureList, setProcureList] = useState<CatalogItem[]>([])
  const [procureTotal, setProcureTotal] = useState(0)
  const [procureLoading, setProcureLoading] = useState(false)
  const [procureCategories, setProcureCategories] = useState<Array<{ id: string; label: string }>>([])
  const [procureCategoriesLoaded, setProcureCategoriesLoaded] = useState(false)
  const [procureCategoriesExpanded, setProcureCategoriesExpanded] = useState(false)
  /** 采购列表每个商品的当前轮播图下标 */
  const [catalogImageIndex, setCatalogImageIndex] = useState<Record<string, number>>({})
  /** 我的商品卡片主图轮播下标 */
  const [mineImageIndex, setMineImageIndex] = useState<Record<string, number>>({})
  /** 上架 / 下架 / 删除确认弹窗 */
  const [confirmModal, setConfirmModal] = useState<{
    item: WarehouseItem
    action: 'list' | 'unlist' | 'delete' | 'recommend' | 'unrecommend' | 'recommend_blocked'
  } | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const fetchSupplyRef = useRef<(silent?: boolean) => void>(() => {})

  const shopId = useMemo(() => getAuthShopId(), [])

  const loadMineProducts = () => {
    if (!shopId) {
      setMyProducts([])
      showToast(
        tr(lang, { zh: '未登录商家或未绑定店铺，无法加载店铺商品', en: 'Not logged in or shop not bound, cannot load shop products', de: 'Nicht angemeldet oder kein Shop verknüpft – Shop-Produkte können nicht geladen werden',
          ja: '未ログイン、またはショップが紐付けられていないため、商品を読み込めません', ko: '로그인되지 않았거나 쇼핑몰이 연결되지 않아 상품을 불러올 수 없습니다', es: 'Sin sesión o tienda no vinculada; no se pueden cargar los productos', it: 'Sessione assente o negozio non collegato; impossibile caricare i prodotti', vi: 'Chưa đăng nhập hoặc chưa liên kết cửa hàng, không thể tải sản phẩm'}),
        'error',
      )
      return
    }
    api
      .get<{ list: ApiShopProduct[] }>(`/api/shop-products/by-shop/${shopId}`)
      .then((res) => {
        const list = Array.isArray(res.list) ? res.list : []
        const mapped: WarehouseItem[] = list.map((row) => ({
          id: String(row.listingId),
          listingId: String(row.listingId),
          productId: String(row.productId),
          productCode: String(row.productId),
          productName: row.title,
          stock: 0,
          price: row.price,
          supplyPrice: row.supplyPrice ?? 0,
          status: row.status === 'off' ? 'off' : 'on',
          image: row.image || undefined,
          images: row.images && row.images.length > 0 ? row.images : undefined,
          recommended: row.status === 'on' && Boolean(row.recommended),
        }))
        setMyProducts(mapped)
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              `merchantWarehouse:mine:${shopId}`,
              JSON.stringify(mapped),
            )
          }
        } catch {
          // ignore cache write error
        }
      })
      .catch(() => {
        setMyProducts([])
      })
  }

  const filtered = useMemo(() => {
    let list = myProducts
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.productCode.toLowerCase().includes(q) || p.productName.toLowerCase().includes(q)
      )
    }
    return list
  }, [myProducts, search, statusFilter])

  const totalMinePages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginatedMine = useMemo(
    () => filtered.slice((minePage - 1) * PAGE_SIZE, minePage * PAGE_SIZE),
    [filtered, minePage]
  )

  const totalProcurePages = Math.max(1, Math.ceil(procureTotal / PAGE_SIZE))

  const onSaleCount = useMemo(
    () => myProducts.filter((p) => p.status === 'on').length,
    [myProducts],
  )
  const offSaleCount = useMemo(
    () => myProducts.filter((p) => p.status === 'off').length,
    [myProducts],
  )

  const applyWarehouseStat = (filter: 'all' | 'on' | 'off') => {
    setTab('mine')
    setStatusFilter(filter)
    setMinePage(1)
  }

  const recommendedCount = useMemo(
    () => myProducts.filter((p) => p.status === 'on' && p.recommended).length,
    [myProducts],
  )

  const warehouseInsight = useMemo(() => {
    const total = myProducts.length
    const q = search.trim()

    if (total === 0) {
      return {
        text:
          tr(lang, { zh: '店铺暂无商品，前往「采购上架」挑选供货商品，设置售价后即可开始赚取差价利润。', en: 'No products yet — go to Procure & list, pick supply items, set your price, and start earning margin.', de: 'Noch keine Produkte – gehen Sie zu „Beschaffen & listen“, wählen Sie Artikel, setzen Sie Ihren Preis und verdienen Sie Marge.', ja: 'ショップに商品がありません。「仕入れ・出品」から商品を選び、販売価格を設定して差益を得ましょう。', ko: '쇼핑몰에 상품이 없습니다. \'구매·등록\'에서 상품을 선택하고 판매가를 설정해 차익을 시작하세요.', es: 'Aún no hay productos — ve a Comprar y publicar, elige artículos del catálogo y empieza a ganar margen.', it: 'Nessun prodotto — vai ad Acquista e pubblica, scegli articoli dal catalogo e inizia a guadagnare margine.', vi: 'Chưa có sản phẩm — vào Mua hàng & đăng bán, chọn hàng từ kho cung ứng và bắt đầu kiếm lời.', fr: 'Aucun produit pour l\'instant : accédez à Acheter et répertorier, sélectionnez les articles de fourniture, fixez votre prix et commencez à gagner une marge.'}),
        actionLabel: tr(lang, { zh: '去采购上架', en: 'Procure & list', de: 'Einkaufen & einlisten', ja: '仕入れ・出品へ', ko: '구매·등록', es: 'Comprar y publicar', it: 'Acquista e pubblica', vi: 'Mua hàng & đăng bán', fr: 'Procurer et lister'}),
        onAction: () => setTab('procure'),
      }
    }

    if (offSaleCount > 0 && onSaleCount === 0) {
      return {
        text: tr(lang, {
          zh: `全部 ${total} 件商品均已下架，建议检查库存与定价后重新上架，恢复店铺曝光。`,
          en: `All ${total} product(s) are unlisted — review stock and pricing, then relist to restore visibility.`,
          de: `Alle ${total} Produkte sind nicht gelistet — prüfen Sie Bestand und Preise und listen Sie sie erneut ein.`, ja: `全${total}点の商品が出品停止中です。在庫と価格を確認のうえ再出品すると、ショップの露出が回復します。`, ko: '전체 ${total}개 상품이 판매 중지 상태입니다. 재고와 가격을 확인한 뒤 재등록하면 노출이 회복됩니다.', es: `Los ${total} productos están retirados — revisa stock y precios, vuelve a publicarlos para recuperar visibilidad.`, it: `Tutti i ${total} prodotti sono non pubblicati — controlla stock e prezzi, poi ripubblica per recuperare visibilità.`, vi: `Tất cả ${total} sản phẩm đã ngừng bán — kiểm tra tồn kho và giá, rồi đăng lại để khôi phục hiển thị.`}),
        actionLabel: tr(lang, { zh: '查看已下架', en: 'View unlisted', de: 'Nicht gelistete anzeigen', ja: '出品停止を表示', ko: '판매 중지 보기', es: 'Ver retirados', it: 'Vedi non pubblicati', vi: 'Xem đã ngừng bán', fr: 'Afficher non répertorié'}),
        onAction: () => applyWarehouseStat('off'),
      }
    }

    if (offSaleCount > 0) {
      return {
        text: tr(lang, {
          zh: `在售 ${onSaleCount} 件，已下架 ${offSaleCount} 件。下架商品不会获得曝光，可考虑优化后重新上架。`,
          en: `${onSaleCount} on sale, ${offSaleCount} unlisted. Unlisted items get no exposure — consider optimizing and relisting.`,
          de: `${onSaleCount} im Verkauf, ${offSaleCount} nicht gelistet. Nicht gelistete Artikel erhalten keine Sichtbarkeit — optimieren und erneut einlisten.`, ja: `販売中 ${onSaleCount} 点、出品停止 ${offSaleCount} 点。出品停止中の商品は露出されません。最適化のうえ再出品をご検討ください。`, ko: '판매 중 ${onSaleCount}개, 판매 중지 ${offSaleCount}개. 판매 중지 상품은 노출되지 않습니다. 최적화 후 재등록을 고려해 보세요.', es: `${onSaleCount} en venta, ${offSaleCount} retirados. Los retirados no tienen visibilidad — optimiza y vuelve a publicar.`, it: `${onSaleCount} in vendita, ${offSaleCount} non pubblicati. I non pubblicati non hanno visibilità — valuta di ottimizzare e ripubblicare.`, vi: `${onSaleCount} đang bán, ${offSaleCount} đã ngừng bán. Sản phẩm ngừng bán không được hiển thị — cân nhắc tối ưu và đăng lại.`}),
        actionLabel: tr(lang, { zh: '查看已下架', en: 'View unlisted', de: 'Nicht gelistete anzeigen', ja: '出品停止を表示', ko: '판매 중지 보기', es: 'Ver retirados', it: 'Vedi non pubblicati', vi: 'Xem đã ngừng bán', fr: 'Afficher non répertorié'}),
        onAction: () => applyWarehouseStat('off'),
      }
    }

    if (q) {
      return {
        text: tr(lang, {
          zh: `搜索到 ${filtered.length} 件相关商品（店铺共 ${total} 件）。`,
          en: `Found ${filtered.length} matching product(s) out of ${total} total.`,
          de: `${filtered.length} passende Produkte gefunden (insgesamt ${total} im Shop).`, ja: `関連商品 ${filtered.length} 点が見つかりました（ショップ合計 ${total} 点）。`, ko: '관련 상품 ${filtered.length}개를 찾았습니다(쇼핑몰 전체 ${total}개).', es: `Se encontraron ${filtered.length} productos relacionados (de ${total} en total).`, it: `Trovati ${filtered.length} prodotti corrispondenti su ${total} totali.`, vi: `Tìm thấy ${filtered.length} sản phẩm phù hợp trong tổng ${total}.`}),
      }
    }

    if (statusFilter === 'on') {
      return {
        text: tr(lang, {
          zh: `当前查看在售商品 ${filtered.length} 件，点击顶部统计卡片可切换筛选。`,
          en: `Viewing ${filtered.length} on-sale product(s). Use the stat cards above to switch filters.`,
          de: `${filtered.length} Produkte im Verkauf. Nutzen Sie die Statistik-Karten oben zum Filtern.`, ja: `販売中の商品 ${filtered.length} 点を表示中。上部の統計カードでフィルターを切り替えられます。`, ko: '판매 중인 상품 ${filtered.length}개를 보고 있습니다. 상단 통계 카드로 필터를 전환할 수 있습니다.', es: `Viendo ${filtered.length} productos en venta. Usa las tarjetas superiores para cambiar filtros.`, it: `Visualizzazione di ${filtered.length} prodotti in vendita. Usa le schede sopra per cambiare filtro.`, vi: `Đang xem ${filtered.length} sản phẩm đang bán. Dùng thẻ thống kê phía trên để đổi bộ lọc.`}),
      }
    }

    if (statusFilter === 'off') {
      return {
        text: tr(lang, {
          zh: `当前查看已下架商品 ${filtered.length} 件，重新上架后可恢复店铺曝光。`,
          en: `Viewing ${filtered.length} unlisted product(s). Relist them to restore shop visibility.`,
          de: `${filtered.length} nicht gelistete Produkte. Nach dem Einlisten wird die Sichtbarkeit wiederhergestellt.`, ja: `出品停止中の商品 ${filtered.length} 点を表示中。再出品するとショップの露出が回復します。`, ko: '판매 중지 상품 ${filtered.length}개를 보고 있습니다. 재등록하면 쇼핑몰 노출이 회복됩니다.', es: `Viendo ${filtered.length} productos retirados. Vuelve a publicarlos para recuperar visibilidad.`, it: `Visualizzazione di ${filtered.length} prodotti non pubblicati. Ripubblicali per recuperare visibilità.`, vi: `Đang xem ${filtered.length} sản phẩm đã ngừng bán. Đăng lại để khôi phục hiển thị.`}),
      }
    }

    if (onSaleCount > 0 && recommendedCount === 0) {
      return {
        text: tr(lang, {
          zh: `当前 ${onSaleCount} 件商品在售，建议设置 1–3 款主推商品，有助于提升转化与曝光权重。`,
          en: `${onSaleCount} product(s) on sale — set 1–3 featured items to improve conversion and visibility.`,
          de: `${onSaleCount} Produkte im Verkauf — setzen Sie 1–3 Highlight-Artikel für bessere Conversion und Sichtbarkeit.`, ja: `現在 ${onSaleCount} 点が販売中です。1〜3点のおすすめ商品を設定すると、コンバージョンと露出の向上に役立ちます。`, ko: '현재 ${onSaleCount}개 상품이 판매 중입니다. 1~3개의 추천 상품을 설정하면 전환율과 노출을 높일 수 있습니다.', es: `${onSaleCount} productos en venta — destaca 1–3 para mejorar conversión y visibilidad.`, it: `${onSaleCount} prodotti in vendita — imposta 1–3 articoli in evidenza per migliorare conversione e visibilità.`, vi: `${onSaleCount} sản phẩm đang bán — đặt 1–3 sản phẩm nổi bật để tăng chuyển đổi và hiển thị.`}),
      }
    }

    return {
      text: tr(lang, {
        zh: `共 ${total} 件商品运行中，保持商品信息更新与合理定价有助于持续出单。`,
        en: `${total} product(s) in your catalog — keep listings fresh and priced well for steady orders.`,
        de: `${total} Produkte im Katalog — aktuelle Infos und faire Preise fördern kontinuierliche Bestellungen.`, ja: `合計${total}点の商品を運用中です。情報の更新と適正な価格設定が継続的な受注につながります。`, ko: '총 ${total}개 상품을 운영 중입니다. 정보를 최신으로 유지하고 적정 가격을 유지하면 꾸준한 주문으로 이어집니다.', es: `${total} productos en tu catálogo — mantén la información y precios actualizados para pedidos constantes.`, it: `${total} prodotti nel catalogo — mantieni informazioni e prezzi aggiornati per ordini costanti.`, vi: `${total} sản phẩm trong kho — cập nhật thông tin và giá hợp lý để có đơn ổn định.`}),
    }
  }, [
    myProducts.length,
    offSaleCount,
    onSaleCount,
    recommendedCount,
    search,
    statusFilter,
    filtered.length,
    lang,
  ])

  React.useEffect(() => {
    setMinePage(1)
  }, [search, statusFilter])

  React.useEffect(() => {
    setProcurePage(1)
  }, [procureSearch, procureCategoryId])

  // 初次与切换到「我的商品」时：先尝试使用缓存，随后再从后端静默刷新
  useEffect(() => {
    if (tab !== 'mine') return
    if (shopId) {
      try {
        const raw =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(`merchantWarehouse:mine:${shopId}`)
            : null
        if (raw) {
          const cached = JSON.parse(raw) as WarehouseItem[]
          if (Array.isArray(cached)) {
            setMyProducts(
              cached.map((p) => ({
                ...p,
                recommended: p.status === 'on' && Boolean(p.recommended),
              })),
            )
          }
        }
      } catch {
        // ignore cache error
      }
    }
    loadMineProducts()
  }, [tab, shopId])

  useMerchantSync(['warehouse', 'all'], () => {
    if (tab === 'mine' && shopId) loadMineProducts()
  }, { enabled: tab === 'mine' && !!shopId, immediate: false })

  // 记住最近一次采购筛选（分类 + 搜索），避免来回切页重选
  React.useEffect(() => {
    try {
      const payload = {
        procureCategoryId,
        procureSearch,
        procureSearchInput,
      }
      window.localStorage.setItem(
        'merchantProcureFilter',
        JSON.stringify(payload),
      )
    } catch {
      // ignore
    }
  }, [procureCategoryId, procureSearch, procureSearchInput])

  React.useEffect(() => {
    // 初次加载时尝试恢复上一次的筛选条件
    try {
      const raw = window.localStorage.getItem('merchantProcureFilter')
      if (!raw) return
      const data = JSON.parse(raw) as {
        procureCategoryId?: string
        procureSearch?: string
        procureSearchInput?: string
      }
      if (data.procureCategoryId != null) {
        setProcureCategoryId(data.procureCategoryId)
      }
      if (data.procureSearch != null) {
        setProcureSearch(data.procureSearch)
      }
      if (data.procureSearchInput != null) {
        setProcureSearchInput(data.procureSearchInput)
      }
    } catch {
      // ignore
    }
  }, [])

  // 加载大分类（一级分类）供筛选使用
  React.useEffect(() => {
    if (procureCategoriesLoaded) return
    let cancelled = false
    const loadCategories = async () => {
      try {
        const res = await api.get<{ list: CategoryItem[] }>('/api/categories')
        if (cancelled) return
        const list = Array.isArray(res.list) ? res.list : []
        const top = list.filter((c) => !c.parent_id || c.level === 1)
        const mapped = top.map((c) => ({
          id: c.id,
          label: formatCategoryLabel(lang, c.name),
        }))
        const nonEmpty = mapped.filter((c) => c.label.trim() !== '')
        const empty = mapped.filter((c) => c.label.trim() === '')
        const finalList = [
          { id: '', label: tr(lang, { zh: '全部', en: 'All', de: 'Alle', ja: 'すべて', ko: '전체', es: 'Todos', it: 'Tutti', vi: 'Tất cả', fr: 'Tous'}) },
          ...nonEmpty,
          ...empty.map((c) => ({
            ...c,
            label: c.id || (tr(lang, { zh: '未命名分类', en: 'Untitled category', de: 'Unbenannte Kategorie', ja: '名称未設定のカテゴリ', ko: '이름 없는 카테고리', es: 'Categoría sin nombre', it: 'Categoria senza nome', vi: 'Danh mục chưa đặt tên', fr: 'Catégorie sans titre'})),
          })),
        ]
        setProcureCategories(finalList)
      } catch {
        if (!cancelled) {
          setProcureCategories([{ id: '', label: tr(lang, { zh: '全部', en: 'All', de: 'Alle', ja: 'すべて', ko: '전체', es: 'Todos', it: 'Tutti', vi: 'Tất cả', fr: 'Tous'}) }])
        }
      } finally {
        if (!cancelled) setProcureCategoriesLoaded(true)
      }
    }
    loadCategories()
    return () => {
      cancelled = true
    }
  }, [procureCategoriesLoaded, lang])

  // 语言切换时重新加载分类，保证标签语言同步
  React.useEffect(() => {
    setProcureCategoriesLoaded(false)
  }, [lang])

  // 加载供货商品（来自后端），并做静默轮询，确保上下架状态实时同步
  React.useEffect(() => {
    if (tab !== 'procure') return
    let cancelled = false

    const fetchSupply = async (silent = false) => {
      if (!silent) setProcureLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', String(PAGE_SIZE))
        params.set('offset', String((procurePage - 1) * PAGE_SIZE))
        if (procureCategoryId) params.set('categoryId', procureCategoryId)
        if (procureSearch.trim()) params.set('search', procureSearch.trim())
        const res = await api.get<{
          list: Array<{
            id: string
            title: string
            image: string
            images?: string[]
            purchasePrice: number | null
            price: number
            category: string
            subCategory: string
            status?: 'on' | 'off'
          }>
          total: number
        }>(`/api/products/supply?${params.toString()}`)
        if (cancelled) return
        const list = Array.isArray(res.list) ? res.list : []
        const mapped: CatalogItem[] = list.map((row) => {
          const imgs = Array.isArray(row.images)
            ? row.images.filter((src) => typeof src === 'string' && src)
            : row.image
            ? [row.image]
            : []
          return {
            id: row.id,
            name: row.title,
            supplyPrice: row.purchasePrice ?? 0,
            suggestedPrice: row.price,
            category: formatCategoryLabel(lang, row.category),
            images: imgs,
            description: '',
            styles: [],
            status: row.status === 'off' ? 'off' : 'on',
          }
        })
        setProcureList(mapped)
        setProcureTotal(Number(res.total) || mapped.length)
      } catch {
        if (!cancelled) {
          setProcureList([])
          setProcureTotal(0)
        }
      } finally {
        if (!cancelled && !silent) setProcureLoading(false)
      }
    }

    // 首次进入或筛选变化时请求一次
    fetchSupplyRef.current = fetchSupply
    fetchSupply(false)
    return () => {
      cancelled = true
    }
  }, [tab, procurePage, procureCategoryId, procureSearch, lang])

  useMerchantSync(['warehouse', 'all'], () => {
    if (tab === 'procure') fetchSupplyRef.current(true)
  }, { enabled: tab === 'procure', immediate: false })

  const getCatalogImageIndex = (item: CatalogItem) => {
    const total = item.images.length
    if (total <= 1) return 0
    const idx = catalogImageIndex[item.id] ?? 0
    if (idx < 0 || idx >= total) return 0
    return idx
  }

  const getMineImageIndex = (item: WarehouseItem) => {
    const total = item.images?.length ?? 0
    if (total <= 1) return 0
    const idx = mineImageIndex[item.id] ?? 0
    if (idx < 0 || idx >= total) return 0
    return idx
  }

  // 采购卡片主图自动轮播
  useEffect(() => {
    if (tab !== 'procure') return
    if (!procureList.some((item) => item.images.length > 1)) return
    const timer = window.setInterval(() => {
      setCatalogImageIndex((prev) => {
        const next: Record<string, number> = { ...prev }
        procureList.forEach((item) => {
          const total = item.images.length
          if (total > 1) {
            const current = prev[item.id] ?? 0
            next[item.id] = (current + 1) % total
          }
        })
        return next
      })
    }, 3000)
    return () => {
      window.clearInterval(timer)
    }
  }, [tab, procureList])

  // 我的商品卡片主图自动轮播（不改变卡片样式，只轮换主图）
  useEffect(() => {
    if (tab !== 'mine') return
    if (!myProducts.some((item) => item.images && item.images.length > 1)) return
    const timer = window.setInterval(() => {
      setMineImageIndex((prev) => {
        const next: Record<string, number> = { ...prev }
        myProducts.forEach((item) => {
          const total = item.images?.length ?? 0
          if (total > 1) {
            const current = prev[item.id] ?? 0
            next[item.id] = (current + 1) % total
          }
        })
        return next
      })
    }, 3000)
    return () => {
      window.clearInterval(timer)
    }
  }, [tab, myProducts])

  const openConfirmModal = (
    item: WarehouseItem,
    action: 'list' | 'unlist' | 'delete' | 'recommend' | 'unrecommend' | 'recommend_blocked',
  ) => {
    if (action === 'recommend' && item.status === 'off') {
      setConfirmModal({ item, action: 'recommend_blocked' })
      return
    }
    if (
      action !== 'recommend' &&
      action !== 'unrecommend' &&
      action !== 'recommend_blocked' &&
      !item.productId
    ) {
      showToast(tr(lang, { zh: '商品数据异常', en: 'Product data error', de: 'Produktdatenfehler', ja: '商品データに異常があります', ko: '상품 데이터 오류', es: 'Error en los datos del producto', it: 'Errore dati prodotto', vi: 'Lỗi dữ liệu sản phẩm', fr: 'Erreur de données produit'}), 'error')
      return
    }
    if (!shopId) {
      showToast(
        tr(lang, { zh: '未登录商家或未绑定店铺', en: 'Not logged in or shop not bound', de: 'Nicht angemeldet oder Shop nicht verknüpft', ja: '未ログイン、またはショップが紐付けられていません', ko: '로그인되지 않았거나 쇼핑몰이 연결되지 않았습니다', es: 'Sin sesión o tienda no vinculada', it: 'Sessione assente o negozio non collegato', vi: 'Chưa đăng nhập hoặc chưa liên kết cửa hàng', fr: 'Non connecté ou boutique non liée'}),
        'error',
      )
      return
    }
    setConfirmModal({ item, action })
  }

  const handleConfirmAction = async () => {
    if (!confirmModal || !shopId) return
    const { item, action } = confirmModal
    setConfirmLoading(true)
    try {
      if (action === 'delete') {
        const wasFeatured = item.recommended
        await api.delete(
          `/api/shop-products/${shopId}/${encodeURIComponent(item.productId)}?permanent=1`,
        )
        showToast(
          wasFeatured
            ? tr(lang, {
                zh: '已删除，并已自动取消主推',
                en: 'Deleted and removed from featured',
                de: 'Gelöscht und Highlight entfernt', ja: '削除し、おすすめも自動解除しました', ko: '삭제되었으며 추천도 자동 해제되었습니다', es: 'Eliminado y quitado de destacados', it: 'Eliminato e rimosso da in evidenza', vi: 'Đã xóa và gỡ khỏi sản phẩm nổi bật'})
            : tr(lang, { zh: '已删除', en: 'Deleted from shop', de: 'Gelöscht', ja: '削除しました', ko: '삭제되었습니다', es: 'Eliminado de la tienda', it: 'Eliminato dal negozio', vi: 'Đã xóa khỏi cửa hàng', fr: 'Supprimé de la boutique'}),
        )
        loadMineProducts()
      } else if (action === 'unlist') {
        const wasFeatured = item.recommended
        await api.delete(`/api/shop-products/${shopId}/${encodeURIComponent(item.productId)}`)
        if (wasFeatured) {
          const userId = getAuthUserId()
          if (userId) {
            try {
              await api.delete(
                `/api/shops/${shopId}/recommendations/${encodeURIComponent(item.id)}?userId=${encodeURIComponent(userId)}`,
              )
            } catch {
              // 后端下架接口也会清理主推，此处为兜底
            }
          }
        }
        setMyProducts((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: 'off' as const, recommended: false } : p,
          ),
        )
        showToast(
          wasFeatured
            ? tr(lang, {
                zh: '已下架，并已自动取消主推',
                en: 'Unlisted and removed from featured',
                de: 'Entfernt und Highlight aufgehoben', ja: '出品停止し、おすすめも自動解除しました', ko: '판매 중지되었으며 추천도 자동 해제되었습니다', es: 'Retirado y quitado de destacados', it: 'Rimosso e tolto da in evidenza', vi: 'Đã ngừng bán và gỡ khỏi nổi bật'})
            : tr(lang, { zh: '已下架', en: 'Unlisted from shop', de: 'Aus dem Shop entfernt', ja: '出品停止', ko: '판매가 중지되었습니다', es: 'Retirado de la tienda', it: 'Rimosso dal negozio', vi: 'Đã ngừng bán trên cửa hàng', fr: 'Non répertorié dans la boutique'}),
        )
        loadMineProducts()
      } else if (action === 'recommend_blocked') {
        setConfirmModal({ item, action: 'list' })
        return
      } else if (action === 'recommend' || action === 'unrecommend') {
        const userId = getAuthUserId()
        if (!userId) {
          showToast(tr(lang, { zh: '请先登录', en: 'Please log in first', de: 'Bitte zuerst anmelden', ja: '先にログインしてください', ko: '먼저 로그인해 주세요', es: 'Inicia sesión primero', it: 'Accedi prima', vi: 'Vui lòng đăng nhập trước', fr: 'Veuillez d\'abord vous connecter'}), 'error')
          return
        }
        if (action === 'recommend') {
          if (item.status === 'off') {
            setConfirmModal({ item, action: 'recommend_blocked' })
            return
          }
          await api.post(`/api/shops/${shopId}/recommendations`, {
            userId,
            listingId: item.id,
          })
          setMyProducts((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, recommended: true } : p)),
          )
          showToast(tr(lang, { zh: '已设为主推', en: 'Set as featured', de: 'Als Highlight gesetzt', ja: 'おすすめに設定しました', ko: '추천으로 설정', es: 'Marcar como destacado', it: 'Imposta come in evidenza', vi: 'Đặt làm nổi bật', fr: 'Définir comme présenté'}))
        } else {
          await api.delete(
            `/api/shops/${shopId}/recommendations/${encodeURIComponent(item.id)}?userId=${encodeURIComponent(userId)}`,
          )
          setMyProducts((prev) =>
            prev.map((p) => (p.id === item.id ? { ...p, recommended: false } : p)),
          )
          showToast(tr(lang, { zh: '已取消主推', en: 'Removed from featured', de: 'Highlight entfernt', ja: 'おすすめを解除しました', ko: '추천이 해제되었습니다', es: 'Quitado de destacados', it: 'Rimosso da in evidenza', vi: 'Đã gỡ khỏi sản phẩm nổi bật', fr: 'Supprimé de la sélection'}))
        }
      } else if (action === 'list') {
        await api.post('/api/shop-products', {
          shopId,
          productId: item.productId,
          price: item.price,
        })
        showToast(tr(lang, { zh: '已上架', en: 'Listed to shop', de: 'Im Shop gelistet', ja: '出品済み', ko: '쇼핑몰에 등록되었습니다', es: 'Publicado en la tienda', it: 'Pubblicato nel negozio', vi: 'Đã đăng bán trên cửa hàng', fr: 'Inscrit à la boutique'}))
        loadMineProducts()
      }
      setConfirmModal(null)
    } catch {
      const errorMessage =
        action === 'delete'
          ? tr(lang, { zh: '删除失败', en: 'Failed to delete', de: 'Löschen fehlgeschlagen', ja: '削除に失敗しました', ko: '삭제에 실패했습니다', es: 'Error al eliminar', it: 'Eliminazione non riuscita', vi: 'Xóa thất bại', fr: 'Échec de la suppression'})
          : action === 'unlist'
            ? tr(lang, { zh: '下架失败', en: 'Failed to unlist', de: 'Auslistung fehlgeschlagen', ja: '出品停止に失敗しました', ko: '판매 중지에 실패했습니다', es: 'Error al retirar', it: 'Rimozione non riuscita', vi: 'Ngừng bán thất bại', fr: 'Échec de la désinscription'})
            : action === 'recommend'
              ? tr(lang, { zh: '设置失败', en: 'Failed to set featured', de: 'Als Empfehlung setzen fehlgeschlagen', ja: '設定に失敗しました', ko: '추천 설정에 실패했습니다', es: 'Error al marcar como destacado', it: 'Impossibile impostare in evidenza', vi: 'Đặt nổi bật thất bại', fr: 'Échec de la définition de la vedette'})
              : action === 'unrecommend'
                ? tr(lang, { zh: '取消失败', en: 'Failed to remove featured', de: 'Empfehlung entfernen fehlgeschlagen', ja: '解除に失敗しました', ko: '추천 해제에 실패했습니다', es: 'Error al quitar de destacados', it: 'Impossibile rimuovere da in evidenza', vi: 'Gỡ nổi bật thất bại', fr: 'Échec de la suppression de la vedette'})
                : tr(lang, { zh: '上架失败', en: 'Failed to list', de: 'Failed to list', ja: '出品に失敗しました', ko: '등록에 실패했습니다', es: 'Error al publicar', it: 'Pubblicazione non riuscita', vi: 'Đăng bán thất bại', fr: 'Échec de la liste'})
      showToast(errorMessage, 'error')
    } finally {
      setConfirmLoading(false)
    }
  }

  const confirmModalCopy = useMemo(() => {
    if (!confirmModal) return null
    const { item, action } = confirmModal
    const isFeatured = Boolean(item.recommended)

    if (action === 'list') {
      return {
        variant: 'brand' as MerchantConfirmVariant,
        title: tr(lang, { zh: '确认上架售卖？', en: 'List for sale?', de: 'Zum Verkauf einlisten?', ja: '出品しますか？', ko: '판매 등록하시겠습니까?', es: '¿Publicar a la venta?', it: 'Pubblicare in vendita?', vi: 'Đăng bán sản phẩm?', fr: 'Liste à vendre ?'}),
        subtitle:
          tr(lang, { zh: '上架后买家可在店铺正常购买该商品。', en: 'Buyers will be able to purchase this item in your shop.', de: 'Käufer können diesen Artikel in Ihrem Shop kaufen.', ja: '出品後、購入者はショップでこの商品を購入できます。', ko: '등록 후 구매자가 쇼핑몰에서 이 상품을 구매할 수 있습니다.', es: 'Los compradores podrán adquirir este producto en tu tienda.', it: 'Gli acquirenti potranno acquistare questo articolo nel tuo negozio.', vi: 'Người mua có thể mua sản phẩm này tại cửa hàng của bạn.', fr: 'Les acheteurs pourront acheter cet article dans votre boutique.'}),
        confirmLabel: tr(lang, { zh: '确认上架', en: 'List for sale', de: 'Zum Verkauf einlisten', ja: '出品を確認', ko: '판매 등록', es: 'Publicar a la venta', it: 'Pubblica in vendita', vi: 'Đăng bán', fr: 'Liste à vendre'}),
      }
    }

    if (action === 'unlist') {
      return {
        variant: 'warning' as MerchantConfirmVariant,
        title: tr(lang, { zh: '确认下架商品？', en: 'Unlist this product?', de: 'Produkt entfernen?', ja: 'この商品の出品を停止しますか？', ko: '이 상품의 판매를 중지하시겠습니까?', es: '¿Retirar este producto?', it: 'Rimuovere questo prodotto?', vi: 'Ngừng bán sản phẩm này?', fr: 'Supprimer ce produit ?'}),
        subtitle: isFeatured
          ? tr(lang, {
              zh: '该商品当前为主推商品。下架后用户将无法购买，并会自动取消主推展示。',
              en: 'This item is currently featured. After unlisting, customers cannot purchase it and featured status will be removed automatically.',
              de: 'Dieser Artikel ist aktuell hervorgehoben. Nach dem Entfernen können Kunden nicht mehr kaufen; der Highlight-Status wird automatisch entfernt.', ja: 'この商品は現在おすすめです。出品停止後は購入できなくなり、おすすめも自動解除されます。', ko: '이 상품은 현재 추천 상품입니다. 판매 중지 후 구매할 수 없으며 추천도 자동 해제됩니다.', es: 'Este producto está destacado. Al retirarlo, no se podrá comprar y se quitará automáticamente de destacados.', it: 'Questo articolo è attualmente in evidenza. Dopo la rimozione non sarà acquistabile e lo stato in evidenza verrà tolto automaticamente.', vi: 'Sản phẩm này đang nổi bật. Sau khi ngừng bán, khách không thể mua và trạng thái nổi bật sẽ tự động bị gỡ.'})
          : tr(lang, {
              zh: '下架后用户将无法购买该商品。',
              en: 'Customers will no longer be able to purchase this item.',
              de: 'Kunden können diesen Artikel danach nicht mehr kaufen.', ja: '出品停止後、購入者はこの商品を購入できなくなります。', ko: '판매 중지 후 구매자는 이 상품을 구매할 수 없습니다.', es: 'Los clientes ya no podrán comprar este producto.', it: 'Gli clienti non potranno più acquistare questo articolo.', vi: 'Khách hàng sẽ không thể mua sản phẩm này nữa.'}),
        confirmLabel: tr(lang, { zh: '确认下架', en: 'Unlist product', de: 'Produkt entfernen', ja: '出品停止を確認', ko: '판매 중지', es: 'Retirar producto', it: 'Rimuovi prodotto', vi: 'Ngừng bán sản phẩm', fr: 'Supprimer la liste du produit'}),
      }
    }

    if (action === 'recommend_blocked') {
      return {
        variant: 'warning' as MerchantConfirmVariant,
        title: tr(lang, { zh: '无法设为主推', en: 'Cannot set as featured', de: 'Kann nicht als Highlight gesetzt werden', ja: 'おすすめに設定できません', ko: '추천으로 설정할 수 없습니다', es: 'No se puede marcar como destacado', it: 'Impossibile impostare in evidenza', vi: 'Không thể đặt làm nổi bật', fr: 'Impossible de définir comme présenté'}),
        subtitle:
          tr(lang, { zh: '该商品已下架，需先上架售卖后才能设为主推。', en: 'This product is unlisted. List it for sale before setting it as featured.', de: 'Dieses Produkt ist nicht gelistet. Listen Sie es zum Verkauf, bevor Sie es als Empfehlung setzen.', ja: 'この商品は出品停止中です。おすすめに設定する前に出品してください。', ko: '이 상품은 판매 중지 상태입니다. 추천으로 설정하기 전에 판매 등록해 주세요.', es: 'Este producto está retirado. Publícalo antes de marcarlo como destacado.', it: 'Prodotto non pubblicato. Pubblicalo in vendita prima di metterlo in evidenza.', vi: 'Sản phẩm đã ngừng bán. Hãy đăng bán trước khi đặt làm nổi bật.', fr: 'Ce produit n\'est pas répertorié. Mettez-le en vente avant de le définir comme présenté.'}),
        confirmLabel: tr(lang, { zh: '去上架', en: 'List for sale', de: 'Einlisten', ja: '出品する', ko: '판매 등록', es: 'Publicar a la venta', it: 'Pubblica in vendita', vi: 'Đăng bán', fr: 'Liste à vendre'}),
      }
    }

    if (action === 'recommend') {
      return {
        variant: 'brand' as MerchantConfirmVariant,
        title: tr(lang, { zh: '确认设为主推？', en: 'Set as featured?', de: 'Als Highlight setzen?', ja: 'おすすめに設定しますか？', ko: '추천으로 설정하시겠습니까?', es: '¿Marcar como destacado?', it: 'Impostare come in evidenza?', vi: 'Đặt làm sản phẩm nổi bật?', fr: 'Définir comme présenté ?'}),
        subtitle:
          tr(lang, { zh: '主推商品将在店铺「推荐」专区优先展示，并出现在商品详情页的店铺推荐中，有助于提升曝光与转化。建议设置 1–3 款主推商品。', en: 'Featured items appear first in your shop’s Recommended section and in product detail recommendations, helping boost visibility and conversion. We suggest featuring 1–3 items.', de: 'Empfohlene Artikel erscheinen zuerst im Bereich „Empfohlen“ und in Produktempfehlungen – das steigert Sichtbarkeit und Conversion. Wir empfehlen 1–3 Artikel.', ja: 'おすすめ商品はショップの「おすすめ」セクションや商品詳細ページで優先表示され、露出とコンバージョンの向上に役立ちます。1〜3点の設定をおすすめします。', ko: '추천 상품은 쇼핑몰 \'추천\' 섹션과 상품 상세 페이지에서 우선 노출되어 전환율과 노출 향상에 도움이 됩니다. 1~3개 설정을 권장합니다.', es: 'Los productos destacados aparecen primero en la sección Recomendados y en las sugerencias del detalle, lo que mejora visibilidad y conversión. Recomendamos destacar 1–3 productos.', it: 'Gli articoli in evidenza compaiono per primi nella sezione Consigliati e nelle raccomandazioni del dettaglio prodotto, migliorando visibilità e conversione. Consigliamo 1–3 articoli in evidenza.', vi: 'Sản phẩm nổi bật hiển thị ưu tiên trong mục Gợi ý và trang chi tiết, giúp tăng độ hiển thị và chuyển đổi. Nên chọn 1–3 sản phẩm.', fr: 'Les articles en vedette apparaissent en premier dans la section Recommandés de votre boutique et dans les recommandations détaillées sur les produits, ce qui contribue à augmenter la visibilité et la conversion. Nous vous suggérons de présenter 1 à 3 éléments.'}),
        confirmLabel: tr(lang, { zh: '确认主推', en: 'Set featured', de: 'Als Highlight setzen', ja: 'おすすめを確認', ko: '추천 설정', es: 'Destacar', it: 'Imposta in evidenza', vi: 'Đặt nổi bật', fr: 'Définir en vedette'}),
      }
    }

    if (action === 'unrecommend') {
      return {
        variant: 'warning' as MerchantConfirmVariant,
        title: tr(lang, { zh: '确认取消主推？', en: 'Remove from featured?', de: 'Highlight entfernen?', ja: 'おすすめを解除しますか？', ko: '추천을 해제하시겠습니까?', es: '¿Quitar de destacados?', it: 'Rimuovere da in evidenza?', vi: 'Gỡ khỏi sản phẩm nổi bật?', fr: 'Supprimer de la sélection ?'}),
        subtitle:
          tr(lang, { zh: '取消后该商品将不再在店铺「推荐」专区优先展示。', en: 'This item will no longer be prioritized in your shop’s Recommended section.', de: 'Dieser Artikel wird im Bereich „Empfohlen“ nicht mehr priorisiert.', ja: '解除後、この商品はショップの「おすすめ」セクションで優先表示されなくなります。', ko: '해당 상품은 쇼핑몰 \'추천\' 섹션에서 더 이상 우선 노출되지 않습니다.', es: 'Este producto ya no tendrá prioridad en la sección Recomendados.', it: 'Questo articolo non avrà più priorità nella sezione Consigliati del negozio.', vi: 'Sản phẩm sẽ không còn ưu tiên trong mục Gợi ý của cửa hàng.', fr: 'Cet article ne sera plus prioritaire dans la section Recommandé de votre boutique.'}),
        confirmLabel: tr(lang, { zh: '确认取消主推', en: 'Remove featured', de: 'Highlight entfernen', ja: 'おすすめ解除を確認', ko: '추천 해제', es: 'Quitar destacado', it: 'Rimuovi da in evidenza', vi: 'Gỡ nổi bật', fr: 'Supprimer la vedette'}),
      }
    }

    return {
      variant: 'danger' as MerchantConfirmVariant,
      title: tr(lang, { zh: '确认删除商品？', en: 'Delete this product?', de: 'Produkt löschen?', ja: 'この商品を削除しますか？', ko: '이 상품을 삭제하시겠습니까?', es: '¿Eliminar este producto?', it: 'Eliminare questo prodotto?', vi: 'Xóa sản phẩm này?', fr: 'Supprimer ce produit ?'}),
      subtitle: isFeatured
        ? tr(lang, {
            zh: '该商品当前为主推商品。删除后将从店铺永久移除，并自动取消主推，此操作不可恢复。',
            en: 'This item is currently featured. It will be permanently removed and unfeatured. This cannot be undone.',
            de: 'Dieser Artikel ist hervorgehoben. Er wird dauerhaft entfernt und das Highlight aufgehoben. Dies kann nicht rückgängig gemacht werden.', ja: 'この商品は現在おすすめです。削除するとショップから完全に削除され、おすすめも自動解除されます。この操作は元に戻せません。', ko: '이 상품은 현재 추천 상품입니다. 삭제하면 쇼핑몰에서 영구 제거되며 추천도 자동 해제됩니다. 되돌릴 수 없습니다.', es: 'Este producto está destacado. Se eliminará permanentemente y se quitará de destacados. Esta acción no se puede deshacer.', it: 'Questo articolo è in evidenza. Verrà eliminato permanentemente e rimosso da in evidenza. Operazione irreversibile.', vi: 'Sản phẩm này đang nổi bật. Sẽ bị xóa vĩnh viễn và gỡ nổi bật. Không thể hoàn tác.'})
        : tr(lang, {
            zh: '删除后该商品将从店铺永久移除，此操作不可恢复。',
            en: 'This item will be permanently removed from your shop. This cannot be undone.',
            de: 'Dieser Artikel wird dauerhaft aus Ihrem Shop entfernt. Dies kann nicht rückgängig gemacht werden.', ja: '削除するとショップから完全に削除されます。この操作は元に戻せません。', ko: '삭제하면 쇼핑몰에서 영구 제거됩니다. 되돌릴 수 없습니다.', es: 'Este producto se eliminará permanentemente de tu tienda. Esta acción no se puede deshacer.', it: 'Questo articolo verrà eliminato permanentemente dal negozio. Operazione irreversibile.', vi: 'Sản phẩm sẽ bị xóa vĩnh viễn khỏi cửa hàng. Không thể hoàn tác.'}),
      confirmLabel: tr(lang, { zh: '确认删除', en: 'Delete product', de: 'Produkt löschen', ja: '削除を確認', ko: '상품 삭제', es: 'Eliminar producto', it: 'Elimina prodotto', vi: 'Xóa sản phẩm', fr: 'Supprimer le produit'}),
    }
  }, [confirmModal, lang])

  /** 将采购商品加入「我的商品」并上架（售价由系统按店铺等级自动计算） */
  const addProcureAndList = (item: CatalogItem) => {
    if (!shopId) {
      showToast(
        tr(lang, { zh: '未登录商家或未绑定店铺', en: 'Not logged in or shop not bound', de: 'Nicht angemeldet oder Shop nicht verknüpft', ja: '未ログイン、またはショップが紐付けられていません', ko: '로그인되지 않았거나 쇼핑몰이 연결되지 않았습니다', es: 'Sin sesión o tienda no vinculada', it: 'Sessione assente o negozio non collegato', vi: 'Chưa đăng nhập hoặc chưa liên kết cửa hàng', fr: 'Non connecté ou boutique non liée'}),
        'error',
      )
      return
    }
    api
      .post('/api/shop-products', {
        shopId,
        productId: item.id,
      })
      .then(() => {
        showToast(
          tr(lang, { zh: '已采购并上架到店铺', en: 'Purchased and listed to your shop', de: 'Gekauft und in Ihrem Shop gelistet', ja: '仕入れてショップに出品しました', ko: '구매 후 쇼핑몰에 등록되었습니다', es: 'Comprado y publicado en tu tienda', it: 'Acquistato e pubblicato nel tuo negozio', vi: 'Đã mua và đăng bán trên cửa hàng', fr: 'Acheté et répertorié dans votre boutique'}),
        )
        setProcureDetailItem(null)
        setProcurePricingItem(null)
        setProcurePricingInput('')
        loadMineProducts()
      })
      .catch(() => {
        showToast(
          tr(lang, { zh: '采购上架失败', en: 'Failed to purchase and list', de: 'Kauf und Einlistung fehlgeschlagen', ja: '仕入れ・出品に失敗しました', ko: '구매 및 등록에 실패했습니다', es: 'Error al comprar y publicar', it: 'Acquisto e pubblicazione non riusciti', vi: 'Mua và đăng bán thất bại', fr: 'Échec de l\'achat et de la liste'}),
          'error',
        )
      })
  }

  const openProcurePricingModal = (item: CatalogItem) => {
    // 直接按系统规则定价并上架，不再弹出手动定价弹窗
    addProcureAndList(item)
  }

  /** 打开「我的商品」详情：拉取商品主图与描述，与采购详情一致展示 */
  const openMineDetail = (item: WarehouseItem) => {
    setMineDetailItem(item)
    setMineDetailImageIndex(0)
    setMineDetailEnriched(null)
    api
      .get<{ images?: string[]; image?: string; descriptionHtml?: string; detailHtml?: string }>(
        `/api/products/supply/${encodeURIComponent(item.productId)}`
      )
      .then((res) => {
        const imgs: string[] = Array.isArray(res.images)
          ? res.images.filter((src: unknown) => typeof src === 'string' && src)
          : res.image
            ? [res.image]
            : item.images?.length
              ? item.images
              : item.image
                ? [item.image]
                : []
        const desc =
          (typeof res.descriptionHtml === 'string' && res.descriptionHtml.trim()) ||
          (typeof res.detailHtml === 'string' && res.detailHtml.trim()) ||
          ''
        setMineDetailEnriched({ images: imgs, description: desc })
      })
      .catch(() => {
        const fallback = item.images?.length ? item.images : item.image ? [item.image] : []
        setMineDetailEnriched({ images: fallback, description: '' })
      })
  }

  const openProcureDetail = (item: CatalogItem) => {
    // 如果还没有加载过详情，从后端补充主图与描述
    if (!item.loaded) {
      api
        .get<{
          id: string
          title: string
          images?: string[]
          image?: string
          purchasePrice?: number | null
          price?: number | null
          descriptionHtml?: string
          detailHtml?: string
        }>(`/api/products/supply/${encodeURIComponent(item.id)}`)
        .then((res) => {
          const images: string[] = []
          if (Array.isArray(res.images)) {
            images.push(...res.images.filter((src) => typeof src === 'string' && src))
          } else if (res.image) {
            images.push(res.image)
          }
          const desc =
            (res.descriptionHtml && res.descriptionHtml.trim()) ||
            (res.detailHtml && res.detailHtml.trim()) ||
            ''
          setProcureList((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? {
                    ...p,
                    images: images.length > 0 ? images : p.images,
                    description: desc || p.description,
                    loaded: true,
                  }
                : p
            )
          )
          const merged: CatalogItem = {
            ...item,
            images: images.length > 0 ? images : item.images,
            description: desc || item.description,
            loaded: true,
          }
          setProcureDetailItem(merged)
          setDetailImageIndex(0)
        })
        .catch(() => {
          setProcureDetailItem(item)
          setDetailImageIndex(0)
        })
    } else {
      setProcureDetailItem(item)
      setDetailImageIndex(0)
    }
  }

  const detailImages = procureDetailItem?.images ?? []
  const detailTotalImages = detailImages.length
  const canPrevImage = detailTotalImages > 1 && detailImageIndex > 0
  const canNextImage = detailTotalImages > 1 && detailImageIndex < detailTotalImages - 1

  return (
    <div className="merchant-warehouse-page merchant-warehouse-page--v2">
      <header className="merchant-warehouse-header merchant-warehouse-header--v2">
        <div className="merchant-warehouse-header-top">
          <div className="merchant-warehouse-header-main">
            <span className="merchant-warehouse-header-icon" aria-hidden="true">
              <img src={warehouseHeaderIcon} alt="" className="merchant-warehouse-header-icon-img" />
            </span>
            <div className="merchant-warehouse-header-copy">
              <h1 className="merchant-warehouse-title">
                {tr(lang, { zh: '商品仓库', en: 'Product warehouse', de: 'Produktlager', ja: '商品倉庫', ko: '상품 창고', es: 'Almacén de productos', it: 'Magazzino prodotti', vi: 'Kho sản phẩm', fr: 'Entrepôt de produits'})}
              </h1>
              <p className="merchant-warehouse-subtitle">
                {tr(lang, { zh: '管理店铺商品、调整上下架，并从供货市场采购赚取利润', en: 'Manage shop products, listing status, and procure from supply market for profit.', de: 'Verwalten Sie Shop-Produkte, Listing-Status und beschaffen Sie aus dem Supply-Markt für Gewinn.', ja: 'ショップ商品の管理、出品/停止、仕入れ市場からの調達で利益を得ましょう', ko: '쇼핑몰 상품 관리, 판매 상태 조정, 공급 시장에서 구매해 수익을 창출하세요.', es: 'Administra productos, estado de publicación y compra en el mercado de proveedores para obtener ganancias.', it: 'Gestisci prodotti, stato di pubblicazione e acquisti dal mercato fornitori per ottenere profitto.', vi: 'Quản lý sản phẩm, trạng thái đăng bán và mua từ kho cung ứng để kiếm lời.', fr: 'Gérez les produits de la boutique, l\'état de la liste et achetez sur le marché d\'approvisionnement dans un but lucratif.'})}
              </p>
            </div>
          </div>
          <div
            className="merchant-warehouse-main-tabs"
            role="tablist"
            aria-label={tr(lang, { zh: '仓库视图', en: 'Warehouse views', de: 'Warehouse views', ja: '倉庫ビュー', ko: '창고 보기', es: 'Vistas del almacén', it: 'Viste magazzino', vi: 'Chế độ xem kho', fr: 'Vues d\'entrepôt'})}
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'mine'}
              className={`merchant-warehouse-tab-btn${
                tab === 'mine' ? ' merchant-warehouse-tab-btn--active' : ''
              }`}
              onClick={() => setTab('mine')}
            >
              {tr(lang, { zh: '我的商品', en: 'My products', de: 'Meine Produkte', ja: 'マイ商品', ko: '내 상품', es: 'Mis productos', it: 'I miei prodotti', vi: 'Sản phẩm của tôi', fr: 'Mes produits'})}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'procure'}
              className={`merchant-warehouse-tab-btn${
                tab === 'procure' ? ' merchant-warehouse-tab-btn--active' : ''
              }`}
              onClick={() => setTab('procure')}
            >
              {tr(lang, { zh: '采购上架', en: 'Procure & list', de: 'Einkaufen & einlisten', ja: '仕入れ・出品', ko: '구매·등록', es: 'Comprar y publicar', it: 'Acquista e pubblica', vi: 'Mua hàng & đăng bán', fr: 'Procurer et lister'})}
            </button>
          </div>
        </div>
        <div
          className="merchant-warehouse-stats"
          role="group"
          aria-label={tr(lang, { zh: '商品快捷筛选', en: 'Product quick filters', de: 'Produkt-Schnellfilter', ja: '商品クイックフィルター', ko: '상품 빠른 필터', es: 'Filtros rápidos de productos', it: 'Filtri rapidi prodotti', vi: 'Lọc sản phẩm nhanh', fr: 'Filtres rapides de produits'})}
        >
          <button
            type="button"
            className={`merchant-warehouse-stat merchant-warehouse-stat--total${
              tab === 'mine' && statusFilter === 'all' ? ' merchant-warehouse-stat--active' : ''
            }`}
            onClick={() => applyWarehouseStat('all')}
            aria-pressed={tab === 'mine' && statusFilter === 'all'}
          >
            <span className="merchant-warehouse-stat-icon" aria-hidden="true">
              <img src={warehouseTotalIcon} alt="" />
            </span>
            <div className="merchant-warehouse-stat-body">
              <span className="merchant-warehouse-stat-value">{myProducts.length}</span>
              <span className="merchant-warehouse-stat-label">
                {tr(lang, { zh: '全部商品', en: 'All products', de: 'Alle Produkte', ja: 'すべての商品', ko: '전체 상품', es: 'Todos los productos', it: 'Tutti i prodotti', vi: 'Tất cả sản phẩm', fr: 'Tous les produits'})}
              </span>
            </div>
          </button>
          <button
            type="button"
            className={`merchant-warehouse-stat merchant-warehouse-stat--on${
              tab === 'mine' && statusFilter === 'on' ? ' merchant-warehouse-stat--active' : ''
            }`}
            onClick={() => applyWarehouseStat('on')}
            aria-pressed={tab === 'mine' && statusFilter === 'on'}
          >
            <span className="merchant-warehouse-stat-icon" aria-hidden="true">
              <img src={warehouseOnIcon} alt="" />
            </span>
            <div className="merchant-warehouse-stat-body">
              <span className="merchant-warehouse-stat-value">{onSaleCount}</span>
              <span className="merchant-warehouse-stat-label">
                {tr(lang, { zh: '在售', en: 'On sale', de: 'Im Verkauf', ja: '販売中', ko: '판매 중', es: 'En venta', it: 'In vendita', vi: 'Đang bán', fr: 'En vente'})}
              </span>
            </div>
          </button>
          <button
            type="button"
            className={`merchant-warehouse-stat merchant-warehouse-stat--off${
              tab === 'mine' && statusFilter === 'off' ? ' merchant-warehouse-stat--active' : ''
            }`}
            onClick={() => applyWarehouseStat('off')}
            aria-pressed={tab === 'mine' && statusFilter === 'off'}
          >
            <span className="merchant-warehouse-stat-icon" aria-hidden="true">
              <img src={warehouseOffIcon} alt="" />
            </span>
            <div className="merchant-warehouse-stat-body">
              <span className="merchant-warehouse-stat-value">{offSaleCount}</span>
              <span className="merchant-warehouse-stat-label">
                {tr(lang, { zh: '已下架', en: 'Unlisted', de: 'Nicht gelistet', ja: '出品停止', ko: '판매 중지', es: 'Retirado', it: 'Non pubblicato', vi: 'Đã ngừng bán', fr: 'Non répertorié'})}
              </span>
            </div>
          </button>
        </div>
      </header>

      <section className="merchant-warehouse-section merchant-warehouse-section--v2">
      {tab === 'mine' && (
        <>
          <div className="merchant-warehouse-toolbar merchant-warehouse-toolbar--v2">
            <div className="merchant-warehouse-toolbar-row">
              <div className="merchant-warehouse-search-wrap">
                <span className="merchant-warehouse-search-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </span>
                <input
                  type="text"
                  className="merchant-warehouse-search"
                  placeholder={
                    tr(lang, { zh: '搜索商品编号 / 商品名称', en: 'Search by product code / name', de: 'Nach Produktcode / Name suchen', ja: '商品番号 / 商品名で検索', ko: '상품번호 / 상품명 검색', es: 'Buscar por código / nombre de producto', it: 'Cerca per codice / nome prodotto', vi: 'Tìm theo mã / tên sản phẩm', fr: 'Recherche par code produit/nom'})
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <MerchantDashboardInsight
                storageKey="merchant-warehouse-insight-dismissed"
                className="merchant-warehouse-insight"
                kicker={tr(lang, { zh: '智能摘要', en: 'Smart insight', de: 'Intelligente Zusammenfassung', ja: 'スマートサマリー', ko: '스마트 요약', es: 'Resumen inteligente', it: 'Sintesi intelligente', vi: 'Tóm tắt thông minh', fr: 'Aperçu intelligent'})}
                text={warehouseInsight.text}
                lang={lang}
                actionLabel={warehouseInsight.actionLabel}
                onAction={warehouseInsight.onAction}
              />
            </div>
          </div>

          <div className="merchant-warehouse-mine-wrap merchant-warehouse-mine-wrap--v2">
            {filtered.length === 0 ? (
              myProducts.length === 0 ? (
                <div className="merchant-warehouse-empty merchant-warehouse-empty--mine">
                  <div className="merchant-warehouse-empty-icon" aria-hidden>
                    <svg viewBox="0 0 64 64" width="72" height="72">
                      <defs>
                        <linearGradient id="warehouseEmptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#e0f2fe" />
                          <stop offset="100%" stopColor="#e5e7eb" />
                        </linearGradient>
                      </defs>
                      <rect x="8" y="20" width="48" height="32" rx="8" fill="url(#warehouseEmptyGradient)" />
                      <rect x="14" y="26" width="12" height="8" rx="2" fill="#bfdbfe" />
                      <rect x="26" y="26" width="12" height="8" rx="2" fill="#bfdbfe" />
                      <rect x="38" y="26" width="12" height="8" rx="2" fill="#bfdbfe" />
                      <rect x="18" y="38" width="12" height="4" rx="2" fill="#93c5fd" />
                      <rect x="34" y="38" width="12" height="4" rx="2" fill="#93c5fd" />
                    </svg>
                  </div>
                  <div className="merchant-warehouse-empty-title">
                    {tr(lang, { zh: '你的店铺还没有任何商品', en: 'Your shop does not have any products yet', de: 'Ihr Shop hat noch keine Produkte', ja: 'ショップに商品がまだありません', ko: '쇼핑몰에 아직 상품이 없습니다', es: 'Tu tienda aún no tiene productos', it: 'Il tuo negozio non ha ancora prodotti', vi: 'Cửa hàng của bạn chưa có sản phẩm nào', fr: 'Votre boutique n\'a pas encore de produits'})}
                  </div>
                  <div className="merchant-warehouse-empty-desc">
                    {tr(lang, { zh: '请前往「采购上架」选择商品加入店铺，开始赚取利润', en: 'Go to "Procure & list" to add products and start earning profit.', de: 'Gehen Sie zu „Beschaffen & listen“, um Produkte hinzuzufügen und Gewinn zu erzielen.', ja: '「仕入れ・出品」から商品を選んでショップに追加し、利益を得ましょう', ko: '"구매·등록"에서 상품을 선택해 쇼핑몰에 추가하고 수익을 시작하세요.', es: 'Ve a "Comprar y publicar" para agregar productos y empezar a ganar.', it: 'Vai ad «Acquista e pubblica» per aggiungere prodotti e iniziare a guadagnare.', vi: 'Vào "Mua hàng & đăng bán" để thêm sản phẩm và bắt đầu kiếm lời.', fr: 'Accédez à « Procure & list » pour ajouter des produits et commencer à réaliser des bénéfices.'})}
                  </div>
                  <button
                    type="button"
                    className="merchant-warehouse-empty-cta"
                    onClick={() => setTab('procure')}
                  >
                    {tr(lang, { zh: '去采购上架', en: 'Go to procure & list', de: 'Zum Einkauf & Einlisten', ja: '仕入れ・出品へ', ko: '구매·등록으로 이동', es: 'Ir a comprar y publicar', it: 'Vai ad acquista e pubblica', vi: 'Đi tới mua hàng & đăng bán', fr: 'Aller à l\'achat et à la liste'})}
                  </button>
                </div>
              ) : (
                <div className="merchant-warehouse-empty">
                  {tr(lang, { zh: '没有符合当前筛选条件的商品', en: 'No products match the current filters', de: 'Keine Produkte entsprechen den aktuellen Filtern', ja: '現在のフィルター条件に一致する商品がありません', ko: '현재 필터 조건에 맞는 상품이 없습니다', es: 'Ningún producto coincide con los filtros actuales', it: 'Nessun prodotto corrisponde ai filtri attuali', vi: 'Không có sản phẩm phù hợp với bộ lọc hiện tại', fr: 'Aucun produit ne correspond aux filtres actuels'})}
                </div>
              )
            ) : (
              <>
                <ul className="merchant-warehouse-cards merchant-warehouse-cards--v2">
                  {paginatedMine.map((item) => (
                    <li
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className="merchant-warehouse-card merchant-warehouse-card--v2"
                      onClick={() => openMineDetail(item)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMineDetail(item) } }}
                    >
                      <div className="merchant-warehouse-card-img-wrap">
                        {(() => {
                          const imgs =
                            item.images && item.images.length > 0
                              ? item.images
                              : item.image
                              ? [item.image]
                              : []
                          if (imgs.length === 0) {
                            return (
                              <div className="merchant-warehouse-card-img-placeholder">
                                {tr(lang, { zh: '商品图', en: 'Product image', de: 'Produktbild', ja: '商品画像', ko: '상품 이미지', es: 'Imagen del producto', it: 'Immagine prodotto', vi: 'Ảnh sản phẩm', fr: 'Image du produit'})}
                              </div>
                            )
                          }
                          const idx = getMineImageIndex(item)
                          const src = imgs[idx] ?? imgs[0]
                          return <img src={src} alt="" className="merchant-warehouse-card-img" loading="lazy" />
                        })()}
                        <span
                          className={`merchant-warehouse-card-status merchant-warehouse-card-status--${item.status}`}
                        >
                          {item.status === 'off'
                            ? tr(lang, { zh: '已下架', en: 'Unlisted', de: 'Nicht gelistet', ja: '出品停止', ko: '판매 중지', es: 'Retirado', it: 'Non pubblicato', vi: 'Đã ngừng bán', fr: 'Non répertorié'})
                            : tr(lang, { zh: '在售', en: 'On sale', de: 'Im Verkauf', ja: '販売中', ko: '판매 중', es: 'En venta', it: 'In vendita', vi: 'Đang bán', fr: 'En vente'})}
                        </span>
                      </div>
                      <div className="merchant-warehouse-card-body">
                        <div className="merchant-warehouse-card-name">{item.productName}</div>
                        <div className="merchant-warehouse-card-pricing">
                          <span className="merchant-warehouse-card-price-row">
                            <span className="merchant-warehouse-card-price-label">
                              {tr(lang, { zh: '采购价', en: 'Purchase price', de: 'Einkaufspreis', ja: '仕入れ価格', ko: '구매가', es: 'Precio de compra', it: 'Prezzo di acquisto', vi: 'Giá nhập', fr: 'Prix ​​d\'achat'})}
                            </span>
                            <span className="merchant-warehouse-card-price-value">${item.supplyPrice.toFixed(2)}</span>
                          </span>
                          <span className="merchant-warehouse-card-price-row">
                            <span className="merchant-warehouse-card-price-label">
                              {tr(lang, { zh: '定价', en: 'Selling price', de: 'Verkaufspreis', ja: '販売価格', ko: '판매가', es: 'Precio de venta', it: 'Prezzo di vendita', vi: 'Giá bán', fr: 'Prix ​​de vente'})}
                            </span>
                            <span className="merchant-warehouse-card-price-value merchant-warehouse-card-price-value--sell">${item.price.toFixed(2)}</span>
                          </span>
                          <span className="merchant-warehouse-card-price-row">
                            <span className="merchant-warehouse-card-price-label">
                              {tr(lang, { zh: '利润比', en: 'Profit ratio', de: 'Gewinnquote', ja: '利益率', ko: '이익률', es: 'Margen de ganancia', it: 'Margine di profitto', vi: 'Tỷ suất lợi nhuận', fr: 'Taux de profit'})}
                            </span>
                            <span className={`merchant-warehouse-card-profit ${item.price >= item.supplyPrice ? 'merchant-warehouse-card-profit--up' : 'merchant-warehouse-card-profit--down'}`}>
                              {profitRatio(item.price, item.supplyPrice)}
                            </span>
                          </span>
                        </div>
                        <div
                          className="merchant-warehouse-card-actions merchant-warehouse-card-actions--v2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="merchant-warehouse-card-actions-primary">
                            {item.status === 'on' ? (
                              <button
                                type="button"
                                className="merchant-warehouse-action-btn"
                                onClick={(e) => { e.stopPropagation(); openConfirmModal(item, 'unlist') }}
                              >
                                {tr(lang, { zh: '下架', en: 'Unlist', de: 'Entfernen', ja: '出品停止', ko: '판매 중지', es: 'Retirar', it: 'Rimuovi', vi: 'Ngừng bán', fr: 'Désinscrire'})}
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="merchant-warehouse-action-btn"
                                  onClick={(e) => { e.stopPropagation(); openConfirmModal(item, 'list') }}
                                >
                                  {tr(lang, { zh: '上架', en: 'List', de: 'Einlisten', ja: '出品', ko: '등록', es: 'Publicar', it: 'Pubblica', vi: 'Đăng bán', fr: 'Liste'})}
                                </button>
                                <button
                                  type="button"
                                  className="merchant-warehouse-action-btn merchant-warehouse-action-btn--danger"
                                  onClick={(e) => { e.stopPropagation(); openConfirmModal(item, 'delete') }}
                                >
                                  {tr(lang, { zh: '删除', en: 'Delete', de: 'Löschen', ja: '削除', ko: '삭제', es: 'Eliminar', it: 'Elimina', vi: 'Xóa', fr: 'Supprimer'})}
                                </button>
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            className={`merchant-warehouse-card-recommend merchant-warehouse-card-recommend--actions${
                              item.recommended ? ' merchant-warehouse-card-recommend--on' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (item.status === 'off' && !item.recommended) {
                                openConfirmModal(item, 'recommend_blocked')
                                return
                              }
                              openConfirmModal(item, item.recommended ? 'unrecommend' : 'recommend')
                            }}
                            title={
                              item.recommended
                                ? tr(lang, { zh: '取消主推', en: 'Remove from featured', de: 'Aus Empfehlungen entfernen', ja: 'おすすめ解除', ko: '추천 해제', es: 'Quitar de destacados', it: 'Remove from featured', vi: 'Gỡ khỏi nổi bật', fr: 'Supprimer de la sélection'})
                                : tr(lang, { zh: '设为主推', en: 'Set as featured', de: 'Set as featured', ja: 'おすすめに設定', ko: '추천으로 설정', es: 'Marcar como destacado', it: 'Imposta come in evidenza', vi: 'Đặt làm nổi bật', fr: 'Définir comme présenté'})
                            }
                            aria-label={
                              item.recommended
                                ? tr(lang, { zh: '取消主推', en: 'Remove from featured', de: 'Aus Empfehlungen entfernen', ja: 'おすすめ解除', ko: '추천 해제', es: 'Quitar de destacados', it: 'Remove from featured', vi: 'Gỡ khỏi nổi bật', fr: 'Supprimer de la sélection'})
                                : tr(lang, { zh: '设为主推', en: 'Set as featured', de: 'Set as featured', ja: 'おすすめに設定', ko: '추천으로 설정', es: 'Marcar como destacado', it: 'Imposta come in evidenza', vi: 'Đặt làm nổi bật', fr: 'Définir comme présenté'})
                            }
                          >
                            <span className="merchant-warehouse-card-recommend-emoji" aria-hidden>👍</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {totalMinePages > 1 && (
                  <div className="merchant-warehouse-pagination">
                    <button
                      type="button"
                      className="merchant-warehouse-page-btn"
                      disabled={minePage <= 1}
                      onClick={() => setMinePage((p) => Math.max(1, p - 1))}
                    >
                      {tr(lang, { zh: '上一页', en: 'Previous', de: 'Zurück', ja: '前へ', ko: '이전', es: 'Anterior', it: 'Precedente', vi: 'Trước', fr: 'Précédent'})}
                    </button>
                    <span className="merchant-warehouse-page-info">
                      {minePage} / {totalMinePages}
                    </span>
                    <button
                      type="button"
                      className="merchant-warehouse-page-btn"
                      disabled={minePage >= totalMinePages}
                      onClick={() => setMinePage((p) => Math.min(totalMinePages, p + 1))}
                    >
                      {tr(lang, { zh: '下一页', en: 'Next', de: 'Weiter', ja: '次へ', ko: '다음', es: 'Siguiente', it: 'Successivo', vi: 'Tiếp', fr: 'Suivant'})}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {tab === 'procure' && (
        <>
          <div className="merchant-warehouse-procure-toolbar merchant-warehouse-procure-toolbar--v2">
            <div className="merchant-warehouse-procure-toolbar-row">
              <div className="merchant-warehouse-search-wrap merchant-warehouse-search-wrap--procure">
                <span className="merchant-warehouse-search-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </span>
                <input
                  type="text"
                  className="merchant-warehouse-search"
                  placeholder={
                    tr(lang, { zh: '搜索商品名称 / 商品编号', en: 'Search by product name / code', de: 'Nach Produktname / Code suchen', ja: '商品名 / 商品番号で検索', ko: '상품명 / 상품번호 검색', es: 'Buscar por nombre / código de producto', it: 'Cerca per nome / codice prodotto', vi: 'Tìm theo tên / mã sản phẩm', fr: 'Recherche par nom/code de produit'})
                  }
                  value={procureSearchInput}
                  onChange={(e) => setProcureSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setProcureSearch(procureSearchInput.trim())
                    }
                  }}
                />
                {procureSearch && (
                  <button
                    type="button"
                    className="merchant-warehouse-search-clear"
                    onClick={() => {
                      setProcureSearchInput('')
                      setProcureSearch('')
                    }}
                  >
                    {tr(lang, { zh: '清空', en: 'Clear', de: 'Leeren', ja: 'クリア', ko: '지우기', es: 'Limpiar', it: 'Cancella', vi: 'Xóa', fr: 'Clair'})}
                  </button>
                )}
                <button
                  type="button"
                  className="merchant-warehouse-search-btn"
                  onClick={() => setProcureSearch(procureSearchInput.trim())}
                  disabled={procureLoading}
                >
                  {tr(lang, { zh: '搜索', en: 'Search', de: 'Suchen', ja: '検索', ko: '검색', es: 'Buscar', it: 'Cerca', vi: 'Tìm kiếm', fr: 'Rechercher'})}
                </button>
              </div>
              <div
                className={`merchant-warehouse-procure-categories merchant-warehouse-procure-categories--inline${
                  procureCategoriesExpanded ? ' merchant-warehouse-procure-categories--expanded' : ''
                }`}
              >
                <span className="merchant-warehouse-procure-categories-label">
                  {tr(lang, { zh: '商品分类', en: 'Categories', de: 'Kategorien', ja: '商品カテゴリ', ko: '카테고리', es: 'Categorías', it: 'Categorie', vi: 'Danh mục', fr: 'Catégories'})}
                </span>
                <div className="merchant-warehouse-procure-categories-inner">
                  <div className="merchant-warehouse-procure-categories-list merchant-warehouse-procure-categories-list--v2">
                    {(procureCategoriesExpanded
                      ? procureCategories
                      : procureCategories.slice(0, PROCURE_VISIBLE_CATEGORIES)
                    ).map((cat) => (
                      <button
                        key={cat.id || 'all'}
                        type="button"
                        className={`merchant-warehouse-filter-btn merchant-warehouse-procure-cat-btn${
                          procureCategoryId === cat.id ? ' merchant-warehouse-filter-btn--active' : ''
                        }`}
                        onClick={() => setProcureCategoryId(cat.id)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {procureCategories.length > PROCURE_VISIBLE_CATEGORIES && (
                    <button
                      type="button"
                      className={`merchant-warehouse-procure-expand-btn${
                        procureCategoriesExpanded ? ' merchant-warehouse-procure-expand-btn--expanded' : ''
                      }`}
                      onClick={() => setProcureCategoriesExpanded((v) => !v)}
                      aria-expanded={procureCategoriesExpanded}
                      aria-label={
                        procureCategoriesExpanded
                          ? tr(lang, { zh: '收起分类', en: 'Collapse categories', de: 'Kategorien einklappen', ja: 'カテゴリを折りたたむ', ko: '카테고리 접기', es: 'Contraer categorías', it: 'Comprimi categorie', vi: 'Thu gọn danh mục', fr: 'Réduire les catégories'})
                          : tr(lang, { zh: '展开更多分类', en: 'Show more categories', de: 'Mehr Kategorien anzeigen', ja: 'カテゴリをもっと表示', ko: '카테고리 더 보기', es: 'Mostrar más categorías', it: 'Mostra più categorie', vi: 'Xem thêm danh mục', fr: 'Afficher plus de catégories'})
                      }
                      title={
                        procureCategoriesExpanded
                          ? tr(lang, { zh: '收起分类', en: 'Collapse categories', de: 'Kategorien einklappen', ja: 'カテゴリを折りたたむ', ko: '카테고리 접기', es: 'Contraer categorías', it: 'Comprimi categorie', vi: 'Thu gọn danh mục', fr: 'Réduire les catégories'})
                          : tr(lang, { zh: '展开更多分类', en: 'Show more categories', de: 'Mehr Kategorien anzeigen', ja: 'カテゴリをもっと表示', ko: '카테고리 더 보기', es: 'Mostrar más categorías', it: 'Mostra più categorie', vi: 'Xem thêm danh mục', fr: 'Afficher plus de catégories'})
                      }
                    >
                      <ProcureCategoryExpandIcon expanded={procureCategoriesExpanded} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="merchant-warehouse-catalog-wrap merchant-warehouse-catalog-wrap--v2">
            {procureLoading && procureList.length === 0 ? (
              <div className="merchant-warehouse-catalog merchant-warehouse-catalog--skeleton">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="merchant-warehouse-catalog-card merchant-warehouse-catalog-card--skeleton">
                    <div className="merchant-warehouse-catalog-card-img merchant-warehouse-catalog-card-img--skeleton" />
                    <div className="merchant-warehouse-catalog-card-body">
                      <div className="merchant-warehouse-catalog-line merchant-warehouse-catalog-line--sm" />
                      <div className="merchant-warehouse-catalog-line" />
                      <div className="merchant-warehouse-catalog-line merchant-warehouse-catalog-line--lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : procureList.length === 0 ? (
              <div className="merchant-warehouse-empty">
                {procureSearch
                  ? tr(lang, {
                      zh: `当前分类下没有找到与「${procureSearch}」相关的商品`,
                      en: `No products found for "${procureSearch}" in this category`,
                      de: `Keine Produkte für „${procureSearch}“ in dieser Kategorie gefunden`, ja: `このカテゴリで「${procureSearch}」に一致する商品は見つかりませんでした`, ko: '이 카테고리에서 "${procureSearch}"와(과) 관련된 상품을 찾지 못했습니다', es: `No se encontraron productos para "${procureSearch}" en esta categoría`, it: `Nessun prodotto trovato per "${procureSearch}" in questa categoria`, vi: `Không tìm thấy sản phẩm cho "${procureSearch}" trong danh mục này`})
                  : tr(lang, {
                      zh: '该分类下暂无采购商品',
                      en: 'No purchasable products in this category',
                      de: 'Keine einkaufbaren Produkte in dieser Kategorie', ja: 'このカテゴリに仕入れ可能な商品はありません', ko: '이 카테고리에 구매 가능한 상품이 없습니다', es: 'No hay productos disponibles en esta categoría', it: 'Nessun prodotto acquistabile in questa categoria', vi: 'Không có sản phẩm mua được trong danh mục này'})}
              </div>
            ) : (
              <>
                <div className="merchant-warehouse-catalog merchant-warehouse-catalog--v2">
                  {procureList.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className={`merchant-warehouse-catalog-card merchant-warehouse-catalog-card--v2${
                        item.status === 'off' ? ' merchant-warehouse-catalog-card--disabled' : ''
                      }`}
                      onClick={() => item.status !== 'off' && openProcureDetail(item)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProcureDetail(item) } }}
                    >
                      <div className="merchant-warehouse-catalog-card-img">
                        {item.images[0] ? (
                          <img
                            src={item.images[getCatalogImageIndex(item)]}
                            alt=""
                          />
                        ) : (
                          <div className="merchant-warehouse-catalog-card-img-placeholder">
                            {tr(lang, { zh: '商品图', en: 'Product image', de: 'Produktbild', ja: '商品画像', ko: '상품 이미지', es: 'Imagen del producto', it: 'Immagine prodotto', vi: 'Ảnh sản phẩm', fr: 'Image du produit'})}
                          </div>
                        )}
                      </div>
                      <div className="merchant-warehouse-catalog-card-body">
                        <span className="merchant-warehouse-catalog-category">{item.category}</span>
                        <div className="merchant-warehouse-catalog-name">{item.name}</div>
                        <div className="merchant-warehouse-catalog-prices-row">
                          <span>
                            {tr(lang, { zh: '采购价', en: 'Purchase price', de: 'Einkaufspreis', ja: '仕入れ価格', ko: '구매가', es: 'Precio de compra', it: 'Prezzo di acquisto', vi: 'Giá nhập', fr: 'Prix ​​d\'achat'})} $
                            {item.supplyPrice.toFixed(2)}
                          </span>
                        </div>
                          {item.status === 'off' ? (
                            <div className="merchant-warehouse-procure-disabled-badge">
                              {tr(lang, { zh: '暂无库存', en: 'Out of stock', de: 'Nicht auf Lager', ja: '在庫なし', ko: '재고 없음', es: 'Sin stock', it: 'Esaurito', vi: 'Hết hàng', fr: 'En rupture de stock'})}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="merchant-warehouse-procure-btn"
                              onClick={(e) => { e.stopPropagation(); openProcurePricingModal(item) }}
                            >
                              {tr(lang, { zh: '采购并上架', en: 'Purchase & list', de: 'Kaufen & einlisten', ja: '仕入れて出品', ko: '구매 후 등록', es: 'Comprar y publicar', it: 'Acquista e pubblica', vi: 'Mua & đăng bán', fr: 'Achat et liste'})}
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                  {procureList.length < PAGE_SIZE &&
                    Array.from({ length: PAGE_SIZE - procureList.length }).map((_, idx) => (
                      <div
                        key={`placeholder-${idx}`}
                        className="merchant-warehouse-catalog-card merchant-warehouse-catalog-card--placeholder"
                        aria-hidden="true"
                      />
                    ))}
                </div>
                {totalProcurePages > 1 && (
                  <div className="merchant-warehouse-pagination">
                    <button
                      type="button"
                      className="merchant-warehouse-page-btn"
                      disabled={procurePage <= 1}
                      onClick={() => setProcurePage((p) => Math.max(1, p - 1))}
                    >
                      {tr(lang, { zh: '上一页', en: 'Previous', de: 'Zurück', ja: '前へ', ko: '이전', es: 'Anterior', it: 'Precedente', vi: 'Trước', fr: 'Précédent'})}
                    </button>
                    <span className="merchant-warehouse-page-info">
                      {procurePage} / {totalProcurePages}
                    </span>
                    <button
                      type="button"
                      className="merchant-warehouse-page-btn"
                      disabled={procurePage >= totalProcurePages}
                      onClick={() => setProcurePage((p) => Math.min(totalProcurePages, p + 1))}
                    >
                      {tr(lang, { zh: '下一页', en: 'Next', de: 'Weiter', ja: '次へ', ko: '다음', es: 'Siguiente', it: 'Successivo', vi: 'Tiếp', fr: 'Suivant'})}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
      </section>

      {mineDetailItem && (() => {
        const mineDetailImages = mineDetailEnriched?.images?.length
          ? mineDetailEnriched.images
          : mineDetailItem.images?.length
            ? mineDetailItem.images
            : mineDetailItem.image
              ? [mineDetailItem.image]
              : []
        const mineDetailTotalImages = mineDetailImages.length
        const mineCanPrevImage = mineDetailTotalImages > 1 && mineDetailImageIndex > 0
        const mineCanNextImage = mineDetailTotalImages > 1 && mineDetailImageIndex < mineDetailTotalImages - 1
        const mineDetailDesc = mineDetailEnriched?.description ?? ''
        return (
          <MerchantWarehouseDetailModal
            title={mineDetailItem.productName}
            subtitle={mineDetailItem.productCode}
            titleId="mine-detail-title"
            lang={lang}
            onClose={() => {
              setMineDetailItem(null)
              setMineDetailEnriched(null)
            }}
          >
            <div className="merchant-warehouse-detail-carousel">
              <div className="merchant-warehouse-detail-carousel-inner">
                {mineDetailTotalImages > 0 ? (
                  <img
                    src={mineDetailImages[mineDetailImageIndex] ?? mineDetailImages[0]}
                    alt={tr(lang, {
                      zh: `${mineDetailItem.productName} 图 ${mineDetailImageIndex + 1}`,
                      en: `${mineDetailItem.productName} image ${mineDetailImageIndex + 1}`,
                      de: `${mineDetailItem.productName} Bild ${mineDetailImageIndex + 1}`, ja: `${mineDetailItem.productName} 画像 ${mineDetailImageIndex + 1}`, ko: '${mineDetailItem.productName} 이미지 ${mineDetailImageIndex + 1}', es: `${mineDetailItem.productName} imagen ${mineDetailImageIndex + 1}`, it: `${mineDetailItem.productName} immagine ${mineDetailImageIndex + 1}`, vi: `${mineDetailItem.productName} ảnh ${mineDetailImageIndex + 1}`})}
                    className="merchant-warehouse-detail-carousel-img"
                  />
                ) : (
                  <div className="merchant-warehouse-detail-carousel-placeholder">
                    {tr(lang, { zh: '商品图', en: 'Product image', de: 'Produktbild', ja: '商品画像', ko: '상품 이미지', es: 'Imagen del producto', it: 'Immagine prodotto', vi: 'Ảnh sản phẩm', fr: 'Image du produit'})}
                  </div>
                )}
              </div>
              {mineDetailTotalImages > 1 && (
                <>
                  <button
                    type="button"
                    className="merchant-warehouse-detail-carousel-btn merchant-warehouse-detail-carousel-btn--prev"
                    disabled={!mineCanPrevImage}
                    onClick={(e) => {
                      e.stopPropagation()
                      setMineDetailImageIndex((i) => Math.max(0, i - 1))
                    }}
                    aria-label={tr(lang, { zh: '上一张', en: 'Previous image', de: 'Previous image', ja: '前の画像', ko: '이전 이미지', es: 'Imagen anterior', it: 'Immagine precedente', vi: 'Ảnh trước', fr: 'Image précédente'})}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="merchant-warehouse-detail-carousel-btn merchant-warehouse-detail-carousel-btn--next"
                    disabled={!mineCanNextImage}
                    onClick={(e) => {
                      e.stopPropagation()
                      setMineDetailImageIndex((i) => Math.min(mineDetailTotalImages - 1, i + 1))
                    }}
                    aria-label={tr(lang, { zh: '下一张', en: 'Next image', de: 'Next image', ja: '次の画像', ko: '다음 이미지', es: 'Imagen siguiente', it: 'Immagine successiva', vi: 'Ảnh tiếp theo', fr: 'Image suivante'})}
                  >
                    ›
                  </button>
                  <span className="merchant-warehouse-detail-carousel-dots">
                    {mineDetailImageIndex + 1} / {mineDetailTotalImages}
                  </span>
                </>
              )}
            </div>
            <div className="merchant-warehouse-detail-body">
              <div className="merchant-warehouse-detail-price">
                {tr(lang, { zh: '采购价', en: 'Purchase price', de: 'Einkaufspreis', ja: '仕入れ価格', ko: '구매가', es: 'Precio de compra', it: 'Prezzo di acquisto', vi: 'Giá nhập', fr: 'Prix ​​d\'achat'})}{' '}
                <strong>${mineDetailItem.supplyPrice.toFixed(2)}</strong>
              </div>
              <div className="merchant-warehouse-detail-price">
                {tr(lang, { zh: '定价', en: 'Selling price', de: 'Verkaufspreis', ja: '販売価格', ko: '판매가', es: 'Precio de venta', it: 'Prezzo di vendita', vi: 'Giá bán', fr: 'Prix ​​de vente'})}{' '}
                <strong className="merchant-warehouse-detail-price--sell">
                  ${mineDetailItem.price.toFixed(2)}
                </strong>
              </div>
              <div className="merchant-warehouse-detail-price">
                {tr(lang, { zh: '利润比', en: 'Profit ratio', de: 'Gewinnquote', ja: '利益率', ko: '이익률', es: 'Margen de ganancia', it: 'Margine di profitto', vi: 'Tỷ suất lợi nhuận', fr: 'Taux de profit'})}{' '}
                <strong
                  className={`merchant-warehouse-detail-profit ${
                    mineDetailItem.price >= mineDetailItem.supplyPrice
                      ? 'merchant-warehouse-detail-profit--up'
                      : 'merchant-warehouse-detail-profit--down'
                  }`}
                >
                  {profitRatio(mineDetailItem.price, mineDetailItem.supplyPrice)}
                </strong>
              </div>
              {mineDetailDesc && (
                <div className="merchant-warehouse-detail-desc">
                  <span className="merchant-warehouse-detail-label">
                    {tr(lang, { zh: '商品描述', en: 'Product description', de: 'Produktbeschreibung', ja: '商品説明', ko: '상품 설명', es: 'Descripción del producto', it: 'Descrizione prodotto', vi: 'Mô tả sản phẩm', fr: 'Description du produit'})}
                  </span>
                  <p>{mineDetailDesc}</p>
                </div>
              )}
            </div>
          </MerchantWarehouseDetailModal>
        )
      })()}

      {procureDetailItem && (
        <MerchantWarehouseDetailModal
          title={procureDetailItem.name}
          subtitle={procureDetailItem.id}
          titleId="procure-detail-title"
          lang={lang}
          onClose={() => setProcureDetailItem(null)}
        >
          <div className="merchant-warehouse-detail-carousel">
            <div className="merchant-warehouse-detail-carousel-inner">
              {detailTotalImages > 0 ? (
                <img
                  src={detailImages[detailImageIndex]}
                  alt={tr(lang, {
                    zh: `${procureDetailItem.name} 图 ${detailImageIndex + 1}`,
                    en: `${procureDetailItem.name} image ${detailImageIndex + 1}`,
                    de: `${procureDetailItem.name} Bild ${detailImageIndex + 1}`, ja: `${procureDetailItem.name} 画像 ${detailImageIndex + 1}`, ko: '${procureDetailItem.name} 이미지 ${detailImageIndex + 1}', es: `${procureDetailItem.name} imagen ${detailImageIndex + 1}`, it: `${procureDetailItem.name} immagine ${detailImageIndex + 1}`, vi: `${procureDetailItem.name} ảnh ${detailImageIndex + 1}`})}
                  className="merchant-warehouse-detail-carousel-img"
                />
              ) : (
                <div className="merchant-warehouse-detail-carousel-placeholder">
                  {tr(lang, { zh: '商品图', en: 'Product image', de: 'Produktbild', ja: '商品画像', ko: '상품 이미지', es: 'Imagen del producto', it: 'Immagine prodotto', vi: 'Ảnh sản phẩm', fr: 'Image du produit'})}
                </div>
              )}
            </div>
            {detailTotalImages > 1 && (
              <>
                <button
                  type="button"
                  className="merchant-warehouse-detail-carousel-btn merchant-warehouse-detail-carousel-btn--prev"
                  disabled={!canPrevImage}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDetailImageIndex((i) => Math.max(0, i - 1))
                  }}
                  aria-label={tr(lang, { zh: '上一张', en: 'Previous image', de: 'Previous image', ja: '前の画像', ko: '이전 이미지', es: 'Imagen anterior', it: 'Immagine precedente', vi: 'Ảnh trước', fr: 'Image précédente'})}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="merchant-warehouse-detail-carousel-btn merchant-warehouse-detail-carousel-btn--next"
                  disabled={!canNextImage}
                  onClick={(e) => {
                    e.stopPropagation()
                    setDetailImageIndex((i) => Math.min(detailTotalImages - 1, i + 1))
                  }}
                  aria-label={tr(lang, { zh: '下一张', en: 'Next image', de: 'Next image', ja: '次の画像', ko: '다음 이미지', es: 'Imagen siguiente', it: 'Immagine successiva', vi: 'Ảnh tiếp theo', fr: 'Image suivante'})}
                >
                  ›
                </button>
                <span className="merchant-warehouse-detail-carousel-dots">
                  {detailImageIndex + 1} / {detailTotalImages}
                </span>
              </>
            )}
          </div>
          <div className="merchant-warehouse-detail-body">
            <div className="merchant-warehouse-detail-price">
              {tr(lang, { zh: '采购价', en: 'Purchase price', de: 'Einkaufspreis', ja: '仕入れ価格', ko: '구매가', es: 'Precio de compra', it: 'Prezzo di acquisto', vi: 'Giá nhập', fr: 'Prix ​​d\'achat'})}{' '}
              <strong>${procureDetailItem.supplyPrice.toFixed(2)}</strong>
            </div>
            {procureDetailItem.description && (
              <div className="merchant-warehouse-detail-desc">
                <span className="merchant-warehouse-detail-label">
                  {tr(lang, { zh: '商品描述', en: 'Product description', de: 'Produktbeschreibung', ja: '商品説明', ko: '상품 설명', es: 'Descripción del producto', it: 'Descrizione prodotto', vi: 'Mô tả sản phẩm', fr: 'Description du produit'})}
                </span>
                <p>{procureDetailItem.description}</p>
              </div>
            )}
            {procureDetailItem.styles.length > 0 && (
              <div className="merchant-warehouse-detail-styles">
                <span className="merchant-warehouse-detail-label">
                  {tr(lang, { zh: '款式', en: 'Styles', de: 'Styles', ja: 'バリエーション', ko: '옵션', es: 'Variantes', it: 'Varianti', vi: 'Biến thể', fr: 'Styles'})}
                </span>
                <ul>
                  {procureDetailItem.styles.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              className="merchant-warehouse-detail-procure-btn"
              onClick={() => openProcurePricingModal(procureDetailItem)}
            >
              {tr(lang, { zh: '采购并上架', en: 'Purchase & list', de: 'Kaufen & einlisten', ja: '仕入れて出品', ko: '구매 후 등록', es: 'Comprar y publicar', it: 'Acquista e pubblica', vi: 'Mua & đăng bán', fr: 'Achat et liste'})}
            </button>
          </div>
        </MerchantWarehouseDetailModal>
      )}

      {/* 定价弹层已废弃：定价由系统自动按店铺等级计算 */}

      {/* 采购定价并上架弹层已废弃：采购时由系统根据店铺等级和采购价自动定价 */}

      <MerchantConfirmModal
        open={Boolean(confirmModal && confirmModalCopy)}
        title={confirmModalCopy?.title ?? ''}
        subtitle={confirmModalCopy?.subtitle}
        confirmLabel={confirmModalCopy?.confirmLabel ?? ''}
        cancelLabel={tr(lang, { zh: '取消', en: 'Cancel', de: 'Abbrechen', ja: 'キャンセル', ko: '취소', es: 'Cancelar', it: 'Annulla', vi: 'Hủy', fr: 'Annuler'})}
        variant={confirmModalCopy?.variant}
        loading={confirmLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => {
          if (!confirmLoading) setConfirmModal(null)
        }}
      />
    </div>
  )
}

export default MerchantWarehouse
