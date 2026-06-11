interface MiniSparklineProps {
  data: number[]
  color: string
  delay?: number
  className?: string
}

export default function MiniSparkline({ data, color, delay = 0, className }: MiniSparklineProps) {
  if (!data.length) return null

  const width = 108
  const height = 36
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const gradId = `spark-${color.replace('#', '')}-${delay}`

  const points = data.map((value, index) => {
    const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 6) - 3
    return { x, y }
  })

  const line = points.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `0,${height} ${line} ${width},${height}`
  const last = points[points.length - 1]

  return (
    <svg
      className={['merchant-overview-sparkline', className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ '--mc-spark-delay': `${delay}s` } as React.CSSProperties}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon className="merchant-overview-sparkline-area" points={area} fill={`url(#${gradId})`} />
      <polyline
        className="merchant-overview-sparkline-line"
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={100}
      />
      {last ? <circle className="merchant-overview-sparkline-dot" cx={last.x} cy={last.y} r="2.8" fill={color} /> : null}
    </svg>
  )
}
