import { getAdminToken } from '@/stores/authSession'
import { apiBlob, apiGet, apiPost, apiPostForm } from './http'

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

export const downloadActivityProductsPdf = (activityId) =>
  apiBlob(`/api/activities/${activityId}/products/pdf`, {
    accept: 'application/pdf',
    expectContentType: 'application/pdf',
    fallbackFileName: `activity-${activityId}-products.pdf`,
    headers: authHeaders(),
  })

const isFormData = (payload) => typeof FormData !== 'undefined' && payload instanceof FormData

export const createActivityProduct = (activityId, payload) =>
  isFormData(payload)
    ? apiPostForm(`/api/activities/${activityId}/products`, payload, { headers: authHeaders() })
    : apiPost(`/api/activities/${activityId}/products`, payload, { headers: authHeaders() })

export const updateActivityProduct = (activityId, payload) =>
  isFormData(payload)
    ? apiPostForm(`/api/activities/${activityId}/products/update`, payload, { headers: authHeaders() })
    : apiPost(`/api/activities/${activityId}/products/update`, payload, { headers: authHeaders() })

export const copyActivityProduct = (activityId, productId) =>
  apiPost(`/api/activities/${activityId}/products/${productId}/copy`, undefined, {
    headers: authHeaders(),
  })
