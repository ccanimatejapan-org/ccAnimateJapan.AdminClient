import { beginLoading, endLoading } from '@/stores/loadingStore'

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5221').replace(/\/$/, '')

// 單一請求的逾時上限：避免某支請求 hang 住時，全域 loading 遮罩永久卡死整個畫面。
// 設得寬鬆（2 分鐘）只為「最終一定解鎖」，足以涵蓋上傳大圖 / 產 PDF 等慢操作。
const DEFAULT_TIMEOUT_MS = 120000

const withSlash = (path) => (path.startsWith('/') ? path : `/${path}`)

const buildUrl = (path) => (path.startsWith('http') ? path : `${apiBase}${withSlash(path)}`)

const parseJsonResponse = async (resp) => {
  try {
    return await resp.json()
  } catch (_) {
    return null
  }
}

const getDownloadFileName = (resp, fallback) => {
  const disposition = resp.headers.get('content-disposition') || ''
  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)

  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1].replace(/"/g, ''))
  }

  const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i)
  return fileNameMatch?.[1] || fallback
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

// 為 fetch 套上 AbortController 逾時：時間到就 abort，讓 promise reject，
// 進而走到呼叫端的 finally 解除 loading 計數，不會永久卡住。
const fetchWithTimeout = async (url, init, timeoutMs) => {
  if (!timeoutMs || timeoutMs <= 0) {
    return fetch(url, init)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutErr = new Error('連線逾時，請稍後再試。')
      timeoutErr.status = 408
      throw timeoutErr
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export const apiFetch = async (
  path,
  { method = 'GET', body, headers = {}, silent = false, timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) => {
  const url = buildUrl(path)

  if (!silent) beginLoading()
  try {
    const resp = await fetchWithTimeout(
      url,
      {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      timeoutMs,
    )

    const data = await parseJsonResponse(resp)
    assertApiSuccess(resp, data)

    return data
  } finally {
    if (!silent) endLoading()
  }
}

export const apiGet = (path, options = {}) =>
  apiFetch(path, { ...options, method: 'GET', body: undefined })

export const apiPost = (path, body, options = {}) =>
  apiFetch(path, { ...options, method: 'POST', body })

export const apiForm = async (
  path,
  formData,
  { method = 'POST', headers = {}, silent = false, timeoutMs = DEFAULT_TIMEOUT_MS } = {},
) => {
  const url = buildUrl(path)

  if (!silent) beginLoading()
  try {
    const resp = await fetchWithTimeout(
      url,
      {
        method,
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...headers,
        },
        body: formData,
      },
      timeoutMs,
    )

    const data = await parseJsonResponse(resp)
    assertApiSuccess(resp, data)

    return data
  } finally {
    if (!silent) endLoading()
  }
}

export const apiPostForm = (path, formData, options = {}) =>
  apiForm(path, formData, { ...options, method: 'POST' })

// 二進位下載（PDF 等）統一入口：集中處理 loading 計數、逾時、錯誤判斷與檔名解析，
// 避免每個下載端點各自手動配對 beginLoading/endLoading（漏一次就會卡住遮罩）。
export const apiBlob = async (
  path,
  {
    method = 'GET',
    headers = {},
    accept = 'application/octet-stream',
    expectContentType = '',
    fallbackFileName = 'download',
    silent = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = {},
) => {
  const url = buildUrl(path)

  if (!silent) beginLoading()
  try {
    const resp = await fetchWithTimeout(
      url,
      {
        method,
        headers: {
          Accept: accept,
          'X-Requested-With': 'XMLHttpRequest',
          ...headers,
        },
      },
      timeoutMs,
    )

    const contentType = resp.headers.get('content-type') || ''
    if (!resp.ok || (expectContentType && !contentType.includes(expectContentType))) {
      const data = await parseJsonResponse(resp)
      // 非 2xx：沿用統一錯誤格式拋出
      assertApiSuccess(resp, data)
      // 回應 ok 但 content-type 不符（理論上少見）→ 視為失敗
      const err = new Error(data?.message || `Request failed (${resp.status})`)
      err.status = resp.status
      err.responseData = data
      throw err
    }

    return {
      blob: await resp.blob(),
      fileName: getDownloadFileName(resp, fallbackFileName),
    }
  } finally {
    if (!silent) endLoading()
  }
}

export { apiBase }
