import React from 'react'

export type MerchantOrderTabStatus =
  | 'all'
  | 'paid'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'return_pending'
  | 'returned'
  | 'refund_pending'
  | 'refunded'
  | 'cancelled'

interface MerchantOrderStatusTabIconProps {
  status: MerchantOrderTabStatus
  className?: string
}

const MerchantOrderStatusTabIcon: React.FC<MerchantOrderStatusTabIconProps> = ({
  status,
  className = '',
}) => {
  const props = {
    viewBox: '0 0 24 24',
    width: 16,
    height: 16,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }

  switch (status) {
    case 'all':
      return (
        <svg {...props}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
        </svg>
      )
    case 'paid':
      return (
        <svg {...props}>
          <path d="M7 4.5h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2v-11a2 2 0 012-2z" />
          <path d="M9 8.5h6M9 12h4" />
          <circle cx="16.5" cy="7.5" r="2.5" fill="currentColor" stroke="none" opacity="0.9" />
        </svg>
      )
    case 'shipped':
      return (
        <svg {...props}>
          <path d="M4.5 7.5h11l2.5 3v7.5H4.5V7.5z" />
          <path d="M15.5 7.5V5.5h3.5l1.5 2v2" />
          <circle cx="8" cy="18" r="1.5" />
          <circle cx="17" cy="18" r="1.5" />
        </svg>
      )
    case 'in_transit':
      return (
        <svg {...props}>
          <path d="M3.5 8.5h11l2 2.5v5.5H3.5V8.5z" />
          <path d="M14.5 8.5V6h3.5l1.5 2.5v2" />
          <circle cx="7.5" cy="16.5" r="1.5" />
          <circle cx="15.5" cy="16.5" r="1.5" />
          <path d="M19 10.5h1.5l1 2v3.5H19" />
        </svg>
      )
    case 'delivered':
      return (
        <svg {...props}>
          <path d="M4 10.5l8-6.5 8 6.5V19a1.5 1.5 0 01-1.5 1.5H5.5A1.5 1.5 0 014 19v-8.5z" />
          <path d="M9.5 20.5V13h5v7.5" />
          <path d="M10 16.5l1.5 1.5L14.5 15" />
        </svg>
      )
    case 'completed':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.5 12.2l2.4 2.4 4.8-5" />
        </svg>
      )
    case 'return_pending':
      return (
        <svg {...props}>
          <path d="M7 5.5h10v12H7z" />
          <path d="M10 9.5h4M10 12.5h4" />
          <path d="M5 9.5l2-2 2 2M7 7.5v5" />
        </svg>
      )
    case 'returned':
      return (
        <svg {...props}>
          <path d="M8 6.5h8a2 2 0 012 2v9a2 2 0 01-2 2H8a2 2 0 01-2-2v-9a2 2 0 012-2z" />
          <path d="M6 11.5h3l-1.5-1.5M9 11.5v3" />
        </svg>
      )
    case 'refund_pending':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v5l3 2" />
          <path d="M8.5 8.5h5.5a2.5 2.5 0 010 5H9.5" />
        </svg>
      )
    case 'refunded':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.5 12.5h7M12 9.5v6" />
          <path d="M9.5 10l-1.5 1.5M9.5 14l-1.5 1.5" />
        </svg>
      )
    case 'cancelled':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      )
    default:
      return null
  }
}

export default MerchantOrderStatusTabIcon
