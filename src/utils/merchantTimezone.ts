/** 商家端请求统计接口时附带浏览器本地 IANA 时区 */

export function getMerchantTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (typeof tz === 'string' && tz.trim()) return tz.trim()
  } catch {
    // ignore
  }
  return 'UTC'
}

export function appendTimezoneQuery(path: string): string {
  const tz = getMerchantTimezone()
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}tz=${encodeURIComponent(tz)}`
}
