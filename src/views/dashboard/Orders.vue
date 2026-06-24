<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  createOrder,
  deleteOrder,
  downloadOrderPdf,
  getOrderDetail,
  listDeliveryTypes,
  listAllOrdersByActivity,
  listOrderActivities,
  listOrderActivityProducts,
  sendOrderConfirmationEmail,
  updateOrder,
} from '@/api/orders'
import OrderDeleteConfirmDialog from '@/components/orders/OrderDeleteConfirmDialog.vue'
import OrderFormDialog from '@/components/orders/OrderFormDialog.vue'
import PageHeading from '@/components/layout/PageHeading.vue'
import PageShell from '@/components/layout/PageShell.vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'
import { ActivityEnum, toDisplayDateTime } from '@/utils/activities/activityMapper'
import {
  DELIVERY_STATUS_OPTIONS,
  ORDER_STATUS_FILTER_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  getDeliveryStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  isValidDeliveryStatus,
  isValidOrderStatus,
  isValidPaymentStatus,
} from '@/utils/orders/orderStatuses'
import { sortTableItems } from '@/utils/tableSort'

const pageSize = 10
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

const activities = ref([])
const selectedActivityId = ref('')
const expandedActivityId = ref('')
const deliveryTypes = ref([])
const products = ref([])
const orders = ref([])
const selectedOrder = ref(null)
const isOrderDialogOpen = ref(false)
const editingOrderId = ref(null)
const deleteTargetOrder = ref(null)
const searchKeyword = ref('')
const statusFilter = ref('')
const page = ref(1)
const sortState = ref({
  key: 'createdAt',
  direction: 'desc',
})
const isLoadingActivities = ref(false)
const isLoadingOrders = ref(false)
const isLoadingDetail = ref(false)
const isSavingOrder = ref(false)
const isDeletingOrder = ref(false)
const downloadingOrderId = ref(null)
const sendingConfirmationOrderId = ref(null)
const errorMessage = ref('')
const statusMessage = ref('')
const formErrorMessage = ref('')

const createEmptyOrderItem = () => ({
  productId: '',
  amount: 1,
  info: '',
})

const createEmptyOrderForm = () => ({
  subscriberName: '',
  subscriberEmail: '',
  subscriberBank: '',
  deliveryTypeId: '',
  orderStatus: 1,
  paymentStatus: 1,
  deliveryStatus: 1,
  items: [createEmptyOrderItem()],
})

const orderForm = ref(createEmptyOrderForm())

const isBlankValue = (value) => value === undefined || value === null || String(value).trim() === ''

const hasPositiveNumberValue = (value) => {
  if (isBlankValue(value)) return false

  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0
}

const formatRequiredFieldsMessage = (fields) => `請填寫：${fields.join('、')}。`

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

const selectedActivity = computed(() =>
  activities.value.find((activity) => Number(activity.activityId) === Number(selectedActivityId.value)) || null,
)

const isActivityEnded = (activity) => Number(activity?.status) === ActivityEnum.Ended

const selectedActivityEnded = computed(() => isActivityEnded(selectedActivity.value))

const getActivityKindText = (activity) => (activity?.isPreOrder ? '預購' : '現貨')

const orderStatusOptions = ORDER_STATUS_FILTER_OPTIONS
const mutationOrderStatusOptions = ORDER_STATUS_OPTIONS
const paymentStatusOptions = PAYMENT_STATUS_OPTIONS
const deliveryStatusOptions = DELIVERY_STATUS_OPTIONS

const orderColumns = [
  { key: 'id', label: '訂單', sortable: true, getValue: (order) => Number(order.id || 0) },
  { key: 'subscriberName', label: '訂購人', sortable: true, getValue: (order) => order.subscriberName || '' },
  { key: 'subscriberBank', label: '帳號後五碼', sortable: true, getValue: (order) => order.subscriberBank || '' },
  { key: 'total', label: '金額', sortable: true, getValue: (order) => Number(order.total || 0) },
  { key: 'orderStatus', label: '訂單狀態', sortable: true, getValue: (order) => Number(order.orderStatus || 0) },
  { key: 'createdAt', label: '建立時間', sortable: true, getValue: (order) => new Date(order.createdAt || 0) },
  { key: 'actions', label: '', sortable: false },
]

