import React, { useId } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { openCrispChat } from '../utils/crispChat'
import { useMerchantShop } from '../context/MerchantShopContext'
import {
  MerchantSidebarNavIcon,
  type MerchantSidebarIconName,
} from './MerchantSidebarNavIcon'

interface MerchantQuickMenuProps {
  open: boolean
  onClose: () => void
}

const QUICK_LINKS: {
  path: string
  labelZh: string
  labelEn: string
  icon: MerchantSidebarIconName
}[] = [
  { path: '/finance', labelZh: '财务报表', labelEn: 'Finance', icon: 'finance' },
  { path: '/plan', labelZh: '运营计划', labelEn: 'Growth plan', icon: 'plan' },
  { path: '/wallet', labelZh: '我的钱包', labelEn: 'Wallet', icon: 'wallet' },
]

function QuickMenuChatIcon({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none">
      <defs>
        <linearGradient id={`${uid}-g`} x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6b7dff" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <path
        d="M5.5 6.8h13c.8 0 1.5.7 1.5 1.5v6.2c0 .8-.7 1.5-1.5 1.5H9.2L5.5 18.8V8.3c0-.8.7-1.5 1.5-1.5z"
        fill={`url(#${uid}-g)`}
        opacity="0.15"
      />
      <path
        d="M5.5 6.8h13c.8 0 1.5.7 1.5 1.5v6.2c0 .8-.7 1.5-1.5 1.5H9.2L5.5 18.8V8.3c0-.8.7-1.5 1.5-1.5z"
        stroke={`url(#${uid}-g)`}
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path d="M8.2 10.8h7.6M8.2 13.4h4.8" stroke={`url(#${uid}-g)`} strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  )
}

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
                <MerchantSidebarNavIcon name={item.icon} variant="light" />
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
              <QuickMenuChatIcon />
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
