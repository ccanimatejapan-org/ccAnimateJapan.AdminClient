import { test } from 'node:test'
import assert from 'node:assert/strict'

import { formatCurrency, formatDateTime, formatNumber, formatPercent } from './format.js'

test('formatNumber groups thousands and rounds to an integer', () => {
  assert.equal(formatNumber(1234567), '1,234,567')
  assert.equal(formatNumber(0), '0')
  assert.equal(formatNumber(null), '0')
  assert.equal(formatNumber(undefined), '0')
  assert.equal(formatNumber(1234.6), '1,235')
})

test('formatPercent scales by 100 with fixed digits', () => {
  assert.equal(formatPercent(0.1234), '12.3%')
  assert.equal(formatPercent(0.5, 2), '50.00%')
  assert.equal(formatPercent(0), '0.0%')
  assert.equal(formatPercent(null), '0.0%')
})

test('formatCurrency formats TWD with grouping and no decimals', () => {
  const formatted = formatCurrency(1234)
  assert.equal(typeof formatted, 'string')
  assert.ok(formatted.includes('1,234'), `expected thousands grouping in "${formatted}"`)
  assert.ok(formatCurrency(0).includes('0'))
  assert.ok(formatCurrency(1234.9).includes('1,235'), 'rounds to a whole TWD amount')
  assert.ok(!formatCurrency(1000).includes('.'), 'has no fractional part')
})

test('formatDateTime returns a placeholder for blank or invalid values', () => {
  assert.equal(formatDateTime(''), '-')
  assert.equal(formatDateTime(null), '-')
  assert.equal(formatDateTime(undefined), '-')
  assert.equal(formatDateTime('not-a-date'), '-')
})

test('formatDateTime renders zero-padded YYYY/MM/DD HH:mm in local time', () => {
  const value = new Date(2024, 0, 5, 9, 7) // 2024-01-05 09:07 local time
  assert.equal(formatDateTime(value), '2024/01/05 09:07')
})