const formProductOptions = computed(() => {
  const optionsById = new Map(
    products.value.map((product) => [Number(product.productId), product]),
  )

  ;(selectedOrder.value?.items || []).forEach((item) => {
    const productId = Number(item.productId)
    if (!optionsById.has(productId)) {
      optionsById.set(productId, {
        productId,
        name: item.name,
        price: item.price,
        amount: item.amount,
      })
    }
  })

  return Array.from(optionsById.values())
})

const normalizeText = (value) => String(value || '').trim().toLowerCase()

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

const sortedOrders = computed(() => {
  const activeColumn = orderColumns.find((column) => column.key === sortState.value.key)
  if (!activeColumn?.sortable) {
    return filteredOrders.value
  }

  return sortTableItems(filteredOrders.value, sortState.value, activeColumn.getValue)
})

const totalCount = computed(() => filteredOrders.value.length)

const hasFiltersApplied = computed(() =>
  Boolean(normalizeText(searchKeyword.value) || statusFilter.value),
)

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

const isSendingConfirmationEmail = computed(() => sendingConfirmationOrderId.value !== null)

const pagedOrders = computed(() => {
  const start = (page.value - 1) * pageSize
  return sortedOrders.value.slice(start, start + pageSize)
})

const isSortActive = (column) => sortState.value.key === column.key

const toggleSort = (column) => {
  if (!column.sortable) return

  if (isSortActive(column)) {
    sortState.value = {
      key: column.key,
      direction: sortState.value.direction === 'asc' ? 'desc' : 'asc',
    }
    return
  }

  sortState.value = {
    key: column.key,
    direction: 'asc',
  }
}

