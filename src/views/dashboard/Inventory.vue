<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { listActivities } from '@/api/activities'
import {
  listActivityProducts,
  listOrderedActivityProducts,
  listProductTypes,
} from '@/api/activityProducts'
import {
  createProductStockTransaction,
  listProductStockTransactions,
} from '@/api/productStockTransactions'
import { getOrderDetail, listAllOrders } from '@/api/orders'
import ActivityNoteDialog from '@/components/activities/ActivityNoteDialog.vue'
import CustomSelect from '@/components/activities/CustomSelect.vue'
import ProductStockTransactionDialog from '@/components/inventory/ProductStockTransactionDialog.vue'
import ProductStockTransactionHistoryDialog from '@/components/inventory/ProductStockTransactionHistoryDialog.vue'
import CountBadge from '@/components/layout/CountBadge.vue'
import PageHeading from '@/components/layout/PageHeading.vue'
import PageShell from '@/components/layout/PageShell.vue'
import PanelCard from '@/components/layout/PanelCard.vue'
import ProductTable from '@/components/products/ProductTable.vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'
import { useTableSort } from '@/composables/common/useTableSort'
import { mapActivityFromApi } from '@/utils/activities/activityMapper'
import { sanitizeHtml, stripHtml } from '@/utils/html'
import {
  PRODUCT_STOCK_FILTERS,
  createEmptyProductFilters,
  hasActiveProductFilters,
  matchesProductFilters,
} from '@/utils/products/productFilters'
import { mapProductFromApi, mapProductTypeFromApi, toNumber } from '@/utils/products/productMapper'
import { createProductTableColumns } from '@/utils/products/productTableColumns'

const inventoryIconPaths = [
  'M12 3 21 8l-9 5-9-5 9-5Z',
  'M3 8v8l9 5 9-5V8',
  'M12 13v8',
]
const productStockOptions = [
  {
    value: PRODUCT_STOCK_FILTERS.inStock,
    label: '尚有庫存',
  },
  {
    value: PRODUCT_STOCK_FILTERS.outStock,
    label: '缺貨',
  },
]
const pageSizeOptions = [10, 20, 50]

const activities = ref([])
const products = ref([])
const productTypes = ref([])
const isLoadingProducts = ref(false)
const isLoadingProductTypes = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')
const searchFilters = reactive(createEmptyProductFilters())
const pagination = reactive({
  page: 1,
  pageSize: pageSizeOptions[0],
})
const selectedNoteProduct = ref(null)
const isNoteDialogOpen = ref(false)
const selectedTransactionProduct = ref(null)
const isTransactionDialogOpen = ref(false)
const isSavingTransaction = ref(false)
const transactionOrders = ref([])
const isLoadingTransactionOrders = ref(false)
const transactionErrorMessage = ref('')
const transactionInOrOut = ref(true)
const transactionForm = reactive({
  orderId: '',
  amount: '',
  unitCost: '',
  unitPrice: '',
})
const selectedHistoryProduct = ref(null)
const isHistoryDialogOpen = ref(false)
const isLoadingHistory = ref(false)
const transactionHistory = ref([])
const historyErrorMessage = ref('')
const openSelectKey = ref('')

const inventoryRuleText = '庫存數量與庫存狀態皆依庫存異動資料回傳；訂購數量為有效訂單件數減出貨。'
const emptyProductText = '目前沒有商品。'
const selectedNoteHtml = computed(() => sanitizeHtml(selectedNoteProduct.value?.info || ''))
const selectedNoteTitle = computed(() => selectedNoteProduct.value?.name || '商品備註')

const selectedProductTypeId = computed({
  get: () => searchFilters.productTypeIds[0] || '',
  set: (value) => {
    searchFilters.productTypeIds = value ? [Number(value)] : []
  },
})
const selectedStockStatus = computed({
  get: () => searchFilters.stockStatuses[0] || '',
  set: (value) => {
    searchFilters.stockStatuses = value ? [value] : []
  },
})

const isSelectOpen = (key) => openSelectKey.value === key

const toggleSelect = (key, disabled = false) => {
  if (disabled) return

  openSelectKey.value = isSelectOpen(key) ? '' : key
}

