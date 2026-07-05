<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import ActivityNoteDialog from '@/shared/components/ActivityNoteDialog.vue'
import CustomSelect from '@/shared/components/CustomSelect.vue'
import ProductStockTransactionDialog from '@/modules/inventory/components/ProductStockTransactionDialog.vue'
import ProductStockTransactionHistoryDialog from '@/modules/inventory/components/ProductStockTransactionHistoryDialog.vue'
import CountBadge from '@/shared/components/CountBadge.vue'
import PageHeading from '@/shared/components/PageHeading.vue'
import PageShell from '@/shared/components/PageShell.vue'
import PanelCard from '@/shared/components/PanelCard.vue'
import ProductTable from '@/shared/components/ProductTable.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import { useTableSort } from '@/shared/composables/useTableSort'
import { useTablePagination } from '@/shared/composables/useTablePagination'
import { useNoteDialog } from '@/shared/composables/useNoteDialog'
import { sanitizeHtml, stripHtml } from '@/shared/utils/html'
import { formatDateTime } from '@/shared/utils/format'
import { PRODUCT_STOCK_FILTERS, createEmptyProductFilters } from '@/modules/activityProduct/utils/productFilters'
import { toNumber } from '@/modules/activityProduct/utils/productMapper'
import { createProductTableColumns } from '@/modules/activityProduct/utils/productTableColumns'
import { createProductTypeNameGetter, getCostTwd } from '@/modules/activityProduct/utils/productPricing'
import { useInventoryProducts } from '@/modules/inventory/composables/useInventoryProducts'
import { useStockTransaction } from '@/modules/inventory/composables/useStockTransaction'
import { useStockTransactionHistory } from '@/modules/inventory/composables/useStockTransactionHistory'
import { useSingleSelectFilters } from '@/modules/inventory/composables/useSingleSelectFilters'

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

const errorMessage = ref('')
const statusMessage = ref('')
const searchFilters = reactive(createEmptyProductFilters())

const inventoryRuleText = '庫存數量與庫存狀態皆依庫存異動資料回傳；訂購數量為有效訂單件數減出貨。'
const emptyProductText = '目前沒有商品。'

const {
  productTypes,
  isLoadingProducts,
  isLoadingProductTypes,
  loadProductTypes,
  loadProducts,
  filteredProducts,
  hasFiltersApplied,
  visibleProductsLabel,
} = useInventoryProducts({ searchFilters, errorMessage })

const {
  isNoteDialogOpen,
  selectedNoteHtml,
  selectedNoteTitle,
  openNoteDialog,
  closeNoteDialog,
} = useNoteDialog({ getNoteTitle: (item) => item?.name || '商品備註' })

const formatCurrency = (value, prefix = 'NT$') => `${prefix} ${toNumber(value).toLocaleString()}`

const getProductTypeName = createProductTypeNameGetter(productTypes)

const productTableColumns = createProductTableColumns({
  getProductTypeName,
  getCostTwd,
  stripHtml,
  includeActions: true,
  includeOrderedAmount: true,
})

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

const {
  page,
  pageSize,
  totalPages,
  paginatedItems: paginatedProducts,
  goToPreviousPage,
  goToNextPage,
} = useTablePagination(sortedProducts, { pageSizeOptions })

const paginationSummary = computed(() => {
  if (!sortedProducts.value.length) return '目前沒有符合條件的商品'

  const start = (page.value - 1) * pageSize.value + 1
  const end = Math.min(start + pageSize.value - 1, sortedProducts.value.length)
  return `顯示 ${start}-${end} 筆，共 ${sortedProducts.value.length} 筆`
})

const {
  openSelectKey,
  selectedProductTypeId,
  selectedStockStatus,
  isSelectOpen,
  toggleSelect,
  selectProductType,
  selectStockStatus,
  selectPageSize,
  productTypeSelectLabel,
  stockStatusSelectLabel,
} = useSingleSelectFilters({
  searchFilters,
  productTypes,
  isLoadingProductTypes,
  productStockOptions,
  pageSize,
})

const {
  selectedTransactionProduct,
  isTransactionDialogOpen,
  isSavingTransaction,
  transactionOrders,
  isLoadingTransactionOrders,
  transactionErrorMessage,
  transactionInOrOut,
  transactionForm,
  openTransactionDialog,
  selectTransactionOrder,
  closeTransactionDialog,
  saveTransaction,
} = useStockTransaction({ loadProducts, statusMessage, errorMessage })

const {
  selectedHistoryProduct,
  isHistoryDialogOpen,
  isLoadingHistory,
  transactionHistory,
  historyErrorMessage,
  openTransactionHistory,
  closeTransactionHistory,
} = useStockTransactionHistory()

const clearSearchFilters = () => {
  Object.assign(searchFilters, createEmptyProductFilters())
  page.value = 1
}

watch(searchFilters, () => {
  page.value = 1
}, { deep: true })

onMounted(async () => {
  isLoadingProducts.value = true
  await Promise.all([loadProductTypes(), loadProducts()])
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
                :label="String(pageSize)"
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
            <button type="button" :disabled="page <= 1" @click="goToPreviousPage">
              上一頁
            </button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button type="button" :disabled="page >= totalPages" @click="goToNextPage">
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

<style scoped lang="scss" src="../styles/inventory.scss"></style>
