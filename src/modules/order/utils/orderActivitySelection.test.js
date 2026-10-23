import { test } from 'node:test'
import assert from 'node:assert/strict'

import { resolveSelectedActivityId } from './orderActivitySelection.js'

const activities = [
  { activityId: 11, activityName: 'A' },
  { activityId: 22, activityName: 'B' },
  { activityId: 33, activityName: 'C' },
]

test('a fresh load selects the first activity', () => {
  assert.equal(resolveSelectedActivityId(activities, 22), 11)
  assert.equal(resolveSelectedActivityId(activities, ''), 11)
})

test('a fresh load of an empty list selects nothing', () => {
  assert.equal(resolveSelectedActivityId([], 22), '')
  assert.equal(resolveSelectedActivityId(null, 22), '')
  assert.equal(resolveSelectedActivityId(undefined, ''), '')
})

test('a refresh keeps the current activity while it is still in the list', () => {
  assert.equal(resolveSelectedActivityId(activities, 22, { preserveSelection: true }), 22)
})

test('a refresh keeps the current value as-is even when its type differs from the list', () => {
  // 網址參數是數字、其他來源可能是字串；回傳原值，避免因型別不同而被重新指派、觸發多餘的重新載入
  assert.equal(resolveSelectedActivityId(activities, '22', { preserveSelection: true }), '22')
})

test('a refresh falls back to the first activity when the current one left the list', () => {
  assert.equal(resolveSelectedActivityId(activities, 99, { preserveSelection: true }), 11)
})

test('a refresh falls back to the first activity when nothing was selected', () => {
  assert.equal(resolveSelectedActivityId(activities, '', { preserveSelection: true }), 11)
})

test('a refresh of an empty list selects nothing', () => {
  assert.equal(resolveSelectedActivityId([], 22, { preserveSelection: true }), '')
})
