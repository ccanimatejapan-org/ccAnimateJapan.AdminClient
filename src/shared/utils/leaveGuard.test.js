import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'

import { createBeforeUnloadHandler, createRouteLeaveGuard } from './leaveGuard.js'

const createEvent = () => {
  const event = {
    defaultPrevented: false,
    returnValue: undefined,
    preventDefault() {
      this.defaultPrevented = true
    },
  }
  return event
}

test('beforeunload handler lets the page close when the guard is not active', () => {
  const isActive = ref(false)
  const event = createEvent()

  createBeforeUnloadHandler(isActive)(event)

  assert.equal(event.defaultPrevented, false)
  assert.equal(event.returnValue, undefined)
})

test('beforeunload handler asks the browser to confirm while the guard is active', () => {
  const isActive = ref(true)
  const event = createEvent()

  createBeforeUnloadHandler(isActive)(event)

  assert.equal(event.defaultPrevented, true)
  assert.equal(event.returnValue, '')
})

test('beforeunload handler follows the guard as it switches on and off', () => {
  const isActive = ref(false)
  const handler = createBeforeUnloadHandler(isActive)

  const idleEvent = createEvent()
  handler(idleEvent)
  assert.equal(idleEvent.defaultPrevented, false)

  isActive.value = true
  const busyEvent = createEvent()
  handler(busyEvent)
  assert.equal(busyEvent.defaultPrevented, true)

  isActive.value = false
  const doneEvent = createEvent()
  handler(doneEvent)
  assert.equal(doneEvent.defaultPrevented, false)
})

test('route guard allows navigation without asking when the guard is not active', () => {
  const asked = []
  const guard = createRouteLeaveGuard(ref(false), '確定要離開嗎？', (message) => {
    asked.push(message)
    return false
  })

  assert.equal(guard(), true)
  assert.deepEqual(asked, [])
})

test('route guard asks the user and follows the answer while the guard is active', () => {
  const asked = []
  let answer = false
  const guard = createRouteLeaveGuard(ref(true), '匯入還在進行中，確定要離開嗎？', (message) => {
    asked.push(message)
    return answer
  })

  assert.equal(guard(), false)
  answer = true
  assert.equal(guard(), true)
  assert.deepEqual(asked, ['匯入還在進行中，確定要離開嗎？', '匯入還在進行中，確定要離開嗎？'])
})
