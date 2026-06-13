import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'
import { tr } from '../i18n'
import { useMerchantSync } from '../hooks/useMerchantSync'
import { useMerchantShop } from '../context/MerchantShopContext'
import { useToast } from '../components/ToastProvider'
import { openCrispChat } from '../utils/crispChat'
import { getMerchantShopLevel, shopLevelDisplayName } from '../constants/merchantShopLevels'
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
      showToast(tr(lang, { zh: '未登录商家账号', en: 'Not logged in to merchant account', de: 'Nicht beim Händlerkonto angemeldet', ja: 'セラーアカウントにログインしていません', ko: '셀러 계정에 로그인되지 않았습니다', es: 'No has iniciado sesión en la cuenta de vendedor', it: 'Non hai effettuato l\'accesso all\'account venditore', vi: 'Chưa đăng nhập tài khoản người bán', fr: 'Non connecté au compte marchand'}), 'error')
      return
    }
    const trimmed = shopNameDraft.trim()
    if (trimmed.length < 1 || trimmed.length > 60) {
      setShopNameError(tr(lang, { zh: '店铺名称需在 1-60 字之间', en: 'Shop name must be 1-60 characters', de: 'Shop-Name muss 1–60 Zeichen lang sein', ja: 'ショップ名は1〜60文字で入力してください', ko: '쇼핑몰 이름은 1~60자여야 합니다', es: 'El nombre debe tener entre 1 y 60 caracteres', it: 'Il nome del negozio deve avere 1-60 caratteri', vi: 'Tên cửa hàng phải từ 1-60 ký tự', fr: 'Le nom de la boutique doit comporter entre 1 et 60 caractères'}))
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
        showToast(tr(lang, { zh: '店铺名称已更新', en: 'Shop name updated', de: 'Shop-Name aktualisiert', ja: 'ショップ名を更新しました', ko: '쇼핑몰 이름이 업데이트되었습니다', es: 'Nombre de tienda actualizado', it: 'Nome negozio aggiornato', vi: 'Đã cập nhật tên cửa hàng', fr: 'Nom de la boutique mis à jour'}))
        return refreshShop()
      })
      .catch((err: unknown) => {
        const fallback = tr(lang, { zh: '保存失败', en: 'Failed to save', de: 'Speichern fehlgeschlagen', ja: '保存に失敗しました', ko: '저장에 실패했습니다', es: 'Error al guardar', it: 'Salvataggio non riuscito', vi: 'Lưu thất bại', fr: 'Échec de l\'enregistrement'})
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
    return () => {
      cancelled = true
    }
  }, [auth?.shopId])

  useMerchantSync(['shop', 'all'], () => {
    if (!auth?.shopId) return
    const cacheKey = `merchantSettings:${auth.shopId}`
    if (fetchingShopRef.current) return
    fetchingShopRef.current = true
    api
      .get<ShopBasic>(`/api/shops/${encodeURIComponent(auth.shopId)}`)
      .then((res) => {
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
        setLoadOk(true)
        fetchingShopRef.current = false
      })
  }, { immediate: false })

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
        new Error(tr(lang, { zh: '未登录', en: 'Not logged in', de: 'Nicht angemeldet', ja: '未ログイン', ko: '로그인되지 않음', es: 'Sin iniciar sesión', it: 'Non connesso', vi: 'Chưa đăng nhập', fr: 'Non connecté'})),
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
        new Error(tr(lang, { zh: '未登录', en: 'Not logged in', de: 'Nicht angemeldet', ja: '未ログイン', ko: '로그인되지 않음', es: 'Sin iniciar sesión', it: 'Non connesso', vi: 'Chưa đăng nhập', fr: 'Non connecté'})),
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
        tr(lang, { zh: '交易密码需为 6 位数字', en: 'Payment PIN must be 6 digits', de: 'Zahlungs-PIN muss 6 Ziffern haben', ja: '取引パスワードは6桁の数字である必要があります', ko: '출금 PIN은 6자리 숫자여야 합니다', es: 'El PIN de pago debe tener 6 dígitos', it: 'Il PIN di pagamento deve avere 6 cifre', vi: 'PIN thanh toán phải gồm 6 chữ số', fr: 'Le code PIN de paiement doit être composé de 6 chiffres'})
    }
    if (!pinRegex.test(shopTradeConfirm)) {
      next.confirm =
        tr(lang, { zh: '请再次输入 6 位数字密码', en: 'Please confirm the 6‑digit PIN', de: 'Bitte bestätigen Sie die 6-stellige PIN', ja: '6桁の数字パスワードを再入力してください', ko: '6자리 PIN을 다시 입력하세요', es: 'Confirma el PIN de 6 dígitos', it: 'Conferma il PIN a 6 cifre', vi: 'Vui lòng xác nhận PIN 6 chữ số', fr: 'Veuillez confirmer le code PIN à 6 chiffres'})
    } else if (shopTradeNew !== shopTradeConfirm) {
      next.confirm =
        tr(lang, { zh: '两次输入的密码不一致', en: 'The two PINs do not match', de: 'Die beiden PINs stimmen nicht überein', ja: '入力したパスワードが一致しません', ko: '입력한 PIN이 일치하지 않습니다', es: 'Los PIN no coinciden', it: 'I due PIN non coincidono', vi: 'Hai PIN không khớp', fr: 'Les deux codes PIN ne correspondent pas'})
    }
    setShopTradeErrors(next)
    return !next.new && !next.confirm
  }

  const validateShopTradeEdit = (): boolean => {
    const next = { old: '', new: '', confirm: '' }
    const pinRegex = /^\d{6}$/
    if (!pinRegex.test(shopTradeOld)) {
      next.old =
        tr(lang, { zh: '请输入当前 6 位密码', en: 'Please enter your current 6‑digit PIN', de: 'Bitte geben Sie Ihre aktuelle 6-stellige PIN ein', ja: '現在の6桁パスワードを入力してください', ko: '현재 6자리 PIN을 입력하세요', es: 'Ingresa tu PIN actual de 6 dígitos', it: 'Inserisci il PIN attuale a 6 cifre', vi: 'Vui lòng nhập PIN hiện tại 6 chữ số', fr: 'Veuillez saisir votre code PIN actuel à 6 chiffres'})
    }
    if (!pinRegex.test(shopTradeNew)) {
      next.new =
        tr(lang, { zh: '新密码需为 6 位数字', en: 'New PIN must be 6 digits', de: 'Neue PIN muss 6 Ziffern haben', ja: '新しいパスワードは6桁の数字である必要があります', ko: '새 PIN은 6자리 숫자여야 합니다', es: 'El PIN nuevo debe tener 6 dígitos', it: 'Il nuovo PIN deve avere 6 cifre', vi: 'PIN mới phải gồm 6 chữ số', fr: 'Le nouveau code PIN doit être composé de 6 chiffres'})
    }
    if (!pinRegex.test(shopTradeConfirm)) {
      next.confirm =
        tr(lang, { zh: '请再次输入 6 位数字密码', en: 'Please confirm the 6‑digit PIN', de: 'Bitte bestätigen Sie die 6-stellige PIN', ja: '6桁の数字パスワードを再入力してください', ko: '6자리 PIN을 다시 입력하세요', es: 'Confirma el PIN de 6 dígitos', it: 'Conferma il PIN a 6 cifre', vi: 'Vui lòng xác nhận PIN 6 chữ số', fr: 'Veuillez confirmer le code PIN à 6 chiffres'})
    } else if (shopTradeNew !== shopTradeConfirm) {
      next.confirm =
        tr(lang, { zh: '两次输入的密码不一致', en: 'The two PINs do not match', de: 'Die beiden PINs stimmen nicht überein', ja: '入力したパスワードが一致しません', ko: '입력한 PIN이 일치하지 않습니다', es: 'Los PIN no coinciden', it: 'I due PIN non coincidono', vi: 'Hai PIN không khớp', fr: 'Les deux codes PIN ne correspondent pas'})
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
      next.old = tr(lang, { zh: '请输入当前登录密码', en: 'Please enter your current password', de: 'Bitte geben Sie Ihr aktuelles Passwort ein', ja: '現在のログインパスワードを入力してください', ko: '현재 로그인 비밀번호를 입력하세요', es: 'Ingresa tu contraseña actual', it: 'Inserisci la password attuale', vi: 'Vui lòng nhập mật khẩu hiện tại', fr: 'Veuillez entrer votre mot de passe actuel'})
    }
    if (!LOGIN_PASSWORD_REGEX.test(loginPwdNew)) {
      next.new =
        tr(lang, { zh: '新密码需为 6-22 位字母和数字组合', en: 'New password must be 6-22 letters and digits', de: 'Neues Passwort muss 6–22 Buchstaben und Ziffern enthalten', ja: '新しいパスワードは6〜22文字の英数字である必要があります', ko: '새 비밀번호는 6~22자 영문·숫자 조합이어야 합니다', es: 'La contraseña nueva debe tener 6-22 caracteres alfanuméricos', it: 'La nuova password deve avere 6-22 caratteri alfanumerici', vi: 'Mật khẩu mới phải gồm 6-22 ký tự chữ và số', fr: 'Le nouveau mot de passe doit contenir 6 à 22 lettres et chiffres'})
    }
    if (!loginPwdConfirm) {
      next.confirm =
        tr(lang, { zh: '请再次输入新密码', en: 'Please confirm your new password', de: 'Bitte bestätigen Sie Ihr neues Passwort', ja: '新しいパスワードを再入力してください', ko: '새 비밀번호를 다시 입력하세요', es: 'Confirma tu nueva contraseña', it: 'Conferma la nuova password', vi: 'Vui lòng xác nhận mật khẩu mới', fr: 'Veuillez confirmer votre nouveau mot de passe'})
    } else if (loginPwdNew !== loginPwdConfirm) {
      next.confirm =
        tr(lang, { zh: '两次输入的密码不一致', en: 'The two passwords do not match', de: 'Die beiden Passwörter stimmen nicht überein', ja: '入力したパスワードが一致しません', ko: '입력한 비밀번호가 일치하지 않습니다', es: 'Las contraseñas no coininciden', it: 'Le due password non coincidono', vi: 'Hai mật khẩu không khớp', fr: 'Les deux mots de passe ne correspondent pas'})
    }
    setLoginPwdErrors(next)
    return !next.old && !next.new && !next.confirm
  }

  const handleLoginPwdSubmit = () => {
    if (!auth?.id) {
      showToast(tr(lang, { zh: '未登录商家账号', en: 'Not logged in to merchant account', de: 'Nicht beim Händlerkonto angemeldet', ja: 'セラーアカウントにログインしていません', ko: '셀러 계정에 로그인되지 않았습니다', es: 'No has iniciado sesión en la cuenta de vendedor', it: 'Non hai effettuato l\'accesso all\'account venditore', vi: 'Chưa đăng nhập tài khoản người bán', fr: 'Non connecté au compte marchand'}), 'error')
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
        showToast(tr(lang, { zh: '登录密码已修改', en: 'Login password updated', de: 'Anmeldepasswort aktualisiert', ja: 'ログインパスワードを変更しました', ko: '로그인 비밀번호가 변경되었습니다', es: 'Contraseña de acceso actualizada', it: 'Password di accesso aggiornata', vi: 'Đã cập nhật mật khẩu đăng nhập', fr: 'Mot de passe de connexion mis à jour'}))
        resetLoginPwdForm()
        setLoginPwdMode('summary')
      })
      .catch((err: unknown) => {
        const fallback = tr(lang, { zh: '修改失败', en: 'Failed to update password', de: 'Passwort konnte nicht aktualisiert werden', ja: '変更に失敗しました', ko: '비밀번호 변경에 실패했습니다', es: 'Error al actualizar la contraseña', it: 'Impossibile aggiornare la password', vi: 'Cập nhật mật khẩu thất bại', fr: 'Échec de la mise à jour du mot de passe'})
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
        tr(lang, { zh: '未登录商家账号', en: 'Not logged in to merchant account', de: 'Nicht beim Händlerkonto angemeldet', ja: 'セラーアカウントにログインしていません', ko: '셀러 계정에 로그인되지 않았습니다', es: 'No has iniciado sesión en la cuenta de vendedor', it: 'Non hai effettuato l\'accesso all\'account venditore', vi: 'Chưa đăng nhập tài khoản người bán', fr: 'Non connecté au compte marchand'}),
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
          tr(lang, { zh: '店铺交易密码已设置', en: 'Shop payment PIN has been set', de: 'Shop-Zahlungs-PIN wurde festgelegt', ja: 'ショップ取引パスワードを設定しました', ko: '쇼핑몰 출금 PIN이 설정되었습니다', es: 'PIN de pago de la tienda configurado', it: 'PIN di pagamento del negozio impostato', vi: 'Đã đặt PIN thanh toán cửa hàng', fr: 'Le code PIN de paiement de la boutique a été défini'}),
        )
        setShopHasTradePwd(true)
        setShopTradeMode('summary')
        resetShopTradeForm()
      })
      .catch((err: unknown) => {
        const fallback = tr(lang, { zh: '设置失败', en: 'Failed to set PIN', de: 'PIN konnte nicht festgelegt werden', ja: '設定に失敗しました', ko: 'PIN 설정에 실패했습니다', es: 'Error al configurar el PIN', it: 'Impossibile impostare il PIN', vi: 'Đặt PIN thất bại', fr: 'Échec de la définition du code PIN'})
        showToast(err instanceof Error ? err.message : fallback, 'error')
      })
  }

  const handleShopTradeEditSubmit = () => {
    if (!auth?.shopId || !auth?.id) {
      showToast(
        tr(lang, { zh: '未登录商家账号', en: 'Not logged in to merchant account', de: 'Nicht beim Händlerkonto angemeldet', ja: 'セラーアカウントにログインしていません', ko: '셀러 계정에 로그인되지 않았습니다', es: 'No has iniciado sesión en la cuenta de vendedor', it: 'Non hai effettuato l\'accesso all\'account venditore', vi: 'Chưa đăng nhập tài khoản người bán', fr: 'Non connecté au compte marchand'}),
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
          tr(lang, { zh: '店铺交易密码已修改', en: 'Shop payment PIN has been updated', de: 'Shop-Zahlungs-PIN wurde aktualisiert', ja: 'ショップ取引パスワードを変更しました', ko: '쇼핑몰 출금 PIN이 변경되었습니다', es: 'PIN de pago de la tienda actualizado', it: 'PIN di pagamento del negozio aggiornato', vi: 'Đã cập nhật PIN thanh toán cửa hàng', fr: 'Le code PIN de paiement de la boutique a été mis à jour'}),
        )
        setShopHasTradePwd(true)
        setShopTradeMode('summary')
        resetShopTradeForm()
      })
      .catch((err: unknown) => {
        const fallback = tr(lang, { zh: '修改失败', en: 'Failed to update PIN', de: 'PIN konnte nicht aktualisiert werden', ja: '変更に失敗しました', ko: 'PIN 변경에 실패했습니다', es: 'Error al actualizar el PIN', it: 'Impossibile aggiornare il PIN', vi: 'Cập nhật PIN thất bại', fr: 'Échec de la mise à jour du code PIN'})
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
        showToast(tr(lang, { zh: 'Logo 已更新', en: 'Logo has been updated', de: 'Logo wurde aktualisiert', ja: 'ロゴを更新しました', ko: '로고가 업데이트되었습니다', es: 'Logo actualizado', it: 'Logo aggiornato', vi: 'Đã cập nhật logo', fr: 'Le logo a été mis à jour'}))
      })
      .catch((err: Error) =>
        showToast(
          err?.message ?? (tr(lang, { zh: '上传失败', en: 'Upload failed', de: 'Upload fehlgeschlagen', ja: 'アップロードに失敗しました', ko: '업로드에 실패했습니다', es: 'Error al subir', it: 'Caricamento non riuscito', vi: 'Tải lên thất bại', fr: 'Échec du téléchargement'})),
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
        showToast(tr(lang, { zh: '横幅已更新', en: 'Banner has been updated', de: 'Banner wurde aktualisiert', ja: 'バナーを更新しました', ko: '배너가 업데이트되었습니다', es: 'Banner actualizado', it: 'Banner aggiornato', vi: 'Đã cập nhật banner', fr: 'La bannière a été mise à jour'}))
      })
      .catch((err: Error) =>
        showToast(
          err?.message ?? (tr(lang, { zh: '上传失败', en: 'Upload failed', de: 'Upload fehlgeschlagen', ja: 'アップロードに失敗しました', ko: '업로드에 실패했습니다', es: 'Error al subir', it: 'Caricamento non riuscito', vi: 'Tải lên thất bại', fr: 'Échec du téléchargement'})),
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
        showToast(tr(lang, { zh: '已移除 Logo', en: 'Logo removed', de: 'Logo removed', ja: 'ロゴを削除しました', ko: '로고가 제거되었습니다', es: 'Logo eliminado', it: 'Logo rimosso', vi: 'Đã xóa logo', fr: 'Logo supprimé'}))
      })
      .catch((err: Error) =>
        showToast(
          err?.message ?? (tr(lang, { zh: '移除失败', en: 'Failed to remove', de: 'Entfernen fehlgeschlagen', ja: '削除に失敗しました', ko: '제거에 실패했습니다', es: 'Error al quitar', it: 'Rimozione non riuscita', vi: 'Gỡ thất bại', fr: 'Échec de la suppression'})),
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
        showToast(tr(lang, { zh: '已移除横幅', en: 'Banner removed', de: 'Banner removed', ja: 'バナーを削除しました', ko: '배너가 제거되었습니다', es: 'Banner eliminado', it: 'Banner rimosso', vi: 'Đã xóa banner', fr: 'Bannière supprimée'}))
      })
      .catch((err: Error) =>
        showToast(
          err?.message ?? (tr(lang, { zh: '移除失败', en: 'Failed to remove', de: 'Entfernen fehlgeschlagen', ja: '削除に失敗しました', ko: '제거에 실패했습니다', es: 'Error al quitar', it: 'Rimozione non riuscita', vi: 'Gỡ thất bại', fr: 'Échec de la suppression'})),
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
      <span>{!loadOk ? (tr(lang, { zh: '加载中…', en: 'Loading…', de: 'Loading…', ja: '読み込み中…', ko: '불러오는 중…', es: 'Cargando…', it: 'Caricamento…', vi: 'Đang tải…', fr: 'Chargement…'})) : loading ? loadingLabel : emptyLabel}</span>
    </span>
  )

  const shopLevelMeta = shop ? getMerchantShopLevel(shop.level) : null
  const shopLevelLabel = shopLevelMeta ? shopLevelDisplayName(shopLevelMeta, lang) : '—'

  const handleOpenSupport = () => {
    openCrispChat({ shopName: shop?.name ?? undefined, shopId: shop?.id ?? auth?.shopId })
  }

  return (
    <div className="merchant-settings-page merchant-settings-page--v2">
      <header className="merchant-settings-header merchant-settings-header--v2">
        <h1 className="merchant-settings-title">
          {tr(lang, { zh: '设置', en: 'Settings', de: 'Settings', ja: '設定', ko: '설정', es: 'Configuración', it: 'Impostazioni', vi: 'Cài đặt', fr: 'Paramètres'})}
        </h1>
      </header>

      {!auth?.shopId && loadOk && (
        <div className="merchant-settings-alert merchant-settings-alert--error">
          {tr(lang, { zh: '未获取到店铺信息，请重新登录。', en: 'Shop not found. Please sign in again.', de: 'Shop nicht gefunden. Bitte erneut anmelden.', ja: 'ショップ情報を取得できませんでした。再度ログインしてください。', ko: '쇼핑몰 정보를 찾을 수 없습니다. 다시 로그인해 주세요.', es: 'Tienda no encontrada. Vuelve a iniciar sesión.', it: 'Negozio non trovato. Accedi di nuovo.', vi: 'Không tìm thấy cửa hàng. Vui lòng đăng nhập lại.', fr: 'Boutique introuvable. Veuillez vous reconnecter.'})}
        </div>
      )}

      <div className="merchant-settings-stack">
        <section className="merchant-settings-group">
          <h2 className="merchant-settings-group-title">{tr(lang, { zh: '账户', en: 'Account', de: 'Account', ja: 'アカウント', ko: '계정', es: 'Cuenta', it: 'Account', vi: 'Tài khoản', fr: 'Compte'})}</h2>
          <div className="merchant-settings-panel">
            <div className="merchant-settings-info-row">
              <span className="merchant-settings-info-label">{tr(lang, { zh: '登录账号', en: 'Login account', de: 'Login account', ja: 'ログインアカウント', ko: '로그인 계정', es: 'Cuenta de acceso', it: 'Account di accesso', vi: 'Tài khoản đăng nhập', fr: 'Compte de connexion'})}</span>
              <span className="merchant-settings-info-value">{auth?.account || '—'}</span>
            </div>
            <div className="merchant-settings-info-row">
              <span className="merchant-settings-info-label">{tr(lang, { zh: '店铺 ID', en: 'Shop ID', de: 'Shop ID', ja: 'ショップ ID', ko: '쇼핑몰 ID', es: 'ID de tienda', it: 'ID negozio', vi: 'ID cửa hàng', fr: 'Identifiant de la boutique'})}</span>
              <span className="merchant-settings-info-value merchant-settings-info-value--mono">
                {auth?.shopId || shop?.id || '—'}
              </span>
            </div>
            <Link to="/plan" className="merchant-settings-info-row merchant-settings-info-row--link merchant-settings-info-row--last">
              <span className="merchant-settings-info-label">{tr(lang, { zh: '店铺等级', en: 'Shop level', de: 'Shop level', ja: 'ショップランク', ko: '쇼핑몰 등급', es: 'Nivel de tienda', it: 'Livello negozio', vi: 'Cấp cửa hàng', fr: 'Niveau boutique'})}</span>
              <span className="merchant-settings-info-value merchant-settings-info-value--link">
                {shopLevelLabel}
                <SettingsRowChevron />
              </span>
            </Link>
          </div>
        </section>

        <section className="merchant-settings-group">
          <h2 className="merchant-settings-group-title">{tr(lang, { zh: '店铺', en: 'Shop', de: 'Shop', ja: 'ショップ', ko: '쇼핑몰', es: 'Tienda', it: 'Negozio', vi: 'Cửa hàng', fr: 'Boutique'})}</h2>
          <div className="merchant-settings-panel">
            <div className="merchant-settings-name-row">
              <div className="merchant-settings-shop-name">
                <div className="merchant-settings-shop-name-top">
                  <span className="merchant-settings-shop-name-icon-wrap" aria-hidden="true">
                    <SettingsItemIcon src={shopNameIcon} />
                  </span>
                  <div className="merchant-settings-shop-name-copy">
                    <label className="merchant-settings-shop-name-label" htmlFor="merchant-settings-shop-name">
                      {tr(lang, { zh: '店铺名称', en: 'Shop name', de: 'Shop name', ja: 'ショップ名', ko: '쇼핑몰 이름', es: 'Nombre de la tienda', it: 'Nome negozio', vi: 'Tên cửa hàng', fr: 'Nom de la boutique'})}
                    </label>
                    <p className="merchant-settings-shop-name-hint">
                      {tr(lang, { zh: '买家在商城中看到的名称', en: 'Shown to customers in your storefront', de: 'Wird Kunden in Ihrem Shop angezeigt', ja: 'モールで購入者に表示される名称', ko: '몰에서 구매자에게 표시되는 이름', es: 'Nombre visible para compradores en la tienda', it: 'Nome visibile agli acquirenti nel negozio', vi: 'Tên hiển thị với người mua trên cửa hàng', fr: 'Montré aux clients dans votre vitrine'})}
                    </p>
                  </div>
                </div>

                <div className={`merchant-settings-shop-name-compose${shopNameDirty ? ' is-dirty' : ''}`}>
                  <div className="merchant-settings-shop-name-field">
                    <input
                      id="merchant-settings-shop-name"
                      className="merchant-settings-shop-name-input"
                      value={shopNameDraft}
                      maxLength={60}
                      placeholder={tr(lang, { zh: '给店铺起个名字', en: 'Name your shop', de: 'Name your shop', ja: 'ショップ名を入力', ko: '쇼핑몰 이름을 입력하세요', es: 'Ponle nombre a tu tienda', it: 'Dai un nome al negozio', vi: 'Đặt tên cửa hàng', fr: 'Nommez votre boutique'})}
                      disabled={!auth?.shopId || savingShopName}
                      onChange={(e) => {
                        setShopNameDraft(e.target.value)
                        if (shopNameError) setShopNameError('')
                      }}
                    />
                    <span className="merchant-settings-shop-name-count" aria-live="polite">
                      {shopNameDraft.length}
                      <span className="merchant-settings-shop-name-count-sep">/</span>
                      60
                    </span>
                  </div>

                  <div
                    className={`merchant-settings-shop-name-actions${shopNameDirty ? ' is-visible' : ''}`}
                    aria-hidden={!shopNameDirty}
                  >
                    <button
                      type="button"
                      className="merchant-settings-shop-name-reset"
                      onClick={() => {
                        setShopNameDraft(shop?.name ?? '')
                        setShopNameError('')
                      }}
                      disabled={savingShopName}
                    >
                      {tr(lang, { zh: '还原', en: 'Reset', de: 'Reset', ja: '元に戻す', ko: '되돌리기', es: 'Restablecer', it: 'Ripristina', vi: 'Khôi phục', fr: 'Réinitialiser'})}
                    </button>
                    <button
                      type="button"
                      className="merchant-settings-shop-name-save"
                      onClick={saveShopName}
                      disabled={savingShopName}
                    >
                      {savingShopName
                        ? (tr(lang, { zh: '保存中…', en: 'Saving…', de: 'Saving…', ja: '保存中…', ko: '저장 중…', es: 'Guardando…', it: 'Salvataggio…', vi: 'Đang lưu…', fr: 'Économie…'}))
                        : (tr(lang, { zh: '保存更改', en: 'Save changes', de: 'Save changes', ja: '変更を保存', ko: '변경 저장', es: 'Guardar cambios', it: 'Salva modifiche', vi: 'Lưu thay đổi', fr: 'Enregistrer les modifications'}))}
                    </button>
                  </div>
                </div>

                {shopNameError && (
                  <p className="merchant-settings-field-error merchant-settings-shop-name-error">{shopNameError}</p>
                )}
              </div>
            </div>

            <div className="merchant-settings-location-row merchant-settings-location-row--globe-only">
              <MerchantSettingsLocationMap address={savedAddress} country={savedCountry} lang={lang} />
            </div>

            <div className="merchant-settings-media-row">
              <div className="merchant-settings-media-head">
                <div className="merchant-settings-media-title">
                  <SettingsItemIcon src={shopLogoIcon} />
                  <span className="merchant-settings-media-label">{tr(lang, { zh: '店铺 Logo', en: 'Shop logo', de: 'Shop logo', ja: 'ショップロゴ', ko: '쇼핑몰 로고', es: 'Logo de la tienda', it: 'Logo negozio', vi: 'Logo cửa hàng', fr: 'Logo de la boutique'})}</span>
                </div>
                <div className="merchant-settings-media-actions">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="merchant-settings-file-input"
                    aria-label={tr(lang, { zh: '上传 Logo', en: 'Upload logo', de: 'Upload logo', ja: 'ロゴをアップロード', ko: '로고 업로드', es: 'Subir logo', it: 'Carica logo', vi: 'Tải lên logo', fr: 'Télécharger le logo'})}
                    onChange={onLogoChange}
                  />
                  <button
                    type="button"
                    className="merchant-settings-link-btn"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={!loadOk || loadingLogo}
                  >
                    {loadingLogo ? (tr(lang, { zh: '上传中…', en: 'Uploading…', de: 'Wird hochgeladen…', ja: 'アップロード中…', ko: '업로드 중…', es: 'Subiendo…', it: 'Caricamento…', vi: 'Đang tải lên…', fr: 'Téléchargement…'})) : (tr(lang, { zh: '更换', en: 'Change', de: 'Change', ja: '変更', ko: '변경', es: 'Cambiar', it: 'Modifica', vi: 'Thay đổi'}))}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      className="merchant-settings-link-btn merchant-settings-link-btn--muted"
                      onClick={removeLogo}
                      disabled={loadingLogo}
                    >
                      {tr(lang, { zh: '移除', en: 'Remove', de: 'Remove', ja: '削除', ko: '제거', es: 'Quitar', it: 'Rimuovi', vi: 'Gỡ', fr: 'Retirer'})}
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
                    tr(lang, { zh: '上传中…', en: 'Uploading…', de: 'Wird hochgeladen…', ja: 'アップロード中…', ko: '업로드 중…', es: 'Subiendo…', it: 'Caricamento…', vi: 'Đang tải lên…', fr: 'Téléchargement…'}),
                    tr(lang, { zh: '点击上传', en: 'Tap to upload', de: 'Tap to upload', ja: 'タップしてアップロード', ko: '탭하여 업로드', es: 'Toca para subir', it: 'Tocca per caricare', vi: 'Chạm để tải lên', fr: 'Appuyez pour télécharger'}),
                  )
                )}
              </div>
            </div>

            <div className="merchant-settings-media-row merchant-settings-media-row--last">
              <div className="merchant-settings-media-head">
                <div className="merchant-settings-media-title">
                  <SettingsItemIcon src={shopBannerIcon} />
                  <span className="merchant-settings-media-label">{tr(lang, { zh: '店铺横幅', en: 'Shop banner', de: 'Shop banner', ja: 'ショップバナー', ko: '쇼핑몰 배너', es: 'Banner de la tienda', it: 'Banner negozio', vi: 'Banner cửa hàng', fr: 'Bannière de boutique'})}</span>
                </div>
                <div className="merchant-settings-media-actions">
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="merchant-settings-file-input"
                    aria-label={tr(lang, { zh: '上传横幅', en: 'Upload banner', de: 'Upload banner', ja: 'バナーをアップロード', ko: '배너 업로드', es: 'Subir banner', it: 'Carica banner', vi: 'Tải lên banner', fr: 'Télécharger la bannière'})}
                    onChange={onBannerChange}
                  />
                  <button
                    type="button"
                    className="merchant-settings-link-btn"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={!loadOk || loadingBanner}
                  >
                    {loadingBanner ? (tr(lang, { zh: '上传中…', en: 'Uploading…', de: 'Wird hochgeladen…', ja: 'アップロード中…', ko: '업로드 중…', es: 'Subiendo…', it: 'Caricamento…', vi: 'Đang tải lên…', fr: 'Téléchargement…'})) : (tr(lang, { zh: '更换', en: 'Change', de: 'Change', ja: '変更', ko: '변경', es: 'Cambiar', it: 'Modifica', vi: 'Thay đổi'}))}
                  </button>
                  {bannerUrl && (
                    <button
                      type="button"
                      className="merchant-settings-link-btn merchant-settings-link-btn--muted"
                      onClick={removeBanner}
                      disabled={loadingBanner}
                    >
                      {tr(lang, { zh: '移除', en: 'Remove', de: 'Remove', ja: '削除', ko: '제거', es: 'Quitar', it: 'Rimuovi', vi: 'Gỡ', fr: 'Retirer'})}
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
                    tr(lang, { zh: '上传中…', en: 'Uploading…', de: 'Wird hochgeladen…', ja: 'アップロード中…', ko: '업로드 중…', es: 'Subiendo…', it: 'Caricamento…', vi: 'Đang tải lên…', fr: 'Téléchargement…'}),
                    tr(lang, { zh: '点击上传', en: 'Tap to upload', de: 'Tap to upload', ja: 'タップしてアップロード', ko: '탭하여 업로드', es: 'Toca para subir', it: 'Tocca per caricare', vi: 'Chạm để tải lên', fr: 'Appuyez pour télécharger'}),
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="merchant-settings-group">
          <h2 className="merchant-settings-group-title">{tr(lang, { zh: '安全', en: 'Security', de: 'Security', ja: 'セキュリティ', ko: '보안', es: 'Seguridad', it: 'Sicurezza', vi: 'Bảo mật', fr: 'Sécurité'})}</h2>
          <div className="merchant-settings-panel">
            {!auth?.shopId || !auth?.id ? (
              <p className="merchant-settings-inline-note">
                {tr(lang, { zh: '请重新登录后再设置。', en: 'Please sign in again.', de: 'Bitte melden Sie sich erneut an.', ja: '再度ログインしてから設定してください。', ko: '다시 로그인해 주세요.', es: 'Vuelve a iniciar sesión.', it: 'Accedi di nuovo.', vi: 'Vui lòng đăng nhập lại.', fr: 'Veuillez vous reconnecter.'})}
              </p>
            ) : shopTradeMode !== 'summary' ? (
              <>
              <div className="merchant-settings-pin-head">
                <SettingsItemIcon src={withdrawPinIcon} />
                <span className="merchant-settings-row-label">{tr(lang, { zh: '提现密码', en: 'Payment PIN', de: 'Payment PIN', ja: '出金パスワード', ko: '출금 PIN', es: 'PIN de pago', it: 'PIN di pagamento', vi: 'PIN thanh toán', fr: 'Code PIN de paiement'})}</span>
              </div>
              <div className="merchant-settings-pin-form">
              {shopTradeMode === 'edit' && (
                <div className="merchant-settings-pin-field">
                  <label className="merchant-settings-pin-label">
                    <span className="merchant-settings-pin-required">*</span>
                    {tr(lang, { zh: '旧密码', en: 'Current PIN', de: 'Current PIN', ja: '現在のパスワード', ko: '현재 PIN', es: 'PIN actual', it: 'PIN attuale', vi: 'PIN hiện tại', fr: 'Code PIN actuel'})}
                  </label>
                  <div className="merchant-settings-pin-input-wrap">
                    <input
                      type={shopTradeShowOld ? 'text' : 'password'}
                      className="merchant-settings-pin-input"
                      placeholder={
                        tr(lang, { zh: '请输入 6 位数字旧密码', en: 'Please enter your current 6‑digit PIN', de: 'Bitte geben Sie Ihre aktuelle 6-stellige PIN ein', ja: '現在の6桁パスワードを入力してください', ko: '현재 6자리 PIN을 입력하세요', es: 'Ingresa tu PIN actual de 6 dígitos', it: 'Inserisci il PIN attuale a 6 cifre', vi: 'Vui lòng nhập PIN hiện tại 6 chữ số', fr: 'Veuillez saisir votre code PIN actuel à 6 chiffres'})
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
                          ? (tr(lang, { zh: '隐藏密码', en: 'Hide PIN', de: 'Hide PIN', ja: 'パスワードを非表示', ko: 'PIN 숨기기', es: 'Ocultar PIN', it: 'Nascondi PIN', vi: 'Ẩn PIN', fr: 'Masquer le code PIN'}))
                          : (tr(lang, { zh: '显示密码', en: 'Show PIN', de: 'Show PIN', ja: 'パスワードを表示', ko: 'PIN 표시', es: 'Mostrar PIN', it: 'Mostra PIN', vi: 'Hiện PIN', fr: 'Afficher le code PIN'}))
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
                  {tr(lang, { zh: '新密码', en: 'New PIN', de: 'New PIN', ja: '新しいパスワード', ko: '새 PIN', es: 'PIN nuevo', it: 'Nuovo PIN', vi: 'PIN mới', fr: 'Nouveau code PIN'})}
                </label>
                <div className="merchant-settings-pin-input-wrap">
                  <input
                    type={shopTradeShowNew ? 'text' : 'password'}
                    className="merchant-settings-pin-input"
                    placeholder={
                      tr(lang, { zh: '请输入 6 位数字密码', en: 'Please enter a new 6‑digit PIN', de: 'Bitte geben Sie eine neue 6-stellige PIN ein', ja: '6桁の数字パスワードを入力してください', ko: '새 6자리 PIN을 입력하세요', es: 'Ingresa un PIN nuevo de 6 dígitos', it: 'Inserisci un nuovo PIN a 6 cifre', vi: 'Vui lòng nhập PIN mới 6 chữ số', fr: 'Veuillez saisir un nouveau code PIN à 6 chiffres'})
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
                        ? (tr(lang, { zh: '隐藏密码', en: 'Hide PIN', de: 'Hide PIN', ja: 'パスワードを非表示', ko: 'PIN 숨기기', es: 'Ocultar PIN', it: 'Nascondi PIN', vi: 'Ẩn PIN', fr: 'Masquer le code PIN'}))
                        : (tr(lang, { zh: '显示密码', en: 'Show PIN', de: 'Show PIN', ja: 'パスワードを表示', ko: 'PIN 표시', es: 'Mostrar PIN', it: 'Mostra PIN', vi: 'Hiện PIN', fr: 'Afficher le code PIN'}))
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
                  {tr(lang, { zh: '确认密码', en: 'Confirm PIN', de: 'PIN bestätigen', ja: 'パスワード確認', ko: 'PIN 확인', es: 'Confirmar PIN', it: 'Conferma PIN', vi: 'Xác nhận PIN', fr: 'Confirmer le code PIN'})}
                </label>
                <div className="merchant-settings-pin-input-wrap">
                  <input
                    type={shopTradeShowConfirm ? 'text' : 'password'}
                    className="merchant-settings-pin-input"
                    placeholder={
                      tr(lang, { zh: '请再次输入 6 位数字密码', en: 'Please confirm the 6‑digit PIN', de: 'Bitte bestätigen Sie die 6-stellige PIN', ja: '6桁の数字パスワードを再入力してください', ko: '6자리 PIN을 다시 입력하세요', es: 'Confirma el PIN de 6 dígitos', it: 'Conferma il PIN a 6 cifre', vi: 'Vui lòng xác nhận PIN 6 chữ số', fr: 'Veuillez confirmer le code PIN à 6 chiffres'})
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
                        ? (tr(lang, { zh: '隐藏密码', en: 'Hide PIN', de: 'Hide PIN', ja: 'パスワードを非表示', ko: 'PIN 숨기기', es: 'Ocultar PIN', it: 'Nascondi PIN', vi: 'Ẩn PIN', fr: 'Masquer le code PIN'}))
                        : (tr(lang, { zh: '显示密码', en: 'Show PIN', de: 'Show PIN', ja: 'パスワードを表示', ko: 'PIN 표시', es: 'Mostrar PIN', it: 'Mostra PIN', vi: 'Hiện PIN', fr: 'Afficher le code PIN'}))
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
                  {tr(lang, { zh: '确认', en: 'Confirm', de: 'Confirm', ja: '確認', ko: '확인', es: 'Confirmar', it: 'Conferma', vi: 'Xác nhận', fr: 'Confirmer'})}
                </button>
                <button
                  type="button"
                  className="merchant-settings-btn merchant-settings-btn--ghost"
                  onClick={() => {
                    resetShopTradeForm()
                    setShopTradeMode('summary')
                  }}
                >
                  {tr(lang, { zh: '取消', en: 'Cancel', de: 'Abbrechen', ja: 'キャンセル', ko: '취소', es: 'Cancelar', it: 'Annulla', vi: 'Hủy', fr: 'Annuler'})}
                </button>
              </div>
            </div>
              </>
            ) : loginPwdMode !== 'summary' ? (
              <>
              <div className="merchant-settings-pin-head">
                <SettingsItemIcon src={accountIcon} />
                <span className="merchant-settings-row-label">{tr(lang, { zh: '登录密码', en: 'Login password', de: 'Login password', ja: 'ログインパスワード', ko: '로그인 비밀번호', es: 'Contraseña de acceso', it: 'Password di accesso', vi: 'Mật khẩu đăng nhập', fr: 'Mot de passe de connexion'})}</span>
              </div>
              <div className="merchant-settings-pin-form">
                <div className="merchant-settings-pin-field">
                  <label className="merchant-settings-pin-label">
                    <span className="merchant-settings-pin-required">*</span>
                    {tr(lang, { zh: '当前密码', en: 'Current password', de: 'Aktuelles Passwort', ja: '現在のパスワード', ko: '현재 비밀번호', es: 'Contraseña actual', it: 'Password attuale', vi: 'Mật khẩu hiện tại', fr: 'Mot de passe actuel'})}
                  </label>
                  <div className="merchant-settings-pin-input-wrap">
                    <input
                      type={loginPwdShowOld ? 'text' : 'password'}
                      className="merchant-settings-pin-input"
                      placeholder={
                        tr(lang, { zh: '请输入当前登录密码', en: 'Enter your current password', de: 'Geben Sie Ihr aktuelles Passwort ein', ja: '現在のログインパスワードを入力してください', ko: '현재 비밀번호를 입력하세요', es: 'Ingresa tu contraseña actual', it: 'Inserisci la password attuale', vi: 'Nhập mật khẩu hiện tại', fr: 'Entrez votre mot de passe actuel'})
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
                          ? (tr(lang, { zh: '隐藏密码', en: 'Hide password', de: 'Passwort verbergen', ja: 'パスワードを非表示', ko: '비밀번호 숨기기', es: 'Ocultar contraseña', it: 'Nascondi password', vi: 'Ẩn mật khẩu', fr: 'Masquer le mot de passe'}))
                          : (tr(lang, { zh: '显示密码', en: 'Show password', de: 'Passwort anzeigen', ja: 'パスワードを表示', ko: '비밀번호 표시', es: 'Mostrar contraseña', it: 'Mostra password', vi: 'Hiện mật khẩu', fr: 'Afficher le mot de passe'}))
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
                    {tr(lang, { zh: '新密码', en: 'New password', de: 'New password', ja: '新しいパスワード', ko: '새 비밀번호', es: 'Contraseña nueva', it: 'Nuova password', vi: 'Mật khẩu mới', fr: 'Nouveau mot de passe'})}
                  </label>
                  <div className="merchant-settings-pin-input-wrap">
                    <input
                      type={loginPwdShowNew ? 'text' : 'password'}
                      className="merchant-settings-pin-input"
                      placeholder={
                        tr(lang, { zh: '6-22 位字母和数字组合', en: '6-22 letters and digits', de: '6–22 Buchstaben und Ziffern', ja: '6〜22文字の英数字', ko: '6~22자 영문·숫자 조합', es: '6-22 caracteres alfanuméricos', it: '6-22 caratteri alfanumerici', vi: '6-22 ký tự chữ và số', fr: '6-22 lettres et chiffres'})
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
                          ? (tr(lang, { zh: '隐藏密码', en: 'Hide password', de: 'Passwort verbergen', ja: 'パスワードを非表示', ko: '비밀번호 숨기기', es: 'Ocultar contraseña', it: 'Nascondi password', vi: 'Ẩn mật khẩu', fr: 'Masquer le mot de passe'}))
                          : (tr(lang, { zh: '显示密码', en: 'Show password', de: 'Passwort anzeigen', ja: 'パスワードを表示', ko: '비밀번호 표시', es: 'Mostrar contraseña', it: 'Mostra password', vi: 'Hiện mật khẩu', fr: 'Afficher le mot de passe'}))
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
                    {tr(lang, { zh: '确认密码', en: 'Confirm password', de: 'Passwort bestätigen', ja: 'パスワード確認', ko: '비밀번호 확인', es: 'Confirmar contraseña', it: 'Conferma password', vi: 'Xác nhận mật khẩu', fr: 'Confirmez le mot de passe'})}
                  </label>
                  <div className="merchant-settings-pin-input-wrap">
                    <input
                      type={loginPwdShowConfirm ? 'text' : 'password'}
                      className="merchant-settings-pin-input"
                      placeholder={
                        tr(lang, { zh: '请再次输入新密码', en: 'Confirm your new password', de: 'Bestätigen Sie Ihr neues Passwort', ja: '新しいパスワードを再入力してください', ko: '새 비밀번호를 다시 입력하세요', es: 'Confirma tu nueva contraseña', it: 'Conferma la nuova password', vi: 'Xác nhận mật khẩu mới', fr: 'Confirmez votre nouveau mot de passe'})
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
                          ? (tr(lang, { zh: '隐藏密码', en: 'Hide password', de: 'Passwort verbergen', ja: 'パスワードを非表示', ko: '비밀번호 숨기기', es: 'Ocultar contraseña', it: 'Nascondi password', vi: 'Ẩn mật khẩu', fr: 'Masquer le mot de passe'}))
                          : (tr(lang, { zh: '显示密码', en: 'Show password', de: 'Passwort anzeigen', ja: 'パスワードを表示', ko: '비밀번호 표시', es: 'Mostrar contraseña', it: 'Mostra password', vi: 'Hiện mật khẩu', fr: 'Afficher le mot de passe'}))
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
                      ? (tr(lang, { zh: '保存中…', en: 'Saving…', de: 'Saving…', ja: '保存中…', ko: '저장 중…', es: 'Guardando…', it: 'Salvataggio…', vi: 'Đang lưu…', fr: 'Économie…'}))
                      : (tr(lang, { zh: '确认', en: 'Confirm', de: 'Confirm', ja: '確認', ko: '확인', es: 'Confirmar', it: 'Conferma', vi: 'Xác nhận', fr: 'Confirmer'}))}
                  </button>
                  <button
                    type="button"
                    className="merchant-settings-btn merchant-settings-btn--ghost"
                    onClick={() => {
                      resetLoginPwdForm()
                      setLoginPwdMode('summary')
                    }}
                  >
                    {tr(lang, { zh: '取消', en: 'Cancel', de: 'Abbrechen', ja: 'キャンセル', ko: '취소', es: 'Cancelar', it: 'Annulla', vi: 'Hủy', fr: 'Annuler'})}
                  </button>
                </div>
              </div>
              </>
            ) : (
              <>
              <div className="merchant-settings-row merchant-settings-row--action">
                <div className="merchant-settings-row-main">
                  <SettingsItemIcon src={accountIcon} />
                  <span className="merchant-settings-row-label">{tr(lang, { zh: '登录密码', en: 'Login password', de: 'Login password', ja: 'ログインパスワード', ko: '로그인 비밀번호', es: 'Contraseña de acceso', it: 'Password di accesso', vi: 'Mật khẩu đăng nhập', fr: 'Mot de passe de connexion'})}</span>
                </div>
                <button
                  type="button"
                  className="merchant-settings-link-btn"
                  onClick={openLoginPwdEditor}
                >
                  {tr(lang, { zh: '修改', en: 'Change', de: 'Change', ja: '変更', ko: '변경', es: 'Cambiar', it: 'Modifica', vi: 'Thay đổi', fr: 'Changement'})}
                </button>
              </div>
              <div className="merchant-settings-row merchant-settings-row--action">
                <div className="merchant-settings-row-main">
                  <SettingsItemIcon src={withdrawPinIcon} />
                  <span className="merchant-settings-row-label">{tr(lang, { zh: '提现密码', en: 'Payment PIN', de: 'Payment PIN', ja: '出金パスワード', ko: '출금 PIN', es: 'PIN de pago', it: 'PIN di pagamento', vi: 'PIN thanh toán', fr: 'Code PIN de paiement'})}</span>
                  <span
                    className={`merchant-settings-status-pill${
                      shopHasTradePwd
                        ? ' merchant-settings-status-pill--ok'
                        : ' merchant-settings-status-pill--warn'
                    }`}
                  >
                    {shopHasTradePwd
                      ? (tr(lang, { zh: '已设置', en: 'Set', de: 'Set', ja: '設定済み', ko: '설정', es: 'Configurado', it: 'Impostato', vi: 'Đã đặt', fr: 'Ensemble'}))
                      : (tr(lang, { zh: '未设置', en: 'Not set', de: 'Not set', ja: '未設定', ko: '미설정', es: 'Sin configurar', it: 'Non impostato', vi: 'Chưa đặt', fr: 'Non défini'}))}
                  </span>
                </div>
                <button
                  type="button"
                  className="merchant-settings-link-btn"
                  onClick={openTradePwdEditor}
                >
                  {shopHasTradePwd
                    ? (tr(lang, { zh: '修改', en: 'Change', de: 'Change', ja: '変更', ko: '변경', es: 'Cambiar', it: 'Modifica', vi: 'Thay đổi', fr: 'Changement'}))
                    : (tr(lang, { zh: '设置', en: 'Set up', de: 'Set up', ja: '設定', ko: '설정하기', es: 'Configurar', it: 'Configura', vi: 'Thiết lập', fr: 'Installation'}))}
                </button>
              </div>
              </>
            )}
          </div>
        </section>

        <section className="merchant-settings-group">
          <h2 className="merchant-settings-group-title">{tr(lang, { zh: '通用', en: 'General', de: 'General', ja: '一般', ko: '일반', es: 'General', it: 'Generale', vi: 'Chung', fr: 'Général'})}</h2>
          <div className="merchant-settings-panel">
            <div className="merchant-settings-row merchant-settings-row--action">
              <div className="merchant-settings-row-main">
                <SettingsItemIcon src={settingsLangIcon} />
                <span className="merchant-settings-row-label">{tr(lang, { zh: '语言', en: 'Language', de: 'Sprache', ja: '言語', ko: '언어', es: 'Idioma', it: 'Lingua', vi: 'Ngôn ngữ', fr: 'Langue'})}</span>
              </div>
              <div
                className="merchant-settings-lang-segment"
                role="group"
                aria-label={tr(lang, { zh: '语言', en: 'Language', de: 'Sprache', ja: '言語', ko: '언어', es: 'Idioma', it: 'Lingua', vi: 'Ngôn ngữ', fr: 'Langue'})}
              >
                {(
                  [
                    { code: 'zh' as const, label: '简' },
                    { code: 'tw' as const, label: '繁' },
                    { code: 'en' as const, label: 'EN' },
                    { code: 'de' as const, label: 'DE' },
                    { code: 'ja' as const, label: 'JA' },
                    { code: 'ko' as const, label: 'KO' },
                    { code: 'es' as const, label: 'ES' },
                    { code: 'it' as const, label: 'IT' },
                    { code: 'vi' as const, label: 'VI' },
                    { code: 'fr' as const, label: 'FR' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    className={`merchant-settings-lang-option${lang === opt.code ? ' merchant-settings-lang-option--active' : ''}`}
                    aria-pressed={lang === opt.code}
                    onClick={() => setLang(opt.code)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="merchant-settings-row"
              onClick={handleOpenSupport}
            >
              <span className="merchant-settings-row-main">
                <SettingsItemIcon src={loginTrustSupport} />
                <span>{tr(lang, { zh: '联系客服', en: 'Contact support', de: 'Support kontaktieren', ja: 'サポートに連絡', ko: '고객센터 문의', es: 'Contactar soporte', it: 'Contatta assistenza', vi: 'Liên hệ hỗ trợ', fr: 'Contacter l\'assistance'})}</span>
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
                <span>{tr(lang, { zh: '退出登录', en: 'Log out', de: 'Abmelden', ja: 'ログアウト', ko: '로그아웃', es: 'Cerrar sesión', it: 'Esci', vi: 'Đăng xuất', fr: 'Se déconnecter'})}</span>
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
              {tr(lang, { zh: '确认退出登录？', en: 'Log out of this shop?', de: 'Von diesem Shop abmelden?', ja: 'ログアウトしますか？', ko: '로그아웃하시겠습니까?', es: '¿Cerrar sesión de esta tienda?', it: 'Uscire da questo negozio?', vi: 'Đăng xuất khỏi cửa hàng này?', fr: 'Vous déconnecter de cette boutique ?'})}
            </h2>
            <p className="merchant-backend-logout-subtitle">
              {tr(lang, { zh: '退出后需重新登录。', en: 'You will need to sign in again.', de: 'Sie müssen sich erneut anmelden.', ja: 'ログアウト後、再度ログインが必要です。', ko: '로그아웃 후 다시 로그인해야 합니다.', es: 'Deberás iniciar sesión de nuevo.', it: 'Dovrai accedere di nuovo.', vi: 'Bạn cần đăng nhập lại.', fr: 'Vous devrez vous reconnecter.'})}
            </p>
            <div className="merchant-backend-logout-actions">
              <button
                type="button"
                className="merchant-backend-logout-btn merchant-backend-logout-btn--secondary"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                {tr(lang, { zh: '取消', en: 'Cancel', de: 'Abbrechen', ja: 'キャンセル', ko: '취소', es: 'Cancelar', it: 'Annulla', vi: 'Hủy', fr: 'Annuler'})}
              </button>
              <button
                type="button"
                className="merchant-backend-logout-btn merchant-backend-logout-btn--primary"
                onClick={handleLogout}
              >
                {tr(lang, { zh: '确认退出', en: 'Log out', de: 'Abmelden', ja: 'ログアウトを確認', ko: '로그아웃', es: 'Cerrar sesión', it: 'Esci', vi: 'Đăng xuất', fr: 'Se déconnecter'})}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MerchantSettings
