import { computed, reactive, unref } from 'vue'
import { sortTableItems } from '@/shared/utils/tableSort'

export const useTableSort = (items, columns, initialSort) => {
  const sortState = reactive({
    key: initialSort?.key || '',
    direction: initialSort?.direction === 'desc' ? 'desc' : 'asc',
  })

  const resolvedColumns = computed(() => unref(columns) || [])

  const getColumnByKey = (key) => resolvedColumns.value.find((column) => column.key === key)

  const isSortActive = (column) => sortState.key === column.key

  const toggleSort = (column) => {
    if (!column?.sortable) return

    if (isSortActive(column)) {
      sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
      return
    }

    sortState.key = column.key
    sortState.direction = 'asc'
  }

  const getSortAriaSort = (column) => {
    if (!column?.sortable) return undefined
    if (!isSortActive(column)) return 'none'
    return sortState.direction === 'asc' ? 'ascending' : 'descending'
  }

  const getSortButtonLabel = (column) => {
    const direction = isSortActive(column) && sortState.direction === 'asc' ? '降冪' : '升冪'
    return `${column.label} ${direction}排序`
  }

  const getSortIndicator = (column) => {
    if (!column?.sortable) return ''
    if (!isSortActive(column)) return '↕'
    return sortState.direction === 'asc' ? '↑' : '↓'
  }

  const sortedItems = computed(() => {
    const activeColumn = getColumnByKey(sortState.key)
    const resolvedItems = unref(items) || []

    if (!activeColumn?.sortable || typeof activeColumn.getValue !== 'function') {
      return resolvedItems
    }

    return sortTableItems(resolvedItems, sortState, activeColumn.getValue)
  })

  return {
    sortState,
    sortedItems,
    isSortActive,
    toggleSort,
    getSortAriaSort,
    getSortButtonLabel,
    getSortIndicator,
  }
}
