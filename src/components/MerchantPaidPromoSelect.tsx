import React, { useEffect, useId, useRef, useState } from 'react'

interface PaidPromoSelectOption {
  value: string
  label: string
}

interface MerchantPaidPromoSelectProps {
  label: string
  placeholder: string
  value: string
  options: PaidPromoSelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
}

const MerchantPaidPromoSelect: React.FC<MerchantPaidPromoSelectProps> = ({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
}) => {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = options.find((item) => item.value === value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className={`merchant-paid-promo-select${open ? ' merchant-paid-promo-select--open' : ''}${disabled ? ' merchant-paid-promo-select--disabled' : ''}`}
    >
      <span className="merchant-paid-promo-select-label">{label}</span>
      <button
        type="button"
        className={`merchant-paid-promo-select-trigger${selected ? '' : ' merchant-paid-promo-select-trigger--placeholder'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        <span className="merchant-paid-promo-select-value">{selected?.label ?? placeholder}</span>
        <span className="merchant-paid-promo-select-chevron" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3.5 5.25L7 8.75L10.5 5.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <ul id={listId} className="merchant-paid-promo-select-menu" role="listbox">
          {options.map((item) => {
            const active = item.value === value
            return (
              <li key={item.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`merchant-paid-promo-select-option${active ? ' merchant-paid-promo-select-option--active' : ''}`}
                  onClick={() => {
                    onChange(item.value)
                    setOpen(false)
                  }}
                >
                  <span>{item.label}</span>
                  {active ? (
                    <span className="merchant-paid-promo-select-option-check" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}

export default MerchantPaidPromoSelect
