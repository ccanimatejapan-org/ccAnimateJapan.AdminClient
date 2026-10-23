import { test } from 'node:test'
import assert from 'node:assert/strict'

import { matchesOrderKeyword } from './orderSearch.js'

const order = {
  id: 265,
  orderNo: 'CJ202610230003',
  subscriberName: '王小明',
  memberDisplayName: 'Amy Chen',
}

test('an empty or blank keyword matches every order, even one with missing fields', () => {
  assert.equal(matchesOrderKeyword(order, ''), true)
  assert.equal(matchesOrderKeyword(order, '   '), true)
  assert.equal(matchesOrderKeyword(order, undefined), true)
  assert.equal(matchesOrderKeyword({}, ''), true)
})

test('matches part of the order number, ignoring case', () => {
  assert.equal(matchesOrderKeyword(order, 'CJ202610230003'), true)
  assert.equal(matchesOrderKeyword(order, 'cj2026102300'), true)
  assert.equal(matchesOrderKeyword(order, '0003'), true)
  assert.equal(matchesOrderKeyword(order, 'CJ202610230004'), false)
})

test('matches part of the subscriber name', () => {
  assert.equal(matchesOrderKeyword(order, '王小明'), true)
  assert.equal(matchesOrderKeyword(order, '小明'), true)
  assert.equal(matchesOrderKeyword(order, '王大明'), false)
})

test('matches part of the LINE display name, ignoring case', () => {
  assert.equal(matchesOrderKeyword(order, 'amy'), true)
  assert.equal(matchesOrderKeyword(order, 'CHEN'), true)
  assert.equal(matchesOrderKeyword(order, 'amy chen'), true)
  assert.equal(matchesOrderKeyword(order, 'bob'), false)
})

test('full-width characters typed by an IME still match', () => {
  assert.equal(matchesOrderKeyword(order, 'ＣＪ２０２６'), true)
  assert.equal(matchesOrderKeyword(order, 'ＡＭＹ'), true)
})

test('every space-separated word has to match some field, in any order', () => {
  assert.equal(matchesOrderKeyword(order, 'chen amy'), true)
  assert.equal(matchesOrderKeyword(order, '王 0003'), true)
  assert.equal(matchesOrderKeyword(order, '王 0004'), false)
  assert.equal(matchesOrderKeyword(order, '  amy   chen  '), true)
})

test('an order without an order number is found by the #id shown in the list', () => {
  const legacy = { id: 265, orderNo: null, subscriberName: '王小明', memberDisplayName: null }

  assert.equal(matchesOrderKeyword(legacy, '#265'), true)
  assert.equal(matchesOrderKeyword(legacy, '265'), true)
  assert.equal(matchesOrderKeyword(legacy, '#266'), false)
})

test('missing name fields never throw and just do not match', () => {
  const bare = { id: 7, orderNo: 'CJ202610230001' }

  assert.equal(matchesOrderKeyword(bare, '小明'), false)
  assert.equal(matchesOrderKeyword(bare, 'CJ2026'), true)
  assert.equal(matchesOrderKeyword(null, 'CJ'), false)
})

test('the internal id is not searchable once the order has a real order number', () => {
  assert.equal(matchesOrderKeyword(order, '#265'), false)
})
