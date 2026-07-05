import { computed, ref } from 'vue'
import {
  listProductTypes,
} from '@/modules/activityProduct/api/activityProductApi'
import { listInventoryProducts } from '@/modules/inventory/api/inventoryApi'
import {
  mapProductFromApi,
  mapProductTypeFromApi,
} from '@/modules/activityProduct/utils/productMapper'
import {
  hasActiveProductFilters,
  matchesProductFilters,
} from '@/modules/activityProduct/utils/productFilters'

// Inventory loader backed by the aggregate inventory endpoint. Product types are
// still loaded separately for the filter labels and derived counts.
export const useInventoryProducts = ({ searchFilters, errorMessage }) => {
  const products = ref([])
  const productTypes = ref([])
  const isLoadingProducts = ref(false)
  const isLoadingProductTypes = ref(false)

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
    isLoadingProducts.value = true
    errorMessage.value = ''

    try {
      const responseProducts = await listInventoryProducts()
      products.value = responseProducts.map((product) => {
        const mappedProduct = mapProductFromApi(product)
        return {
          ...mappedProduct,
          activityName: product.activityName || (mappedProduct.activityId ? `活動 #${mappedProduct.activityId}` : '-'),
          isPreOrder: product.isPreOrder === true,
        }
      })
    } catch (err) {
      errorMessage.value = err.message || '載入庫存商品失敗。'
      products.value = []
    } finally {
      isLoadingProducts.value = false
    }
  }

  const visibleProducts = computed(() => products.value)
  const filteredProducts = computed(() =>
    visibleProducts.value.filter((product) => matchesProductFilters(product, searchFilters)),
  )
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

  return {
    products,
    productTypes,
    isLoadingProducts,
    isLoadingProductTypes,
    loadProductTypes,
    loadProducts,
    visibleProducts,
    filteredProducts,
    hasFiltersApplied,
    filteredProductsCount,
    totalProductsLabel,
    visibleProductsLabel,
  }
}