const selectProductType = (value) => {
  selectedProductTypeId.value = value
  openSelectKey.value = ''
}

const selectStockStatus = (value) => {
  selectedStockStatus.value = value
  openSelectKey.value = ''
}

const selectPageSize = (value) => {
  pagination.pageSize = Number(value)
  openSelectKey.value = ''
}

const productTypeSelectLabel = computed(() => {
  if (isLoadingProductTypes.value) return '載入商品類型中...'
  if (!selectedProductTypeId.value) return '全部類型'
  return productTypes.value.find((type) => type.id === Number(selectedProductTypeId.value))?.name || '全部類型'
})

const stockStatusSelectLabel = computed(() =>
  productStockOptions.find((option) => option.value === selectedStockStatus.value)?.label || '全部狀態',
)

const formatCurrency = (value, prefix = 'NT$') => `${prefix} ${toNumber(value).toLocaleString()}`

const formatDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}/${month}/${day} ${hour}:${minute}`
}

const getCostTwd = (product) => Math.round(toNumber(product.japanCost) * toNumber(product.rate))

const getProductTypeName = (productTypeId) => {
  const normalizedProductTypeId = toNumber(productTypeId)
  const productType = productTypes.value.find((type) => toNumber(type?.id) === normalizedProductTypeId)

  return productType?.name || (normalizedProductTypeId ? `#${normalizedProductTypeId}` : '-')
}

const productTableColumns = createProductTableColumns({
  getProductTypeName,
  getCostTwd,
  stripHtml,
  includeActions: true,
  includeOrderedAmount: true,
})

const visibleProducts = computed(() => products.value)
const filteredProducts = computed(() =>
  visibleProducts.value.filter((product) => matchesProductFilters(product, searchFilters)),
)
const {
  sortedItems: sortedProducts,
  isSortActive: isProductSortActive,
  toggleSort: toggleProductSort,
  getSortAriaSort: getProductSortAriaSort,
  getSortButtonLabel: getProductSortButtonLabel,
  getSortIndicator: getProductSortIndicator,
} = useTableSort(filteredProducts, productTableColumns, {
  key: 'updatedAt',
  direction: 'desc',
})

