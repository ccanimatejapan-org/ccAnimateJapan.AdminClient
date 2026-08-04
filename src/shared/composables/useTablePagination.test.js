import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'

import { useTablePagination } from './useTablePagination.js'

test('useTablePagination default page size should be 30 and split 31 items into 2 pages', () => {
  const sortedItems = ref(Array.from({ length: 31 }, (_, index) => ({ id: index + 1 })))
  const {
    page,
    pageSize,
    totalPages,
    paginatedItems,
    goToPage,
  } = useTablePagination(sortedItems)

  assert.equal(page.value, 1)
  assert.equal(pageSize.value, 30)
  assert.equal(totalPages.value, 2)
  assert.equal(paginatedItems.value.length, 30)
  assert.equal(paginatedItems.value[0].id, 1)
  assert.equal(paginatedItems.value[29].id, 30)

  goToPage(2)
  assert.equal(page.value, 2)
  assert.equal(paginatedItems.value.length, 1)
  assert.equal(paginatedItems.value[0].id, 31)
})
