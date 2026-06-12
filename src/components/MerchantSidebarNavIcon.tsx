import React, { useId } from 'react'

export type MerchantSidebarIconName =
  | 'dashboard'
  | 'orders'
  | 'warehouse'
  | 'plan'
  | 'finance'
  | 'wallet'
  | 'settings'

const STROKE = 1.65

function SidebarIconDefs({ uid, variant }: { uid: string; variant: 'sidebar' | 'light' }) {
  if (variant === 'light') {
    return (
      <defs>
        <linearGradient id={`${uid}-face`} x1="5" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6b7dff" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id={`${uid}-soft`} x1="4" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b9bff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#4f46e5" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={`${uid}-accent`} x1="8" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#c7d0ff" stopOpacity="0.85" />
        </linearGradient>
      </defs>
    )
  }
  return (
    <defs>
      <linearGradient id={`${uid}-face`} x1="5" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="1" stopColor="#c7d0ff" />
      </linearGradient>
      <linearGradient id={`${uid}-soft`} x1="4" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" stopOpacity="0.38" />
        <stop offset="1" stopColor="#8b9bff" stopOpacity="0.12" />
      </linearGradient>
      <linearGradient id={`${uid}-accent`} x1="8" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="1" stopColor="#a5b4fc" />
      </linearGradient>
    </defs>
  )
}

