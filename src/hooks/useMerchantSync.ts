import { useEffect, useRef } from 'react'
import {
  subscribeMerchantSync,
  type MerchantSyncReason,
  type MerchantSyncTopic,
} from '../sync/merchantSyncBus'

/**
 * 订阅全站 sync 事件，在数据版本变化或 SSE 推送时触发 onSync。
 * 页面挂载时默认立即执行一次 onSync('manual')。
 */
export function useMerchantSync(
  topics: MerchantSyncTopic[],
  onSync: (reason: MerchantSyncReason) => void | Promise<void>,
  options?: { enabled?: boolean; immediate?: boolean },
): void {
  const onSyncRef = useRef(onSync)
  onSyncRef.current = onSync
  const enabled = options?.enabled !== false
  const immediate = options?.immediate !== false

  useEffect(() => {
    if (!enabled) return

    const handler = (reason: MerchantSyncReason) => {
      void onSyncRef.current(reason)
    }

    const unsub = subscribeMerchantSync(topics, handler)
    if (immediate) {
      void onSyncRef.current('manual')
    }
    return unsub
  }, [enabled, immediate, topics.join('|')])
}
