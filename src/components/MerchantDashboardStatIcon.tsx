import React, { useId } from 'react'

export type MerchantStatIconVariant =
  | 'products'
  | 'sales'
  | 'orders'
  | 'profit'
  | 'pending'
  | 'unsettled'

function StatIconShell({
  variant,
  className = '',
  children,
}: {
  variant: MerchantStatIconVariant
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={`merchant-dashboard-stat-icon merchant-dashboard-stat-icon--${variant}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="merchant-dashboard-stat-icon-svg" fill="none">
        {children}
      </svg>
    </span>
  )
}

function ProductsIcon({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-p-top`} x1="4" y1="8" x2="20" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id={`${uid}-p-left`} x1="4" y1="8" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={`${uid}-p-right`} x1="12" y1="8" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93c5fd" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <path d="M12 3.2L3.8 7.8v9.1L12 21.2l8.2-4.3V7.8L12 3.2z" fill={`url(#${uid}-p-left)`} opacity="0.92" />
      <path d="M12 3.2l8.2 4.6v9.1L12 21.2V12.4L3.8 7.8V7.8L12 3.2z" fill={`url(#${uid}-p-right)`} opacity="0.78" />
      <path d="M3.8 7.8L12 12.4l8.2-4.6L12 3.2 3.8 7.8z" fill={`url(#${uid}-p-top)`} />
      <path
        d="M12 12.4V21.2M3.8 7.8L12 12.4l8.2-4.6"
        stroke="#fff"
        strokeWidth="0.9"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M8.8 9.8l6.4 3.4"
        stroke="#fff"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.75"
      />
    </>
  )
}

function SalesIcon({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-s-coin`} x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6ee7b7" />
          <stop offset="0.45" stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id={`${uid}-s-shine`} x1="8" y1="7" x2="14" y2="11" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-s-card`} x1="4" y1="14" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a7f3d0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#059669" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <path
        d="M4.5 17.2c0-1.35 3.45-2.45 7.5-2.45s7.5 1.1 7.5 2.45"
        stroke="#059669"
        strokeWidth="1.15"
        strokeLinecap="round"
        opacity="0.35"
      />
      <ellipse cx="12" cy="16.8" rx="6.8" ry="1.55" fill="#047857" opacity="0.22" />
      <ellipse cx="12" cy="14.9" rx="6.4" ry="1.45" fill={`url(#${uid}-s-coin)`} opacity="0.55" />
      <ellipse cx="12" cy="13" rx="6.2" ry="1.4" fill={`url(#${uid}-s-coin)`} opacity="0.78" />
      <circle cx="12" cy="10.2" r="5.15" fill={`url(#${uid}-s-coin)`} stroke="#ecfdf5" strokeWidth="0.8" />
      <path
        d="M9.1 10.4c0-1.05 1.3-1.55 2.9-1.55s2.9.5 2.9 1.55c0 1.35-2.9 2.05-2.9 3.15"
        stroke="#fff"
        strokeWidth="1.35"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M12 13.55v1.05" stroke="#fff" strokeWidth="1.35" strokeLinecap="round" />
      <ellipse cx="10.1" cy="8.6" rx="2.2" ry="1.1" fill={`url(#${uid}-s-shine)`} transform="rotate(-18 10.1 8.6)" />
      <path
        d="M5.2 8.2l1.8-2.1M18.8 8.2l-1.8-2.1"
        stroke="#34d399"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="5.2" cy="7.8" r="0.75" fill="#6ee7b7" />
      <circle cx="18.8" cy="7.8" r="0.75" fill="#6ee7b7" />
      <rect x="4.2" y="18.1" width="15.6" height="2.8" rx="1.2" fill={`url(#${uid}-s-card)`} />
      <path d="M6.4 19.5h3.1M13.8 19.5h3.8" stroke="#10b981" strokeWidth="1.1" strokeLinecap="round" opacity="0.65" />
    </>
  )
}

