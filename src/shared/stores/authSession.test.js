import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  TOKEN_EXPIRY_LEEWAY_MS,
  clearAdminToken,
  getAdminDisplayName,
  getAdminToken,
  getAdminTokenPayload,
  getTokenExpiry,
  getValidAdminToken,
  isAdminAuthenticated,
  isTokenExpired,
  setAdminToken,
} from './authSession.js'

const TOKEN_KEY = 'ccAnimateJapan.adminToken'
const LEGACY_KEY = 'ccAnimateJapan.adminSession'

const toBase64Url = (value) => Buffer.from(value, 'utf8').toString('base64url')

const makeToken = (payload) =>
  `${toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${toBase64Url(JSON.stringify(payload))}.signature`

const nowSeconds = () => Math.floor(Date.now() / 1000)
const validToken = () => makeToken({ name: 'Admin', exp: nowSeconds() + 3600 })
const expiredToken = () => makeToken({ name: 'Admin', exp: nowSeconds() - 3600 })

const createFakeStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(key, String(value))
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

// 模擬儲存空間被封鎖（隱私模式 / 封鎖網站資料）：任何讀寫都丟 SecurityError。
const createBlockedStorage = () => {
  const fail = () => {
    throw new Error('SecurityError: storage is blocked')
  }
  return { getItem: fail, setItem: fail, removeItem: fail }
}

const withLocalStorage = (storage, run) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
  try {
    return run()
  } finally {
    if (original) {
      Object.defineProperty(globalThis, 'localStorage', original)
    } else {
      delete globalThis.localStorage
    }
  }
}

test('getTokenExpiry reads the exp claim (seconds) from a base64url payload', () => {
  // 帶中文名稱，確認 UTF-8 與 base64url 的 -/_ 字元都能解開
  const token = makeToken({ name: '管理員??>>', exp: 1_900_000_000 })

  assert.equal(getTokenExpiry(token), 1_900_000_000)
})

test('getTokenExpiry returns null for malformed tokens', () => {
  assert.equal(getTokenExpiry(''), null)
  assert.equal(getTokenExpiry(null), null)
  assert.equal(getTokenExpiry(undefined), null)
  assert.equal(getTokenExpiry('not-a-jwt'), null)
  assert.equal(getTokenExpiry('only.two'), null)
  assert.equal(getTokenExpiry('a.b.c.d'), null)
  assert.equal(getTokenExpiry('header.@@@.signature'), null)
  assert.equal(getTokenExpiry(`header.${toBase64Url('not json')}.signature`), null)
  assert.equal(getTokenExpiry(`header.${toBase64Url('"a string"')}.signature`), null)
})

test('getTokenExpiry returns null when exp is missing or not a finite number', () => {
  assert.equal(getTokenExpiry(makeToken({ name: 'Admin' })), null)
  assert.equal(getTokenExpiry(makeToken({ exp: '1900000000' })), null)
  assert.equal(getTokenExpiry(makeToken({ exp: null })), null)
  assert.equal(getTokenExpiry(makeToken({ exp: 'soon' })), null)
})

test('isTokenExpired is false for a token that expires well in the future', () => {
  const now = 1_000_000_000_000
  const token = makeToken({ exp: now / 1000 + 3600 })

  assert.equal(isTokenExpired(token, { now }), false)
})

test('isTokenExpired is true for a token whose exp has passed', () => {
  const now = 1_000_000_000_000
  const token = makeToken({ exp: now / 1000 - 1 })

  assert.equal(isTokenExpired(token, { now }), true)
})

test('isTokenExpired treats a token as expired slightly before its exp (leeway)', () => {
  const now = 1_000_000_000_000
  const exp = now / 1000 + TOKEN_EXPIRY_LEEWAY_MS / 1000
  const token = makeToken({ exp })

  // 距離過期剛好等於容差 → 視為已過期
  assert.equal(isTokenExpired(token, { now }), true)
  // 還差 1 毫秒才進入容差範圍 → 仍有效
  assert.equal(isTokenExpired(token, { now: now - 1 }), false)
})

test('isTokenExpired accepts a custom leeway', () => {
  const now = 1_000_000_000_000
  const token = makeToken({ exp: now / 1000 + 30 })

  assert.equal(isTokenExpired(token, { now, leewayMs: 0 }), false)
  assert.equal(isTokenExpired(token, { now, leewayMs: 60_000 }), true)
})

test('isTokenExpired treats malformed tokens and tokens without exp as expired', () => {
  assert.equal(isTokenExpired('not-a-jwt'), true)
  assert.equal(isTokenExpired(''), true)
  assert.equal(isTokenExpired(null), true)
  assert.equal(isTokenExpired(makeToken({ name: 'Admin' })), true)
  assert.equal(isTokenExpired(makeToken({ exp: 'soon' })), true)
})

test('isAdminAuthenticated is true for a stored, unexpired token and keeps it', () => {
  const token = validToken()
  const storage = createFakeStorage({ [TOKEN_KEY]: token })

  withLocalStorage(storage, () => {
    assert.equal(isAdminAuthenticated(), true)
    assert.equal(storage.getItem(TOKEN_KEY), token)
  })
})

