import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createActivityTableColumns } from './activityTableColumns.js'

const makeColumns = () =>
  createActivityTableColumns({
    getActivityTypeName: (id) => `activity:${id}`,
    getAnimateTypeName: (id) => `animate:${id}`,
    stripHtml: (value) => `stripped:${value}`,
  })

test('createActivityTableColumns returns the expected keys, labels and sortable flags', () => {
  const columns = makeColumns()

  assert.deepEqual(
    columns.map((column) => [column.key, column.label, column.sortable]),
    [
      ['status', '活動狀態', true],
      ['activityPeriod', '活動期間', true],
      ['name', '活動名稱', true],
      ['image', '活動圖片', true],
      ['address', '活動地址', true],
      ['preOrder', '活動模式', true],
      ['shippingMode', '運費模式', true],
      ['groupBuyStatus', '開團狀態', true],
      ['activityType', '活動類型', true],
      ['animateType', '動漫', true],
      ['prepPeriod', '準備期間', true],
      ['info', '備註', true],
      ['actions', '操作', false],
    ],
  )
})

test('createActivityTableColumns getValue functions read activity fields and injected lookups', () => {
  const columns = makeColumns()
  const getValue = (key) => columns.find((column) => column.key === key).getValue

  assert.equal(
    getValue('activityPeriod')({ activityStartDate: '2024-01-01 00:00', activityEndDate: '2024-01-02 00:00' }),
    '2024-01-01 00:00 2024-01-02 00:00',
  )
  assert.equal(getValue('activityPeriod')({}), ' ')
  assert.equal(getValue('name')({ name: '夏祭' }), '夏祭')
  assert.equal(getValue('name')({}), '')
  assert.equal(getValue('image')({ image: '/a.png' }), '/a.png')
  assert.equal(getValue('address')({ address: '東京' }), '東京')
  assert.equal(getValue('status')({ statusText: '活動開始' }), '活動開始')
  assert.equal(getValue('preOrder')({ preOrderText: '預購' }), '預購')
  assert.equal(getValue('shippingMode')({ shippingModeText: '滿額免運' }), '滿額免運')
  assert.equal(getValue('groupBuyStatus')({ groupBuyStatusText: '募集中' }), '募集中')
  assert.equal(getValue('activityType')({ activityTypeId: 7 }), 'activity:7')
  assert.equal(getValue('animateType')({ animateTypeId: 9 }), 'animate:9')
  assert.equal(
    getValue('prepPeriod')({ prepStartDate: '2024-01-01 00:00', prepEndDate: '2024-01-02 00:00' }),
    '2024-01-01 00:00 2024-01-02 00:00',
  )
  assert.equal(getValue('info')({ info: '<p>hi</p>' }), 'stripped:<p>hi</p>')
})

test('createActivityTableColumns actions column has no getValue', () => {
  const actions = makeColumns().find((column) => column.key === 'actions')
  assert.equal(actions.getValue, undefined)
})
