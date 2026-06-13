import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useToast } from '../components/ToastProvider'
import dianpu1 from '../assets/dianpu1.png'
import dianpu2 from '../assets/dianpu2.png'
import dianpu3 from '../assets/dianpu3.png'
import dianpu4 from '../assets/dianpu4.png'
import yunyingjihua from '../assets/yunyingjihua.png'
import { PlanCurrentLevelSkeleton, PlanHeaderStatsSkeleton } from '../components/McLoadingSkeletons'
import liulianggaikuang from '../assets/liulianggaikuang.png'
import paidTiktok from '../assets/paid-tiktok.png'
import paidMeta from '../assets/paid-meta.png'
import paidGoogle from '../assets/paid-google.png'
import { useLang } from '../context/LangContext'
import { pickField, pickBilingual, tr, toTraditional, type Lang } from '../i18n'
import { useMerchantShop } from '../context/MerchantShopContext'
import { openCrispChat } from '../utils/crispChat'
import { getMerchantShopLevelProgress } from '../constants/merchantShopLevels'

type ShopLevel = 'normal' | 'silver' | 'gold' | 'diamond'

type PaidChannelKey = 'tiktok' | 'meta' | 'google' | 'other'

const LEVELS: {
  key: ShopLevel
  nameZh: string
  nameEn: string
  nameDe: string
  nameJa: string
  nameKo: string
  nameEs: string
  nameIt: string
  nameVi: string
  descZh: string
  descEn: string
  descDe: string
  descJa: string
  descKo: string
  descEs: string
  descIt: string
  descVi: string
  minSales: number
  icon: string
  benefitsZh: string[]
  benefitsEn: string[]
  benefitsDe: string[]
  benefitsJa: string[]
  benefitsKo: string[]
  benefitsEs: string[]
  benefitsIt: string[]
  benefitsVi: string[]
}[] = [
  {
    key: 'normal',
    nameZh: '普通店铺',
    nameEn: 'Standard shop',
    nameDe: 'Standard-Shop',
    nameJa: 'スタンダードショップ',
    nameKo: '일반 점포',
    nameEs: 'Tienda estándar',
    nameIt: 'Negozio standard',
    nameVi: 'Cửa hàng tiêu chuẩn',
    descZh: '入驻即可获得',
    descEn: 'Granted upon joining the platform',
    descDe: 'Beim Beitritt zur Plattform verfügbar',
    descJa: '出店と同時に付与',
    descKo: '입점과 동시에 부여',
    descEs: 'Disponible al unirse a la plataforma',
    descIt: 'Disponibile all\'iscrizione alla piattaforma',
    descVi: 'Được cấp khi tham gia nền tảng',
    minSales: 0,
    icon: dianpu1,
    benefitsZh: ['基础店铺展示', '标准客服支持', '平台基础流量', '利润比例：采购价的 10%'],
    benefitsEn: [
      'Basic shop exposure',
      'Standard customer support',
      'Baseline platform traffic',
      'Profit: 10% over purchase price',
    ],
    benefitsDe: [
      'Grundlegende Shop-Sichtbarkeit',
      'Standard-Kundensupport',
      'Basis-Traffic der Plattform',
      'Gewinn: 10 % über Einkaufspreis',
    ],
    benefitsJa: [
      '基本的なショップ露出',
      '標準カスタマーサポート',
      'プラットフォーム基本トラフィック',
      '利益率：仕入価格の10%',
    ],
    benefitsKo: [
      '기본 점포 노출',
      '표준 고객 지원',
      '플랫폼 기본 트래픽',
      '수익률: 매입가의 10%',
    ],
    benefitsEs: [
      'Exposición básica de la tienda',
      'Atención al cliente estándar',
      'Tráfico base de la plataforma',
      'Beneficio: 10 % sobre el precio de compra',
    ],
    benefitsIt: [
      'Visibilità base del negozio',
      'Assistenza clienti standard',
      'Traffico base della piattaforma',
      'Margine: 10% sul prezzo di acquisto',
    ],
    benefitsVi: [
      'Hiển thị cửa hàng cơ bản',
      'Hỗ trợ khách hàng tiêu chuẩn',
      'Lưu lượng nền tảng cơ bản',
      'Biên lợi nhuận: 10% trên giá nhập',
    ],
  },
  {
    key: 'silver',
    nameZh: '银牌店铺',
    nameEn: 'Silver shop',
    nameDe: 'Silber-Shop',
    nameJa: 'シルバーショップ',
    nameKo: '실버 점포',
    nameEs: 'Tienda plata',
    nameIt: 'Negozio argento',
    nameVi: 'Cửa hàng bạc',
    descZh: '累计销售额 ≥ $10,000',
    descEn: 'Cumulative sales ≥ $10,000',
    descDe: 'Kumulierter Umsatz ≥ $10.000',
    descJa: '累計売上 ≥ $10,000',
    descKo: '누적 매출 ≥ $10,000',
    descEs: 'Ventas acumuladas ≥ $10,000',
    descIt: 'Vendite cumulative ≥ $10.000',
    descVi: 'Doanh số tích lũy ≥ $10.000',
    minSales: 10000,
    icon: dianpu2,
    benefitsZh: ['搜索加权曝光', '活动优先报名', '专属运营对接', '利润比例：采购价的 15%'],
    benefitsEn: [
      'Boosted search exposure',
      'Priority access to campaigns',
      'Dedicated operations contact',
      'Profit: 15% over purchase price',
    ],
    benefitsDe: [
      'Erhöhte Sichtbarkeit in der Suche',
      'Bevorzugter Zugang zu Kampagnen',
      'Persönlicher Operations-Ansprechpartner',
      'Gewinn: 15 % über Einkaufspreis',
    ],
    benefitsJa: [
      '検索露出のブースト',
      'キャンペーン優先参加',
      '専任オペレーション担当',
      '利益率：仕入価格の15%',
    ],
    benefitsKo: [
      '검색 노출 가중치',
      '캠페인 우선 참여',
      '전담 운영 담당',
      '수익률: 매입가의 15%',
    ],
    benefitsEs: [
      'Mayor visibilidad en búsquedas',
      'Acceso prioritario a campañas',
      'Contacto dedicado de operaciones',
      'Beneficio: 15 % sobre el precio de compra',
    ],
    benefitsIt: [
      'Maggiore visibilità nelle ricerche',
      'Accesso prioritario alle campagne',
      'Referente operativo dedicato',
      'Margine: 15% sul prezzo di acquisto',
    ],
    benefitsVi: [
      'Tăng hiển thị trên tìm kiếm',
      'Ưu tiên tham gia chiến dịch',
      'Liên hệ vận hành riêng',
      'Biên lợi nhuận: 15% trên giá nhập',
    ],
  },
  {
    key: 'gold',
    nameZh: '金牌店铺',
    nameEn: 'Gold shop',
    nameDe: 'Gold-Shop',
    nameJa: 'ゴールドショップ',
    nameKo: '골드 점포',
    nameEs: 'Tienda oro',
    nameIt: 'Negozio oro',
    nameVi: 'Cửa hàng vàng',
    descZh: '累计销售额 ≥ $50,000',
    descEn: 'Cumulative sales ≥ $50,000',
    descDe: 'Kumulierter Umsatz ≥ $50.000',
    descJa: '累計売上 ≥ $50,000',
    descKo: '누적 매출 ≥ $50,000',
    descEs: 'Ventas acumuladas ≥ $50,000',
    descIt: 'Vendite cumulative ≥ $50.000',
    descVi: 'Doanh số tích lũy ≥ $50.000',
    minSales: 50000,
    icon: dianpu3,
    benefitsZh: ['首页推荐位', '佣金比例优惠', '专属客服通道', '利润比例：采购价的 20%'],
    benefitsEn: [
      'Homepage recommendation slots',
      'Better commission rate',
      'Dedicated support channel',
      'Profit: 20% over purchase price',
    ],
    benefitsDe: [
      'Empfehlungsplätze auf der Startseite',
      'Günstigere Provisionsrate',
      'Dedizierter Support-Kanal',
      'Gewinn: 20 % über Einkaufspreis',
    ],
    benefitsJa: [
      'トップページおすすめ枠',
      '手数料率の優遇',
      '専用サポートチャネル',
      '利益率：仕入価格の20%',
    ],
    benefitsKo: [
      '홈페이지 추천 슬롯',
      '수수료율 우대',
      '전용 고객 지원 채널',
      '수익률: 매입가의 20%',
    ],
    benefitsEs: [
      'Espacios destacados en la página principal',
      'Mejor tasa de comisión',
      'Canal de soporte dedicado',
      'Beneficio: 20 % sobre el precio de compra',
    ],
    benefitsIt: [
      'Spazi in evidenza in homepage',
      'Tasso di commissione più favorevole',
      'Canale di assistenza dedicato',
      'Margine: 20% sul prezzo di acquisto',
    ],
    benefitsVi: [
      'Vị trí đề xuất trang chủ',
      'Ưu đãi tỷ lệ hoa hồng',
      'Kênh hỗ trợ riêng',
      'Biên lợi nhuận: 20% trên giá nhập',
    ],
  },
  {
    key: 'diamond',
    nameZh: '钻石店铺',
    nameEn: 'Diamond shop',
    nameDe: 'Diamant-Shop',
    nameJa: 'ダイヤモンドショップ',
    nameKo: '다이아몬드 점포',
    nameEs: 'Tienda diamante',
    nameIt: 'Negozio diamante',
    nameVi: 'Cửa hàng kim cương',
    descZh: '累计销售额 ≥ $100,000',
    descEn: 'Cumulative sales ≥ $100,000',
    descDe: 'Kumulierter Umsatz ≥ $100.000',
    descJa: '累計売上 ≥ $100,000',
    descKo: '누적 매출 ≥ $100,000',
    descEs: 'Ventas acumuladas ≥ $100,000',
    descIt: 'Vendite cumulative ≥ $100.000',
    descVi: 'Doanh số tích lũy ≥ $100.000',
    minSales: 100000,
    icon: dianpu4,
    benefitsZh: ['顶级流量扶持', '品牌联名机会', '年度荣誉认证', '利润比例：采购价的 25%'],
    benefitsEn: [
      'Top-level traffic support',
      'Brand collaboration opportunities',
      'Annual honor certification',
      'Profit: 25% over purchase price',
    ],
    benefitsDe: [
      'Top-Traffic-Unterstützung',
      'Markenkooperations-Möglichkeiten',
      'Jährliche Ehrenzertifizierung',
      'Gewinn: 25 % über Einkaufspreis',
    ],
    benefitsJa: [
      '最高レベルのトラフィック支援',
      'ブランドコラボの機会',
      '年間表彰認定',
      '利益率：仕入価格の25%',
    ],
    benefitsKo: [
      '최상위 트래픽 지원',
      '브랜드 협업 기회',
      '연간 우수 인증',
      '수익률: 매입가의 25%',
    ],
    benefitsEs: [
      'Apoyo de tráfico de primer nivel',
      'Oportunidades de colaboración con marcas',
      'Certificación anual de honor',
      'Beneficio: 25 % sobre el precio de compra',
    ],
    benefitsIt: [
      'Supporto traffico di alto livello',
      'Opportunità di collaborazione con brand',
      'Certificazione annuale di eccellenza',
      'Margine: 25% sul prezzo di acquisto',
    ],
    benefitsVi: [
      'Hỗ trợ lưu lượng hàng đầu',
      'Cơ hội hợp tác thương hiệu',
      'Chứng nhận danh dự hàng năm',
      'Biên lợi nhuận: 25% trên giá nhập',
    ],
  },
]

