<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import OrderDeleteConfirmDialog from '@/modules/order/components/OrderDeleteConfirmDialog.vue'
import OrderBulkStatusConfirmDialog from '@/modules/order/components/OrderBulkStatusConfirmDialog.vue'
import OrderFormDialog from '@/modules/order/components/OrderFormDialog.vue'
import { useOrders, ORDER_ACTIVITY_TABS } from '@/modules/order/composables/useOrders'
import { useOrderForm } from '@/modules/order/composables/useOrderForm'
import { useOrderRowActions } from '@/modules/order/composables/useOrderRowActions'
import { useNewOrdersStore } from '@/modules/order/stores/newOrdersStore'
import { createOrderColumns } from '@/modules/order/utils/orderColumns'
import {
  getActivityKindText,
  getActivityStatusBadge,
  isActivityReadOnly,
} from '@/modules/order/utils/activityOrderStatus'
import { deleteOrder, getOrderDetail, bulkUpdateActivityOrderStatus } from '@/modules/order/api/orderApi'
import PageHeading from '@/shared/components/PageHeading.vue'
import PageShell from '@/shared/components/PageShell.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import { useTableSort } from '@/shared/composables/useTableSort'
import { useTablePagination } from '@/shared/composables/useTablePagination'
import { formatCurrency } from '@/shared/utils/format'
import { ActivityEnum, toDisplayDateTime } from '@/modules/activity/utils/activityMapper'
import {
  ORDER_STATUS_FILTER_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  SHIPPING_PAYMENT_STATUS_OPTIONS,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  getShippingPaymentStatusLabel,
} from '@/modules/order/utils/orderStatuses'

const viewIconPaths = [
  'M2.5 12s3.6-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.6 6.5-9.5 6.5S2.5 12 2.5 12Z',
  'M12 9a3 3 0 1 1 0 6a3 3 0 0 1 0-6Z',
]
const editIconPaths = [
  'M12 20h9',
  'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
]
const downloadIconPaths = [
  'M12 3v11',
  'm7 10 5 5 5-5',
  'M5 16v4h14v-4',
]
const mailIconPaths = [
  'M4 6h16v12H4z',
  'm4 7 8 6 8-6',
]
const cartIconPaths = [
  'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 7H6',
  'M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  'M17 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
]
const truckIconPaths = [
  'M3 7h11v9H3z',
  'M14 10h4l3 3v3h-7z',
  'M7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  'M17 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
]

const BULK_STATUS_PREORDER_COMPLETED = 4
const BULK_STATUS_STOCKED = 5
const BULK_SOURCE_CUSTOMER_PAID = 3

const errorMessage = ref('')
const statusMessage = ref('')
const selectedOrder = ref(null)
const isLoadingDetail = ref(false)
const highlightedOrderId = ref(null)

const route = useRoute()

// 未處理訂單數：與頁首鈴鐺共用同一份全域計數，這裡用來在活動列表標示各活動待處理筆數
const newOrdersStore = useNewOrdersStore()
const { countsByActivity } = storeToRefs(newOrdersStore)
const pendingOrderCount = (activityId) => countsByActivity.value[activityId] || 0

const orderStatusOptions = ORDER_STATUS_FILTER_OPTIONS
const mutationOrderStatusOptions = ORDER_STATUS_OPTIONS
const paymentStatusOptions = PAYMENT_STATUS_OPTIONS

const orderColumns = createOrderColumns()

const {
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
} = useOrders({ errorMessage, selectedOrder })

const activityTabs = [
  { value: ORDER_ACTIVITY_TABS.INCOMPLETE, label: '尚未結單' },
  {
    value: ORDER_ACTIVITY_TABS.CLOSED,
    label: '已結單',
    bulkStatus: BULK_STATUS_PREORDER_COMPLETED,
    bulkSourceStatus: BULK_SOURCE_CUSTOMER_PAID,
  },
  { value: ORDER_ACTIVITY_TABS.PREORDER_COMPLETED, label: '預購已完成', bulkStatus: BULK_STATUS_STOCKED, bulkSourceStatus: BULK_STATUS_PREORDER_COMPLETED },
  { value: ORDER_ACTIVITY_TABS.STOCKED, label: '商品已入庫' },
  { value: ORDER_ACTIVITY_TABS.COMPLETED, label: '已完成' },
]

