import { test } from 'node:test'
import assert from 'node:assert/strict'

import { ActivityEnum } from '@/modules/activity/utils/activityMapper'
import {
  ORDERABLE_ACTIVITY_STATUSES,
  getActivityKindText,
  getActivityStatusBadge,
  isActivityReadOnly,
} from './activityOrderStatus.js'

test('ORDERABLE_ACTIVITY_STATUSES only covers started', () => {
  assert.deepEqual(ORDERABLE_ACTIVITY_STATUSES, [ActivityEnum.Started])
})

test('isActivityReadOnly is false only for started status', () => {
  assert.equal(isActivityReadOnly({ status: ActivityEnum.Started }), false)
  assert.equal(isActivityReadOnly({ status: ActivityEnum.Preparing }), true)
  assert.equal(isActivityReadOnly({ status: ActivityEnum.NotStarted }), true)
  assert.equal(isActivityReadOnly({ status: ActivityEnum.PreparationEnded }), true)
  assert.equal(isActivityReadOnly({ status: ActivityEnum.Ended }), true)
  assert.equal(isActivityReadOnly(null), false)
})

test('getActivityStatusBadge labels only the read-only statuses including legacy values', () => {
  assert.equal(getActivityStatusBadge({ status: ActivityEnum.NotStarted }), '尚未開始')
  assert.equal(getActivityStatusBadge({ status: ActivityEnum.Preparing }), '準備中')
  assert.equal(getActivityStatusBadge({ status: ActivityEnum.PreparationEnded }), '準備結束')
  assert.equal(getActivityStatusBadge({ status: ActivityEnum.Ended }), '已結束')
  assert.equal(getActivityStatusBadge({ status: ActivityEnum.Started }), '')
})

test('getActivityKindText reflects the pre-order flag', () => {
  assert.equal(getActivityKindText({ isPreOrder: true }), '預購')
  assert.equal(getActivityKindText({ isPreOrder: false }), '現貨')
  assert.equal(getActivityKindText({}), '現貨')
})
