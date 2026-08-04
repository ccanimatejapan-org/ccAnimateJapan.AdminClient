<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import ActivityNoteDialog from '@/shared/components/ActivityNoteDialog.vue'
import CustomSelect from '@/shared/components/CustomSelect.vue'
import ProductStockTransactionDialog from '@/modules/inventory/components/ProductStockTransactionDialog.vue'
import ProductStockTransactionHistoryDialog from '@/modules/inventory/components/ProductStockTransactionHistoryDialog.vue'
import InventoryActivityGroup from '@/modules/inventory/components/InventoryActivityGroup.vue'
import PageHeading from '@/shared/components/PageHeading.vue'
import PageShell from '@/shared/components/PageShell.vue'
import PanelCard from '@/shared/components/PanelCard.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import { useTableSort } from '@/shared/composables/useTableSort'
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
import {
  INVENTORY_MODES,
  countInventoryProductsByMode,
  createInventoryActivityCollapseKey,
  createInventoryActivityGroups,
  filterInventoryProductsByMode,
  getInventoryModeEmptyText,
} from '@/modules/inventory/utils/inventoryProductGroups'

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
const inventoryTabs = [
  {
    mode: INVENTORY_MODES.readyStock,
    label: '現貨',
    tabId: 'inventory-tab-ready-stock',
    panelId: 'inventory-panel-ready-stock',
  },
  {
    mode: INVENTORY_MODES.preOrder,
    label: '預購',
    tabId: 'inventory-tab-pre-order',
    panelId: 'inventory-panel-pre-order',
  },
]

const errorMessage = ref('')
const statusMessage = ref('')
const searchFilters = reactive(createEmptyProductFilters())

const inventoryRuleText = '庫存數量與庫存狀態皆依庫存異動資料回傳；訂購數量為有效訂單件數減出貨。'

