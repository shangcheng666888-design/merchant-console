import React from 'react'
import { useLang } from '../context/LangContext'
import { openCrispChat } from '../utils/crispChat'
import { formatDateTime } from '../utils/datetime'
import type { MerchantShop } from '../context/MerchantShopContext'
import loginTrustSupport from '../assets/login-trust-support.png'

interface ShopBanScreenProps {
  shop: MerchantShop
  onLogout: () => void
}

const ShopBanScreen: React.FC<ShopBanScreenProps> = ({ shop, onLogout }) => {
  const { lang } = useLang()
  const reason =
    shop.banReason?.trim() ||
    (lang === 'zh' ? '违反平台经营规范' : 'Violation of platform policies')
  const notice = shop.banNotice?.trim()

  const handleAppeal = () => {
    const appealMessage =
      lang === 'zh'
        ? `您好，我的店铺 ${shop.id}（${shop.name}）已被封禁，封禁原因：${reason}。我想申请复核，请协助处理。`
        : `Hello, my shop ${shop.id} (${shop.name}) was suspended. Reason: ${reason}. I would like to submit an appeal.`
    openCrispChat({
      shopName: shop.name,
      shopId: shop.id,
      banReason: reason,
      appealMessage,
    })
  }

  return (
    <div className="mc-shop-ban-page">
      <div className="mc-shop-ban-card">
        <div className="mc-shop-ban-icon-wrap" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="32" height="32" className="mc-shop-ban-icon">
            <path
              fill="currentColor"
              d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 6h2v6h-2V7zm0 8h2v2h-2v-2z"
            />
          </svg>
        </div>
        <h1 className="mc-shop-ban-title">
          {lang === 'zh' ? '店铺已暂停经营' : 'Shop suspended'}
        </h1>
        <p className="mc-shop-ban-lead">
          {lang === 'zh'
            ? `您的店铺「${shop.name}」已被平台暂停。前台用户暂时无法访问，相关经营功能已冻结。`
            : `Your shop "${shop.name}" has been suspended. Storefront access and trading features are temporarily disabled.`}
        </p>

        <dl className="mc-shop-ban-meta">
          <div className="mc-shop-ban-meta-row">
            <dt>{lang === 'zh' ? '店铺 ID' : 'Shop ID'}</dt>
            <dd>{shop.id}</dd>
          </div>
          <div className="mc-shop-ban-meta-row">
            <dt>{lang === 'zh' ? '封禁原因' : 'Reason'}</dt>
            <dd>{reason}</dd>
          </div>
          {notice && (
            <div className="mc-shop-ban-meta-row">
              <dt>{lang === 'zh' ? '平台说明' : 'Notice'}</dt>
              <dd>{notice}</dd>
            </div>
          )}
          <div className="mc-shop-ban-meta-row">
            <dt>{lang === 'zh' ? '封禁时间' : 'Suspended at'}</dt>
            <dd>{shop.bannedAt ? formatDateTime(shop.bannedAt, lang) : '—'}</dd>
          </div>
        </dl>

        <div className="mc-shop-ban-effects">
          <p className="mc-shop-ban-effects-title">
            {lang === 'zh' ? '当前影响' : 'What this means'}
          </p>
          <ul className="mc-shop-ban-effects-list">
            <li>{lang === 'zh' ? '商城前台不可浏览您的店铺与商品' : 'Your storefront is hidden from buyers'}</li>
            <li>{lang === 'zh' ? '无法上架、发货、充值提现等经营操作' : 'Listing, shipping, and wallet actions are blocked'}</li>
            <li>{lang === 'zh' ? '可查看历史数据并联系客服申诉' : 'You can review past data and contact support to appeal'}</li>
          </ul>
        </div>

        <div className="mc-shop-ban-actions">
          <button type="button" className="mc-shop-ban-btn mc-shop-ban-btn--primary" onClick={handleAppeal}>
            <img src={loginTrustSupport} alt="" width={20} height={20} aria-hidden="true" />
            {lang === 'zh' ? '联系客服申诉' : 'Contact support to appeal'}
          </button>
          <button type="button" className="mc-shop-ban-btn mc-shop-ban-btn--secondary" onClick={onLogout}>
            {lang === 'zh' ? '退出登录' : 'Log out'}
          </button>
        </div>

        <p className="mc-shop-ban-footnote">
          {lang === 'zh'
            ? '申诉时请说明店铺 ID 与具体情况，客服将在 1–3 个工作日内回复。'
            : 'Include your shop ID and details in your appeal. Support typically responds within 1–3 business days.'}
        </p>
      </div>
    </div>
  )
}

export default ShopBanScreen
