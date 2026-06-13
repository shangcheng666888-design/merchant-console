import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'
import { useMerchantShop } from '../context/MerchantShopContext'
import { useToast } from '../components/ToastProvider'
import { openCrispChat } from '../utils/crispChat'
import { getMerchantShopLevel } from '../constants/merchantShopLevels'
import shopNameIcon from '../assets/shop-name-icon.png'
import shopLogoIcon from '../assets/shop-logo-icon.png'
import shopBannerIcon from '../assets/shop-banner-icon.png'
import withdrawPinIcon from '../assets/withdraw-pin-icon.png'
import accountIcon from '../assets/account-icon.png'
import loginTrustSupport from '../assets/login-trust-support.png'
import settingsLangIcon from '../assets/settings-lang-icon.png'
import MerchantSettingsLocationMap from '../components/MerchantSettingsLocationMap'

const LOGIN_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,22}$/

const AUTH_USER_KEY = 'authUser'

function SettingsItemIcon({ src }: { src: string }) {
  return (
    <span className="merchant-settings-item-icon" aria-hidden="true">
      <img src={src} alt="" className="merchant-settings-item-icon-img" />
    </span>
  )
}

function SettingsRowChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getAuth(): { id: string; shopId: string; account: string } | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_USER_KEY) : null
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id?: string; shopId?: string; account?: string }
    const id = typeof parsed.id === 'string' ? parsed.id.trim() : ''
    const shopId = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
    const account = typeof parsed.account === 'string' ? parsed.account.trim() : ''
    if (!id || !shopId) return null
    return { id, shopId, account }
  } catch {
    return null
  }
}

interface ShopBasic {
  logo: string | null
  banner: string | null
  address: string | null
  country: string | null
}