const hasFiltersApplied = computed(() => hasActiveProductFilters(searchFilters))
const filteredProductsCount = computed(() => filteredProducts.value.length)
const totalProductsLabel = computed(() =>
  hasFiltersApplied.value
    ? `${filteredProductsCount.value} / ${products.value.length} 筆`
    : `共 ${products.value.length} 筆`,
)
const visibleProductsLabel = computed(() =>
  hasFiltersApplied.value
    ? `${filteredProductsCount.value} / ${visibleProducts.value.length} 筆`
    : `共 ${visibleProducts.value.length} 筆`,
)
const totalPages = computed(() => Math.max(1, Math.ceil(sortedProducts.value.length / pagination.pageSize)))
const paginatedProducts = computed(() => {
  const startIndex = (pagination.page - 1) * pagination.pageSize
  return sortedProducts.value.slice(startIndex, startIndex + pagination.pageSize)
})
const paginationSummary = computed(() => {
  if (!sortedProducts.value.length) return '目前沒有符合條件的商品'

  const start = (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(start + pagination.pageSize - 1, sortedProducts.value.length)
  return `顯示 ${start}-${end} 筆，共 ${sortedProducts.value.length} 筆`
})

const loadActivities = async () => {
  errorMessage.value = ''

  try {
    const responseActivities = await listActivities()
    activities.value = responseActivities.map(mapActivityFromApi)
  } catch (err) {
    errorMessage.value = err.message || '載入活動失敗。'
    activities.value = []
  }
}

const loadProductTypes = async () => {
  isLoadingProductTypes.value = true

  try {
    const responseProductTypes = await listProductTypes()
    productTypes.value = responseProductTypes.map(mapProductTypeFromApi)
  } catch (err) {
    errorMessage.value = err.message || '載入商品類型失敗。'
    productTypes.value = []
  } finally {
    isLoadingProductTypes.value = false
  }
}

const loadProducts = async () => {
  const requestActivities = [...activities.value]
  isLoadingProducts.value = true

  if (!requestActivities.length) {
    products.value = []
    isLoadingProducts.value = false
    return
  }

  errorMessage.value = ''

  try {
    const productGroups = await Promise.all(
      requestActivities.map(async (activity) => {
        const requestActivityId = Number(activity.id)
        const fetchProducts = activity.isPreOrder ? listOrderedActivityProducts : listActivityProducts
        const responseProducts = await fetchProducts(requestActivityId)

        return responseProducts.map((product) => ({
          ...mapProductFromApi(product, requestActivityId),
          activityName: activity.name || `活動 #${requestActivityId}`,
          isPreOrder: activity.isPreOrder === true,
        }))
      }),
    )

    products.value = productGroups.flat()
  } catch (err) {
    errorMessage.value = err.message || '載入庫存商品失敗。'
    products.value = []
  } finally {
    isLoadingProducts.value = false
  }
}

const clearSearchFilters = () => {
  Object.assign(searchFilters, createEmptyProductFilters())
  pagination.page = 1
}

const goToPage = (page) => {
  pagination.page = Math.min(Math.max(page, 1), totalPages.value)
}

const goToPreviousPage = () => goToPage(pagination.page - 1)

const goToNextPage = () => goToPage(pagination.page + 1)

const openNoteDialog = (product) => {
  if (!stripHtml(product.info)) return

  selectedNoteProduct.value = product
  isNoteDialogOpen.value = true
}

const closeNoteDialog = () => {
  isNoteDialogOpen.value = false
  selectedNoteProduct.value = null
}

const resetTransactionForm = () => {
  transactionForm.orderId = ''
  transactionForm.amount = ''
  transactionForm.unitCost = ''
  transactionForm.unitPrice = ''
  transactionOrders.value = []
  transactionErrorMessage.value = ''
}

const loadTransactionOrders = async (product) => {
  isLoadingTransactionOrders.value = true

  try {
    const orders = await listAllOrders()
    const activeOrders = orders.filter((order) => ![5, 8].includes(Number(order.orderStatus)))
    const details = await Promise.all(activeOrders.map((order) => getOrderDetail(order.id)))

    transactionOrders.value = details.flatMap((order) => {
      const amount = (order?.items || [])
        .filter((item) =>
          Number(item.productId) === Number(product.id)
          && Number(item.orderProductStatus || 1) !== 2
        )
        .reduce((total, item) => total + Number(item.amount || 0), 0)

      return amount > 0 ? [{ ...order, amount }] : []
    })

    if (!transactionOrders.value.length) {
      transactionErrorMessage.value = '此商品目前沒有可供出貨的訂單。'
    }
  } catch (err) {
    transactionErrorMessage.value = err.message || '載入可出貨訂單失敗。'
  } finally {
    isLoadingTransactionOrders.value = false
  }
}

const openTransactionDialog = async (product, inOrOut) => {
  selectedTransactionProduct.value = product
  transactionInOrOut.value = inOrOut
  resetTransactionForm()
  transactionForm.unitCost = inOrOut ? getCostTwd(product) : ''
  transactionForm.unitPrice = inOrOut ? '' : toNumber(product.price)
  isTransactionDialogOpen.value = true

  if (!inOrOut) {
    await loadTransactionOrders(product)
  }
}

const selectTransactionOrder = () => {
  const selectedOrder = transactionOrders.value.find(
    (order) => Number(order.id) === Number(transactionForm.orderId),
  )
  transactionForm.amount = selectedOrder?.amount || ''
}

const closeTransactionDialog = () => {
  if (isSavingTransaction.value) return

  isTransactionDialogOpen.value = false
  selectedTransactionProduct.value = null
  resetTransactionForm()
}

const saveTransaction = async () => {
  const amount = Number(transactionForm.amount)
  const unitValue = Number(transactionInOrOut.value ? transactionForm.unitCost : transactionForm.unitPrice)

  if (!transactionInOrOut.value && !Number(transactionForm.orderId)) {
    transactionErrorMessage.value = '出貨前請先選擇訂單。'
    return
  }

  if (!Number.isInteger(amount) || amount <= 0) {
    transactionErrorMessage.value = '數量必須是大於 0 的整數。'
    return
  }

  if (!Number.isInteger(unitValue) || unitValue < 0) {
    transactionErrorMessage.value = transactionInOrOut.value
      ? '單位成本必須是大於或等於 0 的整數。'
      : '單位售價必須是大於或等於 0 的整數。'
    return
  }

  isSavingTransaction.value = true
  transactionErrorMessage.value = ''
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    await createProductStockTransaction({
      productId: selectedTransactionProduct.value.id,
      amount,
      inOrOut: transactionInOrOut.value,
      unitCost: transactionInOrOut.value ? unitValue : null,
      unitPrice: transactionInOrOut.value ? null : unitValue,
      orderId: transactionInOrOut.value ? null : Number(transactionForm.orderId),
    })

    isTransactionDialogOpen.value = false
    selectedTransactionProduct.value = null
    resetTransactionForm()
    await loadProducts()
    statusMessage.value = transactionInOrOut.value ? '進貨異動新增成功。' : '出貨異動新增成功。'
  } catch (err) {
    transactionErrorMessage.value = err.message || '新增庫存異動失敗。'
  } finally {
    isSavingTransaction.value = false
  }
}

