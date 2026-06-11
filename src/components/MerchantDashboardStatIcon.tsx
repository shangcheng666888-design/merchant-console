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
    sales: ['#60b4ff', '#1d6fd8', '#e8f4ff'],
    orders: ['#b4a5ff', '#8b7cf6', '#f3f0ff'],
    profit: ['#f7d46a', '#c9920a', '#fff8e6'],
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
        <ellipse cx="12" cy="17.2" rx="7.8" ry="2.1" fill={bg} opacity="0.95" />
        <rect x="4.2" y="6.8" width="15.6" height="9.8" rx="2.6" fill={main} />
        <path d="M5.4 9.2h13.2" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" opacity="0.28" />
        <path d="M5.4 14.2h13.2" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" opacity="0.28" />
        <circle cx="17.2" cy="8.4" r="1.35" fill="#fff" fillOpacity="0.38" />
        <path
          d="M12 8.6c-1.75 0-2.75.95-2.75 2.05s1 2.05 2.75 2.1c1.55.05 2.75.95 2.75 2.05s-1.2 2.1-2.75 2.1"
          stroke="#fff"
          strokeWidth="1.75"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M12 7.5v7.8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="15.2" y="12.8" width="3.8" height="3.8" rx="1.1" fill="#fff" fillOpacity="0.96" />
        <path
          d="M16.4 15.1l1.4-1.55 1.4 1.55M17.1 13.5v2.2"
          stroke={`url(#${uid}-main)`}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
        <rect x="3.8" y="5.2" width="16.4" height="13.6" rx="3.4" fill={bg} />
        <rect x="3.8" y="5.2" width="16.4" height="13.6" rx="3.4" fill={main} fillOpacity="0.12" />
        <path
          d="M6.2 16.4h11.6"
          stroke={main}
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0.35"
        />
        <rect x="6.2" y="13.4" width="3" height="3" rx="0.85" fill={main} fillOpacity="0.48" />
        <rect x="10.5" y="11" width="3" height="5.4" rx="0.85" fill={main} fillOpacity="0.72" />
        <rect x="14.8" y="8.2" width="3" height="8.2" rx="0.85" fill={main} />
        <path
          d="M7.4 14.2l2.8-2.1 2.7 1.6 4.2-5.4"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="17.8" cy="8.4" r="2.35" fill="#fff" fillOpacity="0.96" />
        <path
          d="M17 8.55l.8-.95.8.95M17.8 7.55v1.85"
          stroke={`url(#${uid}-main)`}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="8.8" cy="7.4" rx="2.2" ry="1" fill="#fff" fillOpacity="0.28" />
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