const ORGANIC_TIPS = [
  {
    zh: '将店铺链接发布到社交媒体、社群或私信中，邀请用户进店浏览。',
    en: 'Share your shop link on social media, groups, or direct messages to invite visits.',
    de: 'Teilen Sie Ihren Shop-Link in sozialen Medien, Gruppen oder Direktnachrichten, um Besuche anzuziehen.',
    ja: 'ショップリンクをSNS、コミュニティ、DMで共有し、来店を促しましょう。',
    ko: '점포 링크를 SNS, 커뮤니티, DM에 공유하여 방문을 유도하세요.',
    es: 'Comparta el enlace de su tienda en redes sociales, grupos o mensajes directos para atraer visitas.',
    it: 'Condividi il link del negozio sui social, nelle community o in messaggi diretti per invitare le visite.',
    vi: 'Chia sẻ liên kết cửa hàng trên mạng xã hội, nhóm hoặc tin nhắn riêng để thu hút khách truy cập.',
  },
  {
    zh: '可配合商品主图与优惠活动文案，提高点击率与转化。',
    en: 'Pair the link with product images and promotions to improve click-through and conversion.',
    de: 'Kombinieren Sie den Link mit Produktbildern und Aktionen, um Klicks und Conversion zu steigern.',
    ja: '商品画像やキャンペーン文案と組み合わせ、クリック率とコンバージョンを高めましょう。',
    ko: '상품 이미지와 프로모션 문구와 함께 공유하면 클릭률과 전환율을 높일 수 있습니다.',
    es: 'Combine el enlace con imágenes de productos y promociones para mejorar los clics y la conversión.',
    it: 'Abbina il link a immagini dei prodotti e promozioni per migliorare click e conversioni.',
    vi: 'Kết hợp liên kết với hình ảnh sản phẩm và nội dung khuyến mãi để tăng tỷ lệ nhấp và chuyển đổi.',
  },
  {
    zh: '持续分享有助于积累自然访客，配合主推商品效果更佳。',
    en: 'Consistent sharing builds organic visitors — feature your top products for better results.',
    de: 'Regelmäßiges Teilen baut organische Besucher auf – Highlight-Produkte verstärken den Effekt.',
    ja: '継続的な共有で自然流入を増やせます。主力商品と組み合わせると効果的です。',
    ko: '꾸준한 공유로 자연 유입 방문자를 늘릴 수 있습니다. 주력 상품과 함께하면 더 효과적입니다.',
    es: 'Compartir de forma constante genera visitantes orgánicos; destaque sus productos estrella para mejores resultados.',
    it: 'Condividere costantemente aiuta ad accumulare visitatori organici — metti in evidenza i prodotti principali per risultati migliori.',
    vi: 'Chia sẻ thường xuyên giúp tích lũy khách truy cập tự nhiên — kết hợp sản phẩm chủ lực để hiệu quả hơn.',
  },
]

