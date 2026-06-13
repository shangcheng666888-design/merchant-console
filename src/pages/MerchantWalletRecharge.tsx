import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ToastProvider'
import { api } from '../api/client'
import WalletPaymentBadges from '../components/WalletPaymentBadges'
import { useLang } from '../context/LangContext'
import { tr } from '../i18n'
import { MerchantRechargeFlowIcon } from '../components/MerchantWalletFlowIcons'

const MerchantWalletRecharge: React.FC = () => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const goBack = () => navigate('/wallet')

  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'USDT' | 'BTC' | 'ETH'>('USDT')
  const [network, setNetwork] = useState<'ETH' | 'BTC' | 'TRC20'>('TRC20')
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [screenshotUploading, setScreenshotUploading] = useState(false)
  const screenshotInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()
  const [tradePwdModalOpen, setTradePwdModalOpen] = useState(false)
  const [tradePwd, setTradePwd] = useState('')
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null)
  type PlatformPaymentConfig = {
    receiveAddress: string
    receiveQrUrl: string
    ethAddress?: string
    btcAddress?: string
    trc20Address?: string
    ethQrUrl?: string
    btcQrUrl?: string
    trc20QrUrl?: string
  }
  const [platformPayment, setPlatformPayment] = useState<PlatformPaymentConfig>({
    receiveAddress: '',
    receiveQrUrl: '',
  })

  useEffect(() => {
    api
      .get<PlatformPaymentConfig>('/api/platform-payment-config')
      .then((data) => {
        setPlatformPayment({
          receiveAddress: data.receiveAddress ?? '',
          receiveQrUrl: data.receiveQrUrl ?? '',
          ethAddress: data.ethAddress ?? '',
          btcAddress: data.btcAddress ?? '',
          trc20Address: data.trc20Address ?? '',
          ethQrUrl: data.ethQrUrl ?? '',
          btcQrUrl: data.btcQrUrl ?? '',
          trc20QrUrl: data.trc20QrUrl ?? '',
        })
      })
      .catch(() => {})
  }, [])

  const depositAddress = (() => {
    if (network === 'ETH') return platformPayment.ethAddress || platformPayment.receiveAddress
    if (network === 'BTC') return platformPayment.btcAddress || platformPayment.receiveAddress
    return platformPayment.trc20Address || platformPayment.receiveAddress
  })()

  const depositQrUrl = (() => {
    if (network === 'ETH') return platformPayment.ethQrUrl || platformPayment.receiveQrUrl
    if (network === 'BTC') return platformPayment.btcQrUrl || platformPayment.receiveQrUrl
    return platformPayment.trc20QrUrl || platformPayment.receiveQrUrl
  })()

  const tradePwdChars = tradePwd.padEnd(6, ' ').slice(0, 6).split('')
  const amountNum = parseFloat(amount)
  const isAmountFilled = amount.trim() !== '' && !Number.isNaN(amountNum) && amountNum > 0
  const submitDisabled = !isAmountFilled || !screenshotUrl
  const confirmPwdDisabled = tradePwd.length < 6

  const handleTradePwdChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const digit = raw.replace(/\D/g, '').slice(-1)
    setTradePwd((prev) => {
      const chars = prev.split('')
      chars[index] = digit
      return chars.join('').slice(0, 6)
    })
    if (digit && index < 5) {
      const next = e.target.nextElementSibling as HTMLInputElement | null
      next?.focus()
    }
  }

  const handleTradePwdKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Backspace') return
    e.preventDefault()
    const currentHasValue = !!tradePwdChars[index]?.trim()
    if (currentHasValue) {
      setTradePwd((prev) => {
        const chars = prev.split('')
        chars[index] = ''
        return chars.join('').slice(0, 6)
      })
      return
    }
    if (index > 0) {
      setTradePwd((prev) => {
        const chars = prev.split('')
        chars[index - 1] = ''
        return chars.join('').slice(0, 6)
      })
      const prevInput = e.currentTarget.previousElementSibling as HTMLInputElement | null
      prevInput?.focus()
    }
  }

  const handleCopyAddress = () => {
    if (!depositAddress) {
      showToast(tr(lang, { zh: '暂无收款地址', en: 'No deposit address', de: 'Keine Einzahlungsadresse' , ja: '入金アドレスがありません', ko: '입금 주소가 없습니다', es: 'Sin dirección de depósito', it: 'Nessun indirizzo di deposito', vi: 'Chưa có địa chỉ nhận tiền' }), 'error')
      return
    }
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(depositAddress)
        .then(() =>
          showToast(tr(lang, { zh: '复制成功', en: 'Copied', de: 'Kopiert' , ja: 'コピーしました', ko: '복사됨', es: 'Copiado', it: 'Copiato', vi: 'Đã sao chép' })),
        )
        .catch(() =>
          showToast(tr(lang, { zh: '复制失败', en: 'Copy failed', de: 'Kopieren fehlgeschlagen' , ja: 'コピーに失敗しました', ko: '복사 실패', es: 'Error al copiar', it: 'Copia non riuscita', vi: 'Sao chép thất bại' }), 'error'),
        )
    } else {
      showToast(tr(lang, { zh: '复制失败', en: 'Copy failed', de: 'Kopieren fehlgeschlagen' , ja: 'コピーに失敗しました', ko: '복사 실패', es: 'Error al copiar', it: 'Copia non riuscita', vi: 'Sao chép thất bại' }), 'error')
    }
  }

  const handleCopyQrcode = () => {
    const canvas = qrCanvasRef.current
    if (!canvas || typeof navigator === 'undefined' || !(navigator.clipboard as any)) {
      showToast(tr(lang, { zh: '复制失败', en: 'Copy failed', de: 'Kopieren fehlgeschlagen' , ja: 'コピーに失敗しました', ko: '복사 실패', es: 'Error al copiar', it: 'Copia non riuscita', vi: 'Sao chép thất bại' }), 'error')
      return
    }
    canvas.toBlob((blob) => {
      if (!blob) {
        showToast(tr(lang, { zh: '复制失败', en: 'Copy failed', de: 'Kopieren fehlgeschlagen' , ja: 'コピーに失敗しました', ko: '복사 실패', es: 'Error al copiar', it: 'Copia non riuscita', vi: 'Sao chép thất bại' }), 'error')
        return
      }
      const ClipboardItemCtor = (window as any).ClipboardItem
      if (!ClipboardItemCtor) {
        showToast(tr(lang, { zh: '复制失败', en: 'Copy failed', de: 'Kopieren fehlgeschlagen' , ja: 'コピーに失敗しました', ko: '복사 실패', es: 'Error al copiar', it: 'Copia non riuscita', vi: 'Sao chép thất bại' }), 'error')
        return
      }
      const item = new ClipboardItemCtor({ [blob.type]: blob })
      ;(navigator.clipboard as any)
        .write([item])
        .then(() =>
          showToast(tr(lang, { zh: '二维码已复制', en: 'QR code copied', de: 'QR-Code kopiert' , ja: 'QRコードをコピーしました', ko: 'QR 코드가 복사되었습니다', es: 'Código QR copiado', it: 'Codice QR copiato', vi: 'Đã sao chép mã QR' })),
        )
        .catch(() =>
          showToast(tr(lang, { zh: '复制失败', en: 'Copy failed', de: 'Kopieren fehlgeschlagen' , ja: 'コピーに失敗しました', ko: '복사 실패', es: 'Error al copiar', it: 'Copia non riuscita', vi: 'Sao chép thất bại' }), 'error'),
        )
    }, 'image/png')
  }

  useEffect(() => {
    if (depositQrUrl) return
    const canvas = qrCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = 160
    canvas.width = size
    canvas.height = size
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#000000'
    const block = 36
    const margin = 10
    const drawFinder = (x: number, y: number) => {
      ctx.fillRect(x, y, block, block)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + 4, y + 4, block - 8, block - 8)
      ctx.fillStyle = '#000000'
      ctx.fillRect(x + 10, y + 10, block - 20, block - 20)
    }
    drawFinder(margin, margin)
    drawFinder(size - margin - block, margin)
    drawFinder(margin, size - margin - block)
  }, [depositQrUrl])

  const handleConfirm = async () => {
    if (!isAmountFilled) return
    const amountValue = Number(amountNum)
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      showToast(
        tr(lang, { zh: '请输入正确的金额', en: 'Please enter a valid amount', de: 'Bitte gültigen Betrag eingeben' , ja: '正しい金額を入力してください', ko: '올바른 금액을 입력해 주세요', es: 'Introduzca un importe válido', it: 'Inserisci un importo valido', vi: 'Vui lòng nhập số tiền hợp lệ' }),
        'error',
      )
      return
    }
    if (!screenshotUrl) {
      showToast(
        tr(lang, { zh: '请上传交易截图', en: 'Please upload transaction screenshot', de: 'Bitte Transaktionsscreenshot hochladen' , ja: '取引スクリーンショットをアップロードしてください', ko: '거래 스크린샷을 업로드해 주세요', es: 'Suba una captura de la transacción', it: 'Carica lo screenshot della transazione', vi: 'Vui lòng tải lên ảnh chụp giao dịch' }),
        'error',
      )
      return
    }
    try {
      const raw = window.localStorage.getItem('authUser')
      if (!raw) {
        showToast(
          tr(lang, { zh: '请先登录店铺账号', en: 'Please log in to your shop account', de: 'Bitte melden Sie sich bei Ihrem Shop-Konto an' , ja: '先にショップアカウントにログインしてください', ko: '먼저 점포 계정에 로그인해 주세요', es: 'Inicie sesión en su cuenta de tienda', it: 'Accedi al tuo account negozio', vi: 'Vui lòng đăng nhập tài khoản cửa hàng' }),
          'error',
        )
        return
      }
      const auth = JSON.parse(raw) as { id?: string; shopId?: string }
      const userId = typeof auth.id === 'string' ? auth.id : ''
      const shopId = typeof auth.shopId === 'string' ? auth.shopId : ''
      if (!userId || !shopId) {
        showToast(
          tr(lang, { zh: '请先登录店铺账号', en: 'Please log in to your shop account', de: 'Bitte melden Sie sich bei Ihrem Shop-Konto an' , ja: '先にショップアカウントにログインしてください', ko: '먼저 점포 계정에 로그인해 주세요', es: 'Inicie sesión en su cuenta de tienda', it: 'Accedi al tuo account negozio', vi: 'Vui lòng đăng nhập tài khoản cửa hàng' }),
          'error',
        )
        return
      }

      await api.post(`/api/shops/${encodeURIComponent(shopId)}/recharge`, {
        userId,
        amount: amountValue,
        tradePassword: tradePwd,
        rechargeScreenshotUrl: screenshotUrl,
      })

      setTradePwdModalOpen(false)
      setTradePwd('')
      setAmount('')
      setScreenshotUrl(null)
      showToast(tr(lang, { zh: '提交成功', en: 'Submitted successfully', de: 'Erfolgreich eingereicht' , ja: '送信しました', ko: '제출 완료', es: 'Enviado correctamente', it: 'Inviato con successo', vi: 'Gửi thành công' }))
      navigate('/wallet')
    } catch (e) {
      const fallback =
        tr(lang, { zh: '提交失败', en: 'Submission failed', de: 'Einreichung fehlgeschlagen' , ja: '送信に失敗しました', ko: '제출 실패', es: 'Error al enviar', it: 'Invio non riuscito', vi: 'Gửi thất bại' })
      showToast(e instanceof Error ? e.message : fallback, 'error')
    }
  }

  return (
    <div className="merchant-wallet-form-page merchant-wallet-form-page--recharge merchant-wallet-form-page--v2">
      <section className="wallet-recharge merchant-wallet-recharge-inner">
        <header className="wallet-recharge-header merchant-wallet-recharge-header merchant-wallet-form-header--v2">
          <button
            type="button"
            className="merchant-wallet-form-back"
            aria-label={tr(lang, { zh: '返回', en: 'Back', de: 'Zurück' , ja: '戻る', ko: '뒤로', es: 'Volver', it: 'Indietro', vi: 'Quay lại' })}
            onClick={goBack}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="merchant-wallet-form-header-main">
            <span className="merchant-wallet-form-header-icon" aria-hidden="true">
              <MerchantRechargeFlowIcon size={32} />
            </span>
            <div>
              <h1 className="wallet-recharge-title merchant-wallet-form-title">
                {tr(lang, { zh: '充值', en: 'Recharge', de: 'Aufladung' , ja: '入金', ko: '충전', es: 'Depositar', it: 'Ricarica', vi: 'Nạp tiền' })}
              </h1>
              <p className="merchant-wallet-form-subtitle">
                {tr(lang, { zh: '向店铺钱包转入 USDT', en: 'Add USDT to your shop wallet', de: 'USDT zur Shop-Wallet hinzufügen' , ja: 'ショップウォレットにUSDTを入金', ko: '점포 지갑에 USDT 입금', es: 'Añada USDT a la cartera de su tienda', it: 'Aggiungi USDT al portafoglio del negozio', vi: 'Nạp USDT vào ví cửa hàng' })}
              </p>
            </div>
          </div>
        </header>

        <div className="wallet-recharge-form merchant-wallet-recharge-form">
          <div className="merchant-wallet-recharge-grid">
            <div className="wallet-recharge-field">
              <label className="wallet-recharge-label">
                {tr(lang, { zh: '充值币种', en: 'Top‑up currency', de: 'Aufladewährung' , ja: '入金通貨', ko: '충전 통화', es: 'Moneda de depósito', it: 'Valuta di ricarica', vi: 'Loại tiền nạp' })}
              </label>
              <div className="wallet-recharge-select-wrap">
                <select
                  className="wallet-recharge-select"
                  value={currency}
                  onChange={(e) => {
                    const v = e.target.value as 'USDT' | 'BTC' | 'ETH'
                    setCurrency(v)
                    if (v === 'BTC') setNetwork('BTC')
                    else if (v === 'ETH') setNetwork('ETH')
                    else setNetwork('TRC20')
                  }}
                >
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
                <span className="wallet-recharge-select-caret" aria-hidden>▾</span>
              </div>
            </div>
            <div className="wallet-recharge-field">
              <label className="wallet-recharge-label">
                {tr(lang, { zh: '区块链网络', en: 'Blockchain network', de: 'Blockchain-Netzwerk' , ja: 'ブロックチェーンネットワーク', ko: '블록체인 네트워크', es: 'Red blockchain', it: 'Rete blockchain', vi: 'Mạng blockchain' })}
              </label>
              <div className="wallet-recharge-select-wrap">
                <select
                  className="wallet-recharge-select"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value as 'ETH' | 'BTC' | 'TRC20')}
                >
                  <option value="ETH">{tr(lang, { zh: 'ETH 网络', en: 'ETH network', de: 'ETH-Netzwerk' , ja: 'ETHネットワーク', ko: 'ETH 네트워크', es: 'Red ETH', it: 'Rete ETH', vi: 'Mạng ETH' })}</option>
                  <option value="BTC">{tr(lang, { zh: 'BTC 网络', en: 'BTC network', de: 'BTC-Netzwerk' , ja: 'BTCネットワーク', ko: 'BTC 네트워크', es: 'Red BTC', it: 'Rete BTC', vi: 'Mạng BTC' })}</option>
                  <option value="TRC20">{tr(lang, { zh: 'USDT‑TRC20 网络', en: 'USDT‑TRC20 network', de: 'USDT-TRC20-Netzwerk' , ja: 'USDT-TRC20ネットワーク', ko: 'USDT-TRC20 네트워크', es: 'Red USDT-TRC20', it: 'Rete USDT-TRC20', vi: 'Mạng USDT-TRC20' })}</option>
                </select>
                <span className="wallet-recharge-select-caret" aria-hidden>▾</span>
              </div>
            </div>
            <div className="wallet-recharge-field merchant-wallet-recharge-qr-cell">
              <label className="wallet-recharge-label">
                {tr(lang, { zh: '充值二维码', en: 'Recharge QR code', de: 'Auflade-QR-Code' , ja: '入金QRコード', ko: '충전 QR 코드', es: 'Código QR de depósito', it: 'Codice QR di ricarica', vi: 'Mã QR nạp tiền' })}
              </label>
              <div className="wallet-recharge-qrcode-row">
                <div className="wallet-recharge-qrcode-box">
                  {depositQrUrl ? (
                    <img src={depositQrUrl} alt="" className="wallet-recharge-qrcode-placeholder wallet-recharge-qrcode-img" />
                  ) : (
                    <canvas ref={qrCanvasRef} className="wallet-recharge-qrcode-placeholder" aria-hidden="true" />
                  )}
                </div>
                {!depositQrUrl && (
                  <button
                    type="button"
                    className="wallet-recharge-qrcode-save-btn"
                    onClick={handleCopyQrcode}
                  >
                    {tr(lang, { zh: '保存二维码', en: 'Save QR code', de: 'QR-Code speichern' , ja: 'QRコードを保存', ko: 'QR 코드 저장', es: 'Guardar código QR', it: 'Salva codice QR', vi: 'Lưu mã QR' })}
                  </button>
                )}
              </div>
            </div>
            <div className="wallet-recharge-field merchant-wallet-recharge-amount-cell">
              <label className="wallet-recharge-label">
                <span className="wallet-recharge-required">*</span>
                {tr(lang, { zh: '数量', en: 'Amount', de: 'Amount' , ja: '数量', ko: '수량', es: 'Cantidad', it: 'Importo', vi: 'Số tiền' })}
              </label>
              <input
                className="wallet-recharge-input wallet-recharge-input--short"
                placeholder={
                  tr(lang, { zh: '请输入充值金额', en: 'Please enter the recharge amount', de: 'Bitte Aufladebetrag eingeben' , ja: '入金金額を入力してください', ko: '충전 금액을 입력해 주세요', es: 'Introduzca el importe del depósito', it: 'Inserisci l\'importo della ricarica', vi: 'Vui lòng nhập số tiền nạp' })
                }
                value={amount}
                onChange={(e) => {
                  let v = e.target.value.replace(/[^\d.]/g, '')
                  const parts = v.split('.')
                  if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
                  setAmount(v)
                }}
              />
            </div>
            <div className="wallet-recharge-field merchant-wallet-recharge-address-cell">
              <label className="wallet-recharge-label">
                {tr(lang, { zh: '充值地址', en: 'Deposit address', de: 'Einzahlungsadresse' , ja: '入金アドレス', ko: '충전 주소', es: 'Dirección de depósito', it: 'Indirizzo di deposito', vi: 'Địa chỉ nạp tiền' })}
              </label>
              <div className="wallet-recharge-address-row">
                <input className="wallet-recharge-address-input" value={depositAddress || (tr(lang, { zh: '暂无收款地址', en: 'No deposit address', de: 'Keine Einzahlungsadresse' , ja: '入金アドレスがありません', ko: '입금 주소가 없습니다', es: 'Sin dirección de depósito', it: 'Nessun indirizzo di deposito', vi: 'Chưa có địa chỉ nhận tiền' }))} readOnly />
                <button
                  type="button"
                  className="wallet-recharge-copy-btn"
                  onClick={handleCopyAddress}
                >
                  {tr(lang, { zh: '复制', en: 'Copy', de: 'Kopieren' , ja: 'コピー', ko: '복사', es: 'Copiar', it: 'Copia', vi: 'Sao chép' })}
                </button>
              </div>
            </div>
            <div className="wallet-recharge-field merchant-wallet-recharge-tx-cell">
              <label className="wallet-recharge-label">
                <span className="wallet-recharge-required">*</span>
                {tr(lang, { zh: '交易截图', en: 'Transaction screenshot', de: 'Transaktionsscreenshot' , ja: '取引スクリーンショット', ko: '거래 스크린샷', es: 'Captura de transacción', it: 'Screenshot della transazione', vi: 'Ảnh chụp giao dịch' })}
              </label>
              <input
                ref={screenshotInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="wallet-recharge-upload-input"
                aria-label={tr(lang, { zh: '上传交易截图', en: 'Upload transaction screenshot', de: 'Transaktionsscreenshot hochladen' , ja: '取引スクリーンショットをアップロード', ko: '거래 스크린샷 업로드', es: 'Subir captura de transacción', it: 'Carica screenshot della transazione', vi: 'Tải lên ảnh chụp giao dịch' })}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setScreenshotUploading(true)
                  try {
                    const { url } = await api.uploadImage(file)
                    setScreenshotUrl(url)
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : (tr(lang, { zh: '上传失败', en: 'Upload failed', de: 'Upload fehlgeschlagen' , ja: 'アップロードに失敗しました', ko: '업로드 실패', es: 'Error al subir', it: 'Caricamento non riuscito', vi: 'Tải lên thất bại' })), 'error')
                  } finally {
                    setScreenshotUploading(false)
                    e.target.value = ''
                  }
                }}
              />
              <div
                className="wallet-recharge-screenshot-area"
                onClick={() => !screenshotUploading && screenshotInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && screenshotInputRef.current?.click()}
                aria-label={tr(lang, { zh: '上传交易截图', en: 'Upload transaction screenshot', de: 'Transaktionsscreenshot hochladen' , ja: '取引スクリーンショットをアップロード', ko: '거래 스크린샷 업로드', es: 'Subir captura de transacción', it: 'Carica screenshot della transazione', vi: 'Tải lên ảnh chụp giao dịch' })}
              >
                {screenshotUploading ? (
                  <span className="wallet-recharge-screenshot-loading">{tr(lang, { zh: '上传中…', en: 'Uploading…', de: 'Wird hochgeladen…' , ja: 'アップロード中…', ko: '업로드 중…', es: 'Subiendo…', it: 'Caricamento…', vi: 'Đang tải lên…' })}</span>
                ) : screenshotUrl ? (
                  <>
                    <img src={screenshotUrl} alt="" className="wallet-recharge-screenshot-preview" />
                    <span className="wallet-recharge-screenshot-label">{tr(lang, { zh: '点击可重新上传', en: 'Click to replace', de: 'Klicken zum Ersetzen' , ja: 'クリックして差し替え', ko: '클릭하여 다시 업로드', es: 'Haga clic para reemplazar', it: 'Clicca per sostituire', vi: 'Nhấn để thay thế' })}</span>
                  </>
                ) : (
                  <>
                    <svg className="wallet-recharge-screenshot-camera" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span className="wallet-recharge-screenshot-text">{tr(lang, { zh: '点击上传', en: 'Click to upload', de: 'Klicken zum Hochladen' , ja: 'クリックしてアップロード', ko: '클릭하여 업로드', es: 'Haga clic para subir', it: 'Clicca per caricare', vi: 'Nhấn để tải lên' })}</span>
                  </>
                )}
              </div>
            </div>
            <div className="wallet-recharge-field merchant-wallet-recharge-submit-cell">
              <button
                type="button"
                className="wallet-recharge-submit"
                disabled={submitDisabled}
                onClick={() => setTradePwdModalOpen(true)}
              >
                {tr(lang, { zh: '确定', en: 'Confirm', de: 'Bestätigen' , ja: '確定', ko: '확인', es: 'Confirmar', it: 'Conferma', vi: 'Xác nhận' })}
              </button>
            </div>
          </div>
        </div>
        <WalletPaymentBadges />

        {tradePwdModalOpen && (
          <div className="account-tradepwd-overlay" role="dialog" aria-modal="true" aria-labelledby="merchant-wallet-recharge-tradepwd-title" onClick={() => setTradePwdModalOpen(false)}>
            <div className="account-tradepwd-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="account-tradepwd-close"
                aria-label={tr(lang, { zh: '关闭', en: 'Close', de: 'Schließen' , ja: '閉じる', ko: '닫기', es: 'Cerrar', it: 'Chiudi', vi: 'Đóng' })}
                onClick={() => setTradePwdModalOpen(false)}
              >
                ×
              </button>
              <h2
                id="merchant-wallet-recharge-tradepwd-title"
                className="account-tradepwd-title"
              >
                {tr(lang, { zh: '输入交易密码', en: 'Enter payment PIN', de: 'Zahlungs-PIN eingeben' , ja: '取引パスワードを入力', ko: '거래 비밀번호 입력', es: 'Introduzca el PIN de pago', it: 'Inserisci PIN di pagamento', vi: 'Nhập mã PIN giao dịch' })}
              </h2>
              <p className="account-tradepwd-subtitle">
                {tr(lang, { zh: '请输入交易密码', en: 'Please enter your payment PIN', de: 'Bitte geben Sie Ihre Zahlungs-PIN ein' , ja: '取引パスワードを入力してください', ko: '거래 비밀번호를 입력해 주세요', es: 'Introduzca su PIN de pago', it: 'Inserisci il PIN di pagamento', vi: 'Vui lòng nhập mã PIN giao dịch' })}
              </p>
              <div className="account-tradepwd-inputs">
                {tradePwdChars.map((ch, idx) => (
                  <input key={idx} type="password" inputMode="numeric" maxLength={1} className="account-tradepwd-input" value={ch.trim()} onChange={(e) => handleTradePwdChange(idx, e)} onKeyDown={(e) => handleTradePwdKeyDown(idx, e)} />
                ))}
              </div>
              <button
                type="button"
                className="account-tradepwd-confirm"
                disabled={confirmPwdDisabled}
                onClick={handleConfirm}
              >
                {tr(lang, { zh: '确认密码', en: 'Confirm PIN', de: 'PIN bestätigen' , ja: 'パスワードを確認', ko: '비밀번호 확인', es: 'Confirmar PIN', it: 'Conferma PIN', vi: 'Xác nhận mã PIN' })}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default MerchantWalletRecharge