const openTransactionHistory = async (product) => {
  selectedHistoryProduct.value = product
  isHistoryDialogOpen.value = true
  isLoadingHistory.value = true
  historyErrorMessage.value = ''
  transactionHistory.value = []

  try {
    transactionHistory.value = await listProductStockTransactions(product.id)
  } catch (err) {
    historyErrorMessage.value = err.message || '載入庫存異動明細失敗。'
  } finally {
    isLoadingHistory.value = false
  }
}

const closeTransactionHistory = () => {
  isHistoryDialogOpen.value = false
  selectedHistoryProduct.value = null
  transactionHistory.value = []
  historyErrorMessage.value = ''
}

watch(searchFilters, () => {
  pagination.page = 1
}, { deep: true })

watch(() => pagination.pageSize, () => {
  pagination.page = 1
})

watch(totalPages, (nextTotalPages) => {
  if (pagination.page > nextTotalPages) {
    pagination.page = nextTotalPages
  }
})

onMounted(async () => {
  isLoadingProducts.value = true
  await Promise.all([loadActivities(), loadProductTypes()])
  await loadProducts()
})
</script>

<template>
  <PageShell class="inventory-page">
    <section class="inventory-hero">
      <div class="inventory-hero__title">
        <span class="inventory-hero__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path v-for="path in inventoryIconPaths" :key="path" :d="path" />
          </svg>
        </span>
        <PageHeading title="庫存管理" />
      </div>
    </section>

    <MessageBlock v-if="errorMessage" tone="error">
      {{ errorMessage }}
    </MessageBlock>
    <MessageBlock v-if="statusMessage" tone="success" module="inventory">
      {{ statusMessage }}
    </MessageBlock>

    <div class="inventory-layout">
      <PanelCard accent class="inventory-products-panel">
        <div class="inventory-panel-heading">
          <div class="inventory-title-row">
            <span class="management-title-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path v-for="path in inventoryIconPaths" :key="path" :d="path" />
              </svg>
            </span>
            <div class="inventory-title-copy">
              <h2>全部庫存</h2>
              <p>{{ inventoryRuleText }}</p>
            </div>
          </div>
          <div class="inventory-heading-actions">
            <CountBadge tone="inventory">{{ visibleProductsLabel }}</CountBadge>
          </div>
        </div>

        <section class="inventory-filter-panel" aria-label="庫存搜尋條件">
          <label class="inventory-filter-field">
            <span>商品名稱</span>
            <input v-model.trim="searchFilters.name" type="search" placeholder="搜尋商品名稱" />
          </label>

          <div class="inventory-filter-field">
            <span>商品類型</span>
            <CustomSelect
              tone="inventory"
              :label="productTypeSelectLabel"
              :open="isSelectOpen('productType')"
              :disabled="isLoadingProductTypes"
              @toggle="toggleSelect('productType', isLoadingProductTypes)"
            >
              <button class="custom-select-option" type="button" @click="selectProductType('')">全部類型</button>
              <button
                v-for="productType in productTypes"
                :key="productType.id"
                class="custom-select-option"
                type="button"
                @click="selectProductType(productType.id)"
              >
                {{ productType.name || `#${productType.id}` }}
              </button>
            </CustomSelect>
          </div>

          <div class="inventory-filter-field">
            <span>庫存狀態</span>
            <CustomSelect
              tone="inventory"
              :label="stockStatusSelectLabel"
              :open="isSelectOpen('stockStatus')"
              @toggle="toggleSelect('stockStatus')"
            >
              <button class="custom-select-option" type="button" @click="selectStockStatus('')">全部狀態</button>
              <button
                v-for="option in productStockOptions"
                :key="option.value"
                class="custom-select-option"
                type="button"
                @click="selectStockStatus(option.value)"
              >
                {{ option.label }}
              </button>
            </CustomSelect>
          </div>

          <button
            class="inventory-clear-button"
            type="button"
            :disabled="!hasFiltersApplied"
            @click="clearSearchFilters"
          >
            清除篩選
          </button>
        </section>

        <ProductTable
          :products="paginatedProducts"
          :columns="productTableColumns"
          :product-types="productTypes"
          :is-loading="isLoadingProducts"
          :empty-text="emptyProductText"
          :format-currency="formatCurrency"
          :get-cost-twd="getCostTwd"
          :format-date-time="formatDateTime"
          :strip-html="stripHtml"
          :sanitize-html="sanitizeHtml"
          :is-sort-active="isProductSortActive"
          :get-sort-aria-sort="getProductSortAriaSort"
          :get-sort-button-label="getProductSortButtonLabel"
          :get-sort-indicator="getProductSortIndicator"
          show-stock-actions
          show-ordered-amount
          @sort="toggleProductSort"
          @open-note="openNoteDialog"
          @stock-in="openTransactionDialog($event, true)"
          @stock-out="openTransactionDialog($event, false)"
          @stock-history="openTransactionHistory"
        />

        <div class="inventory-pagination">
          <p>{{ paginationSummary }}</p>
          <div class="inventory-pagination-actions">
            <div class="inventory-page-size">
              <span>每頁</span>
              <CustomSelect
                tone="inventory"
                :label="String(pagination.pageSize)"
                :open="isSelectOpen('pageSize')"
                @toggle="toggleSelect('pageSize')"
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
            <button type="button" :disabled="pagination.page <= 1" @click="goToPreviousPage">
              上一頁
            </button>
            <span>{{ pagination.page }} / {{ totalPages }}</span>
            <button type="button" :disabled="pagination.page >= totalPages" @click="goToNextPage">
              下一頁
            </button>
          </div>
        </div>
      </PanelCard>
    </div>

    <ActivityNoteDialog
      v-if="isNoteDialogOpen"
      tone="inventory"
      :title="selectedNoteTitle"
      :html="selectedNoteHtml"
      @close="closeNoteDialog"
    />

    <ProductStockTransactionDialog
      v-if="isTransactionDialogOpen && selectedTransactionProduct"
      :product="selectedTransactionProduct"
      :in-or-out="transactionInOrOut"
      :form="transactionForm"
      :is-saving="isSavingTransaction"
      :error-message="transactionErrorMessage"
      :orders="transactionOrders"
      :is-loading-orders="isLoadingTransactionOrders"
      @close="closeTransactionDialog"
      @select-order="selectTransactionOrder"
      @submit="saveTransaction"
    />

    <ProductStockTransactionHistoryDialog
      v-if="isHistoryDialogOpen && selectedHistoryProduct"
      :product="selectedHistoryProduct"
      :transactions="transactionHistory"
      :is-loading="isLoadingHistory"
      :error-message="historyErrorMessage"
      :format-date-time="formatDateTime"
      :format-currency="formatCurrency"
      @close="closeTransactionHistory"
    />
  </PageShell>
