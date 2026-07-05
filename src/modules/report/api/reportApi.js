import { httpClient } from '@/shared/api/httpClient'
import { toQueryString } from '@/shared/utils/queryString'

// httpClient attaches the admin token and unwraps the response envelope automatically,
// so these functions add no auth headers and read the `data` payload off the envelope.

export const getReportOverview = async ({ startDate, endDate, granularity } = {}) => {
  const response = await httpClient.get(`/api/reports/overview${toQueryString({ startDate, endDate, granularity })}`)
  return response?.data || null
}

export const getActivityPerformance = async ({ startDate, endDate } = {}) => {
  const response = await httpClient.get(`/api/reports/activities${toQueryString({ startDate, endDate })}`)
  return response?.data || []
}

export const getTopProducts = async ({ startDate, endDate, limit, activityId } = {}) => {
  const response = await httpClient.get(`/api/reports/top-products${toQueryString({ startDate, endDate, limit, activityId })}`)
  return response?.data || []
}

export const getInventoryHealth = async ({ lowStockThreshold } = {}) => {
  const response = await httpClient.get(`/api/reports/inventory${toQueryString({ lowStockThreshold })}`)
  return response?.data || null
}

export const getMargins = async ({ startDate, endDate, limit } = {}) => {
  const response = await httpClient.get(`/api/reports/margins${toQueryString({ startDate, endDate, limit })}`)
  return response?.data || null
}
