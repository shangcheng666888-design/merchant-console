import { Crisp } from 'crisp-sdk-web'

const CRISP_WEBSITE_ID = 'f8505941-c283-456f-a52b-cd1d13b1d00c'

function readCrispLocale(): 'zh' | 'en' {
  try {
    const stored = localStorage.getItem('site_lang')
    return stored === 'en' || stored === 'zh' ? stored : 'zh'
  } catch {
    return 'zh'
  }
}

let crispInitialized = false

/** 初始化 Crisp：默认隐藏浮窗，关闭后再次隐藏（配合自定义客服按钮）。 */
export function initCrisp(): void {
  if (crispInitialized || typeof window === 'undefined') return
  crispInitialized = true

  Crisp.configure(CRISP_WEBSITE_ID, {
    autoload: true,
    locale: readCrispLocale(),
  })

  Crisp.chat.hide()
  Crisp.chat.onChatClosed(() => {
    Crisp.chat.hide()
  })
}
