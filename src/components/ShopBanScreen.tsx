import React from 'react'
import { useLang } from '../context/LangContext'
import { openCrispChat } from '../utils/crispChat'
import { formatDateTime } from '../utils/datetime'
import type { MerchantShop } from '../context/MerchantShopContext'
import { tr } from '../i18n'
import loginTrustSupport from '../assets/login-trust-support.png'

interface ShopBanScreenProps {
  shop: MerchantShop
  onLogout: () => void
}

const ShopBanScreen: React.FC<ShopBanScreenProps> = ({ shop, onLogout }) => {
  const { lang } = useLang()
  const reason =
    shop.banReason?.trim() ||
    tr(lang, { zh: '违反平台经营规范', en: 'Violation of platform policies', de: 'Verstoß gegen Plattformrichtlinien', ja: 'プラットフォーム規約違反', ko: '플랫폼 운영 정책 위반', es: 'Incumplimiento de las políticas de la plataforma', it: 'Violazione delle policy della piattaforma', vi: 'Vi phạm quy định của nền tảng' })
  const notice = shop.banNotice?.trim()

  const handleAppeal = () => {
    const appealMessage = tr(lang, {
      zh: `您好，我的店铺 ${shop.id}（${shop.name}）已被封禁，封禁原因：${reason}。我想申请复核，请协助处理。`,
      en: `Hello, my shop ${shop.id} (${shop.name}) was suspended. Reason: ${reason}. I would like to submit an appeal.`,
      de: `Hallo, mein Shop ${shop.id} (${shop.name}) wurde gesperrt. Grund: ${reason}. Ich möchte einen Einspruch einlegen.`,
      ja: `こんにちは。店舗 ${shop.id}（${shop.name}）が停止されました。理由：${reason}。再審査を申請したいです。ご対応をお願いします。`,
      ko: `안녕하세요. 매장 ${shop.id}(${shop.name})이(가) 중지되었습니다. 사유: ${reason}. 재심사를 신청하고 싶습니다. 도와주세요.`,
      es: `Hola, mi tienda ${shop.id} (${shop.name}) ha sido suspendida. Motivo: ${reason}. Me gustaría presentar una apelación.`,
      it: `Salve, il mio negozio ${shop.id} (${shop.name}) è stato sospeso. Motivo: ${reason}. Vorrei presentare un ricorso.`, vi: `Xin chào, cửa hàng ${shop.id} (${shop.name}) của tôi đã bị đình chỉ. Lý do: ${reason}. Tôi muốn gửi yêu cầu xem xét lại.`,
    })
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
          {tr(lang, { zh: '店铺已暂停经营', en: 'Shop suspended', de: 'Shop gesperrt', ja: '店舗の営業が停止されました', ko: '매장 운영 일시 중지', es: 'Tienda suspendida', it: 'Negozio sospeso', vi: 'Cửa hàng bị đình chỉ' })}
        </h1>
        <p className="mc-shop-ban-lead">
          {tr(lang, {
            zh: `您的店铺「${shop.name}」已被平台暂停。前台用户暂时无法访问，相关经营功能已冻结。`,
            en: `Your shop "${shop.name}" has been suspended. Storefront access and trading features are temporarily disabled.`,
            de: `Ihr Shop „${shop.name}" wurde gesperrt. Der Shop ist für Käufer nicht erreichbar; Handelsfunktionen sind vorübergehend deaktiviert.`,
            ja: `店舗「${shop.name}」はプラットフォームにより停止されました。ストアフロントへのアクセスと経営機能は一時的に利用できません。`,
            ko: `매장 「${shop.name}」이(가) 플랫폼에 의해 일시 중지되었습니다. 쇼핑몰 접근과 경영 기능이 일시적으로 제한됩니다.`,
            es: `Tu tienda «${shop.name}» ha sido suspendida por la plataforma. El acceso a la tienda y las funciones de venta están temporalmente desactivados.`,
            it: `Il tuo negozio "${shop.name}" è stato sospeso. L'accesso al negozio e le funzioni di vendita sono temporaneamente disattivati.`, vi: `Cửa hàng "${shop.name}" của bạn đã bị đình chỉ. Khách hàng tạm thời không thể truy cập và các chức năng kinh doanh đã bị đóng băng.`,
          })}
        </p>

        <dl className="mc-shop-ban-meta">
          <div className="mc-shop-ban-meta-row">
            <dt>{tr(lang, { zh: '店铺 ID', en: 'Shop ID', de: 'Shop-ID', ja: '店舗 ID', ko: '매장 ID', es: 'ID de la tienda', it: 'ID negozio', vi: 'ID cửa hàng' })}</dt>
            <dd>{shop.id}</dd>
          </div>
          <div className="mc-shop-ban-meta-row">
            <dt>{tr(lang, { zh: '封禁原因', en: 'Reason', de: 'Grund', ja: '停止理由', ko: '중지 사유', es: 'Motivo', it: 'Motivo', vi: 'Lý do' })}</dt>
            <dd>{reason}</dd>
          </div>
          {notice && (
            <div className="mc-shop-ban-meta-row">
              <dt>{tr(lang, { zh: '平台说明', en: 'Notice', de: 'Hinweis', ja: 'プラットフォームからのお知らせ', ko: '플랫폼 안내', es: 'Aviso de la plataforma', it: 'Avviso', vi: 'Thông báo' })}</dt>
              <dd>{notice}</dd>
            </div>
          )}
          <div className="mc-shop-ban-meta-row">
            <dt>{tr(lang, { zh: '封禁时间', en: 'Suspended at', de: 'Gesperrt am', ja: '停止日時', ko: '중지 일시', es: 'Suspendida el', it: 'Sospeso il', vi: 'Đình chỉ lúc' })}</dt>
            <dd>{shop.bannedAt ? formatDateTime(shop.bannedAt, lang) : '—'}</dd>
          </div>
        </dl>

        <div className="mc-shop-ban-effects">
          <p className="mc-shop-ban-effects-title">
            {tr(lang, { zh: '当前影响', en: 'What this means', de: 'Was das bedeutet', ja: '現在の影響', ko: '현재 영향', es: 'Qué implica', it: 'Cosa significa', vi: 'Ảnh hưởng hiện tại' })}
          </p>
          <ul className="mc-shop-ban-effects-list">
            <li>{tr(lang, { zh: '商城前台不可浏览您的店铺与商品', en: 'Your storefront is hidden from buyers', de: 'Ihr Shop ist für Käufer nicht sichtbar', ja: 'ストアフロントで店舗と商品が閲覧できません', ko: '쇼핑몰에서 매장과 상품을 볼 수 없습니다', es: 'Tu tienda y productos no son visibles para los compradores', it: 'Il tuo negozio non è visibile agli acquirenti', vi: 'Khách hàng không thể xem cửa hàng và sản phẩm của bạn' })}</li>
            <li>{tr(lang, { zh: '无法上架、发货、充值提现等经营操作', en: 'Listing, shipping, and wallet actions are blocked', de: 'Einstellen, Versand und Wallet-Aktionen sind gesperrt', ja: '出品・発送・チャージ・出金などの操作ができません', ko: '상품 등록, 발송, 충전, 출금 등 경영 작업 불가', es: 'Publicar, enviar y operar la cartera están bloqueados', it: 'Pubblicazione, spedizione e operazioni sul portafoglio sono bloccate', vi: 'Không thể đăng sản phẩm, giao hàng, nạp hoặc rút tiền' })}</li>
            <li>{tr(lang, { zh: '可查看历史数据并联系客服申诉', en: 'You can review past data and contact support to appeal', de: 'Sie können historische Daten einsehen und den Support kontaktieren', ja: '過去データの閲覧とサポートへの異議申し立てが可能です', ko: '과거 데이터 조회 및 고객센터 이의 신청 가능', es: 'Puedes revisar datos históricos y contactar con soporte para apelar', it: 'Puoi consultare i dati storici e contattare l\'assistenza per un ricorso', vi: 'Bạn vẫn có thể xem dữ liệu lịch sử và liên hệ hỗ trợ để khiếu nại' })}</li>
          </ul>
        </div>

        <div className="mc-shop-ban-actions">
          <button type="button" className="mc-shop-ban-btn mc-shop-ban-btn--primary" onClick={handleAppeal}>
            <img src={loginTrustSupport} alt="" width={20} height={20} aria-hidden="true" />
            {tr(lang, { zh: '联系客服申诉', en: 'Contact support to appeal', de: 'Support kontaktieren', ja: 'サポートに異議申し立て', ko: '고객센터에 이의 신청', es: 'Contactar soporte para apelar', it: 'Contatta l\'assistenza per un ricorso', vi: 'Liên hệ hỗ trợ để khiếu nại' })}
          </button>
          <button type="button" className="mc-shop-ban-btn mc-shop-ban-btn--secondary" onClick={onLogout}>
            {tr(lang, { zh: '退出登录', en: 'Log out', de: 'Abmelden', ja: 'ログアウト', ko: '로그아웃', es: 'Cerrar sesión', it: 'Esci', vi: 'Đăng xuất' })}
          </button>
        </div>

        <p className="mc-shop-ban-footnote">
          {tr(lang, {
            zh: '申诉时请说明店铺 ID 与具体情况，客服将在 1–3 个工作日内回复。',
            en: 'Include your shop ID and details in your appeal. Support typically responds within 1–3 business days.',
            de: 'Geben Sie Ihre Shop-ID und Details an. Der Support antwortet in der Regel innerhalb von 1–3 Werktagen.',
            ja: '異議申し立ての際は店舗 ID と詳細をお知らせください。サポートは通常 1〜3 営業日以内に返信します。',
            ko: '이의 신청 시 매장 ID와 상세 내용을 알려 주세요. 고객센터는 보통 1–3 영업일 내 답변합니다.',
            es: 'Incluye el ID de tu tienda y los detalles en la apelación. Soporte suele responder en 1–3 días hábiles.', it: 'Includi l\'ID del negozio e i dettagli nel ricorso. L\'assistenza risponde di solito entro 1–3 giorni lavorativi.', vi: 'Vui lòng ghi rõ ID cửa hàng và chi tiết trong yêu cầu. Hỗ trợ thường phản hồi trong 1–3 ngày làm việc.',
          })}
        </p>
      </div>
    </div>
  )
}

export default ShopBanScreen
