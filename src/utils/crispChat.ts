import { Crisp } from 'crisp-sdk-web'
import { initCrisp } from './crispInit'

export interface CrispChatOptions {
  /** 店铺名称，会传给 Crisp 会话数据，客服端可见 */
  shopName?: string
  /** 店铺 ID，会传给 Crisp 会话数据，客服端可见 */
  shopId?: string
  /** 封禁原因（申诉场景） */
  banReason?: string
  /** 预填申诉消息 */
  appealMessage?: string
}

/**
 * 打开 Crisp 客服聊天窗口（配合自定义客服图标使用，默认 Crisp 按钮已在初始化时隐藏）。
 * 传入 options.shopName / options.shopId 时，会写入 Crisp 的 session:data，客服在会话中可看到「来自哪家店铺」。
 */
export function openCrispChat(options?: CrispChatOptions): boolean {
  if (typeof window === 'undefined') return false

  initCrisp()

  const shopName = options?.shopName != null ? String(options.shopName).trim() : ''
  const shopId = options?.shopId != null ? String(options.shopId).trim() : ''

  if (shopName) {
    Crisp.user.setNickname(shopName)
  }

  const sessionData: Record<string, string> = {}
  if (shopName) sessionData.shop_name = shopName
  if (shopId) sessionData.shop_id = shopId
  const banReason = options?.banReason != null ? String(options.banReason).trim() : ''
  if (banReason) sessionData.ban_reason = banReason
  if (options?.appealMessage) sessionData.appeal_type = 'shop_ban'
  if (Object.keys(sessionData).length > 0) {
    Crisp.session.setData(sessionData)
  }

  const appealMessage = options?.appealMessage != null ? String(options.appealMessage).trim() : ''
  if (appealMessage) {
    Crisp.message.setMessageText(appealMessage)
  }

  // chat:hide 后必须先 show 再 open，否则窗口不可见
  Crisp.chat.show()
  Crisp.chat.open()
  return true
}
