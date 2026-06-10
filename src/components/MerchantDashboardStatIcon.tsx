import React from 'react'

export type MerchantStatIconVariant =
  | 'products'
  | 'sales'
  | 'orders'
  | 'profit'
  | 'pending'
  | 'unsettled'

const icons: Record<MerchantStatIconVariant, React.ReactNode> = {
  products: (
    <>
      <path
        d="M12 3.5L4 8v8.5l8 4.5 8-4.5V8L12 3.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M4 8l8 4.5L20 8M12 12.5V21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8.5 10.2l7 3.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
    </>
  ),
  sales: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path
        d="M12 7.2v9.6M9.2 10h4.2c1.2 0 2 .7 2 1.65 0 .95-.8 1.65-2 1.65H10.4c-1.2 0-2 .7-2 1.65 0 .95.8 1.65 2 1.65h3.6"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  orders: (
    <>
      <path
        d="M8 4h8l2 3v11a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 016 18V7.5A1.5 1.5 0 017.5 6L8 4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M9 4v3h6V4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      <path d="M9 12h6M9 15.5h4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  profit: (
    <>
      <path
        d="M5 16.5l4.2-4.8 3.1 2.8L19 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M14.5 7.5H19v4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M5 18.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
    </>
  ),
  pending: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path
        d="M12 8v4.2l2.8 1.6"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  unsettled: (
    <>
      <path
        d="M4.5 9h15v9a1.5 1.5 0 01-1.5 1.5h-12A1.5 1.5 0 014.5 18V9z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M7.5 9V7.2A2.2 2.2 0 019.7 5h4.6a2.2 2.2 0 012.2 2.2V9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="13.5" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </>
  ),
}

interface MerchantDashboardStatIconProps {
  variant: MerchantStatIconVariant
  className?: string
}

const MerchantDashboardStatIcon: React.FC<MerchantDashboardStatIconProps> = ({
  variant,
  className = '',
}) => (
  <span
    className={`merchant-dashboard-stat-icon merchant-dashboard-stat-icon--${variant}${className ? ` ${className}` : ''}`}
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" className="merchant-dashboard-stat-icon-svg">
      {icons[variant]}
    </svg>
  </span>
)

export default MerchantDashboardStatIcon
