import { apiPost } from './http'

const loginPath = '/api/admin/auth/login'

export const loginAdmin = async ({ account, password }) => {
  const response = await apiPost(loginPath, { account, password })
  return response?.data
}
