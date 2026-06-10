import React, { useId } from 'react'

export type MerchantStatIconVariant =
  | 'products'
  | 'sales'
  | 'orders'
  | 'profit'
  | 'pending'
  | 'unsettled'

function StatDefs({ uid, variant }: { uid: string; variant: MerchantStatIconVariant }) {
  const palettes: Record<MerchantStatIconVariant, [string, string, string]> = {
    products: ['#8b9bff', '#5b6cff', '#eef1ff'],
    sales: ['#7ec3ff', '#4f9cf9', '#edf6ff'],
    orders: ['#b4a5ff', '#8b7cf6', '#f3f0ff'],
    profit: ['#e8d5a8', '#c4a052', '#faf6ee'],
    pending: ['#f5a8b8', '#e85d75', '#fff0f3'],
    unsettled: ['#b8c0d4', '#8b93ad', '#f5f7fb'],
  }
  const [a, b, bg] = palettes[variant]
  return (
    <defs>
      <linearGradient id={`${uid}-main`} x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
        <stop stopColor={a} />
        <stop offset="1" stopColor={b} />
      </linearGradient>
      <linearGradient id={`${uid}-bg`} x1="4" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
        <stop stopColor={bg} stopOpacity="0.95" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.2" />
      </linearGradient>
    </defs>
  )
}

function buildStatIcons(uid: string): Record<MerchantStatIconVariant, React.ReactNode> {
  const main = `url(#${uid}-main)`
  const bg = `url(#${uid}-bg)`

  return {
    products: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="3" fill={bg} />
        <path
          d="M12 5.8L6.2 9v9.2c0 .7.6 1.2 1.3 1.2h9c.7 0 1.3-.5 1.3-1.2V9L12 5.8z"
          fill={main}
        />
        <path d="M6.2 9L12 12.2l5.8-3.2M12 12.2V20" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" opacity="0.55" />
      </>
    ),
    sales: (
      <>
        <circle cx="12" cy="12" r="8.2" fill={bg} />
        <circle cx="12" cy="12" r="7" fill={main} />
        <path
          d="M12 8.2v7.4M9.6 10.4h3.4c1 0 1.7.55 1.7 1.35s-.7 1.35-1.7 1.35H10.4c-1 0-1.7.55-1.7 1.35s.7 1.35 1.7 1.35h3.8"
          stroke="#fff"
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <ellipse cx="9.4" cy="9.2" rx="2" ry="1" fill="#fff" opacity="0.28" transform="rotate(-18 9.4 9.2)" />
      </>
    ),
    orders: (
      <>
        <rect x="5" y="4" width="14" height="16" rx="2.4" fill={bg} />
        <path
          d="M7.5 4.8h9l1.6 2.3v11.7c0 .7-.6 1.2-1.3 1.2H7.2c-.7 0-1.3-.5-1.3-1.2V7.1L7.5 4.8z"
          fill={main}
        />
        <path d="M8.8 4.8v2.6h6.4V4.8" stroke="#fff" strokeWidth="1.1" strokeLinejoin="round" opacity="0.65" />
        <path d="M9.2 12.2h5.6M9.2 15h3.6" stroke="#fff" strokeWidth="1.35" strokeLinecap="round" opacity="0.9" />
      </>
    ),
    profit: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="3" fill={bg} />
        <rect x="6" y="14" width="2.6" height="3.8" rx="0.8" fill={main} opacity="0.55" />
        <rect x="10.2" y="11.2" width="2.6" height="6.6" rx="0.8" fill={main} opacity="0.78" />
        <rect x="14.4" y="8" width="2.6" height="9.8" rx="0.8" fill={main} />
        <path
          d="M6.3 15.2l3.2-2.8 2.6 2.2 4.4-5.2"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.95"
        />
      </>
    ),
    pending: (
      <>
        <circle cx="12" cy="12" r="8.2" fill={bg} />
        <circle cx="12" cy="12" r="7" stroke={main} strokeWidth="1.8" fill="none" />
        <path d="M12 8.4v4l2.6 1.5" stroke={main} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="1.1" fill={main} />
      </>
    ),
    unsettled: (
      <>
        <rect x="4.8" y="8.2" width="14.4" height="9.6" rx="2" fill={bg} />
        <rect x="4.8" y="8.2" width="14.4" height="9.6" rx="2" fill={main} opacity="0.92" />
        <path
          d="M7.8 8.2V6.8a2 2 0 012-2h4.4a2 2 0 012 2v1.4"
          stroke="#fff"
          strokeWidth="1.35"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <circle cx="12" cy="12.8" r="2" fill="#fff" fillOpacity="0.95" />
        <path
          d="M10.8 12.8h2.4M12 11.6v2.4"
          stroke={main}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </>
    ),
  }
}

interface MerchantDashboardStatIconProps {
  variant: MerchantStatIconVariant
  className?: string
}

const MerchantDashboardStatIcon: React.FC<MerchantDashboardStatIconProps> = ({
  variant,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '')
  const icons = buildStatIcons(uid)

  return (
    <span
      className={`merchant-dashboard-stat-icon merchant-dashboard-stat-icon--${variant}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="merchant-dashboard-stat-icon-svg" fill="none">
        <StatDefs uid={uid} variant={variant} />
        {icons[variant]}
      </svg>
    </span>
  )
}

export default MerchantDashboardStatIcon
