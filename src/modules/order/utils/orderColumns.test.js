import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createOrderColumns } from './orderColumns.js'

test('createOrderColumns returns the expected column keys, labels and sortable flags', () => {
  const columns = createOrderColumns()

  assert.deepEqual(
    columns.map((column) => [column.key, column.label, column.sortable]),
    [
      ['id', '訂單', true],
      ['subscriberName', '訂購人', true],
      ['subscriberBank', '帳號後五碼', true],
      ['total', '金額', true],
      ['orderStatus', '訂單狀態', true],
      ['createdAt', '建立時間', true],
      ['actions', '', false],
    ],
  )
})

test('createOrderColumns getValue functions coerce values purely', () => {
  const columns = createOrderColumns()
  const getValue = (key) => columns.find((column) => column.key === key).getValue

  assert.equal(getValue('id')({ id: '5' }), 5)
  assert.equal(getValue('id')({}), 0)
  assert.equal(getValue('subscriberName')({ subscriberName: '王小明' }), '王小明')
  assert.equal(getValue('subscriberName')({}), '')
  assert.equal(getValue('subscriberBank')({ subscriberBank: '12345' }), '12345')
  assert.equal(getValue('total')({ grandTotal: '1200' }), 1200)
  assert.equal(getValue('total')({}), 0)
  assert.equal(getValue('orderStatus')({ orderStatus: '3' }), 3)

  const createdAt = getValue('createdAt')({ createdAt: '2024-01-02T03:04:05Z' })
  assert.ok(createdAt instanceof Date)
  assert.equal(createdAt.getTime(), new Date('2024-01-02T03:04:05Z').getTime())
  assert.equal(getValue('createdAt')({}).getTime(), new Date(0).getTime())
})

test('createOrderColumns returns a fresh array each call', () => {
  assert.notEqual(createOrderColumns(), createOrderColumns())
})
