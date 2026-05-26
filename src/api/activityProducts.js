import { getAdminToken } from '@/stores/authSession'
import { apiBase, apiGet, apiPost, apiPostForm } from './http'

const authHeaders = () => {
  const token = getAdminToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const listProductTypes = async () => {
  const response = await apiGet('/api/activities/product-types', {
    headers: authHeaders(),
  })
  return response?.data || []
}

export const listActivityProducts = async (activityId) => {
  const response = await apiGet(`/api/activities/${activityId}/products`, {
    headers: authHeaders(),
  })
  return response?.data || []
}

export const listOrderedActivityProducts = async (activityId) => {
  const response = await apiGet(`/api/activities/${activityId}/products/ordered`, {
    headers: authHeaders(),
  })
  return response?.data || []
}

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

export const downloadActivityProductsPdf = async (activityId) => {
  const fallbackFileName = `activity-${activityId}-products.pdf`
  const resp = await fetch(`${apiBase}/api/activities/${activityId}/products/pdf`, {
    method: 'GET',
    headers: {
      Accept: 'application/pdf',
      'X-Requested-With': 'XMLHttpRequest',
      ...authHeaders(),
    },
  })

  const contentType = resp.headers.get('content-type') || ''
  if (!resp.ok || !contentType.includes('application/pdf')) {
    const data = await parseJsonResponse(resp)
    const responseStatus = data?.status ? Number(data.status) : resp.status
    const message = data?.message || `Request failed (${responseStatus || resp.status})`
    const err = new Error(message)
    err.status = responseStatus || resp.status
    err.responseData = data
    throw err
  }

  return {
    blob: await resp.blob(),
    fileName: getDownloadFileName(resp, fallbackFileName),
  }
}

const isFormData = (payload) => typeof FormData !== 'undefined' && payload instanceof FormData

export const createActivityProduct = (activityId, payload) =>
  isFormData(payload)
    ? apiPostForm(`/api/activities/${activityId}/products`, payload, { headers: authHeaders() })
    : apiPost(`/api/activities/${activityId}/products`, payload, { headers: authHeaders() })

export const updateActivityProduct = (activityId, payload) =>
  isFormData(payload)
    ? apiPostForm(`/api/activities/${activityId}/products/update`, payload, { headers: authHeaders() })
    : apiPost(`/api/activities/${activityId}/products/update`, payload, { headers: authHeaders() })
