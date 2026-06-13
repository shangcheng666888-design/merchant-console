import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MerchantSidebarNavIcon, type MerchantSidebarIconName } from './MerchantSidebarNavIcon'
import { api } from '../api/client'
import { useMerchantShop } from '../context/MerchantShopContext'
import { useLang } from '../context/LangContext'
import { getMerchantBrand } from '../constants/merchantBrand'
import { pickLabel, tr } from '../i18n'

export const MERCHANT_NAV_ITEMS = [
  { path: '/dashboard', labelZh: '仪表盘', labelEn: 'Dashboard', labelDe: 'Dashboard', labelJa: 'ダッシュボード', labelKo: '대시보드', labelEs: 'Panel', labelIt: 'Dashboard', labelVi: 'Bảng điều khiển', icon: 'dashboard' as const },
  { path: '/orders', labelZh: '店铺订单', labelEn: 'Orders', labelDe: 'Bestellungen', labelJa: '注文', labelKo: '매장 주문', labelEs: 'Pedidos', labelIt: 'Ordini', labelVi: 'Đơn hàng', icon: 'orders' as const },
  { path: '/warehouse', labelZh: '商品仓库', labelEn: 'Warehouse', labelDe: 'Lager', labelJa: '商品倉庫', labelKo: '상품 창고', labelEs: 'Almacén', labelIt: 'Magazzino', labelVi: 'Kho hàng', icon: 'warehouse' as const },
  { path: '/plan', labelZh: '运营计划', labelEn: 'Growth plan', labelDe: 'Wachstumsplan', labelJa: '運営プラン', labelKo: '운영 플랜', labelEs: 'Plan de crecimiento', labelIt: 'Piano di crescita', labelVi: 'Kế hoạch tăng trưởng', icon: 'plan' as const },
  { path: '/finance', labelZh: '财务报表', labelEn: 'Finance', labelDe: 'Finanzen', labelJa: '財務レポート', labelKo: '재무 보고서', labelEs: 'Finanzas', labelIt: 'Finanze', labelVi: 'Tài chính', icon: 'finance' as const },
  { path: '/wallet', labelZh: '我的钱包', labelEn: 'Wallet', labelDe: 'Wallet', labelJa: 'ウォレット', labelKo: '내 지갑', labelEs: 'Cartera', labelIt: 'Portafoglio', labelVi: 'Ví', icon: 'wallet' as const },
  { path: '/settings', labelZh: '设置', labelEn: 'Settings', labelDe: 'Einstellungen', labelJa: '設定', labelKo: '설정', labelEs: 'Ajustes', labelIt: 'Impostazioni', labelVi: 'Cài đặt', icon: 'settings' as const },
] as const satisfies ReadonlyArray<{
  path: string
  labelZh: string
  labelEn: string
  labelDe: string
  labelJa: string
  labelKo: string
  labelEs: string
  labelIt: string
  labelVi: string
  icon: MerchantSidebarIconName
}>

export interface MerchantBackendSidebarProps {
  collapsed?: boolean
}

const MerchantBackendSidebar: React.FC<MerchantBackendSidebarProps> = ({ collapsed = false }) => {
  const location = useLocation()
  const { shop } = useMerchantShop()
  const { lang } = useLang()
  const brand = getMerchantBrand(lang)

  return (
    <aside
      className={`merchant-backend-sidebar${collapsed ? ' merchant-backend-sidebar--collapsed' : ''}`}
    >
      <div className="merchant-backend-brand">
        <img
          src={brand.logo}
          alt=""
          className="merchant-backend-brand-logo"
          aria-hidden="true"
        />
        {!collapsed ? (
          <div className="merchant-backend-brand-copy">
            <strong className="merchant-backend-brand-name">{brand.name}</strong>
            <span className="merchant-backend-brand-product">{brand.productLine}</span>
            <span className="merchant-backend-brand-tagline">{brand.tagline}</span>
          </div>
        ) : null}
      </div>
      <nav
        className="merchant-backend-nav"
        aria-label={tr(lang, { zh: '店铺后台导航', en: 'Seller navigation', de: 'Händlernavigation', ja: '店舗管理ナビゲーション', ko: '판매자 내비게이션', es: 'Navegación del vendedor', it: 'Navigazione venditore', vi: 'Điều hướng người bán' })}
      >
        {MERCHANT_NAV_ITEMS.map((item) => {
          const isActive = item.path === '/wallet'
            ? location.pathname === '/wallet' || location.pathname.startsWith('/wallet/')
            : location.pathname === item.path
          const handleHoverPrefetch: React.MouseEventHandler<HTMLAnchorElement> = () => {
            if (!shop?.id) return
            const path = item.path
            if (path === '/orders') {
              api.get(`/api/orders?shop=${encodeURIComponent(shop.id)}`).catch(() => {})
            } else if (path === '/finance') {
              api.get(`/api/shops/${encodeURIComponent(shop.id)}/finance?days=30`).catch(() => {})
            } else if (path === '/plan') {
              api.get(`/api/shops/${encodeURIComponent(shop.id)}`).catch(() => {})
            }
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`merchant-backend-nav-item${isActive ? ' merchant-backend-nav-item--active' : ''}`}
              onMouseEnter={handleHoverPrefetch}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="merchant-backend-nav-icon-wrap">
                <MerchantSidebarNavIcon
                  name={item.icon}
                  className="merchant-backend-nav-icon-svg"
                  variant="light"
                />
              </span>
              <span className="merchant-backend-nav-label">
                {pickLabel(lang, item)}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default MerchantBackendSidebar
