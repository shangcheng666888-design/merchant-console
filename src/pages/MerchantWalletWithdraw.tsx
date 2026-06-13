import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/ToastProvider'
import { api } from '../api/client'
import { useMerchantSync } from '../hooks/useMerchantSync'
import WalletPaymentBadges from '../components/WalletPaymentBadges'
import { useLang } from '../context/LangContext'
import { MerchantWithdrawFlowIcon } from '../components/MerchantWalletFlowIcons'
import { tr } from '../i18n'

type WithdrawNetwork = 'TRC20' | 'ERC20'

const MerchantWalletWithdraw: React.FC = () => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const goBack = () => navigate('/wallet')

  const [network, setNetwork] = useState<WithdrawNetwork>('TRC20')
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState(0)
  const { showToast } = useToast()
  const [tradePwdModalOpen, setTradePwdModalOpen] = useState(false)
  const [tradePwd, setTradePwd] = useState('')

  const fetchBalance = useCallback(async () => {
    try {
      const raw = window.localStorage.getItem('authUser')
      if (!raw) return
      const auth = JSON.parse(raw) as { shopId?: string }
      const shopId = typeof auth.shopId === 'string' ? auth.shopId : ''
      if (!shopId) return
      const res = await api.get<{ list: Array<{ id: string; walletBalance?: number }> }>(
        `/api/shops?shop=${encodeURIComponent(shopId)}`,
      )
      const next = Number(res.list?.[0]?.walletBalance ?? 0)
      setBalance(Number.isFinite(next) ? next : 0)
    } catch {
      setBalance(0)
    }
  }, [])

  useEffect(() => {
    void fetchBalance()
  }, [fetchBalance])

  useMerchantSync(['wallet', 'all'], () => {
    void fetchBalance()
  }, { immediate: false })

  const amountNum = parseFloat(amount)
  const isAmountFilled = amount.trim() !== '' && !Number.isNaN(amountNum) && amountNum > 0
  const submitDisabled = !address.trim() || !isAmountFilled
  const confirmPwdDisabled = tradePwd.length < 6

  const tradePwdChars = tradePwd.padEnd(6, ' ').slice(0, 6).split('')

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^\d.]/g, '')
    const parts = v.split('.')
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
    const num = parseFloat(v)
    if (!Number.isNaN(num) && num > balance) {
      setAmount(balance === 0 ? '0' : balance.toFixed(2))
      return
    }
    setAmount(v)
  }

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
      const prev = e.currentTarget.previousElementSibling as HTMLInputElement | null
      prev?.focus()
    }
  }

  const addressPlaceholder =
    network === 'ERC20'
      ? tr(lang, {
          zh: '请输入 ERC20 地址（0x 开头）',
          en: 'ERC20 address (starts with 0x)',
          de: 'ERC20-Adresse (beginnt mit 0x)',
          ja: 'ERC20アドレス（0xで始まる）', ko: 'ERC20 주소를 입력하세요 (0x로 시작)',
 es: 'Dirección ERC20 (empieza por 0x)', it: 'Indirizzo ERC20 (inizia con 0x)', vi: 'Địa chỉ ERC20 (bắt đầu bằng 0x)'
        })
      : tr(lang, {
          zh: '请输入 TRC20 地址（T 开头）',
          en: 'TRC20 address (starts with T)',
          de: 'TRC20-Adresse (beginnt mit T)',
          ja: 'TRC20アドレス（Tで始まる）', ko: 'TRC20 주소를 입력하세요 (T로 시작)',
 es: 'Dirección TRC20 (empieza por T)', it: 'Indirizzo TRC20 (inizia con T)', vi: 'Địa chỉ TRC20 (bắt đầu bằng T)'
        })

  return (
    <div className="merchant-wallet-form-page merchant-wallet-form-page--withdraw merchant-wallet-form-page--v2">
      <section className="wallet-withdraw merchant-wallet-withdraw-inner">
        <header className="wallet-recharge-header merchant-wallet-withdraw-header merchant-wallet-form-header--v2">
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
              <MerchantWithdrawFlowIcon size={32} />
            </span>
            <div>
              <h1 className="wallet-recharge-title merchant-wallet-form-title">
                {tr(lang, { zh: '提现', en: 'Withdraw', de: 'Auszahlung' , ja: '出金', ko: '출금', es: 'Retirar', it: 'Preleva', vi: 'Rút tiền' })}
              </h1>
              <p className="merchant-wallet-form-subtitle">
                {tr(lang, {
                  zh: '从店铺钱包转出 USDT',
                  en: 'Withdraw USDT from your shop wallet',
                  de: 'USDT aus Ihrer Shop-Wallet abheben',
                  ja: 'ショップウォレットからUSDTを出金', ko: '점포 지갑에서 USDT 출금',
 es: 'Retire USDT de la cartera de su tienda', it: 'Preleva USDT dal portafoglio del negozio', vi: 'Rút USDT từ ví cửa hàng'
                })}
              </p>
            </div>
          </div>
        </header>

        <div className="wallet-recharge-form merchant-wallet-withdraw-form">
          <div className="merchant-wallet-withdraw-grid">
            <div className="wallet-recharge-field">
              <label className="wallet-recharge-label">
                {tr(lang, { zh: '提现方式', en: 'Withdrawal method', de: 'Auszahlungsmethode' , ja: '出金方法', ko: '출금 방식', es: 'Método de retiro', it: 'Metodo di prelievo', vi: 'Phương thức rút tiền' })}
              </label>
              <div className="wallet-withdraw-method">
                {tr(lang, { zh: '加密货币', en: 'Cryptocurrency', de: 'Kryptowährung' , ja: '暗号資産', ko: '암호화폐', es: 'Criptomoneda', it: 'Criptovaluta', vi: 'Tiền mã hóa' })}
              </div>
            </div>
            <div className="wallet-recharge-field">
              <label className="wallet-recharge-label">
                {tr(lang, { zh: '币种协议', en: 'Currency / protocol', de: 'Währung / Protokoll' , ja: '通貨 / プロトコル', ko: '통화 / 프로토콜', es: 'Moneda / protocolo', it: 'Valuta / protocollo', vi: 'Loại tiền / giao thức' })}
              </label>
              <div className="wallet-recharge-select-wrap">
                <select className="wallet-recharge-select" defaultValue="USDT">
                  <option value="USDT">USDT</option>
                </select>
                <span className="wallet-recharge-select-caret" aria-hidden>▾</span>
              </div>
            </div>
            <div className="wallet-recharge-field">
              <label className="wallet-recharge-label">
                {tr(lang, { zh: '区块链网络', en: 'Blockchain network', de: 'Blockchain-Netzwerk' , ja: 'ブロックチェーンネットワーク', ko: '블록체인 네트워크', es: 'Red blockchain', it: 'Rete blockchain', vi: 'Mạng blockchain' })}
              </label>
              <div
                className="wallet-withdraw-network-row"
                role="group"
                aria-label={tr(lang, { zh: '区块链网络', en: 'Blockchain network', de: 'Blockchain-Netzwerk' , ja: 'ブロックチェーンネットワーク', ko: '블록체인 네트워크', es: 'Red blockchain', it: 'Rete blockchain', vi: 'Mạng blockchain' })}
              >
                {(['TRC20', 'ERC20'] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`wallet-withdraw-network-btn${network === n ? ' wallet-withdraw-network-btn--active' : ''}`}
                    aria-pressed={network === n}
                    onClick={() => setNetwork(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="wallet-recharge-field merchant-wallet-withdraw-balance-cell">
              <label className="wallet-recharge-label">
                {tr(lang, { zh: '当前余额', en: 'Current balance', de: 'Aktuelles Guthaben' , ja: '現在の残高', ko: '현재 잔액', es: 'Saldo actual', it: 'Saldo attuale', vi: 'Số dư hiện tại' })}
              </label>
              <div className="wallet-withdraw-balance-inner">
                {balance.toFixed(2)} USDT
              </div>
            </div>
            <div className="wallet-recharge-field merchant-wallet-withdraw-address-cell">
              <label className="wallet-recharge-label">
                <span className="wallet-recharge-required">*</span>
                {tr(lang, { zh: '提现地址', en: 'Withdrawal address', de: 'Auszahlungsadresse' , ja: '出金アドレス', ko: '출금 주소', es: 'Dirección de retiro', it: 'Indirizzo di prelievo', vi: 'Địa chỉ rút tiền' })}
              </label>
              <div className="wallet-recharge-address-row wallet-withdraw-address-row">
                <input
                  className="wallet-recharge-address-input"
                  placeholder={addressPlaceholder}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="wallet-recharge-field merchant-wallet-withdraw-amount-cell">
              <label className="wallet-recharge-label">
                <span className="wallet-recharge-required">*</span>
                {tr(lang, { zh: '数量', en: 'Amount', de: 'Betrag' , ja: '数量', ko: '수량', es: 'Cantidad', it: 'Importo', vi: 'Số tiền' })}
              </label>
              <input
                className="wallet-recharge-input wallet-recharge-input--short"
                placeholder={tr(lang, { zh: '请输入', en: 'Please enter', de: 'Bitte eingeben' , ja: '入力してください', ko: '입력해 주세요', es: 'Introduzca un valor', it: 'Inserisci un valore', vi: 'Vui lòng nhập' })}
                value={amount}
                onChange={handleAmountChange}
              />
            </div>
            <div className="wallet-recharge-field merchant-wallet-withdraw-actual-cell">
              <label className="wallet-recharge-label">
                {tr(lang, { zh: '实际到账', en: 'Actual received', de: 'Tatsächlich erhalten' , ja: '実際の入金額', ko: '실제 입금액', es: 'Importe neto recibido', it: 'Importo netto ricevuto', vi: 'Thực nhận' })}
              </label>
              <div className="wallet-withdraw-actual-value">
                {amount ? Number(amount || 0).toFixed(2) : '0.00'} USDT
                {tr(lang, { zh: '（手续费 0.00%）', en: ' (Fee 0.00%)', de: ' (Gebühr 0,00 %)' , ja: '（手数料 0.00%）', ko: ' (수수료 0.00%)', es: ' (Comisión 0,00 %)', it: ' (Commissione 0,00 %)', vi: ' (Phí 0,00%)' })}
              </div>
            </div>
            <div className="wallet-recharge-field merchant-wallet-withdraw-submit-cell">
              <button
                type="button"
                className="wallet-recharge-submit"
                disabled={submitDisabled}
                onClick={() => {
                  if (amountNum > balance) {
                    showToast(
                      tr(lang, {
                        zh: '提现数量不得超出当前余额',
                        en: 'Withdrawal amount cannot exceed current balance',
                        de: 'Auszahlungsbetrag darf das Guthaben nicht überschreiten',
                        ja: '出金額は現在の残高を超えることはできません', ko: '출금 금액은 현재 잔액을 초과할 수 없습니다',
 es: 'El importe de retiro no puede superar el saldo actual', it: 'L\'importo del prelievo non può superare il saldo attuale', vi: 'Số tiền rút không được vượt quá số dư hiện tại'
                      }),
                      'error',
                    )
                    return
                  }
                  setTradePwdModalOpen(true)
                }}
              >
                {tr(lang, { zh: '确定', en: 'Confirm', de: 'Bestätigen' , ja: '確定', ko: '확인', es: 'Confirmar', it: 'Conferma', vi: 'Xác nhận' })}
              </button>
            </div>
          </div>
        </div>
        <WalletPaymentBadges />
      </section>

      {tradePwdModalOpen && (
        <div
          className="account-tradepwd-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="merchant-wallet-withdraw-tradepwd-title"
          onClick={() => setTradePwdModalOpen(false)}
        >
          <div
            className="account-tradepwd-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="account-tradepwd-close"
              aria-label={tr(lang, { zh: '关闭', en: 'Close', de: 'Schließen' , ja: '閉じる', ko: '닫기', es: 'Cerrar', it: 'Chiudi', vi: 'Đóng' })}
              onClick={() => setTradePwdModalOpen(false)}
            >
              ×
            </button>
            <h2 id="merchant-wallet-withdraw-tradepwd-title" className="account-tradepwd-title">
              {tr(lang, { zh: '输入交易密码', en: 'Enter payment PIN', de: 'Zahlungs-PIN eingeben' , ja: '取引パスワードを入力', ko: '거래 비밀번호 입력', es: 'Introduzca el PIN de pago', it: 'Inserisci PIN di pagamento', vi: 'Nhập mã PIN giao dịch' })}
            </h2>
            <p className="account-tradepwd-subtitle">
              {tr(lang, {
                zh: '请输入交易密码',
                en: 'Please enter your payment PIN',
                de: 'Bitte geben Sie Ihre Zahlungs-PIN ein',
                ja: '取引パスワードを入力してください', ko: '거래 비밀번호를 입력해 주세요',
 es: 'Introduzca su PIN de pago', it: 'Inserisci il PIN di pagamento', vi: 'Vui lòng nhập mã PIN giao dịch'
              })}
            </p>
            <div className="account-tradepwd-inputs">
              {tradePwdChars.map((ch, idx) => (
                <input
                  key={idx}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  className="account-tradepwd-input"
                  value={ch.trim()}
                  onChange={(e) => handleTradePwdChange(idx, e)}
                  onKeyDown={(e) => handleTradePwdKeyDown(idx, e)}
                />
              ))}
            </div>
            <button
              type="button"
              className="account-tradepwd-confirm"
              disabled={confirmPwdDisabled}
              onClick={() => {
                if (amountNum > balance) {
                  showToast(
                    tr(lang, {
                      zh: '提现数量不得超出当前余额',
                      en: 'Withdrawal amount cannot exceed current balance',
                      de: 'Auszahlungsbetrag darf das Guthaben nicht überschreiten',
                      ja: '出金額は現在の残高を超えることはできません', ko: '출금 금액은 현재 잔액을 초과할 수 없습니다',
 es: 'El importe de retiro no puede superar el saldo actual', it: 'L\'importo del prelievo non può superare il saldo attuale', vi: 'Số tiền rút không được vượt quá số dư hiện tại'
                    }),
                    'error',
                  )
                  return
                }
                const submit = async () => {
                  try {
                    const raw = window.localStorage.getItem('authUser')
                    if (!raw) {
                      showToast(
                        tr(lang, {
                          zh: '请先登录店铺账号',
                          en: 'Please log in to your shop account',
                          de: 'Bitte melden Sie sich bei Ihrem Shop-Konto an',
                          ja: '先にショップアカウントにログインしてください', ko: '먼저 점포 계정에 로그인해 주세요',
 es: 'Inicie sesión en su cuenta de tienda', it: 'Accedi al tuo account negozio', vi: 'Vui lòng đăng nhập tài khoản cửa hàng'
                        }),
                        'error',
                      )
                      return
                    }
                    const auth = JSON.parse(raw) as { id?: string; shopId?: string }
                    const userId = typeof auth.id === 'string' ? auth.id : ''
                    const shopId = typeof auth.shopId === 'string' ? auth.shopId : ''
                    if (!userId || !shopId) {
                      showToast(
                        tr(lang, {
                          zh: '请先登录店铺账号',
                          en: 'Please log in to your shop account',
                          de: 'Bitte melden Sie sich bei Ihrem Shop-Konto an',
                          ja: '先にショップアカウントにログインしてください', ko: '먼저 점포 계정에 로그인해 주세요',
 es: 'Inicie sesión en su cuenta de tienda', it: 'Accedi al tuo account negozio', vi: 'Vui lòng đăng nhập tài khoản cửa hàng'
                        }),
                        'error',
                      )
                      return
                    }

                    await api.post(`/api/shops/${encodeURIComponent(shopId)}/withdraw`, {
                      userId,
                      amount: Number(amountNum),
                      tradePassword: tradePwd,
                      address: address.trim(),
                      network,
                    })

                    setTradePwdModalOpen(false)
                    setTradePwd('')
                    setAmount('')
                    setAddress('')
                    showToast(
                      tr(lang, { zh: '提交成功', en: 'Submitted successfully', de: 'Erfolgreich eingereicht' , ja: '送信しました', ko: '제출 완료', es: 'Enviado correctamente', it: 'Inviato con successo', vi: 'Gửi thành công' }),
                    )
                    navigate('/wallet')
                  } catch (e) {
                    const fallback = tr(lang, {
                      zh: '提交失败',
                      en: 'Submission failed',
                      de: 'Einreichung fehlgeschlagen',
                      ja: '送信に失敗しました', ko: '제출 실패',
 es: 'Error al enviar', it: 'Invio non riuscito', vi: 'Gửi thất bại'
                    })
                    showToast(e instanceof Error ? e.message : fallback, 'error')
                  }
                }
                void submit()
              }}
            >
              {tr(lang, { zh: '确认密码', en: 'Confirm PIN', de: 'PIN bestätigen' , ja: 'パスワードを確認', ko: '비밀번호 확인', es: 'Confirmar PIN', it: 'Conferma PIN', vi: 'Xác nhận mã PIN' })}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MerchantWalletWithdraw
