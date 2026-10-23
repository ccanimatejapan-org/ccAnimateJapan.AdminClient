import { test } from 'node:test'
import assert from 'node:assert/strict'

import { attachSessionRecheck } from './sessionWatcher.js'

const createEnv = (visibilityState = 'visible') => {
  const documentRef = new EventTarget()
  documentRef.visibilityState = visibilityState
  const windowRef = new EventTarget()
  return { documentRef, windowRef }
}

const setup = ({ isValid = false, visibilityState } = {}) => {
  const { documentRef, windowRef } = createEnv(visibilityState)
  const calls = { checked: 0, invalid: 0 }
  const state = { isValid }

  const stop = attachSessionRecheck({
    documentRef,
    windowRef,
    isSessionValid: () => {
      calls.checked += 1
      return state.isValid
    },
    onSessionInvalid: () => {
      calls.invalid += 1
    },
  })

  return { documentRef, windowRef, calls, state, stop }
}

test('returning to a visible tab with an invalid session reports it', () => {
  const { documentRef, calls } = setup({ isValid: false })

  documentRef.dispatchEvent(new Event('visibilitychange'))

  assert.equal(calls.invalid, 1)
})

test('returning to a visible tab with a valid session does nothing', () => {
  const { documentRef, calls } = setup({ isValid: true })

  documentRef.dispatchEvent(new Event('visibilitychange'))

  assert.equal(calls.checked, 1)
  assert.equal(calls.invalid, 0)
})

test('hiding the tab does not trigger a check', () => {
  const { documentRef, calls } = setup({ isValid: false, visibilityState: 'hidden' })

  documentRef.dispatchEvent(new Event('visibilitychange'))

  assert.equal(calls.checked, 0)
  assert.equal(calls.invalid, 0)
})

test('window focus with an invalid session reports it', () => {
  const { windowRef, calls } = setup({ isValid: false })

  windowRef.dispatchEvent(new Event('focus'))

  assert.equal(calls.invalid, 1)
})

test('window focus with a valid session does nothing', () => {
  const { windowRef, calls } = setup({ isValid: true })

  windowRef.dispatchEvent(new Event('focus'))

  assert.equal(calls.checked, 1)
  assert.equal(calls.invalid, 0)
})

test('the session is re-read on every event, so it can expire between checks', () => {
  const { windowRef, calls, state } = setup({ isValid: true })

  windowRef.dispatchEvent(new Event('focus'))
  assert.equal(calls.invalid, 0)

  state.isValid = false
  windowRef.dispatchEvent(new Event('focus'))
  assert.equal(calls.invalid, 1)
})

test('the returned stop function removes both listeners', () => {
  const { documentRef, windowRef, calls, stop } = setup({ isValid: false })

  stop()
  documentRef.dispatchEvent(new Event('visibilitychange'))
  windowRef.dispatchEvent(new Event('focus'))

  assert.equal(calls.checked, 0)
  assert.equal(calls.invalid, 0)
})
