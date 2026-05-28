<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getActivityById } from '@/api/activities'
import {
  createActivityProduct,
  downloadActivityProductsPdf,
  listActivityProducts,
  listProductTypes,
  updateActivityProduct,
} from '@/api/activityProducts'
import CountBadge from '@/components/layout/CountBadge.vue'
import PageShell from '@/components/layout/PageShell.vue'
import PanelCard from '@/components/layout/PanelCard.vue'
import ActivityNoteDialog from '@/components/activities/ActivityNoteDialog.vue'
import CustomSelect from '@/components/activities/CustomSelect.vue'
import ProductFormDialog from '@/components/products/ProductFormDialog.vue'
import ProductTable from '@/components/products/ProductTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import IconButton from '@/components/ui/IconButton.vue'
import MessageBlock from '@/components/ui/MessageBlock.vue'
import { useTableSort } from '@/composables/common/useTableSort'
import { getAdminToken } from '@/stores/authSession'
import { sanitizeHtml, stripHtml } from '@/utils/html'
import {
  PRODUCT_STOCK_FILTERS,
  createEmptyProductFilters,
  hasActiveProductFilters,
  matchesProductFilters,
} from '@/utils/products/productFilters'
import { mapProductFromApi, mapProductTypeFromApi, toNumber } from '@/utils/products/productMapper'
import { createProductTableColumns } from '@/utils/products/productTableColumns'

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
const productImageLimit = 5
const productImageMaxBytes = 5 * 1024 * 1024
const allowedProductImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])
const activityId = computed(() => Number(route.params.activityId))
const selectedActivity = ref(null)
const activityName = computed(() => selectedActivity.value?.name || `活動 #${activityId.value || '-'}`)
const activityKindText = computed(() =>
  selectedActivity.value ? (selectedActivity.value.isPreOrder ? '預購' : '現貨') : '',
)

const isDialogOpen = ref(false)
const editingProductId = ref(null)
const products = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const isDownloadingPdf = ref(false)
const productTypes = ref([])
const isLoadingProductTypes = ref(false)
const productTypeErrorMessage = ref('')
const statusMessage = ref('')
const errorMessage = ref('')
const isNoteDialogOpen = ref(false)
const selectedNoteProduct = ref(null)
const selectedNoteHtml = computed(() => sanitizeHtml(selectedNoteProduct.value?.info || ''))
const selectedNoteTitle = computed(() => selectedNoteProduct.value?.name || '商品備註')
const isAnyDialogOpen = computed(() => isDialogOpen.value || isNoteDialogOpen.value)
const openFilterSelectKey = ref('')
const activityRateDefaults = reactive({
  rate: 0.2,
  saleRate: 0.24,
})
const activityRateDefaultsStorageKey = 'cc-admin:activity-product-rate-defaults'

const emptyForm = {
  name: '',
  japanCost: 0,
  rate: 0.2,
  saleRate: 0.24,
  price: 0,
  amount: 0,
  isOutStock: false,
  productTypeId: 1,
  info: '',
}

const form = reactive({ ...emptyForm })
const searchFilters = reactive(createEmptyProductFilters())
const pageSizeOptions = [10, 20, 50]
const pagination = reactive({
  page: 1,
  pageSize: pageSizeOptions[0],
})
const existingProductImages = ref([])
const removedProductImageIds = ref([])
const selectedProductImageFiles = ref([])
const productImagePreviewUrls = ref([])
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

const getNormalizedRateValue = (value, fallback) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback
}

