import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { getNewOrderCount, listNewOrders } from '@/modules/order/api/orderApi'

// 每隔多久自動重新查詢一次未處理訂單數
const POLL_INTERVAL_MS = 60_000

// 依 activityId 彙總未處理訂單清單，回傳 { [activityId]: 筆數 }
const groupCountByActivity = (orders) => {
  const counts = {}
  for (const order of orders) {
    const { activityId } = order
    if (activityId == null) continue
    counts[activityId] = (counts[activityId] || 0) + 1
  }
  return counts
}

// 後台「未處理訂單」數的全域狀態：頁首標示與 Dashboard 訂單卡共用同一份計數。
// 由 DefaultLayout 在掛載/卸載時 startPolling / stopPolling（等同「登入中才輪詢」）。
export const useNewOrdersStore = defineStore('newOrders', () => {
  // 目前未處理（OrderStatus = 顧客已下單）的訂單筆數
  const count = ref(0)
  // 依活動分組的未處理訂單數（訂單頁活動列表徽章用），key 為 activityId
  const countsByActivity = ref({})

  let pollTimer = null
  let onVisibilityChange = null
  // 輪詢、分頁切回、換頁、訂單動作後的重整可能重疊：只採用最後一次發出的回應，
  // 避免較早發出（資料較舊）的回應晚到，把剛更新的數字蓋回去。
  let refreshToken = 0

  const refresh = async () => {
    const token = ++refreshToken

    try {
      const [total, newOrders] = await Promise.all([getNewOrderCount(), listNewOrders()])
      if (token !== refreshToken) return

      count.value = total
      countsByActivity.value = groupCountByActivity(newOrders)
    } catch (error) {
      if (token !== refreshToken) return
      // 靜默失敗：保留前一次數字，僅記錄以利除錯，不打斷後台操作
      console.error('[newOrders] 更新未處理訂單數失敗', error)
    }
  }

  const startPolling = () => {
    if (pollTimer) return
    refresh()
    pollTimer = setInterval(refresh, POLL_INTERVAL_MS)
    // 分頁切回可見時立即更新（比等下一次輪詢更即時）
    onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (onVisibilityChange) {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      onVisibilityChange = null
    }
    // 讓還在途中的重整作廢，避免登出 / 卸載後晚到的回應又把數字填回來
    refreshToken += 1
    count.value = 0
    countsByActivity.value = {}
  }

  return { count, countsByActivity, refresh, startPolling, stopPolling }
})

// 讓 store 於開發時支援熱替換，避免改動 store 後舊實例殘留（狀態形狀不同）而報錯
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNewOrdersStore, import.meta.hot))
}