const currentTabConfig = computed(() =>
  activityTabs.find((tab) => tab.value === activityTab.value) || activityTabs[0],
)

const currentTabBulkStatus = computed(() => currentTabConfig.value.bulkStatus || null)
const currentTabBulkSourceStatus = computed(() => currentTabConfig.value.bulkSourceStatus ?? null)

// 一鍵批次改狀態只在活動「已結束」時開放（活動仍在進行中時，訂單流程還沒進到收單／出貨階段）。
const canBulkUpdateSelectedActivity = computed(() =>
  Number(selectedActivity.value?.status) === ActivityEnum.Ended,
)
const bulkDisabledReason = computed(() => {
  if (!selectedActivityId.value) return '請先選擇活動'
  if (!canBulkUpdateSelectedActivity.value) return '活動尚未結束，無法批次更新'
  return ''
})

const {
  sortedItems: sortedOrders,
  isSortActive,
  toggleSort,
  getSortIndicator,
} = useTableSort(filteredOrders, orderColumns, {
  key: 'createdAt',
  direction: 'desc',
})

const {
  page,
  totalPages,
  paginatedItems: pagedOrders,
  paginationSummary,
  goToPreviousPage,
  goToNextPage,
} = useTablePagination(sortedOrders)

const {
  orderForm,
  editingOrderId,
  isOrderDialogOpen,
  formErrorMessage,
  isSavingOrder,
  formProductOptions,
  openEditOrder,
  closeOrderDialog,
  addOrderItem,
  removeOrderItem,
  submitOrderForm,
} = useOrderForm({
  selectedActivityId,
  selectedActivityReadOnly,
  deliveryTypes,
  products,
  selectedOrder,
  errorMessage,
  isLoadingDetail,
  loadProducts,
  loadOrders,
})

const {
  downloadingOrderId,
  sendingConfirmationOrderId,
  isSendingConfirmationEmail,
  downloadOrderPdfFile,
  sendConfirmationEmail,
} = useOrderRowActions({ errorMessage, statusMessage })

const deleteTargetOrder = ref(null)
const isDeletingOrder = ref(false)

const bulkStatusTarget = ref(null)
const isBulkUpdatingStatus = ref(false)

const resetFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  page.value = 1
}

// 存檔後同步刷新未處理計數，讓活動徽章與頁首鈴鐺立即反映狀態變更
const handleSubmitOrder = async () => {
  await submitOrderForm()
  newOrdersStore.refresh()
}

const openOrderDetail = async (orderId) => {
  isLoadingDetail.value = true
  errorMessage.value = ''

  try {
    selectedOrder.value = await getOrderDetail(orderId)
  } catch (err) {
    errorMessage.value = err?.message || '訂單明細載入失敗'
  } finally {
    isLoadingDetail.value = false
  }
}

const openDeleteOrder = (order) => {
  deleteTargetOrder.value = order
}

const openDeleteEditingOrder = () => {
  if (!selectedOrder.value?.id) return
  openDeleteOrder(selectedOrder.value)
}

const closeDeleteDialog = () => {
  deleteTargetOrder.value = null
}

const confirmDeleteOrder = async () => {
  if (!deleteTargetOrder.value) return

  isDeletingOrder.value = true
  errorMessage.value = ''

  try {
    await deleteOrder(deleteTargetOrder.value.id)
    if (editingOrderId.value === deleteTargetOrder.value.id) {
      closeOrderDialog()
      editingOrderId.value = null
    }
    if (selectedOrder.value?.id === deleteTargetOrder.value.id) {
      selectedOrder.value = null
    }
    closeDeleteDialog()
    await Promise.all([loadProducts(), loadOrders()])
    newOrdersStore.refresh()
  } catch (err) {
    errorMessage.value = err?.message || '訂單刪除失敗'
  } finally {
    isDeletingOrder.value = false
  }
}

const openBulkStatusDialog = (orderStatus) => {
  if (!selectedActivityId.value || !canBulkUpdateSelectedActivity.value) return
  bulkStatusTarget.value = {
    orderStatus,
    sourceOrderStatus: currentTabBulkSourceStatus.value,
  }
}

const closeBulkStatusDialog = () => {
  bulkStatusTarget.value = null
}

