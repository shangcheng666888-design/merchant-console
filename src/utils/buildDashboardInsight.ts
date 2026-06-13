import type { Lang } from '../i18n/lang'
import { tr } from '../i18n/tr'

interface DashboardInsightInput {
  lang: Lang
  healthIndex: number
  todayOrders: number
  todaySales: number
  yesterdaySales: number
  pendingOrders: number
  goodRate: number
}

export function buildDashboardInsight(input: DashboardInsightInput): string {
  const { lang, healthIndex, todayOrders, todaySales, yesterdaySales, pendingOrders, goodRate } = input

  if (pendingOrders > 0) {
    return tr(lang, {
      zh: `有 ${pendingOrders} 笔待发货订单待处理，建议优先完成履约以保持店铺健康度。`,
      en: `${pendingOrders} order(s) awaiting fulfillment — prioritize shipping to protect shop health.`,
      de: `${pendingOrders} Bestellung(en) warten auf Versand — priorisieren Sie die Abwicklung, um die Shop-Gesundheit zu erhalten.`,
      ja: `発送待ちの注文が ${pendingOrders} 件あります。店舗の健全性を保つため、優先的に出荷対応することをおすすめします。`,
      ko: `발송 대기 주문 ${pendingOrders}건이 있습니다. 매장 건강도 유지를 위해 우선 처리하세요.`,
      es: `${pendingOrders} pedido(s) pendiente(s) de envío: prioriza el cumplimiento para mantener la salud de la tienda.`,
      it: `${pendingOrders} ordine/i in attesa di evasione: dai priorità alle spedizioni per proteggere la salute del negozio.`, vi: `${pendingOrders} đơn hàng chờ giao — hãy ưu tiên xử lý để duy trì sức khỏe cửa hàng.`,
    })
  }

  if (todayOrders === 0) {
    if (healthIndex >= 90) {
      return tr(lang, {
        zh: '今日暂无新订单，店铺健康度表现优秀，可前往运营计划获取更多流量。',
        en: 'No orders yet today. Shop health is strong — check your growth plan for more traffic.',
        de: 'Heute noch keine Bestellungen. Die Shop-Gesundheit ist ausgezeichnet — prüfen Sie Ihren Wachstumsplan für mehr Traffic.',
        ja: '本日はまだ新規注文がありません。店舗の健全性は良好です。運営プランでさらに集客を検討してください。',
        ko: '오늘은 아직 신규 주문이 없습니다. 매장 건강도가 우수합니다. 운영 플랜에서 추가 트래픽을 확보해 보세요.',
        es: 'Aún no hay pedidos hoy. La salud de la tienda es excelente: revisa tu plan de crecimiento para obtener más tráfico.', it: 'Nessun ordine oggi. La salute del negozio è ottima: consulta il piano di crescita per più traffico.', vi: 'Chưa có đơn hàng hôm nay. Sức khỏe cửa hàng rất tốt — hãy xem kế hoạch tăng trưởng để có thêm lưu lượng.',
      })
    }
    return tr(lang, {
      zh: '今日暂无新订单，建议优化商品详情与定价，并查看运营计划。',
      en: 'No orders yet today — refine listings and review your growth plan.',
      de: 'Heute noch keine Bestellungen — optimieren Sie Produktbeschreibungen und Preise und prüfen Sie Ihren Wachstumsplan.',
      ja: '本日はまだ新規注文がありません。商品詳細と価格の最適化、運営プランの確認をおすすめします。',
      ko: '오늘은 아직 신규 주문이 없습니다. 상품 상세와 가격을 최적화하고 운영 플랜을 확인해 보세요.',
      es: 'Aún no hay pedidos hoy: optimiza las fichas de producto y revisa tu plan de crecimiento.', it: 'Nessun ordine oggi: ottimizza le schede prodotto e rivedi il piano di crescita.', vi: 'Chưa có đơn hàng hôm nay — hãy tối ưu mô tả sản phẩm và xem lại kế hoạch tăng trưởng.',
    })
  }

  if (todaySales > yesterdaySales && yesterdaySales > 0) {
    const pct = Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
    return tr(lang, {
      zh: `今日销售额较昨日上升 ${pct}%，经营势头良好，可加大爆款推广。`,
      en: `Today's sales are up ${pct}% vs yesterday — momentum is strong. Consider promoting top sellers.`,
      de: `Der heutige Umsatz liegt ${pct} % über gestern — das Momentum ist stark. Erwägen Sie die Bewerbung Ihrer Bestseller.`,
      ja: `本日の売上は昨日比 ${pct}% 増加しています。好調な勢いです。人気商品のプロモーション強化を検討してください。`,
      ko: `오늘 매출이 어제 대비 ${pct}% 증가했습니다. 호조세를 이어가며 인기 상품 프로모션을 강화해 보세요.`,
      es: `Las ventas de hoy suben un ${pct}% respecto a ayer: el impulso es fuerte. Considera promocionar tus productos estrella.`,
      it: `Le vendite di oggi sono in aumento del ${pct}% rispetto a ieri: ottimo slancio. Considera di promuovere i prodotti più venduti.`, vi: `Doanh thu hôm nay tăng ${pct}% so với hôm qua — đà kinh doanh tốt. Hãy cân nhắc quảng bá sản phẩm bán chạy.`,
    })
  }

  if (goodRate >= 95 && healthIndex >= 90) {
    return tr(lang, {
      zh: '店铺口碑与健康度均处于高位，继续保持商品质量与发货时效。',
      en: 'Reputation and health scores are excellent — maintain product quality and fulfillment speed.',
      de: 'Reputation und Gesundheitswerte sind ausgezeichnet — halten Sie Produktqualität und Versandgeschwindigkeit aufrecht.',
      ja: '店舗の評判と健全性スコアはいずれも高水準です。商品品質と発送スピードを維持してください。',
      ko: '매장 평판과 건강도가 모두 높은 수준입니다. 상품 품질과 발송 속도를 유지해 주세요.',
      es: 'La reputación y la salud de la tienda son excelentes: mantén la calidad del producto y la rapidez en los envíos.', it: 'Reputazione e salute del negozio sono eccellenti: mantieni qualità del prodotto e velocità di evasione.', vi: 'Uy tín và sức khỏe cửa hàng đều ở mức cao — hãy duy trì chất lượng sản phẩm và tốc độ giao hàng.',
    })
  }

  return tr(lang, {
    zh: '经营数据运行平稳，建议持续更新商品并关注流量转化表现。',
    en: 'Metrics are steady — keep your catalog fresh and monitor conversion performance.',
    de: 'Die Kennzahlen sind stabil — halten Sie Ihren Katalog aktuell und beobachten Sie die Conversion-Rate.',
    ja: '経営指標は安定しています。商品の更新を継続し、トラフィックのコンバージョン状況に注目してください。',
    ko: '경영 지표가 안정적입니다. 상품을 꾸준히 업데이트하고 전환 성과를 모니터링하세요.',
    es: 'Las métricas son estables: mantén el catálogo actualizado y vigila el rendimiento de conversión.', it: 'Le metriche sono stabili: mantieni il catalogo aggiornato e monitora le conversioni.', vi: 'Chỉ số kinh doanh ổn định — hãy cập nhật sản phẩm và theo dõi hiệu suất chuyển đổi.',
  })
}