test('isAdminAuthenticated is false when there is no token', () => {
  withLocalStorage(createFakeStorage(), () => {
    assert.equal(isAdminAuthenticated(), false)
  })
})

test('isAdminAuthenticated is false for an expired token and clears it', () => {
  const storage = createFakeStorage({ [TOKEN_KEY]: expiredToken() })

  withLocalStorage(storage, () => {
    assert.equal(isAdminAuthenticated(), false)
    assert.equal(storage.getItem(TOKEN_KEY), null)
    assert.equal(getAdminToken(), null)
  })
})

test('isAdminAuthenticated treats a token expiring within the leeway as expired and clears it', () => {
  const token = makeToken({ exp: nowSeconds() + 3 })
  const storage = createFakeStorage({ [TOKEN_KEY]: token })

  withLocalStorage(storage, () => {
    assert.equal(isAdminAuthenticated(), false)
    assert.equal(storage.getItem(TOKEN_KEY), null)
  })
})

test('isAdminAuthenticated treats a malformed or exp-less token as logged out and clears it', () => {
  for (const token of ['garbage', makeToken({ name: 'Admin' })]) {
    const storage = createFakeStorage({ [TOKEN_KEY]: token })

    withLocalStorage(storage, () => {
      assert.equal(isAdminAuthenticated(), false)
      assert.equal(storage.getItem(TOKEN_KEY), null)
    })
  }
})

test('isAdminAuthenticated migrates an unexpired legacy session token to the new key', () => {
  const token = validToken()
  const storage = createFakeStorage({
    [LEGACY_KEY]: JSON.stringify({ admin: { token } }),
  })

  withLocalStorage(storage, () => {
    assert.equal(isAdminAuthenticated(), true)
    assert.equal(storage.getItem(TOKEN_KEY), token)
    assert.equal(storage.getItem(LEGACY_KEY), null)
  })
})

test('isAdminAuthenticated clears an expired legacy session token without keeping either key', () => {
  const storage = createFakeStorage({
    [LEGACY_KEY]: JSON.stringify({ admin: { token: expiredToken() } }),
  })

  withLocalStorage(storage, () => {
    assert.equal(isAdminAuthenticated(), false)
    assert.equal(storage.getItem(TOKEN_KEY), null)
    assert.equal(storage.getItem(LEGACY_KEY), null)
  })
})

test('getValidAdminToken returns the token only while it is unexpired', () => {
  const token = validToken()

  withLocalStorage(createFakeStorage({ [TOKEN_KEY]: token }), () => {
    assert.equal(getValidAdminToken(), token)
  })

  const expiredStorage = createFakeStorage({ [TOKEN_KEY]: expiredToken() })
  withLocalStorage(expiredStorage, () => {
    assert.equal(getValidAdminToken(), null)
    assert.equal(expiredStorage.getItem(TOKEN_KEY), null)
  })
})

test('auth session helpers do not throw when localStorage is blocked', () => {
  withLocalStorage(createBlockedStorage(), () => {
    assert.equal(getAdminToken(), null)
    assert.equal(getValidAdminToken(), null)
    assert.equal(isAdminAuthenticated(), false)
    assert.equal(getAdminTokenPayload(), null)
    assert.equal(getAdminDisplayName(), 'Admin')
    assert.doesNotThrow(() => setAdminToken(validToken()))
    assert.doesNotThrow(() => setAdminToken(''))
    assert.doesNotThrow(() => clearAdminToken())
  })
})

test('auth session helpers do not throw when localStorage does not exist at all', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  delete globalThis.localStorage

  try {
    assert.equal(isAdminAuthenticated(), false)
    assert.doesNotThrow(() => clearAdminToken())
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
  }
})

test('setAdminToken stores the token and drops the legacy session; an empty token clears both', () => {
  const token = validToken()
  const storage = createFakeStorage({ [LEGACY_KEY]: JSON.stringify({ admin: { token: 'old' } }) })

  withLocalStorage(storage, () => {
    assert.equal(setAdminToken(token), token)
    assert.equal(storage.getItem(TOKEN_KEY), token)
    assert.equal(storage.getItem(LEGACY_KEY), null)

    assert.equal(setAdminToken(''), null)
    assert.equal(storage.getItem(TOKEN_KEY), null)
  })
})

test('getAdminTokenPayload and getAdminDisplayName still read the stored token', () => {
  const token = makeToken({ name: '店長', exp: nowSeconds() + 3600 })

  withLocalStorage(createFakeStorage({ [TOKEN_KEY]: token }), () => {
    assert.equal(getAdminTokenPayload().name, '店長')
    assert.equal(getAdminDisplayName(), '店長')
  })

  withLocalStorage(createFakeStorage(), () => {
    assert.equal(getAdminTokenPayload(), null)
    assert.equal(getAdminDisplayName(), 'Admin')
  })
})