const getStoredActivityRateDefaults = () => {
  if (typeof localStorage === 'undefined') return {}

  try {
    const parsed = JSON.parse(localStorage.getItem(activityRateDefaultsStorageKey) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const saveActivityRateDefaults = () => {
  if (typeof localStorage === 'undefined' || !activityId.value) return

  const storedDefaults = getStoredActivityRateDefaults()
  storedDefaults[String(activityId.value)] = {
    rate: getNormalizedRateValue(activityRateDefaults.rate, emptyForm.rate),
    saleRate: getNormalizedRateValue(activityRateDefaults.saleRate, emptyForm.saleRate),
  }

  localStorage.setItem(activityRateDefaultsStorageKey, JSON.stringify(storedDefaults))
}

const loadActivityRateDefaults = () => {
  const storedDefaults = getStoredActivityRateDefaults()[String(activityId.value)] || {}

  activityRateDefaults.rate = getNormalizedRateValue(storedDefaults.rate, emptyForm.rate)
  activityRateDefaults.saleRate = getNormalizedRateValue(storedDefaults.saleRate, emptyForm.saleRate)
}

const activeExistingProductImages = computed(() =>
  existingProductImages.value.filter(
    (image) => !removedProductImageIds.value.includes(toNumber(image.id)),
  ),
)

const productImageItems = computed(() => [
  ...activeExistingProductImages.value.map((image) => ({
    key: `existing-${image.id}`,
    kind: 'existing',
    id: image.id,
    url: image.productImageUrl,
    name: form.name || '商品圖片',
  })),
  ...selectedProductImageFiles.value.map((file, index) => ({
    key: `new-${index}-${file.name}-${file.size}-${file.lastModified}`,
    kind: 'new',
    index,
    url: productImagePreviewUrls.value[index],
    name: file.name,
  })),
])

const remainingProductImageSlots = computed(() =>
  Math.max(0, productImageLimit - productImageItems.value.length),
)

const formatCurrency = (value, prefix) => `${prefix} ${toNumber(value).toLocaleString()}`

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

const getDefaultProductTypeId = () => productTypes.value[0]?.id || emptyForm.productTypeId

const hasSelectedProductType = computed(() =>
  productTypes.value.some((productType) => productType.id === toNumber(form.productTypeId)),
)

const canSaveProduct = computed(() => !isLoadingProductTypes.value && hasSelectedProductType.value)

const isBlankValue = (value) => value === undefined || value === null || String(value).trim() === ''

const hasPositiveNumberValue = (value) => {
  if (isBlankValue(value)) return false

  const numberValue = Number(value)
  return Number.isFinite(numberValue) && numberValue > 0
}

const formatRequiredFieldsMessage = (fields) => `請填寫：${fields.join('、')}。`

const validateProductForm = () => {
  const missingFields = []

  if (isBlankValue(form.name)) missingFields.push('商品名稱')
  if (!hasPositiveNumberValue(form.japanCost)) missingFields.push('日本成本')
  if (!hasPositiveNumberValue(form.rate)) missingFields.push('成本匯率')
  if (!hasPositiveNumberValue(form.saleRate)) missingFields.push('售價匯率')
  if (!hasPositiveNumberValue(form.price)) missingFields.push('售價')
  if (!hasSelectedProductType.value) missingFields.push('商品類型')
  if (productImageItems.value.length === 0) missingFields.push('商品圖片')

  if (missingFields.length) {
    errorMessage.value = formatRequiredFieldsMessage(missingFields)
    return false
  }

  return true
}

const getSaleRateFromProduct = (product) => {
  const japanCost = toNumber(product.japanCost)
  const price = toNumber(product.price)

  if (japanCost <= 0) return toNumber(product.rate, emptyForm.saleRate)

  return Number((price / japanCost).toFixed(4))
}

const getProductTypeName = (productTypeId) => {
  const normalizedProductTypeId = toNumber(productTypeId)
  const productType = productTypes.value.find((type) => toNumber(type?.id) === normalizedProductTypeId)

  return productType?.name || (normalizedProductTypeId ? `#${normalizedProductTypeId}` : '-')
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

const selectPageSize = (size) => {
  pagination.pageSize = Number(size)
  openFilterSelectKey.value = ''
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
  pagination.page = 1
}

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

const goToPage = (page) => {
  pagination.page = Math.min(Math.max(page, 1), totalPages.value)
}

const goToPreviousPage = () => goToPage(pagination.page - 1)

const goToNextPage = () => goToPage(pagination.page + 1)

const setDialogScrollLock = (isLocked) => {
  if (typeof document === 'undefined') return

  document.body.classList.toggle('dialog-scroll-locked', isLocked)
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

const resetForm = () => {
  resetProductImages()
  Object.assign(form, {
    ...emptyForm,
    rate: getNormalizedRateValue(activityRateDefaults.rate, emptyForm.rate),
    saleRate: getNormalizedRateValue(activityRateDefaults.saleRate, emptyForm.saleRate),
    productTypeId: getDefaultProductTypeId(),
  })
  editingProductId.value = null
}

const updatePriceFromSaleRate = () => {
  form.price = Math.round(toNumber(form.japanCost) * toNumber(form.saleRate))
}

const buildProductPayload = () => ({
  name: form.name.trim(),
  japanCost: toNumber(form.japanCost),
  rate: toNumber(form.rate),
  price: toNumber(form.price),
  amount: 0,
  isOutStock: Boolean(form.isOutStock),
  productTypeId: toNumber(form.productTypeId),
  info: sanitizeHtml(form.info).trim(),
})

const appendIfValue = (formData, key, value) => {
  if (value !== undefined && value !== null && value !== '') {
    formData.append(key, value)
  }
}

const revokeProductImagePreviewUrl = (url) => {
  if (url && typeof URL !== 'undefined') {
    URL.revokeObjectURL(url)
  }
}

const clearSelectedProductImages = () => {
  productImagePreviewUrls.value.forEach(revokeProductImagePreviewUrl)
  selectedProductImageFiles.value = []
  productImagePreviewUrls.value = []
}

const resetProductImages = () => {
  clearSelectedProductImages()
  existingProductImages.value = []
  removedProductImageIds.value = []
}

const handleProductImageChange = (event) => {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  errorMessage.value = ''

  if (!files.length) return

  const invalidTypeFile = files.find((file) => !allowedProductImageTypes.has(file.type))
  if (invalidTypeFile) {
    errorMessage.value = '商品圖片僅支援 JPG、PNG、WebP 或 GIF。'
    return
  }

  const oversizedFile = files.find((file) => file.size > productImageMaxBytes)
  if (oversizedFile) {
    errorMessage.value = '單張商品圖片不可超過 5MB。'
    return
  }

  if (remainingProductImageSlots.value <= 0) {
    errorMessage.value = `商品圖片最多 ${productImageLimit} 張。`
    return
  }

  const acceptedFiles = files.slice(0, remainingProductImageSlots.value)
  if (files.length > acceptedFiles.length) {
    errorMessage.value = `商品圖片最多 ${productImageLimit} 張，已加入前 ${acceptedFiles.length} 張。`
  }

  selectedProductImageFiles.value = [...selectedProductImageFiles.value, ...acceptedFiles]
  productImagePreviewUrls.value = [
    ...productImagePreviewUrls.value,
    ...acceptedFiles.map((file) => URL.createObjectURL(file)),
  ]
}

const removeExistingProductImage = (imageId) => {
  const normalizedImageId = toNumber(imageId)
  if (normalizedImageId <= 0 || removedProductImageIds.value.includes(normalizedImageId)) return

  removedProductImageIds.value = [...removedProductImageIds.value, normalizedImageId]
}

const removeNewProductImage = (index) => {
  const normalizedIndex = toNumber(index, -1)
  if (normalizedIndex < 0) return

  revokeProductImagePreviewUrl(productImagePreviewUrls.value[normalizedIndex])
  selectedProductImageFiles.value = selectedProductImageFiles.value.filter(
    (_, fileIndex) => fileIndex !== normalizedIndex,
  )
  productImagePreviewUrls.value = productImagePreviewUrls.value.filter(
    (_, fileIndex) => fileIndex !== normalizedIndex,
  )
}

const buildProductFormData = (productId = null) => {
  const formData = new FormData()
  const payload = buildProductPayload()

  appendIfValue(formData, 'id', productId)
  Object.entries(payload).forEach(([key, value]) => {
    appendIfValue(formData, key, value)
  })
  selectedProductImageFiles.value.forEach((file) => {
    formData.append('imageFiles', file)
  })
  removedProductImageIds.value.forEach((imageId) => {
    formData.append('removeImageIds', imageId)
  })

  return formData
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
    products.value = responseProducts.map((product) => mapProductFromApi(product, activityId.value))
  } catch (err) {
    errorMessage.value = err.message || '載入商品失敗。'
  } finally {
    isLoading.value = false
  }
}

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

const openCreateDialog = () => {
  resetForm()
  statusMessage.value = ''
  errorMessage.value = ''
  isDialogOpen.value = true
}

const openEditDialog = (product) => {
  resetForm()
  editingProductId.value = product.id
  existingProductImages.value = product.images || []
  Object.assign(form, {
    name: product.name,
    japanCost: product.japanCost,
    rate: product.rate,
    saleRate: getSaleRateFromProduct(product),
    price: product.price,
    amount: 0,
    isOutStock: product.isOutStock,
    productTypeId: product.productTypeId || getDefaultProductTypeId(),
    info: product.info || '',
  })
  statusMessage.value = ''
  errorMessage.value = ''
  isDialogOpen.value = true
}

const closeDialog = () => {
  isDialogOpen.value = false
  resetForm()
}

const openNoteDialog = (product) => {
  if (!stripHtml(product.info)) return
  selectedNoteProduct.value = product
  isNoteDialogOpen.value = true
}

const closeNoteDialog = () => {
  isNoteDialogOpen.value = false
  selectedNoteProduct.value = null
}

const saveProduct = async () => {
  if (!validateProductForm()) {
    return
  }

  if (!getAdminToken()) {
    errorMessage.value = '登入狀態已失效，請重新登入後再儲存商品。'
    return
  }

  if (!hasSelectedProductType.value) {
    errorMessage.value = '請先選擇有效的商品類型。'
    return
  }

  isSaving.value = true
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const payload = buildProductFormData(editingProductId.value)
    const response = editingProductId.value
      ? await updateActivityProduct(activityId.value, payload)
      : await createActivityProduct(activityId.value, payload)
    const savedProduct = mapProductFromApi(response?.data, activityId.value)

    if (editingProductId.value) {
      products.value = products.value.map((product) =>
        product.id === editingProductId.value ? savedProduct : product,
      )
      statusMessage.value = '編輯商品成功。'
    } else {
      products.value.unshift(savedProduct)
      statusMessage.value = '新增商品成功。'
    }

    closeDialog()
  } catch (err) {
    errorMessage.value = err.message || '儲存商品失敗。'
  } finally {
    isSaving.value = false
  }
}

const loadPage = () => {
  loadActivity()
  loadProductTypes()
  loadProducts()
}

onMounted(() => {
  loadActivityRateDefaults()
  loadPage()
})
onBeforeUnmount(() => {
  resetProductImages()
  setDialogScrollLock(false)
})

watch(activityId, () => {
  loadActivityRateDefaults()
  products.value = []
  statusMessage.value = ''
  errorMessage.value = ''
  productTypeErrorMessage.value = ''
  clearSearchFilters()
  closeDialog()
  loadPage()
})

watch(
  () => [activityRateDefaults.rate, activityRateDefaults.saleRate, activityId.value],
  () => {
    saveActivityRateDefaults()
  },
)

watch(
  () => [form.japanCost, form.saleRate],
  updatePriceFromSaleRate,
)

watch(
  searchFilters,
  () => {
    pagination.page = 1
  },
  { deep: true },
)

watch(
  () => pagination.pageSize,
  () => {
    pagination.page = 1
  },
)

watch(totalPages, (nextTotalPages) => {
  if (pagination.page > nextTotalPages) {
    pagination.page = nextTotalPages
  }
})

watch(isAnyDialogOpen, setDialogScrollLock, { immediate: true })
</script>

<template>
  <PageShell class="activity-management-page">
    <MessageBlock v-if="statusMessage" tone="success">{{ statusMessage }}</MessageBlock>
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
          <CountBadge>{{ totalProductsLabel }}</CountBadge>
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
      />

      <div class="activity-pagination" aria-label="商品分頁">
        <div class="activity-pagination-summary">{{ paginationSummary }}</div>

        <div class="activity-pagination-actions">
          <div class="activity-page-size">
            <span>每頁</span>
            <CustomSelect
              tone="product"
              :label="String(pagination.pageSize)"
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

          <AppButton pill :disabled="pagination.page <= 1" @click="goToPreviousPage">
            上一頁
          </AppButton>
          <span class="activity-page-indicator">{{ pagination.page }} / {{ totalPages }}</span>
          <AppButton pill :disabled="pagination.page >= totalPages" @click="goToNextPage">
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
      @close="closeDialog"
      @submit="saveProduct"
      @image-change="handleProductImageChange"
      @remove-existing-image="removeExistingProductImage"
      @remove-new-image="removeNewProductImage"
    />

    <ActivityNoteDialog
      v-if="isNoteDialogOpen"
      :title="selectedNoteTitle"
      :html="selectedNoteHtml"
      @close="closeNoteDialog"
    />
  </PageShell>
</template>

<style scoped>
.activity-management-page {
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

.product-page-toolbar {
  display: flex;
  align-items: center;
}

.activity-panel-heading {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
  border-bottom: 1px solid #f0e5dc;
  padding-bottom: 20px;
}

.activity-page-title {
  min-width: 0;
}

.activity-title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.management-title-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  order: 1;
  place-items: center;
  border-radius: 14px;
  background: color-mix(in srgb, #277867 13%, #ffffff);
  color: #277867;
}

.management-title-icon svg {
  width: 26px;
  height: 26px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
}

.activity-page-copy {
  margin: 0;
  color: #5e786f;
  font-size: 0.84rem;
  font-weight: 800;
  line-height: 1.4;
}

.activity-page-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.activity-kind-badge {
  display: inline-flex;
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

.activity-page-title h1 {
  margin: 0;
  color: #13201c;
  font-size: 1.8rem;
  line-height: 1.2;
  order: 2;
}

.activity-rate-defaults {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  order: 3;
}

.activity-rate-field {
  display: grid;
  gap: 6px;
  min-width: 132px;
  color: #4e443d;
  font-size: 0.82rem;
  font-weight: 800;
}

.activity-rate-field input {
  width: 100%;
  min-height: 40px;
  border: 1px solid #d8e6de;
  border-radius: 10px;
  background: #f8fcfa;
  color: #1f3e35;
  font: inherit;
  padding: 0 12px;
}

.activity-rate-field input:focus {
  border-color: #277867;
  box-shadow: 0 0 0 3px rgb(39 120 103 / 15%);
  outline: none;
}

.activity-panel-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.product-toolbar-icon.product-toolbar-icon--create,
.product-toolbar-icon.product-toolbar-icon--download {
  border-color: #277867;
  background: #277867;
  color: #ffffff;
}

.product-toolbar-icon.product-toolbar-icon--create:hover:not(:disabled),
.product-toolbar-icon.product-toolbar-icon--download:hover:not(:disabled) {
  border-color: #1f6154;
  background: #1f6154;
  color: #ffffff;
}

.activity-filter-panel {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
  border: 1px solid #d8e6de;
  border-radius: 14px;
  background: #fffdf9;
  padding: 18px;
}

.activity-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.activity-filter-field {
  display: grid;
  gap: 8px;
  color: #4e443d;
  font-size: 0.92rem;
  font-weight: 700;
}

.activity-filter-field input {
  width: 100%;
  min-height: 44px;
  border: 1px solid #eaded2;
  border-radius: 10px;
  background: #f4fbf7;
  color: #2a2825;
  padding: 0 12px;
}

.activity-filter-field input:focus {
  border-color: #277867;
  box-shadow: 0 0 0 3px rgb(39 120 103 / 15%);
  outline: none;
}

.custom-select-checkbox-option {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.custom-select-checkbox-option.is-selected {
  background: var(--select-accent-soft);
  color: var(--select-accent-text);
}

.custom-select-checkbox-option input {
  width: 16px;
  min-width: 16px;
  height: 16px;
  min-height: 16px;
  margin: 0;
  accent-color: #1f6154;
  cursor: pointer;
}

.custom-select-option--action {
  color: #277867;
  font-weight: 800;
}

.custom-select-checkbox-option span {
  min-width: 0;
}

.activity-filter-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.activity-filter-summary {
  color: #5b514a;
  font-size: 0.92rem;
  font-weight: 700;
}

.activity-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 18px;
}

.activity-pagination-summary {
  color: #5b514a;
  font-size: 0.92rem;
  font-weight: 700;
}

.activity-pagination-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.activity-page-size {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #4e443d;
  font-size: 0.92rem;
  font-weight: 700;
}

.activity-page-size :deep(.custom-select) {
  width: 84px;
}

.activity-page-size :deep(.custom-select-trigger) {
  min-height: 44px;
}

.activity-page-indicator {
  min-width: 64px;
  color: #384942;
  font-size: 0.92rem;
  font-weight: 800;
  text-align: center;
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

@media (max-width: 560px) {
  .activity-page-title h1 {
    font-size: 1.45rem;
  }

  .activity-panel-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .activity-rate-defaults {
    width: 100%;
  }

  .activity-rate-field {
    flex: 1 1 160px;
  }

  .activity-panel-actions {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .activity-filter-grid {
    grid-template-columns: 1fr;
  }

  .activity-filter-actions,
  .activity-pagination,
  .activity-pagination-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .activity-page-size {
    justify-content: space-between;
  }
}
</style>
