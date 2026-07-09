import { apiBlob, httpClient } from '@/shared/api/httpClient'
import { toQueryString } from '@/shared/utils/queryString'

export const listOrderActivities = async () => {
  const response = await httpClient.get('/api/orders/activities')
  return response?.data || []
}

// 未處理訂單筆數（OrderStatus = 顧客已下單）。silent：不觸發全域 loading 遮罩，供背景輪詢使用。
export const getNewOrderCount = async () => {
  const response = await httpClient.get('/api/orders/new-count', { silent: true })
  return response?.data?.count ?? 0
}

// 未處理訂單清單（給頁首下拉選單用；orderStatus 1 = 顧客已下單）。silent：下拉自行顯示載入狀態。
export const listNewOrders = async () => {
  const query = toQueryString({ page: 1, pageSize: 100, orderStatus: 1 })
  const response = await httpClient.get(`/api/orders${query}`, { silent: true })
  return response?.data?.items || []
}

export const listOrderActivityProducts = async (activityId) => {
  const response = await httpClient.get(`/api/orders/activities/${activityId}/products`)
  return response?.data || []
}

export const listOrderProducts = async () => {
  const response = await httpClient.get('/api/orders/products')
  return response?.data || []
}

export const listDeliveryTypes = async () => {
  const response = await httpClient.get('/api/orders/delivery-types')
  return response?.data || []
}

export const createOrder = async (payload) => {
  const response = await httpClient.post('/api/orders', payload)
  return response?.data || null
}

export const updateOrder = async (orderId, payload) => {
  const response = await httpClient.post(`/api/orders/${orderId}/update`, payload)
  return response?.data || null
}

export const deleteOrder = async (orderId) => {
  const response = await httpClient.post(`/api/orders/${orderId}/delete`)
  return response?.data || null
}

export const sendOrderConfirmationEmail = async (orderId) => {
  const response = await httpClient.post(`/api/orders/${orderId}/send-confirmation-email`)
  return response?.data || null
}

export const listOrdersByActivity = async (
  activityId,
  { page = 1, pageSize = 20, keyword = '', orderStatus = '' } = {},
) => {
  const query = toQueryString({ page, pageSize, keyword, orderStatus })
  const response = await httpClient.get(`/api/orders/activity/${activityId}${query}`)
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
  const response = await httpClient.get(`/api/orders${query}`)
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
  const response = await httpClient.get(`/api/orders/${orderId}`)
  return response?.data || null
}

export const downloadOrderPdf = (orderId) =>
  apiBlob(`/api/orders/${orderId}/pdf`, {
    accept: 'application/pdf',
    expectContentType: 'application/pdf',
    fallbackFileName: `order-${orderId}.pdf`,
  })
