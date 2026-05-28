import { getAdminToken } from '@/stores/authSession'
import { apiBase, apiGet, apiPost } from './http'

const authHeaders = () => {
  const token = getAdminToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const toQueryString = (params) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    searchParams.set(key, value)
  })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
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

export const listOrderActivities = async () => {
  const response = await apiGet('/api/orders/activities', {
    headers: authHeaders(),
  })
  return response?.data || []
}

export const listOrderActivityProducts = async (activityId) => {
  const response = await apiGet(`/api/orders/activities/${activityId}/products`, {
    headers: authHeaders(),
  })
  return response?.data || []
}

export const listOrderProducts = async () => {
  const response = await apiGet('/api/orders/products', {
    headers: authHeaders(),
  })
  return response?.data || []
}

export const listDeliveryTypes = async () => {
  const response = await apiGet('/api/orders/delivery-types', {
    headers: authHeaders(),
  })
  return response?.data || []
}

export const createOrder = async (payload) => {
  const response = await apiPost('/api/orders', payload, {
    headers: authHeaders(),
  })
  return response?.data || null
}

export const updateOrder = async (orderId, payload) => {
  const response = await apiPost(`/api/orders/${orderId}/update`, payload, {
    headers: authHeaders(),
  })
  return response?.data || null
}

export const deleteOrder = async (orderId) => {
  const response = await apiPost(`/api/orders/${orderId}/delete`, undefined, {
    headers: authHeaders(),
  })
  return response?.data || null
}

export const sendOrderConfirmationEmail = async (orderId) => {
  const response = await apiPost(`/api/orders/${orderId}/send-confirmation-email`, undefined, {
    headers: authHeaders(),
  })
  return response?.data || null
}

export const listOrdersByActivity = async (
  activityId,
  { page = 1, pageSize = 20, keyword = '', orderStatus = '' } = {},
) => {
  const query = toQueryString({ page, pageSize, keyword, orderStatus })
  const response = await apiGet(`/api/orders/activity/${activityId}${query}`, {
    headers: authHeaders(),
  })
  return response?.data || {
    page,
    pageSize,
    totalCount: 0,
    totalPages: 0,
    items: [],
  }
}

export const listAllOrdersByActivity = async (activityId) => {
  const pageSize = 100
  let page = 1
  let totalPages = 1
  let totalCount = 0
  const items = []

  do {
    const result = await listOrdersByActivity(activityId, { page, pageSize })
    const pageItems = result.items || []
    items.push(...pageItems)
    totalPages = result.totalPages || 1
    totalCount = result.totalCount || items.length
    page += 1
  } while (page <= totalPages && items.length < totalCount)

  return items
}

export const listOrders = async ({ page = 1, pageSize = 20, keyword = '', orderStatus = '' } = {}) => {
  const query = toQueryString({ page, pageSize, keyword, orderStatus })
  const response = await apiGet(`/api/orders${query}`, {
    headers: authHeaders(),
  })
  return response?.data || {
    page,
    pageSize,
    totalCount: 0,
    totalPages: 0,
    items: [],
  }
}

export const listAllOrders = async () => {
  const pageSize = 100
  let page = 1
  let totalPages = 1
  let totalCount = 0
  const items = []

  do {
    const result = await listOrders({ page, pageSize })
    const pageItems = result.items || []
    items.push(...pageItems)
    totalPages = result.totalPages || 1
    totalCount = result.totalCount || items.length
    page += 1
  } while (page <= totalPages && items.length < totalCount)

  return items
}

export const getOrderDetail = async (orderId) => {
  const response = await apiGet(`/api/orders/${orderId}`, {
    headers: authHeaders(),
  })
  return response?.data || null
}

export const downloadOrderPdf = async (orderId) => {
  const fallbackFileName = `order-${orderId}.pdf`
  const resp = await fetch(`${apiBase}/api/orders/${orderId}/pdf`, {
    method: 'GET',
    headers: {
      Accept: 'application/pdf',
      ...authHeaders(),
    }
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
