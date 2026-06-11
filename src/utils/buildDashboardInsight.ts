interface DashboardInsightInput {
  lang: 'zh' | 'en'
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
    return lang === 'zh'
      ? `有 ${pendingOrders} 笔待发货订单待处理，建议优先完成履约以保持店铺健康度。`
      : `${pendingOrders} order(s) awaiting fulfillment — prioritize shipping to protect shop health.`
  }

  if (todayOrders === 0) {
    if (healthIndex >= 90) {
      return lang === 'zh'
        ? '今日暂无新订单，店铺健康度表现优秀，可前往运营计划获取更多流量。'
        : 'No orders yet today. Shop health is strong — check your growth plan for more traffic.'
    }
    return lang === 'zh'
      ? '今日暂无新订单，建议优化商品详情与定价，并查看运营计划。'
      : 'No orders yet today — refine listings and review your growth plan.'
  }

  if (todaySales > yesterdaySales && yesterdaySales > 0) {
    const pct = Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100)
    return lang === 'zh'
      ? `今日销售额较昨日上升 ${pct}%，经营势头良好，可加大爆款推广。`
      : `Today's sales are up ${pct}% vs yesterday — momentum is strong. Consider promoting top sellers.`
  }

  if (goodRate >= 95 && healthIndex >= 90) {
    return lang === 'zh'
      ? '店铺口碑与健康度均处于高位，继续保持商品质量与发货时效。'
      : 'Reputation and health scores are excellent — maintain product quality and fulfillment speed.'
  }

  return lang === 'zh'
    ? '经营数据运行平稳，建议持续更新商品并关注流量转化表现。'
    : 'Metrics are steady — keep your catalog fresh and monitor conversion performance.'
}