const confirmBulkStatusUpdate = async () => {
  if (!bulkStatusTarget.value || !selectedActivityId.value) return

  isBulkUpdatingStatus.value = true
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const result = await bulkUpdateActivityOrderStatus(
      selectedActivityId.value,
      bulkStatusTarget.value.orderStatus,
      bulkStatusTarget.value.sourceOrderStatus,
    )
    const updatedCount = Number(result?.updatedCount ?? 0)
    const label = getOrderStatusLabel(bulkStatusTarget.value.orderStatus)
    statusMessage.value = updatedCount > 0
      ? `已將 ${updatedCount} 筆訂單狀態改為「${label}」`
      : `沒有需要更新的訂單（皆已為「${label}」或已取消）`
    closeBulkStatusDialog()
    await loadOrders()
    newOrdersStore.refresh()
  } catch (err) {
    errorMessage.value = err?.message || '批次更新訂單狀態失敗'
  } finally {
    isBulkUpdatingStatus.value = false
  }
}

watch(selectedActivityId, async () => {
  page.value = 1
  selectedOrder.value = null
  await Promise.all([loadProducts(), loadOrders()])
})

watch([searchKeyword, statusFilter], () => {
  page.value = 1
})

let highlightTimer = null

// 從頁首「新訂單」下拉點進來時，暫時標示該筆訂單（幾秒後淡出）
const highlightOrder = (orderId) => {
  highlightedOrderId.value = orderId
  if (highlightTimer) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => {
    highlightedOrderId.value = null
    highlightTimer = null
  }, 5000)
}

// 依網址參數選取活動並標示訂單（onMounted 與換頁時各套用一次）
const applyRouteSelection = () => {
  const activityIdParam = Number(route.query.activityId)
  const orderIdParam = Number(route.query.orderId)

  if (activityIdParam && Number(selectedActivityId.value) !== activityIdParam) {
    selectedActivityId.value = activityIdParam
    expandedActivityId.value = activityIdParam
  }

  if (orderIdParam) {
    highlightOrder(orderIdParam)
  }
}

watch(
  () => [route.query.activityId, route.query.orderId],
  () => applyRouteSelection(),
)

onMounted(async () => {
  await Promise.all([loadActivities(), loadDeliveryTypes()])
  applyRouteSelection()
})

onUnmounted(() => {
  if (highlightTimer) clearTimeout(highlightTimer)
})
</script>