function OrdersIcon({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-o-body`} x1="6" y1="4" x2="18" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`${uid}-o-tab`} x1="8" y1="4" x2="16" y2="7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ede9fe" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <path
        d="M7.2 5.2h9.6l1.9 2.8v10.2a1.6 1.6 0 01-1.6 1.6H7a1.6 1.6 0 01-1.6-1.6V6.8A1.6 1.6 0 017 5.2h.2z"
        fill={`url(#${uid}-o-body)`}
      />
      <path d="M8.8 5.2V7.8h6.4V5.2" fill={`url(#${uid}-o-tab)`} />
      <path
        d="M7.2 5.2h9.6l1.9 2.8v10.2a1.6 1.6 0 01-1.6 1.6H7a1.6 1.6 0 01-1.6-1.6V6.8A1.6 1.6 0 017 5.2h.2z"
        stroke="#fff"
        strokeWidth="0.85"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <rect x="9.2" y="10.2" width="5.6" height="1.15" rx="0.55" fill="#fff" opacity="0.92" />
      <rect x="9.2" y="12.6" width="4.1" height="1.15" rx="0.55" fill="#fff" opacity="0.72" />
      <circle cx="16.4" cy="15.8" r="2.35" fill="#fff" fillOpacity="0.95" />
      <path
        d="M15.45 15.85l.75.75 1.55-1.65"
        stroke="#7c3aed"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
}

function ProfitIcon({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-pr-bar`} x1="6" y1="18" x2="18" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fcd34d" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id={`${uid}-pr-line`} x1="5" y1="17" x2="19" y2="7" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fde68a" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path d="M4.5 18.5h15" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />
      <rect x="5.5" y="13.8" width="2.8" height="4.7" rx="0.9" fill={`url(#${uid}-pr-bar)`} opacity="0.55" />
      <rect x="10.1" y="10.8" width="2.8" height="7.7" rx="0.9" fill={`url(#${uid}-pr-bar)`} opacity="0.78" />
      <rect x="14.7" y="7.4" width="2.8" height="11.1" rx="0.9" fill={`url(#${uid}-pr-bar)`} />
      <path
        d="M5.2 16.1l4-3.6 3.1 2.7 5.2-6.4"
        stroke={`url(#${uid}-pr-line)`}
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.1 8.8h3.4v3.4"
        stroke="#fbbf24"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17.8" cy="6.8" r="1.1" fill="#fde68a" />
    </>
  )
}

function PendingIcon({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-pe-ring`} x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fca5a5" />
          <stop offset="1" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="8.2" fill={`url(#${uid}-pe-ring)`} opacity="0.18" />
      <circle cx="12" cy="12" r="7.2" stroke={`url(#${uid}-pe-ring)`} strokeWidth="1.65" />
      <path
        d="M12 8.2v4.35l2.95 1.75"
        stroke="#dc2626"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="1.05" fill="#dc2626" />
    </>
  )
}

function UnsettledIcon({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-u-body`} x1="5" y1="7" x2="19" y2="19" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <rect x="4.8" y="9.2" width="14.4" height="9.8" rx="1.6" fill={`url(#${uid}-u-body)`} />
      <path
        d="M8 9.2V7.5a2.1 2.1 0 012.1-2.1h3.8A2.1 2.1 0 0116 7.5v1.7"
        stroke="#fff"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle cx="12" cy="13.8" r="2.35" fill="#fff" fillOpacity="0.92" />
      <text
        x="12"
        y="14.65"
        textAnchor="middle"
        fontSize="3.2"
        fontWeight="700"
        fill="#475569"
        fontFamily="system-ui, sans-serif"
      >
        $
      </text>
    </>
  )
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

  const body = {
    products: <ProductsIcon uid={uid} />,
    sales: <SalesIcon uid={uid} />,
    orders: <OrdersIcon uid={uid} />,
    profit: <ProfitIcon uid={uid} />,
    pending: <PendingIcon uid={uid} />,
    unsettled: <UnsettledIcon uid={uid} />,
  }[variant]

  return (
    <StatIconShell variant={variant} className={className}>
      {body}
    </StatIconShell>
  )
}

export default MerchantDashboardStatIcon
