import { computed, ref } from 'vue'
import {
  deleteCustomer,
  getCustomerDetail,
  listCustomers,
  restoreCustomer,
} from '@/modules/customer/api/customerApi'
import { CUSTOMER_TABS } from '@/modules/customer/utils/customerFilters'

const PAGE_SIZE_OPTIONS = [30, 50, 100]

export const useCustomers = ({ errorMessage, statusMessage }) => {
  const items = ref([])
  const counts = ref({ all: 0, withOrders: 0, noOrders: 0, deleted: 0 })
  const page = ref(1)
  const pageSize = ref(PAGE_SIZE_OPTIONS[0])
  const totalCount = ref(0)
  const totalPages = ref(0)
  const keywordInput = ref('')
  const keyword = ref('')
  const activeTabKey = ref('all')
  const isLoading = ref(false)
  const isLoadingDetail = ref(false)
  const mutatingId = ref(null)
  const openSelectKey = ref('')
  const selectedCustomer = ref(null)

  const activeTab = computed(
    () => CUSTOMER_TABS.find((tab) => tab.key === activeTabKey.value) || CUSTOMER_TABS[0],
  )

  const paginationSummary = computed(() => {
    if (!totalCount.value) {
      return activeTab.value.key === 'all' ? '目前沒有顧客。' : `目前沒有${activeTab.value.label}的顧客。`
    }
    const start = (page.value - 1) * pageSize.value + 1
    const end = Math.min(start + pageSize.value - 1, totalCount.value)
    return `第 ${start}-${end} 筆，共 ${totalCount.value} 筆`
  })

  const loadCustomers = async (allowPageCorrection = true) => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const result = await listCustomers({
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value,
        status: activeTab.value.key,
      })
      items.value = result.items || []
      counts.value = result.counts || { all: 0, withOrders: 0, noOrders: 0, deleted: 0 }
      totalCount.value = result.totalCount || 0
      totalPages.value = result.totalPages || 0
      page.value = result.page || page.value
      if (allowPageCorrection && totalPages.value > 0 && page.value > totalPages.value) {
        page.value = totalPages.value
        await loadCustomers(false)
      }
    } catch (err) {
      errorMessage.value = err?.message || '顧客資料載入失敗'
      items.value = []
      totalCount.value = 0
      totalPages.value = 0
    } finally {
      isLoading.value = false
    }
  }

  const search = async () => {
    keyword.value = keywordInput.value.trim()
    page.value = 1
    await loadCustomers()
  }

  const selectTab = async (tabKey) => {
    if (tabKey === activeTabKey.value) return
    if (!CUSTOMER_TABS.some((tab) => tab.key === tabKey)) return
    activeTabKey.value = tabKey
    page.value = 1
    await loadCustomers()
  }

  const selectPageSize = async (size) => {
    pageSize.value = Number(size)
    page.value = 1
    openSelectKey.value = ''
    await loadCustomers()
  }

  const goToPage = async (nextPage) => {
    const maxPage = Math.max(1, totalPages.value || 1)
    if (nextPage < 1 || nextPage > maxPage) return
    page.value = nextPage
    await loadCustomers()
  }

  const openCustomer = async (customerId) => {
    if (!customerId) return
    isLoadingDetail.value = true
    errorMessage.value = ''

    try {
      const detail = await getCustomerDetail(customerId)
      selectedCustomer.value = detail
    } catch (err) {
      errorMessage.value = err?.message || '顧客明細載入失敗'
    } finally {
      isLoadingDetail.value = false
    }
  }

  const closeCustomer = () => {
    selectedCustomer.value = null
  }

  const setDeleted = async (customer, isDelete) => {
    const id = customer?.id || customer?.profile?.id
    if (!id || mutatingId.value) return false

    mutatingId.value = id
    errorMessage.value = ''
    statusMessage.value = ''

    try {
      if (isDelete) await deleteCustomer(id)
      else await restoreCustomer(id)
      statusMessage.value = isDelete ? '顧客已停用。' : '顧客已恢復使用。'
      if (selectedCustomer.value?.profile?.id === id) {
        await openCustomer(id)
      }
      await loadCustomers()
      return true
    } catch (err) {
      errorMessage.value = err?.message || (isDelete ? '停用顧客失敗' : '恢復顧客失敗')
      return false
    } finally {
      mutatingId.value = null
    }
  }

  return {
    items,
    counts,
    page,
    pageSize,
    totalCount,
    totalPages,
    keywordInput,
    isLoading,
    isLoadingDetail,
    mutatingId,
    openSelectKey,
    activeTabKey,
    selectedCustomer,
    paginationSummary,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    tabs: CUSTOMER_TABS,
    loadCustomers,
    search,
    selectTab,
    selectPageSize,
    goToPage,
    openCustomer,
    closeCustomer,
    setDeleted,
  }
}
