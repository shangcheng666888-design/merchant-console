import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import {
  MerchantRechargeFlowIcon,
  MerchantWithdrawFlowIcon,
} from '../components/MerchantWalletFlowIcons'
import { MerchantSidebarNavIcon } from '../components/MerchantSidebarNavIcon'
import { useToast } from '../components/ToastProvider'
import { useMerchantSync } from '../hooks/useMerchantSync'
import {
  formatRecordDate,
  getStatusText,
  type WalletRechargeRecord,
  type WalletWithdrawRecord,
} from '../utils/walletRecords'
import { useLang } from '../context/LangContext'
import { tr } from '../i18n'

type HistoryTab = 'recharge' | 'withdraw'
type RecordStatus = WalletRechargeRecord['status']

function readAuth(): { userId: string; shopId: string } | null {
  try {
    const raw = window.localStorage.getItem('authUser')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id?: string; shopId?: string }
    const userId = typeof parsed.id === 'string' ? parsed.id : ''
    const shopId = typeof parsed.shopId === 'string' ? parsed.shopId : ''
    if (!userId || !shopId) return null
    return { userId, shopId }
  } catch {
    return null
  }
}

function truncateMiddle(value: string, head = 8, tail = 6): string {
  if (!value || value.length <= head + tail + 3) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}

function formatProtocol(protocol?: string, currency = 'USDT'): string {
  if (!protocol) return `${currency}/TRC20`
  return protocol.replace('USDT-', 'USDT/')
}

const WalletStatSkeleton: React.FC = () => (
  <div className="merchant-wallet-stat merchant-wallet-stat--skeleton" aria-hidden="true">
    <span className="merchant-wallet-skeleton-block merchant-wallet-skeleton-stat-label" />
    <span className="merchant-wallet-skeleton-block merchant-wallet-skeleton-stat-value" />
  </div>
)

const WalletRowSkeleton: React.FC = () => (
  <article className="merchant-wallet-row merchant-wallet-row--skeleton" aria-hidden="true">
    <div className="merchant-wallet-row-top">
      <span className="merchant-wallet-skeleton-block merchant-wallet-skeleton-chip" />
      <span className="merchant-wallet-skeleton-block merchant-wallet-skeleton-date" />
    </div>
    <div className="merchant-wallet-row-amount-row">
      <span className="merchant-wallet-skeleton-block merchant-wallet-skeleton-amount" />
      <span className="merchant-wallet-skeleton-block merchant-wallet-skeleton-side" />
    </div>
    <span className="merchant-wallet-skeleton-block merchant-wallet-skeleton-order" />
  </article>
)

