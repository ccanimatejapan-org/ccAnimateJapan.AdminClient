import { httpClient } from '@/shared/api/httpClient'

// httpClient attaches the admin token and unwraps the response envelope automatically,
// so these functions add no auth headers. The list endpoint returns the `data` payload;
// mutation endpoints return the full envelope (callers read `response?.data`).

export const listAnimateTypes = async () => {
  const response = await httpClient.get('/api/activities/animate-types')
  return response?.data || []
}

export const createAnimateType = (formData) =>
  httpClient.post('/api/activities/animate-types', formData)

export const updateAnimateType = (formData) =>
  httpClient.post('/api/activities/animate-types/update', formData)
