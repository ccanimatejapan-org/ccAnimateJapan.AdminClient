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
