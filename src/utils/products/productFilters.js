const normalizeText = (value) => String(value || '').trim().toLowerCase()

export const PRODUCT_STOCK_FILTERS = {
  inStock: 'inStock',
  outStock: 'outStock',
}

export const createEmptyProductFilters = () => ({
  name: '',
  productTypeIds: [],
  stockStatuses: [],
})

export const hasActiveProductFilters = (filters) =>
  Boolean(
    normalizeText(filters.name) ||
      filters.productTypeIds.length ||
      filters.stockStatuses.length,
  )

export const matchesProductFilters = (product, filters) => {
  const nameKeyword = normalizeText(filters.name)
  if (nameKeyword && !normalizeText(product.name).includes(nameKeyword)) {
    return false
  }

  const selectedProductTypeIds = filters.productTypeIds.map(Number)
  if (
    selectedProductTypeIds.length &&
    !selectedProductTypeIds.includes(Number(product.productTypeId || 0))
  ) {
    return false
  }

  const stockStatus = product.isOutStock
    ? PRODUCT_STOCK_FILTERS.outStock
    : PRODUCT_STOCK_FILTERS.inStock
  if (filters.stockStatuses.length && !filters.stockStatuses.includes(stockStatus)) {
    return false
  }

  return true
}
