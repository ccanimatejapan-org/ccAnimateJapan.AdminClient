import { computed, ref } from 'vue'
import { listActivities } from '@/modules/activity/api/activityApi'
import {
  listActivityProducts,
  listOrderedActivityProducts,
  listProductTypes,
} from '@/modules/activityProduct/api/activityProductApi'
import { mapActivityFromApi } from '@/modules/activity/utils/activityMapper'
import {
  mapProductFromApi,
  mapProductTypeFromApi,
} from '@/modules/activityProduct/utils/productMapper'
import {
  hasActiveProductFilters,
  matchesProductFilters,
} from '@/modules/activityProduct/utils/productFilters'

// Cross-activity inventory loader: loads every activity, then for each fetches its
// products via the spot endpoint (listActivityProducts) or, for pre-order activities,
// the ordered endpoint (listOrderedActivityProducts), then flattens/annotates them.
// Also owns the product-types load and the derived filtered counts/labels.
export const useInventoryProducts = ({ searchFilters, errorMessage }) => {
  const activities = ref([])
  const products = ref([])
  const productTypes = ref([])
  const isLoadingProducts = ref(false)
  const isLoadingProductTypes = ref(false)

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
    activities,
    products,
    productTypes,
    isLoadingProducts,
    isLoadingProductTypes,
    loadActivities,
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
