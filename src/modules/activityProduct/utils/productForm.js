import { sanitizeHtml } from '@/shared/utils/html'
import { MAX_JAPAN_COST, MAX_PRICE, MAX_RATE, MAX_STOCK_QUANTITY } from '@/shared/constants/productLimits'
import { toNumber } from '@/modules/activityProduct/utils/productMapper'

export const createEmptyProductForm = () => ({
  name: '',
  japanCost: 0,
  rate: 0.202,
  saleRate: 0.225,
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

const formatLimit = (value) => value.toLocaleString('en-US')

// Returns a message for the first number above its limit, or '' when every number is within range.
// The initial stock is only checked when it is actually sent (creating a product in a spot activity).
export const getProductLimitError = (form, { checkAmount = false } = {}) => {
  if (Number(form.japanCost) > MAX_JAPAN_COST) return `成本(日)不可超過 ${formatLimit(MAX_JAPAN_COST)}。`
  if (Number(form.rate) > MAX_RATE) return `成本匯率不可超過 ${MAX_RATE}。`
  if (Number(form.price) > MAX_PRICE) return `售價不可超過 ${formatLimit(MAX_PRICE)}。`
  if (checkAmount && Number(form.amount) > MAX_STOCK_QUANTITY) {
    return `商品數量不可超過 ${formatLimit(MAX_STOCK_QUANTITY)}。`
  }

  return ''
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
