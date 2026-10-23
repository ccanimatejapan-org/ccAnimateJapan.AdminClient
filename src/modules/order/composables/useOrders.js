import { computed, ref } from 'vue'
import {
  getOrderDetail,
  listAllOrdersByActivity,
  listDeliveryTypes,
  listOrderActivities,
  listOrderActivityProducts,
} from '@/modules/order/api/orderApi'
import { isActivityReadOnly } from '@/modules/order/utils/activityOrderStatus'
import { resolveSelectedActivityId } from '@/modules/order/utils/orderActivitySelection'

const normalizeText = (value) => String(value || '').trim().toLowerCase()

export const ORDER_ACTIVITY_TABS = {
  INCOMPLETE: 'incomplete',
  CLOSED: 'closed',
  PREORDER_COMPLETED: 'preorderCompleted',
  STOCKED: 'stocked',
  COMPLETED: 'completed',
}

const VALID_TABS = new Set(Object.values(ORDER_ACTIVITY_TABS))

export const useOrders = ({ errorMessage, selectedOrder }) => {
  const activities = ref([])
  const selectedActivityId = ref('')
  const deliveryTypes = ref([])
  const products = ref([])
  const orders = ref([])
  const searchKeyword = ref('')
  const statusFilter = ref('')
  const isLoadingActivities = ref(false)
  const isLoadingOrders = ref(false)
  const activityTab = ref(ORDER_ACTIVITY_TABS.INCOMPLETE)

  const selectedActivity = computed(() =>
    activities.value.find((activity) => Number(activity.activityId) === Number(selectedActivityId.value)) || null,
  )

  const selectedActivityReadOnly = computed(() => isActivityReadOnly(selectedActivity.value))

  const filteredOrders = computed(() => {
    const keyword = normalizeText(searchKeyword.value)
    const selectedOrderStatus = statusFilter.value ? Number(statusFilter.value) : null

    return orders.value.filter((order) => {
      if (keyword && !normalizeText(order.subscriberName).includes(keyword)) {
        return false
      }

      if (selectedOrderStatus && Number(order.orderStatus) !== selectedOrderStatus) {
        return false
      }

      return true
    })
  })

  const totalCount = computed(() => filteredOrders.value.length)

  const hasFiltersApplied = computed(() =>
    Boolean(normalizeText(searchKeyword.value) || statusFilter.value),
  )

  // 每種載入各自一組 request token：同一種載入重複觸發（連點、切換活動 / 分頁、動作後重整）時，
  // 只採用最後一次發出的回應，舊回應晚到也不會蓋掉新資料（寫法同 ReportsPage）。
  let activitiesRequestToken = 0
  let productsRequestToken = 0
  let ordersRequestToken = 0
  let orderDetailRequestToken = 0

  // preserveSelection：重整時保持目前選取的活動（它還在列表中的話）；一般載入則選第一個。
  const loadActivities = async ({ preserveSelection = false } = {}) => {
    const token = ++activitiesRequestToken
    isLoadingActivities.value = true
    errorMessage.value = ''

    try {
      const result = await listOrderActivities({ tab: activityTab.value })
      if (token !== activitiesRequestToken) return

      activities.value = result
      selectedActivityId.value = resolveSelectedActivityId(result, selectedActivityId.value, { preserveSelection })
    } catch (err) {
      if (token !== activitiesRequestToken) return
      errorMessage.value = err?.message || '活動資料載入失敗'
    } finally {
      if (token === activitiesRequestToken) isLoadingActivities.value = false
    }
  }

  const loadDeliveryTypes = async () => {
    try {
      deliveryTypes.value = await listDeliveryTypes()
    } catch (err) {
      errorMessage.value = err?.message || '配送方式載入失敗'
    }
  }

  const loadProducts = async () => {
    const token = ++productsRequestToken

    if (!selectedActivityId.value) {
      products.value = []
      return
    }

    try {
      const result = await listOrderActivityProducts(selectedActivityId.value)
      if (token !== productsRequestToken) return

      products.value = result
    } catch (_) {
      if (token !== productsRequestToken) return
      products.value = []
    }
  }

  const loadOrders = async () => {
    const token = ++ordersRequestToken

    if (!selectedActivityId.value) {
      orders.value = []
      selectedOrder.value = null
      isLoadingOrders.value = false
      return
    }

    isLoadingOrders.value = true
    errorMessage.value = ''

    try {
      const result = await listAllOrdersByActivity(selectedActivityId.value)
      if (token !== ordersRequestToken) return

      orders.value = result
    } catch (err) {
      if (token !== ordersRequestToken) return
      errorMessage.value = err?.message || '訂單資料載入失敗'
    } finally {
      if (token === ordersRequestToken) isLoadingOrders.value = false
    }
  }

  // 重新取得目前開著的訂單明細（狀態變更後明細上的狀態 / 付款資訊要跟著更新）。
  // 期間使用者關掉明細或改看別筆 / 別的活動，就不把舊明細蓋回去；訂單已不存在（404）則關閉明細。
  const reloadSelectedOrderDetail = async () => {
    const orderId = selectedOrder.value?.id
    if (!orderId) return

    const token = ++orderDetailRequestToken
    const isStale = () => token !== orderDetailRequestToken || selectedOrder.value?.id !== orderId

    try {
      const detail = await getOrderDetail(orderId)
      if (isStale()) return

      selectedOrder.value = detail
    } catch (err) {
      if (isStale()) return

      selectedOrder.value = null
      if (err?.status !== 404) errorMessage.value = err?.message || '訂單明細重新載入失敗'
    }
  }

  // 訂單狀態 / 內容變更（編輯、批次改狀態、刪除、寄確認信）後的立即重整：
  // 重新取得活動列表（活動依「非取消訂單的最低狀態」歸屬分頁，狀態變更後活動可能移到別的分頁）、
  // 目前活動的訂單，以及開著的訂單明細。商品清單不在這裡取：只有編輯視窗要用，由 openEditOrder 打開時才取。
  // 停留在目前分頁 / 活動 / 搜尋條件 / 頁碼；只有目前活動已不屬於這個分頁時，選取才會退回第一個活動
  // （由頁面對 selectedActivityId 的 watch 接手：回到第 1 頁並載入新活動的資料）。
  const refreshAfterOrderChange = async () => {
    await Promise.all([
      loadActivities({ preserveSelection: true }),
      loadOrders(),
      reloadSelectedOrderDetail(),
    ])
  }

  const selectActivity = (activityId) => {
    selectedActivityId.value = activityId
  }

  // 切換 tab：清空目前活動選取與明細，依新 tab 呼叫活動列表 API。
  const switchActivityTab = async (nextTab) => {
    if (!VALID_TABS.has(nextTab)) return
    if (activityTab.value === nextTab) return

    activityTab.value = nextTab
    selectedActivityId.value = ''
    products.value = []
    orders.value = []
    selectedOrder.value = null
    searchKeyword.value = ''
    statusFilter.value = ''

    await loadActivities()
  }

  return {
    activities,
    selectedActivityId,
    deliveryTypes,
    products,
    orders,
    isLoadingActivities,
    isLoadingOrders,
    searchKeyword,
    statusFilter,
    selectedActivity,
    selectedActivityReadOnly,
    filteredOrders,
    totalCount,
    hasFiltersApplied,
    activityTab,
    loadActivities,
    loadDeliveryTypes,
    loadProducts,
    loadOrders,
    refreshAfterOrderChange,
    selectActivity,
    switchActivityTab,
  }
}
