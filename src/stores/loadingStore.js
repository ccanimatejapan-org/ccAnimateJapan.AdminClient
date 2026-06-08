import { ref } from 'vue'

// 進行中的請求出現多久後才真正顯示遮罩（避免極快請求閃一下）
const SHOW_DELAY_MS = 200
// 遮罩一旦顯示，至少停留多久才隱藏（避免「閃一下就消失」的抖動）
const MIN_VISIBLE_MS = 300

// 進行中的請求數（reference counter，支援並發請求）
const pendingCount = ref(0)
// overlay 綁定的可見狀態
export const isLoading = ref(false)

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

export const beginLoading = () => {
  pendingCount.value += 1
  if (pendingCount.value !== 1) return

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

export const endLoading = () => {
  pendingCount.value = Math.max(0, pendingCount.value - 1)
  if (pendingCount.value !== 0) return

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
