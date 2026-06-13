import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import { useMerchantSync } from './useMerchantSync'

export interface MerchantDashboardBrief {
  pendingOrders: number
  todaySales: number
  todayOrders: number
}

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

function readCache(shopId: string): MerchantDashboardBrief {
  try {
    const raw = window.localStorage.getItem(`merchantDashboard:${shopId}`)
    if (!raw) return { pendingOrders: 0, todaySales: 0, todayOrders: 0 }
    const cached = JSON.parse(raw) as {
      pendingOrders?: number
      todaySales?: number
      todayOrders?: number
    }
    return {
      pendingOrders: cached.pendingOrders ?? 0,
      todaySales: Number(cached.todaySales ?? 0),
      todayOrders: cached.todayOrders ?? 0,
    }
  } catch {
    return { pendingOrders: 0, todaySales: 0, todayOrders: 0 }
  }
}

export function useMerchantDashboardBrief(enabled: boolean): MerchantDashboardBrief {
  const [brief, setBrief] = useState<MerchantDashboardBrief>({
    pendingOrders: 0,
    todaySales: 0,
    todayOrders: 0,
  })

  const refresh = useCallback(async () => {
    const shopId = readAuthShopId()
    if (!shopId) return
    setBrief(readCache(shopId))
    try {
      const res = await api.get<{
        pendingOrders?: number
        todaySales?: number
        todayOrders?: number
      }>(`/api/shops/${encodeURIComponent(shopId)}/dashboard`)
      const next = {
        pendingOrders: res.pendingOrders ?? 0,
        todaySales: Number(res.todaySales ?? 0),
        todayOrders: res.todayOrders ?? 0,
      }
      setBrief(next)
    } catch {
      // keep cache
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void refresh()
  }, [enabled, refresh])

  useMerchantSync(['dashboard', 'all'], () => refresh(), { enabled, immediate: false })

  return brief
}
