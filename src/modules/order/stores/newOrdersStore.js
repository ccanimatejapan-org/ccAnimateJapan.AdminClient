import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getNewOrderCount } from '@/modules/order/api/orderApi'

// 每隔多久自動重新查詢一次未處理訂單數
const POLL_INTERVAL_MS = 60_000

// 後台「未處理訂單」數的全域狀態：頁首標示與 Dashboard 訂單卡共用同一份計數。
// 由 DefaultLayout 在掛載/卸載時 startPolling / stopPolling（等同「登入中才輪詢」）。
export const useNewOrdersStore = defineStore('newOrders', () => {
  // 目前未處理（OrderStatus = 顧客已下單）的訂單筆數
  const count = ref(0)

  let pollTimer = null
  let onVisibilityChange = null

  const refresh = async () => {
    try {
      count.value = await getNewOrderCount()
    } catch (error) {
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
    count.value = 0
  }

  return { count, refresh, startPolling, stopPolling }
})
