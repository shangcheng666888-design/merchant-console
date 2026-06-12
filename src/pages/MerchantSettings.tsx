import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { MerchantSidebarNavIcon } from '../components/MerchantSidebarNavIcon'
import { useLang } from '../context/LangContext'
import { useToast } from '../components/ToastProvider'
import shopBannerIcon from '../assets/shop-banner-icon.png'
import shopLogoIcon from '../assets/shop-logo-icon.png'
import withdrawPinIcon from '../assets/withdraw-pin-icon.png'
import accountIcon from '../assets/account-icon.png'

const AUTH_USER_KEY = 'authUser'

function getAuth(): { id: string; shopId: string } | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_USER_KEY) : null
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id?: string; shopId?: string }
    const id = typeof parsed.id === 'string' ? parsed.id.trim() : ''
    const shopId = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
    if (!id || !shopId) return null
    return { id, shopId }
  } catch {
    return null
  }
}

interface ShopBasic {
  logo: string | null
  banner: string | null
}

const MerchantSettings: React.FC = () => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const auth = getAuth()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  const [loadOk, setLoadOk] = useState(false)
  const [loadingLogo, setLoadingLogo] = useState(false)
  const [loadingBanner, setLoadingBanner] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const fetchingShopRef = useRef(false)

  // 店铺交易密码（提现密码）管理
  const [shopHasTradePwd, setShopHasTradePwd] = useState<boolean | null>(null)
  const [shopTradeMode, setShopTradeMode] = useState<'summary' | 'set' | 'edit'>('summary')
  const [shopTradeOld, setShopTradeOld] = useState('')
  const [shopTradeNew, setShopTradeNew] = useState('')
  const [shopTradeConfirm, setShopTradeConfirm] = useState('')
  const [shopTradeShowOld, setShopTradeShowOld] = useState(false)
  const [shopTradeShowNew, setShopTradeShowNew] = useState(false)
  const [shopTradeShowConfirm, setShopTradeShowConfirm] = useState(false)
  const [shopTradeErrors, setShopTradeErrors] = useState({ old: '', new: '', confirm: '' })

  useEffect(() => {
    if (!auth?.shopId) {
      setLoadOk(true)
      return
    }
    let cancelled = false
    const cacheKey = `merchantSettings:${auth.shopId}`

    // 优先使用上一次成功加载的店铺基础信息，加快首屏展示
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(cacheKey)
        if (raw) {
          const cached = JSON.parse(raw) as ShopBasic
          setLogoUrl(cached.logo ?? null)
          setBannerUrl(cached.banner ?? null)
          setLoadOk(true)
        }
      }
    } catch {
      // ignore cache error
    }

    let hadCache = false
    try {
      if (typeof window !== 'undefined' && window.localStorage.getItem(cacheKey)) {
        hadCache = true
      }
    } catch {
      // ignore
    }

    const fetchShop = (silent = true) => {
      if (fetchingShopRef.current) return
      fetchingShopRef.current = true
      if (!silent && !hadCache) setLoadOk(false)

      api
        .get<ShopBasic>(`/api/shops/${encodeURIComponent(auth.shopId)}`)
        .then((res) => {
          if (cancelled) return
          const nextLogo = (res as ShopBasic).logo ?? null
          const nextBanner = (res as ShopBasic).banner ?? null
          setLogoUrl(nextLogo)
          setBannerUrl(nextBanner)
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(
                cacheKey,
                JSON.stringify({ logo: nextLogo, banner: nextBanner }),
              )
            }
          } catch {
            // ignore cache write error
          }
        })
        .catch(() => {
          // silent refresh keeps current preview
        })
        .finally(() => {
          if (!cancelled) setLoadOk(true)
          fetchingShopRef.current = false
        })
    }

    fetchShop(!hadCache)

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchShop()
    }
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(() => fetchShop(), 5000)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [auth?.shopId])

  const restrictToSixDigits = (v: string) => v.replace(/\D/g, '').slice(0, 6)

  const handleLogout = useCallback(() => {
    try {
      window.localStorage.removeItem(AUTH_USER_KEY)
    } catch {
      // ignore
    }
    navigate('/login')
  }, [navigate])

  // 查询店铺是否已设置交易密码
  useEffect(() => {
    if (!auth?.shopId || !auth?.id) {
      setShopHasTradePwd(null)
      return
    }
    let cancelled = false
    api
      .get<{ hasTradePassword?: boolean }>(
        `/api/shops/${encodeURIComponent(auth.shopId)}/trade-password/status?userId=${encodeURIComponent(
          auth.id,
        )}`,
      )
      .then((res) => {
        if (cancelled) return
        setShopHasTradePwd(!!res.hasTradePassword)
        setShopTradeMode('summary')
      })
      .catch(() => {
        if (!cancelled) setShopHasTradePwd(null)
      })
    return () => {
      cancelled = true
    }
  }, [auth?.shopId, auth?.id])

  const patchLogo = (url: string | null) => {
    if (!auth?.shopId || !auth?.id) {
      return Promise.reject(
        new Error(lang === 'zh' ? '未登录' : 'Not logged in'),
      )
    }
    return api.patch<{ success?: boolean }>(`/api/shops/${encodeURIComponent(auth.shopId)}`, {
      userId: auth.id,
      logo: url,
    })
  }

  const patchBanner = (url: string | null) => {
    if (!auth?.shopId || !auth?.id) {
      return Promise.reject(
        new Error(lang === 'zh' ? '未登录' : 'Not logged in'),
      )
    }
    return api.patch<{ success?: boolean }>(`/api/shops/${encodeURIComponent(auth.shopId)}`, {
      userId: auth.id,
      banner: url,
    })
  }

  const validateShopTradeSet = (): boolean => {
    const next = { old: '', new: '', confirm: '' }
    const pinRegex = /^\d{6}$/
    if (!pinRegex.test(shopTradeNew)) {
      next.new =
        lang === 'zh'
          ? '交易密码需为 6 位数字'
          : 'Payment PIN must be 6 digits'
    }
    if (!pinRegex.test(shopTradeConfirm)) {
      next.confirm =
        lang === 'zh'
          ? '请再次输入 6 位数字密码'
          : 'Please confirm the 6‑digit PIN'
    } else if (shopTradeNew !== shopTradeConfirm) {
      next.confirm =
        lang === 'zh'
          ? '两次输入的密码不一致'
          : 'The two PINs do not match'
    }
    setShopTradeErrors(next)
    return !next.new && !next.confirm
  }

  const validateShopTradeEdit = (): boolean => {
    const next = { old: '', new: '', confirm: '' }
    const pinRegex = /^\d{6}$/
    if (!pinRegex.test(shopTradeOld)) {
      next.old =
        lang === 'zh'
          ? '请输入当前 6 位密码'
          : 'Please enter your current 6‑digit PIN'
    }
    if (!pinRegex.test(shopTradeNew)) {
      next.new =
        lang === 'zh'
          ? '新密码需为 6 位数字'
          : 'New PIN must be 6 digits'
    }
    if (!pinRegex.test(shopTradeConfirm)) {
      next.confirm =
        lang === 'zh'
          ? '请再次输入 6 位数字密码'
          : 'Please confirm the 6‑digit PIN'
    } else if (shopTradeNew !== shopTradeConfirm) {
      next.confirm =
        lang === 'zh'
          ? '两次输入的密码不一致'
          : 'The two PINs do not match'
    }
    setShopTradeErrors(next)
    return !next.old && !next.new && !next.confirm
  }

  const resetShopTradeForm = () => {
    setShopTradeOld('')
    setShopTradeNew('')
    setShopTradeConfirm('')
    setShopTradeShowOld(false)
    setShopTradeShowNew(false)
    setShopTradeShowConfirm(false)
    setShopTradeErrors({ old: '', new: '', confirm: '' })
  }

  const handleShopTradeSetSubmit = () => {
    if (!auth?.shopId || !auth?.id) {
      showToast(
        lang === 'zh' ? '未登录商家账号' : 'Not logged in to merchant account',
        'error',
      )
      return
    }
    if (!validateShopTradeSet()) return
    api
      .post(`/api/shops/${encodeURIComponent(auth.shopId)}/trade-password/set`, {
        userId: auth.id,
        newTradePassword: shopTradeNew,
      })
      .then(() => {
        showToast(
          lang === 'zh' ? '店铺交易密码已设置' : 'Shop payment PIN has been set',
        )
        setShopHasTradePwd(true)
        setShopTradeMode('summary')
        resetShopTradeForm()
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '设置失败' : 'Failed to set PIN'
        showToast(err instanceof Error ? err.message : fallback, 'error')
      })
  }

  const handleShopTradeEditSubmit = () => {
    if (!auth?.shopId || !auth?.id) {
      showToast(
        lang === 'zh' ? '未登录商家账号' : 'Not logged in to merchant account',
        'error',
      )
      return
    }
    if (!validateShopTradeEdit()) return
    api
      .post(`/api/shops/${encodeURIComponent(auth.shopId)}/trade-password/change`, {
        userId: auth.id,
        oldTradePassword: shopTradeOld,
        newTradePassword: shopTradeNew,
      })
      .then(() => {
        showToast(
          lang === 'zh' ? '店铺交易密码已修改' : 'Shop payment PIN has been updated',
        )
        setShopHasTradePwd(true)
        setShopTradeMode('summary')
        resetShopTradeForm()
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '修改失败' : 'Failed to update PIN'
        showToast(err instanceof Error ? err.message : fallback, 'error')
      })
  }

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setLoadingLogo(true)
    api
      .uploadImage(file)
      .then(({ url }) => patchLogo(url).then(() => url))
      .then((url) => {
        if (url) setLogoUrl(url)
        showToast(lang === 'zh' ? 'Logo 已更新' : 'Logo has been updated')
      })
      .catch((err: Error) =>
        showToast(
          err?.message ?? (lang === 'zh' ? '上传失败' : 'Upload failed'),
          'error',
        ),
      )
      .finally(() => setLoadingLogo(false))
  }

  const onBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    setLoadingBanner(true)
    api
      .uploadImage(file)
      .then(({ url }) => patchBanner(url).then(() => url))
      .then((url) => {
        if (url) setBannerUrl(url)
        showToast(lang === 'zh' ? '横幅已更新' : 'Banner has been updated')
      })
      .catch((err: Error) =>
        showToast(
          err?.message ?? (lang === 'zh' ? '上传失败' : 'Upload failed'),
          'error',
        ),
      )
      .finally(() => setLoadingBanner(false))
  }

  const removeLogo = () => {
    if (!auth?.shopId || !auth?.id) return
    setLoadingLogo(true)
    patchLogo(null)
      .then(() => {
        setLogoUrl(null)
        showToast(lang === 'zh' ? '已移除 Logo' : 'Logo removed')
      })
      .catch((err: Error) =>
        showToast(
          err?.message ?? (lang === 'zh' ? '移除失败' : 'Failed to remove'),
          'error',
        ),
      )
      .finally(() => setLoadingLogo(false))
  }

  const removeBanner = () => {
    if (!auth?.shopId || !auth?.id) return
    setLoadingBanner(true)
    patchBanner(null)
      .then(() => {
        setBannerUrl(null)
        showToast(lang === 'zh' ? '已移除横幅' : 'Banner removed')
      })
      .catch((err: Error) =>
        showToast(
          err?.message ?? (lang === 'zh' ? '移除失败' : 'Failed to remove'),
          'error',
        ),
      )
      .finally(() => setLoadingBanner(false))
  }

  const renderPreviewPlaceholder = (loading: boolean, loadingLabel: string, emptyLabel: string) => (
    <span className="merchant-settings-preview-placeholder">
      {!loadOk || loading ? (
        <span className="merchant-settings-preview-skeleton" aria-hidden="true" />
      ) : (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      )}
      <span>{!loadOk ? (lang === 'zh' ? '加载中…' : 'Loading…') : loading ? loadingLabel : emptyLabel}</span>
    </span>
  )

  return (
    <div className="merchant-settings-page merchant-settings-page--v2">
      <header className="merchant-settings-header merchant-settings-header--v2">
        <div className="merchant-settings-header-main">
          <span className="merchant-settings-header-icon" aria-hidden="true">
            <MerchantSidebarNavIcon name="settings" variant="light" className="merchant-settings-header-icon-svg" />
          </span>
          <div className="merchant-settings-header-copy">
            <h1 className="merchant-settings-title">
              {lang === 'zh' ? '布局排版设置' : 'Layout & settings'}
            </h1>
            <p className="merchant-settings-subtitle">
              {lang === 'zh'
                ? '管理店铺视觉形象、提现密码与账户安全，修改后自动生效。'
                : 'Manage shop branding, payment PIN and account security. Changes apply automatically.'}
            </p>
          </div>
        </div>
      </header>

      {!auth?.shopId && loadOk && (
        <div className="merchant-settings-alert merchant-settings-alert--error">
          {lang === 'zh'
            ? '未获取到店铺信息，请重新登录商家后台。'
            : 'Shop information not found, please log in to the merchant backend again.'}
        </div>
      )}

      <div className="merchant-settings-stack">
      <section className="merchant-settings-card">
        <div className="merchant-settings-card-head">
          <span className="merchant-settings-card-icon" aria-hidden="true">
            <img src={shopLogoIcon} alt="" className="merchant-settings-card-icon-img" />
          </span>
          <div>
            <h2 className="merchant-settings-card-title">
              {lang === 'zh' ? '店铺 Logo' : 'Shop logo'}
            </h2>
            <p className="merchant-settings-card-desc">
              {lang === 'zh'
                ? '建议 200×200 像素，支持 JPG、PNG、WebP，将作为店铺头像展示。'
                : 'Recommended 200×200 px, JPG/PNG/WebP. Shown as your shop avatar.'}
            </p>
          </div>
        </div>
        <div className="merchant-settings-block merchant-settings-block--logo">
          <div
            className="merchant-settings-preview merchant-settings-preview--logo"
            onClick={() => (logoUrl || loadingLogo) ? undefined : logoInputRef.current?.click()}
            role={(logoUrl || loadingLogo) ? undefined : 'button'}
            tabIndex={(logoUrl || loadingLogo) ? undefined : 0}
            onKeyDown={e => { if (!logoUrl && !loadingLogo && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); logoInputRef.current?.click() } }}
          >
            {logoUrl && loadOk && !loadingLogo ? (
              <img
                src={logoUrl}
                alt={lang === 'zh' ? '店铺 Logo' : 'Shop logo'}
                className="merchant-settings-preview-img"
              />
            ) : (
              renderPreviewPlaceholder(
                loadingLogo,
                lang === 'zh' ? '上传中…' : 'Uploading…',
                lang === 'zh' ? '点击上传' : 'Click to upload',
              )
            )}
          </div>
          <div className="merchant-settings-actions">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="merchant-settings-file-input"
              aria-label={lang === 'zh' ? '上传 Logo' : 'Upload logo'}
              onChange={onLogoChange}
            />
            <button
              type="button"
              className="merchant-settings-btn merchant-settings-btn--primary"
              onClick={() => logoInputRef.current?.click()}
              disabled={!loadOk || loadingLogo}
            >
              {lang === 'zh' ? '上传 Logo' : 'Upload logo'}
            </button>
            {logoUrl && (
              <button type="button" className="merchant-settings-btn merchant-settings-btn--ghost" onClick={removeLogo} disabled={loadingLogo}>
                {lang === 'zh' ? '移除' : 'Remove'}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="merchant-settings-card">
        <div className="merchant-settings-card-head">
          <span className="merchant-settings-card-icon" aria-hidden="true">
            <img src={withdrawPinIcon} alt="" className="merchant-settings-card-icon-img" />
          </span>
          <div>
            <h2 className="merchant-settings-card-title">
              {lang === 'zh' ? '提现密码' : 'Payment PIN'}
            </h2>
            <p className="merchant-settings-card-desc">
              {lang === 'zh'
                ? '用于钱包充值与提现校验，仅店铺本人可设置，请使用 6 位数字。'
                : 'Verifies wallet top-ups and withdrawals. 6-digit PIN, shop owner only.'}
            </p>
          </div>
        </div>
        <div className="merchant-settings-block merchant-settings-block--pin">
          {!auth?.shopId || !auth?.id ? (
            <div className="merchant-settings-alert merchant-settings-alert--error">
              {lang === 'zh'
                ? '未获取到店铺信息，请重新登录商家后台后再设置提现密码。'
                : 'Shop information not found. Please log in to the merchant backend again before setting the payment PIN.'}
            </div>
          ) : shopTradeMode === 'summary' ? (
            <div className="merchant-settings-pin-summary">
              <span
                className={`merchant-settings-status-pill${
                  shopHasTradePwd
                    ? ' merchant-settings-status-pill--ok'
                    : ' merchant-settings-status-pill--warn'
                }`}
              >
                {shopHasTradePwd
                  ? lang === 'zh'
                    ? '已设置'
                    : 'Configured'
                  : lang === 'zh'
                    ? '未设置'
                    : 'Not set'}
              </span>
              <p className="merchant-settings-pin-summary-text">
                {shopHasTradePwd
                  ? (lang === 'zh'
                    ? '已设置店铺提现密码，可用于店铺钱包充值与提现校验。'
                    : 'Shop payment PIN is set and will be used to verify wallet top‑ups and withdrawals.')
                  : (lang === 'zh'
                    ? '当前尚未设置店铺提现密码，为保障资金安全，请先设置。'
                    : 'Shop payment PIN is not set yet. For security, please set it before using wallet withdrawals.')}
              </p>
              <div className="merchant-settings-pin-summary-actions">
                {shopHasTradePwd ? (
                  <button
                    type="button"
                    className="merchant-settings-btn merchant-settings-btn--primary"
                    onClick={() => {
                      resetShopTradeForm()
                      setShopTradeMode('edit')
                    }}
                  >
                    {lang === 'zh' ? '修改提现密码' : 'Change payment PIN'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="merchant-settings-btn merchant-settings-btn--primary"
                    onClick={() => {
                      resetShopTradeForm()
                      setShopTradeMode('set')
                    }}
                  >
                    {lang === 'zh' ? '设置提现密码' : 'Set payment PIN'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="merchant-settings-pin-form">
              {shopTradeMode === 'edit' && (
                <div className="merchant-settings-pin-field">
                  <label className="merchant-settings-pin-label">
                    <span className="merchant-settings-pin-required">*</span>
                    {lang === 'zh' ? '旧密码' : 'Current PIN'}
                  </label>
                  <div className="merchant-settings-pin-input-wrap">
                    <input
                      type={shopTradeShowOld ? 'text' : 'password'}
                      className="merchant-settings-pin-input"
                      placeholder={
                        lang === 'zh'
                          ? '请输入 6 位数字旧密码'
                          : 'Please enter your current 6‑digit PIN'
                      }
                      value={shopTradeOld}
                      onChange={(e) => setShopTradeOld(restrictToSixDigits(e.target.value))}
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      className="merchant-settings-pin-pwd-toggle"
                      aria-label={
                        shopTradeShowOld
                          ? (lang === 'zh' ? '隐藏密码' : 'Hide PIN')
                          : (lang === 'zh' ? '显示密码' : 'Show PIN')
                      }
                      onClick={() => setShopTradeShowOld((v) => !v)}
                    >
                      {shopTradeShowOld ? (
                        <svg className="merchant-settings-pin-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                          <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l1.66 1.66c.57-.23 1.18-.36 1.83-.36zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 21 21 19.73 4.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                        </svg>
                      ) : (
                        <svg className="merchant-settings-pin-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                          <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {shopTradeErrors.old && (
                    <p className="merchant-settings-field-error">{shopTradeErrors.old}</p>
                  )}
                </div>
              )}

              <div className="merchant-settings-pin-field">
                <label className="merchant-settings-pin-label">
                  <span className="merchant-settings-pin-required">*</span>
                  {lang === 'zh' ? '新密码' : 'New PIN'}
                </label>
                <div className="merchant-settings-pin-input-wrap">
                  <input
                    type={shopTradeShowNew ? 'text' : 'password'}
                    className="merchant-settings-pin-input"
                    placeholder={
                      lang === 'zh'
                        ? '请输入 6 位数字密码'
                        : 'Please enter a new 6‑digit PIN'
                    }
                    value={shopTradeNew}
                    onChange={(e) => setShopTradeNew(restrictToSixDigits(e.target.value))}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="merchant-settings-pin-pwd-toggle"
                    aria-label={
                      shopTradeShowNew
                        ? (lang === 'zh' ? '隐藏密码' : 'Hide PIN')
                        : (lang === 'zh' ? '显示密码' : 'Show PIN')
                    }
                    onClick={() => setShopTradeShowNew((v) => !v)}
                  >
                    {shopTradeShowNew ? (
                      <svg className="merchant-settings-pin-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                        <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l1.66 1.66c.57-.23 1.18-.36 1.83-.36zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 21 21 19.73 4.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    ) : (
                      <svg className="merchant-settings-pin-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                        <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    )}
                  </button>
                </div>
                {shopTradeErrors.new && (
                  <p className="merchant-settings-field-error">{shopTradeErrors.new}</p>
                )}
              </div>

              <div className="merchant-settings-pin-field">
                <label className="merchant-settings-pin-label">
                  <span className="merchant-settings-pin-required">*</span>
                  {lang === 'zh' ? '确认密码' : 'Confirm PIN'}
                </label>
                <div className="merchant-settings-pin-input-wrap">
                  <input
                    type={shopTradeShowConfirm ? 'text' : 'password'}
                    className="merchant-settings-pin-input"
                    placeholder={
                      lang === 'zh'
                        ? '请再次输入 6 位数字密码'
                        : 'Please confirm the 6‑digit PIN'
                    }
                    value={shopTradeConfirm}
                    onChange={(e) => setShopTradeConfirm(restrictToSixDigits(e.target.value))}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="merchant-settings-pin-pwd-toggle"
                    aria-label={
                      shopTradeShowConfirm
                        ? (lang === 'zh' ? '隐藏密码' : 'Hide PIN')
                        : (lang === 'zh' ? '显示密码' : 'Show PIN')
                    }
                    onClick={() => setShopTradeShowConfirm((v) => !v)}
                  >
                    {shopTradeShowConfirm ? (
                      <svg className="merchant-settings-pin-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                        <path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l1.66 1.66c.57-.23 1.18-.36 1.83-.36zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 21 21 19.73 4.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    ) : (
                      <svg className="merchant-settings-pin-pwd-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                        <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    )}
                  </button>
                </div>
                {shopTradeErrors.confirm && (
                  <p className="merchant-settings-field-error">{shopTradeErrors.confirm}</p>
                )}
              </div>

              <div className="merchant-settings-pin-actions">
                <button
                  type="button"
                  className="merchant-settings-btn merchant-settings-btn--primary"
                  onClick={shopTradeMode === 'edit' ? handleShopTradeEditSubmit : handleShopTradeSetSubmit}
                >
                  {lang === 'zh' ? '确认' : 'Confirm'}
                </button>
                <button
                  type="button"
                  className="merchant-settings-btn merchant-settings-btn--ghost"
                  onClick={() => {
                    resetShopTradeForm()
                    setShopTradeMode('summary')
                  }}
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="merchant-settings-card">
        <div className="merchant-settings-card-head">
          <span className="merchant-settings-card-icon" aria-hidden="true">
            <img src={shopBannerIcon} alt="" className="merchant-settings-card-icon-img" />
          </span>
          <div>
            <h2 className="merchant-settings-card-title">
              {lang === 'zh' ? '店铺横幅' : 'Shop banner'}
            </h2>
            <p className="merchant-settings-card-desc">
              {lang === 'zh'
                ? '建议 1200×300 或同比例，展示在店铺首页顶部。'
                : 'Recommended 1200×300 or same ratio, shown at shop homepage top.'}
            </p>
          </div>
        </div>
        <div className="merchant-settings-block merchant-settings-block--banner">
          <div
            className="merchant-settings-preview merchant-settings-preview--banner"
            onClick={() => (bannerUrl || loadingBanner) ? undefined : bannerInputRef.current?.click()}
            role={(bannerUrl || loadingBanner) ? undefined : 'button'}
            tabIndex={(bannerUrl || loadingBanner) ? undefined : 0}
            onKeyDown={e => { if (!bannerUrl && !loadingBanner && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); bannerInputRef.current?.click() } }}
          >
            {bannerUrl && loadOk && !loadingBanner ? (
              <img
                src={bannerUrl}
                alt={lang === 'zh' ? '店铺横幅' : 'Shop banner'}
                className="merchant-settings-preview-img"
              />
            ) : (
              renderPreviewPlaceholder(
                loadingBanner,
                lang === 'zh' ? '上传中…' : 'Uploading…',
                lang === 'zh' ? '点击上传横幅' : 'Click to upload banner',
              )
            )}
          </div>
          <div className="merchant-settings-actions">
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="merchant-settings-file-input"
              aria-label={lang === 'zh' ? '上传横幅' : 'Upload banner'}
              onChange={onBannerChange}
            />
            <button
              type="button"
              className="merchant-settings-btn merchant-settings-btn--primary"
              onClick={() => bannerInputRef.current?.click()}
              disabled={!loadOk || loadingBanner}
            >
              {lang === 'zh' ? '上传横幅' : 'Upload banner'}
            </button>
            {bannerUrl && (
              <button type="button" className="merchant-settings-btn merchant-settings-btn--ghost" onClick={removeBanner} disabled={loadingBanner}>
                {lang === 'zh' ? '移除' : 'Remove'}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="merchant-settings-card merchant-settings-card--account">
        <div className="merchant-settings-card-head">
          <span className="merchant-settings-card-icon" aria-hidden="true">
            <img src={accountIcon} alt="" className="merchant-settings-card-icon-img" />
          </span>
          <div>
            <h2 className="merchant-settings-card-title">
              {lang === 'zh' ? '账户' : 'Account'}
            </h2>
            <p className="merchant-settings-card-desc">
              {lang === 'zh'
                ? '退出后需重新登录才能继续管理店铺。'
                : 'You will need to sign in again to manage your shop.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="merchant-settings-logout-btn"
          onClick={() => setLogoutConfirmOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" />
            <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{lang === 'zh' ? '退出登录' : 'Log out'}</span>
        </button>
      </section>
      </div>

      {logoutConfirmOpen && (
        <div
          className="merchant-backend-logout-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="merchant-settings-logout-title"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <div className="merchant-backend-logout-panel" onClick={(e) => e.stopPropagation()}>
            <h2 id="merchant-settings-logout-title" className="merchant-backend-logout-title">
              {lang === 'zh' ? '确认退出登录？' : 'Log out of this shop?'}
            </h2>
            <p className="merchant-backend-logout-subtitle">
              {lang === 'zh'
                ? '退出后需要重新登录才能管理店铺。'
                : 'You will need to log in again to manage your shop.'}
            </p>
            <div className="merchant-backend-logout-actions">
              <button
                type="button"
                className="merchant-backend-logout-btn merchant-backend-logout-btn--secondary"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="button"
                className="merchant-backend-logout-btn merchant-backend-logout-btn--primary"
                onClick={handleLogout}
              >
                {lang === 'zh' ? '确认退出' : 'Log out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MerchantSettings
