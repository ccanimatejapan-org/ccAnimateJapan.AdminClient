const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const buildProfitState = (netProfit) => {
  if (netProfit < 0) {
    return { label: '虧損', tone: 'negative', isNegative: true }
  }

  if (netProfit > 0) {
    return { label: '獲利', tone: 'positive', isNegative: false }
  }

  return { label: '打平', tone: 'neutral', isNegative: false }
}

const normalizeProductItem = (item) => {
  const netProfit = toNumber(item?.netProfit)

  return {
    productId: toNumber(item?.productId),
    name: item?.name || '',
    activityName: item?.activityName || '',
    qtySold: toNumber(item?.qtySold),
    operatingRevenue: toNumber(item?.operatingRevenue),
    productRevenue: toNumber(item?.productRevenue),
    paidShippingRevenue: toNumber(item?.paidShippingRevenue),
    productCost: toNumber(item?.productCost),
    activityShippingCost: toNumber(item?.activityShippingCost),
    totalCost: toNumber(item?.totalCost),
    netProfit,
    netProfitRate: toNumber(item?.netProfitRate),
    profitState: buildProfitState(netProfit),
  }
}

export const buildProfitReport = (data) => {
  const totals = {
    operatingRevenue: toNumber(data?.operatingRevenue),
    productRevenue: toNumber(data?.productRevenue),
    paidShippingRevenue: toNumber(data?.paidShippingRevenue),
    productCost: toNumber(data?.productCost),
    activityShippingCost: toNumber(data?.activityShippingCost),
    totalCost: toNumber(data?.totalCost),
    netProfit: toNumber(data?.netProfit),
    netProfitRate: toNumber(data?.netProfitRate),
  }
  const totalProfitState = buildProfitState(totals.netProfit)
  const items = Array.isArray(data?.byProduct) ? data.byProduct.map(normalizeProductItem) : []

  return {
    totals: {
      ...totals,
      profitState: totalProfitState,
    },
    stats: [
      { key: 'operatingRevenue', label: '營業額', type: 'currency', value: totals.operatingRevenue },
      { key: 'totalCost', label: '總成本', type: 'currency', value: totals.totalCost },
      { key: 'netProfit', label: '淨利', type: 'currency', value: totals.netProfit, profitState: totalProfitState },
      { key: 'netProfitRate', label: '淨利率', type: 'percent', value: totals.netProfitRate, profitState: totalProfitState },
    ],
    revenueBreakdown: [
      { key: 'productRevenue', label: '商品營收', amount: totals.productRevenue },
      { key: 'paidShippingRevenue', label: '已收補運費', amount: totals.paidShippingRevenue },
    ],
    costBreakdown: [
      { key: 'productCost', label: '商品成本', amount: totals.productCost },
      { key: 'activityShippingCost', label: '分攤活動運費', amount: totals.activityShippingCost },
    ],
    items,
    notes: [
      '僅計已收款且訂單狀態為已付款至完成的訂單。',
      '營業額 = 商品營收 + 已收補運費。',
      '淨利只扣商品成本與活動運費，未含其他營運費用；商品成本以目前主檔估算。',
      '商品明細依淨利排序，最多顯示 10 筆；上方總計仍包含所有合格商品。',
    ],
  }
}