import { test } from 'node:test'
import assert from 'node:assert/strict'

import { PERIOD_PRESETS, buildPeriod, getDefaultPeriod } from './reportPeriods.js'

const DAY_MS = 86400000
const spanDays = (period) => Math.round((period.end - period.start) / DAY_MS)

test('PERIOD_PRESETS lists the six selectable ranges in order', () => {
  assert.deepEqual(
    PERIOD_PRESETS.map((preset) => preset.key),
    ['today', '7d', 'month', '30d', 'quarter', 'custom'],
  )
})

test('buildPeriod today spans one day at day granularity', () => {
  const period = buildPeriod('today')
  assert.equal(period.key, 'today')
  assert.equal(period.label, '今日')
  assert.equal(period.granularity, 'day')
  assert.equal(period.start.getHours(), 0)
  assert.equal(spanDays(period), 1)
})

test('buildPeriod 7d covers a rolling seven-day window', () => {
  const period = buildPeriod('7d')
  assert.equal(period.granularity, 'day')
  assert.equal(spanDays(period), 7)
})

test('buildPeriod 30d covers a rolling thirty-day window', () => {
  const period = buildPeriod('30d')
  assert.equal(spanDays(period), 30)
})

test('buildPeriod quarter starts on a quarter boundary at week granularity', () => {
  const period = buildPeriod('quarter')
  assert.equal(period.granularity, 'week')
  assert.equal(period.start.getDate(), 1)
  assert.equal(period.start.getMonth() % 3, 0)
})

test('buildPeriod custom parses local dates and makes the end exclusive', () => {
  const period = buildPeriod('custom', '2024-01-01', '2024-01-31')
  assert.equal(period.key, 'custom')
  assert.equal(period.label, '自訂')
  assert.equal(period.start.getFullYear(), 2024)
  assert.equal(period.start.getMonth(), 0)
  assert.equal(period.start.getDate(), 1)
  // end is exclusive — the day after 2024-01-31
  assert.equal(period.end.getMonth(), 1)
  assert.equal(period.end.getDate(), 1)
  assert.equal(period.granularity, 'day')
})

test('buildPeriod custom widens granularity for longer spans', () => {
  assert.equal(buildPeriod('custom', '2024-01-01', '2024-03-15').granularity, 'week')
  assert.equal(buildPeriod('custom', '2024-01-01', '2024-12-31').granularity, 'month')
})

test('buildPeriod falls back to the current month for unknown keys', () => {
  const period = buildPeriod('nope')
  assert.equal(period.label, '本月')
  assert.equal(period.granularity, 'day')
  assert.equal(period.start.getDate(), 1)
})

test('getDefaultPeriod returns the current month', () => {
  const period = getDefaultPeriod()
  assert.equal(period.key, 'month')
  assert.equal(period.label, '本月')
  assert.equal(period.start.getDate(), 1)
})
