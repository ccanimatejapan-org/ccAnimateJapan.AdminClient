import { computed, ref } from 'vue'
import { listWishPools, updateWishPoolGroupBuyDecision } from '@/modules/wishPool/api/wishPoolApi'
import { WISH_POOL_TABS } from '@/modules/wishPool/utils/wishPoolDecisions'

const PAGE_SIZE_OPTIONS = [30, 50, 100]

export const useWishPools = ({ errorMessage, statusMessage }) => {
  const items = ref([])
  const counts = ref({ all: 0, pending: 0, opened: 0, notOpened: 0 })
  const page = ref(1)
  const pageSize = ref(PAGE_SIZE_OPTIONS[0])
  const totalCount = ref(0)
  const totalPages = ref(0)
  const keywordInput = ref('')
  const keyword = ref('')
  const activeTabKey = ref('pending')
  const isLoading = ref(false)
  const updatingId = ref(null)
  const openSelectKey = ref('')

  const activeTab = computed(
    () => WISH_POOL_TABS.find((tab) => tab.key === activeTabKey.value) || WISH_POOL_TABS[0],
  )

  const paginationSummary = computed(() => {
    if (!totalCount.value) return activeTab.value.key === 'all' ? '目前沒有許願。' : `目前沒有${activeTab.value.label}的許願。`
    const start = (page.value - 1) * pageSize.value + 1
    const end = Math.min(start + pageSize.value - 1, totalCount.value)
    return `第 ${start}-${end} 筆，共 ${totalCount.value} 筆`
  })

  const loadWishPools = async (allowPageCorrection = true) => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const result = await listWishPools({
        page: page.value,
        pageSize: pageSize.value,
        keyword: keyword.value,
        groupBuyDecision: activeTab.value.decision,
      })
      items.value = result.items || []
      counts.value = result.counts || { all: 0, pending: 0, opened: 0, notOpened: 0 }
      totalCount.value = result.totalCount || 0
      totalPages.value = result.totalPages || 0
      page.value = result.page || page.value
      if (allowPageCorrection && totalPages.value > 0 && page.value > totalPages.value) {
        page.value = totalPages.value
        await loadWishPools(false)
      }
    } catch (err) {
      errorMessage.value = err?.message || '許願資料載入失敗'
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
    await loadWishPools()
  }

  const selectTab = async (tabKey) => {
    if (tabKey === activeTabKey.value) return
    if (!WISH_POOL_TABS.some((tab) => tab.key === tabKey)) return
    activeTabKey.value = tabKey
    page.value = 1
    await loadWishPools()
  }

  const selectPageSize = async (size) => {
    pageSize.value = Number(size)
    page.value = 1
    openSelectKey.value = ''
    await loadWishPools()
  }

  const goToPage = async (nextPage) => {
    const maxPage = Math.max(1, totalPages.value || 1)
    if (nextPage < 1 || nextPage > maxPage) return
    page.value = nextPage
    await loadWishPools()
  }

  const updateDecision = async (item, groupBuyDecision) => {
    if (!item?.id || updatingId.value) return false
    updatingId.value = item.id
    errorMessage.value = ''
    statusMessage.value = ''

    try {
      await updateWishPoolGroupBuyDecision(item.id, groupBuyDecision)
      statusMessage.value = '開團回覆已更新。'
      await loadWishPools()
      return true
    } catch (err) {
      errorMessage.value = err?.message || '更新開團回覆失敗'
      return false
    } finally {
      updatingId.value = null
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
    updatingId,
    openSelectKey,
    activeTabKey,
    paginationSummary,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    tabs: WISH_POOL_TABS,
    loadWishPools,
    search,
    selectTab,
    selectPageSize,
    goToPage,
    updateDecision,
  }
}