</template>

<style scoped>
.inventory-page {
  gap: 18px;
}

.inventory-hero {
  position: relative;
  display: flex;
  min-height: 112px;
  align-items: center;
  overflow: hidden;
  border: 1px solid #d8e6de;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(243 249 246 / 98%)),
    #ffffff;
  box-shadow: 0 18px 44px rgb(39 120 103 / 10%);
  padding: 24px;
}

.inventory-hero::before {
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: #277867;
  content: '';
}

.inventory-hero__title {
  position: relative;
  z-index: 1;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 16px;
}

.inventory-hero__icon,
.management-title-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  background: color-mix(in srgb, #277867 13%, #ffffff);
  color: #277867;
}

.inventory-hero__icon {
  width: 62px;
  height: 62px;
  border-radius: 16px;
}

.inventory-hero__icon svg {
  width: 34px;
  height: 34px;
}

.inventory-hero__icon svg,
.management-title-icon svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.inventory-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
}

:deep(.panel-card--accent) {
  border-color: #d8e6de;
  background:
    linear-gradient(135deg, rgb(255 255 255 / 96%), rgb(243 249 246 / 98%)),
    #ffffff;
  box-shadow: 0 18px 44px rgb(39 120 103 / 10%);
}

:deep(.panel-card--accent::before) {
  background: #277867;
}