const MerchantWallet: React.FC = () => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [walletHistoryTab, setWalletHistoryTab] = useState<HistoryTab>('recharge')
  const [rechargeRecords, setRechargeRecords] = useState<WalletRechargeRecord[]>([])
  const [withdrawRecords, setWithdrawRecords] = useState<WalletWithdrawRecord[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)
  const loadCache = useCallback((shopId: string) => {
    try {
      const raw = window.localStorage.getItem(`merchantWallet:${shopId}`)
      if (!raw) return false
      const cached = JSON.parse(raw) as {
        walletBalance?: number
        rechargeRecords?: WalletRechargeRecord[]
        withdrawRecords?: WalletWithdrawRecord[]
      }
      if (typeof cached.walletBalance === 'number') setWalletBalance(cached.walletBalance)
      if (Array.isArray(cached.rechargeRecords)) setRechargeRecords(cached.rechargeRecords)
      if (Array.isArray(cached.withdrawRecords)) setWithdrawRecords(cached.withdrawRecords)
      return true
    } catch {
      return false
    }
  }, [])

  const fetchWallet = useCallback(async (silent = true) => {
    if (fetchingRef.current) return

    const auth = readAuth()
    if (!auth) {
      if (!silent) {
        setError(tr(lang, { zh: '未找到店铺信息，请重新登录', en: 'Shop not found. Please sign in again.', de: 'Shop nicht gefunden. Bitte erneut anmelden.', ja: '店舗情報が見つかりません。再度ログインしてください。', ko: '점포 정보를 찾을 수 없습니다. 다시 로그인해 주세요.', es: 'Tienda no encontrada. Vuelva a iniciar sesión.', it: 'Negozio non trovato. Accedi di nuovo.', vi: 'Không tìm thấy cửa hàng. Vui lòng đăng nhập lại.', fr: 'Boutique introuvable. Veuillez vous reconnecter.' }))
        setWalletBalance(0)
        setRechargeRecords([])
        setWithdrawRecords([])
      }
      return
    }

    const cacheKey = `merchantWallet:${auth.shopId}`

    fetchingRef.current = true
    try {
      if (!silent) setLoading(true)

      let depositAddr = ''
      try {
        const configRes = await api.get<{ receiveAddress: string }>('/api/platform-payment-config')
        depositAddr = configRes.receiveAddress ?? ''
      } catch {
        // ignore
      }

      let nextBalance = 0
      try {
        const shopRes = await api.get<{
          list: Array<{ id: string; walletBalance?: number }>
        }>(`/api/shops?shop=${encodeURIComponent(auth.shopId)}`)
        nextBalance = Number(shopRes.list?.[0]?.walletBalance ?? 0)
        if (!Number.isFinite(nextBalance)) nextBalance = 0
        setWalletBalance(nextBalance)
      } catch {
        setWalletBalance(0)
      }

      const res = await api.get<{
        list: Array<{
          id: number
          orderNo?: string
          type: 'recharge' | 'withdraw'
          amount: number
          status: RecordStatus
          createdAt: string
          rechargeTxNo?: string | null
          rechargeScreenshotUrl?: string | null
          withdrawAddress?: string | null
          withdrawNetwork?: string | null
        }>
      }>(
        `/api/shops/${encodeURIComponent(auth.shopId)}/fund-applications?userId=${encodeURIComponent(auth.userId)}&pageSize=100`,
      )

      const list = res.list ?? []
      const recharges: WalletRechargeRecord[] = list
        .filter((x) => x.type === 'recharge')
        .map((r) => ({
          id: String(r.id),
          createdAt: r.createdAt,
          orderNo: r.orderNo ?? `SRCH${String(r.id).padStart(8, '0')}`,
          amount: String(Number(r.amount ?? 0).toFixed(2)),
          currency: 'USDT',
          protocol: 'USDT-TRC20',
          status: r.status,
          transactionNo: r.rechargeTxNo ?? undefined,
          rechargeScreenshotUrl: r.rechargeScreenshotUrl ?? null,
          actualAmount: r.status === 'approved' ? String(Number(r.amount ?? 0).toFixed(2)) : '—',
          address: depositAddr || '—',
        }))
      const withdraws: WalletWithdrawRecord[] = list
        .filter((x) => x.type === 'withdraw')
        .map((w) => ({
          id: String(w.id),
          createdAt: w.createdAt,
          orderNo: w.orderNo ?? `SWD${String(w.id).padStart(8, '0')}`,
          amount: String(Number(w.amount ?? 0).toFixed(2)),
          currency: 'USDT',
          protocol: w.withdrawNetwork ? `USDT-${w.withdrawNetwork}` : 'USDT-TRC20',
          address: w.withdrawAddress ?? '—',
          status: w.status,
        }))

      setRechargeRecords(recharges)
      setWithdrawRecords(withdraws)
      setError(null)

      try {
        window.localStorage.setItem(
          cacheKey,
          JSON.stringify({
            walletBalance: nextBalance,
            rechargeRecords: recharges,
            withdrawRecords: withdraws,
          }),
        )
      } catch {
        // ignore
      }
    } catch (e: unknown) {
      let msg = tr(lang, { zh: '加载钱包数据失败', en: 'Failed to load wallet data', de: 'Wallet-Daten konnten nicht geladen werden', ja: 'ウォレットデータの読み込みに失敗しました', ko: '지갑 데이터를 불러오지 못했습니다', es: 'Error al cargar los datos de la cartera', it: 'Impossibile caricare i dati del portafoglio', vi: 'Không tải được dữ liệu ví', fr: 'Échec du chargement des données du portefeuille' })
      if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' && e.message.trim()) {
        msg = e.message.trim()
      }
      if (!silent) {
        setError(msg)
        setWalletBalance(0)
        setRechargeRecords([])
        setWithdrawRecords([])
      }
    } finally {
      if (!silent) setLoading(false)
      fetchingRef.current = false
    }
  }, [lang])

  useEffect(() => {
    const auth = readAuth()
    const hadCache = auth ? loadCache(auth.shopId) : false
    fetchWallet(hadCache)
  }, [fetchWallet, loadCache])

  useMerchantSync(['wallet', 'finance', 'all'], () => {
    fetchWallet(true)
  }, { immediate: false })

  const pendingCount = useMemo(
    () =>
      rechargeRecords.filter((r) => r.status === 'pending').length +
      withdrawRecords.filter((w) => w.status === 'pending').length,
    [rechargeRecords, withdrawRecords],
  )

  const activeRecords = walletHistoryTab === 'recharge' ? rechargeRecords : withdrawRecords
  const showSkeleton = loading && rechargeRecords.length === 0 && withdrawRecords.length === 0

  const copyText = useCallback(
    (text: string) => {
      if (!text || text === '—') return
      if (!navigator.clipboard) {
        showToast(tr(lang, { zh: '复制失败', en: 'Copy failed', de: 'Kopieren fehlgeschlagen', ja: 'コピーに失敗しました', ko: '복사 실패', es: 'Error al copiar', it: 'Copia non riuscita', vi: 'Sao chép thất bại', fr: 'Échec de la copie' }), 'error')
        return
      }
      navigator.clipboard
        .writeText(text)
        .then(() => showToast(tr(lang, { zh: '已复制', en: 'Copied', de: 'Kopiert', ja: 'コピーしました', ko: '복사됨', es: 'Copiado', it: 'Copiato', vi: 'Đã sao chép', fr: 'Copié' })))
        .catch(() => showToast(tr(lang, { zh: '复制失败', en: 'Copy failed', de: 'Kopieren fehlgeschlagen', ja: 'コピーに失敗しました', ko: '복사 실패', es: 'Error al copiar', it: 'Copia non riuscita', vi: 'Sao chép thất bại', fr: 'Échec de la copie' }), 'error'))
    },
    [lang, showToast],
  )

  const renderStatusBadge = (status: RecordStatus) => (
    <span className={`merchant-wallet-status merchant-wallet-status--${status}`}>
      {getStatusText(status, lang)}
    </span>
  )

  return (
    <div className="merchant-wallet-page merchant-wallet-page--v2">
      <header className="merchant-wallet-header merchant-wallet-header--v2">
        <div className="merchant-wallet-header-top">
          <div className="merchant-wallet-header-main">
            <span className="merchant-wallet-header-icon" aria-hidden="true">
              <MerchantSidebarNavIcon name="wallet" variant="light" className="merchant-wallet-header-icon-svg" />
            </span>
            <div className="merchant-wallet-header-copy">
              <h1 className="merchant-wallet-title">
                {tr(lang, { zh: '我的钱包', en: 'My wallet', de: 'Meine Wallet', ja: 'マイウォレット', ko: '내 지갑', es: 'Mi cartera', it: 'Il mio portafoglio', vi: 'Ví của tôi', fr: 'Mon portefeuille' })}
              </h1>
              <p className="merchant-wallet-subtitle">
                {tr(lang, { zh: '管理店铺资金余额、充值与提现申请', en: 'Manage shop balance, deposits and withdrawals.', de: 'Verwalten Sie Shop-Guthaben, Einzahlungen und Auszahlungen.', ja: '店舗残高、入金、出金申請を管理', ko: '점포 잔액, 충전 및 출금 신청 관리', es: 'Gestione el saldo, los depósitos y las retiradas de la tienda.', it: 'Gestisci saldo del negozio, depositi e prelievi.', vi: 'Quản lý số dư cửa hàng, nạp tiền và rút tiền.', fr: 'Gérez le solde de la boutique, les dépôts et les retraits.' })}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="merchant-wallet-finance-link"
            onClick={() => navigate('/finance')}
          >
            <span>{tr(lang, { zh: '财务报表', en: 'Finance report', de: 'Finanzbericht', ja: '財務レポート', ko: '재무 보고서', es: 'Informe financiero', it: 'Report finanziario', vi: 'Báo cáo tài chính', fr: 'Rapport financier' })}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div
          className="merchant-wallet-stats"
          role="group"
          aria-label={tr(lang, { zh: '钱包概览', en: 'Wallet overview', de: 'Wallet-Übersicht', ja: 'ウォレット概要', ko: '지갑 개요', es: 'Resumen de cartera', it: 'Panoramica portafoglio', vi: 'Tổng quan ví', fr: 'Présentation du portefeuille' })}
        >
          {showSkeleton ? (
            <WalletStatSkeleton />
          ) : (
            <div className="merchant-wallet-stat merchant-wallet-stat--balance">
              <span className="merchant-wallet-stat-label">
                {tr(lang, { zh: '可用余额', en: 'Available balance', de: 'Verfügbares Guthaben', ja: '利用可能残高', ko: '사용 가능 잔액', es: 'Saldo disponible', it: 'Saldo disponibile', vi: 'Số dư khả dụng', fr: 'Solde disponible' })}
              </span>
              <span className="merchant-wallet-stat-value merchant-wallet-stat-value--balance">
                ${walletBalance.toFixed(2)}
              </span>
              {pendingCount > 0 && (
                <span className="merchant-wallet-stat-hint">
                  {tr(lang, {
                    zh: `${pendingCount} 笔申请审核中`,
                    en: `${pendingCount} application${pendingCount > 1 ? 's' : ''} pending`,
                    de: `${pendingCount} Antrag${pendingCount > 1 ? 'e' : ''} in Prüfung`,
                    ja: `${pendingCount}件の申請が審査中`,
                    ko: `${pendingCount}건의 신청 심사 중`,
                    es: `${pendingCount} solicitud${pendingCount > 1 ? 'es' : ''} en revisión`,
                    it: `${pendingCount} richiesta${pendingCount > 1 ? 'e' : ''} in revisione`, vi: `${pendingCount} đơn đang chờ duyệt`,
                  })}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="merchant-wallet-actions">
          <span className="merchant-wallet-actions-label">
            {tr(lang, { zh: '快捷操作', en: 'Quick actions', de: 'Schnellaktionen', ja: 'クイック操作', ko: '빠른 작업', es: 'Acciones rápidas', it: 'Azioni rapide', vi: 'Thao tác nhanh', fr: 'Actions rapides' })}
          </span>
          <div className="merchant-wallet-actions-btns">
            <button
              type="button"
              className="merchant-wallet-btn merchant-wallet-btn--primary"
              onClick={() => navigate('/wallet/recharge')}
            >
              <span className="merchant-wallet-btn-icon merchant-wallet-btn-icon--primary" aria-hidden="true">
                <MerchantRechargeFlowIcon size={22} />
              </span>
              <span>{tr(lang, { zh: '充值', en: 'Recharge', de: 'Aufladung', ja: '入金', ko: '충전', es: 'Depositar', it: 'Ricarica', vi: 'Nạp tiền', fr: 'Recharger' })}</span>
            </button>
            <button
              type="button"
              className="merchant-wallet-btn merchant-wallet-btn--secondary"
              onClick={() => navigate('/wallet/withdraw')}
            >
              <span className="merchant-wallet-btn-icon merchant-wallet-btn-icon--withdraw" aria-hidden="true">
                <MerchantWithdrawFlowIcon size={22} />
              </span>
              <span>{tr(lang, { zh: '提现', en: 'Withdraw', de: 'Auszahlung', ja: '出金', ko: '출금', es: 'Retirar', it: 'Preleva', vi: 'Rút tiền', fr: 'Retirer' })}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="merchant-wallet-section--v2">
        <div className="merchant-wallet-toolbar">
          <div className="merchant-wallet-toolbar-main">
            <div className="merchant-wallet-detail-heading">
              <h2 className="merchant-wallet-detail-title">
                {tr(lang, { zh: '申请记录', en: 'Applications', de: 'Anträge', ja: '申請履歴', ko: '신청 내역', es: 'Historial de solicitudes', it: 'Storico richieste', vi: 'Lịch sử đăng ký', fr: 'Applications' })}
              </h2>
              {!showSkeleton && (
                <span className="merchant-wallet-detail-count">{activeRecords.length}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="merchant-wallet-refresh-btn"
            onClick={() => fetchWallet()}
            aria-label={tr(lang, { zh: '刷新', en: 'Refresh', de: 'Aktualisieren', ja: '更新', ko: '새로고침', es: 'Actualizar', it: 'Aggiorna', vi: 'Làm mới', fr: 'Rafraîchir' })}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 11-2.64-6.36" strokeLinecap="round" />
              <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div
          className="merchant-wallet-filters merchant-finance-filters--type"
          role="tablist"
          aria-label={tr(lang, { zh: '充值与提现', en: 'Recharge and withdraw', de: 'Aufladung und Auszahlung', ja: '入金と出金', ko: '충전 및 출금', es: 'Depósito y retiro', it: 'Deposito e prelievo', vi: 'Nạp tiền và rút tiền', fr: 'Recharger et retirer' })}
        >
          <button
            type="button"
            role="tab"
            aria-selected={walletHistoryTab === 'recharge'}
            className={`merchant-finance-type-chip${
              walletHistoryTab === 'recharge' ? ' merchant-finance-type-chip--active' : ''
            }`}
            onClick={() => setWalletHistoryTab('recharge')}
          >
            {tr(lang, { zh: '充值', en: 'Recharge', de: 'Aufladung', ja: '入金', ko: '충전', es: 'Depositar', it: 'Ricarica', vi: 'Nạp tiền', fr: 'Recharger' })}
            <span className="merchant-finance-type-chip-count">{rechargeRecords.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={walletHistoryTab === 'withdraw'}
            className={`merchant-finance-type-chip${
              walletHistoryTab === 'withdraw' ? ' merchant-finance-type-chip--active' : ''
            }`}
            onClick={() => setWalletHistoryTab('withdraw')}
          >
            {tr(lang, { zh: '提现', en: 'Withdraw', de: 'Auszahlung', ja: '出金', ko: '출금', es: 'Retirar', it: 'Preleva', vi: 'Rút tiền', fr: 'Retirer' })}
            <span className="merchant-finance-type-chip-count">{withdrawRecords.length}</span>
          </button>
        </div>

        {error && <div className="merchant-wallet-error">{error}</div>}

        <div className="merchant-wallet-list-wrap">
          {showSkeleton ? (
            <div className="merchant-wallet-card-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <WalletRowSkeleton key={i} />
              ))}
            </div>
          ) : activeRecords.length === 0 ? (
            <div className="merchant-wallet-empty">
              <span className="merchant-wallet-empty-icon" aria-hidden="true">
                {walletHistoryTab === 'recharge' ? (
                  <MerchantRechargeFlowIcon size={36} variant="chip" />
                ) : (
                  <MerchantWithdrawFlowIcon size={36} variant="chip" />
                )}
              </span>
              <p className="merchant-wallet-empty-text">
                {walletHistoryTab === 'recharge'
                  ? tr(lang, {
                      zh: '暂无充值申请，转入 USDT 后即可用于店铺经营',
                      en: 'No deposit applications yet. Add USDT to fund your shop.',
                      de: 'Noch keine Einzahlungsanträge. USDT hinzufügen, um Ihren Shop zu finanzieren.',
                      ja: '入金申請はまだありません。USDTを入金して店舗運営にご利用ください。', ko: '충전 신청 내역이 없습니다. USDT를 입금하면 점포 운영에 사용할 수 있습니다.',
                      es: 'Aún no hay solicitudes de depósito. Añada USDT para financiar su tienda.', it: 'Nessuna richiesta di deposito. Aggiungi USDT per finanziare il negozio.', vi: 'Chưa có đơn nạp tiền. Nạp USDT để vận hành cửa hàng.',
                    })
                  : tr(lang, {
                      zh: '暂无提现申请，余额可随时提取至链上地址',
                      en: 'No withdrawal applications yet. Transfer balance to your wallet anytime.',
                      de: 'Noch keine Auszahlungsanträge. Guthaben jederzeit an Ihre Wallet-Adresse übertragen.',
                      ja: '出金申請はまだありません。残高はいつでもオンチェーンアドレスへ出金できます。', ko: '출금 신청 내역이 없습니다. 잔액은 언제든 온체인 주소로 출금할 수 있습니다.',
                      es: 'Aún no hay solicitudes de retiro. Transfiera el saldo a su cartera en cualquier momento.', it: 'Nessuna richiesta di prelievo. Trasferisci il saldo al tuo portafoglio in qualsiasi momento.', vi: 'Chưa có đơn rút tiền. Rút số dư về ví bất cứ lúc nào.',
                    })}
              </p>
              <button
                type="button"
                className="merchant-wallet-empty-cta"
                onClick={() =>
                  navigate(walletHistoryTab === 'recharge' ? '/wallet/recharge' : '/wallet/withdraw')
                }
              >
                {walletHistoryTab === 'recharge'
                  ? tr(lang, { zh: '立即充值', en: 'Deposit now', de: 'Jetzt einzahlen', ja: '今すぐ入金', ko: '지금 충전', es: 'Depositar ahora', it: 'Deposita ora', vi: 'Nạp ngay', fr: 'Déposez maintenant' })
                  : tr(lang, { zh: '申请提现', en: 'Withdraw now', de: 'Jetzt auszahlen', ja: '出金を申請', ko: '출금 신청', es: 'Retirar ahora', it: 'Preleva ora', vi: 'Rút ngay', fr: 'Retirer maintenant' })}
              </button>
            </div>
          ) : walletHistoryTab === 'recharge' ? (
            <>
              <div className="merchant-wallet-card-list merchant-wallet-card-list--mobile">
                {rechargeRecords.map((r) => (
                  <article key={r.id} className="merchant-wallet-row">
                    <div className="merchant-wallet-row-top">
                      <span className="merchant-wallet-type-badge merchant-wallet-type-badge--recharge">
                        {tr(lang, { zh: '充值', en: 'Deposit', de: 'Deposit', ja: '入金', ko: '충전', es: 'Depósito', it: 'Deposito', vi: 'Nạp tiền', fr: 'Dépôt' })}
                      </span>
                      <time className="merchant-wallet-row-date" dateTime={r.createdAt}>
                        {formatRecordDate(r.createdAt, lang)}
                      </time>
                    </div>
                    <div className="merchant-wallet-row-amount-row">
                      <span className="merchant-wallet-row-amount merchant-wallet-row-amount--in">
                        +${r.amount}
                      </span>
                      <span className="merchant-wallet-row-side">
                        {tr(lang, { zh: '到账', en: 'Received', de: 'Erhalten', ja: '入金額', ko: '입금액', es: 'Recibido', it: 'Accreditato', vi: 'Đã nhận', fr: 'Reçu' })} {r.actualAmount}
                      </span>
                    </div>
                    <div className="merchant-wallet-row-foot">
                      <span className="merchant-wallet-row-order" title={r.orderNo}>
                        {r.orderNo}
                      </span>
                      <div className="merchant-wallet-row-foot-end">
                        <span className="merchant-wallet-protocol-chip merchant-wallet-protocol-chip--sm">
                          {formatProtocol(r.protocol)}
                        </span>
                        {renderStatusBadge(r.status)}
                      </div>
                    </div>
                    {(r.rechargeScreenshotUrl || r.transactionNo) && (
                      <div className="merchant-wallet-row-extra">
                        {r.rechargeScreenshotUrl ? (
                          <a
                            href={r.rechargeScreenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="merchant-wallet-screenshot-link"
                          >
                            <img src={r.rechargeScreenshotUrl} alt="" className="merchant-wallet-screenshot-thumb" />
                            <span>{tr(lang, { zh: '查看转账截图', en: 'View screenshot', de: 'Screenshot anzeigen', ja: '振込スクリーンショットを表示', ko: '송금 스크린샷 보기', es: 'Ver captura', it: 'Visualizza screenshot', vi: 'Xem ảnh chụp màn hình', fr: 'Voir la capture d\'écran' })}</span>
                          </a>
                        ) : (
                          <span className="merchant-wallet-row-tx">{r.transactionNo}</span>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <div className="merchant-wallet-table-wrap merchant-wallet-table-wrap--desktop">
                <table className="merchant-wallet-table">
                  <thead>
                    <tr>
                      <th>{tr(lang, { zh: '日期', en: 'Date', de: 'Datum', ja: '日付', ko: '날짜', es: 'Fecha', it: 'Data', vi: 'Ngày', fr: 'Date' })}</th>
                      <th>{tr(lang, { zh: '订单号', en: 'Order No.', de: 'Bestellnr.', ja: '注文番号', ko: '주문 번호', es: 'N.º de pedido', it: 'N. ordine', vi: 'Mã đơn hàng', fr: 'Numéro de commande' })}</th>
                      <th>{tr(lang, { zh: '金额', en: 'Amount', de: 'Betrag', ja: '金額', ko: '금액', es: 'Importe', it: 'Importo', vi: 'Số tiền', fr: 'Montant' })}</th>
                      <th>{tr(lang, { zh: '协议', en: 'Protocol', de: 'Protokoll', ja: 'プロトコル', ko: '프로토콜', es: 'Protocolo', it: 'Protocollo', vi: 'Giao thức', fr: 'Protocole' })}</th>
                      <th>{tr(lang, { zh: '状态', en: 'Status', de: 'Status', ja: 'ステータス', ko: '상태', es: 'Estado', it: 'Stato', vi: 'Trạng thái', fr: 'Statut' })}</th>
                      <th>{tr(lang, { zh: '截图', en: 'Screenshot', de: 'Screenshot', ja: 'スクリーンショット', ko: '스크린샷', es: 'Captura', it: 'Screenshot', vi: 'Ảnh chụp màn hình', fr: 'Capture d\'écran' })}</th>
                      <th>{tr(lang, { zh: '到账', en: 'Received', de: 'Erhalten', ja: '入金額', ko: '입금액', es: 'Recibido', it: 'Accreditato', vi: 'Đã nhận', fr: 'Reçu' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rechargeRecords.map((r) => (
                      <tr key={r.id}>
                        <td className="merchant-wallet-cell-date">{formatRecordDate(r.createdAt, lang)}</td>
                        <td className="merchant-wallet-cell-order">
                          <button
                            type="button"
                            className="merchant-wallet-copyable"
                            onClick={() => copyText(r.orderNo)}
                            title={tr(lang, { zh: '复制订单号', en: 'Copy order no.', de: 'Bestellnr. kopieren', ja: '注文番号をコピー', ko: '주문 번호 복사', es: 'Copiar n.º de pedido', it: 'Copia n. ordine', vi: 'Sao chép mã đơn', fr: 'Copier le numéro de commande.' })}
                          >
                            {r.orderNo}
                          </button>
                        </td>
                        <td className="merchant-wallet-cell-amount merchant-wallet-cell-amount--in">
                          +${r.amount}
                        </td>
                        <td>
                          <span className="merchant-wallet-protocol-chip merchant-wallet-protocol-chip--sm">
                            {formatProtocol(r.protocol)}
                          </span>
                        </td>
                        <td>{renderStatusBadge(r.status)}</td>
                        <td>
                          {r.rechargeScreenshotUrl ? (
                            <a
                              href={r.rechargeScreenshotUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="merchant-wallet-screenshot-link merchant-wallet-screenshot-link--table"
                            >
                              <img src={r.rechargeScreenshotUrl} alt="" className="merchant-wallet-screenshot-thumb" />
                            </a>
                          ) : (
                            <span className="merchant-wallet-cell-muted">{r.transactionNo ?? '—'}</span>
                          )}
                        </td>
                        <td className="merchant-wallet-cell-received">{r.actualAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="merchant-wallet-card-list merchant-wallet-card-list--mobile">
                {withdrawRecords.map((w) => (
                  <article key={w.id} className="merchant-wallet-row">
                    <div className="merchant-wallet-row-top">
                      <span className="merchant-wallet-type-badge merchant-wallet-type-badge--withdraw">
                        {tr(lang, { zh: '提现', en: 'Withdraw', de: 'Auszahlung', ja: '出金', ko: '출금', es: 'Retirar', it: 'Preleva', vi: 'Rút tiền', fr: 'Retirer' })}
                      </span>
                      <time className="merchant-wallet-row-date" dateTime={w.createdAt}>
                        {formatRecordDate(w.createdAt, lang)}
                      </time>
                    </div>
                    <div className="merchant-wallet-row-amount-row">
                      <span className="merchant-wallet-row-amount merchant-wallet-row-amount--out">
                        -${w.amount}
                      </span>
                      {renderStatusBadge(w.status)}
                    </div>
                    <div className="merchant-wallet-row-foot">
                      <span className="merchant-wallet-row-order" title={w.orderNo}>
                        {w.orderNo}
                      </span>
                      <span className="merchant-wallet-protocol-chip merchant-wallet-protocol-chip--sm">
                        {formatProtocol(w.protocol, w.currency)}
                      </span>
                    </div>
                    {w.address && w.address !== '—' && (
                      <div className="merchant-wallet-row-extra merchant-wallet-row-extra--address">
                        <code className="merchant-wallet-address" title={w.address}>
                          {truncateMiddle(w.address, 12, 10)}
                        </code>
                        <button
                          type="button"
                          className="merchant-wallet-copy-btn"
                          onClick={() => copyText(w.address)}
                        >
                          {tr(lang, { zh: '复制', en: 'Copy', de: 'Kopieren', ja: 'コピー', ko: '복사', es: 'Copiar', it: 'Copia', vi: 'Sao chép', fr: 'Copie' })}
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              <div className="merchant-wallet-table-wrap merchant-wallet-table-wrap--desktop">
                <table className="merchant-wallet-table">
                  <thead>
                    <tr>
                      <th>{tr(lang, { zh: '日期', en: 'Date', de: 'Datum', ja: '日付', ko: '날짜', es: 'Fecha', it: 'Data', vi: 'Ngày', fr: 'Date' })}</th>
                      <th>{tr(lang, { zh: '订单号', en: 'Order No.', de: 'Bestellnr.', ja: '注文番号', ko: '주문 번호', es: 'N.º de pedido', it: 'N. ordine', vi: 'Mã đơn hàng', fr: 'Numéro de commande' })}</th>
                      <th>{tr(lang, { zh: '金额', en: 'Amount', de: 'Betrag', ja: '金額', ko: '금액', es: 'Importe', it: 'Importo', vi: 'Số tiền', fr: 'Montant' })}</th>
                      <th>{tr(lang, { zh: '协议', en: 'Protocol', de: 'Protokoll', ja: 'プロトコル', ko: '프로토콜', es: 'Protocolo', it: 'Protocollo', vi: 'Giao thức', fr: 'Protocole' })}</th>
                      <th>{tr(lang, { zh: '地址', en: 'Address', de: 'Adresse', ja: 'アドレス', ko: '주소', es: 'Dirección', it: 'Indirizzo', vi: 'Địa chỉ', fr: 'Adresse' })}</th>
                      <th>{tr(lang, { zh: '状态', en: 'Status', de: 'Status', ja: 'ステータス', ko: '상태', es: 'Estado', it: 'Stato', vi: 'Trạng thái', fr: 'Statut' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawRecords.map((w) => (
                      <tr key={w.id}>
                        <td className="merchant-wallet-cell-date">{formatRecordDate(w.createdAt, lang)}</td>
                        <td className="merchant-wallet-cell-order">
                          <button
                            type="button"
                            className="merchant-wallet-copyable"
                            onClick={() => copyText(w.orderNo)}
                            title={tr(lang, { zh: '复制订单号', en: 'Copy order no.', de: 'Bestellnr. kopieren', ja: '注文番号をコピー', ko: '주문 번호 복사', es: 'Copiar n.º de pedido', it: 'Copia n. ordine', vi: 'Sao chép mã đơn', fr: 'Copier le numéro de commande.' })}
                          >
                            {w.orderNo}
                          </button>
                        </td>
                        <td className="merchant-wallet-cell-amount merchant-wallet-cell-amount--out">
                          -${w.amount}
                        </td>
                        <td>
                          <span className="merchant-wallet-protocol-chip merchant-wallet-protocol-chip--sm">
                            {formatProtocol(w.protocol, w.currency)}
                          </span>
                        </td>
                        <td className="merchant-wallet-cell-address">
                          {w.address && w.address !== '—' ? (
                            <div className="merchant-wallet-address-cell">
                              <code title={w.address}>{truncateMiddle(w.address, 14, 12)}</code>
                              <button
                                type="button"
                                className="merchant-wallet-copy-btn merchant-wallet-copy-btn--icon"
                                onClick={() => copyText(w.address)}
                                aria-label={tr(lang, { zh: '复制地址', en: 'Copy address', de: 'Adresse kopieren', ja: 'アドレスをコピー', ko: '주소 복사', es: 'Copiar dirección', it: 'Copia indirizzo', vi: 'Sao chép địa chỉ', fr: 'Copier l\'adresse' })}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="9" y="9" width="13" height="13" rx="2" />
                                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{renderStatusBadge(w.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default MerchantWallet
