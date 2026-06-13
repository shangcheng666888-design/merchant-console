import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceIcon from '../assets/kefu.png'
import { openCrispChat } from '../utils/crispChat'
import zhFlagIcon from '../assets/lang-zh.png'
import enFlagIcon from '../assets/lang-en.png'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'
import loginBrandLogo from '../assets/login-brand-logo.png'
import loginIconTraffic from '../assets/login-icon-traffic.png'
import loginIconTrafficMobile from '../assets/login-icon-traffic-mobile.png'
import loginIconPromo from '../assets/login-icon-promo.png'
import loginIconPromoMobile from '../assets/login-icon-promo-mobile.png'
import loginIconWallet from '../assets/login-icon-wallet.png'
import loginIconWalletMobile from '../assets/login-icon-wallet-mobile.png'
import loginIconGlobal from '../assets/login-icon-global.png'
import loginIconGlobalMobile from '../assets/login-icon-global-mobile.png'
import loginIconOrders from '../assets/login-icon-orders.png'
import loginIconOrdersMobile from '../assets/login-icon-orders-mobile.png'
import loginIconFinance from '../assets/login-icon-finance.png'
import loginTrustSecure from '../assets/login-trust-secure.png'
import loginTrustGlobal from '../assets/login-trust-global.png'
import loginTrustSupport from '../assets/login-trust-support.png'

type LoginIconName =
  | 'traffic'
  | 'promo'
  | 'onestop'
  | 'global'
  | 'wallet'
  | 'orders'
  | 'finance'
  | 'plan'
  | 'level'

function LoginServiceIcon({ name, size = 15, fill = false }: { name: LoginIconName; size?: number; fill?: boolean }) {
  switch (name) {
    case 'traffic':
      return (
        <img
          src={loginIconTraffic}
          alt=""
          className={`merchant-login-service-icon-img${fill ? ' merchant-login-service-icon-img--fill' : ''}`}
          {...(fill ? {} : { width: size, height: size })}
          aria-hidden="true"
          decoding="async"
        />
      )
    case 'promo':
      return (
        <img
          src={loginIconPromo}
          alt=""
          className={`merchant-login-service-icon-img${fill ? ' merchant-login-service-icon-img--fill' : ''}`}
          {...(fill ? {} : { width: size, height: size })}
          aria-hidden="true"
          decoding="async"
        />
      )
    case 'onestop':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="3" y="13" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <rect x="13" y="13" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      )
    case 'global':
      return (
        <img
          src={loginIconGlobal}
          alt=""
          className={`merchant-login-service-icon-img${fill ? ' merchant-login-service-icon-img--fill' : ''}`}
          {...(fill ? {} : { width: size, height: size })}
          aria-hidden="true"
          decoding="async"
        />
      )
    case 'wallet':
      return (
        <img
          src={loginIconWallet}
          alt=""
          className={`merchant-login-service-icon-img${fill ? ' merchant-login-service-icon-img--fill' : ''}`}
          {...(fill ? {} : { width: size, height: size })}
          aria-hidden="true"
          decoding="async"
        />
      )
    case 'orders':
      return (
        <img
          src={loginIconOrders}
          alt=""
          className={`merchant-login-service-icon-img${fill ? ' merchant-login-service-icon-img--fill' : ''}`}
          {...(fill ? {} : { width: size, height: size })}
          aria-hidden="true"
          decoding="async"
        />
      )
    case 'finance':
      return (
        <img
          src={loginIconFinance}
          alt=""
          className={`merchant-login-service-icon-img${fill ? ' merchant-login-service-icon-img--fill' : ''}`}
          {...(fill ? {} : { width: size, height: size })}
          aria-hidden="true"
          decoding="async"
        />
      )
    case 'plan':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
          <path d="M5 18V8M12 18V5M19 18v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'level':
      return (
        <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
          <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 7.2 17.9l.9-5.4L4.2 8.7l5.4-.8L12 3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      )
    default:
      return null
  }
}

