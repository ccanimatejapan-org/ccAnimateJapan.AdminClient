import { getAdminToken } from '@/stores/authSession'
import { apiGet, apiPost, apiPostForm } from './http'

const authHeaders = () => {
  const token = getAdminToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const listActivities = async () => {
  const response = await apiGet('/api/activities', { headers: authHeaders() })
  return response?.data || []
}

export const getActivityById = async (activityId) => {
  const activities = await listActivities()
  return activities.find((activity) => Number(activity.id) === Number(activityId)) || null
}

export const listDeletedActivities = async () => {
  const response = await apiGet('/api/activities?isDelete=true', { headers: authHeaders() })
  return response?.data || []
}

export const listActivityTypes = async () => {
  const response = await apiGet('/api/activities/activity-types', { headers: authHeaders() })
  return response?.data || []
}

export const listAnimateTypes = async () => {
  const response = await apiGet('/api/activities/animate-types', { headers: authHeaders() })
  return response?.data || []
}

export const createActivity = async (formData) =>
  apiPostForm('/api/activities', formData, { headers: authHeaders() })

export const updateActivity = async (formData) =>
  apiPostForm('/api/activities/update', formData, { headers: authHeaders() })

export const copyActivity = async (activityId) =>
  apiPost(`/api/activities/${activityId}/copy`, undefined, { headers: authHeaders() })

export const deleteActivity = async (activityId) =>
  apiPost(`/api/activities/${activityId}/delete`, undefined, { headers: authHeaders() })

export const restoreActivity = async (activityId) =>
  apiPost(`/api/activities/${activityId}/restore`, undefined, { headers: authHeaders() })