const PAID_CHANNELS: {
  key: PaidChannelKey
  nameZh: string
  nameEn: string
  nameDe: string
  nameJa: string
  nameKo: string
  nameEs: string
  nameIt: string
  nameVi: string
  descZh: string
  descEn: string
  descDe: string
  descJa: string
  descKo: string
  descEs: string
  descIt: string
  descVi: string
  accent: string
  iconLabel: string
  icon?: string
}[] = [
  {
    key: 'tiktok',
    nameZh: 'TikTok 流量',
    nameEn: 'TikTok traffic',
    nameDe: 'TikTok-Traffic',
    nameJa: 'TikTok トラフィック',
    nameKo: 'TikTok 트래픽',
    nameEs: 'Tráfico TikTok',
    nameIt: 'Traffico TikTok',
    nameVi: 'Lưu lượng TikTok',
    descZh: '短视频与直播场景投放，适合爆款种草与年轻客群。',
    descEn: 'Short-video and live campaigns for viral products and younger audiences.',
    descDe: 'Kurzvideo- und Live-Kampagnen für virale Produkte und jüngere Zielgruppen.',
    descJa: 'ショート動画・ライブ配信向け。バズ商品や若年層に最適です。',
    descKo: '숏폼·라이브 방송 광고에 적합합니다. 바이럴 상품과 젊은 고객층에 최적입니다.',
    descEs: 'Campañas de vídeo corto y directos en vivo para productos virales y público joven.',
    descIt: 'Campagne video brevi e live streaming, ideali per prodotti virali e un pubblico giovane.',
    descVi: 'Quảng cáo video ngắn và livestream, phù hợp sản phẩm viral và khách hàng trẻ.',
    accent: '#111827',
    iconLabel: 'TT',
    icon: paidTiktok,
  },
  {
    key: 'meta',
    nameZh: 'Meta 流量',
    nameEn: 'Meta traffic',
    nameDe: 'Meta-Traffic',
    nameJa: 'Meta トラフィック',
    nameKo: 'Meta 트래픽',
    nameEs: 'Tráfico Meta',
    nameIt: 'Traffico Meta',
    nameVi: 'Lưu lượng Meta',
    descZh: '覆盖 Facebook / Instagram 等 Meta 系平台精准推广。',
    descEn: 'Targeted ads across Facebook, Instagram, and other Meta platforms.',
    descDe: 'Gezielte Anzeigen auf Facebook, Instagram und anderen Meta-Plattformen.',
    descJa: 'Facebook / Instagram など Meta 系プラットフォームへのターゲット広告。',
    descKo: 'Facebook, Instagram 등 Meta 플랫폼 타겟 광고.',
    descEs: 'Anuncios segmentados en Facebook, Instagram y otras plataformas Meta.',
    descIt: 'Pubblicità mirate su Facebook, Instagram e altre piattaforme Meta.',
    descVi: 'Quảng cáo nhắm mục tiêu trên Facebook, Instagram và các nền tảng Meta.',
    accent: '#1877f2',
    iconLabel: 'M',
    icon: paidMeta,
  },
  {
    key: 'google',
    nameZh: 'Google 流量',
    nameEn: 'Google traffic',
    nameDe: 'Google-Traffic',
    nameJa: 'Google トラフィック',
    nameKo: 'Google 트래픽',
    nameEs: 'Tráfico Google',
    nameIt: 'Traffico Google',
    nameVi: 'Lưu lượng Google',
    descZh: '搜索与展示广告，捕获有明确购买意图的用户。',
    descEn: 'Search and display ads to reach users with strong purchase intent.',
    descDe: 'Such- und Display-Anzeigen für Nutzer mit klarer Kaufabsicht.',
    descJa: '検索・ディスプレイ広告で購買意欲の高いユーザーを獲得。',
    descKo: '검색·디스플레이 광고로 구매 의향이 높은 사용자를 확보합니다.',
    descEs: 'Anuncios de búsqueda y display para captar usuarios con intención de compra.',
    descIt: 'Annunci di ricerca e display per raggiungere utenti con forte intenzione d\'acquisto.',
    descVi: 'Quảng cáo tìm kiếm và hiển thị, tiếp cận người dùng có ý định mua rõ ràng.',
    accent: '#ea4335',
    iconLabel: 'G',
    icon: paidGoogle,
  },
  {
    key: 'other',
    nameZh: '其他渠道',
    nameEn: 'Other channels',
    nameDe: 'Weitere Kanäle',
    nameJa: 'その他のチャネル',
    nameKo: '기타 채널',
    nameEs: 'Otros canales',
    nameIt: 'Altri canali',
    nameVi: 'Kênh khác',
    descZh: '更多定制化推广方案，由运营顾问为您匹配资源。',
    descEn: 'Custom promotion options matched by our operations team.',
    descDe: 'Individuelle Werbeoptionen, abgestimmt durch unser Operations-Team.',
    descJa: 'オペレーションチームが最適なカスタムプロモーションをご提案します。',
    descKo: '운영 팀이 맞춤형 프로모션 방안과 리소스를 연결해 드립니다.',
    descEs: 'Opciones de promoción personalizadas asignadas por nuestro equipo de operaciones.',
    descIt: 'Soluzioni promozionali personalizzate abbinate dal nostro team operativo.',
    descVi: 'Giải pháp quảng bá tùy chỉnh do đội vận hành kết nối cho bạn.',
    accent: '#5b6cff',
    iconLabel: '···',
  },
]