function buildIcons(uid: string): Record<MerchantSidebarIconName, React.ReactNode> {
  const face = `url(#${uid}-face)`
  const soft = `url(#${uid}-soft)`
  const accent = `url(#${uid}-accent)`

  return {
    dashboard: (
      <>
        <rect x="3.5" y="3.5" width="7.8" height="7.8" rx="2.4" fill={face} />
        <rect x="12.7" y="3.5" width="7.8" height="5.2" rx="2" fill={face} opacity="0.72" />
        <rect x="12.7" y="10.3" width="7.8" height="10.2" rx="2.4" fill={face} opacity="0.88" />
        <rect x="3.5" y="12.7" width="7.8" height="7.8" rx="2.4" fill={face} opacity="0.82" />
        <circle cx="7.4" cy="7.4" r="1.1" fill="#ffffff" opacity="0.55" />
      </>
    ),
    orders: (
      <>
        <path
          d="M7.2 4.2h9.6c.6 0 1.1.5 1.1 1.1v13.2c0 .6-.5 1.1-1.1 1.1H7.2c-.6 0-1.1-.5-1.1-1.1V5.3c0-.6.5-1.1 1.1-1.1z"
          fill={soft}
        />
        <path
          d="M7.2 4.2h9.6c.6 0 1.1.5 1.1 1.1v13.2c0 .6-.5 1.1-1.1 1.1H7.2c-.6 0-1.1-.5-1.1-1.1V5.3c0-.6.5-1.1 1.1-1.1z"
          stroke={face}
          strokeWidth={STROKE}
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M8.6 4.2v3h6.8v-3" stroke={face} strokeWidth={STROKE} strokeLinejoin="round" fill="none" />
        <path d="M9.2 11.8h5.6M9.2 14.6h3.8" stroke={face} strokeWidth={1.45} strokeLinecap="round" opacity="0.9" />
        <circle cx="16.8" cy="16.2" r="2.35" fill={accent} />
        <path
          d="M15.95 16.25l.75.78 1.55-1.62"
          stroke="#4f46e5"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    warehouse: (
      <>
        <path d="M12 4.8L4.6 8.9v8.8c0 .7.6 1.3 1.3 1.3h11.2c.7 0 1.3-.6 1.3-1.3V8.9L12 4.8z" fill={soft} />
        <path
          d="M12 4.8L4.6 8.9v8.8c0 .7.6 1.3 1.3 1.3h11.2c.7 0 1.3-.6 1.3-1.3V8.9L12 4.8z"
          stroke={face}
          strokeWidth={STROKE}
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M12 4.8v14.2M4.6 8.9l7.4 4 7.4-4" stroke={face} strokeWidth={1.45} strokeLinejoin="round" opacity="0.92" />
        <rect x="9.4" y="10.8" width="5.2" height="3.4" rx="0.8" fill={accent} opacity="0.95" />
      </>
    ),
    plan: (
      <>
        <circle cx="12" cy="12.2" r="8.4" fill={soft} />
        <rect x="4.8" y="15.2" width="3.6" height="2.6" rx="0.75" fill={face} opacity="0.52" />
        <rect x="9.2" y="12.4" width="3.6" height="5.4" rx="0.75" fill={face} opacity="0.72" />
        <rect x="13.6" y="9.2" width="3.6" height="8.6" rx="0.75" fill={face} />
        <path
          d="M6.4 15.2l3.4-2.4 3.2 2 3.6-4.6"
          stroke={accent}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="16.8" cy="9.8" r="1.2" fill={accent} />
        <path d="M16.8 5.6v4.4" stroke={face} strokeWidth="1.35" strokeLinecap="round" />
        <path
          d="M16.8 6.1h2.5l-.85 1.15.85 1.15h-2.5z"
          fill={face}
          stroke={face}
          strokeWidth="0.85"
          strokeLinejoin="round"
        />
        <path d="M4.8 17.8h14.4" stroke={face} strokeWidth="1.1" strokeLinecap="round" opacity="0.28" />
      </>
    ),
    finance: (
      <>
        <path
          d="M7.2 4.2h7.8l3 3v12.6c0 .7-.6 1.2-1.2 1.2H7.2c-.7 0-1.2-.5-1.2-1.2V5.4c0-.7.5-1.2 1.2-1.2z"
          fill={soft}
        />
        <path
          d="M7.2 4.2h7.8l3 3v12.6c0 .7-.6 1.2-1.2 1.2H7.2c-.7 0-1.2-.5-1.2-1.2V5.4c0-.7.5-1.2 1.2-1.2z"
          stroke={face}
          strokeWidth={STROKE}
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M15 4.2v3h3" stroke={face} strokeWidth={STROKE} strokeLinejoin="round" fill="none" />
        <path d="M8.4 8h8.2M8.4 10.2h5.8" stroke={face} strokeWidth="1.15" strokeLinecap="round" opacity="0.42" />
        <rect x="8.6" y="14.8" width="2" height="3.2" rx="0.45" fill={accent} />
        <rect x="11.4" y="13.2" width="2" height="4.8" rx="0.45" fill={face} opacity="0.72" />
        <rect x="14.2" y="11.2" width="2" height="6.8" rx="0.45" fill={face} />
        <path
          d="M8.8 12.6l2.8-1.6 2.4 1.8 3.2-2.8"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="16.4" cy="9.8" r="1" fill={accent} />
      </>
    ),
    wallet: (
      <>
        <path
          d="M5.2 8.4h13.6c.8 0 1.4.6 1.4 1.4v6.8c0 .8-.6 1.4-1.4 1.4H5.2c-.8 0-1.4-.6-1.4-1.4V9.8c0-.8.6-1.4 1.4-1.4z"
          fill={soft}
        />
        <path
          d="M5.2 8.4h13.6c.8 0 1.4.6 1.4 1.4v6.8c0 .8-.6 1.4-1.4 1.4H5.2c-.8 0-1.4-.6-1.4-1.4V9.8c0-.8.6-1.4 1.4-1.4z"
          stroke={face}
          strokeWidth={STROKE}
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M6.8 8.4V7a1.8 1.8 0 011.8-1.8h7.6A1.8 1.8 0 0118 7v1.4"
          stroke={face}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
        />
        <rect x="13.8" y="11.2" width="4.8" height="3.2" rx="1.2" fill={accent} />
        <circle cx="15.4" cy="12.8" r="0.75" fill="#4f46e5" />
      </>
    ),
    settings: (
      <>
        <rect x="4.2" y="4.8" width="15.6" height="14.4" rx="2.6" fill={soft} />
        <rect
          x="4.2"
          y="4.8"
          width="15.6"
          height="14.4"
          rx="2.6"
          stroke={face}
          strokeWidth={STROKE}
          fill="none"
        />
        <rect x="6.1" y="6.6" width="6.8" height="10.8" rx="1.6" fill={face} opacity="0.88" />
        <rect x="14.2" y="6.6" width="4.1" height="4.8" rx="1.1" fill={face} opacity="0.58" />
        <rect x="14.2" y="12.4" width="4.1" height="5" rx="1.1" fill={accent} />
        <path
          d="M7.6 9.2h3.8M7.6 11.4h2.6"
          stroke="#ffffff"
          strokeWidth="1.15"
          strokeLinecap="round"
          opacity="0.72"
        />
        <circle cx="16.25" cy="14.9" r="0.85" fill="#4f46e5" />
      </>
    ),
  }
}

export function MerchantSidebarNavIcon({
  name,
  className,
  variant = 'sidebar',
}: {
  name: MerchantSidebarIconName
  className?: string
  variant?: 'sidebar' | 'light'
}) {
  const uid = useId().replace(/:/g, '')
  const icons = buildIcons(uid)

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      fill="none"
    >
      <SidebarIconDefs uid={uid} variant={variant} />
      {icons[name]}
    </svg>
  )
}