const getSortIndicator = (column) => {
  if (!column.sortable) return ''
  if (!isSortActive(column)) return '↕'
  return sortState.value.direction === 'asc' ? '↑' : '↓'
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const triggerBlobDownload = (blob, fileName) => {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const downloadOrderPdfFile = async (orderId) => {
  if (!orderId) {
    errorMessage.value = '訂單 ID 無效，無法下載 PDF。'
    return
  }

  downloadingOrderId.value = orderId
  errorMessage.value = ''

  try {
    const { blob, fileName } = await downloadOrderPdf(orderId)
    triggerBlobDownload(blob, fileName)
  } catch (err) {
    errorMessage.value = err?.message || '下載訂單 PDF 失敗'
  } finally {
    downloadingOrderId.value = null
  }
}

const sendConfirmationEmail = async (orderId) => {
  if (!orderId) {
    errorMessage.value = '訂單 ID 無效，無法寄送確認信。'
    return
  }

  if (isSendingConfirmationEmail.value) return

  sendingConfirmationOrderId.value = orderId
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const result = await sendOrderConfirmationEmail(orderId)
    const recipient = result?.recipient || '顧客 Email'
    statusMessage.value = `訂單 #${result?.orderId || orderId} 確認信已寄送至 ${recipient}。`
  } catch (err) {
    errorMessage.value = err?.message || '訂單確認信寄送失敗'
  } finally {
    sendingConfirmationOrderId.value = null
  }
}

const loadActivities = async () => {
  isLoadingActivities.value = true
  errorMessage.value = ''

  try {
    activities.value = await listOrderActivities()
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

const resetFilters = () => {
  searchKeyword.value = ''
  statusFilter.value = ''
  page.value = 1
}

const goPage = (nextPage) => {
  if (nextPage < 1 || nextPage > totalPages.value) return
  page.value = nextPage
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

const openCreateOrder = () => {
  if (!selectedActivityId.value) {
    errorMessage.value = '請先選擇活動'
    return
  }

  if (selectedActivityEnded.value) {
    errorMessage.value = '活動已結束，無法新增訂單'
    return
  }

  editingOrderId.value = null
  selectedOrder.value = null
  orderForm.value = createEmptyOrderForm()
  orderForm.value.deliveryTypeId = deliveryTypes.value[0]?.id || ''
  formErrorMessage.value = ''
  isOrderDialogOpen.value = true
}

const openEditOrder = async (order) => {
  isLoadingDetail.value = true
  formErrorMessage.value = ''
  errorMessage.value = ''

  try {
    const detail = await getOrderDetail(order.id)
    selectedOrder.value = detail
    editingOrderId.value = detail.id
    orderForm.value = {
      subscriberName: detail.subscriberName || '',
      subscriberEmail: detail.subscriberEmail || '',
      subscriberBank: detail.subscriberBank || '',
      deliveryTypeId: detail.deliveryType?.id || '',
      orderStatus: detail.orderStatus || 1,
      paymentStatus: detail.paymentStatus || 1,
      deliveryStatus: detail.deliveryStatus || 1,
      items: (detail.items || []).map((item) => ({
        productId: item.productId,
        amount: item.amount,
        info: String(item.info || '').slice(0, 10),
      })),
    }
    if (orderForm.value.items.length === 0) {
      orderForm.value.items = [createEmptyOrderItem()]
    }
    isOrderDialogOpen.value = true
  } catch (err) {
    errorMessage.value = err?.message || '訂單明細載入失敗'
  } finally {
    isLoadingDetail.value = false
  }
}

const closeOrderDialog = () => {
  isOrderDialogOpen.value = false
  formErrorMessage.value = ''
}

const addOrderItem = () => {
  orderForm.value.items.push(createEmptyOrderItem())
}

const removeOrderItem = (index) => {
  if (orderForm.value.items.length <= 1) return
  orderForm.value.items.splice(index, 1)
}

const buildBaseOrderPayload = () => ({
  activityId: Number(selectedActivityId.value),
  subscriberName: orderForm.value.subscriberName.trim(),
  subscriberEmail: orderForm.value.subscriberEmail.trim(),
  subscriberBank: orderForm.value.subscriberBank.trim(),
  deliveryTypeId: Number(orderForm.value.deliveryTypeId),
  items: orderForm.value.items.map((item) => ({
    productId: Number(item.productId),
    amount: Number(item.amount),
    info: String(item.info || '').trim().slice(0, 10) || null,
  })),
})

const buildCreateOrderPayload = () => buildBaseOrderPayload()

const buildUpdateOrderPayload = () => ({
  ...buildBaseOrderPayload(),
  orderStatus: Number(orderForm.value.orderStatus),
  paymentStatus: Number(orderForm.value.paymentStatus),
  deliveryStatus: Number(orderForm.value.deliveryStatus),
})

const validateOrderForm = () => {
  const missingFields = []
  const currentForm = orderForm.value
  const orderItems = Array.isArray(currentForm.items) ? currentForm.items : []

  if (!hasPositiveNumberValue(selectedActivityId.value)) missingFields.push('活動')
  if (isBlankValue(currentForm.subscriberName)) missingFields.push('訂購人')
  if (isBlankValue(currentForm.subscriberEmail)) missingFields.push('Email')
  if (isBlankValue(currentForm.subscriberBank)) missingFields.push('帳號後五碼')
  if (!hasPositiveNumberValue(currentForm.deliveryTypeId)) missingFields.push('配送方式')

  if (editingOrderId.value) {
    if (!isValidOrderStatus(currentForm.orderStatus)) missingFields.push('訂單狀態')
    if (!isValidPaymentStatus(currentForm.paymentStatus)) missingFields.push('付款狀態')
    if (!isValidDeliveryStatus(currentForm.deliveryStatus)) missingFields.push('物流狀態')
  }

  if (orderItems.length === 0) {
    missingFields.push('至少一筆商品')
  } else {
    orderItems.forEach((item, index) => {
      const itemLabel = `第 ${index + 1} 筆商品`

      if (!hasPositiveNumberValue(item.productId)) missingFields.push(itemLabel)
      if (!hasPositiveNumberValue(item.amount)) missingFields.push(`${itemLabel}數量`)
    })
  }

  if (missingFields.length) {
    formErrorMessage.value = formatRequiredFieldsMessage(missingFields)
    return false
  }

  if (!isValidEmail(currentForm.subscriberEmail)) {
    formErrorMessage.value = 'Email 格式不正確。'
    return false
  }

  return true
}

const submitOrderForm = async () => {
  if (!validateOrderForm()) {
    return
  }

  isSavingOrder.value = true
  formErrorMessage.value = ''

  try {
    const savedOrder = editingOrderId.value
      ? await updateOrder(editingOrderId.value, buildUpdateOrderPayload())
      : await createOrder(buildCreateOrderPayload())

    closeOrderDialog()
    await Promise.all([loadProducts(), loadOrders()])
    selectedOrder.value = savedOrder
  } catch (err) {
    formErrorMessage.value = err?.message || '訂單儲存失敗'
  } finally {
    isSavingOrder.value = false
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
  } catch (err) {
    errorMessage.value = err?.message || '訂單刪除失敗'
  } finally {
    isDeletingOrder.value = false
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

watch(totalPages, (nextTotalPages) => {
  if (page.value > nextTotalPages) {
    page.value = nextTotalPages
  }
})

onMounted(async () => {
  await Promise.all([loadActivities(), loadDeliveryTypes()])
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
          目前沒有可顯示的活動
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
                'activity-item--ended': isActivityEnded(activity),
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
                  v-if="isActivityEnded(activity)"
                  class="activity-status-badge activity-status-badge--ended"
                >
                  已結束
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
              class="add-order-button"
              type="button"
              aria-label="新增訂單"
              :title="selectedActivityEnded ? '活動已結束，無法新增訂單' : '新增訂單'"
              :disabled="!selectedActivityId || selectedActivityEnded"
              @click="openCreateOrder"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
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
              <tr v-for="order in pagedOrders" :key="order.id">
                <td>#{{ order.id }}</td>
                <td>{{ order.subscriberName }}</td>
                <td>{{ order.subscriberBank }}</td>
                <td>{{ formatCurrency(order.total) }}</td>
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
          <button type="button" class="ghost-button" :disabled="page <= 1" @click="goPage(page - 1)">
            上一頁
          </button>
          <span>{{ page }} / {{ totalPages || 1 }}</span>
          <button
            type="button"
            class="ghost-button"
            :disabled="totalPages === 0 || page >= totalPages"
            @click="goPage(page + 1)"
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
            <div>
              <dt>物流狀態</dt>
              <dd>{{ getDeliveryStatusLabel(selectedOrder.deliveryStatus) }}</dd>
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

          <div class="detail-total" aria-label="訂單總額">
            <span>訂單總額</span>
            <strong>{{ formatCurrency(selectedOrder.total) }}</strong>
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
      :delivery-status-options="deliveryStatusOptions"
      :is-saving="isSavingOrder"
      :error-message="formErrorMessage"
      @close="closeOrderDialog"
      @submit="submitOrderForm"
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
  </PageShell>
</template>

<style scoped>
.orders-hero {
  position: relative;
  display: flex;
  min-height: 112px;
  align-items: center;
  justify-content: flex-start;
  gap: 18px;
  overflow: hidden;
  border: 1px solid #eaded2;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 94%), rgb(255 250 244 / 98%)),
    #ffffff;
  box-shadow: 0 18px 44px rgb(114 74 56 / 10%);
  padding: 24px;
}

.orders-hero::before {
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: #c48445;
  content: '';
}

.orders-hero__title {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
}

.orders-hero__icon {
  position: relative;
  z-index: 1;
  display: grid;
  width: 62px;
  height: 62px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 16px;
  background: color-mix(in srgb, #c48445 13%, #ffffff);
  color: #c48445;
}

.orders-hero__icon svg {
  width: 34px;
  height: 34px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.orders-layout {
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  gap: 18px;
}

.activity-panel,
.orders-panel,
.detail-panel {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #eaded2;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(255 250 244 / 98%)),
    #ffffff;
  box-shadow: 0 18px 44px rgb(114 74 56 / 10%);
}

.activity-panel::before,
.orders-panel::before,
.detail-panel::before {
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: #c48445;
  content: '';
}

.activity-panel {
  display: grid;
  align-content: start;
  gap: 16px;
  padding: 18px;
}

.orders-panel {
  display: grid;
  align-content: start;
  gap: 18px;
  padding: 22px;
}

.panel-title,
.orders-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.orders-header-actions,
.table-actions,
.detail-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-actions .link-button,
.table-actions .danger-link-button {
  display: none;
}

.panel-title h2,
.orders-header h2 {
  margin: 0;
  color: #25352f;
  font-size: 1.15rem;
  line-height: 1.3;
}

.panel-title span,
.total-pill {
  border: 1px solid #e8d8c8;
  border-radius: 999px;
  background: #fffaf4;
  color: #8a5b24;
  font-size: 0.82rem;
  font-weight: 800;
  padding: 5px 10px;
}

.panel-title--compact h2 {
  font-size: 1rem;
}

.activity-list,
.product-list,
.detail-items {
  display: grid;
  gap: 10px;
}

.activity-group {
  display: grid;
  gap: 8px;
}

.activity-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.activity-item {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 10px 12px;
  border: 1px solid #eaded2;
  border-radius: 8px;
  background: #fffdf9;
  color: #25352f;
  padding: 10px;
  text-align: left;
}

.activity-item:hover,
.activity-item--active {
  border-color: #c48445;
  background: #fff7ed;
}

.activity-image {
  grid-row: span 3;
  width: 54px;
  height: 54px;
  border-radius: 8px;
  object-fit: cover;
}

.activity-name-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.activity-name {
  overflow: hidden;
  flex: 1;
  min-width: 0;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-caret {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  fill: none;
  stroke: #9a6a3a;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.18s ease;
}

.activity-caret--open {
  transform: rotate(180deg);
}

.activity-kind-badge {
  display: inline-flex;
  width: fit-content;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  border: 1px solid #f3c98b;
  border-radius: 999px;
  background: #fff7e8;
  color: #9a5b12;
  font-size: 0.76rem;
  font-weight: 900;
  line-height: 1;
  padding: 4px 9px;
  white-space: nowrap;
}

.activity-kind-badge--preorder {
  border-color: #b9c7f2;
  background: #f3f6ff;
  color: #334c9f;
}

.activity-status-badge {
  display: inline-flex;
  width: fit-content;
  min-height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 900;
  line-height: 1;
  padding: 4px 9px;
  white-space: nowrap;
}

.activity-status-badge--ended {
  border: 1px solid #d9c4b3;
  background: #efe7df;
  color: #7a6855;
}

.activity-item--ended .activity-image {
  filter: grayscale(0.35);
}

.activity-time {
  color: #59665f;
  font-size: 0.82rem;
  line-height: 1.35;
}

.product-summary {
  display: grid;
  gap: 10px;
  margin: 0 0 2px 14px;
  border: 1px solid #eaded2;
  border-left: 3px solid #c48445;
  border-radius: 8px;
  background: #fffaf4;
  padding: 12px;
}

.product-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #3b4a44;
  font-size: 0.9rem;
}

.product-row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-eyebrow {
  margin: 0 0 4px;
  color: #8a6c61;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.orders-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.filter-panel {
  display: grid;
  gap: 12px;
  border: 1px solid #eaded2;
  border-radius: 14px;
  background: #fffdf9;
  padding: 16px;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 180px;
  align-items: end;
  gap: 12px;
}

.filter-bar label {
  display: grid;
  gap: 6px;
  color: #59665f;
  font-size: 0.82rem;
  font-weight: 750;
}

.filter-bar input,
.filter-bar select {
  width: 100%;
  min-height: 42px;
  border: 1px solid #eaded2;
  border-radius: 8px;
  background: #ffffff;
  color: #25352f;
  font: inherit;
  padding: 0 10px;
}

.filter-actions,
.pager {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-actions {
  justify-content: space-between;
}

.filter-summary {
  color: #5b514a;
  font-size: 0.92rem;
  font-weight: 700;
}

.ghost-button,
.link-button {
  min-height: 44px;
  border-radius: 999px;
  font-weight: 800;
  padding: 0 16px;
}

.add-order-button {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: #c48445;
  color: #ffffff;
}

.add-order-button:hover:not(:disabled) {
  background: #a86b33;
}

.add-order-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.add-order-button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.ghost-button {
  border: 1px solid #e8d8c8;
  background: #fffdf9;
  color: #25352f;
}

.ghost-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.link-button {
  border: 1px solid #e8d8c8;
  background: #fffaf4;
  color: #8a5b24;
}

.table-action-button {
  min-height: 40px;
  border: 1px solid #e8d8c8;
  border-radius: 999px;
  background: #fffdf9;
  color: #8a5b24;
  padding: 0 12px;
}

.table-action-button:hover:not(:disabled) {
  border-color: #c48445;
  box-shadow: 0 8px 18px rgb(196 132 69 / 14%);
}

.table-action-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.table-action-button--edit,
.table-action-button--download,
.table-action-button--email {
  border-color: #c48445;
  background: #c48445;
  color: #ffffff;
}

.table-action-button--edit:hover:not(:disabled),
.table-action-button--download:hover:not(:disabled),
.table-action-button--email:hover:not(:disabled) {
  border-color: #a86b33;
  background: #a86b33;
  color: #ffffff;
  box-shadow: 0 8px 18px rgb(196 132 69 / 16%);
}

.icon-action-button {
  display: grid;
  width: 40px;
  min-width: 40px;
  place-items: center;
  padding: 0;
}

.table-button-svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.danger-link-button {
  min-height: 44px;
  border: 1px solid #e7c5c7;
  border-radius: 999px;
  background: #fff4f4;
  color: #9d3e46;
  font-weight: 800;
  padding: 0 16px;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #eaded2;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 920px;
}

th,
td {
  border-bottom: 1px solid #f0e7df;
  padding: 12px;
  text-align: left;
  vertical-align: middle;
}

th {
  background: #fff7ed;
  color: #59665f;
  font-size: 0.78rem;
  font-weight: 850;
}

.table-sort-button {
  display: inline-flex;
  width: 100%;
  min-height: 30px;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-weight: inherit;
  padding: 0;
  text-align: left;
}

.table-sort-button:hover,
.table-sort-button.is-active {
  color: #8a5b24;
}

.sort-indicator {
  display: inline-grid;
  width: 16px;
  place-items: center;
  color: #c48445;
  font-size: 0.78rem;
  line-height: 1;
}

td {
  color: #25352f;
  font-size: 0.9rem;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.status-chip {
  display: inline-flex;
  min-width: 34px;
  min-height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e8d8c8;
  border-radius: 999px;
  background: #fffaf4;
  color: #8a5b24;
  font-weight: 850;
}

.pager {
  justify-content: flex-end;
  color: #59665f;
  font-size: 0.9rem;
}

.detail-panel {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.detail-grid div {
  min-width: 0;
}

.detail-grid dt {
  color: #8a6c61;
  font-size: 0.78rem;
  font-weight: 800;
}

.detail-grid dd {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
  color: #25352f;
}

.detail-item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid #eaded2;
  border-radius: 8px;
  background: #fffdf9;
  padding: 10px;
}

.detail-image {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
}

.detail-item div {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.detail-item strong,
.detail-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-item span {
  color: #59665f;
  font-size: 0.86rem;
}

.detail-item-info {
  overflow-wrap: anywhere;
  color: #7a6257;
  font-size: 0.82rem;
  line-height: 1.45;
}

.detail-total {
  display: flex;
  width: fit-content;
  min-width: 250px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-left: auto;
  border: 1px solid #e8d8c8;
  border-radius: 999px;
  background: #fff7ed;
  color: #8a5b24;
  padding: 12px 20px;
}

.detail-total span {
  font-size: 0.92rem;
  font-weight: 800;
}

.detail-total strong {
  color: #25352f;
  font-size: 1.35rem;
  line-height: 1;
}

@media (max-width: 980px) {
  .orders-layout {
    grid-template-columns: 1fr;
  }

  .filter-bar {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 620px) {
  .orders-hero {
    min-height: 98px;
    padding: 20px;
  }

  .orders-hero__icon {
    width: 52px;
    height: 52px;
  }

  .orders-hero__title {
    gap: 12px;
  }

  .filter-bar,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .detail-total {
    width: 100%;
    min-width: 0;
    margin-left: 0;
  }

  .orders-panel {
    padding: 16px;
  }

  .pager {
    justify-content: space-between;
  }
}
</style>
