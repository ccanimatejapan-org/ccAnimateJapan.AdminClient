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
  filterInventoryProductsByInventoryVisibility,
} from '@/modules/inventory/utils/inventoryProductGroups'
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
      products.value = filterInventoryProductsByInventoryVisibility(
        responseProducts.map((product) => {
          const mappedProduct = mapProductFromApi(product)
          return {
            ...mappedProduct,
            activityName: product.activityName || '',
            isPreOrder: product.isPreOrder === true,
          }
        }),
      )
    } catch (err) {
      errorMessage.value = err.message || '載入庫存商品失敗。'
      products.value = []
    } finally {
      isLoadingProducts.value = false
    }
  }

  const filteredProducts = computed(() =>
    products.value.filter((product) => matchesProductFilters(product, searchFilters)),
  )
  const hasFiltersApplied = computed(() => hasActiveProductFilters(searchFilters))
  const filteredProductsCount = computed(() => filteredProducts.value.length)

  return {
    products,
    productTypes,
    isLoadingProducts,
    isLoadingProductTypes,
    loadProductTypes,
    loadProducts,
    filteredProducts,
    hasFiltersApplied,
    filteredProductsCount,
  }
}
