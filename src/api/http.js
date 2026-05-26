const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5221').replace(/\/$/, '')

const withSlash = (path) => (path.startsWith('/') ? path : `/${path}`)

const parseJsonResponse = async (resp) => {
  try {
    return await resp.json()
  } catch (_) {
    return null
  }
}

const assertApiSuccess = (resp, data) => {
  const responseStatus = data?.status ? Number(data.status) : resp.status
  const isApiSuccess = resp.ok && (!responseStatus || responseStatus < 400)

  if (isApiSuccess) return

  const message = data?.message || `Request failed (${responseStatus || resp.status})`
  const err = new Error(message)
  err.status = responseStatus || resp.status
  err.responseData = data
  throw err
}

export const apiFetch = async (
  path,
  { method = 'GET', body, headers = {} } = {},
) => {
  const url = path.startsWith('http') ? path : `${apiBase}${withSlash(path)}`

  const resp = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const data = await parseJsonResponse(resp)
  assertApiSuccess(resp, data)

  return data
}

export const apiGet = (path, options = {}) =>
  apiFetch(path, { ...options, method: 'GET', body: undefined })

export const apiPost = (path, body, options = {}) =>
  apiFetch(path, { ...options, method: 'POST', body })

export const apiForm = async (path, formData, { method = 'POST', headers = {} } = {}) => {
  const url = path.startsWith('http') ? path : `${apiBase}${withSlash(path)}`

  const resp = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...headers,
    },
    body: formData,
  })

  const data = await parseJsonResponse(resp)
  assertApiSuccess(resp, data)

  return data
}

export const apiPostForm = (path, formData, options = {}) =>
  apiForm(path, formData, { ...options, method: 'POST' })

export { apiBase }
