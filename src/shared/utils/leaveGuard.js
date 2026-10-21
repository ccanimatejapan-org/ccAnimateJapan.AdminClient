import { unref } from 'vue'

// 離開頁面的保護（純函式，供 composables/useLeaveGuard 接上 window 與 vue-router）。
// isActive 可以是 ref 或布林值；為 true 時才攔截。

// 關閉分頁、重新整理：瀏覽器自己的確認視窗（文字無法自訂）。
export const createBeforeUnloadHandler = (isActive) => (event) => {
  if (!unref(isActive)) return

  event.preventDefault()
  event.returnValue = ''
}

// 站內換頁：回傳 false 取消導覽，true 放行。
export const createRouteLeaveGuard = (isActive, message, confirmLeave = (text) => window.confirm(text)) => () => {
  if (!unref(isActive)) return true

  return confirmLeave(message)
}
