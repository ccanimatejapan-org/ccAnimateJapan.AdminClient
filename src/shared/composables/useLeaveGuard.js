import { onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { createBeforeUnloadHandler, createRouteLeaveGuard } from '@/shared/utils/leaveGuard'

// 工作進行中（isActive 為 true）時，攔截關閉分頁、重新整理與站內換頁（含同一頁換參數、瀏覽器上一頁）。
// 必須在頁面底下的元件的 setup 裡呼叫；元件卸載時自動移除。
export const useLeaveGuard = (isActive, message) => {
  const beforeUnloadHandler = createBeforeUnloadHandler(isActive)
  window.addEventListener('beforeunload', beforeUnloadHandler)
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnloadHandler))

  const routeGuard = createRouteLeaveGuard(isActive, message)
  onBeforeRouteLeave(routeGuard)
  onBeforeRouteUpdate(routeGuard)
}
