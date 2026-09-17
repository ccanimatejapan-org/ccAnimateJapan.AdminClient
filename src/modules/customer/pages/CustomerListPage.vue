<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/shared/constants/routes'
import CustomSelect from '@/shared/components/CustomSelect.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import AppButton from '@/shared/components/AppButton.vue'
import CustomerTable from '@/modules/customer/components/CustomerTable.vue'
import CustomerDetailDialog from '@/modules/customer/components/CustomerDetailDialog.vue'
import CustomerStatusConfirmDialog from '@/modules/customer/components/CustomerStatusConfirmDialog.vue'
import { useCustomers } from '@/modules/customer/composables/useCustomers'
import { useConfirmDialog } from '@/shared/composables/useConfirmDialog'
import { useDialogScrollLock } from '@/shared/composables/useDialogScrollLock'
import { formatCurrency, formatDateTime } from '@/shared/utils/format'
import { getCustomerTabCount } from '@/modules/customer/utils/customerFilters'

const router = useRouter()
const errorMessage = ref('')
const statusMessage = ref('')

const {
  isConfirmDialogOpen,
  pendingConfirmTarget,
  requestConfirm,
  resolveConfirm,
} = useConfirmDialog()

const {
  items,
  counts,
  page: currentPage,
  pageSize,
  totalPages,
  keywordInput,
  isLoading,
  mutatingId,
  openSelectKey,
  activeTabKey,
  selectedCustomer,
  paginationSummary,
  pageSizeOptions,
  tabs,
  loadCustomers,
  search,
  selectTab,
  selectPageSize,
  goToPage,
  openCustomer,
  closeCustomer,
  setDeleted,
} = useCustomers({ errorMessage, statusMessage })

useDialogScrollLock(() => Boolean(selectedCustomer.value || isConfirmDialogOpen.value))

const userIconPaths = [
  'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
  'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  'M22 21v-2a4 4 0 0 0-3-3.87',
  'M16 3.13a4 4 0 0 1 0 7.75',
]

const requestStatusChange = async (customer, isDelete) => {
  const confirmed = await requestConfirm({ customer, isDelete })
  if (!confirmed) return
  await setDeleted(customer, isDelete)
}

const openOrder = (order) => {
  closeCustomer()
  router.push({
    name: ROUTE_NAMES.ORDERS,
    query: {
      activityId: order.activityId || undefined,
      orderId: order.id,
    },
  })
}

onMounted(loadCustomers)
</script>

<template>
  <div class="customer-management-page">
    <div class="customer-hero">
      <div class="customer-hero__title">
        <span class="customer-hero__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path v-for="d in userIconPaths" :key="d" :d="d" />
          </svg>
        </span>
        <div>
          <h1>顧客管理</h1>
        </div>
      </div>
    </div>

    <MessageBlock v-if="errorMessage" tone="error">{{ errorMessage }}</MessageBlock>
    <MessageBlock v-if="statusMessage" tone="success" module="customers">{{ statusMessage }}</MessageBlock>

    <section class="customer-panel">
      <div class="customer-panel-heading">
        <div class="customer-panel-heading__left">
          <h2>顧客列表</h2>
          <span class="total-pill">{{ counts.all || 0 }} 筆</span>
        </div>
      </div>

      <form class="customer-filter-panel" @submit.prevent="search">
        <div class="customer-filter-bar">
          <label>
            <span>搜尋姓名、Email、電話或 LINE</span>
            <input v-model="keywordInput" type="search" maxlength="200" placeholder="顯示名稱、姓名、Email、電話" />
          </label>
          <button class="customer-search-button" type="submit">查詢</button>
        </div>
      </form>

      <div class="customer-tabs" role="tablist" aria-label="顧客狀態">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="customer-tab"
          :class="{ 'customer-tab--active': tab.key === activeTabKey }"
          type="button"
          role="tab"
          :aria-selected="tab.key === activeTabKey"
          @click="selectTab(tab.key)"
        >
          <span>{{ tab.label }}</span>
          <span class="customer-tab__count">{{ getCustomerTabCount(counts, tab.countKey) }}</span>
        </button>
      </div>

      <CustomerTable
        :items="items"
        :is-loading="isLoading"
        :mutating-id="mutatingId"
        :format-date-time="formatDateTime"
        :format-currency="formatCurrency"
        @open="openCustomer"
        @delete="requestStatusChange($event, true)"
        @restore="requestStatusChange($event, false)"
      />

      <div class="customer-pager">
        <span class="customer-pager__summary">{{ paginationSummary }}</span>
        <div class="customer-pager__actions">
          <div class="customer-page-size">
            <span>每頁</span>
            <CustomSelect
              :label="String(pageSize)"
              :open="openSelectKey === 'pageSize'"
              tone="customers"
              @toggle="openSelectKey = openSelectKey === 'pageSize' ? '' : 'pageSize'"
            >
              <button
                v-for="size in pageSizeOptions"
                :key="size"
                class="custom-select-option"
                type="button"
                @click="selectPageSize(size)"
              >
                {{ size }}
              </button>
            </CustomSelect>
          </div>
          <AppButton pill :disabled="currentPage <= 1 || isLoading" @click="goToPage(currentPage - 1)">上一頁</AppButton>
          <span class="customer-page-indicator">{{ currentPage }} / {{ Math.max(1, totalPages) }}</span>
          <AppButton pill :disabled="currentPage >= totalPages || isLoading" @click="goToPage(currentPage + 1)">下一頁</AppButton>
        </div>
      </div>
    </section>

    <CustomerDetailDialog
      v-if="selectedCustomer"
      :detail="selectedCustomer"
      :format-date-time="formatDateTime"
      :format-currency="formatCurrency"
      @close="closeCustomer"
      @open-order="openOrder"
    />

    <CustomerStatusConfirmDialog
      v-if="isConfirmDialogOpen"
      :customer="pendingConfirmTarget?.customer"
      :is-delete="Boolean(pendingConfirmTarget?.isDelete)"
      :is-saving="Boolean(mutatingId)"
      @close="resolveConfirm(false)"
      @confirm="resolveConfirm(true)"
    />
  </div>
</template>

<style scoped lang="scss" src="../styles/customer-list.scss"></style>
