import { computed, ref } from 'vue'
import {
  listAllOrdersByActivity,
  listDeliveryTypes,
  listOrderActivities,
  listOrderActivityProducts,
} from '@/modules/order/api/orderApi'
import { isActivityReadOnly } from '@/modules/order/utils/activityOrderStatus'

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
  const expandedActivityId = ref('')
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

  const loadActivities = async () => {
    isLoadingActivities.value = true
    errorMessage.value = ''

    try {
      activities.value = await listOrderActivities({ tab: activityTab.value })
      selectedActivityId.value = activities.value[0]?.activityId || ''
      expandedActivityId.value = selectedActivityId.value
    } catch (err) {
      errorMessage.value = err?.message || '活動資料載入失敗'
    } finally {
      isLoadingActivities.value = false
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
    if (!selectedActivityId.value) {
      products.value = []
      return
    }

    try {
      products.value = await listOrderActivityProducts(selectedActivityId.value)
    } catch (_) {
      products.value = []
    }
  }

  const loadOrders = async () => {
    if (!selectedActivityId.value) {
      orders.value = []
      selectedOrder.value = null
      return
    }

    isLoadingOrders.value = true
    errorMessage.value = ''

    try {
      orders.value = await listAllOrdersByActivity(selectedActivityId.value)
      selectedOrder.value = null
    } catch (err) {
      errorMessage.value = err?.message || '訂單資料載入失敗'
    } finally {
      isLoadingOrders.value = false
    }
  }

  const selectActivity = (activityId) => {
    const isExpanded =
      expandedActivityId.value !== '' &&
      Number(expandedActivityId.value) === Number(activityId)

    // 點選已展開的活動 → 收起商品（保留選取狀態，右側訂單不變），方便快速切換其他活動
    if (isExpanded) {
      expandedActivityId.value = ''
      return
    }

    selectedActivityId.value = activityId
    expandedActivityId.value = activityId
  }

  // 切換 tab：清空目前活動選取與明細，依新 tab 呼叫活動列表 API。
  const switchActivityTab = async (nextTab) => {
    if (!VALID_TABS.has(nextTab)) return
    if (activityTab.value === nextTab) return

    activityTab.value = nextTab
    selectedActivityId.value = ''
    expandedActivityId.value = ''
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
    expandedActivityId,
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
    selectActivity,
    switchActivityTab,
  }
}
