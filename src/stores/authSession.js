const tokenKey = 'ccAnimateJapan.adminToken'
const legacySessionKey = 'ccAnimateJapan.adminSession'

const readLegacyToken = () => {
  try {
    const raw = localStorage.getItem(legacySessionKey)
    const session = raw ? JSON.parse(raw) : null
    return session?.admin?.token || null
  } catch (_) {
    return null
  }
}

export const getAdminToken = () => {
  const token = localStorage.getItem(tokenKey)
  if (token) {
    return token
  }

  const legacyToken = readLegacyToken()
  if (legacyToken) {
    setAdminToken(legacyToken)
  }

  localStorage.removeItem(legacySessionKey)
  return legacyToken
}

export const setAdminToken = (token) => {
  if (!token) {
    clearAdminToken()
    return null
  }

  localStorage.setItem(tokenKey, token)
  localStorage.removeItem(legacySessionKey)
  return token
}

export const clearAdminToken = () => {
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(legacySessionKey)
}

export const isAdminAuthenticated = () => !!getAdminToken()

export const getAdminTokenPayload = () => {
  const token = getAdminToken()
  if (!token) {
    return null
  }

  try {
    const [, payload] = token.split('.')
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const json = decodeURIComponent(
      atob(paddedBase64)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )

    return JSON.parse(json)
  } catch (_) {
    return null
  }
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
