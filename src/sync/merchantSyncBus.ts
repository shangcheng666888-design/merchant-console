export type MerchantSyncTopic =
  | 'shop'
  | 'dashboard'
  | 'orders'
  | 'wallet'
  | 'warehouse'
  | 'finance'
  | 'promotion'
  | 'all'

export type MerchantSyncReason = 'poll' | 'sse' | 'visible' | 'manual' | 'local'

export interface ShopSyncSnapshot {
  version: number
  status: 'normal' | 'banned'
  banReason: string | null
  banNotice: string | null
  bannedAt: string | null
  name: string
  walletBalance: number
  level: number
  creditScore: number
  goodRate: number
  followers: number
  sales: number
  visits: number
  pendingOrders: number
}

export const MERCHANT_SYNC_POLL_MS = 3000

type SyncListener = (reason: MerchantSyncReason, topics: MerchantSyncTopic[]) => void

const listeners = new Map<MerchantSyncTopic, Set<SyncListener>>()

function topicMatches(subscribed: MerchantSyncTopic, incoming: MerchantSyncTopic[]): boolean {
  if (subscribed === 'all') return true
  if (incoming.includes('all')) return true
  return incoming.includes(subscribed)
}

export function subscribeMerchantSync(
  topics: MerchantSyncTopic[],
  listener: SyncListener,
): () => void {
  const normalized = topics.length > 0 ? topics : (['all'] as MerchantSyncTopic[])
  for (const topic of normalized) {
    if (!listeners.has(topic)) listeners.set(topic, new Set())
    listeners.get(topic)!.add(listener)
  }
  return () => {
    for (const topic of normalized) {
      listeners.get(topic)?.delete(listener)
    }
  }
}

export function emitMerchantSync(
  topics: MerchantSyncTopic[],
  reason: MerchantSyncReason,
): void {
  const incoming = topics.length > 0 ? topics : (['all'] as MerchantSyncTopic[])
  const called = new Set<SyncListener>()
  for (const [subscribed, set] of listeners.entries()) {
    if (!topicMatches(subscribed, incoming)) continue
    for (const fn of set) {
      if (called.has(fn)) continue
      called.add(fn)
      try {
        fn(reason, incoming)
      } catch {
        // ignore listener errors
      }
    }
  }
}

/** 商家端本地操作成功后立即触发相关 topic 刷新 */
export function notifyMerchantSync(
  topics: MerchantSyncTopic[],
  reason: MerchantSyncReason = 'local',
): void {
  emitMerchantSync(topics, reason)
}
