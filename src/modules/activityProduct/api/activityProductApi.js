import { apiBlob, httpClient } from '@/shared/api/httpClient'

export const listProductTypes = async () => {
  const response = await httpClient.get('/api/activities/product-types')
  return response?.data || []
}

export const listActivityProducts = async (activityId) => {
  const response = await httpClient.get(`/api/activities/${activityId}/products`)
  return response?.data || []
}

export const listOrderedActivityProducts = async (activityId) => {
  const response = await httpClient.get(`/api/activities/${activityId}/products/ordered`)
  return response?.data || []
}

export const downloadActivityProductsPdf = (activityId) =>
  apiBlob(`/api/activities/${activityId}/products/pdf`, {
    accept: 'application/pdf',
    expectContentType: 'application/pdf',
    fallbackFileName: `activity-${activityId}-products.pdf`,
  })

// FormData vs JSON branching is handled by the shared httpClient request interceptor
// (it strips Content-Type for FormData so axios sets the multipart boundary), so a single
// post covers both the multipart (with images) and JSON payload paths the page may send.
export const createActivityProduct = (activityId, payload) =>
  httpClient.post(`/api/activities/${activityId}/products`, payload)

export const updateActivityProduct = (activityId, payload) =>
  httpClient.post(`/api/activities/${activityId}/products/update`, payload)

export const copyActivityProduct = (activityId, productId) =>
  httpClient.post(`/api/activities/${activityId}/products/${productId}/copy`)

export const deleteActivityProduct = (activityId, productId) =>
  httpClient.post(`/api/activities/${activityId}/products/${productId}/delete`)

// 批次匯入：下載範本 → 預覽（Excel + 圖片清單，不寫入）→ 正式匯入（資料 + 有用到的圖片）。
// rate / saleRate：商品頁設定的匯率，後端會預先帶入範本的匯率欄位。
export const downloadProductImportTemplate = (activityId, { rate, saleRate } = {}) => {
  const query = new URLSearchParams()
  if (Number(rate) > 0) query.set('rate', String(rate))
  if (Number(saleRate) > 0) query.set('saleRate', String(saleRate))
  const search = query.toString() ? `?${query}` : ''

  return apiBlob(`/api/activities/${activityId}/products/import/template${search}`, {
    accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    expectContentType: 'spreadsheetml',
    fallbackFileName: '商品匯入範本.xlsx',
  })
}

export const previewProductImport = async (activityId, { file, defaultRate, defaultSaleRate, imageManifest }) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('defaultRate', String(defaultRate ?? ''))
  formData.append('defaultSaleRate', String(defaultSaleRate ?? ''))
  formData.append('images', imageManifest || '[]')

  const response = await httpClient.post(`/api/activities/${activityId}/products/import/preview`, formData)
  return response?.data
}

// 圖片可能很多，所以不用全域 loading 遮罩（由匯入視窗自己顯示進度），逾時放寬到 15 分鐘。
const IMPORT_TIMEOUT_MS = 15 * 60 * 1000

export const importActivityProducts = async (activityId, { payload, images }, { onUploadProgress } = {}) => {
  const formData = new FormData()
  formData.append('payload', JSON.stringify(payload))
  for (const image of images) {
    formData.append('images', image, image.name)
  }

  const response = await httpClient.post(`/api/activities/${activityId}/products/import`, formData, {
    silent: true,
    timeout: IMPORT_TIMEOUT_MS,
    onUploadProgress,
  })
  return response?.data
}
