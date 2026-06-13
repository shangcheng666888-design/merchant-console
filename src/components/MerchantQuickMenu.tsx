import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { openCrispChat } from '../utils/crispChat'
import { useMerchantShop } from '../context/MerchantShopContext'
import { pickLabel, tr } from '../i18n'
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
  labelDe: string
  labelJa: string
  labelKo: string
  labelEs: string
  labelIt: string
  labelVi: string
  labelFr: string
  descZh: string
  descEn: string
  descDe: string
  descJa: string
  descKo: string
  descEs: string
  descIt: string
  descVi: string
  iconSrc: string
  tone: QuickTone
}[] = [
  {
    path: '/finance',
    labelZh: '财务报表',
    labelEn: 'Finance',
    labelDe: 'Finanzen',
    labelJa: '財務レポート',
    labelKo: '재무 보고서',
    labelEs: 'Finanzas',
    labelIt: 'Finanze',
    labelVi: 'Tài chính',
    labelFr: 'Finances',
    descZh: '收支明细与对账',
    descEn: 'Revenue & reconciliation',
    descDe: 'Einnahmen & Abstimmung',
    descJa: '収支明細と照合',
    descKo: '수입·지출 내역 및 대조',
    descEs: 'Ingresos y conciliación',
    descIt: 'Entrate e riconciliazione',
    descVi: 'Thu chi và đối soát',
    iconSrc: loginIconFinance,
    tone: 'finance',
  },
  {
    path: '/plan',
    labelZh: '运营计划',
    labelEn: 'Growth plan',
    labelDe: 'Wachstumsplan',
    labelJa: '運営プラン',
    labelKo: '운영 플랜',
    labelEs: 'Plan de crecimiento',
    labelIt: 'Piano di crescita',
    labelVi: 'Kế hoạch tăng trưởng',
    labelFr: 'Plan de croissance',
    descZh: '推广投放与增长',
    descEn: 'Promotion & growth',
    descDe: 'Werbung & Wachstum',
    descJa: 'プロモーションと成長施策',
    descKo: '프로모션 및 성장 전략',
    descEs: 'Promoción y crecimiento',
    descIt: 'Promozione e crescita',
    descVi: 'Quảng cáo và tăng trưởng',
    iconSrc: loginIconPromoMobile,
    tone: 'plan',
  },
  {
    path: '/wallet',
    labelZh: '我的钱包',
    labelEn: 'Wallet',
    labelDe: 'Wallet',
    labelJa: 'ウォレット',
    labelKo: '내 지갑',
    labelEs: 'Cartera',
    labelIt: 'Portafoglio',
    labelVi: 'Ví',
    labelFr: 'Portefeuille',
    descZh: '充值、提现与余额',
    descEn: 'Balance, top-up & withdraw',
    descDe: 'Guthaben, Aufladen & Auszahlung',
    descJa: '残高・チャージ・出金',
    descKo: '충전, 출금 및 잔액',
    descEs: 'Saldo, recarga y retiro',
    descIt: 'Saldo, ricarica e prelievo',
    descVi: 'Số dư, nạp và rút tiền',
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
      aria-label={tr(lang, { zh: '快捷菜单', en: 'Quick menu', de: 'Schnellmenü', ja: 'クイックメニュー', ko: '빠른 메뉴', es: 'Menú rápido', it: 'Menu rapido', vi: 'Menu nhanh', fr: 'Menu rapide' })}
      onClick={onClose}
    >
      <div className="mc-quick-menu-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mc-quick-menu-handle" aria-hidden="true" />
        <div className="mc-quick-menu-head">
          <div className="mc-quick-menu-head-copy">
            <h2 className="mc-quick-menu-title">
              {tr(lang, { zh: '快捷入口', en: 'Quick actions', de: 'Schnellzugriff', ja: 'クイックアクセス', ko: '빠른 실행', es: 'Accesos rápidos', it: 'Azioni rapide', vi: 'Thao tác nhanh', fr: 'Actions rapides' })}
            </h2>
            <p className="mc-quick-menu-subtitle">
              {tr(lang, { zh: '常用功能，一键直达', en: 'Jump to frequently used tools', de: 'Häufig genutzte Funktionen', ja: 'よく使う機能へワンタップ', ko: '자주 쓰는 기능, 원터치 이동', es: 'Accede a las herramientas más usadas', it: 'Accedi rapidamente agli strumenti più usati', vi: 'Truy cập nhanh các công cụ thường dùng', fr: 'Accédez aux outils fréquemment utilisés' })}
            </p>
          </div>
          <button
            type="button"
            className="mc-quick-menu-close"
            aria-label={tr(lang, { zh: '关闭', en: 'Close', de: 'Schließen', ja: '閉じる', ko: '닫기', es: 'Cerrar', it: 'Chiudi', vi: 'Đóng', fr: 'Fermer' })}
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
                  {pickLabel(lang, item)}
                </span>
                <span className="mc-quick-menu-row-desc">
                  {tr(lang, { zh: item.descZh, en: item.descEn, de: item.descDe, ja: item.descJa, ko: item.descKo, es: item.descEs, it: item.descIt, vi: item.descVi })}
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
                {tr(lang, { zh: '在线客服', en: 'Support', de: 'Support', ja: 'オンラインサポート', ko: '온라인 고객센터', es: 'Soporte', it: 'Assistenza', vi: 'Hỗ trợ', fr: 'Assistance' })}
              </span>
              <span className="mc-quick-menu-row-desc">
                {tr(lang, { zh: '联系平台客服', en: 'Chat with our team', de: 'Mit unserem Team chatten', ja: 'プラットフォームサポートに連絡', ko: '플랫폼 고객센터 문의', es: 'Chatea con nuestro equipo', it: 'Chatta con il nostro team', vi: 'Trò chuyện với đội ngũ hỗ trợ', fr: 'Discutez avec notre équipe' })}
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