function pickLevelBenefits(
  lang: Lang,
  level: (typeof LEVELS)[number],
): string[] {
  if (lang === 'tw') return level.benefitsZh.map(toTraditional)
  if (lang === 'de') return level.benefitsDe
  if (lang === 'ja') return level.benefitsJa
  if (lang === 'ko') return level.benefitsKo
  if (lang === 'es') return level.benefitsEs
  if (lang === 'it') return level.benefitsIt
  if (lang === 'vi') return level.benefitsVi
  if (lang === 'en') return level.benefitsEn
  return level.benefitsZh
}

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
  const [levelLocked, setLevelLocked] = useState(false)
  const [levelSalesBaseline, setLevelSalesBaseline] = useState<number | null>(null)
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
          tr(lang, { zh: '未找到店铺信息，请重新登录商家后台', en: 'Shop information not found, please log in again.', de: 'Shop-Informationen nicht gefunden, bitte erneut anmelden.', ja: '店舗情報が見つかりません。再度ログインしてください。', ko: '점포 정보를 찾을 수 없습니다. 판매자 센터에 다시 로그인해 주세요.', es: 'Información de la tienda no encontrada. Vuelva a iniciar sesión.', it: 'Informazioni negozio non trovate. Accedi di nuovo.', vi: 'Không tìm thấy thông tin cửa hàng. Vui lòng đăng nhập lại.' }),
        )
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const res = await api.get<{
          id: string
          level: number
          sales: number
          levelLocked?: boolean
          levelSalesBaseline?: number | null
        }>(`/api/shops/${encodeURIComponent(auth.shopId)}`)
        const levelVal = Number(res.level ?? 1)
        setShopLevelNum(Number.isFinite(levelVal) ? levelVal : 1)
        setCurrentLevel(mapLevel(levelVal))
        const salesVal = Number(res.sales ?? 0)
        setTotalSales(Number.isFinite(salesVal) ? salesVal : 0)
        setLevelLocked(Boolean(res.levelLocked))
        const baselineVal =
          res.levelSalesBaseline != null ? Number(res.levelSalesBaseline) : null
        setLevelSalesBaseline(
          baselineVal != null && Number.isFinite(baselineVal) ? baselineVal : null,
        )
      } catch {
        setError(
          tr(lang, { zh: '无法加载店铺运营计划，请稍后重试', en: 'Failed to load shop growth plan, please try again later.', de: 'Wachstumsplan konnte nicht geladen werden, bitte später erneut versuchen.', ja: '運営プランの読み込みに失敗しました。しばらくしてから再試行してください。', ko: '점포 운영 계획을 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.', es: 'No se pudo cargar el plan de crecimiento. Inténtelo de nuevo más tarde.', it: 'Impossibile caricare il piano di crescita. Riprova più tardi.', vi: 'Không tải được kế hoạch phát triển. Vui lòng thử lại sau.' }),
        )
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [lang])

  const currentIndex = LEVELS.findIndex((l) => l.key === currentLevel)
  const currentLevelInfo = LEVELS[currentIndex]!

  const { progress, remain, next: nextTier } = getMerchantShopLevelProgress(shopLevelNum, totalSales, {
    levelLocked,
    levelSalesBaseline,
  })

  const copyShopLink = async () => {
    if (!shopPublicUrl) {
      showToast(tr(lang, { zh: '暂无店铺链接', en: 'Shop link unavailable', de: 'Kein Shop-Link verfügbar', ja: 'ショップリンクがありません', ko: '점포 링크가 없습니다', es: 'Enlace de tienda no disponible', it: 'Link negozio non disponibile', vi: 'Chưa có liên kết cửa hàng' }), 'error')
      return
    }
    try {
      await navigator.clipboard.writeText(shopPublicUrl)
      showToast(tr(lang, { zh: '店铺链接已复制', en: 'Shop link copied', de: 'Shop-Link kopiert', ja: 'ショップリンクをコピーしました', ko: '점포 링크가 복사되었습니다', es: 'Enlace de tienda copiado', it: 'Link negozio copiato', vi: 'Đã sao chép liên kết cửa hàng' }))
    } catch {
      showToast(tr(lang, { zh: '复制失败，请手动复制', en: 'Copy failed, please copy manually', de: 'Kopieren fehlgeschlagen, bitte manuell kopieren', ja: 'コピーに失敗しました。手動でコピーしてください', ko: '복사에 실패했습니다. 수동으로 복사해 주세요', es: 'Error al copiar. Cópielo manualmente', it: 'Copia non riuscita, copia manualmente', vi: 'Sao chép thất bại, vui lòng sao chép thủ công' }), 'error')
    }
  }

  const consultPaidChannel = (channel: PaidChannelKey) => {
    const channelInfo = PAID_CHANNELS.find((c) => c.key === channel)
    openCrispChat({ shopName: shop?.name, shopId: shop?.id })
    showToast(
      tr(lang, {
        zh: `已打开客服，请说明您想购买「${channelInfo ? pickField(lang, { zh: channelInfo.nameZh, en: channelInfo.nameEn, de: channelInfo.nameDe, ja: channelInfo.nameJa, ko: channelInfo.nameKo, es: channelInfo.nameEs, it: channelInfo.nameIt, vi: channelInfo.nameVi }) : '付费流量'}」`,
        en: `Chat opened — mention you want "${channelInfo ? pickField(lang, { zh: channelInfo.nameZh, en: channelInfo.nameEn, de: channelInfo.nameDe, ja: channelInfo.nameJa, ko: channelInfo.nameKo, es: channelInfo.nameEs, it: channelInfo.nameIt, vi: channelInfo.nameVi }) : 'paid traffic'}"`,
        de: `Chat geöffnet – erwähnen Sie, dass Sie „${channelInfo ? pickField(lang, { zh: channelInfo.nameZh, en: channelInfo.nameEn, de: channelInfo.nameDe, ja: channelInfo.nameJa, ko: channelInfo.nameKo, es: channelInfo.nameEs, it: channelInfo.nameIt, vi: channelInfo.nameVi }) : 'bezahlten Traffic'}“ kaufen möchten`,
        ja: `チャットを開きました。「${channelInfo ? pickField(lang, { zh: channelInfo.nameZh, en: channelInfo.nameEn, de: channelInfo.nameDe, ja: channelInfo.nameJa, ko: channelInfo.nameKo, es: channelInfo.nameEs, it: channelInfo.nameIt, vi: channelInfo.nameVi }) : '有料トラフィック'}」の購入希望とお伝えください`,
        ko: `채팅이 열렸습니다. 「${channelInfo ? pickField(lang, { zh: channelInfo.nameZh, en: channelInfo.nameEn, de: channelInfo.nameDe, ja: channelInfo.nameJa, ko: channelInfo.nameKo, es: channelInfo.nameEs, it: channelInfo.nameIt, vi: channelInfo.nameVi }) : '유료 트래픽'}」 구매를 원하신다고 말씀해 주세요`,
        es: `Chat abierto: indique que desea comprar «${channelInfo ? pickField(lang, { zh: channelInfo.nameZh, en: channelInfo.nameEn, de: channelInfo.nameDe, ja: channelInfo.nameJa, ko: channelInfo.nameKo, es: channelInfo.nameEs, it: channelInfo.nameIt, vi: channelInfo.nameVi }) : 'tráfico de pago'}»`,
        it: `Chat aperto — indica che desideri acquistare «${channelInfo ? pickField(lang, { zh: channelInfo.nameZh, en: channelInfo.nameEn, de: channelInfo.nameDe, ja: channelInfo.nameJa, ko: channelInfo.nameKo, es: channelInfo.nameEs, it: channelInfo.nameIt, vi: channelInfo.nameVi }) : 'traffico a pagamento'}»`, vi: `Đã mở chat — vui lòng cho biết bạn muốn mua «${channelInfo ? pickField(lang, { zh: channelInfo.nameZh, en: channelInfo.nameEn, de: channelInfo.nameDe, ja: channelInfo.nameJa, ko: channelInfo.nameKo, es: channelInfo.nameEs, it: channelInfo.nameIt, vi: channelInfo.nameVi }) : 'lưu lượng trả phí'}»`,
      }),
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
              {tr(lang, { zh: '运营计划', en: 'Growth plan', de: 'Wachstumsplan', ja: '運営プラン', ko: '운영 계획', es: 'Plan de crecimiento', it: 'Piano di crescita', vi: 'Kế hoạch phát triển' })}
            </h1>
            <p className="merchant-plan-subtitle">
              {tr(lang, { zh: '通过自然分享与付费推广获取店铺流量，提升曝光与成交', en: 'Grow traffic through organic sharing and paid promotion to boost exposure and sales.', de: 'Steigern Sie Traffic durch organisches Teilen und bezahlte Werbung, um Reichweite und Umsatz zu erhöhen.', ja: '自然流入と有料プロモーションでショップのトラフィックを増やし、露出と売上を向上させましょう。', ko: '자연 공유와 유료 프로모션으로 점포 트래픽을 확보하고 노출과 거래를 늘리세요.', es: 'Aumente el tráfico mediante compartición orgánica y promoción de pago para mejorar la exposición y las ventas.', it: 'Aumenta il traffico con condivisione organica e promozione a pagamento per migliorare visibilità e vendite.', vi: 'Tăng lưu lượng bằng chia sẻ tự nhiên và quảng cáo trả phí để nâng cao hiển thị và doanh số.' })}
            </p>
          </div>
        </div>
        {loading ? (
          <PlanHeaderStatsSkeleton />
        ) : (
          <div className="merchant-plan-header-stats">
            <div className="merchant-plan-header-stat">
              <span className="merchant-plan-header-stat-value">
                ${totalSales.toLocaleString()}
              </span>
              <span className="merchant-plan-header-stat-label">
                {tr(lang, { zh: '累计销售额', en: 'Total sales', de: 'Gesamtumsatz', ja: '累計売上', ko: '누적 매출', es: 'Ventas totales', it: 'Vendite totali', vi: 'Doanh số tích lũy' })}
              </span>
            </div>
            <div className="merchant-plan-header-stat">
              <span className="merchant-plan-header-stat-value">
                {pickField(lang, { zh: currentLevelInfo.nameZh, en: currentLevelInfo.nameEn, de: currentLevelInfo.nameDe, ja: currentLevelInfo.nameJa, ko: currentLevelInfo.nameKo, es: currentLevelInfo.nameEs, it: currentLevelInfo.nameIt, vi: currentLevelInfo.nameVi })}
              </span>
              <span className="merchant-plan-header-stat-label">
                {tr(lang, { zh: '当前等级', en: 'Current level', de: 'Aktuelles Level', ja: '現在のレベル', ko: '현재 등급', es: 'Nivel actual', it: 'Livello attuale', vi: 'Cấp hiện tại' })}
              </span>
            </div>
          </div>
        )}
      </header>

      {error && <div className="merchant-plan-error merchant-plan-error--v2">{error}</div>}

      <div className="merchant-plan-traffic-overview">
        <a href="#merchant-plan-organic" className="merchant-plan-traffic-overview-card merchant-plan-traffic-overview-card--organic">
          <span className="merchant-plan-traffic-overview-kicker">
            {tr(lang, { zh: '自然流量', en: 'Organic traffic', de: 'Organischer Traffic', ja: '自然流入', ko: '자연 유입', es: 'Tráfico orgánico', it: 'Traffico organico', vi: 'Lưu lượng tự nhiên' })}
          </span>
          <span className="merchant-plan-traffic-overview-title">
            {tr(lang, { zh: '分享店铺链接获客', en: 'Share your shop link', de: 'Shop-Link teilen', ja: 'ショップリンクを共有して集客', ko: '점포 링크 공유로 고객 유치', es: 'Comparta el enlace de su tienda', it: 'Condividi il link del negozio', vi: 'Chia sẻ liên kết cửa hàng' })}
          </span>
          <span className="merchant-plan-traffic-overview-desc">
            {tr(lang, { zh: '零成本，适合社群与私域传播', en: 'Free — great for communities and direct outreach', de: 'Kostenlos – ideal für Communities und direkte Ansprache', ja: '無料。コミュニティやダイレクト配信に最適', ko: '비용 없음 — 커뮤니티 및 직접 마케팅에 적합', es: 'Gratis: ideal para comunidades y contacto directo', it: 'Gratuito — ideale per community e contatto diretto', vi: 'Miễn phí — phù hợp cộng đồng và tiếp cận trực tiếp' })}
          </span>
        </a>
        <a href="#merchant-plan-paid" className="merchant-plan-traffic-overview-card merchant-plan-traffic-overview-card--paid">
          <span className="merchant-plan-traffic-overview-kicker">
            {tr(lang, { zh: '付费流量', en: 'Paid traffic', de: 'Bezahlter Traffic', ja: '有料トラフィック', ko: '유료 트래픽', es: 'Tráfico de pago', it: 'Traffico a pagamento', vi: 'Lưu lượng trả phí' })}
          </span>
          <span className="merchant-plan-traffic-overview-title">
            {tr(lang, { zh: '购买平台推广流量', en: 'Buy ad platform traffic', de: 'Werbtraffic kaufen', ja: 'プラットフォーム広告トラフィックを購入', ko: '플랫폼 프로모션 트래픽 구매', es: 'Compre tráfico de plataformas publicitarias', it: 'Acquista traffico da piattaforme pubblicitarie', vi: 'Mua lưu lượng quảng cáo nền tảng' })}
          </span>
          <span className="merchant-plan-traffic-overview-desc">
            {tr(lang, { zh: 'TikTok / Meta / Google / 其他', en: 'TikTok / Meta / Google / Other', de: 'TikTok / Meta / Google / Sonstige', ja: 'TikTok / Meta / Google / その他', ko: 'TikTok / Meta / Google / 기타', es: 'TikTok / Meta / Google / Otros', it: 'TikTok / Meta / Google / Altri', vi: 'TikTok / Meta / Google / Khác' })}
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
              {tr(lang, { zh: '自然流量', en: 'Organic traffic', de: 'Organischer Traffic', ja: '自然流入', ko: '자연 유입', es: 'Tráfico orgánico', it: 'Traffico organico', vi: 'Lưu lượng tự nhiên' })}
            </h2>
            <p className="merchant-plan-section-desc">
              {tr(lang, { zh: '使用您的专属店铺链接，分享给潜在买家，引导其进店浏览与下单。', en: 'Use your unique shop link and share it with potential buyers to drive visits and orders.', de: 'Nutzen Sie Ihren einzigartigen Shop-Link und teilen Sie ihn mit potenziellen Käufern, um Besuche und Bestellungen zu generieren.', ja: '専用ショップリンクを潜在顧客と共有し、来店・注文を促しましょう。', ko: '전용 점포 링크를 잠재 구매자와 공유하여 방문과 주문을 유도하세요.', es: 'Use su enlace exclusivo de tienda y compártalo con compradores potenciales para generar visitas y pedidos.', it: 'Usa il link esclusivo del negozio e condividilo con potenziali acquirenti per generare visite e ordini.', vi: 'Dùng liên kết cửa hàng riêng và chia sẻ với người mua tiềm năng để thu hút truy cập và đơn hàng.' })}
            </p>
          </div>
        </div>

        <div className="merchant-plan-link-card">
          <label className="merchant-plan-link-label" htmlFor="merchant-plan-shop-url">
            {tr(lang, { zh: '店铺推广链接', en: 'Shop promotion link', de: 'Shop-Werbelink', ja: 'ショッププロモーションリンク', ko: '점포 프로모션 링크', es: 'Enlace promocional de la tienda', it: 'Link promozionale del negozio', vi: 'Liên kết quảng bá cửa hàng' })}
          </label>
          <div className="merchant-plan-link-row">
            <input
              id="merchant-plan-shop-url"
              type="text"
              className="merchant-plan-link-input"
              readOnly
              value={shopPublicUrl || (tr(lang, { zh: '登录并绑定店铺后显示', en: 'Available after shop is linked', de: 'Verfügbar nach Shop-Verknüpfung', ja: 'ログインしてショップを連携後に表示', ko: '로그인 및 점포 연동 후 표시', es: 'Disponible tras vincular la tienda', it: 'Disponibile dopo il collegamento del negozio', vi: 'Hiển thị sau khi liên kết cửa hàng' }))}
            />
            <button
              type="button"
              className="merchant-plan-link-copy"
              onClick={copyShopLink}
              disabled={!shopPublicUrl}
            >
              {tr(lang, { zh: '复制链接', en: 'Copy link', de: 'Link kopieren', ja: 'リンクをコピー', ko: '링크 복사', es: 'Copiar enlace', it: 'Copia link', vi: 'Sao chép liên kết' })}
            </button>
          </div>
          {shop?.name ? (
            <p className="merchant-plan-link-hint">
              {tr(lang, { zh: `店铺：${shop.name}`, en: `Shop: ${shop.name}`, de: `Shop: ${shop.name}`, ja: `ショップ：${shop.name}`, ko: `점포: ${shop.name}`, es: `Tienda: ${shop.name}`, it: `Negozio: ${shop.name}`, vi: `Cửa hàng: ${shop.name}` })}
            </p>
          ) : null}
        </div>

        <ul className="merchant-plan-tips-list merchant-plan-tips-list--v2">
          {ORGANIC_TIPS.map((tip, i) => (
            <li key={i} className="merchant-plan-tips-item merchant-plan-tips-item--v2">
              <span className="merchant-plan-tips-num">{i + 1}</span>
              <span className="merchant-plan-tips-text">{pickBilingual(lang, tip)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="merchant-plan-paid" className="merchant-plan-section merchant-plan-section--v2 merchant-plan-section--paid">
        <div className="merchant-plan-section-head">
          <div className="merchant-plan-section-head-copy">
            <h2 className="merchant-plan-section-title">
              {tr(lang, { zh: '付费流量', en: 'Paid traffic', de: 'Bezahlter Traffic', ja: '有料トラフィック', ko: '유료 트래픽', es: 'Tráfico de pago', it: 'Traffico a pagamento', vi: 'Lưu lượng trả phí' })}
            </h2>
            <p className="merchant-plan-section-desc">
              {tr(lang, { zh: '购买 TikTok、Meta、Google 等平台推广流量，快速获取曝光。选择渠道后联系客服完成购买与投放配置。', en: 'Purchase traffic from TikTok, Meta, Google, and more. Contact support after selecting a channel to complete purchase and setup.', de: 'Kaufen Sie Traffic von TikTok, Meta, Google und mehr. Wählen Sie einen Kanal und kontaktieren Sie den Support, um Kauf und Einrichtung abzuschließen.', ja: 'TikTok、Meta、Google などの広告トラフィックを購入して露出を拡大。チャネル選択後、サポートに連絡して購入・配信設定を完了してください。', ko: 'TikTok, Meta, Google 등의 프로모션 트래픽을 구매하여 빠르게 노출을 확보하세요. 채널 선택 후 고객센터에 연락하여 구매 및 배포 설정을 완료하세요.', es: 'Compre tráfico de TikTok, Meta, Google y más. Contacte con soporte tras elegir un canal para completar la compra y la configuración.', it: 'Acquista traffico da TikTok, Meta, Google e altro. Contatta l\'assistenza dopo aver scelto un canale per completare acquisto e configurazione.', vi: 'Mua lưu lượng từ TikTok, Meta, Google và hơn thế. Liên hệ hỗ trợ sau khi chọn kênh để hoàn tất mua và cấu hình.' })}
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
                {pickField(lang, { zh: channel.nameZh, en: channel.nameEn, de: channel.nameDe, ja: channel.nameJa, ko: channel.nameKo, es: channel.nameEs, it: channel.nameIt, vi: channel.nameVi })}
              </h3>
              <p className="merchant-plan-paid-card-desc">
                {pickField(lang, { zh: channel.descZh, en: channel.descEn, de: channel.descDe, ja: channel.descJa, ko: channel.descKo, es: channel.descEs, it: channel.descIt, vi: channel.descVi })}
              </p>
              <button
                type="button"
                className="merchant-plan-paid-card-btn"
                onClick={() => consultPaidChannel(channel.key)}
              >
                {tr(lang, { zh: '咨询购买', en: 'Consult & buy', de: 'Beratung & Kauf', ja: '購入相談', ko: '구매 상담', es: 'Consultar y comprar', it: 'Consulta e acquista', vi: 'Tư vấn & mua' })}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="merchant-plan-section merchant-plan-section--v2 merchant-plan-section--levels">
        <div className="merchant-plan-section-head merchant-plan-section-head--compact">
          <div>
            <h2 className="merchant-plan-section-title">
              {tr(lang, { zh: '店铺等级与权益', en: 'Shop levels & benefits', de: 'Shop-Level & Vorteile', ja: 'ショップレベルと特典', ko: '점포 등급 및 혜택', es: 'Niveles y beneficios de la tienda', it: 'Livelli e vantaggi del negozio', vi: 'Cấp cửa hàng & quyền lợi' })}
            </h2>
            <p className="merchant-plan-section-desc">
              {tr(lang, { zh: '完成对应销售额自动升级；提升等级可解锁更高利润比例与平台扶持', en: 'Levels upgrade automatically as sales grow — unlock better margins and platform support.', de: 'Level steigen automatisch mit dem Umsatz – schalten Sie bessere Margen und Plattform-Support frei.', ja: '売上達成で自動アップグレード。レベルアップでより高い利益率とプラットフォーム支援が解放されます。', ko: '해당 매출 달성 시 자동 업그레이드 — 등급이 올라가면 더 높은 수익률과 플랫폼 지원이 제공됩니다.', es: 'Los niveles suben automáticamente con las ventas: desbloquee mejores márgenes y apoyo de la plataforma.', it: 'I livelli aumentano automaticamente con le vendite: sblocca margini migliori e supporto della piattaforma.', vi: 'Cấp tự động nâng theo doanh số — mở khóa biên lợi nhuận cao hơn và hỗ trợ nền tảng.' })}
            </p>
          </div>
        </div>

        {loading ? (
          <PlanCurrentLevelSkeleton />
        ) : (
        <div className="merchant-plan-current merchant-plan-current--v2">
          <div className="merchant-plan-current-card">
            <div className="merchant-plan-current-top">
              <div className="merchant-plan-current-icon" aria-hidden="true">
                <img src={currentLevelInfo.icon} alt="" className="merchant-plan-icon-img" loading="lazy" />
              </div>
              <div className="merchant-plan-current-info">
                <span className="merchant-plan-current-label">
                  {tr(lang, { zh: '当前等级', en: 'Current level', de: 'Aktuelles Level', ja: '現在のレベル', ko: '현재 등급', es: 'Nivel actual', it: 'Livello attuale', vi: 'Cấp hiện tại' })}
                </span>
                <h3 className="merchant-plan-current-name">
                  {pickField(lang, { zh: currentLevelInfo.nameZh, en: currentLevelInfo.nameEn, de: currentLevelInfo.nameDe, ja: currentLevelInfo.nameJa, ko: currentLevelInfo.nameKo, es: currentLevelInfo.nameEs, it: currentLevelInfo.nameIt, vi: currentLevelInfo.nameVi })}
                </h3>
                <p className="merchant-plan-current-desc">
                  {pickField(lang, { zh: currentLevelInfo.descZh, en: currentLevelInfo.descEn, de: currentLevelInfo.descDe, ja: currentLevelInfo.descJa, ko: currentLevelInfo.descKo, es: currentLevelInfo.descEs, it: currentLevelInfo.descIt, vi: currentLevelInfo.descVi })}
                </p>
              </div>
            </div>
            {nextTier ? (
              <div className="merchant-plan-current-progress-wrap">
                <div className="merchant-plan-current-progress-head">
                  <span className="merchant-plan-current-progress-text">
                    {tr(lang, { zh: '升级至 ', en: 'Upgrade to ', de: 'Upgrade auf ', ja: 'アップグレード先：', ko: '업그레이드: ', es: 'Subir a ', it: 'Passa a ', vi: 'Nâng cấp lên ' })}
                    {pickField(lang, { zh: nextTier.nameZh, en: nextTier.nameEn, de: nextTier.nameDe, ja: nextTier.nameJa, ko: nextTier.nameKo, es: nextTier.nameEs, it: nextTier.nameIt, vi: nextTier.nameVi })}
                    {tr(lang, { zh: '：还需 ', en: ': need ', de: ': noch ', ja: ' あと ', ko: ' ', es: ': faltan ', it: ': servono ancora ', vi: ': còn thiếu ' })}
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
                {tr(lang, { zh: '您已达到最高等级', en: 'You have reached the highest level', de: 'Sie haben das höchste Level erreicht', ja: '最高レベルに到達しました', ko: '최고 등급에 도달했습니다', es: 'Ha alcanzado el nivel máximo', it: 'Hai raggiunto il livello massimo', vi: 'Bạn đã đạt cấp cao nhất' })}
              </div>
            )}
          </div>
        </div>
        )}

        {!loading ? (
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
                    {pickField(lang, { zh: level.nameZh, en: level.nameEn, de: level.nameDe, ja: level.nameJa, ko: level.nameKo, es: level.nameEs, it: level.nameIt, vi: level.nameVi })}
                  </span>
                  {isCurrent && (
                    <span className="merchant-plan-level-badge">
                      {tr(lang, { zh: '当前', en: 'Current', de: 'Aktuell', ja: '現在', ko: '현재', es: 'Actual', it: 'Attuale', vi: 'Hiện tại' })}
                    </span>
                  )}
                  {isPast && !isCurrent && (
                    <span className="merchant-plan-level-badge merchant-plan-level-badge--done">
                      {tr(lang, { zh: '已达成', en: 'Achieved', de: 'Erreicht', ja: '達成済み', ko: '달성', es: 'Conseguido', it: 'Raggiunto', vi: 'Đã đạt' })}
                    </span>
                  )}
                </div>
                <div className="merchant-plan-level-desc">
                  {pickField(lang, { zh: level.descZh, en: level.descEn, de: level.descDe, ja: level.descJa, ko: level.descKo, es: level.descEs, it: level.descIt, vi: level.descVi })}
                </div>
                <ul className="merchant-plan-level-benefits">
                  {pickLevelBenefits(lang, level).map((b, i) => (
                    <li key={i} className="merchant-plan-level-benefit">
                      <span className="merchant-plan-level-benefit-check" aria-hidden>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                {isNextLevel && (
                  <button type="button" className="merchant-plan-level-upgrade-btn" onClick={scrollToPaid}>
                    {tr(lang, { zh: '获取流量冲刺升级', en: 'Get traffic to upgrade', de: 'Traffic für Upgrade gewinnen', ja: 'トラフィックを獲得してアップグレード', ko: '트래픽 확보로 업그레이드', es: 'Obtenga tráfico para subir de nivel', it: 'Ottieni traffico per salire di livello', vi: 'Thu hút lưu lượng để nâng cấp' })}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        ) : null}
      </section>
    </div>
  )
}

export default MerchantPlan
