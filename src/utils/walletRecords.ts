import type { Lang } from '../i18n/lang'
import { tr, type TrMap } from '../i18n/tr'
import { formatDateTime } from './datetime'
/** 充值记录 */
export type WalletRechargeRecord = {
  id: string
  createdAt: string // ISO
  orderNo: string
  amount: string
  currency: string
  protocol: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
  actualAmount: string
  address: string
  /** 交易号（旧） */
  transactionNo?: string
  /** 交易截图 URL */
  rechargeScreenshotUrl?: string | null
}

/** 提现记录 */
export type WalletWithdrawRecord = {
  id: string
  createdAt: string
  orderNo: string
  amount: string
  currency: string
  protocol?: string
  address: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
}

const RECHARGE_KEY = 'walletRechargeRecords'
const WITHDRAW_KEY = 'walletWithdrawRecords'

export function loadRechargeRecords(): WalletRechargeRecord[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(RECHARGE_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw) as WalletRechargeRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function loadWithdrawRecords(): WalletWithdrawRecord[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(WITHDRAW_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw) as WalletWithdrawRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRechargeRecords(list: WalletRechargeRecord[]) {
  try {
    window.localStorage.setItem(RECHARGE_KEY, JSON.stringify(list))
  } catch {}
}

export function saveWithdrawRecords(list: WalletWithdrawRecord[]) {
  try {
    window.localStorage.setItem(WITHDRAW_KEY, JSON.stringify(list))
  } catch {}
}

export function addRechargeRecord(record: Omit<WalletRechargeRecord, 'id' | 'createdAt' | 'orderNo'>): WalletRechargeRecord {
  const list = loadRechargeRecords()
  const id = `recharge_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const createdAt = new Date().toISOString()
  const orderNo = `R${Date.now().toString().slice(-10)}`
  const full: WalletRechargeRecord = { ...record, id, createdAt, orderNo }
  list.unshift(full)
  saveRechargeRecords(list)
  return full
}

export function addWithdrawRecord(record: Omit<WalletWithdrawRecord, 'id' | 'createdAt' | 'orderNo'>): WalletWithdrawRecord {
  const list = loadWithdrawRecords()
  const id = `withdraw_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const createdAt = new Date().toISOString()
  const orderNo = `W${Date.now().toString().slice(-10)}`
  const full: WalletWithdrawRecord = { ...record, id, createdAt, orderNo }
  list.unshift(full)
  saveWithdrawRecords(list)
  return full
}

export const STATUS_TEXT: Record<string, TrMap> = {
  pending: { zh: '待审核', en: 'Pending', de: 'Ausstehend', ja: '審査中', ko: '심사 중', es: 'Pendiente', it: 'In attesa', vi: 'Đang chờ duyệt' },
  approved: { zh: '已通过', en: 'Approved', de: 'Genehmigt', ja: '承認済み', ko: '승인됨', es: 'Aprobado', it: 'Approvato', vi: 'Đã duyệt' },
  rejected: { zh: '已拒绝', en: 'Rejected', de: 'Abgelehnt', ja: '却下', ko: '거절됨', es: 'Rechazado', it: 'Rifiutato', vi: 'Đã từ chối' },
  completed: { zh: '已完成', en: 'Completed', de: 'Abgeschlossen', ja: '完了', ko: '완료', es: 'Completado', it: 'Completato', vi: 'Hoàn tất' },
  failed: { zh: '失败', en: 'Failed', de: 'Fehlgeschlagen', ja: '失敗', ko: '실패', es: 'Fallido', it: 'Non riuscito', vi: 'Thất bại' },
}

export function getStatusText(status: string, lang: Lang): string {
  const labels = STATUS_TEXT[status]
  return labels ? tr(lang, labels) : status
}

export function formatRecordDate(iso: string, lang?: Lang): string {
  return formatDateTime(iso, lang)
}
