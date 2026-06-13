import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

export type ShopStatus = 'normal' | 'banned'

export interface MerchantShop {
  id: string
  name: string
  logo: string | null
  level: number
  creditScore: number
  walletBalance: number
  goodRate: number
  followers: number
  sales: number
  visits: number
  status: ShopStatus
  banReason: string | null
  banNotice: string | null
  bannedAt: string | null
}

interface MerchantShopContextValue {
  shop: MerchantShop | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  isBanned: boolean
}

const MerchantShopContext = createContext<MerchantShopContextValue | undefined>(undefined)

const SHOP_STATUS_POLL_MS = 60_000

function readAuthShopId(): string | null {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem('authUser') : null
    if (!raw) return null
    const parsed = JSON.parse(raw) as { shopId?: string | null }
    const shopId = typeof parsed.shopId === 'string' ? parsed.shopId.trim() : ''
    return shopId || null
  } catch {
    return null
  }
}

function mapShopResponse(res: {
  id: string
  name: string
  logo?: string | null
  level: number
  creditScore: number
  walletBalance: number
  goodRate: number
  followers: number
  sales: number
  visits: number
  status?: ShopStatus
  banReason?: string | null
  banNotice?: string | null
  bannedAt?: string | null
}): MerchantShop {
  return {
    id: res.id,
    name: res.name,
    logo: res.logo ?? null,
    level: res.level ?? 1,
    creditScore: Number(res.creditScore ?? 0),
    walletBalance: Number(res.walletBalance ?? 0),
    goodRate: Number(res.goodRate ?? 0),
    followers: Number(res.followers ?? 0),
    sales: Number(res.sales ?? 0),
    visits: Number(res.visits ?? 0),
    status: res.status === 'banned' ? 'banned' : 'normal',
    banReason: res.banReason ?? null,
    banNotice: res.banNotice ?? null,
    bannedAt: res.bannedAt ?? null,
  }
}

export const MerchantShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shop, setShop] = useState<MerchantShop | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchShop = useCallback(async (silent = false) => {
    const shopId = readAuthShopId()
    if (!shopId) {
      setShop(null)
      setLoading(false)
      setError('未找到店铺信息')
      return
    }
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await api.get<Parameters<typeof mapShopResponse>[0]>(
        `/api/shops/${encodeURIComponent(shopId)}`,
      )
      setShop(mapShopResponse(res))
      setError(null)
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string'
          ? String((e as { message: string }).message).trim()
          : '无法加载店铺信息'
      setError(msg || '无法加载店铺信息')
      if (!silent) setShop(null)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShop(false)
  }, [fetchShop])

  useEffect(() => {
    const timer = window.setInterval(() => {
      fetchShop(true)
    }, SHOP_STATUS_POLL_MS)
    return () => window.clearInterval(timer)
  }, [fetchShop])

  const isBanned = shop?.status === 'banned'

  return (
    <MerchantShopContext.Provider
      value={{
        shop,
        loading,
        error,
        refresh: () => fetchShop(true),
        isBanned,
      }}
    >
      {children}
    </MerchantShopContext.Provider>
  )
}

export function useMerchantShop(): MerchantShopContextValue {
  const ctx = useContext(MerchantShopContext)
  if (!ctx) {
    throw new Error('useMerchantShop must be used within MerchantShopProvider')
  }
  return ctx
}
