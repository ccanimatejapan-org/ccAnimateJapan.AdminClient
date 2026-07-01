<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getActivityById } from '@/modules/activity/api/activityApi'
import {
  downloadActivityProductsPdf,
  listActivityProducts,
  listProductTypes,
} from '@/modules/activityProduct/api/activityProductApi'
import CountBadge from '@/shared/components/CountBadge.vue'
import PageShell from '@/shared/components/PageShell.vue'
import PanelCard from '@/shared/components/PanelCard.vue'
import ActivityNoteDialog from '@/shared/components/ActivityNoteDialog.vue'
import CustomSelect from '@/shared/components/CustomSelect.vue'
import ProductFormDialog from '@/modules/activityProduct/components/ProductFormDialog.vue'
import ProductTable from '@/shared/components/ProductTable.vue'
import AppButton from '@/shared/components/AppButton.vue'
import IconButton from '@/shared/components/IconButton.vue'
import MessageBlock from '@/shared/components/MessageBlock.vue'
import { useTableSort } from '@/shared/composables/useTableSort'
import { useTablePagination } from '@/shared/composables/useTablePagination'
import { useNoteDialog } from '@/shared/composables/useNoteDialog'
import { useDialogScrollLock } from '@/shared/composables/useDialogScrollLock'
import { useActivityRateDefaults } from '@/modules/activityProduct/composables/useActivityRateDefaults'
import { useProductForm } from '@/modules/activityProduct/composables/useProductForm'
import { getAdminToken } from '@/shared/stores/authSession'
import { sanitizeHtml, stripHtml } from '@/shared/utils/html'
import { formatDateTime } from '@/shared/utils/format'
import { triggerBlobDownload } from '@/shared/utils/download'
import {
  PRODUCT_STOCK_FILTERS,
  createEmptyProductFilters,
  hasActiveProductFilters,
  matchesProductFilters,
} from '@/modules/activityProduct/utils/productFilters'
import {
  mapProductFromApi,
  mapProductTypeFromApi,
  toNumber,
} from '@/modules/activityProduct/utils/productMapper'
import { createProductTableColumns } from '@/modules/activityProduct/utils/productTableColumns'
import { createProductTypeNameGetter, getCostTwd } from '@/modules/activityProduct/utils/productPricing'

const route = useRoute()
const router = useRouter()
const plusIconPaths = [
  'M12 5v14',
  'M5 12h14',
]
const productTitleIconPaths = [
  'M12 3 21 8l-9 5-9-5 9-5Z',
  'M3 8v8l9 5 9-5V8',
  'M12 13v8',
]
const downloadIconPaths = [
  'M12 3v11',
  'm7 10 5 5 5-5',
  'M5 16v4h14v-4',
]

const activityId = computed(() => Number(route.params.activityId))
const selectedActivity = ref(null)
const activityName = computed(() => selectedActivity.value?.name || `活動 #${activityId.value || '-'}`)
const activityKindText = computed(() =>
  selectedActivity.value ? (selectedActivity.value.isPreOrder ? '預購' : '現貨') : '',
)
const isSpotActivity = computed(() => selectedActivity.value?.isPreOrder === false)
const isPreOrderActivity = computed(() => selectedActivity.value?.isPreOrder === true)

const products = ref([])
const isLoading = ref(false)
const isDownloadingPdf = ref(false)
const productTypes = ref([])
const isLoadingProductTypes = ref(false)
const productTypeErrorMessage = ref('')
const statusMessage = ref('')
const errorMessage = ref('')
const openFilterSelectKey = ref('')

const pageSizeOptions = [10, 20, 50]
const searchFilters = reactive(createEmptyProductFilters())
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

const { activityRateDefaults, loadActivityRateDefaults } = useActivityRateDefaults(activityId)

const {
  form,
  editingProductId,
  isDialogOpen,
  isSaving,
  canSaveProduct,
  imageUpload,
  getDefaultProductTypeId,
  openCreateDialog,
  openEditDialog,
  closeDialog,
  saveProduct,
  copyProduct,
} = useProductForm({
  activityId,
  activityName,
  selectedActivity,
  isSpotActivity,
  isPreOrderActivity,
  productTypes,
  isLoadingProductTypes,
  activityRateDefaults,
  products,
  statusMessage,
  errorMessage,
})

const {
  imageItems: productImageItems,
  remainingSlots: remainingProductImageSlots,
  limit: productImageLimit,
  handleChange: handleProductImageChange,
  removeExisting: removeExistingProductImage,
  removeNew: removeNewProductImage,
} = imageUpload

