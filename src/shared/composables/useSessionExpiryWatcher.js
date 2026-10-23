import { onBeforeUnmount, onMounted } from 'vue'
import { handleUnauthorized } from '@/shared/api/httpClient'
import { isAdminAuthenticated } from '@/shared/stores/authSession'
import { attachSessionRecheck } from '@/shared/utils/sessionWatcher'

// 分頁切回可見 / 視窗重新取得焦點時，檢查登入（JWT）是否已過期；過期就走跟 401 一樣的流程
// （清 token、同步 authStore、導回登入頁，含防重入）。
// 在只有登入後才會掛載的元件（DefaultLayout）的 setup 裡呼叫；元件卸載時自動移除監聽。
export const useSessionExpiryWatcher = () => {
  let stop = null

  onMounted(() => {
    stop = attachSessionRecheck({
      isSessionValid: isAdminAuthenticated,
      onSessionInvalid: handleUnauthorized,
    })
  })

  onBeforeUnmount(() => {
    stop?.()
    stop = null
  })
}
