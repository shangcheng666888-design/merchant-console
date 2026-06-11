import React from 'react'

export type MerchantConfirmVariant = 'brand' | 'warning' | 'danger'

interface MerchantConfirmModalProps {
  open: boolean
  title: string
  subtitle?: string
  confirmLabel: string
  cancelLabel: string
  variant?: MerchantConfirmVariant
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmIcon({ variant }: { variant: MerchantConfirmVariant }) {
  if (variant === 'danger') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          d="M9 3h6l1 2h4a1 1 0 0 1 0 2h-1.05l-1.03 12.2a2 2 0 0 1-2 1.8H9.08a2 2 0 0 1-2-1.8L6.05 7H5a1 1 0 1 1 0-2h4l1-2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M10 11v5M14 11v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }

  if (variant === 'warning') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          d="M12 3.2 20.8 19H3.2L12 3.2z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M12 9.5v5.2M12 17.1h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M6 8.5V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <rect x="4.5" y="8.5" width="15" height="11" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.5 12.2h5M9.5 15h3.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

const MerchantConfirmModal: React.FC<MerchantConfirmModalProps> = ({
  open,
  title,
  subtitle,
  confirmLabel,
  cancelLabel,
  variant = 'brand',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null

  const titleId = 'mc-confirm-modal-title'

  return (
    <div
      className="mc-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onCancel}
    >
      <div className="mc-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`mc-confirm-icon mc-confirm-icon--${variant}`} aria-hidden="true">
          <ConfirmIcon variant={variant} />
        </div>
        <h2 id={titleId} className="mc-confirm-title">
          {title}
        </h2>
        {subtitle ? <p className="mc-confirm-subtitle">{subtitle}</p> : null}
        <div className="mc-confirm-actions">
          <button
            type="button"
            className="mc-confirm-btn mc-confirm-btn--secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`mc-confirm-btn mc-confirm-btn--primary${
              variant === 'danger' ? ' mc-confirm-btn--danger' : ''
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MerchantConfirmModal