const {
  isNoteDialogOpen,
  selectedNoteHtml,
  selectedNoteTitle,
  openNoteDialog,
  closeNoteDialog,
} = useNoteDialog({ getNoteTitle: (item) => item?.name || '商品備註' })

const isAnyDialogOpen = computed(() => isDialogOpen.value || isNoteDialogOpen.value)
useDialogScrollLock(isAnyDialogOpen)

const formatCurrency = (value, prefix) => `${prefix} ${toNumber(value).toLocaleString()}`

const getProductTypeName = createProductTypeNameGetter(productTypes)

const productTableColumns = createProductTableColumns({
  getProductTypeName,
  getCostTwd,
  stripHtml,
})

const filteredProducts = computed(() =>
  products.value.filter((product) => matchesProductFilters(product, searchFilters)),
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

const selectPageSize = (size) => {
  pageSize.value = Number(size)
  openFilterSelectKey.value = ''
}

const isFilterSelectOpen = (key) => openFilterSelectKey.value === key

const toggleFilterSelect = (key, disabled = false) => {
  if (disabled) return

  openFilterSelectKey.value = isFilterSelectOpen(key) ? '' : key
}

const isFilterValueSelected = (key, value) =>
  searchFilters[key].some((selectedValue) => String(selectedValue) === String(value))

const toggleFilterValue = (key, value) => {
  if (isFilterValueSelected(key, value)) {
    searchFilters[key] = searchFilters[key].filter(
      (selectedValue) => String(selectedValue) !== String(value),
    )
    return
  }

  searchFilters[key] = [...searchFilters[key], value]
}

const clearFilterValue = (key) => {
  searchFilters[key] = []
}

const getSelectedFilterLabel = (key, options, placeholder) => {
  const selectedValues = searchFilters[key].map(String)
  if (!selectedValues.length) return placeholder

  const selectedLabels = options
    .filter((option) => selectedValues.includes(String(option.value)))
    .map((option) => option.label || `#${option.value}`)

  if (selectedLabels.length <= 2) {
    return selectedLabels.join('、')
  }

  return `已選擇 ${selectedLabels.length} 項`
}

const getFilterProductTypeLabel = () => {
  if (isLoadingProductTypes.value) return '載入商品類型中...'

  return getSelectedFilterLabel(
    'productTypeIds',
    productTypes.value.map((productType) => ({
      value: productType.id,
      label: productType.name || `#${productType.id}`,
    })),
    '選擇商品類型',
  )
}

const getFilterStockStatusLabel = () =>
  getSelectedFilterLabel('stockStatuses', productStockOptions, '選擇庫存狀態')

const clearSearchFilters = () => {
  Object.assign(searchFilters, createEmptyProductFilters())
  openFilterSelectKey.value = ''
  page.value = 1
}

const loadActivity = async () => {
  if (!activityId.value || !getAdminToken()) {
    selectedActivity.value = null
    return
  }

  try {
    selectedActivity.value = await getActivityById(activityId.value)
  } catch {
    selectedActivity.value = null
  }
}

const loadProductTypes = async () => {
  if (!getAdminToken()) {
    productTypes.value = []
    productTypeErrorMessage.value = '登入狀態已失效，請重新登入後再載入商品類型。'
    return
  }

  isLoadingProductTypes.value = true
  productTypeErrorMessage.value = ''

  try {
    const responseProductTypes = await listProductTypes()
    productTypes.value = responseProductTypes.map(mapProductTypeFromApi)

    const hasSelectedProductType = productTypes.value.some(
      (productType) => productType.id === toNumber(form.productTypeId),
    )
    if (!hasSelectedProductType) {
      form.productTypeId = getDefaultProductTypeId()
    }
  } catch (err) {
    productTypes.value = []
    productTypeErrorMessage.value = err.message || '載入商品類型失敗。'
  } finally {
    isLoadingProductTypes.value = false
  }
}

const loadProducts = async () => {
  if (!activityId.value) {
    errorMessage.value = '找不到活動 ID，無法載入商品。'
    return
  }

  if (!getAdminToken()) {
    errorMessage.value = '登入狀態已失效，請重新登入後再管理商品。'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const responseProducts = await listActivityProducts(activityId.value)
    products.value = responseProducts.map((product) => ({
      ...mapProductFromApi(product, activityId.value),
      activityName: activityName.value,
      isPreOrder: selectedActivity.value?.isPreOrder === true,
    }))
  } catch (err) {
    errorMessage.value = err.message || '載入商品失敗。'
  } finally {
    isLoading.value = false
  }
}

const downloadProductsPdf = async () => {
  if (!activityId.value) {
    errorMessage.value = '活動 ID 無效，無法下載商品 PDF。'
    return
  }

  if (!getAdminToken()) {
    errorMessage.value = '請先登入後台，再下載商品 PDF。'
    return
  }

  isDownloadingPdf.value = true
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const { blob, fileName } = await downloadActivityProductsPdf(activityId.value)
    triggerBlobDownload(blob, fileName)
    statusMessage.value = '商品 PDF 已開始下載。'
  } catch (err) {
    errorMessage.value = err.message || '下載商品 PDF 失敗。'
  } finally {
    isDownloadingPdf.value = false
  }
}