.inventory-products-panel {
  min-width: 0;
}

.inventory-panel-heading {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
  border-bottom: 1px solid #e3eee8;
  padding-bottom: 20px;
}

.inventory-title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.management-title-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
}

.management-title-icon svg {
  width: 26px;
  height: 26px;
}

.inventory-title-copy {
  min-width: 0;
}

.inventory-title-copy h2 {
  margin: 0;
  color: #13201c;
  font-size: 1.35rem;
  line-height: 1.25;
}

.inventory-title-copy p {
  margin: 6px 0 0;
  color: #5e786f;
  font-size: 0.92rem;
  font-weight: 650;
  line-height: 1.5;
}

.inventory-heading-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.inventory-filter-panel {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(180px, 1.2fr) minmax(160px, 0.8fr) minmax(160px, 0.8fr) auto;
  align-items: end;
  gap: 12px;
  margin-bottom: 16px;
  border: 1px solid #d8e6de;
  border-radius: 14px;
  background: #fffdf9;
  padding: 14px;
}

.inventory-filter-field {
  display: grid;
  gap: 6px;
}

.inventory-filter-field span,
.inventory-page-size span {
  color: #5e786f;
  font-size: 0.78rem;
  font-weight: 850;
}

.inventory-filter-field input {
  min-height: 38px;
  border: 1px solid #eaded2;
  border-radius: 10px;
  background: #f4fbf7;
  color: #13201c;
  font: inherit;
  font-size: 0.9rem;
  padding: 0 12px;
}

.inventory-filter-field input:focus {
  border-color: #277867;
  box-shadow: 0 0 0 3px rgb(39 120 103 / 15%);
  outline: none;
}

.inventory-clear-button,
.inventory-pagination-actions button {
  min-height: 38px;
  border: 1px solid #277867;
  border-radius: 999px;
  background: #277867;
  color: #ffffff;
  cursor: pointer;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 850;
  padding: 0 14px;
}

.inventory-clear-button:disabled,
.inventory-pagination-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.inventory-clear-button:not(:disabled):hover,
.inventory-pagination-actions button:not(:disabled):hover {
  border-color: #1f6154;
  background: #1f6154;
  box-shadow: 0 8px 18px rgb(39 120 103 / 16%);
}

.inventory-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 16px;
  color: #5e786f;
  font-size: 0.9rem;
  font-weight: 700;
}

.inventory-pagination p {
  margin: 0;
}

.inventory-pagination-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.inventory-page-size {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.inventory-page-size :deep(.custom-select) {
  min-width: 78px;
}

.inventory-filter-field :deep(.custom-select-trigger),
.inventory-page-size :deep(.custom-select-trigger) {
  min-height: 38px;
  background: var(--select-shell-background);
}

@media (max-width: 1080px) {
  .inventory-layout,
  .inventory-filter-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .inventory-hero,
  :deep(.panel-card--accent) {
    padding: 18px;
  }

  .inventory-hero__title,
  .inventory-panel-heading,
  .inventory-title-row,
  .inventory-pagination {
    align-items: flex-start;
    flex-direction: column;
  }

  .inventory-heading-actions,
  .inventory-pagination-actions {
    justify-content: flex-start;
  }
}
</style>
