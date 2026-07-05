import { defineStore } from 'pinia'
import { ref } from 'vue'

// 進行中的請求出現多久後才真正顯示遮罩（避免極快請求閃一下）
const SHOW_DELAY_MS = 200
// 遮罩一旦顯示，至少停留多久才隱藏（避免「閃一下就消失」的抖動）
const MIN_VISIBLE_MS = 300

// 全域 loading 遮罩狀態（reference counter，支援並發請求；含顯示延遲與最短顯示時間防抖）。
// 由 httpClient 攔截器在 request/response 呼叫 beginLoading/endLoading 驅動。
export const useUiStore = defineStore('ui', () => {
  // overlay 綁定的可見狀態
  const isLoading = ref(false)

  // 進行中的請求數
  let pendingCount = 0
  let showTimer = null
  let hideTimer = null
  let shownAt = 0

  const clearShowTimer = () => {
    if (showTimer) {
      clearTimeout(showTimer)
      showTimer = null
    }
  }

  const clearHideTimer = () => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  const beginLoading = () => {
    pendingCount += 1
    if (pendingCount !== 1) return

    // 有新請求進來：取消任何待隱藏的計時，維持顯示
    clearHideTimer()
    if (isLoading.value) return

    // 排程「延遲後才真正顯示」
    showTimer = setTimeout(() => {
      showTimer = null
      isLoading.value = true
      shownAt = Date.now()
    }, SHOW_DELAY_MS)
  }

  const endLoading = () => {
    pendingCount = Math.max(0, pendingCount - 1)
    if (pendingCount !== 0) return

    // 整段請求都在延遲時間內完成 → 從頭到尾不顯示
    if (showTimer) {
      clearShowTimer()
      return
    }

    if (!isLoading.value) return

    // 已顯示 → 補滿最短顯示時間後才隱藏
    const elapsed = Date.now() - shownAt
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)
    clearHideTimer()
    hideTimer = setTimeout(() => {
      hideTimer = null
      isLoading.value = false
    }, remaining)
  }

  return { isLoading, beginLoading, endLoading }
})
