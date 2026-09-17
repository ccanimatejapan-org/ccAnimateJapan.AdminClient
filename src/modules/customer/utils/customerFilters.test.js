import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CUSTOMER_TABS,
  getCustomerDisplayName,
  getCustomerStatusLabel,
  getCustomerTabCount,
} from './customerFilters.js'

test('tabs cover all, orders, and deleted states', () => {
  assert.deepEqual(
    CUSTOMER_TABS.map((tab) => tab.key),
    ['all', 'withOrders', 'noOrders', 'deleted'],
  )
})

test('tab counts fall back to zero', () => {
  assert.equal(getCustomerTabCount({ all: 4 }, 'all'), 4)
  assert.equal(getCustomerTabCount({}, 'withOrders'), 0)
})

test('display name prefers LINE name then contact name', () => {
  assert.equal(getCustomerDisplayName({ displayName: 'Ada', name: 'Lin', id: 3 }), 'Ada')
  assert.equal(getCustomerDisplayName({ name: 'Lin', id: 3 }), 'Lin')
  assert.equal(getCustomerDisplayName({ id: 3 }), '#3')
})

test('status label distinguishes deleted members', () => {
  assert.equal(getCustomerStatusLabel(false), '使用中')
  assert.equal(getCustomerStatusLabel(true), '已停用')
})
