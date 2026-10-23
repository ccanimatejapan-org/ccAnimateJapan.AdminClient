const tokenKey = 'ccAnimateJapan.adminToken'
const legacySessionKey = 'ccAnimateJapan.adminSession'

// 提早多久把 token 視為過期：距離 exp 不到這段時間就當作已過期，
// 避免「畫面上還是登入狀態、請求送出途中 token 才失效」而吃 401。
export const TOKEN_EXPIRY_LEEWAY_MS = 10_000

// localStorage 在隱私模式 / 封鎖網站資料時，讀寫都可能丟例外（甚至 localStorage 本身不存在）。
// 讀不到一律當成「沒有資料」、寫不進去就略過，不能讓路由守衛或攔截器因此炸掉。
const readStorage = (key) => {
  try {
    return localStorage.getItem(key)
  } catch (_) {
    return null
  }
}

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch (_) {
    /* 儲存空間被封鎖，略過 */
  }
}

const removeStorage = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (_) {
    /* 儲存空間被封鎖，略過 */
  }
}

const readLegacyToken = () => {
  try {
    const raw = readStorage(legacySessionKey)
    const session = raw ? JSON.parse(raw) : null
    return session?.admin?.token || null
  } catch (_) {
    return null
  }
}

export const getAdminToken = () => {
  const token = readStorage(tokenKey)
  if (token) {
    return token
  }

  const legacyToken = readLegacyToken()
  if (legacyToken) {
    setAdminToken(legacyToken)
  }

  removeStorage(legacySessionKey)
  return legacyToken
}

export const setAdminToken = (token) => {
  if (!token) {
    clearAdminToken()
    return null
  }

  writeStorage(tokenKey, token)
  removeStorage(legacySessionKey)
  return token
}

export const clearAdminToken = () => {
  removeStorage(tokenKey)
  removeStorage(legacySessionKey)
}

// 解析 JWT 的 payload（base64url + UTF-8）；格式不對（不是三段、不是合法 base64 / JSON 物件）一律回 null。
const parseJwtPayload = (token) => {
  if (typeof token !== 'string') {
    return null
  }

  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const json = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    const payload = JSON.parse(json)

    return payload && typeof payload === 'object' ? payload : null
  } catch (_) {
    return null
  }
}

// 取出 JWT 的 exp（秒）。格式錯誤、沒有 exp、或 exp 不是有限數字都回 null。
export const getTokenExpiry = (token) => {
  const exp = parseJwtPayload(token)?.exp
  return typeof exp === 'number' && Number.isFinite(exp) ? exp : null
}

// 判斷 token 是否已過期（含 TOKEN_EXPIRY_LEEWAY_MS 的提前量）。
// 無效 token（格式錯誤、沒有 exp）一律視為已過期：後端簽發的 token 一定帶 exp，
// 讀不出 exp 的 token 不可能是有效的登入憑證，直接要求重新登入比放行後吃 401 更乾脆。
export const isTokenExpired = (token, { now = Date.now(), leewayMs = TOKEN_EXPIRY_LEEWAY_MS } = {}) => {
  const exp = getTokenExpiry(token)
  if (exp === null) {
    return true
  }

  return now >= exp * 1000 - leewayMs
}

// 取得「仍有效」的 token；已過期（或無效）時順手清掉（含舊 key），回傳 null。
export const getValidAdminToken = () => {
  const token = getAdminToken()
  if (!token) {
    return null
  }

  if (isTokenExpired(token)) {
    clearAdminToken()
    return null
  }

  return token
}

export const isAdminAuthenticated = () => !!getValidAdminToken()

export const getAdminTokenPayload = () => {
  const token = getAdminToken()
  if (!token) {
    return null
  }

  return parseJwtPayload(token)
}

export const getAdminDisplayName = () => {
  const payload = getAdminTokenPayload()
  return (
    payload?.name ||
    payload?.unique_name ||
    payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
    'Admin'
  )
}
