import { httpClient } from '@/shared/api/httpClient'

// httpClient attaches the admin token and unwraps the response envelope automatically,
// so these functions add no auth headers. List endpoints return the `data` payload;
// mutation endpoints return the full envelope (callers read `response?.data`).

export const listActivities = async () => {
  const response = await httpClient.get('/api/activities')
  return response?.data || []
}

export const getActivityById = async (activityId) => {
  const activities = await listActivities()
  return activities.find((activity) => Number(activity.id) === Number(activityId)) || null
}

export const listDeletedActivities = async () => {
  const response = await httpClient.get('/api/activities?isDelete=true')
  return response?.data || []
}

export const listActivityTypes = async () => {
  const response = await httpClient.get('/api/activities/activity-types')
  return response?.data || []
}

export const createActivity = (formData) => httpClient.post('/api/activities', formData)

export const updateActivity = (formData) => httpClient.post('/api/activities/update', formData)

export const copyActivity = (activityId) => httpClient.post(`/api/activities/${activityId}/copy`)

export const deleteActivity = (activityId) => httpClient.post(`/api/activities/${activityId}/delete`)

export const restoreActivity = (activityId) => httpClient.post(`/api/activities/${activityId}/restore`)
