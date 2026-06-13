import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import serviceIcon from '../assets/kefu.png'
import { openCrispChat } from '../utils/crispChat'
import zhFlagIcon from '../assets/lang-zh.png'
import enFlagIcon from '../assets/lang-en.png'
import deFlagIcon from '../assets/lang-de.png'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'
import { tr, pickBilingual, convertStringRecord, type Lang } from '../i18n'
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

const LOGIN_LANG_FLAGS: Partial<Record<Lang, string>> = {
  zh: zhFlagIcon,
  tw: zhFlagIcon,
  en: enFlagIcon,
  de: deFlagIcon,
  ja: enFlagIcon,
  ko: enFlagIcon,
  es: enFlagIcon,
  it: enFlagIcon,
  vi: enFlagIcon,
}

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

  const LOGIN_COPY_ZH = {
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
      signingIn: '登录中…',
    }

  const LOGIN_COPY: Record<Lang, typeof LOGIN_COPY_ZH> = {
    zh: LOGIN_COPY_ZH,
    tw: { ...convertStringRecord(LOGIN_COPY_ZH), langText: '繁體中文' },
    en: {
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
      signingIn: 'Signing in…',
    },
    de: {
      title: 'Anmelden',
      emailLabel: 'E-Mail',
      passwordLabel: 'Passwort',
      emailPlaceholder: 'E-Mail eingeben',
      passwordPlaceholder: 'Passwort eingeben',
      loginButton: 'Anmelden',
      forgotPassword: 'Passwort vergessen?',
      langText: 'Deutsch',
      emailRequired: 'Bitte E-Mail eingeben',
      emailFormat: 'Bitte gültige E-Mail-Adresse eingeben',
      passwordRequired: 'Bitte Passwort eingeben',
      passwordFormat: 'Passwort: 6–22 Zeichen mit Buchstaben und Zahlen',
      onestopBadge: 'All-in-One-Hub',
      posterExposureTitle: 'Sichtbarkeit',
      posterExposureDesc: 'Shop-Sichtbarkeit steigern',
      posterPromoTitle: 'Bezahlte Werbung',
      posterPromoDesc: 'Gezielte Kampagnen',
      posterGlobalTitle: 'Fulfillment',
      posterGlobalDesc: 'Weltweit schneller versenden',
      posterWalletTitle: 'Wallet',
      posterWalletDesc: 'Einfach ein- & auszahlen',
      posterOrdersTitle: 'Bestellungen',
      posterOrdersDesc: 'Jeden Verkauf schnell bearbeiten',
      posterFinanceTitle: 'Finanzen',
      posterFinanceDesc: 'Klare Umsatzberichte',
      introSectionTitle: 'Plattformdienste',
      toolbarSubtitle: 'TikTok Shop Seller Center',
      toolbarSupport: 'Support',
      welcomeKicker: 'Willkommen zurück',
      welcomeDesc: 'Melden Sie sich an, um Shop, Bestellungen & Kampagnen zu verwalten',
      trustSecure: 'Sichere Anmeldung',
      trustGlobal: 'Globaler Service',
      trustSupport: 'Live-Support',
      signingIn: 'Anmelden…',
    },
    ja: {
      title: 'ログイン',
      emailLabel: 'メールアドレス',
      passwordLabel: 'パスワード',
      emailPlaceholder: 'メールアドレスを入力',
      passwordPlaceholder: 'パスワードを入力',
      loginButton: 'ログイン',
      forgotPassword: 'パスワードをお忘れですか？',
      langText: '日本語',
      emailRequired: 'メールアドレスを入力してください',
      emailFormat: '有効なメールアドレスを入力してください',
      passwordRequired: 'パスワードを入力してください',
      passwordFormat: 'パスワードは6〜22文字の英数字である必要があります',
      onestopBadge: 'オールインワンハブ',
      posterExposureTitle: 'サイト内露出',
      posterExposureDesc: 'ショップの可視性を向上',
      posterPromoTitle: '有料プロモーション',
      posterPromoDesc: 'ターゲット広告キャンペーン',
      posterGlobalTitle: 'フルフィルメント',
      posterGlobalDesc: '世界中へ迅速配送',
      posterWalletTitle: 'ウォレット',
      posterWalletDesc: 'チャージ・出金が簡単',
      posterOrdersTitle: '注文',
      posterOrdersDesc: 'すべての販売を迅速処理',
      posterFinanceTitle: '財務',
      posterFinanceDesc: '明確な売上レポート',
      introSectionTitle: 'プラットフォームサービス',
      toolbarSubtitle: 'TikTok Shop セラーセンター',
      toolbarSupport: 'サポート',
      welcomeKicker: 'おかえりなさい',
      welcomeDesc: 'ログインしてショップ、注文、グローバルキャンペーンを管理',
      trustSecure: '安全なログイン',
      trustGlobal: 'グローバルサービス',
      trustSupport: 'ライブサポート',
      signingIn: 'ログイン中…',
    },
    ko: {
      title: '로그인',
      emailLabel: '이메일',
      passwordLabel: '비밀번호',
      emailPlaceholder: '이메일을 입력하세요',
      passwordPlaceholder: '비밀번호를 입력하세요',
      loginButton: '로그인',
      forgotPassword: '비밀번호를 잊으셨나요?',
      langText: '한국어',
      emailRequired: '이메일을 입력해 주세요',
      emailFormat: '올바른 이메일 주소를 입력해 주세요',
      passwordRequired: '비밀번호를 입력해 주세요',
      passwordFormat: '비밀번호는 6~22자 영문·숫자 조합이어야 합니다',
      onestopBadge: '올인원 허브',
      posterExposureTitle: '사이트 노출',
      posterExposureDesc: '쇼핑몰 가시성 향상',
      posterPromoTitle: '유료 프로모션',
      posterPromoDesc: '타겟 광고 캠페인',
      posterGlobalTitle: '풀필먼트',
      posterGlobalDesc: '전 세계 빠른 배송',
      posterWalletTitle: '지갑',
      posterWalletDesc: '충전·출금이 간편합니다',
      posterOrdersTitle: '주문',
      posterOrdersDesc: '모든 판매를 빠르게 처리',
      posterFinanceTitle: '재무',
      posterFinanceDesc: '명확한 매출 보고서',
      introSectionTitle: '플랫폼 서비스',
      toolbarSubtitle: 'TikTok Shop 셀러 센터',
      toolbarSupport: '고객센터',
      welcomeKicker: '다시 오신 것을 환영합니다',
      welcomeDesc: '로그인하여 쇼핑몰, 주문, 글로벌 캠페인을 관리하세요',
      trustSecure: '안전한 로그인',
      trustGlobal: '글로벌 서비스',
      trustSupport: '실시간 고객센터',
      signingIn: '로그인 중…',
    },
    es: {
      title: 'Iniciar sesión',
      emailLabel: 'Correo electrónico',
      passwordLabel: 'Contraseña',
      emailPlaceholder: 'Ingresa tu correo',
      passwordPlaceholder: 'Ingresa tu contraseña',
      loginButton: 'Iniciar sesión',
      forgotPassword: '¿Olvidaste tu contraseña?',
      langText: 'Español',
      emailRequired: 'Ingresa tu correo electrónico',
      emailFormat: 'Ingresa un correo electrónico válido',
      passwordRequired: 'Ingresa tu contraseña',
      passwordFormat: 'La contraseña debe tener 6-22 caracteres alfanuméricos',
      onestopBadge: 'Centro integral',
      posterExposureTitle: 'Exposición en la plataforma',
      posterExposureDesc: 'Aumenta la visibilidad de tu tienda',
      posterPromoTitle: 'Promoción pagada',
      posterPromoDesc: 'Campañas publicitarias segmentadas',
      posterGlobalTitle: 'Logística',
      posterGlobalDesc: 'Envía más rápido a todo el mundo',
      posterWalletTitle: 'Billetera',
      posterWalletDesc: 'Recarga y retira con facilidad',
      posterOrdersTitle: 'Pedidos',
      posterOrdersDesc: 'Procesa cada venta con rapidez',
      posterFinanceTitle: 'Finanzas',
      posterFinanceDesc: 'Informes claros de ingresos',
      introSectionTitle: 'Servicios de la plataforma',
      toolbarSubtitle: 'Centro de vendedores TikTok Shop',
      toolbarSupport: 'Soporte',
      welcomeKicker: 'Bienvenido de nuevo',
      welcomeDesc: 'Inicia sesión para administrar tu tienda, pedidos y campañas globales',
      trustSecure: 'Acceso seguro',
      trustGlobal: 'Servicio global',
      trustSupport: 'Soporte en vivo',
      signingIn: 'Iniciando sesión…',
    },
    it: {
      title: 'Accedi',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      emailPlaceholder: 'Inserisci la tua email',
      passwordPlaceholder: 'Inserisci la password',
      loginButton: 'Accedi',
      forgotPassword: 'Password dimenticata?',
      langText: 'Italiano',
      emailRequired: 'Inserisci l\'email',
      emailFormat: 'Inserisci un indirizzo email valido',
      passwordRequired: 'Inserisci la password',
      passwordFormat: 'La password deve contenere 6-22 caratteri alfanumerici',
      onestopBadge: 'Hub tutto-in-uno',
      posterExposureTitle: 'Visibilità in piattaforma',
      posterExposureDesc: 'Aumenta la visibilità del negozio',
      posterPromoTitle: 'Promozione a pagamento',
      posterPromoDesc: 'Campagne pubblicitarie mirate',
      posterGlobalTitle: 'Logistica',
      posterGlobalDesc: 'Spedizioni più rapide in tutto il mondo',
      posterWalletTitle: 'Portafoglio',
      posterWalletDesc: 'Ricarica e preleva con facilità',
      posterOrdersTitle: 'Ordini',
      posterOrdersDesc: 'Gestisci ogni vendita rapidamente',
      posterFinanceTitle: 'Finanze',
      posterFinanceDesc: 'Report chiari sui ricavi',
      introSectionTitle: 'Servizi della piattaforma',
      toolbarSubtitle: 'TikTok Shop Seller Center',
      toolbarSupport: 'Assistenza',
      welcomeKicker: 'Bentornato',
      welcomeDesc: 'Accedi per gestire negozio, ordini e campagne globali',
      trustSecure: 'Accesso sicuro',
      trustGlobal: 'Servizio globale',
      trustSupport: 'Assistenza live',
      signingIn: 'Accesso in corso…',
    },
    vi: {
      title: 'Đăng nhập',
      emailLabel: 'Email',
      passwordLabel: 'Mật khẩu',
      emailPlaceholder: 'Nhập email của bạn',
      passwordPlaceholder: 'Nhập mật khẩu',
      loginButton: 'Đăng nhập',
      forgotPassword: 'Quên mật khẩu?',
      langText: 'Tiếng Việt',
      emailRequired: 'Vui lòng nhập email',
      emailFormat: 'Vui lòng nhập địa chỉ email hợp lệ',
      passwordRequired: 'Vui lòng nhập mật khẩu',
      passwordFormat: 'Mật khẩu phải gồm 6-22 ký tự chữ và số',
      onestopBadge: 'Trung tâm tất cả trong một',
      posterExposureTitle: 'Hiển thị trên nền tảng',
      posterExposureDesc: 'Tăng độ hiển thị cửa hàng',
      posterPromoTitle: 'Quảng cáo trả phí',
      posterPromoDesc: 'Chiến dịch quảng cáo có mục tiêu',
      posterGlobalTitle: 'Fulfillment',
      posterGlobalDesc: 'Giao hàng nhanh toàn cầu',
      posterWalletTitle: 'Ví',
      posterWalletDesc: 'Nạp và rút tiền dễ dàng',
      posterOrdersTitle: 'Đơn hàng',
      posterOrdersDesc: 'Xử lý mọi đơn nhanh chóng',
      posterFinanceTitle: 'Tài chính',
      posterFinanceDesc: 'Báo cáo doanh thu rõ ràng',
      introSectionTitle: 'Dịch vụ nền tảng',
      toolbarSubtitle: 'Trung tâm Người bán TikTok Shop',
      toolbarSupport: 'Hỗ trợ',
      welcomeKicker: 'Chào mừng trở lại',
      welcomeDesc: 'Đăng nhập để quản lý cửa hàng, đơn hàng và chiến dịch toàn cầu',
      trustSecure: 'Đăng nhập an toàn',
      trustGlobal: 'Dịch vụ toàn cầu',
      trustSupport: 'Hỗ trợ trực tuyến',
      signingIn: 'Đang đăng nhập…',
    },

  }

  const t = LOGIN_COPY[lang]

  const DECO_ITEM_DEFS: { key: LoginIconName; zh: string; en: string; de: string; ja: string; ko: string; es: string; it: string; vi: string }[] = [
    { key: 'traffic', zh: '站内曝光', en: 'On-site exposure', de: 'Sichtbarkeit', ja: 'サイト内露出', ko: '사이트 노출' , es: 'Exposición en la plataforma', it: 'Visibilità in piattaforma' , vi: 'Hiển thị trên nền tảng' },
    { key: 'promo', zh: '付费推广', en: 'Paid promo', de: 'Bezahlte Werbung', ja: '有料プロモ', ko: '유료 프로모' , es: 'Promoción pagada', it: 'Promozione a pagamento' , vi: 'Quảng cáo trả phí' },
    { key: 'global', zh: '海外仓代发', en: 'Fulfillment', de: 'Fulfillment', ja: '海外倉庫発送', ko: '해외 창고 발송' , es: 'Logística internacional', it: 'Logistica internazionale' , vi: 'Kho hàng quốc tế' },
    { key: 'wallet', zh: '资金钱包', en: 'Wallet', de: 'Wallet', ja: 'ウォレット', ko: '지갑' , es: 'Billetera', it: 'Portafoglio' , vi: 'Ví' },
    { key: 'orders', zh: '订单管理', en: 'Orders', de: 'Bestellungen', ja: '注文管理', ko: '주문 관리' , es: 'Gestión de pedidos', it: 'Gestione ordini' , vi: 'Quản lý đơn hàng' },
    { key: 'finance', zh: '财务报表', en: 'Finance', de: 'Finanzen', ja: '財務レポート', ko: '재무 보고서' , es: 'Informes financieros', it: 'Report finanziari' , vi: 'Báo cáo tài chính' },
  ]

  const decoItems: { key: LoginIconName; label: string }[] = DECO_ITEM_DEFS.map((item) => ({
    key: item.key,
    label: pickBilingual(lang, item),
  }))

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
        setSubmitError(tr(lang, { zh: '登录失败，请重试', en: 'Login failed, please try again', de: 'Anmeldung fehlgeschlagen, bitte erneut versuchen', ja: 'ログインに失敗しました。再度お試しください', ko: '로그인에 실패했습니다. 다시 시도해 주세요.', es: 'Error al iniciar sesión, inténtalo de nuevo', it: 'Accesso non riuscito, riprova', vi: 'Đăng nhập thất bại, vui lòng thử lại'}))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tr(lang, {
        zh: '登录失败，请重试',
        en: 'Login failed',
        de: 'Anmeldung fehlgeschlagen', ja: 'ログインに失敗しました。再度お試しください', ko: '로그인에 실패했습니다', es: 'Error al iniciar sesión', it: 'Accesso non riuscito', vi: 'Đăng nhập thất bại'})
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
            src={LOGIN_LANG_FLAGS[lang] ?? enFlagIcon}
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
            aria-selected={lang === 'tw'}
            onClick={() => {
              setLang('tw')
              setLangDropdownOpen(false)
            }}
          >
            <span className="merchant-login-lang-option-flag" aria-hidden="true">
              <img src={zhFlagIcon} alt="" className="merchant-login-lang-flag-img" />
            </span>
            <span>繁體中文</span>
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
          <button
            type="button"
            className="merchant-login-lang-option"
            aria-selected={lang === 'de'}
            onClick={() => {
              setLang('de')
              setLangDropdownOpen(false)
            }}
          >
            <span className="merchant-login-lang-option-flag" aria-hidden="true">
              <img src={deFlagIcon} alt="" className="merchant-login-lang-flag-img" />
            </span>
            <span>Deutsch</span>
          </button>
          <button
            type="button"
            className="merchant-login-lang-option"
            aria-selected={lang === 'ja'}
            onClick={() => {
              setLang('ja')
              setLangDropdownOpen(false)
            }}
          >
            <span className="merchant-login-lang-option-flag" aria-hidden="true">
              <img src={enFlagIcon} alt="" className="merchant-login-lang-flag-img" />
            </span>
            <span>日本語</span>
          </button>
          <button
            type="button"
            className="merchant-login-lang-option"
            aria-selected={lang === 'ko'}
            onClick={() => {
              setLang('ko')
              setLangDropdownOpen(false)
            }}
          >
            <span className="merchant-login-lang-option-flag" aria-hidden="true">
              <img src={enFlagIcon} alt="" className="merchant-login-lang-flag-img" />
            </span>
            <span>한국어</span>
          </button>
          <button
            type="button"
            className="merchant-login-lang-option"
            aria-selected={lang === 'es'}
            onClick={() => {
              setLang('es')
              setLangDropdownOpen(false)
            }}
          >
            <span className="merchant-login-lang-option-flag" aria-hidden="true">
              <img src={enFlagIcon} alt="" className="merchant-login-lang-flag-img" />
            </span>
            <span>Español</span>
          </button>
          <button
            type="button"
            className="merchant-login-lang-option"
            aria-selected={lang === 'it'}
            onClick={() => {
              setLang('it')
              setLangDropdownOpen(false)
            }}
          >
            <span className="merchant-login-lang-option-flag" aria-hidden="true">
              <img src={enFlagIcon} alt="" className="merchant-login-lang-flag-img" />
            </span>
            <span>Italiano</span>
          </button>
          <button
            type="button"
            className="merchant-login-lang-option"
            aria-selected={lang === 'vi'}
            onClick={() => {
              setLang('vi')
              setLangDropdownOpen(false)
            }}
          >
            <span className="merchant-login-lang-option-flag" aria-hidden="true">
              <img src={enFlagIcon} alt="" className="merchant-login-lang-flag-img" />
            </span>
            <span>Tiếng Việt</span>
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
              alt={tr(lang, { zh: 'TikTok Shop', en: 'TikTok Shop', de: 'TikTok Shop', ja: 'TikTok Shop', ko: 'TikTok Shop', es: 'TikTok Shop', it: 'TikTok Shop', vi: 'TikTok Shop'})}
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
                    aria-label={showPassword ? (tr(lang, { zh: '隐藏密码', en: 'Hide password', de: 'Passwort verbergen', ja: 'パスワードを非表示', ko: '비밀번호 숨기기', es: 'Ocultar contraseña', it: 'Nascondi password', vi: 'Ẩn mật khẩu'})) : (tr(lang, { zh: '显示密码', en: 'Show password', de: 'Passwort anzeigen', ja: 'パスワードを表示', ko: '비밀번호 표시', es: 'Mostrar contraseña', it: 'Mostra password', vi: 'Hiện mật khẩu'}))}
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
                {submitting ? t.signingIn : t.loginButton}
              </button>

              <ul className="merchant-login-v2-mobile-trust" aria-label={tr(lang, { zh: '平台保障', en: 'Platform assurance', de: 'Plattform-Sicherheit', ja: 'プラットフォーム保証', ko: '플랫폼 보장', es: 'Garantía de la plataforma', it: 'Garanzia della piattaforma', vi: 'Cam kết nền tảng'})}>
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
              <ul className="merchant-login-v2-deco-row" aria-label={tr(lang, { zh: '平台服务', en: 'Platform services', de: 'Plattformdienste', ja: 'プラットフォームサービス', ko: '플랫폼 서비스', es: 'Servicios de la plataforma', it: 'Servizi della piattaforma', vi: 'Dịch vụ nền tảng'})}>
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
        aria-label={tr(lang, { zh: '在线客服', en: 'Live support', de: 'Live-Support', ja: 'オンラインサポート', ko: '실시간 고객센터', es: 'Soporte en vivo', it: 'Assistenza live', vi: 'Hỗ trợ trực tuyến'})}
        onClick={() => openCrispChat()}
      >
        <img src={serviceIcon} alt="" className="merchant-login-service-icon merchant-login-service-fab-icon--desktop" />
        <img src={loginTrustSupport} alt="" className="merchant-login-service-icon merchant-login-service-fab-icon--mobile" decoding="async" />
      </button>
    </div>
  )
}

export default MerchantLogin