<template>
  <PageShell>
    <section class="orders-hero">
      <div class="orders-hero__title">
        <span class="orders-hero__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z" />
            <path d="M8 8h8" />
            <path d="M8 12h8" />
            <path d="M8 16h5" />
          </svg>
        </span>
        <PageHeading title="訂單管理" />
      </div>
    </section>

    <nav class="order-tabs" role="tablist" aria-label="訂單分頁">
      <button
        v-for="tab in activityTabs"
        :key="tab.value"
        type="button"
        role="tab"
        class="order-tab"
        :class="{ 'order-tab--active': activityTab === tab.value }"
        :aria-selected="activityTab === tab.value"
        :disabled="isLoadingActivities || activityTab === tab.value"
        @click="switchActivityTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <MessageBlock v-if="errorMessage" tone="error">
      {{ errorMessage }}
    </MessageBlock>

    <MessageBlock v-if="statusMessage" tone="success">
      {{ statusMessage }}
    </MessageBlock>

    <div class="orders-layout">
      <aside class="activity-panel">
        <div class="panel-title">
          <h2>活動</h2>
          <span>{{ activities.length }}</span>
        </div>

        <MessageBlock v-if="!isLoadingActivities && activities.length === 0" tone="empty">
          {{ currentTabConfig.label === '尚未結單' ? '目前沒有可顯示的活動' : `沒有屬於「${currentTabConfig.label}」分頁的活動` }}
        </MessageBlock>

        <div class="activity-list">
          <div
            v-for="activity in activities"
            :key="activity.activityId"
            class="activity-group"
          >
            <button
              type="button"
              class="activity-item"
              :class="{
                'activity-item--active': Number(activity.activityId) === Number(selectedActivityId),
                'activity-item--readonly': isActivityReadOnly(activity),
              }"
              @click="selectActivity(activity.activityId)"
            >
              <img
                class="activity-image"
                :src="activity.imageUrl || '/cc-admin-mark.svg'"
                alt=""
              />
              <span class="activity-name-row">
                <span class="activity-name">{{ activity.activityName || `#${activity.activityId}` }}</span>
                <span
                  v-if="pendingOrderCount(activity.activityId) > 0"
                  class="activity-pending-badge"
                  :title="`還有 ${pendingOrderCount(activity.activityId)} 筆未處理訂單`"
                  :aria-label="`還有 ${pendingOrderCount(activity.activityId)} 筆未處理訂單`"
                >
                  {{ pendingOrderCount(activity.activityId) }}
                </span>
                <svg
                  class="activity-caret"
                  :class="{ 'activity-caret--open': Number(activity.activityId) === Number(expandedActivityId) }"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
              <span class="activity-badges">
                <span
                  class="activity-kind-badge"
                  :class="{ 'activity-kind-badge--preorder': activity.isPreOrder }"
                >
                  {{ getActivityKindText(activity) }}
                </span>
                <span
                  v-if="isActivityReadOnly(activity)"
                  class="activity-status-badge activity-status-badge--readonly"
                >
                  {{ getActivityStatusBadge(activity) }}
                </span>
              </span>
              <span class="activity-time">
                {{ toDisplayDateTime(activity.activeStartTime) }} - {{ toDisplayDateTime(activity.activeEndTime) }}
              </span>
            </button>

            <div
              v-if="Number(activity.activityId) === Number(expandedActivityId)"
              class="product-summary"
            >
              <div class="panel-title panel-title--compact">
                <h2>可訂購商品</h2>
                <span>{{ products.length }}</span>
              </div>
              <div class="product-list">
                <div v-for="product in products" :key="product.productId" class="product-row">
                  <span>{{ product.name || `#${product.productId}` }}</span>
                  <strong>{{ formatCurrency(product.price) }}</strong>
                </div>
                <MessageBlock v-if="products.length === 0" tone="empty">
                  此活動沒有可訂購商品
                </MessageBlock>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section class="orders-panel">
        <div class="orders-header">
          <div>
            <p class="section-eyebrow">Activity</p>
            <div class="orders-title-row">
              <h2>{{ selectedActivity?.activityName || '訂單列表' }}</h2>
              <span
                v-if="selectedActivity"
                class="activity-kind-badge"
                :class="{ 'activity-kind-badge--preorder': selectedActivity.isPreOrder }"
              >
                {{ getActivityKindText(selectedActivity) }}
              </span>
            </div>
          </div>
          <div class="orders-header-actions">
            <button
              v-if="currentTabBulkStatus === BULK_STATUS_PREORDER_COMPLETED"
              class="bulk-status-button bulk-status-button--preorder"
              type="button"
              aria-label="將此活動所有訂單改為預購已完成"
              :title="bulkDisabledReason || '一鍵改為「預購已完成」'"
              :disabled="!selectedActivityId || !canBulkUpdateSelectedActivity || isBulkUpdatingStatus"
              @click="openBulkStatusDialog(BULK_STATUS_PREORDER_COMPLETED)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path v-for="path in cartIconPaths" :key="path" :d="path" />
              </svg>
              <span>一鍵改為「預購已完成」</span>
            </button>
            <button
              v-if="currentTabBulkStatus === BULK_STATUS_STOCKED"
              class="bulk-status-button bulk-status-button--stocked"
              type="button"
              aria-label="將此活動所有訂單改為商品已入庫"
              :title="bulkDisabledReason || '一鍵改為「商品已入庫」'"
              :disabled="!selectedActivityId || !canBulkUpdateSelectedActivity || isBulkUpdatingStatus"
              @click="openBulkStatusDialog(BULK_STATUS_STOCKED)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path v-for="path in truckIconPaths" :key="path" :d="path" />
              </svg>
              <span>一鍵改為「商品已入庫」</span>
            </button>
            <span class="total-pill">{{ totalCount }} 筆</span>
          </div>
        </div>

        <section class="filter-panel" aria-label="訂單搜尋條件">
          <div class="filter-bar">
            <label>
              <span>訂購人</span>
              <input v-model.trim="searchKeyword" type="search" />
            </label>

            <label>
              <span>訂單狀態</span>
              <select v-model="statusFilter">
                <option
                  v-for="option in orderStatusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>

          <div class="filter-actions">
            <div class="filter-summary">
              {{ hasFiltersApplied ? `篩選後 ${totalCount} 筆` : '顯示全部訂單' }}
            </div>
            <button
              type="button"
              class="ghost-button"
              :disabled="!hasFiltersApplied"
              @click="resetFilters"
            >
              清除條件
            </button>
          </div>
        </section>

        <MessageBlock v-if="!selectedActivityId" tone="empty">
          請先選擇活動
        </MessageBlock>

        <MessageBlock v-else-if="!isLoadingOrders && totalCount === 0" tone="empty">
          {{ orders.length ? '沒有符合條件的訂單' : '目前沒有訂單' }}
        </MessageBlock>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th
                  v-for="column in orderColumns"
                  :key="column.key"
                >
                  <button
                    v-if="column.sortable"
                    class="table-sort-button"
                    type="button"
                    :class="{ 'is-active': isSortActive(column) }"
                    @click="toggleSort(column)"
                  >
                    <span>{{ column.label }}</span>
                    <span class="sort-indicator" aria-hidden="true">{{ getSortIndicator(column) }}</span>
                  </button>
                  <span v-else>{{ column.label }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="order in pagedOrders"
                :key="order.id"
                :class="{ 'order-row--highlight': Number(order.id) === Number(highlightedOrderId) }"
              >
                <td>#{{ order.id }}</td>
                <td>{{ order.subscriberName }}</td>
                <td>{{ order.memberDisplayName || '—' }}</td>
                <td>{{ order.subscriberBank }}</td>
                <td>{{ formatCurrency(order.grandTotal) }}</td>
                <td>
                  <span class="status-chip">{{ getOrderStatusLabel(order.orderStatus) }}</span>
                </td>
                <td>{{ toDisplayDateTime(order.createdAt) }}</td>
                <td>
                  <div class="table-actions">
                    <button
                      type="button"
                      class="table-action-button icon-action-button"
                      aria-label="查看訂單"
                      title="查看訂單"
                      @click="openOrderDetail(order.id)"
                    >
                      <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path v-for="path in viewIconPaths" :key="path" :d="path" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="table-action-button icon-action-button table-action-button--edit"
                      aria-label="編輯訂單"
                      title="編輯訂單"
                      @click="openEditOrder(order)"
                    >
                      <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
                        <path v-for="path in editIconPaths" :key="path" :d="path" />
                      </svg>
                    </button>
                    <button type="button" class="link-button" @click="openOrderDetail(order.id)">
                      查看
                    </button>
                    <button type="button" class="link-button" @click="openEditOrder(order)">
                      編輯
                    </button>
                    <button type="button" class="danger-link-button" @click="openDeleteOrder(order)">
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pager">
          <button type="button" class="ghost-button" :disabled="page <= 1" @click="goToPreviousPage">
            上一頁
          </button>
          <span>{{ paginationSummary }}</span>
          <button
            type="button"
            class="ghost-button"
            :disabled="totalPages === 0 || page >= totalPages"
            @click="goToNextPage"
          >
            下一頁
          </button>
        </div>

        <section v-if="selectedOrder" class="detail-panel">
          <div class="orders-header">
            <div>
              <p class="section-eyebrow">Order #{{ selectedOrder.id }}</p>
              <h2>{{ selectedOrder.subscriberName }}</h2>
            </div>
            <div class="detail-header-actions">
              <button
                type="button"
                class="table-action-button icon-action-button table-action-button--download"
                :aria-label="downloadingOrderId === selectedOrder.id ? 'PDF 下載中' : '下載訂單 PDF'"
                :title="downloadingOrderId === selectedOrder.id ? 'PDF 下載中' : '下載訂單 PDF'"
                :disabled="downloadingOrderId === selectedOrder.id"
                @click="downloadOrderPdfFile(selectedOrder.id)"
              >
                <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path v-for="path in downloadIconPaths" :key="path" :d="path" />
                </svg>
              </button>
              <button
                type="button"
                class="table-action-button icon-action-button table-action-button--email"
                :aria-label="sendingConfirmationOrderId === selectedOrder.id ? '確認信寄送中' : '寄送訂單確認信'"
                :title="sendingConfirmationOrderId === selectedOrder.id ? '確認信寄送中' : '寄送訂單確認信'"
                :disabled="isSendingConfirmationEmail"
                @click="sendConfirmationEmail(selectedOrder.id)"
              >
                <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path v-for="path in mailIconPaths" :key="path" :d="path" />
                </svg>
              </button>
            </div>
          </div>

          <dl class="detail-grid">
            <div>
              <dt>Email</dt>
              <dd>{{ selectedOrder.subscriberEmail }}</dd>
            </div>
            <div>
              <dt>帳號後五碼</dt>
              <dd>{{ selectedOrder.subscriberBank }}</dd>
            </div>
            <div>
              <dt>配送方式</dt>
              <dd>{{ selectedOrder.deliveryType?.name || '-' }}</dd>
            </div>
            <div>
              <dt>訂單狀態</dt>
              <dd>{{ getOrderStatusLabel(selectedOrder.orderStatus) }}</dd>
            </div>
            <div>
              <dt>付款狀態</dt>
              <dd>{{ getPaymentStatusLabel(selectedOrder.paymentStatus) }}</dd>
            </div>
            <div v-if="selectedOrder.shippingFee > 0">
              <dt>自行補運費</dt>
              <dd>{{ getShippingPaymentStatusLabel(selectedOrder.shippingPaymentStatus) }}（{{ formatCurrency(selectedOrder.shippingFee) }}）</dd>
            </div>
            <div>
              <dt>建立時間</dt>
              <dd>{{ toDisplayDateTime(selectedOrder.createdAt) }}</dd>
            </div>
          </dl>

          <div class="detail-items">
            <div v-for="(item, index) in selectedOrder.items || []" :key="`${item.productId}-${index}`" class="detail-item">
              <img class="detail-image" :src="item.imageUrl || '/cc-admin-mark.svg'" alt="" />
              <div>
                <strong>{{ item.name || `#${item.productId}` }}</strong>
                <span>{{ item.amount }} x {{ formatCurrency(item.price) }}</span>
                <small v-if="item.info" class="detail-item-info">
                  商品備註 / 規格：{{ item.info }}
                </small>
              </div>
              <b>{{ formatCurrency(item.subTotal) }}</b>
            </div>
          </div>

          <div v-if="selectedOrder.shippingFee > 0" class="detail-total-breakdown">
            <span>商品小計 {{ formatCurrency(selectedOrder.total) }}</span>
            <span>補運費 {{ formatCurrency(selectedOrder.shippingFee) }}</span>
          </div>
          <div class="detail-total" aria-label="訂單總額">
            <span>訂單總額</span>
            <strong>{{ formatCurrency(selectedOrder.grandTotal) }}</strong>
          </div>
        </section>

        <MessageBlock v-else-if="isLoadingDetail" tone="empty">
          明細載入中
        </MessageBlock>
      </section>
    </div>

    <OrderFormDialog
      v-if="isOrderDialogOpen"
      :form="orderForm"
      :editing-order-id="editingOrderId"
      :products="formProductOptions"
      :delivery-types="deliveryTypes"
      :order-status-options="mutationOrderStatusOptions"
      :payment-status-options="paymentStatusOptions"
      :shipping-payment-status-options="SHIPPING_PAYMENT_STATUS_OPTIONS"
      :is-saving="isSavingOrder"
      :error-message="formErrorMessage"
      @close="closeOrderDialog"
      @submit="handleSubmitOrder"
      @add-item="addOrderItem"
      @remove-item="removeOrderItem"
      @delete="openDeleteEditingOrder"
    />

    <OrderDeleteConfirmDialog
      v-if="deleteTargetOrder"
      :order="deleteTargetOrder"
      :is-deleting="isDeletingOrder"
      @close="closeDeleteDialog"
      @confirm="confirmDeleteOrder"
    />

    <OrderBulkStatusConfirmDialog
      v-if="bulkStatusTarget"
      :activity-name="selectedActivity?.activityName || ''"
      :order-status="bulkStatusTarget.orderStatus"
      :source-order-status="bulkStatusTarget.sourceOrderStatus"
      :is-submitting="isBulkUpdatingStatus"
      @close="closeBulkStatusDialog"
      @confirm="confirmBulkStatusUpdate"
    />
  </PageShell>
</template>

<style scoped lang="scss" src="../styles/order-list.scss"></style>

<style scoped>
tbody tr.order-row--highlight > td {
  background: #fff6ce;
  animation: order-row-flash 1.4s ease;
}

@keyframes order-row-flash {
  from {
    background: #ffe08a;
  }

  to {
    background: #fff6ce;
  }
}
</style>
