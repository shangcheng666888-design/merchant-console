import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { api, apiBase } from '../api/client'
import {
  emitMerchantSync,
  MERCHANT_SYNC_POLL_MS,
  type MerchantSyncTopic,
  type ShopSyncSnapshot,
} from '../sync/merchantSyncBus'

interface MerchantAuth {
  userId: string
  shopId: string
}

interface MerchantSyncContextValue {
  snapshot: ShopSyncSnapshot | null
  lastVersion: number | null
  connected: boolean
  forceSync: () => Promise<void>
}

const MerchantSyncContext = createContext<MerchantSyncContextValue | undefined>(undefined)

function readMerchantAuth(): MerchantAuth | null {
  try {
    const raw = window.localStorage.getItem('authUser')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { id?: string; shopId?: string }
    const userId = typeof parsed.id === 'string' ? parsed.id.trim() : ''
    const shopId = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
    if (!userId || !shopId) return null
    return { userId, shopId }
  } catch {
    return null
  }
}

function parseSseTopics(raw: unknown): MerchantSyncTopic[] {
  if (!Array.isArray(raw)) return ['all']
  const allowed = new Set<MerchantSyncTopic>([
    'shop',
    'dashboard',
    'orders',
    'wallet',
    'warehouse',
    'finance',
    'promotion',
    'all',
  ])
  const topics = raw.filter((t): t is MerchantSyncTopic => typeof t === 'string' && allowed.has(t as MerchantSyncTopic))
  return topics.length > 0 ? topics : ['all']
}

export const MerchantSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<ShopSyncSnapshot | null>(null)
  const [lastVersion, setLastVersion] = useState<number | null>(null)
  const [connected, setConnected] = useState(false)
  const lastVersionRef = useRef<number | null>(null)
  const pollingRef = useRef(false)

  const applySnapshot = useCallback((snap: ShopSyncSnapshot, topics: MerchantSyncTopic[], reason: 'poll' | 'sse' | 'visible' | 'manual') => {
    setSnapshot(snap)
    setLastVersion(snap.version)
    lastVersionRef.current = snap.version
    emitMerchantSync(topics, reason)
  }, [])

  const pollSync = useCallback(async (reason: 'poll' | 'visible' | 'manual') => {
    const auth = readMerchantAuth()
    if (!auth || pollingRef.current) return
    pollingRef.current = true
    try {
      const snap = await api.get<ShopSyncSnapshot>(
        `/api/shops/${encodeURIComponent(auth.shopId)}/sync?userId=${encodeURIComponent(auth.userId)}`,
      )
      const prev = lastVersionRef.current
      setSnapshot(snap)
      setLastVersion(snap.version)
      if (prev === null) {
        lastVersionRef.current = snap.version
        return
      }
      if (snap.version !== prev) {
        lastVersionRef.current = snap.version
        applySnapshot(snap, ['all'], reason)
      }
    } catch {
      // keep last snapshot
    } finally {
      pollingRef.current = false
    }
  }, [applySnapshot])

  const forceSync = useCallback(async () => {
    await pollSync('manual')
  }, [pollSync])

  useEffect(() => {
    const auth = readMerchantAuth()
    if (!auth) return

    void pollSync('manual')

    const onVisible = () => {
      if (document.visibilityState === 'visible') void pollSync('visible')
    }
    document.addEventListener('visibilitychange', onVisible)

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void pollSync('poll')
    }, MERCHANT_SYNC_POLL_MS)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [pollSync])

  useEffect(() => {
    const auth = readMerchantAuth()
    if (!auth) return

    const base = apiBase || ''
    const url = `${base}/api/merchant/events?shopId=${encodeURIComponent(auth.shopId)}&userId=${encodeURIComponent(auth.userId)}`
    let es: EventSource | null = null
    let reconnectTimer: number | null = null
    let closed = false

    const connect = () => {
      if (closed) return
      es = new EventSource(url)

      es.onopen = () => setConnected(true)
      es.onerror = () => {
        setConnected(false)
        es?.close()
        es = null
        if (!closed) {
          reconnectTimer = window.setTimeout(connect, 4000)
        }
      }

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as {
            type?: string
            version?: number | null
            topics?: unknown
          }
          if (data.type !== 'shop.sync') return
          const topics = parseSseTopics(data.topics)
          if (typeof data.version === 'number') {
            lastVersionRef.current = data.version
            setLastVersion(data.version)
            void pollSync('poll')
          }
          emitMerchantSync(topics, 'sse')
        } catch {
          // ignore malformed SSE payload
        }
      }
    }

    connect()

    return () => {
      closed = true
      setConnected(false)
      if (reconnectTimer != null) window.clearTimeout(reconnectTimer)
      es?.close()
    }
  }, [pollSync])

  return (
    <MerchantSyncContext.Provider value={{ snapshot, lastVersion, connected, forceSync }}>
      {children}
    </MerchantSyncContext.Provider>
  )
}

export function useMerchantSyncContext(): MerchantSyncContextValue {
  const ctx = useContext(MerchantSyncContext)
  if (!ctx) {
    throw new Error('useMerchantSyncContext must be used within MerchantSyncProvider')
  }
  return ctx
}
