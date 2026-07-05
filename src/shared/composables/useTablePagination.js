import { computed, ref, watch } from 'vue'

const DEFAULT_PAGE_SIZE = 10

export const useTablePagination = (sortedItemsRef, { pageSizeOptions } = {}) => {
  const page = ref(1)
  const pageSize = ref(pageSizeOptions?.[0] ?? DEFAULT_PAGE_SIZE)

  const totalCount = computed(() => (sortedItemsRef.value || []).length)

  const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

  const paginatedItems = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return (sortedItemsRef.value || []).slice(start, start + pageSize.value)
  })

  const paginationSummary = computed(() => `${page.value} / ${totalPages.value || 1}`)

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages.value) return
    page.value = nextPage
  }

  const goToPreviousPage = () => goToPage(page.value - 1)
  const goToNextPage = () => goToPage(page.value + 1)

  watch(pageSize, () => {
    page.value = 1
  })

  watch(totalPages, (nextTotalPages) => {
    if (page.value > nextTotalPages) {
      page.value = nextTotalPages
    }
  })

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    paginatedItems,
    paginationSummary,
    goToPage,
    goToPreviousPage,
    goToNextPage,
  }
}
