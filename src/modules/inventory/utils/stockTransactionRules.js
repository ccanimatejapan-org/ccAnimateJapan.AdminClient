import { MAX_STOCK_QUANTITY, MAX_UNIT_AMOUNT } from '@/shared/constants/productLimits'

const formatLimit = (value) => value.toLocaleString('en-US')

// Returns a message when the quantity or the unit cost/price is above its limit, or '' when both are within range.
export const getStockLimitError = ({ amount, unitValue, inOrOut }) => {
  if (Number(amount) > MAX_STOCK_QUANTITY) return `數量不可超過 ${formatLimit(MAX_STOCK_QUANTITY)}。`
  if (Number(unitValue) > MAX_UNIT_AMOUNT) {
    return `${inOrOut ? '單位成本' : '單位售價'}不可超過 ${formatLimit(MAX_UNIT_AMOUNT)}。`
  }

  return ''
}
