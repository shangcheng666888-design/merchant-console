import React, { useId } from 'react'

type FlowIconProps = {
  size?: number
  className?: string
  /** plain：按钮/统计内；chip：空状态等轻底色场景 */
  variant?: 'plain' | 'chip'
}

const STEM = 2.35
const RAIL = 2.05

function FlowIconBg({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="5" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f5f7ff" />
          <stop offset="1" stopColor="#eef2ff" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${uid}-bg)`} stroke="#e0e7ff" strokeWidth="1" />
    </>
  )
}

/** 充值：资金流入（向下） */
export const MerchantRechargeFlowIcon: React.FC<FlowIconProps> = ({
  size = 22,
  className,
  variant = 'plain',
}) => {
  const uid = useId().replace(/:/g, '')

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      {variant === 'chip' ? <FlowIconBg uid={uid} /> : null}
      <path
        d="M6.75 17.15h10.5"
        stroke="currentColor"
        strokeWidth={RAIL}
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M6.75 17.15v1.35M17.25 17.15v1.35"
        stroke="currentColor"
        strokeWidth={RAIL}
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M12 6.5v6.35"
        stroke="currentColor"
        strokeWidth={STEM}
        strokeLinecap="round"
      />
      <path
        d="M12 16.35L7.85 12.2h8.3L12 16.35z"
        fill="currentColor"
      />
    </svg>
  )
}

/** 提现：资金流出（向上） */
export const MerchantWithdrawFlowIcon: React.FC<FlowIconProps> = ({
  size = 22,
  className,
  variant = 'plain',
}) => {
  const uid = useId().replace(/:/g, '')

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      {variant === 'chip' ? <FlowIconBg uid={uid} /> : null}
      <path
        d="M6.75 6.85h10.5"
        stroke="currentColor"
        strokeWidth={RAIL}
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M6.75 6.85V5.5M17.25 6.85V5.5"
        stroke="currentColor"
        strokeWidth={RAIL}
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M12 17.5V11.15"
        stroke="currentColor"
        strokeWidth={STEM}
        strokeLinecap="round"
      />
      <path
        d="M12 7.65L7.85 11.8h8.3L12 7.65z"
        fill="currentColor"
      />
    </svg>
  )
}
