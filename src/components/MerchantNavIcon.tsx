import React from 'react'

type NavIconName = 'home' | 'orders' | 'plus' | 'warehouse' | 'settings'

const paths: Record<NavIconName, React.ReactNode> = {
  home: (
    <path
      fill="currentColor"
      d="M12 3l9 8h-2v9h-5v-6H10v6H5v-9H3l9-8zm0 2.4L6 11v8h3v-6h6v6h3v-8l-6-5.6z"
    />
  ),
  orders: (
    <path
      fill="currentColor"
      d="M7 4h10a2 2 0 012 2v14l-7-3.5L5 20V6a2 2 0 012-2zm0 2v11.2l5-2.5 5 2.5V6H7z"
    />
  ),
  plus: <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />,
  warehouse: (
    <path
      fill="currentColor"
      d="M4 8.5L12 4l8 4.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1V8.5zm2 .8V19h3v-6h6v6h3v-9.7l-6-3.4-6 3.4z"
    />
  ),
  settings: (
    <path
      fill="currentColor"
      d="M12 8.5A3.5 3.5 0 1112 15.5 3.5 3.5 0 0112 8.5zm8.5 3.5c0 .55-.06 1.08-.17 1.6l2.02 1.57-1.9 3.29-2.4-.98a7.03 7.03 0 01-1.39.8l-.36 2.54H9.3l-.36-2.54a7.03 7.03 0 01-1.39-.8l-2.4.98-1.9-3.29 2.02-1.57c-.11-.52-.17-1.05-.17-1.6s.06-1.08.17-1.6L2.8 10.43l1.9-3.29 2.4.98c.43-.32.9-.58 1.39-.8l.36-2.54h5.3l.36 2.54c.49.22.96.48 1.39.8l2.4-.98 1.9 3.29-2.02 1.57c.11.52.17 1.05.17 1.6z"
    />
  ),
}

export function MerchantNavIcon({
  name,
  className,
}: {
  name: NavIconName
  className?: string
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
