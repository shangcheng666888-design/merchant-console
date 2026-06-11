import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MerchantSidebarNavIcon, type MerchantSidebarIconName } from './MerchantSidebarNavIcon'
import { api } from '../api/client'
import { useMerchantShop } from '../context/MerchantShopContext'
import { useLang } from '../context/LangContext'
import { getMerchantBrand } from '../constants/merchantBrand'

export const MERCHANT_NAV_ITEMS = [
  { path: '/dashboard', labelZh: '仪表盘', labelEn: 'Dashboard', icon: 'dashboard' as const },
  { path: '/orders', labelZh: '店铺订单', labelEn: 'Orders', icon: 'orders' as const },
  { path: '/warehouse', labelZh: '商品仓库', labelEn: 'Warehouse', icon: 'warehouse' as const },
  { path: '/plan', labelZh: '运营计划', labelEn: 'Growth plan', icon: 'plan' as const },
  { path: '/finance', labelZh: '财务报表', labelEn: 'Finance', icon: 'finance' as const },
  { path: '/wallet', labelZh: '我的钱包', labelEn: 'Wallet', icon: 'wallet' as const },
  { path: '/settings', labelZh: '设置', labelEn: 'Settings', icon: 'settings' as const },
] as const satisfies ReadonlyArray<{
  path: string
  labelZh: string
  labelEn: string
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
      <nav className="merchant-backend-nav" aria-label={lang === 'zh' ? '店铺后台导航' : 'Seller navigation'}>
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
                {lang === 'zh' ? item.labelZh : item.labelEn}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default MerchantBackendSidebar
