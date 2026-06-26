import { getAdminToken } from '@/stores/authSession'
import { apiGet } from './http'

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

export const getReportOverview = async ({ startDate, endDate, granularity } = {}) => {
  const response = await apiGet(`/api/reports/overview${toQueryString({ startDate, endDate, granularity })}`, {
    headers: authHeaders(),
  })
  return response?.data || null
}

export const getActivityPerformance = async ({ startDate, endDate } = {}) => {
  const response = await apiGet(`/api/reports/activities${toQueryString({ startDate, endDate })}`, {
    headers: authHeaders(),
  })
  return response?.data || []
}

export const getTopProducts = async ({ startDate, endDate, limit, activityId } = {}) => {
  const response = await apiGet(`/api/reports/top-products${toQueryString({ startDate, endDate, limit, activityId })}`, {
    headers: authHeaders(),
  })
  return response?.data || []
}

export const getInventoryHealth = async ({ lowStockThreshold } = {}) => {
  const response = await apiGet(`/api/reports/inventory${toQueryString({ lowStockThreshold })}`, {
    headers: authHeaders(),
  })
  return response?.data || null
}

export const getMargins = async ({ startDate, endDate, limit } = {}) => {
  const response = await apiGet(`/api/reports/margins${toQueryString({ startDate, endDate, limit })}`, {
    headers: authHeaders(),
  })
  return response?.data || null
}
