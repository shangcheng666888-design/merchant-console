import { useState } from 'react'
import zhinengzhaiyao from '../assets/zhinengzhaiyao.png'
import type { Lang } from '../i18n'
import { tr } from '../i18n'

interface MerchantDashboardInsightProps {
  storageKey: string
  kicker: string
  text: string
  lang: Lang
  inCard?: boolean
  as?: 'section' | 'footer'
  className?: string
  iconSrc?: string
  actionLabel?: string
  onAction?: () => void
}

function readDismissed(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === '1'
  } catch {
    return false
  }
}

export default function MerchantDashboardInsight({
  storageKey,
  kicker,
  text,
  lang,
  inCard = false,
  as = 'section',
  className: extraClassName,
  iconSrc,
  actionLabel,
  onAction,
}: MerchantDashboardInsightProps) {
  const [dismissed, setDismissed] = useState(() => readDismissed(storageKey))

  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      // ignore storage errors
    }
  }

  const className = [
    'merchant-dashboard-insight',
    inCard ? 'merchant-dashboard-insight--in-card' : '',
    extraClassName ?? '',
  ]
    .filter(Boolean)
    .join(' ')
  const Tag = as

  return (
    <Tag className={className} aria-live="polite">
      <span className="merchant-dashboard-insight-icon merchant-dashboard-insight-icon--img" aria-hidden="true">
        <img src={iconSrc ?? zhinengzhaiyao} alt="" className="merchant-dashboard-insight-icon-img" />
      </span>
      <div className="merchant-dashboard-insight-body">
        <span className="merchant-dashboard-insight-kicker">{kicker}</span>
        <p className="merchant-dashboard-insight-text">{text}</p>
        {actionLabel && onAction ? (
          <button
            type="button"
            className="merchant-dashboard-insight-action"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        className="merchant-dashboard-insight-close"
        onClick={dismiss}
        aria-label={tr(lang, { zh: '关闭智能摘要', en: 'Dismiss smart insight', de: 'Intelligente Zusammenfassung schließen', ja: 'スマートサマリーを閉じる', ko: '스마트 요약 닫기', es: 'Cerrar resumen inteligente', it: 'Chiudi riepilogo intelligente', vi: 'Đóng tóm tắt thông minh' })}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            d="M7 7l10 10M17 7L7 17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </Tag>
  )
}
