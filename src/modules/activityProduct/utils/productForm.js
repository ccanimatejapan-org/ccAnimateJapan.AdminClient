import { sanitizeHtml } from '@/shared/utils/html'
import { toNumber } from '@/modules/activityProduct/utils/productMapper'

export const createEmptyProductForm = () => ({
  name: '',
  japanCost: 0,
  rate: 0.2,
  saleRate: 0.24,
  price: 0,
  amount: 0,
  isOutStock: false,
  productTypeId: 1,
  info: '',
})

export const getSaleRateFromProduct = (product) => {
  const japanCost = toNumber(product.japanCost)
  const price = toNumber(product.price)

  if (japanCost <= 0) return toNumber(product.rate, createEmptyProductForm().saleRate)

  return Number((price / japanCost).toFixed(4))
}

// Pure payload-shape helper: trims/coerces the form fields and conditionally adds the
// pre-order stock flag and the create-only amount, mirroring the original page exactly.
export const buildProductPayload = (form, { isPreOrderActivity, isSpotActivity, isEditing } = {}) => {
  const payload = {
    name: form.name.trim(),
    japanCost: toNumber(form.japanCost),
    rate: toNumber(form.rate),
    price: toNumber(form.price),
    productTypeId: toNumber(form.productTypeId),
    info: sanitizeHtml(form.info).trim(),
  }

  if (isPreOrderActivity) {
    payload.isOutStock = form.isOutStock === true
  }

  if (!isEditing) {
    payload.amount = isSpotActivity ? Math.max(0, toNumber(form.amount)) : 0
  }

  return payload
}
