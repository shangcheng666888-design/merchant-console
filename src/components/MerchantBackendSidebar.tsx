import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MerchantSidebarNavIcon, type MerchantSidebarIconName } from './MerchantSidebarNavIcon'
import { api } from '../api/client'
import { useMerchantShop } from '../context/MerchantShopContext'
import { useLang } from '../context/LangContext'

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

  return (
    <aside
      className={`merchant-backend-sidebar${collapsed ? ' merchant-backend-sidebar--collapsed' : ''}`}
    >
      <div className="merchant-backend-user">
        <div className="merchant-backend-avatar-wrap">
          {shop?.logo ? (
            <img
              src={shop.logo}
              alt="店铺头像"
              className="merchant-backend-avatar"
              loading="lazy"
            />
          ) : (
            <div className="merchant-backend-avatar" aria-hidden="true">
              <span>{shop?.name ? shop.name.slice(0, 1) : '店'}</span>
            </div>
          )}
        </div>
        <div className="merchant-backend-user-id" title={shop?.name || '我的店铺'}>
          {shop?.name || '我的店铺'}
        </div>
        {shop?.id && (
          <div className="merchant-backend-user-phone">店铺ID：{shop.id}</div>
        )}
        {shop?.id && (
          <Link to={`/shops/${shop.id}`} className="merchant-backend-view-shop-btn">
            {lang === 'zh' ? '查看我的店铺' : 'View my shop'}
          </Link>
        )}
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
                <MerchantSidebarNavIcon name={item.icon} className="merchant-backend-nav-icon-svg" />
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
