import axios from 'axios'
import { clearAdminToken, getAdminToken } from '@/shared/stores/authSession'
import { useUiStore } from '@/shared/stores/uiStore'
import { ApiError, unwrapApiResponse } from './apiResponse'

const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5221').replace(/\/$/, '')

// 單一請求逾時上限（2 分鐘）：涵蓋上傳大圖 / 產 PDF 等慢操作，逾時則保證解鎖遮罩。
const DEFAULT_TIMEOUT_MS = 120000

export const httpClient = axios.create({
  baseURL: apiBase,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// loading 計數走 uiStore（Pinia）。包 try/catch 以防極少數在 pinia 啟用前被呼叫。
const beginLoading = () => {
  try {
    useUiStore().beginLoading()
  } catch (_) {
    /* pinia 尚未啟用，略過 */
  }
}

const endLoading = () => {
  try {
    useUiStore().endLoading()
  } catch (_) {
    /* pinia 尚未啟用，略過 */
  }
}

// request：自動帶 token；FormData 讓 axios 自設 multipart boundary；非 silent 啟動 loading。
httpClient.interceptors.request.use((config) => {
  config.headers = config.headers || {}

  const token = getAdminToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  } else if (!config.headers['Content-Type']) {
    // 沿用舊 apiFetch：JSON 請求一律帶 application/json（含無 body 的 POST）。
    config.headers['Content-Type'] = 'application/json'
  }

  if (!config.silent) beginLoading()
  return config
})

let redirectingToLogin = false

// 401：清 token + 導回登入（AdminClient 是密碼 JWT、無 token 續期）。
const handleUnauthorized = async () => {
  clearAdminToken()
  if (redirectingToLogin) return
  redirectingToLogin = true
  try {
    const { default: router } = await import('@/router')
    if (router.currentRoute.value.path !== '/pages/login') {
      await router.replace('/pages/login')
    }
  } catch (_) {
    window.location.assign('/pages/login')
  } finally {
    redirectingToLogin = false
  }
}

httpClient.interceptors.response.use(
  (response) => {
    if (!response.config?.silent) endLoading()

    // 二進位下載等需要完整 response（headers/blob）的呼叫端，用 config.raw 取回原始 response。
    if (response.config?.raw) return response

    const body = response.data

    // envelope 層級的 401
    if (
      body &&
      typeof body === 'object' &&
      Number(body.status) === 401 &&
      !response.config?.skipAuthHandling
    ) {
      handleUnauthorized()
      throw new ApiError(body.message || 'Unauthorized', 401, body)
    }

    return unwrapApiResponse(body, response.status)
  },
  async (error) => {
    if (!error.config?.silent) endLoading()

    // 逾時 → 408（沿用舊行為與訊息）
    if (error.code === 'ECONNABORTED') {
      throw new ApiError('連線逾時，請稍後再試。', 408, null)
    }

    const status = error.response?.status
    let data = error.response?.data
    // responseType:'blob' 的請求，錯誤回應的 body 也是 Blob → 讀成 JSON 以取出後端訊息。
    if (data instanceof Blob) {
      try {
        data = JSON.parse(await data.text())
      } catch (_) {
        data = null
      }
    }

    if (status === 401 && !error.config?.skipAuthHandling) {
      handleUnauthorized()
    }

    const message = data?.message || error.message || `Request failed (${status || ''})`
    throw new ApiError(message, Number(data?.status) || status || 0, data)
  },
)

// 二進位下載（PDF 等）：解析 Content-Disposition 檔名，回傳 { blob, fileName }。
const getDownloadFileName = (headers, fallback) => {
  const disposition = headers?.['content-disposition'] || ''
  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1].replace(/"/g, ''))
  }
  const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i)
  return fileNameMatch?.[1] || fallback
}

export const apiBlob = async (
  path,
  {
    method = 'GET',
    accept = 'application/octet-stream',
    expectContentType = '',
    fallbackFileName = 'download',
    silent = false,
    headers = {},
    ...rest
  } = {},
) => {
  const response = await httpClient.request({
    url: path,
    method,
    responseType: 'blob',
    raw: true,
    silent,
    headers: { Accept: accept, ...headers },
    ...rest,
  })

  // 回應 2xx 但內容型別不符（例如後端改回 JSON 錯誤）→ 讀出訊息並丟出（沿用舊 apiBlob 行為）。
  const contentType = response.headers?.['content-type'] || ''
  if (expectContentType && !contentType.includes(expectContentType)) {
    let data = null
    try {
      data = JSON.parse(await response.data.text())
    } catch (_) {
      data = null
    }
    throw new ApiError(
      data?.message || `Request failed (${response.status})`,
      Number(data?.status) || response.status,
      data,
    )
  }

  return {
    blob: response.data,
    fileName: getDownloadFileName(response.headers, fallbackFileName),
  }
}

export { apiBase }