const MerchantSettings: React.FC = () => {
  const { lang, setLang } = useLang()
  const { shop, refresh: refreshShop } = useMerchantShop()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const auth = getAuth()
  const [shopNameDraft, setShopNameDraft] = useState('')
  const [savingShopName, setSavingShopName] = useState(false)
  const [shopNameError, setShopNameError] = useState('')
  const [savedAddress, setSavedAddress] = useState('')
  const [savedCountry, setSavedCountry] = useState('')
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

  const [loginPwdMode, setLoginPwdMode] = useState<'summary' | 'edit'>('summary')
  const [loginPwdOld, setLoginPwdOld] = useState('')
  const [loginPwdNew, setLoginPwdNew] = useState('')
  const [loginPwdConfirm, setLoginPwdConfirm] = useState('')
  const [loginPwdShowOld, setLoginPwdShowOld] = useState(false)
  const [loginPwdShowNew, setLoginPwdShowNew] = useState(false)
  const [loginPwdShowConfirm, setLoginPwdShowConfirm] = useState(false)
  const [loginPwdErrors, setLoginPwdErrors] = useState({ old: '', new: '', confirm: '' })
  const [savingLoginPwd, setSavingLoginPwd] = useState(false)

  useEffect(() => {
    setShopNameDraft(shop?.name ?? '')
    setShopNameError('')
  }, [shop?.name])

  const shopNameDirty =
    shopNameDraft.trim() !== (shop?.name ?? '').trim() && shopNameDraft.trim().length > 0

  const saveShopName = () => {
    if (!auth?.shopId || !auth?.id) {
      showToast(lang === 'zh' ? '未登录商家账号' : 'Not logged in to merchant account', 'error')
      return
    }
    const trimmed = shopNameDraft.trim()
    if (trimmed.length < 1 || trimmed.length > 60) {
      setShopNameError(lang === 'zh' ? '店铺名称需在 1-60 字之间' : 'Shop name must be 1-60 characters')
      return
    }
    if (trimmed === (shop?.name ?? '').trim()) return
    setSavingShopName(true)
    setShopNameError('')
    api
      .patch<{ success?: boolean }>(`/api/shops/${encodeURIComponent(auth.shopId)}`, {
        userId: auth.id,
        name: trimmed,
      })
      .then(() => {
        setShopNameDraft(trimmed)
        showToast(lang === 'zh' ? '店铺名称已更新' : 'Shop name updated')
        return refreshShop()
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '保存失败' : 'Failed to save'
        showToast(err instanceof Error ? err.message : fallback, 'error')
      })
      .finally(() => setSavingShopName(false))
  }

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
          setSavedAddress(cached.address ?? '')
          setSavedCountry(cached.country ?? '')
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
          const nextAddress = (res as ShopBasic).address ?? ''
          const nextCountry = (res as ShopBasic).country ?? ''
          setLogoUrl(nextLogo)
          setBannerUrl(nextBanner)
          setSavedAddress(nextAddress)
          setSavedCountry(nextCountry)
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  logo: nextLogo,
                  banner: nextBanner,
                  address: nextAddress,
                  country: nextCountry,
                }),
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

  const resetLoginPwdForm = () => {
    setLoginPwdOld('')
    setLoginPwdNew('')
    setLoginPwdConfirm('')
    setLoginPwdShowOld(false)
    setLoginPwdShowNew(false)
    setLoginPwdShowConfirm(false)
    setLoginPwdErrors({ old: '', new: '', confirm: '' })
  }

  const validateLoginPwdEdit = (): boolean => {
    const next = { old: '', new: '', confirm: '' }
    if (!loginPwdOld) {
      next.old = lang === 'zh' ? '请输入当前登录密码' : 'Please enter your current password'
    }
    if (!LOGIN_PASSWORD_REGEX.test(loginPwdNew)) {
      next.new =
        lang === 'zh'
          ? '新密码需为 6-22 位字母和数字组合'
          : 'New password must be 6-22 letters and digits'
    }
    if (!loginPwdConfirm) {
      next.confirm =
        lang === 'zh' ? '请再次输入新密码' : 'Please confirm your new password'
    } else if (loginPwdNew !== loginPwdConfirm) {
      next.confirm =
        lang === 'zh' ? '两次输入的密码不一致' : 'The two passwords do not match'
    }
    setLoginPwdErrors(next)
    return !next.old && !next.new && !next.confirm
  }

  const handleLoginPwdSubmit = () => {
    if (!auth?.id) {
      showToast(lang === 'zh' ? '未登录商家账号' : 'Not logged in to merchant account', 'error')
      return
    }
    if (!validateLoginPwdEdit()) return
    setSavingLoginPwd(true)
    api
      .post(`/api/users/${encodeURIComponent(auth.id)}/change-password`, {
        oldPassword: loginPwdOld,
        newPassword: loginPwdNew,
      })
      .then(() => {
        showToast(lang === 'zh' ? '登录密码已修改' : 'Login password updated')
        resetLoginPwdForm()
        setLoginPwdMode('summary')
      })
      .catch((err: unknown) => {
        const fallback = lang === 'zh' ? '修改失败' : 'Failed to update password'
        showToast(err instanceof Error ? err.message : fallback, 'error')
      })
      .finally(() => setSavingLoginPwd(false))
  }

  const openTradePwdEditor = () => {
    resetLoginPwdForm()
    setLoginPwdMode('summary')
    resetShopTradeForm()
    setShopTradeMode(shopHasTradePwd ? 'edit' : 'set')
  }

  const openLoginPwdEditor = () => {
    resetShopTradeForm()
    setShopTradeMode('summary')
    resetLoginPwdForm()
    setLoginPwdMode('edit')
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

  const shopLevelMeta = shop ? getMerchantShopLevel(shop.level) : null
  const shopLevelLabel = shopLevelMeta
    ? (lang === 'zh' ? shopLevelMeta.nameZh : shopLevelMeta.nameEn)
    : '—'

  const handleOpenSupport = () => {
    openCrispChat({ shopName: shop?.name ?? undefined, shopId: shop?.id ?? auth?.shopId })
  }

  return (
    <div className="merchant-settings-page merchant-settings-page--v2">
      <header className="merchant-settings-header merchant-settings-header--v2">
        <h1 className="merchant-settings-title">
          {lang === 'zh' ? '设置' : 'Settings'}
        </h1>
      </header>

      {!auth?.shopId && loadOk && (
        <div className="merchant-settings-alert merchant-settings-alert--error">
          {lang === 'zh' ? '未获取到店铺信息，请重新登录。' : 'Shop not found. Please sign in again.'}
        </div>
      )}

      <div className="merchant-settings-stack">
        <section className="merchant-settings-group">
          <h2 className="merchant-settings-group-title">{lang === 'zh' ? '账户' : 'Account'}</h2>
          <div className="merchant-settings-panel">
            <div className="merchant-settings-info-row">
              <span className="merchant-settings-info-label">{lang === 'zh' ? '登录账号' : 'Login account'}</span>
              <span className="merchant-settings-info-value">{auth?.account || '—'}</span>
            </div>
            <div className="merchant-settings-info-row">
              <span className="merchant-settings-info-label">{lang === 'zh' ? '店铺 ID' : 'Shop ID'}</span>
              <span className="merchant-settings-info-value merchant-settings-info-value--mono">
                {auth?.shopId || shop?.id || '—'}
              </span>
            </div>
            <Link to="/plan" className="merchant-settings-info-row merchant-settings-info-row--link merchant-settings-info-row--last">
              <span className="merchant-settings-info-label">{lang === 'zh' ? '店铺等级' : 'Shop level'}</span>
              <span className="merchant-settings-info-value merchant-settings-info-value--link">
                {shopLevelLabel}
                <SettingsRowChevron />
              </span>
            </Link>
          </div>
        </section>

        <section className="merchant-settings-group">
          <h2 className="merchant-settings-group-title">{lang === 'zh' ? '店铺' : 'Shop'}</h2>
          <div className="merchant-settings-panel">
            <div className="merchant-settings-name-row">
              <div className="merchant-settings-name-head">
                <SettingsItemIcon src={shopNameIcon} />
                <label className="merchant-settings-name-label" htmlFor="merchant-settings-shop-name">
                  {lang === 'zh' ? '店铺名称' : 'Shop name'}
                </label>
              </div>
              <div className="merchant-settings-name-field">
                <input
                  id="merchant-settings-shop-name"
                  className="merchant-settings-name-input"
                  value={shopNameDraft}
                  maxLength={60}
                  placeholder={lang === 'zh' ? '请输入店铺名称' : 'Enter shop name'}
                  disabled={!auth?.shopId || savingShopName}
                  onChange={(e) => {
                    setShopNameDraft(e.target.value)
                    if (shopNameError) setShopNameError('')
                  }}
                />
                {shopNameDirty && (
                  <button
                    type="button"
                    className="merchant-settings-btn merchant-settings-btn--primary merchant-settings-name-save"
                    onClick={saveShopName}
                    disabled={savingShopName}
                  >
                    {savingShopName
                      ? (lang === 'zh' ? '保存中…' : 'Saving…')
                      : (lang === 'zh' ? '保存' : 'Save')}
                  </button>
                )}
              </div>
              {shopNameError && (
                <p className="merchant-settings-field-error">{shopNameError}</p>
              )}
            </div>

            <div className="merchant-settings-location-row merchant-settings-location-row--globe-only">
              <MerchantSettingsLocationMap address={savedAddress} country={savedCountry} lang={lang} />
            </div>

            <div className="merchant-settings-media-row">
              <div className="merchant-settings-media-head">
                <div className="merchant-settings-media-title">
                  <SettingsItemIcon src={shopLogoIcon} />
                  <span className="merchant-settings-media-label">{lang === 'zh' ? '店铺 Logo' : 'Shop logo'}</span>
                </div>
                <div className="merchant-settings-media-actions">
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
                    className="merchant-settings-link-btn"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={!loadOk || loadingLogo}
                  >
                    {loadingLogo ? (lang === 'zh' ? '上传中…' : 'Uploading…') : (lang === 'zh' ? '更换' : 'Change')}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      className="merchant-settings-link-btn merchant-settings-link-btn--muted"
                      onClick={removeLogo}
                      disabled={loadingLogo}
                    >
                      {lang === 'zh' ? '移除' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
              <div
                className="merchant-settings-preview merchant-settings-preview--logo merchant-settings-preview--compact"
                onClick={() => (logoUrl || loadingLogo) ? undefined : logoInputRef.current?.click()}
                role={(logoUrl || loadingLogo) ? undefined : 'button'}
                tabIndex={(logoUrl || loadingLogo) ? undefined : 0}
                onKeyDown={(e) => {
                  if (!logoUrl && !loadingLogo && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    logoInputRef.current?.click()
                  }
                }}
              >
                {logoUrl && loadOk && !loadingLogo ? (
                  <img src={logoUrl} alt="" className="merchant-settings-preview-img" />
                ) : (
                  renderPreviewPlaceholder(
                    loadingLogo,
                    lang === 'zh' ? '上传中…' : 'Uploading…',
                    lang === 'zh' ? '点击上传' : 'Tap to upload',
                  )
                )}
              </div>
            </div>

            <div className="merchant-settings-media-row merchant-settings-media-row--last">
              <div className="merchant-settings-media-head">
                <div className="merchant-settings-media-title">
                  <SettingsItemIcon src={shopBannerIcon} />
                  <span className="merchant-settings-media-label">{lang === 'zh' ? '店铺横幅' : 'Shop banner'}</span>
                </div>
                <div className="merchant-settings-media-actions">
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
                    className="merchant-settings-link-btn"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={!loadOk || loadingBanner}
                  >
                    {loadingBanner ? (lang === 'zh' ? '上传中…' : 'Uploading…') : (lang === 'zh' ? '更换' : 'Change')}
                  </button>
                  {bannerUrl && (
                    <button
                      type="button"
                      className="merchant-settings-link-btn merchant-settings-link-btn--muted"
                      onClick={removeBanner}
                      disabled={loadingBanner}
                    >
                      {lang === 'zh' ? '移除' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
              <div
                className="merchant-settings-preview merchant-settings-preview--banner merchant-settings-preview--compact"
                onClick={() => (bannerUrl || loadingBanner) ? undefined : bannerInputRef.current?.click()}
                role={(bannerUrl || loadingBanner) ? undefined : 'button'}
                tabIndex={(bannerUrl || loadingBanner) ? undefined : 0}
                onKeyDown={(e) => {
                  if (!bannerUrl && !loadingBanner && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    bannerInputRef.current?.click()
                  }
                }}
              >
                {bannerUrl && loadOk && !loadingBanner ? (
                  <img src={bannerUrl} alt="" className="merchant-settings-preview-img" />
                ) : (
                  renderPreviewPlaceholder(
                    loadingBanner,
                    lang === 'zh' ? '上传中…' : 'Uploading…',
                    lang === 'zh' ? '点击上传' : 'Tap to upload',
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="merchant-settings-group">
          <h2 className="merchant-settings-group-title">{lang === 'zh' ? '安全' : 'Security'}</h2>
          <div className="merchant-settings-panel">
            {!auth?.shopId || !auth?.id ? (
              <p className="merchant-settings-inline-note">
                {lang === 'zh' ? '请重新登录后再设置。' : 'Please sign in again.'}
              </p>
            ) : shopTradeMode !== 'summary' ? (
              <>
              <div className="merchant-settings-pin-head">
                <SettingsItemIcon src={withdrawPinIcon} />
                <span className="merchant-settings-row-label">{lang === 'zh' ? '提现密码' : 'Payment PIN'}</span>
              </div>
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
              </>
            ) : loginPwdMode !== 'summary' ? (
              <>
              <div className="merchant-settings-pin-head">
                <SettingsItemIcon src={accountIcon} />
                <span className="merchant-settings-row-label">{lang === 'zh' ? '登录密码' : 'Login password'}</span>
              </div>
              <div className="merchant-settings-pin-form">
                <div className="merchant-settings-pin-field">
                  <label className="merchant-settings-pin-label">
                    <span className="merchant-settings-pin-required">*</span>
                    {lang === 'zh' ? '当前密码' : 'Current password'}
                  </label>
                  <div className="merchant-settings-pin-input-wrap">
                    <input
                      type={loginPwdShowOld ? 'text' : 'password'}
                      className="merchant-settings-pin-input"
                      placeholder={
                        lang === 'zh' ? '请输入当前登录密码' : 'Enter your current password'
                      }
                      value={loginPwdOld}
                      onChange={(e) => setLoginPwdOld(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="merchant-settings-pin-pwd-toggle"
                      aria-label={
                        loginPwdShowOld
                          ? (lang === 'zh' ? '隐藏密码' : 'Hide password')
                          : (lang === 'zh' ? '显示密码' : 'Show password')
                      }
                      onClick={() => setLoginPwdShowOld((v) => !v)}
                    >
                      {loginPwdShowOld ? (
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
                  {loginPwdErrors.old && (
                    <p className="merchant-settings-field-error">{loginPwdErrors.old}</p>
                  )}
                </div>

                <div className="merchant-settings-pin-field">
                  <label className="merchant-settings-pin-label">
                    <span className="merchant-settings-pin-required">*</span>
                    {lang === 'zh' ? '新密码' : 'New password'}
                  </label>
                  <div className="merchant-settings-pin-input-wrap">
                    <input
                      type={loginPwdShowNew ? 'text' : 'password'}
                      className="merchant-settings-pin-input"
                      placeholder={
                        lang === 'zh'
                          ? '6-22 位字母和数字组合'
                          : '6-22 letters and digits'
                      }
                      value={loginPwdNew}
                      onChange={(e) =>
                        setLoginPwdNew(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 22))
                      }
                      maxLength={22}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="merchant-settings-pin-pwd-toggle"
                      aria-label={
                        loginPwdShowNew
                          ? (lang === 'zh' ? '隐藏密码' : 'Hide password')
                          : (lang === 'zh' ? '显示密码' : 'Show password')
                      }
                      onClick={() => setLoginPwdShowNew((v) => !v)}
                    >
                      {loginPwdShowNew ? (
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
                  {loginPwdErrors.new && (
                    <p className="merchant-settings-field-error">{loginPwdErrors.new}</p>
                  )}
                </div>

                <div className="merchant-settings-pin-field">
                  <label className="merchant-settings-pin-label">
                    <span className="merchant-settings-pin-required">*</span>
                    {lang === 'zh' ? '确认密码' : 'Confirm password'}
                  </label>
                  <div className="merchant-settings-pin-input-wrap">
                    <input
                      type={loginPwdShowConfirm ? 'text' : 'password'}
                      className="merchant-settings-pin-input"
                      placeholder={
                        lang === 'zh' ? '请再次输入新密码' : 'Confirm your new password'
                      }
                      value={loginPwdConfirm}
                      onChange={(e) =>
                        setLoginPwdConfirm(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 22))
                      }
                      maxLength={22}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="merchant-settings-pin-pwd-toggle"
                      aria-label={
                        loginPwdShowConfirm
                          ? (lang === 'zh' ? '隐藏密码' : 'Hide password')
                          : (lang === 'zh' ? '显示密码' : 'Show password')
                      }
                      onClick={() => setLoginPwdShowConfirm((v) => !v)}
                    >
                      {loginPwdShowConfirm ? (
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
                  {loginPwdErrors.confirm && (
                    <p className="merchant-settings-field-error">{loginPwdErrors.confirm}</p>
                  )}
                </div>

                <div className="merchant-settings-pin-actions">
                  <button
                    type="button"
                    className="merchant-settings-btn merchant-settings-btn--primary"
                    onClick={handleLoginPwdSubmit}
                    disabled={savingLoginPwd}
                  >
                    {savingLoginPwd
                      ? (lang === 'zh' ? '保存中…' : 'Saving…')
                      : (lang === 'zh' ? '确认' : 'Confirm')}
                  </button>
                  <button
                    type="button"
                    className="merchant-settings-btn merchant-settings-btn--ghost"
                    onClick={() => {
                      resetLoginPwdForm()
                      setLoginPwdMode('summary')
                    }}
                  >
                    {lang === 'zh' ? '取消' : 'Cancel'}
                  </button>
                </div>
              </div>
              </>
            ) : (
              <>
              <div className="merchant-settings-row merchant-settings-row--action">
                <div className="merchant-settings-row-main">
                  <SettingsItemIcon src={accountIcon} />
                  <span className="merchant-settings-row-label">{lang === 'zh' ? '登录密码' : 'Login password'}</span>
                </div>
                <button
                  type="button"
                  className="merchant-settings-link-btn"
                  onClick={openLoginPwdEditor}
                >
                  {lang === 'zh' ? '修改' : 'Change'}
                </button>
              </div>
              <div className="merchant-settings-row merchant-settings-row--action">
                <div className="merchant-settings-row-main">
                  <SettingsItemIcon src={withdrawPinIcon} />
                  <span className="merchant-settings-row-label">{lang === 'zh' ? '提现密码' : 'Payment PIN'}</span>
                  <span
                    className={`merchant-settings-status-pill${
                      shopHasTradePwd
                        ? ' merchant-settings-status-pill--ok'
                        : ' merchant-settings-status-pill--warn'
                    }`}
                  >
                    {shopHasTradePwd
                      ? (lang === 'zh' ? '已设置' : 'Set')
                      : (lang === 'zh' ? '未设置' : 'Not set')}
                  </span>
                </div>
                <button
                  type="button"
                  className="merchant-settings-link-btn"
                  onClick={openTradePwdEditor}
                >
                  {shopHasTradePwd
                    ? (lang === 'zh' ? '修改' : 'Change')
                    : (lang === 'zh' ? '设置' : 'Set up')}
                </button>
              </div>
              </>
            )}
          </div>
        </section>

        <section className="merchant-settings-group">
          <h2 className="merchant-settings-group-title">{lang === 'zh' ? '通用' : 'General'}</h2>
          <div className="merchant-settings-panel">
            <div className="merchant-settings-row merchant-settings-row--action">
              <div className="merchant-settings-row-main">
                <SettingsItemIcon src={settingsLangIcon} />
                <span className="merchant-settings-row-label">{lang === 'zh' ? '语言' : 'Language'}</span>
              </div>
              <div
                className="merchant-settings-lang-segment"
                role="group"
                aria-label={lang === 'zh' ? '语言' : 'Language'}
              >
                <button
                  type="button"
                  className={`merchant-settings-lang-option${lang === 'zh' ? ' merchant-settings-lang-option--active' : ''}`}
                  aria-pressed={lang === 'zh'}
                  onClick={() => setLang('zh')}
                >
                  中文
                </button>
                <button
                  type="button"
                  className={`merchant-settings-lang-option${lang === 'en' ? ' merchant-settings-lang-option--active' : ''}`}
                  aria-pressed={lang === 'en'}
                  onClick={() => setLang('en')}
                >
                  EN
                </button>
              </div>
            </div>
            <button
              type="button"
              className="merchant-settings-row"
              onClick={handleOpenSupport}
            >
              <span className="merchant-settings-row-main">
                <SettingsItemIcon src={loginTrustSupport} />
                <span>{lang === 'zh' ? '联系客服' : 'Contact support'}</span>
              </span>
              <SettingsRowChevron />
            </button>
            <button
              type="button"
              className="merchant-settings-row merchant-settings-row--danger"
              onClick={() => setLogoutConfirmOpen(true)}
            >
              <span className="merchant-settings-row-main">
                <SettingsItemIcon src={accountIcon} />
                <span>{lang === 'zh' ? '退出登录' : 'Log out'}</span>
              </span>
              <SettingsRowChevron />
            </button>
          </div>
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
              {lang === 'zh' ? '退出后需重新登录。' : 'You will need to sign in again.'}
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
