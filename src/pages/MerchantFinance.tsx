import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'
import caiwubaogao from '../assets/caiwubaogao.png'
import {
  MerchantRechargeFlowIcon,
  MerchantWithdrawFlowIcon,
} from '../components/MerchantWalletFlowIcons'

type RangeKey = '7d' | '30d' | '90d'
type RawType = 'recharge' | 'withdraw' | 'consume' | 'refund'
type TypeFilter = 'all' | RawType

interface FinanceRecord {
  id: string
  createdAt: string
  rawType: RawType
  amount: number
  balanceAfter: number | null
  remark: string
  orderNo: string
}

const RANGE_TO_DAYS: Record<RangeKey, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

const financeCache: Partial<
  Record<RangeKey, { records: FinanceRecord[]; income: number; expense: number; net: number }>
> = {}

function readAuthShopId(): string | null {
  try {
    const raw = window.localStorage.getItem('authUser')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { shopId?: string | null }
    const shopId = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
    return shopId || null
  } catch {
    return null
  }
}

function formatMoney(value: number): string {
  const n = Number.isFinite(value) ? value : 0
  return `$${n.toFixed(2)}`
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

function typeLabel(rawType: RawType, lang: 'zh' | 'en'): string {
  const map: Record<RawType, { zh: string; en: string }> = {
    recharge: { zh: '充值', en: 'Recharge' },
    withdraw: { zh: '提现', en: 'Withdraw' },
    consume: { zh: '消费', en: 'Spend' },
    refund: { zh: '退款', en: 'Refund' },
  }
  return map[rawType]?.[lang] ?? rawType
}

const FinanceStatSkeleton: React.FC = () => (
  <div className="merchant-finance-stat merchant-finance-stat--skeleton" aria-hidden="true">
    <span className="merchant-finance-stat-icon merchant-finance-skeleton-block" />
    <div className="merchant-finance-stat-body">
      <span className="merchant-finance-skeleton-block merchant-finance-skeleton-value" />
      <span className="merchant-finance-skeleton-block merchant-finance-skeleton-label" />
    </div>
  </div>
)

const FinanceRowSkeleton: React.FC = () => (
  <article className="merchant-finance-row merchant-finance-row--skeleton" aria-hidden="true">
    <div className="merchant-finance-row-top">
      <span className="merchant-finance-skeleton-block merchant-finance-skeleton-chip" />
      <span className="merchant-finance-skeleton-block merchant-finance-skeleton-date" />
    </div>
    <span className="merchant-finance-skeleton-block merchant-finance-skeleton-amount" />
    <span className="merchant-finance-skeleton-block merchant-finance-skeleton-remark" />
  </article>
)

const MerchantFinance: React.FC = () => {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [range, setRange] = useState<RangeKey>('30d')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [netTotal, setNetTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFinance = useCallback(async (silent = false) => {
    const shopId = readAuthShopId()
    if (!shopId) {
      setError(lang === 'zh' ? '未找到店铺信息，请重新登录商家后台' : 'Shop not found. Please sign in again.')
      setRecords([])
      setTotalIncome(0)
      setTotalExpense(0)
      setNetTotal(0)
      return
    }

    try {
      if (silent) setRefreshing(true)
      else setLoading(true)
      setError(null)

      const days = RANGE_TO_DAYS[range]
      const res = await api.get<{
        incomeTotal: number
        expenseTotal: number
        net: number
        days: number
        records: Array<{
          id: string
          type: RawType
          amount: number
          balanceAfter: number | null
          remark: string
          orderNo: string
          createdAt: string
        }>
      }>(`/api/shops/${encodeURIComponent(shopId)}/finance?days=${encodeURIComponent(String(days))}`)

      const income = Number(res.incomeTotal ?? 0)
      const expense = Number(res.expenseTotal ?? 0)
      const net = Number(res.net ?? income - expense)
      const list: FinanceRecord[] = (res.records ?? []).map((row) => {
        const amt = Number(row.amount ?? 0)
        let remark = row.remark || ''
        if (!remark && row.orderNo) {
          remark =
            lang === 'zh' ? `记录号：${row.orderNo}` : `Ref: ${row.orderNo}`
        }
        return {
          id: row.id,
          createdAt: row.createdAt,
          rawType: row.type,
          amount: amt,
          balanceAfter: row.balanceAfter != null ? Number(row.balanceAfter) : null,
          remark,
          orderNo: row.orderNo ?? '',
        }
      })

      setTotalIncome(income)
      setTotalExpense(expense)
      setNetTotal(net)
      setRecords(list)
      financeCache[range] = { records: list, income, expense, net }
    } catch (e: unknown) {
      let msg = lang === 'zh' ? '加载财务报表失败' : 'Failed to load finance report'
      if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' && e.message.trim()) {
        msg = e.message.trim()
      }
      setError(msg)
      if (!silent) {
        setRecords([])
        setTotalIncome(0)
        setTotalExpense(0)
        setNetTotal(0)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [lang, range])

  useEffect(() => {
    const cached = financeCache[range]
    if (cached) {
      setRecords(cached.records)
      setTotalIncome(cached.income)
      setTotalExpense(cached.expense)
      setNetTotal(cached.net)
      fetchFinance(true)
    } else {
      fetchFinance(false)
    }
  }, [fetchFinance, range])

  const typeCounts = useMemo(() => {
    const counts: Record<TypeFilter, number> = {
      all: records.length,
      recharge: 0,
      withdraw: 0,
      consume: 0,
      refund: 0,
    }
    for (const row of records) {
      counts[row.rawType] += 1
    }
    return counts
  }, [records])

  const filteredRecords = useMemo(() => {
    if (typeFilter === 'all') return records
    return records.filter((row) => row.rawType === typeFilter)
  }, [records, typeFilter])

  const rangeLabels: Record<RangeKey, { zh: string; en: string }> = {
    '7d': { zh: '近7天', en: '7 days' },
    '30d': { zh: '近30天', en: '30 days' },
    '90d': { zh: '近90天', en: '90 days' },
  }

  const typeFilters: { key: TypeFilter; zh: string; en: string }[] = [
    { key: 'all', zh: '全部', en: 'All' },
    { key: 'recharge', zh: '充值', en: 'Recharge' },
    { key: 'withdraw', zh: '提现', en: 'Withdraw' },
    { key: 'consume', zh: '消费', en: 'Spend' },
    { key: 'refund', zh: '退款', en: 'Refund' },
  ]

  const incomeRatio = totalIncome + totalExpense > 0 ? (totalIncome / (totalIncome + totalExpense)) * 100 : 50
  const showSkeleton = loading && records.length === 0

  return (
    <div className="merchant-finance-page merchant-finance-page--v2">
      <header className="merchant-finance-header merchant-finance-header--v2">
        <div className="merchant-finance-header-top">
          <div className="merchant-finance-header-main">
            <span className="merchant-finance-header-icon" aria-hidden="true">
              <img src={caiwubaogao} alt="" className="merchant-finance-header-icon-img" />
            </span>
            <div className="merchant-finance-header-copy">
              <h1 className="merchant-finance-title">
                {lang === 'zh' ? '财务报表' : 'Finance report'}
              </h1>
              <p className="merchant-finance-subtitle">
                {lang === 'zh'
                  ? '查看收入、支出与资金流水，掌握店铺经营状况'
                  : 'Track income, spending and fund flows for your shop.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="merchant-finance-wallet-link"
            onClick={() => navigate('/wallet')}
          >
            {lang === 'zh' ? '我的钱包' : 'My wallet'}
          </button>
        </div>

        <div
          className="merchant-finance-stats"
          role="group"
          aria-label={lang === 'zh' ? '财务汇总' : 'Finance summary'}
        >
          {showSkeleton ? (
            <>
              <FinanceStatSkeleton />
              <FinanceStatSkeleton />
              <FinanceStatSkeleton />
            </>
          ) : (
            <>
              <div className="merchant-finance-stat merchant-finance-stat--income">
                <span className="merchant-finance-stat-icon merchant-finance-stat-icon--income" aria-hidden="true">
                  <MerchantRechargeFlowIcon size={24} />
                </span>
                <div className="merchant-finance-stat-body">
                  <span className="merchant-finance-stat-value">{formatMoney(totalIncome)}</span>
                  <span className="merchant-finance-stat-label">{lang === 'zh' ? '收入' : 'Income'}</span>
                </div>
              </div>
              <div className="merchant-finance-stat merchant-finance-stat--expense">
                <span className="merchant-finance-stat-icon merchant-finance-stat-icon--expense" aria-hidden="true">
                  <MerchantWithdrawFlowIcon size={24} />
                </span>
                <div className="merchant-finance-stat-body">
                  <span className="merchant-finance-stat-value">{formatMoney(totalExpense)}</span>
                  <span className="merchant-finance-stat-label">{lang === 'zh' ? '支出' : 'Expense'}</span>
                </div>
              </div>
              <div className="merchant-finance-stat merchant-finance-stat--net">
                <span className="merchant-finance-stat-icon merchant-finance-stat-icon--net" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="merchant-finance-stat-body">
                  <span
                    className={`merchant-finance-stat-value${
                      netTotal < 0 ? ' merchant-finance-stat-value--negative' : ''
                    }`}
                  >
                    {formatMoney(netTotal)}
                  </span>
                  <span className="merchant-finance-stat-label">{lang === 'zh' ? '结余' : 'Net'}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {!showSkeleton && totalIncome + totalExpense > 0 && (
          <div className="merchant-finance-ratio" aria-hidden="true">
            <span
              className="merchant-finance-ratio-income"
              style={{ width: `${incomeRatio}%` }}
            />
            <span
              className="merchant-finance-ratio-expense"
              style={{ width: `${100 - incomeRatio}%` }}
            />
          </div>
        )}
      </header>

      <section className="merchant-finance-section--v2">
        <div className="merchant-finance-toolbar">
          <h2 className="merchant-finance-detail-title">
            {lang === 'zh' ? '流水明细' : 'Transactions'}
          </h2>
          <button
            type="button"
            className="merchant-finance-refresh-btn"
            onClick={() => fetchFinance(records.length > 0)}
            disabled={loading || refreshing}
            aria-label={lang === 'zh' ? '刷新' : 'Refresh'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={refreshing ? 'merchant-finance-refresh-icon--spin' : undefined}
            >
              <path d="M21 12a9 9 0 11-2.64-6.36" strokeLinecap="round" />
              <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="merchant-finance-filters merchant-finance-filters--range">
          {(['7d', '30d', '90d'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`merchant-finance-filter-btn${range === key ? ' merchant-finance-filter-btn--active' : ''}`}
              onClick={() => setRange(key)}
            >
              {lang === 'zh' ? rangeLabels[key].zh : rangeLabels[key].en}
            </button>
          ))}
        </div>

        <div
          className="merchant-finance-filters merchant-finance-filters--type"
          role="group"
          aria-label={lang === 'zh' ? '流水类型' : 'Transaction type'}
        >
          {typeFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`merchant-finance-type-chip${
                typeFilter === item.key ? ' merchant-finance-type-chip--active' : ''
              }`}
              onClick={() => setTypeFilter(item.key)}
            >
              {lang === 'zh' ? item.zh : item.en}
              <span className="merchant-finance-type-chip-count">{typeCounts[item.key]}</span>
            </button>
          ))}
        </div>

        {error && <div className="merchant-finance-error">{error}</div>}

        <div
          className={`merchant-finance-list-wrap${
            refreshing ? ' merchant-finance-list-wrap--refreshing' : ''
          }`}
        >
          {showSkeleton ? (
            <div className="merchant-finance-card-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <FinanceRowSkeleton key={i} />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="merchant-finance-empty">
              <span className="merchant-finance-empty-icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="6" width="18" height="14" rx="2" />
                  <path d="M3 10h18M8 15h2" strokeLinecap="round" />
                </svg>
              </span>
              <p className="merchant-finance-empty-text">
                {lang === 'zh' ? '该时间范围内暂无资金流水' : 'No transactions in this period'}
              </p>
            </div>
          ) : (
            <>
              <div className="merchant-finance-card-list merchant-finance-card-list--mobile">
                {filteredRecords.map((row) => {
                  const isIncome = row.amount >= 0
                  return (
                    <article key={row.id} className="merchant-finance-row">
                      <div className="merchant-finance-row-top">
                        <span
                          className={`merchant-finance-type-badge merchant-finance-type-badge--${row.rawType}`}
                        >
                          {typeLabel(row.rawType, lang)}
                        </span>
                        <time className="merchant-finance-row-date" dateTime={row.createdAt}>
                          {formatDateTime(row.createdAt)}
                        </time>
                      </div>
                      <div className="merchant-finance-row-amount-row">
                        <span
                          className={
                            isIncome
                              ? 'merchant-finance-amount--income'
                              : 'merchant-finance-amount--expense'
                          }
                        >
                          {isIncome ? '+' : '-'}
                          {formatMoney(Math.abs(row.amount))}
                        </span>
                        {row.balanceAfter != null && (
                          <span className="merchant-finance-row-balance">
                            {lang === 'zh' ? '余额' : 'Balance'} {formatMoney(row.balanceAfter)}
                          </span>
                        )}
                      </div>
                      {(row.remark || row.orderNo) && (
                        <p className="merchant-finance-row-remark">
                          {row.remark || row.orderNo}
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>

              <div className="merchant-finance-table-wrap merchant-finance-table-wrap--desktop">
                <table className="merchant-finance-table">
                  <thead>
                    <tr>
                      <th>{lang === 'zh' ? '日期' : 'Date'}</th>
                      <th>{lang === 'zh' ? '类型' : 'Type'}</th>
                      <th>{lang === 'zh' ? '金额' : 'Amount'}</th>
                      <th>{lang === 'zh' ? '余额' : 'Balance'}</th>
                      <th>{lang === 'zh' ? '备注' : 'Note'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((row) => {
                      const isIncome = row.amount >= 0
                      return (
                        <tr key={row.id}>
                          <td className="merchant-finance-cell-date">{formatDateTime(row.createdAt)}</td>
                          <td>
                            <span
                              className={`merchant-finance-type-badge merchant-finance-type-badge--${row.rawType}`}
                            >
                              {typeLabel(row.rawType, lang)}
                            </span>
                          </td>
                          <td
                            className={
                              isIncome
                                ? 'merchant-finance-amount--income'
                                : 'merchant-finance-amount--expense'
                            }
                          >
                            {isIncome ? '+' : '-'}
                            {formatMoney(Math.abs(row.amount))}
                          </td>
                          <td className="merchant-finance-cell-balance">
                            {row.balanceAfter != null ? formatMoney(row.balanceAfter) : '—'}
                          </td>
                          <td className="merchant-finance-remark">{row.remark || '—'}</td>
                        </tr>
                      )
                    })}
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

export default MerchantFinance