const MerchantLogin: React.FC = () => {
  const navigate = useNavigate()
  const { lang, setLang } = useLang()
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  })
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [shakeForm, setShakeForm] = useState(false)

  useEffect(() => {
    if (!submitError) return
    setShakeForm(true)
    const timer = setTimeout(() => setShakeForm(false), 480)
    return () => clearTimeout(timer)
  }, [submitError])

  useEffect(() => {
    const t = setTimeout(() => {
      import('../components/MerchantBackendLayout')
      import('./MerchantDashboard')
    }, 600)
    return () => clearTimeout(t)
  }, [])

  const t = lang === 'zh'
    ? {
        title: '登录',
        emailLabel: '邮箱',
        passwordLabel: '密码',
        emailPlaceholder: '请输入邮箱',
        passwordPlaceholder: '请输入密码',
        loginButton: '登录',
        forgotPassword: '忘记密码？',
        langText: '简体中文',
        emailRequired: '请输入邮箱',
        emailFormat: '请输入正确的邮箱格式',
        passwordRequired: '请输入密码',
        passwordFormat: '密码需为 6-22 位字母和数字组合',
        onestopBadge: '一站式经营',
        posterExposureTitle: '站内曝光',
        posterExposureDesc: '提升店铺可见度',
        posterPromoTitle: '付费推广',
        posterPromoDesc: '精准投放拉新客',
        posterGlobalTitle: '海外仓代发',
        posterGlobalDesc: '全球极速履约',
        posterWalletTitle: '资金钱包',
        posterWalletDesc: '充值提现更便捷',
        posterOrdersTitle: '订单管理',
        posterOrdersDesc: '高效处理每一笔',
        posterFinanceTitle: '财务报表',
        posterFinanceDesc: '收支明细一目了然',
        introSectionTitle: '平台服务',
        toolbarSubtitle: 'TikTok Shop 商家中心',
        toolbarSupport: '客服',
        welcomeKicker: '欢迎回来',
        welcomeDesc: '登录后即可管理店铺、订单与全球推广',
        trustSecure: '安全加密',
        trustGlobal: '全球服务',
        trustSupport: '专属客服',
      }
    : {
        title: 'Sign in',
        emailLabel: 'Email',
        passwordLabel: 'Password',
        emailPlaceholder: 'Enter your email',
        passwordPlaceholder: 'Enter your password',
        loginButton: 'Sign in',
        forgotPassword: 'Forgot password?',
        langText: 'English',
        emailRequired: 'Please enter email',
        emailFormat: 'Please enter a valid email address',
        passwordRequired: 'Please enter password',
        passwordFormat: 'Password must be 6-22 characters with letters and numbers',
        onestopBadge: 'All-in-one hub',
        posterExposureTitle: 'On-site exposure',
        posterExposureDesc: 'Boost shop visibility',
        posterPromoTitle: 'Paid promotion',
        posterPromoDesc: 'Targeted ad campaigns',
        posterGlobalTitle: 'Fulfillment',
        posterGlobalDesc: 'Ship worldwide faster',
        posterWalletTitle: 'Wallet',
        posterWalletDesc: 'Top-up & withdraw easily',
        posterOrdersTitle: 'Orders',
        posterOrdersDesc: 'Process every sale fast',
        posterFinanceTitle: 'Finance',
        posterFinanceDesc: 'Clear revenue reports',
        introSectionTitle: 'Platform services',
        toolbarSubtitle: 'TikTok Shop Seller Center',
        toolbarSupport: 'Support',
        welcomeKicker: 'Welcome back',
        welcomeDesc: 'Sign in to manage your shop, orders & global campaigns',
        trustSecure: 'Secure login',
        trustGlobal: 'Global service',
        trustSupport: 'Live support',
      }

  const decoItems: { key: LoginIconName; label: string }[] = lang === 'zh'
    ? [
        { key: 'traffic', label: '站内曝光' },
        { key: 'promo', label: '付费推广' },
        { key: 'global', label: '海外仓代发' },
        { key: 'wallet', label: '资金钱包' },
        { key: 'orders', label: '订单管理' },
        { key: 'finance', label: '财务报表' },
      ]
    : [
        { key: 'traffic', label: 'On-site exposure' },
        { key: 'promo', label: 'Paid promo' },
        { key: 'global', label: 'Fulfillment' },
        { key: 'wallet', label: 'Wallet' },
        { key: 'orders', label: 'Orders' },
        { key: 'finance', label: 'Finance' },
      ]

  const mobileDecoIcons: Partial<Record<LoginIconName, { desktop: string; mobile: string }>> = {
    traffic: { desktop: loginIconTraffic, mobile: loginIconTrafficMobile },
    promo: { desktop: loginIconPromo, mobile: loginIconPromoMobile },
    global: { desktop: loginIconGlobal, mobile: loginIconGlobalMobile },
    wallet: { desktop: loginIconWallet, mobile: loginIconWalletMobile },
    orders: { desktop: loginIconOrders, mobile: loginIconOrdersMobile },
  }

  const posterCards = [
    {
      key: 'exposure',
      pos: 'tl',
      title: t.posterExposureTitle,
      desc: t.posterExposureDesc,
      icon: loginIconTraffic,
      tone: 'cyan',
    },
    {
      key: 'promo',
      pos: 'tr',
      title: t.posterPromoTitle,
      desc: t.posterPromoDesc,
      icon: loginIconPromo,
      tone: 'orange',
    },
    {
      key: 'global',
      pos: 'bl',
      title: t.posterGlobalTitle,
      desc: t.posterGlobalDesc,
      icon: loginIconGlobal,
      tone: 'green',
    },
    {
      key: 'wallet',
      pos: 'br',
      title: t.posterWalletTitle,
      desc: t.posterWalletDesc,
      icon: loginIconWallet,
      tone: 'gold',
    },
    {
      key: 'orders',
      pos: 'lc',
      title: t.posterOrdersTitle,
      desc: t.posterOrdersDesc,
      icon: loginIconOrders,
      tone: 'violet',
    },
    {
      key: 'finance',
      pos: 'rc',
      title: t.posterFinanceTitle,
      desc: t.posterFinanceDesc,
      icon: loginIconFinance,
      tone: 'teal',
    },
  ] as const

  const validate = () => {
    const next = { email: '', password: '' }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,22}$/

    if (!email.trim()) next.email = t.emailRequired
    else if (!emailRegex.test(email.trim())) next.email = t.emailFormat

    if (!password) next.password = t.passwordRequired
    else if (!pwdRegex.test(password)) next.password = t.passwordFormat

    setErrors(next)
    setSubmitError('')
    return !next.email && !next.password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return
    const value = email.trim()
    setSubmitting(true)
    try {
      const res = await api.post<{ success?: boolean; user?: { id: string; account: string; balance: number; shopId: string | null } }>('/api/auth/login', { value, password })
      if (res.success && res.user) {
        try {
          window.localStorage.setItem('authUser', JSON.stringify(res.user))
        } catch {}
        navigate('/dashboard')
      } else {
        setSubmitError(lang === 'zh' ? '登录失败，请重试' : 'Login failed, please try again')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (lang === 'zh' ? '登录失败，请重试' : 'Login failed')
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const renderLangSwitch = (wrapClassName: string) => (
    <div className={`merchant-login-lang ${wrapClassName}`}>
      <button
        type="button"
        className="merchant-login-lang-button"
        onClick={() => setLangDropdownOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={langDropdownOpen}
      >
        <span className="merchant-login-lang-flag" aria-hidden="true">
          <img
            src={lang === 'zh' ? zhFlagIcon : enFlagIcon}
            alt=""
            className="merchant-login-lang-flag-img"
          />
        </span>
        <span>{t.langText}</span>
      </button>
      {langDropdownOpen && (
        <div className="merchant-login-lang-dropdown" role="listbox">
          <button
            type="button"
            className="merchant-login-lang-option"
            aria-selected={lang === 'zh'}
            onClick={() => {
              setLang('zh')
              setLangDropdownOpen(false)
            }}
          >
            <span className="merchant-login-lang-option-flag" aria-hidden="true">
              <img src={zhFlagIcon} alt="" className="merchant-login-lang-flag-img" />
            </span>
            <span>简体中文</span>
          </button>
          <button
            type="button"
            className="merchant-login-lang-option"
            aria-selected={lang === 'en'}
            onClick={() => {
              setLang('en')
              setLangDropdownOpen(false)
            }}
          >
            <span className="merchant-login-lang-option-flag" aria-hidden="true">
              <img src={enFlagIcon} alt="" className="merchant-login-lang-flag-img" />
            </span>
            <span>English</span>
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="merchant-login-page merchant-login-page--v2">
      <div className="merchant-login-v2-bg" aria-hidden="true">
        <div className="merchant-login-v2-bg-gradient" />
        <div className="merchant-login-v2-bg-grid" />
        <div className="merchant-login-v2-bg-orb merchant-login-v2-bg-orb--a" />
        <div className="merchant-login-v2-bg-orb merchant-login-v2-bg-orb--b" />
        <div className="merchant-login-v2-bg-orb merchant-login-v2-bg-orb--c" />
        <div className="merchant-login-v2-bg-ring merchant-login-v2-bg-ring--a" />
        <div className="merchant-login-v2-bg-ring merchant-login-v2-bg-ring--b" />
        <div className="merchant-login-v2-bg-dots merchant-login-v2-bg-dots--a" />
        <div className="merchant-login-v2-bg-dots merchant-login-v2-bg-dots--b" />
        <div className="merchant-login-v2-bg-stripes" />
        <div className="merchant-login-v2-bg-aurora" />
        <div className="merchant-login-v2-bg-tone merchant-login-v2-bg-tone--cyan" />
        <div className="merchant-login-v2-bg-tone merchant-login-v2-bg-tone--orange" />
        <div className="merchant-login-v2-bg-tone merchant-login-v2-bg-tone--green" />
        <div className="merchant-login-v2-bg-tone merchant-login-v2-bg-tone--gold" />
        <div className="merchant-login-v2-bg-tone merchant-login-v2-bg-tone--violet" />
        <div className="merchant-login-v2-bg-tone merchant-login-v2-bg-tone--teal" />
        <span className="merchant-login-v2-bg-chip merchant-login-v2-bg-chip--a" />
        <span className="merchant-login-v2-bg-chip merchant-login-v2-bg-chip--b" />
        <span className="merchant-login-v2-bg-chip merchant-login-v2-bg-chip--c" />
        <span className="merchant-login-v2-bg-sparkle merchant-login-v2-bg-sparkle--1" />
        <span className="merchant-login-v2-bg-sparkle merchant-login-v2-bg-sparkle--2" />
        <span className="merchant-login-v2-bg-sparkle merchant-login-v2-bg-sparkle--3" />
        <span className="merchant-login-v2-bg-sparkle merchant-login-v2-bg-sparkle--4" />
        <span className="merchant-login-v2-bg-sparkle merchant-login-v2-bg-sparkle--5" />
        <span className="merchant-login-v2-bg-sparkle merchant-login-v2-bg-sparkle--6" />
        <span className="merchant-login-v2-bg-arc merchant-login-v2-bg-arc--a" />
        <span className="merchant-login-v2-bg-arc merchant-login-v2-bg-arc--b" />
      </div>

      <div className="merchant-login-v2-posters" aria-hidden="true">
        {posterCards.map((poster) => (
          <article
            key={poster.key}
            className={`merchant-login-v2-poster merchant-login-v2-poster--${poster.pos} merchant-login-v2-poster--${poster.tone}`}
          >
            <div className="merchant-login-v2-poster-shine" />
            <div className="merchant-login-v2-poster-icon-wrap">
              <img src={poster.icon} alt="" className="merchant-login-v2-poster-icon" decoding="async" />
            </div>
            <h2 className="merchant-login-v2-poster-title">{poster.title}</h2>
            <p className="merchant-login-v2-poster-desc">{poster.desc}</p>
          </article>
        ))}
      </div>

      <header className="merchant-login-v2-topbar">
        {renderLangSwitch('merchant-login-v2-lang--topbar')}
      </header>

      <main className="merchant-login-v2-main">
        <div className="merchant-login-v2-panel">
          <span className="merchant-login-v2-onestop-badge">
            <LoginServiceIcon name="onestop" size={12} />
            {t.onestopBadge}
          </span>

          <div className="merchant-login-v2-brand-side">
            <div className="merchant-login-v2-mobile-brand-head">
              {renderLangSwitch('merchant-login-v2-lang-header')}
            </div>
            <img
              src={loginBrandLogo}
              alt={lang === 'zh' ? 'TikTok Shop' : 'TikTok Shop'}
              className="merchant-login-v2-brand-bg"
              width={257}
              height={196}
              decoding="async"
            />
            <div className="merchant-login-v2-mobile-brand-meta">
              <span className="merchant-login-v2-mobile-onestop">
                <LoginServiceIcon name="onestop" size={11} />
                <span>{t.onestopBadge}</span>
              </span>
              <p className="merchant-login-v2-mobile-subtitle">{t.toolbarSubtitle}</p>
            </div>
          </div>

          <div className="merchant-login-v2-mobile-sheet">
            <div className="merchant-login-v2-mobile-sheet-deco" aria-hidden="true">
              <span className="merchant-login-v2-mobile-line-arc merchant-login-v2-mobile-line-arc--a" />
              <span className="merchant-login-v2-mobile-line-arc merchant-login-v2-mobile-line-arc--b" />
              <span className="merchant-login-v2-mobile-orb merchant-login-v2-mobile-orb--a" />
              <span className="merchant-login-v2-mobile-orb merchant-login-v2-mobile-orb--b" />
              <span className="merchant-login-v2-mobile-grid" />
            </div>

            <div className="merchant-login-v2-body">
              <header className="merchant-login-v2-mobile-welcome">
                <p className="merchant-login-v2-mobile-welcome-kicker">{t.welcomeKicker}</p>
                <h1 className="merchant-login-title">{t.title}</h1>
                <p className="merchant-login-v2-mobile-welcome-desc">{t.welcomeDesc}</p>
              </header>

            <form
              className={`merchant-login-form${shakeForm ? ' merchant-login-form--shake' : ''}`}
              onSubmit={handleSubmit}
              aria-busy={submitting}
            >
              <div className="merchant-login-field">
                <label className="merchant-login-label" htmlFor="merchant-login-email">
                  <span className="merchant-login-required">*</span> {t.emailLabel}
                </label>
                <div className="merchant-login-input-wrap">
                  <span className="merchant-login-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <path
                        d="M4 4h16a1 1 0 011 1v14H3V5a1 1 0 011-1z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 6l7 6 7-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    id="merchant-login-email"
                    className={`merchant-login-input${errors.email ? ' merchant-login-input--error' : ''}`}
                    placeholder={t.emailPlaceholder}
                    value={email}
                    autoComplete="email"
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                      setSubmitError('')
                    }}
                  />
                </div>
                {errors.email && <p className="merchant-login-error-text">{errors.email}</p>}
              </div>

              <div className="merchant-login-field">
                <label className="merchant-login-label" htmlFor="merchant-login-password">
                  <span className="merchant-login-required">*</span> {t.passwordLabel}
                </label>
                <div className="merchant-login-input-wrap">
                  <span className="merchant-login-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="10"
                        rx="2"
                        ry="2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                      <path
                        d="M8 10V8a4 4 0 018 0v2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    id="merchant-login-password"
                    className={`merchant-login-input${errors.password ? ' merchant-login-input--error' : ''}`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.passwordPlaceholder}
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                      setSubmitError('')
                    }}
                  />
                  <button
                    type="button"
                    className="merchant-login-password-toggle"
                    aria-label={showPassword ? (lang === 'zh' ? '隐藏密码' : 'Hide password') : (lang === 'zh' ? '显示密码' : 'Show password')}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="M3 12s2.5-5 9-5 9 5 9 5-2.5 5-9 5-9-5-9-5z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                        <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                        <path
                          d="M3 12s2.5-5 9-5 9 5 9 5-2.5 5-9 5-9-5-9-5z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="merchant-login-field-footer">
                  <button
                    type="button"
                    className="merchant-login-link-button merchant-login-link-button--right"
                    onClick={() => openCrispChat()}
                  >
                    {t.forgotPassword}
                  </button>
                </div>
                {errors.password && <p className="merchant-login-error-text">{errors.password}</p>}
              </div>

              {submitError && (
                <p className="merchant-login-error-text merchant-login-submit-error" role="alert">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                className={`merchant-login-submit merchant-login-submit--v2${submitting ? ' merchant-login-submit--loading' : ''}`}
                disabled={submitting}
              >
                {submitting && <span className="merchant-login-submit-spinner" aria-hidden="true" />}
                {submitting ? (lang === 'zh' ? '登录中…' : 'Signing in…') : t.loginButton}
              </button>

              <ul className="merchant-login-v2-mobile-trust" aria-label={lang === 'zh' ? '平台保障' : 'Platform assurance'}>
                <li className="merchant-login-v2-mobile-trust-item">
                  <img
                    src={loginTrustSecure}
                    alt=""
                    className="merchant-login-v2-mobile-trust-icon merchant-login-v2-mobile-trust-icon--secure"
                    width={16}
                    height={16}
                    decoding="async"
                    aria-hidden="true"
                  />
                  {t.trustSecure}
                </li>
                <li className="merchant-login-v2-mobile-trust-item">
                  <img
                    src={loginTrustGlobal}
                    alt=""
                    className="merchant-login-v2-mobile-trust-icon merchant-login-v2-mobile-trust-icon--global"
                    width={16}
                    height={16}
                    decoding="async"
                    aria-hidden="true"
                  />
                  {t.trustGlobal}
                </li>
                <li className="merchant-login-v2-mobile-trust-item">
                  <img
                    src={loginTrustSupport}
                    alt=""
                    className="merchant-login-v2-mobile-trust-icon merchant-login-v2-mobile-trust-icon--support"
                    width={16}
                    height={16}
                    decoding="async"
                    aria-hidden="true"
                  />
                  {t.trustSupport}
                </li>
              </ul>
            </form>
          </div>

          <div className="merchant-login-v2-footer">
            <div className="merchant-login-v2-mobile-footer-deco" aria-hidden="true">
              <span className="merchant-login-v2-mobile-footer-wing" />
              <div className="merchant-login-v2-mobile-spectrum">
                <span className="merchant-login-v2-mobile-spectrum-seg merchant-login-v2-mobile-spectrum-seg--traffic" />
                <span className="merchant-login-v2-mobile-spectrum-seg merchant-login-v2-mobile-spectrum-seg--promo" />
                <span className="merchant-login-v2-mobile-spectrum-seg merchant-login-v2-mobile-spectrum-seg--wallet" />
                <span className="merchant-login-v2-mobile-spectrum-seg merchant-login-v2-mobile-spectrum-seg--global" />
                <span className="merchant-login-v2-mobile-spectrum-seg merchant-login-v2-mobile-spectrum-seg--orders" />
                <span className="merchant-login-v2-mobile-spectrum-seg merchant-login-v2-mobile-spectrum-seg--finance" />
              </div>
              <span className="merchant-login-v2-mobile-footer-wing" />
            </div>
            <div className="merchant-login-v2-mobile-services-board">
              <ul className="merchant-login-v2-deco-row" aria-label={lang === 'zh' ? '平台服务' : 'Platform services'}>
                {decoItems.map((item) => (
                  <li key={item.key} className={`merchant-login-v2-deco-item merchant-login-v2-deco-item--${item.key}`}>
                    <span className="merchant-login-v2-deco-icon" aria-hidden="true">
                      {mobileDecoIcons[item.key] ? (
                        <>
                          <img
                            src={mobileDecoIcons[item.key]!.desktop}
                            alt=""
                            className="merchant-login-service-icon-img merchant-login-service-icon-img--fill merchant-login-v2-deco-icon-img--desktop"
                            aria-hidden="true"
                            decoding="async"
                          />
                          <img
                            src={mobileDecoIcons[item.key]!.mobile}
                            alt=""
                            className="merchant-login-service-icon-img merchant-login-service-icon-img--fill merchant-login-v2-deco-icon-img--mobile"
                            aria-hidden="true"
                            decoding="async"
                          />
                        </>
                      ) : (
                        <LoginServiceIcon name={item.key} fill />
                      )}
                    </span>
                    <span className="merchant-login-v2-deco-label">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          </div>
        </div>
      </main>

      <button
        type="button"
        className="merchant-login-service-fab"
        aria-label={lang === 'zh' ? '在线客服' : 'Live support'}
        onClick={() => openCrispChat()}
      >
        <img src={serviceIcon} alt="" className="merchant-login-service-icon merchant-login-service-fab-icon--desktop" />
        <img src={loginTrustSupport} alt="" className="merchant-login-service-icon merchant-login-service-fab-icon--mobile" decoding="async" />
      </button>
    </div>
  )
}

export default MerchantLogin
