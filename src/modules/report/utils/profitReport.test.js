import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildProfitReport } from './profitReport.js'

test('buildProfitReport returns zeroed defaults for empty data', () => {
  const report = buildProfitReport(null)

  assert.equal(report.totals.operatingRevenue, 0)
  assert.equal(report.totals.totalCost, 0)
  assert.equal(report.totals.netProfit, 0)
  assert.equal(report.totals.netProfitRate, 0)
  assert.equal(report.totals.profitState.label, '打平')
  assert.equal(report.items.length, 0)
  assert.deepEqual(
    report.revenueBreakdown.map((item) => item.amount),
    [0, 0],
  )
  assert.deepEqual(
    report.costBreakdown.map((item) => item.amount),
    [0, 0],
  )
})

test('buildProfitReport maps canonical API fields without depending on deprecated fields', () => {
  const report = buildProfitReport({
    operatingRevenue: 740,
    productRevenue: 700,
    paidShippingRevenue: 40,
    productCost: 485,
    activityShippingCost: 90,
    totalCost: 575,
    netProfit: 165,
    netProfitRate: 165 / 740,
    revenue: 9999,
    estimatedCost: 9999,
    grossMargin: 9999,
    marginRate: 0.99,
    byProduct: [
      {
        productId: 102,
        name: 'P102',
        activityName: 'A1',
        qtySold: 1,
        operatingRevenue: 263,
        productRevenue: 250,
        paidShippingRevenue: 13,
        productCost: 125,
        activityShippingCost: 23,
        totalCost: 148,
        netProfit: 115,
        netProfitRate: 115 / 263,
        revenue: 1,
        cost: 2,
        margin: 3,
        marginRate: 0.04,
      },
    ],
  })

  assert.equal(report.stats[0].value, 740)
  assert.equal(report.stats[2].profitState.label, '獲利')
  assert.deepEqual(
    report.revenueBreakdown.map((item) => item.amount),
    [700, 40],
  )
  assert.deepEqual(
    report.costBreakdown.map((item) => item.amount),
    [485, 90],
  )
  assert.equal(report.items[0].operatingRevenue, 263)
  assert.equal(report.items[0].productRevenue, 250)
  assert.equal(report.items[0].productCost, 125)
  assert.equal(report.items[0].activityShippingCost, 23)
  assert.equal(report.items[0].netProfit, 115)
  assert.equal(report.items[0].profitState.label, '獲利')
})

test('buildProfitReport marks negative profit with explicit text state', () => {
  const report = buildProfitReport({
    operatingRevenue: 0,
    productRevenue: 0,
    paidShippingRevenue: 0,
    productCost: 7,
    activityShippingCost: 10,
    totalCost: 17,
    netProfit: -17,
    netProfitRate: 0,
    byProduct: [
      {
        productId: 401,
        qtySold: 1,
        operatingRevenue: 0,
        productRevenue: 0,
        paidShippingRevenue: 0,
        productCost: 3,
        activityShippingCost: 10,
        totalCost: 13,
        netProfit: -13,
        netProfitRate: 0,
      },
    ],
  })

  assert.equal(report.totals.profitState.label, '虧損')
  assert.equal(report.stats[3].profitState.label, '虧損')
  assert.equal(report.items[0].profitState.label, '虧損')
  assert.equal(report.items[0].profitState.isNegative, true)
})

test('buildProfitReport keeps zero canonical profit instead of deprecated gross margin', () => {
  const report = buildProfitReport({
    operatingRevenue: 100,
    productRevenue: 100,
    paidShippingRevenue: 0,
    productCost: 50,
    activityShippingCost: 50,
    totalCost: 100,
    netProfit: 0,
    netProfitRate: 0,
    grossMargin: 50,
    marginRate: 0.5,
    byProduct: [
      {
        productId: 901,
        operatingRevenue: 100,
        productRevenue: 100,
        paidShippingRevenue: 0,
        productCost: 50,
        activityShippingCost: 50,
        totalCost: 100,
        netProfit: 0,
        netProfitRate: 0,
        margin: 50,
        marginRate: 0.5,
      },
    ],
  })

  assert.equal(report.totals.netProfit, 0)
  assert.equal(report.totals.netProfitRate, 0)
  assert.equal(report.totals.profitState.label, '打平')
  assert.equal(report.items[0].netProfit, 0)
  assert.equal(report.items[0].netProfitRate, 0)
  assert.equal(report.items[0].profitState.label, '打平')
})