import React from 'react'

export type MerchantSidebarIconName =
  | 'dashboard'
  | 'orders'
  | 'warehouse'
  | 'plan'
  | 'finance'
  | 'wallet'
  | 'settings'

const icons: Record<MerchantSidebarIconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.8" fill="currentColor" opacity="0.95" />
      <rect x="13" y="4" width="7" height="4.5" rx="1.5" fill="currentColor" opacity="0.55" />
      <rect x="13" y="10.5" width="7" height="9.5" rx="1.8" fill="currentColor" opacity="0.85" />
      <rect x="4" y="13" width="7" height="7" rx="1.8" fill="currentColor" opacity="0.7" />
    </>
  ),
  orders: (
    <>
      <path
        d="M8 3.5h8l1.8 2.6v12.4a1.4 1.4 0 01-1.4 1.4H7.6a1.4 1.4 0 01-1.4-1.4V6.1L8 3.5z"
        fill="currentColor"
        opacity="0.22"
      />
      <path
        d="M8 3.5h8l1.8 2.6v12.4a1.4 1.4 0 01-1.4 1.4H7.6a1.4 1.4 0 01-1.4-1.4V6.1L8 3.5z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M9.2 3.5v2.8h5.6V3.5" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" />
      <path d="M9.5 12h5M9.5 15h3.6" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </>
  ),
  warehouse: (
    <>
      <path
        d="M4 9.2L12 5l8 4.2v9.3a1.2 1.2 0 01-1.2 1.2H5.2A1.2 1.2 0 014 18.5V9.2z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M4 9.2L12 5l8 4.2v9.3a1.2 1.2 0 01-1.2 1.2H5.2A1.2 1.2 0 014 18.5V9.2z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M12 5v13.7M4 9.2l8 4.4 8-4.4" stroke="currentColor" strokeWidth="1.45" strokeLinejoin="round" />
    </>
  ),
  plan: (
    <>
      <path
        d="M5 17.5l3.8-4.2 3.2 2.6L19 8.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14.8 8.2H19v4.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="5" y="16.8" width="14" height="1.4" rx="0.7" fill="currentColor" opacity="0.35" />
    </>
  ),
  finance: (
    <>
      <path
        d="M12 4.5A7.5 7.5 0 104.5 12 7.5 7.5 0 0112 4.5z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M12 4.5A7.5 7.5 0 104.5 12 7.5 7.5 0 0112 4.5z"
        stroke="currentColor"
        strokeWidth="1.55"
        fill="none"
      />
      <path
        d="M12 4.5v7.5l5.2 3"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  wallet: (
    <>
      <path
        d="M4.8 7.8h14.4a1.4 1.4 0 011.4 1.4v7.6a1.4 1.4 0 01-1.4 1.4H4.8a1.4 1.4 0 01-1.4-1.4V9.2a1.4 1.4 0 011.4-1.4z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M4.8 7.8h14.4a1.4 1.4 0 011.4 1.4v7.6a1.4 1.4 0 01-1.4 1.4H4.8a1.4 1.4 0 01-1.4-1.4V9.2a1.4 1.4 0 011.4-1.4z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M6.2 7.8V6.4A2 2 0 018.2 4.4h7.6a2 2 0 012 2v1.4"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16.2" cy="12" r="1.35" fill="currentColor" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      <path
        d="M12 3.2v2.1M12 18.7v2.1M4.8 7.1l1.8 1.05M17.4 15.8l1.8 1.05M3.2 12h2.1M18.7 12h2.1M4.8 16.9l1.8-1.05M17.4 8.2l1.8-1.05"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="5.4" stroke="currentColor" strokeWidth="1.45" fill="none" opacity="0.55" />
    </>
  ),
}

export function MerchantSidebarNavIcon({
  name,
  className,
}: {
  name: MerchantSidebarIconName
  className?: string
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  )
}
