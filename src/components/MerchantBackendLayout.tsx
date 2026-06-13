import React, { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import MerchantBackendSidebar, { MERCHANT_NAV_ITEMS } from './MerchantBackendSidebar'
import MerchantMobileSummary from './MerchantMobileSummary'
import MerchantQuickMenu from './MerchantQuickMenu'
import { MerchantNavIcon } from './MerchantNavIcon'
import ShopBanScreen from './ShopBanScreen'
import { openCrispChat } from '../utils/crispChat'
import { MerchantShopProvider, useMerchantShop } from '../context/MerchantShopContext'
import { MerchantSyncProvider } from '../context/MerchantSyncContext'
import { useLang } from '../context/LangContext'
import { useMerchantDashboardBrief } from '../hooks/useMerchantDashboardBrief'
import { getMerchantShopLevel, shopLevelDisplayName } from '../constants/merchantShopLevels'
import { LANG_LABELS, SUPPORTED_LANGS, pickLabel, tr, type Lang } from '../i18n'
import serviceIcon from '../assets/kefu.png'
import zhFlagIcon from '../assets/lang-zh.png'
import enFlagIcon from '../assets/lang-en.png'
import deFlagIcon from '../assets/lang-de.png'

const AUTH_USER_KEY = 'authUser'

const LANG_FLAG_ICONS: Record<Lang, string> = {
  zh: zhFlagIcon,
  tw: zhFlagIcon,
  en: enFlagIcon,
  de: deFlagIcon,
  ja: enFlagIcon,
  ko: enFlagIcon,
  es: enFlagIcon,
  it: enFlagIcon,
  vi: enFlagIcon,
}

function langFlagIcon(lang: Lang): string {
  return LANG_FLAG_ICONS[lang]
}

const MerchantBackendLayoutInner: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { lang, setLang } = useLang()
  const { shop, loading: shopLoading, isBanned } = useMerchantShop()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [authOk, setAuthOk] = useState<boolean | null>(null)
  const [mobileShopInfoOpen, setMobileShopInfoOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [quickMenuOpen, setQuickMenuOpen] = useState(false)
  const langSwitcherRef = useRef<HTMLDivElement>(null)
  const { pendingOrders } = useMerchantDashboardBrief(authOk === true)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langSwitcherRef.current && !langSwitcherRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false)
      }
    }
    if (langDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [langDropdownOpen])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_USER_KEY)
      const user = raw ? (JSON.parse(raw) as { shopId?: string | null }) : null
      if (!user || !user.shopId) {
        navigate('/login', { replace: true })
        return
      }
      setAuthOk(true)
    } catch {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(AUTH_USER_KEY)
    } catch {}
    navigate('/login')
  }

  if (authOk !== true) {
    return (
      <div className="merchant-backend mc-app-loading">
        <div className="mc-app-loading-inner">
          <span className="mc-app-loading-spinner" aria-hidden="true" />
          <span className="mc-app-loading-text">{tr(lang, { zh: '加载中…', en: 'Loading…', de: 'Wird geladen…', ja: '読み込み中…', ko: '로딩 중…', es: 'Cargando…', it: 'Caricamento…', vi: 'Đang tải…' })}</span>
        </div>
      </div>
    )
  }

  if (shopLoading && !shop) {
    return (
      <div className="merchant-backend mc-app-loading">
        <div className="mc-app-loading-inner">
          <span className="mc-app-loading-spinner" aria-hidden="true" />
          <span className="mc-app-loading-text">{tr(lang, { zh: '加载店铺信息…', en: 'Loading shop…', de: 'Shop wird geladen…', ja: '店舗情報を読み込み中…', ko: '매장 정보 로딩 중…', es: 'Cargando tienda…', it: 'Caricamento negozio…', vi: 'Đang tải cửa hàng…' })}</span>
        </div>
      </div>
    )
  }

  if (isBanned && shop) {
    return <ShopBanScreen shop={shop} onLogout={handleLogout} />
  }

  const mobileNavItems = [
    { path: '/dashboard' as const, labelZh: '首页', labelEn: 'Home', labelDe: 'Start', labelJa: 'ホーム', labelKo: '홈', labelEs: 'Inicio', labelIt: 'Home', labelVi: 'Trang chủ', icon: 'home' as const },
    { path: '/orders' as const, labelZh: '订单', labelEn: 'Orders', labelDe: 'Bestellungen', labelJa: '注文', labelKo: '주문', labelEs: 'Pedidos', labelIt: 'Ordini', labelVi: 'Đơn hàng', icon: 'orders' as const, badge: pendingOrders },
    { path: null, labelZh: '快捷', labelEn: 'More', labelDe: 'Mehr', labelJa: 'その他', labelKo: '더보기', labelEs: 'Más', labelIt: 'Altro', labelVi: 'Thêm', icon: 'plus' as const, quick: true },
    { path: '/warehouse' as const, labelZh: '仓库', labelEn: 'Stock', labelDe: 'Lager', labelJa: '倉庫', labelKo: '창고', labelEs: 'Almacén', labelIt: 'Magazzino', labelVi: 'Kho hàng', icon: 'warehouse' as const },
    { path: '/settings' as const, labelZh: '我的', labelEn: 'Me', labelDe: 'Profil', labelJa: 'マイページ', labelKo: '내 정보', labelEs: 'Mi perfil', labelIt: 'Profilo', labelVi: 'Của tôi', icon: 'settings' as const },
  ]

  const isMobile =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 768px)').matches

  const menuLabel = isMobile
    ? tr(lang, { zh: '店铺信息', en: 'Shop info', de: 'Shop-Info', ja: '店舗情報', ko: '매장 정보', es: 'Info de la tienda', it: 'Info negozio', vi: 'Thông tin cửa hàng' })
    : tr(lang, { zh: '展开菜单', en: 'Toggle menu', de: 'Menü umschalten', ja: 'メニューを切り替え', ko: '메뉴 열기/닫기', es: 'Alternar menú', it: 'Mostra/nascondi menu', vi: 'Bật/tắt menu' })

  const currentNavItem = [...MERCHANT_NAV_ITEMS]
    .sort((a, b) => b.path.length - a.path.length)
    .find(
      (item) =>
        location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    )
  const headerTitle =
    currentNavItem != null
      ? pickLabel(lang, currentNavItem)
      : tr(lang, { zh: '仪表盘', en: 'Dashboard', de: 'Dashboard', ja: 'ダッシュボード', ko: '대시보드', es: 'Panel', it: 'Dashboard', vi: 'Bảng điều khiển' })

  const shopLevelInfo = shop ? getMerchantShopLevel(shop.level) : null

  return (
    <div className="merchant-backend">
      <MerchantBackendSidebar collapsed={!sidebarOpen} />

      <div className="merchant-backend-main">
        <header className="merchant-backend-header">
          <button
            type="button"
            className="merchant-backend-menu-btn"
            aria-label={menuLabel}
            onClick={() => {
              if (isMobile) {
                setMobileShopInfoOpen(true)
              } else {
                setSidebarOpen((v) => !v)
              }
            }}
          >
            <span />
            <span />
            <span />
          </button>
          <h1 className="merchant-backend-header-title">
            {headerTitle}
          </h1>
          <div className="merchant-backend-header-right">
            <button
              type="button"
              className="merchant-backend-header-icon merchant-backend-header-msg"
              aria-label={tr(lang, { zh: '客服', en: 'Customer service', de: 'Kundenservice', ja: 'カスタマーサポート', ko: '고객센터', es: 'Atención al cliente', it: 'Assistenza clienti', vi: 'Chăm sóc khách hàng' })}
              onClick={() => openCrispChat({ shopName: shop?.name, shopId: shop?.id })}
            >
              <img
                src={serviceIcon}
                alt={tr(lang, { zh: '客服', en: 'Customer service', de: 'Kundenservice', ja: 'カスタマーサポート', ko: '고객센터', es: 'Atención al cliente', it: 'Assistenza clienti', vi: 'Chăm sóc khách hàng' })}
                width={20}
                height={20}
                aria-hidden="true"
              />
            </button>
            <div className="merchant-backend-lang-wrap" ref={langSwitcherRef}>
              <button
                type="button"
                className="merchant-backend-lang-btn"
                onClick={() => setLangDropdownOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={langDropdownOpen}
              >
                <span className="merchant-backend-lang-flag" aria-hidden="true">
                  <img
                    src={langFlagIcon(lang)}
                    alt=""
                    className="merchant-backend-lang-flag-img"
                  />
                </span>
                <span>{LANG_LABELS[lang]}</span>
                <span className="merchant-backend-lang-caret">▼</span>
              </button>
              {langDropdownOpen && (
                <div className="merchant-backend-lang-dropdown" role="listbox">
                  {SUPPORTED_LANGS.map((code) => (
                    <button
                      key={code}
                      type="button"
                      className="merchant-backend-lang-option"
                      aria-selected={lang === code}
                      onClick={() => {
                        setLang(code)
                        setLangDropdownOpen(false)
                      }}
                    >
                      <span className="merchant-backend-lang-option-flag" aria-hidden="true">
                        <img src={langFlagIcon(code)} alt="" className="merchant-backend-lang-flag-img" />
                      </span>
                      <span>{LANG_LABELS[code]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="merchant-backend-header-logout"
              aria-label={tr(lang, { zh: '退出登录', en: 'Logout', de: 'Abmelden', ja: 'ログアウト', ko: '로그아웃', es: 'Cerrar sesión', it: 'Esci', vi: 'Đăng xuất' })}
              onClick={() => setLogoutConfirmOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
                />
              </svg>
            </button>
          </div>
        </header>

        <MerchantMobileSummary />

        <div className="merchant-backend-content">
          <Outlet />
        </div>
        {logoutConfirmOpen && (
          <div
            className="merchant-backend-logout-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="merchant-backend-logout-title"
            onClick={() => setLogoutConfirmOpen(false)}
          >
            <div
              className="merchant-backend-logout-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="merchant-backend-logout-title"
                className="merchant-backend-logout-title"
              >
                {tr(lang, { zh: '确认退出登录？', en: 'Log out of this shop?', de: 'Vom Shop abmelden?', ja: 'ログアウトしますか？', ko: '로그아웃하시겠습니까?', es: '¿Cerrar sesión de esta tienda?', it: 'Uscire da questo negozio?', vi: 'Đăng xuất khỏi cửa hàng này?' })}
              </h2>
              <p className="merchant-backend-logout-subtitle">
                {tr(lang, {
                  zh: '退出后需要重新登录才能管理店铺。',
                  en: 'You will need to log in again to manage your shop.',
                  de: 'Sie müssen sich erneut anmelden, um Ihren Shop zu verwalten.',
                  ja: 'ログアウト後、店舗を管理するには再度ログインが必要です。',
                  ko: '로그아웃 후 매장을 관리하려면 다시 로그인해야 합니다.',
                  es: 'Tendrás que iniciar sesión de nuevo para gestionar tu tienda.', it: 'Dovrai accedere di nuovo per gestire il negozio.', vi: 'Bạn cần đăng nhập lại để quản lý cửa hàng.',
                })}
              </p>
              <div className="merchant-backend-logout-actions">
                <button
                  type="button"
                  className="merchant-backend-logout-btn merchant-backend-logout-btn--secondary"
                  onClick={() => setLogoutConfirmOpen(false)}
                >
                  {tr(lang, { zh: '取消', en: 'Cancel', de: 'Abbrechen', ja: 'キャンセル', ko: '취소', es: 'Cancelar', it: 'Annulla', vi: 'Hủy' })}
                </button>
                <button
                  type="button"
                  className="merchant-backend-logout-btn merchant-backend-logout-btn--primary"
                  onClick={handleLogout}
                >
                  {tr(lang, { zh: '确认退出', en: 'Log out', de: 'Abmelden', ja: 'ログアウト', ko: '로그아웃 확인', es: 'Cerrar sesión', it: 'Esci', vi: 'Đăng xuất' })}
                </button>
              </div>
            </div>
          </div>
        )}
        {isMobile && mobileShopInfoOpen && (
          <div
            className="merchant-backend-mobile-shop-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="merchant-backend-mobile-shop-title"
            onClick={() => setMobileShopInfoOpen(false)}
          >
            <div
              className="merchant-backend-mobile-shop-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="merchant-backend-mobile-shop-head">
                <h2
                  id="merchant-backend-mobile-shop-title"
                  className="merchant-backend-mobile-shop-title"
                >
                  {tr(lang, { zh: '店铺信息', en: 'Shop info', de: 'Shop-Info', ja: '店舗情報', ko: '매장 정보', es: 'Info de la tienda', it: 'Info negozio', vi: 'Thông tin cửa hàng' })}
                </h2>
                <button
                  type="button"
                  className="merchant-backend-mobile-shop-close"
                  aria-label={tr(lang, { zh: '关闭', en: 'Close', de: 'Schließen', ja: '閉じる', ko: '닫기', es: 'Cerrar', it: 'Chiudi', vi: 'Đóng' })}
                  onClick={() => setMobileShopInfoOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="merchant-backend-mobile-shop-body">
                <div className="merchant-backend-avatar-wrap">
                  {shop?.logo ? (
                    <img
                      src={shop.logo}
                      alt={tr(lang, { zh: '店铺头像', en: 'Shop avatar', de: 'Shop-Avatar', ja: '店舗アイコン', ko: '매장 아바타', es: 'Avatar de la tienda', it: 'Avatar negozio', vi: 'Ảnh đại diện cửa hàng' })}
                      className="merchant-backend-avatar"
                      loading="lazy"
                    />
                  ) : (
                    <div className="merchant-backend-avatar" aria-hidden="true">
                      <span>{shop?.name ? shop.name.slice(0, 1) : tr(lang, { zh: '店', en: 'S', de: 'S', ja: '店', ko: '매', es: 'T', it: 'N', vi: 'C' })}</span>
                    </div>
                  )}
                </div>
              {shop && shopLevelInfo && (
                <div className="merchant-backend-mobile-shop-meta">
                  <span className="merchant-backend-mobile-shop-tag">
                    <img
                      src={shopLevelInfo.icon}
                      alt=""
                      aria-hidden="true"
                      className="merchant-backend-mobile-shop-tag-icon"
                    />
                    {shopLevelDisplayName(shopLevelInfo, lang)}
                  </span>
                  <span className="merchant-backend-mobile-shop-sub">
                    {tr(lang, {
                      zh: `好评率 ${Math.round(shop.goodRate ?? 0)}% · 关注 ${shop.followers.toLocaleString()}`,
                      en: `Rating ${Math.round(shop.goodRate ?? 0)}% · ${shop.followers.toLocaleString()} followers`,
                      de: `Bewertung ${Math.round(shop.goodRate ?? 0)}% · ${shop.followers.toLocaleString()} Follower`,
                      ja: `評価 ${Math.round(shop.goodRate ?? 0)}% · フォロワー ${shop.followers.toLocaleString()}`,
                      ko: `좋은 평가율 ${Math.round(shop.goodRate ?? 0)}% · 팔로워 ${shop.followers.toLocaleString()}`,
                      es: `Valoración ${Math.round(shop.goodRate ?? 0)}% · ${shop.followers.toLocaleString()} seguidores`,
                      it: `Valutazione ${Math.round(shop.goodRate ?? 0)}% · ${shop.followers.toLocaleString()} follower`, vi: `Đánh giá ${Math.round(shop.goodRate ?? 0)}% · ${shop.followers.toLocaleString()} người theo dõi`,
                    })}
                  </span>
                </div>
              )}
                <div
                  className="merchant-backend-user-id"
                  title={shop?.name || tr(lang, { zh: '我的店铺', en: 'My shop', de: 'Mein Shop', ja: 'マイ店舗', ko: '내 매장', es: 'Mi tienda', it: 'Il mio negozio', vi: 'Cửa hàng của tôi' })}
                >
                  {shop?.name || tr(lang, { zh: '我的店铺', en: 'My shop', de: 'Mein Shop', ja: 'マイ店舗', ko: '내 매장', es: 'Mi tienda', it: 'Il mio negozio', vi: 'Cửa hàng của tôi' })}
                </div>
                {shop?.id && (
                  <div className="merchant-backend-user-phone">
                    {tr(lang, { zh: '店铺ID：', en: 'Shop ID: ', de: 'Shop-ID: ', ja: '店舗 ID: ', ko: '매장 ID: ', es: 'ID de la tienda: ', it: 'ID negozio: ', vi: 'ID cửa hàng: ' })}
                    {shop.id}
                  </div>
                )}
                {shop?.id && (
                  <Link
                    to={`/shops/${shop.id}`}
                    className="merchant-backend-view-shop-btn merchant-backend-view-shop-btn--mobile"
                    onClick={() => setMobileShopInfoOpen(false)}
                  >
                    {tr(lang, { zh: '查看我的店铺', en: 'View my shop', de: 'Meinen Shop anzeigen', ja: '店舗を見る', ko: '내 매장 보기', es: 'Ver mi tienda', it: 'Vedi il mio negozio', vi: 'Xem cửa hàng của tôi' })}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
        <nav className="merchant-backend-bottom-nav mc-bottom-nav">
          {mobileNavItems.map((item) => {
            if (item.quick) {
              return (
                <button
                  key="quick"
                  type="button"
                  className="mc-bottom-nav-item mc-bottom-nav-item--fab"
                  aria-label={tr(lang, { zh: '快捷菜单', en: 'Quick menu', de: 'Schnellmenü', ja: 'クイックメニュー', ko: '빠른 메뉴', es: 'Menú rápido', it: 'Menu rapido', vi: 'Menu nhanh' })}
                  onClick={() => setQuickMenuOpen(true)}
                >
                  <span className="mc-bottom-nav-icon-wrap mc-bottom-nav-icon-wrap--fab">
                    <MerchantNavIcon name="plus" className="mc-bottom-nav-icon" />
                  </span>
                  <span className="mc-bottom-nav-label">
                    {pickLabel(lang, item)}
                  </span>
                </button>
              )
            }
            const isActive =
              item.path === '/orders'
                ? location.pathname === '/orders'
                : item.path === '/settings'
                  ? location.pathname === '/settings' ||
                    location.pathname.startsWith('/finance') ||
                    location.pathname.startsWith('/plan') ||
                    location.pathname.startsWith('/wallet')
                  : location.pathname === item.path ||
                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'))
            return (
              <Link
                key={item.path}
                to={item.path!}
                className={`mc-bottom-nav-item${isActive ? ' mc-bottom-nav-item--active' : ''}`}
              >
                <span className="mc-bottom-nav-icon-wrap">
                  <MerchantNavIcon name={item.icon} className="mc-bottom-nav-icon" active={isActive} />
                  {item.badge != null && item.badge > 0 && (
                    <span className="mc-bottom-nav-badge">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </span>
                <span className="mc-bottom-nav-label">
                  {pickLabel(lang, item)}
                </span>
              </Link>
            )
          })}
        </nav>
        <MerchantQuickMenu open={quickMenuOpen} onClose={() => setQuickMenuOpen(false)} />
      </div>
    </div>
  )
}

const MerchantBackendLayout: React.FC = () => (
  <MerchantSyncProvider>
    <MerchantShopProvider>
      <MerchantBackendLayoutInner />
    </MerchantShopProvider>
  </MerchantSyncProvider>
)

export default MerchantBackendLayout
