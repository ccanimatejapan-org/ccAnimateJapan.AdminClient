import { unref } from 'vue'
import { toNumber } from '@/modules/activityProduct/utils/productMapper'

export const getCostTwd = (product) =>
  Math.round(toNumber(product.japanCost) * toNumber(product.rate))

// Factory that closes over the live productTypes ref/array so the returned getter resolves a
// product-type id to its display name (falling back to `#id` or `-`). Used by the products
// page and reused by inventory.
export const createProductTypeNameGetter = (productTypesRef) => (productTypeId) => {
  const normalizedProductTypeId = toNumber(productTypeId)
  const productType = unref(productTypesRef).find(
    (type) => toNumber(type?.id) === normalizedProductTypeId,
  )

  return productType?.name || (normalizedProductTypeId ? `#${normalizedProductTypeId}` : '-')
}
