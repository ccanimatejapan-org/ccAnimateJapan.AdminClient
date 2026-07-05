import { computed, ref } from 'vue'

// Inventory's single-select filter UX (differs from the multiselect product page):
// get/set computed wrappers over the array-based searchFilters, the shared open-select
// key state, and the trigger labels. `pageSize` is the pagination ref so the page-size
// option list can close the dropdown after a pick.
export const useSingleSelectFilters = ({
  searchFilters,
  productTypes,
  isLoadingProductTypes,
  productStockOptions,
  pageSize,
}) => {
  const openSelectKey = ref('')

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
    pageSize.value = Number(value)
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

  return {
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
  }
}
