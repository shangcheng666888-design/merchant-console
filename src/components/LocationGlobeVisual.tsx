import React, { useEffect, useRef } from 'react'
import createGlobe from 'cobe'
import { lerpGlobeAngle, locationToGlobeAngles } from '../utils/shopLocationMap'

const MARKER_ID = 'shop'

const GLOBE_BASE = {
  devicePixelRatio: 2,
  dark: 1.14,
  diffuse: 1.48,
  mapSamples: 28000,
  mapBrightness: 5.4,
  mapBaseBrightness: 0.05,
  baseColor: [0.06, 0.1, 0.26] as [number, number, number],
  markerColor: [1, 0.4, 0.26] as [number, number, number],
  glowColor: [0.32, 0.4, 0.98] as [number, number, number],
  markerElevation: 0.04,
  scale: 1.06,
  offset: [0, 0] as [number, number],
}

interface LocationGlobeVisualProps {
  mode: 'idle' | 'active'
  lat?: number
  lng?: number
  approximate?: boolean
}

const LocationGlobeVisual: React.FC<LocationGlobeVisualProps> = ({
  mode,
  lat,
  lng,
  approximate = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, vx: 0, vy: 0 })

  useEffect(() => {
    dragRef.current.vx = 0
    dragRef.current.vy = 0
    dragRef.current.active = false
  }, [lat, lng, mode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let width = canvas.offsetWidth
    const focus =
      mode === 'active' && typeof lat === 'number' && typeof lng === 'number'
        ? locationToGlobeAngles(lat, lng)
        : { phi: 0.8, theta: 0.4 }

    let phi = focus.phi
    let theta = focus.theta
    let raf = 0

    const globe = createGlobe(canvas, {
      ...GLOBE_BASE,
      width: Math.max(width, 1) * 2,
      height: Math.max(width, 1) * 2,
      phi,
      theta,
      markers:
        mode === 'active' && typeof lat === 'number' && typeof lng === 'number'
          ? [
              {
                location: [lat, lng] as [number, number],
                // 仅作 CSS 锚点，视觉由 HTML 层统一渲染
                size: 0.004,
                id: MARKER_ID,
                color: [1, 0.35, 0.22] as [number, number, number],
              },
            ]
          : [],
    })

    const tick = () => {
      if (mode === 'active' && typeof lat === 'number' && typeof lng === 'number') {
        const target = locationToGlobeAngles(lat, lng)
        const dragPhi = dragRef.current.vy
        const dragTheta = dragRef.current.vx
        const ease = dragRef.current.active ? 0.06 : 0.1

        phi = lerpGlobeAngle(phi, target.phi + dragPhi, ease)
        theta = lerpGlobeAngle(theta, target.theta + dragTheta, ease)

        if (!dragRef.current.active) {
          dragRef.current.vx *= 0.88
          dragRef.current.vy *= 0.88
        }
      } else {
        phi += 0.0032
        theta += 0.0011
      }

      globe.update({ phi, theta })
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    const ro = new ResizeObserver(() => {
      width = canvas.offsetWidth
      globe.update({
        width: Math.max(width, 1) * 2,
        height: Math.max(width, 1) * 2,
      })
    })
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      globe.destroy()
    }
  }, [mode, lat, lng, approximate])

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current.active = true
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
    wrapRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.lastX
    const dy = e.clientY - dragRef.current.lastY
    dragRef.current.lastX = e.clientX
    dragRef.current.lastY = e.clientY
    dragRef.current.vx += dx * 0.004
    dragRef.current.vy += dy * 0.003
  }

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current.active = false
    wrapRef.current?.releasePointerCapture(e.pointerId)
  }

  return (
    <div className="merchant-settings-loc-globe-shell">
      <div className="merchant-settings-loc-stars" aria-hidden="true" />
      <div className="merchant-settings-loc-orbit merchant-settings-loc-orbit--a" aria-hidden="true" />
      <div className="merchant-settings-loc-orbit merchant-settings-loc-orbit--b" aria-hidden="true" />

      <div
        ref={wrapRef}
        className="merchant-settings-loc-globe-wrap"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <canvas ref={canvasRef} className="merchant-settings-loc-globe-canvas" />
      </div>

      {mode === 'active' && (
        <div className="merchant-settings-loc-globe-marker" aria-hidden="true">
          <span className="merchant-settings-loc-globe-marker-bloom" />
          <span className="merchant-settings-loc-globe-marker-ring" />
          <span className="merchant-settings-loc-globe-marker-ring merchant-settings-loc-globe-marker-ring--2" />
          <span className="merchant-settings-loc-globe-marker-core" />
          <span className="merchant-settings-loc-globe-marker-pin">
            <svg viewBox="0 0 28 36" width="22" height="28" fill="none">
              <defs>
                <linearGradient id="mc-shop-pin" x1="14" y1="0" x2="14" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ff8a65" />
                  <stop offset="1" stopColor="#ff5252" />
                </linearGradient>
                <filter id="mc-shop-pin-shadow" x="-20%" y="-10%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#ff5252" floodOpacity="0.55" />
                </filter>
              </defs>
              <path
                d="M14 0C7.4 0 2 5.4 2 12c0 8.5 12 22 12 22s12-13.5 12-22C26 5.4 20.6 0 14 0z"
                fill="url(#mc-shop-pin)"
                filter="url(#mc-shop-pin-shadow)"
              />
              <circle cx="14" cy="12" r="4.5" fill="#fff" fillOpacity="0.95" />
              <circle cx="14" cy="12" r="2" fill="#ff5252" />
            </svg>
          </span>
        </div>
      )}

      <div className="merchant-settings-loc-globe-ground" aria-hidden="true" />
    </div>
  )
}

export default LocationGlobeVisual
