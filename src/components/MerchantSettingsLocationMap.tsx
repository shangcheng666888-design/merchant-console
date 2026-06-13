import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import LocationGlobeVisual from './LocationGlobeVisual'
import {
  formatLatLabel,
  formatLngLabel,
  formatRegionDisplay,
  lookupCountryCentroid,
} from '../utils/shopLocationMap'

interface MerchantSettingsLocationMapProps {
  address: string
  country?: string
  lang: 'zh' | 'en'
}

interface ResolvedLocation {
  lat: number
  lng: number
  label: string
  approximate: boolean
}

function buildLocationQuery(address: string, country: string): string {
  const parts = [address.trim(), country.trim()].filter(Boolean)
  return parts.join(', ')
}

function resolveLocalFallback(query: string, country: string): ResolvedLocation | null {
  const centroid = lookupCountryCentroid(country) ?? lookupCountryCentroid(query)
  if (!centroid) return null
  const label = country.trim() || centroid.labelZh
  return {
    lat: centroid.lat,
    lng: centroid.lng,
    label,
    approximate: true,
  }
}

const MerchantSettingsLocationMap: React.FC<MerchantSettingsLocationMapProps> = ({
  address,
  country = '',
  lang,
}) => {
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [debouncedCountry, setDebouncedCountry] = useState('')
  const [resolved, setResolved] = useState<ResolvedLocation | null>(null)
  const [geocoding, setGeocoding] = useState(false)

  const liveQuery = useMemo(() => buildLocationQuery(address, country), [address, country])
  const hasInput = liveQuery.length > 0

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(liveQuery)
      setDebouncedCountry(country.trim())
    }, 600)
    return () => window.clearTimeout(timer)
  }, [liveQuery, country])

  useEffect(() => {
    if (!hasInput) {
      setResolved(null)
      setGeocoding(false)
      return
    }

    let cancelled = false
    setGeocoding(true)

    const resolve = async () => {
      const countryParam = debouncedCountry
        ? `&country=${encodeURIComponent(debouncedCountry)}`
        : ''

      try {
        const res = await api.get<{
          success?: boolean
          lat?: number
          lng?: number
          label?: string
          approximate?: boolean
        }>(`/api/geocode?q=${encodeURIComponent(debouncedQuery)}${countryParam}`)

        if (cancelled) return

        if (res.success !== false && typeof res.lat === 'number' && typeof res.lng === 'number' && !Number.isNaN(res.lat)) {
          setResolved({
            lat: res.lat,
            lng: res.lng,
            label: typeof res.label === 'string' && res.label.trim() ? res.label.trim() : debouncedQuery,
            approximate: Boolean(res.approximate),
          })
          return
        }
      } catch {
        // API unavailable (e.g. not deployed) — fall through to local fallback
      }

      if (cancelled) return

      const fallback = resolveLocalFallback(debouncedQuery, debouncedCountry)
      if (fallback) {
        setResolved(fallback)
        return
      }

      setResolved(null)
    }

    resolve().finally(() => {
      if (!cancelled) setGeocoding(false)
    })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, debouncedCountry, hasInput])

  const region = resolved ? formatRegionDisplay(resolved.label, address, lang) : null

  if (!hasInput) {
    return (
      <div className="merchant-settings-loc-card merchant-settings-loc-card--idle">
        <LocationGlobeVisual mode="idle" />
        <p className="merchant-settings-loc-empty-text">
          {lang === 'zh' ? '暂未设置店铺地址' : 'No shop address configured yet'}
        </p>
      </div>
    )
  }

  if (geocoding && !resolved) {
    return (
      <div className="merchant-settings-loc-card merchant-settings-loc-card--loading" aria-live="polite">
        <LocationGlobeVisual mode="idle" />
        <div className="merchant-settings-loc-loading-mask">
          <span className="merchant-settings-loc-loading-ring" />
          <span>{lang === 'zh' ? '正在定位…' : 'Locating…'}</span>
        </div>
      </div>
    )
  }

  if (!resolved || !region) {
    return (
      <div className="merchant-settings-loc-card merchant-settings-loc-card--idle">
        <LocationGlobeVisual mode="idle" />
        <p className="merchant-settings-loc-error">
          {lang === 'zh'
            ? '无法解析该地址，请检查店铺地址是否填写完整'
            : 'Could not locate this address. Please check your shop address.'}
        </p>
      </div>
    )
  }

  return (
    <div className="merchant-settings-loc-card">
      <div className="merchant-settings-loc-stage">
        <LocationGlobeVisual
          mode="active"
          lat={resolved.lat}
          lng={resolved.lng}
          approximate={resolved.approximate}
        />

        <div className="merchant-settings-loc-panel">
          <div className="merchant-settings-loc-panel-main">
            <p className="merchant-settings-loc-region">{region.headline}</p>
            <p className="merchant-settings-loc-country">{region.subtitle}</p>
          </div>
          <div className="merchant-settings-loc-panel-side">
            <span className="merchant-settings-loc-coords-line">{formatLatLabel(resolved.lat, lang)}</span>
            <span className="merchant-settings-loc-coords-line">{formatLngLabel(resolved.lng, lang)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MerchantSettingsLocationMap
