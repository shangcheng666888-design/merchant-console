import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import LocationGlobeVisual from './LocationGlobeVisual'
import {
  countryCentroidLabel,
  formatLatLabel,
  formatLngLabel,
  formatRegionDisplay,
  lookupCountryCentroid,
} from '../utils/shopLocationMap'
import type { Lang } from '../i18n'
import { tr } from '../i18n'

interface MerchantSettingsLocationMapProps {
  address: string
  country?: string
  lang: Lang
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

function resolveLocalFallback(query: string, country: string, lang: Lang): ResolvedLocation | null {
  const centroid = lookupCountryCentroid(country) ?? lookupCountryCentroid(query)
  if (!centroid) return null
  const label = country.trim() || countryCentroidLabel(centroid, lang)
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

      const fallback = resolveLocalFallback(debouncedQuery, debouncedCountry, lang)
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
  }, [debouncedQuery, debouncedCountry, hasInput, lang])

  const region = resolved ? formatRegionDisplay(resolved.label, address, lang) : null

  if (!hasInput) {
    return (
      <div className="merchant-settings-loc-card merchant-settings-loc-card--idle">
        <LocationGlobeVisual mode="idle" />
        <p className="merchant-settings-loc-empty-text">
          {tr(lang, { zh: '暂未设置店铺地址', en: 'No shop address configured yet', de: 'Noch keine Shop-Adresse hinterlegt', ja: '店舗住所がまだ設定されていません', ko: '매장 주소가 아직 설정되지 않았습니다', es: 'Aún no hay dirección de la tienda configurada', it: 'Nessun indirizzo del negozio configurato', vi: 'Chưa cấu hình địa chỉ cửa hàng', fr: 'Aucune adresse de boutique configurée pour le moment' })}
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
          <span>{tr(lang, { zh: '正在定位…', en: 'Locating…', de: 'Standort wird ermittelt…', ja: '位置情報を取得中…', ko: '위치 확인 중…', es: 'Localizando…', it: 'Localizzazione…', vi: 'Đang định vị…', fr: 'Localisation…' })}</span>
        </div>
      </div>
    )
  }

  if (!resolved || !region) {
    return (
      <div className="merchant-settings-loc-card merchant-settings-loc-card--idle">
        <LocationGlobeVisual mode="idle" />
        <p className="merchant-settings-loc-error">
          {tr(lang, {
            zh: '无法解析该地址，请检查店铺地址是否填写完整',
            en: 'Could not locate this address. Please check your shop address.',
            de: 'Adresse konnte nicht gefunden werden. Bitte prüfen Sie Ihre Shop-Adresse.',
            ja: 'この住所を特定できませんでした。店舗住所が正しく入力されているかご確認ください。',
            ko: '주소를 확인할 수 없습니다. 매장 주소가 올바르게 입력되었는지 확인해 주세요.',
            es: 'No se pudo localizar esta dirección. Comprueba la dirección de tu tienda.', it: 'Impossibile individuare questo indirizzo. Controlla l\'indirizzo del negozio.', vi: 'Không thể xác định địa chỉ này. Vui lòng kiểm tra địa chỉ cửa hàng.',
          })}
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
