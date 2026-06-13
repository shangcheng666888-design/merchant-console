import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { openCrispChat } from '../utils/crispChat'
import { useMerchantShop } from '../context/MerchantShopContext'
import loginIconFinance from '../assets/login-icon-finance.png'
import loginIconPromoMobile from '../assets/login-icon-promo-mobile.png'
import loginIconWalletMobile from '../assets/login-icon-wallet-mobile.png'
import loginTrustSupport from '../assets/login-trust-support.png'

interface MerchantQuickMenuProps {
  open: boolean
  onClose: () => void
}

type QuickTone = 'finance' | 'plan' | 'wallet' | 'support'

const QUICK_LINKS: {
  path: string
  labelZh: string
  labelEn: string
  descZh: string
  descEn: string
  iconSrc: string
  tone: QuickTone
}[] = [
  {
    path: '/finance',
    labelZh: '财务报表',
    labelEn: 'Finance',
    descZh: '收支明细与对账',
    descEn: 'Revenue & reconciliation',
    iconSrc: loginIconFinance,
    tone: 'finance',
  },
  {
    path: '/plan',
    labelZh: '运营计划',
    labelEn: 'Growth plan',
    descZh: '推广投放与增长',
    descEn: 'Promotion & growth',
    iconSrc: loginIconPromoMobile,
    tone: 'plan',
  },
  {
    path: '/wallet',
    labelZh: '我的钱包',
    labelEn: 'Wallet',
    descZh: '充值、提现与余额',
    descEn: 'Balance, top-up & withdraw',
    iconSrc: loginIconWalletMobile,
    tone: 'wallet',
  },
]

function QuickMenuChevron() {
  return (
    <svg className="mc-quick-menu-row-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const MerchantQuickMenu: React.FC<MerchantQuickMenuProps> = ({ open, onClose }) => {
  const { lang } = useLang()
  const { shop } = useMerchantShop()

  useEffect(() => {
    if (!open) return
    document.body.classList.add('mc-overlay-open')
    return () => {
      document.body.classList.remove('mc-overlay-open')
    }
  }, [open])

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
        <div className="mc-quick-menu-handle" aria-hidden="true" />
        <div className="mc-quick-menu-head">
          <div className="mc-quick-menu-head-copy">
            <h2 className="mc-quick-menu-title">
              {lang === 'zh' ? '快捷入口' : 'Quick actions'}
            </h2>
            <p className="mc-quick-menu-subtitle">
              {lang === 'zh' ? '常用功能，一键直达' : 'Jump to frequently used tools'}
            </p>
          </div>
          <button
            type="button"
            className="mc-quick-menu-close"
            aria-label={lang === 'zh' ? '关闭' : 'Close'}
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.85"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="mc-quick-menu-list">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mc-quick-menu-row mc-quick-menu-row--${item.tone}`}
              onClick={onClose}
            >
              <span className="mc-quick-menu-row-icon" aria-hidden="true">
                <img
                  src={item.iconSrc}
                  alt=""
                  className="mc-quick-menu-row-icon-img"
                  width={30}
                  height={30}
                  decoding="async"
                />
              </span>
              <span className="mc-quick-menu-row-copy">
                <span className="mc-quick-menu-row-title">
                  {lang === 'zh' ? item.labelZh : item.labelEn}
                </span>
                <span className="mc-quick-menu-row-desc">
                  {lang === 'zh' ? item.descZh : item.descEn}
                </span>
              </span>
              <QuickMenuChevron />
            </Link>
          ))}
          <div className="mc-quick-menu-divider" role="separator" />
          <button
            type="button"
            className="mc-quick-menu-row mc-quick-menu-row--support"
            onClick={() => {
              openCrispChat({ shopName: shop?.name, shopId: shop?.id })
              onClose()
            }}
          >
            <span className="mc-quick-menu-row-icon" aria-hidden="true">
              <img
                src={loginTrustSupport}
                alt=""
                className="mc-quick-menu-row-icon-img mc-quick-menu-row-icon-img--support"
                width={30}
                height={30}
                decoding="async"
              />
            </span>
            <span className="mc-quick-menu-row-copy">
              <span className="mc-quick-menu-row-title">
                {lang === 'zh' ? '在线客服' : 'Support'}
              </span>
              <span className="mc-quick-menu-row-desc">
                {lang === 'zh' ? '联系平台客服' : 'Chat with our team'}
              </span>
            </span>
            <QuickMenuChevron />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MerchantQuickMenu
