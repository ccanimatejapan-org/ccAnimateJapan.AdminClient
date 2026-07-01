import { httpClient } from '@/shared/api/httpClient'

const loginPath = '/api/admin/auth/login'

// 登入不需帶 token；帳密錯誤的 401 應顯示錯誤訊息（而非觸發自動登出/導頁），故 skipAuthHandling。
export const loginAdmin = async ({ account, password }) => {
  const response = await httpClient.post(loginPath, { account, password }, { skipAuthHandling: true })
  return response?.data
}
