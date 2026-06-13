import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useLang } from '../context/LangContext'
import { useMerchantSync } from '../hooks/useMerchantSync'
import caiwubaogao from '../assets/caiwubaogao.png'
import {
  MerchantRechargeFlowIcon,
  MerchantWithdrawFlowIcon,
} from '../components/MerchantWalletFlowIcons'
import { formatDateTime } from '../utils/datetime'
import { pickBilingual, tr, type Lang } from '../i18n'

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

function typeLabel(rawType: RawType, lang: Lang): string {
  const map: Record<RawType, { zh: string; en: string; de: string; ja: string; ko: string; es: string; it: string; vi: string
  fr: string }> = {
    recharge: { zh: '充值', en: 'Recharge', de: 'Aufladung', ja: 'チャージ', ko: '충전', es: 'Recarga', it: 'Ricarica', vi: 'Nạp tiền', fr: 'Recharger' },
    withdraw: { zh: '提现', en: 'Withdraw', de: 'Auszahlung', ja: '出金', ko: '출금', es: 'Retiro', it: 'Prelievo', vi: 'Rút tiền', fr: 'Retirer' },
    consume: { zh: '消费', en: 'Spend', de: 'Ausgabe', ja: '利用', ko: '사용', es: 'Gasto', it: 'Spesa', vi: 'Chi tiêu', fr: 'Dépenser' },
    refund: { zh: '退款', en: 'Refund', de: 'Erstattung', ja: '返金', ko: '환불', es: 'Reembolso', it: 'Rimborso', vi: 'Hoàn tiền', fr: 'Remboursement' },
  }
  return pickBilingual(lang, map[rawType] ?? { zh: rawType, en: rawType, de: rawType, ja: rawType, es: rawType, it: rawType })
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
      setError(tr(lang, {
        zh: '未找到店铺信息，请重新登录商家后台',
        en: 'Shop not found. Please sign in again.',
        de: 'Shop nicht gefunden. Bitte melden Sie sich erneut an.', ja: 'ショップ情報が見つかりません。再度ログインしてください', ko: '쇼핑몰 정보를 찾을 수 없습니다. 다시 로그인해 주세요.', es: 'Tienda no encontrada. Vuelve a iniciar sesión.', it: 'Negozio non trovato. Accedi di nuovo.', vi: 'Không tìm thấy cửa hàng. Vui lòng đăng nhập lại.'}))
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
          remark = tr(lang, {
            zh: `记录号：${row.orderNo}`,
            en: `Ref: ${row.orderNo}`,
            de: `Ref.: ${row.orderNo}`, ja: `記録番号：${row.orderNo}`, ko: '기록번호: ${row.orderNo}', es: `Ref.: ${row.orderNo}`, it: `Rif.: ${row.orderNo}`, vi: `Mã: ${row.orderNo}`})
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
      let msg = tr(lang, {
        zh: '加载财务报表失败',
        en: 'Failed to load finance report',
        de: 'Finanzbericht konnte nicht geladen werden', ja: '財務レポートの読み込みに失敗しました', ko: '재무 보고서를 불러오지 못했습니다', es: 'No se pudo cargar el informe financiero', it: 'Impossibile caricare il report finanziario', vi: 'Không thể tải báo cáo tài chính'})
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

  useMerchantSync(['finance', 'wallet', 'all'], () => {
    void fetchFinance(true)
  }, { immediate: false })

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

  const rangeLabels: Record<RangeKey, { zh: string; en: string; de: string; ja: string; ko: string; es: string; it: string; vi: string
  fr: string }> = {
    '7d': { zh: '近7天', en: '7 days', de: '7 Tage', ja: '過去7日', ko: '최근 7일', es: '7 días', it: '7 giorni', vi: '7 ngày', fr: '7 jours' },
    '30d': { zh: '近30天', en: '30 days', de: '30 Tage', ja: '過去30日', ko: '최근 30일', es: '30 días', it: '30 giorni', vi: '30 ngày', fr: '30 jours' },
    '90d': { zh: '近90天', en: '90 days', de: '90 Tage', ja: '過去90日', ko: '최근 90일', es: '90 días', it: '90 giorni', vi: '90 ngày', fr: '90 jours' },
  }

  const typeFilters: { key: TypeFilter; zh: string; en: string; de: string; ja: string; ko: string; es: string; it: string; vi: string
  fr: string }[] = [
    { key: 'all', zh: '全部', en: 'All', de: 'Alle', ja: 'すべて', ko: '전체', es: 'Todos', it: 'Tutti', vi: 'Tất cả', fr: 'Tous' },
    { key: 'recharge', zh: '充值', en: 'Recharge', de: 'Aufladung', ja: 'チャージ', ko: '충전', es: 'Recarga', it: 'Ricarica', vi: 'Nạp tiền', fr: 'Recharger' },
    { key: 'withdraw', zh: '提现', en: 'Withdraw', de: 'Auszahlung', ja: '出金', ko: '출금', es: 'Retiro', it: 'Prelievo', vi: 'Rút tiền', fr: 'Retirer' },
    { key: 'consume', zh: '消费', en: 'Spend', de: 'Ausgabe', ja: '利用', ko: '사용', es: 'Gasto', it: 'Spesa', vi: 'Chi tiêu', fr: 'Dépenser' },
    { key: 'refund', zh: '退款', en: 'Refund', de: 'Erstattung', ja: '返金', ko: '환불', es: 'Reembolso', it: 'Rimborso', vi: 'Hoàn tiền', fr: 'Remboursement' },
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
                {tr(lang, { zh: '财务报表', en: 'Finance report', de: 'Finanzbericht', ja: '財務レポート', ko: '재무 보고서', es: 'Informe financiero', it: 'Report finanziario', vi: 'Báo cáo tài chính', fr: 'Rapport financier'})}
              </h1>
              <p className="merchant-finance-subtitle">
                {tr(lang, {
                  zh: '查看收入、支出与资金流水，掌握店铺经营状况',
                  en: 'Track income, spending and fund flows for your shop.',
                  de: 'Verfolgen Sie Einnahmen, Ausgaben und Geldflüsse Ihres Shops.', ja: '収入・支出・資金の流れを確認し、ショップの経営状況を把握しましょう', ko: '수입, 지출, 자금 흐름을 확인하고 쇼핑몰 경영 현황을 파악하세요.', es: 'Consulta ingresos, gastos y movimientos de fondos de tu tienda.', it: 'Monitora entrate, spese e flussi di fondi del tuo negozio.', vi: 'Theo dõi thu nhập, chi tiêu và dòng tiền của cửa hàng.'})}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="merchant-finance-wallet-link"
            onClick={() => navigate('/wallet')}
          >
            {tr(lang, { zh: '我的钱包', en: 'My wallet', de: 'Meine Wallet', ja: 'マイウォレット', ko: '내 지갑', es: 'Mi billetera', it: 'Il mio portafoglio', vi: 'Ví của tôi', fr: 'Mon portefeuille'})}
          </button>
        </div>

        <div
          className="merchant-finance-stats"
          role="group"
          aria-label={tr(lang, { zh: '财务汇总', en: 'Finance summary', de: 'Finanzübersicht', ja: '財務サマリー', ko: '재무 요약', es: 'Resumen financiero', it: 'Riepilogo finanziario', vi: 'Tóm tắt tài chính', fr: 'Résumé financier'})}
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
                  <span className="merchant-finance-stat-label">{tr(lang, { zh: '收入', en: 'Income', de: 'Einnahmen', ja: '収入', ko: '수입', es: 'Ingresos', it: 'Entrate', vi: 'Thu nhập', fr: 'Revenu'})}</span>
                </div>
              </div>
              <div className="merchant-finance-stat merchant-finance-stat--expense">
                <span className="merchant-finance-stat-icon merchant-finance-stat-icon--expense" aria-hidden="true">
                  <MerchantWithdrawFlowIcon size={24} />
                </span>
                <div className="merchant-finance-stat-body">
                  <span className="merchant-finance-stat-value">{formatMoney(totalExpense)}</span>
                  <span className="merchant-finance-stat-label">{tr(lang, { zh: '支出', en: 'Expense', de: 'Ausgaben', ja: '支出', ko: '지출', es: 'Gastos', it: 'Spese', vi: 'Chi tiêu', fr: 'Frais'})}</span>
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
                  <span className="merchant-finance-stat-label">{tr(lang, { zh: '结余', en: 'Net', de: 'Saldo', ja: '収支', ko: '순수익', es: 'Balance neto', it: 'Saldo netto', vi: 'Số dư ròng', fr: 'Filet'})}</span>
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
            {tr(lang, { zh: '流水明细', en: 'Transactions', de: 'Transaktionen', ja: '取引明細', ko: '거래 내역', es: 'Movimientos', it: 'Movimenti', vi: 'Giao dịch', fr: 'Transactions'})}
          </h2>
          <button
            type="button"
            className="merchant-finance-refresh-btn"
            onClick={() => fetchFinance(records.length > 0)}
            disabled={loading || refreshing}
            aria-label={tr(lang, { zh: '刷新', en: 'Refresh', de: 'Aktualisieren', ja: '更新', ko: '새로고침', es: 'Actualizar', it: 'Aggiorna', vi: 'Làm mới', fr: 'Rafraîchir'})}
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
              {pickBilingual(lang, rangeLabels[key])}
            </button>
          ))}
        </div>

        <div
          className="merchant-finance-filters merchant-finance-filters--type"
          role="group"
          aria-label={tr(lang, { zh: '流水类型', en: 'Transaction type', de: 'Transaktionstyp', ja: '取引タイプ', ko: '거래 유형', es: 'Tipo de movimiento', it: 'Tipo di movimento', vi: 'Loại giao dịch', fr: 'Type d\'opération'})}
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
              {pickBilingual(lang, item)}
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
                {tr(lang, {
                  zh: '该时间范围内暂无资金流水',
                  en: 'No transactions in this period',
                  de: 'Keine Transaktionen in diesem Zeitraum', ja: 'この期間の取引履歴はありません', ko: '해당 기간에 거래 내역이 없습니다', es: 'No hay movimientos en este período', it: 'Nessun movimento in questo periodo', vi: 'Không có giao dịch trong khoảng thời gian này'})}
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
                          {formatDateTime(row.createdAt, lang)}
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
                            {tr(lang, { zh: '余额', en: 'Balance', de: 'Guthaben', ja: '残高', ko: '잔액', es: 'Saldo', it: 'Saldo', vi: 'Số dư', fr: 'Équilibre'})} {formatMoney(row.balanceAfter)}
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
                      <th>{tr(lang, { zh: '日期', en: 'Date', de: 'Datum', ja: '日付', ko: '날짜', es: 'Fecha', it: 'Data', vi: 'Ngày', fr: 'Date'})}</th>
                      <th>{tr(lang, { zh: '类型', en: 'Type', de: 'Typ', ja: 'タイプ', ko: '유형', es: 'Tipo', it: 'Tipo', vi: 'Loại', fr: 'Taper'})}</th>
                      <th>{tr(lang, { zh: '金额', en: 'Amount', de: 'Betrag', ja: '金額', ko: '금액', es: 'Monto', it: 'Importo', vi: 'Số tiền', fr: 'Montant'})}</th>
                      <th>{tr(lang, { zh: '余额', en: 'Balance', de: 'Guthaben', ja: '残高', ko: '잔액', es: 'Saldo', it: 'Saldo', vi: 'Số dư', fr: 'Équilibre'})}</th>
                      <th>{tr(lang, { zh: '备注', en: 'Note', de: 'Notiz', ja: '備考', ko: '비고', es: 'Nota', it: 'Nota', vi: 'Ghi chú', fr: 'Note'})}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((row) => {
                      const isIncome = row.amount >= 0
                      return (
                        <tr key={row.id}>
                          <td className="merchant-finance-cell-date">{formatDateTime(row.createdAt, lang)}</td>
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
