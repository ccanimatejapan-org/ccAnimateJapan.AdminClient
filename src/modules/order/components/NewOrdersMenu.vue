<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import CountBadge from '@/shared/components/CountBadge.vue'
import { useNewOrdersStore } from '@/modules/order/stores/newOrdersStore'
import { listNewOrders } from '@/modules/order/api/orderApi'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import { formatCurrency, formatDateTime } from '@/shared/utils/format'

const router = useRouter()
const route = useRoute()

// 未處理訂單標示：本元件永遠掛在頁首（登入後），負責計數輪詢；徽章本身只在 count > 0 時顯示。
const newOrdersStore = useNewOrdersStore()
const { count } = storeToRefs(newOrdersStore)

const isOpen = ref(false)
const isLoading = ref(false)
const items = ref([])
const rootEl = ref(null)

const loadItems = async () => {
  isLoading.value = true
  try {
    items.value = await listNewOrders()
  } catch (error) {
    items.value = []
    console.error('[newOrders] 載入未處理訂單清單失敗', error)
  } finally {
    isLoading.value = false
  }
}

const toggle = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) await loadItems()
}

const close = () => {
  isOpen.value = false
}

// 點某筆 → 跳到訂單管理並帶上該筆的活動與訂單，由訂單頁選取該活動並標示該筆
const goToOrder = (order) => {
  close()
  router.push({
    name: ROUTE_NAMES.ORDERS,
    query: { activityId: order.activityId, orderId: order.id },
  })
}

const onDocumentClick = (event) => {
  if (rootEl.value && !rootEl.value.contains(event.target)) close()
}

const onKeydown = (event) => {
  if (event.key === 'Escape') close()
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('click', onDocumentClick)
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('click', onDocumentClick)
    document.removeEventListener('keydown', onKeydown)
  }
})

// 全部處理完（數字歸零）順手關閉面板
watch(count, (value) => {
  if (value <= 0) close()
})

onMounted(() => newOrdersStore.startPolling())
onUnmounted(() => {
  newOrdersStore.stopPolling()
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
// 換頁時即時更新計數（例如剛在訂單頁處理完返回），輪詢作為保底
watch(() => route.fullPath, () => newOrdersStore.refresh())
</script>

<template>
  <div ref="rootEl" class="new-orders-menu">
    <button
      v-if="count > 0"
      type="button"
      class="new-orders-trigger"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      :aria-label="`有 ${count} 筆未處理訂單`"
      @click="toggle"
    >
      <CountBadge tone="activity">🔔 {{ count }} 筆新訂單</CountBadge>
    </button>

    <div v-if="isOpen && count > 0" class="new-orders-panel" role="menu">
      <div class="new-orders-panel__head">
        <strong>未處理訂單</strong>
        <span class="new-orders-panel__count">{{ count }} 筆</span>
      </div>

      <div v-if="isLoading" class="new-orders-panel__state">載入中…</div>

      <ul v-else-if="items.length" class="new-orders-list">
        <li v-for="order in items" :key="order.id">
          <button type="button" class="new-orders-item" role="menuitem" @click="goToOrder(order)">
            <span class="new-orders-item__row">
              <span class="new-orders-item__name">{{ order.subscriberName || '（未填姓名）' }}</span>
              <span class="new-orders-item__total">{{ formatCurrency(order.total) }}</span>
            </span>
            <span class="new-orders-item__row new-orders-item__row--sub">
              <span class="new-orders-item__activity">{{ order.activityName || `活動 #${order.activityId}` }}</span>
              <span class="new-orders-item__time">{{ formatDateTime(order.createdAt) }}</span>
            </span>
          </button>
        </li>
      </ul>

      <div v-else class="new-orders-panel__state">目前沒有未處理訂單</div>
    </div>
  </div>
</template>

<style scoped>
.new-orders-menu {
  position: relative;
  flex: 0 0 auto;
}

.new-orders-trigger {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
}

.new-orders-trigger:focus-visible {
  border-radius: 999px;
  outline: 2px solid #9d3e46;
  outline-offset: 2px;
}

.new-orders-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 40;
  width: 320px;
  max-width: min(360px, 90vw);
  overflow: hidden;
  border: 1px solid #e2d6c8;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 20px 48px rgb(60 40 30 / 18%);
}

.new-orders-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0e7dd;
  padding: 12px 16px;
  color: #13201c;
  font-size: 0.95rem;
}

.new-orders-panel__count {
  color: #9d3e46;
  font-weight: 800;
}

.new-orders-panel__state {
  padding: 20px 16px;
  color: #7a8781;
  font-size: 0.9rem;
  text-align: center;
}

.new-orders-list {
  max-height: 60vh;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  list-style: none;
}

.new-orders-item {
  display: block;
  width: 100%;
  border: none;
  border-radius: 10px;
  background: none;
  cursor: pointer;
  padding: 10px 12px;
  text-align: left;
  transition: background 140ms ease;
}

.new-orders-item:hover {
  background: #fbf4ee;
}

.new-orders-item__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.new-orders-item__row--sub {
  margin-top: 3px;
}

.new-orders-item__name {
  color: #13201c;
  font-weight: 700;
  font-size: 0.95rem;
}

.new-orders-item__total {
  flex: 0 0 auto;
  color: #9d3e46;
  font-weight: 800;
  font-size: 0.9rem;
  white-space: nowrap;
}

.new-orders-item__activity {
  overflow: hidden;
  color: #59665f;
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-orders-item__time {
  flex: 0 0 auto;
  color: #97a49d;
  font-size: 0.78rem;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .new-orders-panel {
    width: min(320px, 92vw);
  }
}
</style>