const {
  products,
  productTypes,
  isLoadingProducts,
  isLoadingProductTypes,
  loadProductTypes,
  loadProducts,
  filteredProducts,
  hasFiltersApplied,
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

const activeInventoryMode = ref(INVENTORY_MODES.readyStock)
const inventoryTabButtons = ref([])
const collapsedActivityKeys = reactive({})

const filteredProductModeCounts = computed(() =>
  countInventoryProductsByMode(filteredProducts.value),
)
const totalProductModeCounts = computed(() =>
  countInventoryProductsByMode(products.value),
)
const currentModeFilteredProducts = computed(() =>
  filterInventoryProductsByMode(
    filteredProducts.value,
    activeInventoryMode.value,
  ),
)

const {
  sortedItems: sortedCurrentModeProducts,
  isSortActive: isProductSortActive,
  toggleSort: toggleProductSort,
  getSortAriaSort: getProductSortAriaSort,
  getSortButtonLabel: getProductSortButtonLabel,
  getSortIndicator: getProductSortIndicator,
} = useTableSort(currentModeFilteredProducts, productTableColumns, {
  key: 'updatedAt',
  direction: 'desc',
})

const currentActivityGroups = computed(() =>
  createInventoryActivityGroups(sortedCurrentModeProducts.value),
)
const currentEmptyProductText = computed(() =>
  getInventoryModeEmptyText({
    mode: activeInventoryMode.value,
    modeTotalCount: totalProductModeCounts.value[activeInventoryMode.value],
    modeFilteredCount:
      filteredProductModeCounts.value[activeInventoryMode.value],
  }),
)

const selectInventoryMode = (mode) => {
  if (!inventoryTabs.some((tab) => tab.mode === mode)) return

  activeInventoryMode.value = mode
}

const selectInventoryTabByIndex = (index) => {
  const tabCount = inventoryTabs.length
  const normalizedIndex = (index + tabCount) % tabCount
  const tab = inventoryTabs[normalizedIndex]

  selectInventoryMode(tab.mode)
  nextTick(() => inventoryTabButtons.value[normalizedIndex]?.focus())
}

const handleInventoryTabKeydown = (event) => {
  const currentIndex = inventoryTabs.findIndex(
    (tab) => tab.mode === activeInventoryMode.value,
  )

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    selectInventoryTabByIndex(currentIndex + 1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    selectInventoryTabByIndex(currentIndex - 1)
  } else if (event.key === 'Home') {
    event.preventDefault()
    selectInventoryTabByIndex(0)
  } else if (event.key === 'End') {
    event.preventDefault()
    selectInventoryTabByIndex(inventoryTabs.length - 1)
  }
}

const getActivityCollapseKey = (group) =>
  createInventoryActivityCollapseKey(
    activeInventoryMode.value,
    group.activityId,
  )

const isActivityGroupCollapsed = (group) =>
  collapsedActivityKeys[getActivityCollapseKey(group)] === true

const toggleActivityGroup = (group) => {
  const key = getActivityCollapseKey(group)
  collapsedActivityKeys[key] = !collapsedActivityKeys[key]
}

const getActivityPanelId = (group) =>
  `inventory-activity-panel-${getActivityCollapseKey(group).replace(':', '-')}`

const {
  openSelectKey,
  selectedProductTypeId,
  selectedStockStatus,
  isSelectOpen,
  toggleSelect,
  selectProductType,
  selectStockStatus,
  productTypeSelectLabel,
  stockStatusSelectLabel,
} = useSingleSelectFilters({
  searchFilters,
  productTypes,
  isLoadingProductTypes,
  productStockOptions,
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
}

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

        <div class="inventory-tabs" role="tablist" aria-label="庫存活動模式">
          <button
            v-for="tab in inventoryTabs"
            :id="tab.tabId"
            ref="inventoryTabButtons"
            :key="tab.mode"
            class="inventory-tab"
            :class="{ 'is-active': activeInventoryMode === tab.mode }"
            type="button"
            role="tab"
            :aria-selected="activeInventoryMode === tab.mode"
            :aria-controls="tab.panelId"
            :tabindex="activeInventoryMode === tab.mode ? 0 : -1"
            @click="selectInventoryMode(tab.mode)"
            @keydown="handleInventoryTabKeydown"
          >
            <span>{{ tab.label }}</span>
            <span class="inventory-tab__count">
              {{ filteredProductModeCounts[tab.mode] }} 筆
            </span>
          </button>
        </div>

        <section
          v-for="tab in inventoryTabs"
          v-show="activeInventoryMode === tab.mode"
          :id="tab.panelId"
          :key="tab.panelId"
          class="inventory-tab-panel"
          role="tabpanel"
          :aria-labelledby="tab.tabId"
          tabindex="0"
        >
          <template v-if="activeInventoryMode === tab.mode">
            <MessageBlock v-if="isLoadingProducts" tone="empty" module="inventory">
              正在載入商品...
            </MessageBlock>

            <MessageBlock
              v-else-if="!currentActivityGroups.length"
              tone="empty"
              module="inventory"
            >
              {{ currentEmptyProductText }}
            </MessageBlock>

            <div v-else class="inventory-activity-groups">
              <InventoryActivityGroup
                v-for="group in currentActivityGroups"
                :key="getActivityCollapseKey(group)"
                :group="group"
                :panel-id="getActivityPanelId(group)"
                :collapsed="isActivityGroupCollapsed(group)"
                :columns="productTableColumns"
                :product-types="productTypes"
                :format-currency="formatCurrency"
                :get-cost-twd="getCostTwd"
                :format-date-time="formatDateTime"
                :strip-html="stripHtml"
                :sanitize-html="sanitizeHtml"
                :is-sort-active="isProductSortActive"
                :get-sort-aria-sort="getProductSortAriaSort"
                :get-sort-button-label="getProductSortButtonLabel"
                :get-sort-indicator="getProductSortIndicator"
                @toggle="toggleActivityGroup(group)"
                @sort="toggleProductSort"
                @open-note="openNoteDialog"
                @stock-in="openTransactionDialog($event, true)"
                @stock-out="openTransactionDialog($event, false)"
                @stock-history="openTransactionHistory"
              />
            </div>
          </template>
        </section>
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
