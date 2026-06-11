import { useEffect, useRef, useState } from 'react'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useAnimatedNumber(
  value: number,
  options?: { duration?: number; enabled?: boolean },
): number {
  const duration = options?.duration ?? 1100
  const enabled = options?.enabled ?? true
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const displayRef = useRef(value)

  useEffect(() => {
    displayRef.current = display
  }, [display])

  useEffect(() => {
    if (!enabled || prefersReducedMotion() || !Number.isFinite(value)) {
      fromRef.current = value
      setDisplay(value)
      return
    }

    const from = displayRef.current
    const to = value
    if (from === to) return

    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const next = from + (to - from) * easeOutCubic(progress)
      setDisplay(next)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
        setDisplay(to)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, enabled])

  return display
}
