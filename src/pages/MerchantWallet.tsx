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
  STATUS_TEXT,
  type WalletRechargeRecord,
  type WalletWithdrawRecord,
} from '../utils/walletRecords'
import { useLang } from '../context/LangContext'

type HistoryTab = 'recharge' | 'withdraw'
type RecordStatus = WalletRechargeRecord['status']

const STATUS_EN: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  failed: 'Failed',
}

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

function statusLabel(status: RecordStatus, lang: 'zh' | 'en'): string {
  if (lang === 'zh') return STATUS_TEXT[status] ?? status
  return STATUS_EN[status] ?? status
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
        setError(lang === 'zh' ? '未找到店铺信息，请重新登录' : 'Shop not found. Please sign in again.')
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
      let msg = lang === 'zh' ? '加载钱包数据失败' : 'Failed to load wallet data'
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
        showToast(lang === 'zh' ? '复制失败' : 'Copy failed', 'error')
        return
      }
      navigator.clipboard
        .writeText(text)
        .then(() => showToast(lang === 'zh' ? '已复制' : 'Copied'))
        .catch(() => showToast(lang === 'zh' ? '复制失败' : 'Copy failed', 'error'))
    },
    [lang, showToast],
  )

  const renderStatusBadge = (status: RecordStatus) => (
    <span className={`merchant-wallet-status merchant-wallet-status--${status}`}>
      {statusLabel(status, lang)}
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
                {lang === 'zh' ? '我的钱包' : 'My wallet'}
              </h1>
              <p className="merchant-wallet-subtitle">
                {lang === 'zh'
                  ? '管理店铺资金余额、充值与提现申请'
                  : 'Manage shop balance, deposits and withdrawals.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="merchant-wallet-finance-link"
            onClick={() => navigate('/finance')}
          >
            <span>{lang === 'zh' ? '财务报表' : 'Finance report'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div
          className="merchant-wallet-stats"
          role="group"
          aria-label={lang === 'zh' ? '钱包概览' : 'Wallet overview'}
        >
          {showSkeleton ? (
            <WalletStatSkeleton />
          ) : (
            <div className="merchant-wallet-stat merchant-wallet-stat--balance">
              <span className="merchant-wallet-stat-label">
                {lang === 'zh' ? '可用余额' : 'Available balance'}
              </span>
              <span className="merchant-wallet-stat-value merchant-wallet-stat-value--balance">
                ${walletBalance.toFixed(2)}
              </span>
              {pendingCount > 0 && (
                <span className="merchant-wallet-stat-hint">
                  {lang === 'zh'
                    ? `${pendingCount} 笔申请审核中`
                    : `${pendingCount} application${pendingCount > 1 ? 's' : ''} pending`}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="merchant-wallet-actions">
          <span className="merchant-wallet-actions-label">
            {lang === 'zh' ? '快捷操作' : 'Quick actions'}
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
              <span>{lang === 'zh' ? '充值' : 'Recharge'}</span>
            </button>
            <button
              type="button"
              className="merchant-wallet-btn merchant-wallet-btn--secondary"
              onClick={() => navigate('/wallet/withdraw')}
            >
              <span className="merchant-wallet-btn-icon merchant-wallet-btn-icon--withdraw" aria-hidden="true">
                <MerchantWithdrawFlowIcon size={22} />
              </span>
              <span>{lang === 'zh' ? '提现' : 'Withdraw'}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="merchant-wallet-section--v2">
        <div className="merchant-wallet-toolbar">
          <div className="merchant-wallet-toolbar-main">
            <div className="merchant-wallet-detail-heading">
              <h2 className="merchant-wallet-detail-title">
                {lang === 'zh' ? '申请记录' : 'Applications'}
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
            aria-label={lang === 'zh' ? '刷新' : 'Refresh'}
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
          aria-label={lang === 'zh' ? '充值与提现' : 'Recharge and withdraw'}
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
            {lang === 'zh' ? '充值' : 'Recharge'}
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
            {lang === 'zh' ? '提现' : 'Withdraw'}
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
                {lang === 'zh'
                  ? walletHistoryTab === 'recharge'
                    ? '暂无充值申请，转入 USDT 后即可用于店铺经营'
                    : '暂无提现申请，余额可随时提取至链上地址'
                  : walletHistoryTab === 'recharge'
                    ? 'No deposit applications yet. Add USDT to fund your shop.'
                    : 'No withdrawal applications yet. Transfer balance to your wallet anytime.'}
              </p>
              <button
                type="button"
                className="merchant-wallet-empty-cta"
                onClick={() =>
                  navigate(walletHistoryTab === 'recharge' ? '/wallet/recharge' : '/wallet/withdraw')
                }
              >
                {lang === 'zh'
                  ? walletHistoryTab === 'recharge'
                    ? '立即充值'
                    : '申请提现'
                  : walletHistoryTab === 'recharge'
                    ? 'Deposit now'
                    : 'Withdraw now'}
              </button>
            </div>
          ) : walletHistoryTab === 'recharge' ? (
            <>
              <div className="merchant-wallet-card-list merchant-wallet-card-list--mobile">
                {rechargeRecords.map((r) => (
                  <article key={r.id} className="merchant-wallet-row">
                    <div className="merchant-wallet-row-top">
                      <span className="merchant-wallet-type-badge merchant-wallet-type-badge--recharge">
                        {lang === 'zh' ? '充值' : 'Deposit'}
                      </span>
                      <time className="merchant-wallet-row-date" dateTime={r.createdAt}>
                        {formatRecordDate(r.createdAt)}
                      </time>
                    </div>
                    <div className="merchant-wallet-row-amount-row">
                      <span className="merchant-wallet-row-amount merchant-wallet-row-amount--in">
                        +${r.amount}
                      </span>
                      <span className="merchant-wallet-row-side">
                        {lang === 'zh' ? '到账' : 'Received'} {r.actualAmount}
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
                            <span>{lang === 'zh' ? '查看转账截图' : 'View screenshot'}</span>
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
                      <th>{lang === 'zh' ? '日期' : 'Date'}</th>
                      <th>{lang === 'zh' ? '订单号' : 'Order No.'}</th>
                      <th>{lang === 'zh' ? '金额' : 'Amount'}</th>
                      <th>{lang === 'zh' ? '协议' : 'Protocol'}</th>
                      <th>{lang === 'zh' ? '状态' : 'Status'}</th>
                      <th>{lang === 'zh' ? '截图' : 'Screenshot'}</th>
                      <th>{lang === 'zh' ? '到账' : 'Received'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rechargeRecords.map((r) => (
                      <tr key={r.id}>
                        <td className="merchant-wallet-cell-date">{formatRecordDate(r.createdAt)}</td>
                        <td className="merchant-wallet-cell-order">
                          <button
                            type="button"
                            className="merchant-wallet-copyable"
                            onClick={() => copyText(r.orderNo)}
                            title={lang === 'zh' ? '复制订单号' : 'Copy order no.'}
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
                        {lang === 'zh' ? '提现' : 'Withdraw'}
                      </span>
                      <time className="merchant-wallet-row-date" dateTime={w.createdAt}>
                        {formatRecordDate(w.createdAt)}
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
                          {lang === 'zh' ? '复制' : 'Copy'}
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
                      <th>{lang === 'zh' ? '日期' : 'Date'}</th>
                      <th>{lang === 'zh' ? '订单号' : 'Order No.'}</th>
                      <th>{lang === 'zh' ? '金额' : 'Amount'}</th>
                      <th>{lang === 'zh' ? '协议' : 'Protocol'}</th>
                      <th>{lang === 'zh' ? '地址' : 'Address'}</th>
                      <th>{lang === 'zh' ? '状态' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawRecords.map((w) => (
                      <tr key={w.id}>
                        <td className="merchant-wallet-cell-date">{formatRecordDate(w.createdAt)}</td>
                        <td className="merchant-wallet-cell-order">
                          <button
                            type="button"
                            className="merchant-wallet-copyable"
                            onClick={() => copyText(w.orderNo)}
                            title={lang === 'zh' ? '复制订单号' : 'Copy order no.'}
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
                                aria-label={lang === 'zh' ? '复制地址' : 'Copy address'}
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
