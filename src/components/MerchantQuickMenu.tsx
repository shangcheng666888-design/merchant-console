import React from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { openCrispChat } from '../utils/crispChat'
import { useMerchantShop } from '../context/MerchantShopContext'

interface MerchantQuickMenuProps {
  open: boolean
  onClose: () => void
}

const QUICK_LINKS = [
  { path: '/finance', labelZh: '财务报表', labelEn: 'Finance', icon: '📊' },
  { path: '/plan', labelZh: '运营计划', labelEn: 'Growth plan', icon: '📈' },
  { path: '/wallet', labelZh: '我的钱包', labelEn: 'Wallet', icon: '💰' },
] as const

const MerchantQuickMenu: React.FC<MerchantQuickMenuProps> = ({ open, onClose }) => {
  const { lang } = useLang()
  const { shop } = useMerchantShop()

  if (!open) return null

  return (
    <div
      className="mc-quick-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'zh' ? '快捷菜单' : 'Quick menu'}
      onClick={onClose}
    >
      <div className="mc-quick-menu-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mc-quick-menu-head">
          <h2 className="mc-quick-menu-title">
            {lang === 'zh' ? '快捷入口' : 'Quick actions'}
          </h2>
          <button
            type="button"
            className="mc-quick-menu-close"
            aria-label={lang === 'zh' ? '关闭' : 'Close'}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="mc-quick-menu-grid">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="mc-quick-menu-item"
              onClick={onClose}
            >
              <span className="mc-quick-menu-item-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="mc-quick-menu-item-label">
                {lang === 'zh' ? item.labelZh : item.labelEn}
              </span>
            </Link>
          ))}
          <button
            type="button"
            className="mc-quick-menu-item mc-quick-menu-item--button"
            onClick={() => {
              openCrispChat({ shopName: shop?.name, shopId: shop?.id })
              onClose()
            }}
          >
            <span className="mc-quick-menu-item-icon" aria-hidden="true">
              💬
            </span>
            <span className="mc-quick-menu-item-label">
              {lang === 'zh' ? '在线客服' : 'Support'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MerchantQuickMenu