const loadPage = async () => {
  await loadActivity()
  await Promise.all([loadProductTypes(), loadProducts()])
}

onMounted(async () => {
  loadActivityRateDefaults()
  await loadPage()
})

watch(activityId, async () => {
  loadActivityRateDefaults()
  products.value = []
  statusMessage.value = ''
  errorMessage.value = ''
  productTypeErrorMessage.value = ''
  clearSearchFilters()
  closeDialog()
  await loadPage()
})

watch(
  searchFilters,
  () => {
    page.value = 1
  },
  { deep: true },
)
</script>

<template>
  <PageShell class="activity-management-page">
    <MessageBlock v-if="statusMessage" tone="success" module="product">{{ statusMessage }}</MessageBlock>
    <MessageBlock v-if="errorMessage && !isDialogOpen">{{ errorMessage }}</MessageBlock>

    <div class="product-page-toolbar">
      <AppButton pill @click="router.back()">回活動頁</AppButton>
    </div>

    <PanelCard accent>
      <div class="activity-panel-heading">
        <div class="activity-page-title">
          <div class="activity-page-meta">
            <p class="activity-page-copy">{{ activityName }} 的商品資料</p>
            <span
              v-if="selectedActivity"
              class="activity-kind-badge"
              :class="{ 'activity-kind-badge--preorder': selectedActivity?.isPreOrder }"
            >
              {{ activityKindText }}
            </span>
          </div>
          <div class="activity-title-row">
            <div class="activity-rate-defaults" aria-label="商品預設匯率設定">
              <label class="activity-rate-field">
                <span>成本匯率</span>
                <input
                  v-model.number="activityRateDefaults.rate"
                  min="0"
                  step="0.0001"
                  type="number"
                />
              </label>
              <label class="activity-rate-field">
                <span>售價匯率</span>
                <input
                  v-model.number="activityRateDefaults.saleRate"
                  min="0"
                  step="0.0001"
                  type="number"
                />
              </label>
            </div>
            <span class="management-title-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  v-for="path in productTitleIconPaths"
                  :key="path"
                  :d="path"
                />
              </svg>
            </span>
            <h1>商品管理</h1>
          </div>
        </div>

        <div class="activity-panel-actions">
          <IconButton
            class="product-toolbar-icon product-toolbar-icon--download"
            variant="table"
            :disabled="isDownloadingPdf"
            :aria-label="isDownloadingPdf ? 'PDF 下載中' : '下載商品 PDF'"
            :title="isDownloadingPdf ? 'PDF 下載中' : '下載商品 PDF'"
            @click="downloadProductsPdf"
          >
            <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path
                v-for="path in downloadIconPaths"
                :key="path"
                :d="path"
              />
            </svg>
          </IconButton>
          <IconButton
            class="product-toolbar-icon product-toolbar-icon--create"
            variant="table"
            aria-label="新增商品"
            title="新增商品"
            @click="openCreateDialog"
          >
            <svg class="table-button-svg" viewBox="0 0 24 24" aria-hidden="true">
              <path
                v-for="path in plusIconPaths"
                :key="path"
                :d="path"
              />
            </svg>
          </IconButton>
          <CountBadge tone="product">{{ totalProductsLabel }}</CountBadge>
        </div>
      </div>

      <section class="activity-filter-panel" aria-label="商品搜尋條件">
        <div class="activity-filter-grid">
          <label class="activity-filter-field">
            <span>商品名稱</span>
            <input
              v-model.trim="searchFilters.name"
              type="text"
              placeholder="輸入商品名稱搜尋"
            />
          </label>

          <div class="activity-filter-field">
            <span>商品類型</span>
            <CustomSelect
              tone="product"
              :label="getFilterProductTypeLabel()"
              :open="isFilterSelectOpen('productTypeIds')"
              :disabled="isLoadingProductTypes"
              @toggle="toggleFilterSelect('productTypeIds', isLoadingProductTypes)"
            >
              <button class="custom-select-option custom-select-option--action" type="button" @click="clearFilterValue('productTypeIds')">
                清除商品類型
              </button>
              <label
                v-for="productType in productTypes"
                :key="productType.id"
                class="custom-select-option custom-select-checkbox-option"
                :class="{ 'is-selected': isFilterValueSelected('productTypeIds', productType.id) }"
              >
                <input
                  :checked="isFilterValueSelected('productTypeIds', productType.id)"
                  type="checkbox"
                  @change="toggleFilterValue('productTypeIds', productType.id)"
                />
                <span>{{ productType.name || `#${productType.id}` }}</span>
              </label>
            </CustomSelect>
          </div>

          <div class="activity-filter-field">
            <span>庫存狀態</span>
            <CustomSelect
              tone="product"
              :label="getFilterStockStatusLabel()"
              :open="isFilterSelectOpen('stockStatuses')"
              @toggle="toggleFilterSelect('stockStatuses')"
            >
              <button class="custom-select-option custom-select-option--action" type="button" @click="clearFilterValue('stockStatuses')">
                清除庫存狀態
              </button>
              <label
                v-for="stockOption in productStockOptions"
                :key="stockOption.value"
                class="custom-select-option custom-select-checkbox-option"
                :class="{ 'is-selected': isFilterValueSelected('stockStatuses', stockOption.value) }"
              >
                <input
                  :checked="isFilterValueSelected('stockStatuses', stockOption.value)"
                  type="checkbox"
                  @change="toggleFilterValue('stockStatuses', stockOption.value)"
                />
                <span>{{ stockOption.label }}</span>
              </label>
            </CustomSelect>
          </div>
        </div>

        <div class="activity-filter-actions">
          <div class="activity-filter-summary">
            {{ hasFiltersApplied ? `目前顯示 ${filteredProductsCount} 筆` : '顯示全部商品' }}
          </div>
          <AppButton pill :disabled="!hasFiltersApplied" @click="clearSearchFilters">
            清除篩選
          </AppButton>
        </div>
      </section>

      <ProductTable
        :products="paginatedProducts"
        :columns="productTableColumns"
        :product-types="productTypes"
        :is-loading="isLoading"
        :format-currency="formatCurrency"
        :get-cost-twd="getCostTwd"
        :format-date-time="formatDateTime"
        :strip-html="stripHtml"
        :sanitize-html="sanitizeHtml"
        :is-sort-active="isProductSortActive"
        :get-sort-aria-sort="getProductSortAriaSort"
        :get-sort-button-label="getProductSortButtonLabel"
        :get-sort-indicator="getProductSortIndicator"
        @sort="toggleProductSort"
        @open-note="openNoteDialog"
        @edit="openEditDialog"
        @copy="copyProduct"
      />

      <div class="activity-pagination" aria-label="商品分頁">
        <div class="activity-pagination-summary">{{ paginationSummary }}</div>

        <div class="activity-pagination-actions">
          <div class="activity-page-size">
            <span>每頁</span>
            <CustomSelect
              tone="product"
              :label="String(pageSize)"
              :open="isFilterSelectOpen('pageSize')"
              @toggle="toggleFilterSelect('pageSize')"
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

          <AppButton pill :disabled="page <= 1" @click="goToPreviousPage">
            上一頁
          </AppButton>
          <span class="activity-page-indicator">{{ page }} / {{ totalPages }}</span>
          <AppButton pill :disabled="page >= totalPages" @click="goToNextPage">
            下一頁
          </AppButton>
        </div>
      </div>
    </PanelCard>

    <ProductFormDialog
      v-if="isDialogOpen"
      :form="form"
      :editing-product-id="editingProductId"
      :is-saving="isSaving"
      :error-message="errorMessage"
      :product-type-error-message="productTypeErrorMessage"
      :product-types="productTypes"
      :is-loading-product-types="isLoadingProductTypes"
      :can-submit="canSaveProduct"
      :product-images="productImageItems"
      :remaining-image-slots="remainingProductImageSlots"
      :image-limit="productImageLimit"
      :is-spot-activity="isSpotActivity"
      :is-pre-order-activity="isPreOrderActivity"
      @close="closeDialog"
      @submit="saveProduct"
      @image-change="handleProductImageChange"
      @remove-existing-image="removeExistingProductImage"
      @remove-new-image="removeNewProductImage"
    />

    <ActivityNoteDialog
      v-if="isNoteDialogOpen"
      tone="product"
      :title="selectedNoteTitle"
      :html="selectedNoteHtml"
      @close="closeNoteDialog"
    />
  </PageShell>
</template>

<style scoped lang="scss" src="../styles/activity-products.scss"></style>
