import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  WISH_POOL_DECISIONS,
  getWishPoolDecisionBadgeClass,
  getWishPoolDecisionLabel,
  getWishPoolTabCount,
  isSafeHttpUrl,
  isWishPoolDecision,
} from './wishPoolDecisions.js'

test('isWishPoolDecision only accepts Pending/Opened/NotOpened', () => {
  assert.equal(isWishPoolDecision('Pending'), true)
  assert.equal(isWishPoolDecision('Opened'), true)
  assert.equal(isWishPoolDecision('NotOpened'), true)
  assert.equal(isWishPoolDecision('Formed'), false)
  assert.equal(isWishPoolDecision('pending'), false)
})

test('getWishPoolDecisionLabel maps known values and falls back', () => {
  assert.equal(getWishPoolDecisionLabel(WISH_POOL_DECISIONS.PENDING), '尚未回覆')
  assert.equal(getWishPoolDecisionLabel(WISH_POOL_DECISIONS.OPENED), '已開團')
  assert.equal(getWishPoolDecisionLabel(WISH_POOL_DECISIONS.NOT_OPENED), '不開團')
  assert.equal(getWishPoolDecisionLabel('Nope'), '未知狀態')
})

test('getWishPoolDecisionBadgeClass maps decision styles', () => {
  assert.equal(getWishPoolDecisionBadgeClass('Opened'), 'wish-pool-badge--opened')
  assert.equal(getWishPoolDecisionBadgeClass('NotOpened'), 'wish-pool-badge--not-opened')
  assert.equal(getWishPoolDecisionBadgeClass('Pending'), 'wish-pool-badge--pending')
  assert.equal(getWishPoolDecisionBadgeClass('x'), 'wish-pool-badge--unknown')
})

test('isSafeHttpUrl only allows http(s)', () => {
  assert.equal(isSafeHttpUrl('https://example.com/item'), true)
  assert.equal(isSafeHttpUrl('http://example.com'), true)
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false)
  assert.equal(isSafeHttpUrl('/relative'), false)
  assert.equal(isSafeHttpUrl(''), false)
})

test('getWishPoolTabCount reads counts safely', () => {
  assert.equal(getWishPoolTabCount({ pending: 3 }, 'pending'), 3)
  assert.equal(getWishPoolTabCount({}, 'all'), 0)
  assert.equal(getWishPoolTabCount(null, 'opened'), 0)
})
