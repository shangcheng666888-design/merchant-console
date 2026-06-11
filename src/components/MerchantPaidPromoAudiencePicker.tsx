import React from 'react'

interface AudienceOption {
  value: string
  label: string
}

interface MerchantPaidPromoAudiencePickerProps {
  label: string
  hint: string
  options: AudienceOption[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export function parseAudienceValues(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function serializeAudienceValues(values: string[]): string {
  const normalized = [...new Set(values.map((item) => String(item).trim()).filter(Boolean))]
  if (normalized.length === 0) return ''
  if (normalized.includes('all')) return 'all'
  return normalized.join(',')
}

export function toggleAudienceValue(current: string[], next: string): string[] {
  if (next === 'all') {
    return current.includes('all') ? [] : ['all']
  }
  const withoutAll = current.filter((item) => item !== 'all')
  if (withoutAll.includes(next)) {
    return withoutAll.filter((item) => item !== next)
  }
  return [...withoutAll, next]
}

const MerchantPaidPromoAudiencePicker: React.FC<MerchantPaidPromoAudiencePickerProps> = ({
  label,
  hint,
  options,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className={`merchant-paid-promo-audience${disabled ? ' merchant-paid-promo-audience--disabled' : ''}`}>
      <div className="merchant-paid-promo-audience-head">
        <span className="merchant-paid-promo-audience-label">{label}</span>
        <span className="merchant-paid-promo-audience-hint">{hint}</span>
      </div>
      <div className="merchant-paid-promo-audience-grid" role="group" aria-label={label}>
        {options.map((item) => {
          const active = value.includes(item.value)
          return (
            <button
              key={item.value}
              type="button"
              className={`merchant-paid-promo-audience-chip${active ? ' merchant-paid-promo-audience-chip--active' : ''}`}
              aria-pressed={active}
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation()
                onChange(toggleAudienceValue(value, item.value))
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default MerchantPaidPromoAudiencePicker
