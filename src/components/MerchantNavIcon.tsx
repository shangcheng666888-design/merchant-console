import React, { useId } from 'react'

type NavIconName = 'home' | 'orders' | 'plus' | 'warehouse' | 'settings'

const GEAR_PATH =
  'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.22-.07.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94 0 .31.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.03-1.58zM12 15.6c1.98 0 3.6-1.62 3.6-3.6s-1.62-3.6-3.6-3.6-3.6 1.62-3.6 3.6 1.62 3.6 3.6 3.6z'

function NavIconDefs({ uid, active }: { uid: string; active?: boolean }) {
  if (active) {
    return (
      <defs>
        <linearGradient id={`${uid}-fill`} x1="5" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6b7dff" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id={`${uid}-soft`} x1="4" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b9bff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#4f46e5" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={`${uid}-hi`} x1="8" y1="6" x2="16" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
    )
  }
  return (
    <defs>
      <linearGradient id={`${uid}-muted`} x1="5" y1="5" x2="19" y2="19" gradientUnits="userSpaceOnUse">
        <stop stopColor="#94a3b8" />
        <stop offset="1" stopColor="#64748b" />
      </linearGradient>
    </defs>
  )
}

function buildIcons(uid: string, active?: boolean): Record<NavIconName, React.ReactNode> {
  const fill = active ? `url(#${uid}-fill)` : `url(#${uid}-muted)`
  const soft = active ? `url(#${uid}-soft)` : 'none'
  const hi = active ? `url(#${uid}-hi)` : 'none'
  const stroke = active ? '#4f46e5' : 'currentColor'
  const inner = active ? '#ffffff' : 'currentColor'

  return {
    home: active ? (
      <>
        <path
          d="M5.5 10.2 12 5.5l6.5 4.7V19a1.2 1.2 0 01-1.2 1.2H6.7A1.2 1.2 0 015.5 19v-8.8z"
          fill={soft}
        />
        <path
          d="M5.5 10.2 12 5.5l6.5 4.7V19a1.2 1.2 0 01-1.2 1.2H6.7A1.2 1.2 0 015.5 19v-8.8z"
          stroke={fill}
          strokeWidth="1.65"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M10 19v-5.2h4V19" fill={fill} opacity="0.92" />
        <path d="M6.5 11.2 12 7.4l5.5 3.8" stroke={hi} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <>
        <path
          d="M5.5 10.2 12 5.5l6.5 4.7V19a1.2 1.2 0 01-1.2 1.2H6.7A1.2 1.2 0 015.5 19v-8.8z"
          stroke={fill}
          strokeWidth="1.65"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M10 19v-5.2h4V19" stroke={fill} strokeWidth="1.65" strokeLinejoin="round" fill="none" />
      </>
    ),
    orders: active ? (
      <>
        <path
          d="M7.2 4.2h9.6c.6 0 1.1.5 1.1 1.1v13.2c0 .6-.5 1.1-1.1 1.1H7.2c-.6 0-1.1-.5-1.1-1.1V5.3c0-.6.5-1.1 1.1-1.1z"
          fill={soft}
        />
        <path
          d="M7.2 4.2h9.6c.6 0 1.1.5 1.1 1.1v13.2c0 .6-.5 1.1-1.1 1.1H7.2c-.6 0-1.1-.5-1.1-1.1V5.3c0-.6.5-1.1 1.1-1.1z"
          stroke={fill}
          strokeWidth="1.65"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M8.6 4.2v3h6.8v-3" stroke={fill} strokeWidth="1.65" strokeLinejoin="round" fill="none" />
        <path d="M9.2 11.8h5.6M9.2 14.6h3.8" stroke={inner} strokeWidth="1.45" strokeLinecap="round" opacity="0.95" />
        <circle cx="16.8" cy="16.2" r="2.35" fill="#ffffff" />
        <path
          d="M15.95 16.25l.75.78 1.55-1.62"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <>
        <path
          d="M7.2 4.2h9.6c.6 0 1.1.5 1.1 1.1v13.2c0 .6-.5 1.1-1.1 1.1H7.2c-.6 0-1.1-.5-1.1-1.1V5.3c0-.6.5-1.1 1.1-1.1z"
          stroke={fill}
          strokeWidth="1.65"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M8.6 4.2v3h6.8v-3" stroke={fill} strokeWidth="1.65" strokeLinejoin="round" fill="none" />
        <path d="M9.2 11.8h5.6M9.2 14.6h3.8" stroke={fill} strokeWidth="1.45" strokeLinecap="round" />
      </>
    ),
    plus: (
      <>
        <circle cx="12" cy="12" r="8.5" fill="#ffffff" fillOpacity="0.18" />
        <path d="M12 8.2v7.6M8.2 12h7.6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    warehouse: active ? (
      <>
        <path d="M12 4.8L4.6 8.9v8.8c0 .7.6 1.3 1.3 1.3h11.2c.7 0 1.3-.6 1.3-1.3V8.9L12 4.8z" fill={soft} />
        <path
          d="M12 4.8L4.6 8.9v8.8c0 .7.6 1.3 1.3 1.3h11.2c.7 0 1.3-.6 1.3-1.3V8.9L12 4.8z"
          stroke={fill}
          strokeWidth="1.65"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M12 4.8v14.2M4.6 8.9l7.4 4 7.4-4" stroke={fill} strokeWidth="1.45" strokeLinejoin="round" opacity="0.85" />
        <rect x="9.4" y="10.8" width="5.2" height="3.4" rx="0.8" fill={fill} opacity="0.95" />
      </>
    ) : (
      <>
        <path
          d="M12 4.8L4.6 8.9v8.8c0 .7.6 1.3 1.3 1.3h11.2c.7 0 1.3-.6 1.3-1.3V8.9L12 4.8z"
          stroke={fill}
          strokeWidth="1.65"
          strokeLinejoin="round"
          fill="none"
        />
        <path d="M12 4.8v14.2M4.6 8.9l7.4 4 7.4-4" stroke={fill} strokeWidth="1.45" strokeLinejoin="round" />
      </>
    ),
    settings: active ? (
      <path fillRule="evenodd" clipRule="evenodd" d={GEAR_PATH} fill={fill} />
    ) : (
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={GEAR_PATH}
        stroke={fill}
        strokeWidth="1.65"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  }
}

export function MerchantNavIcon({
  name,
  className,
  active,
}: {
  name: NavIconName
  className?: string
  active?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const icons = buildIcons(uid, active)

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      fill="none"
    >
      <NavIconDefs uid={uid} active={active} />
      {icons[name]}
    </svg>
  )
}
