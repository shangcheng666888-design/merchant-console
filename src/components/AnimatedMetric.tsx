import React from 'react'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'

export type AnimatedMetricFormat = 'number' | 'currency' | 'percent' | 'decimal' | 'compact'

interface AnimatedMetricProps {
  value: number
  format?: AnimatedMetricFormat
  decimals?: number
  className?: string
  duration?: number
}

function formatValue(value: number, format: AnimatedMetricFormat, decimals: number): string {
  if (!Number.isFinite(value)) return format === 'currency' ? '$0.00' : '0'

  switch (format) {
    case 'currency':
      if (decimals === 0) {
        return `$${Math.round(value).toLocaleString()}`
      }
      return `$${value.toFixed(decimals)}`
    case 'percent':
      return `${value.toFixed(decimals)}%`
    case 'decimal':
      return value.toFixed(decimals)
    case 'compact':
      return Math.round(value).toLocaleString()
    default:
      return String(Math.round(value))
  }
}

const AnimatedMetric: React.FC<AnimatedMetricProps> = ({
  value,
  format = 'number',
  decimals = format === 'currency' || format === 'decimal' || format === 'percent' ? 2 : 0,
  className,
  duration,
}) => {
  const animated = useAnimatedNumber(value, { duration })
  return <span className={className}>{formatValue(animated, format, decimals)}</span>
}

export default AnimatedMetric
