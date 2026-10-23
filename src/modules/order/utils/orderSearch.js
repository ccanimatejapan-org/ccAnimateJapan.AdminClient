import { formatOrderNumber } from './orderDisplay.js'

// 訂單管理頁搜尋框的比對規則：關鍵字可以是訂單編號、訂購人、LINE 名稱的任一段文字。
// - 全形轉半形（NFKC）並忽略大小寫，輸入法打出來的全形英數也找得到。
// - 以空白分隔的每個詞都要在三個欄位的任一個出現，順序不拘（「chen amy」找得到「Amy Chen」）。
// - 訂單編號比對的是列表第一欄實際顯示的值：沒有 orderNo 的舊訂單顯示 `#id`，也就用 `#id` 搜尋。
const normalizeSearchText = (value) => String(value ?? '').normalize('NFKC').toLowerCase().trim()

export const matchesOrderKeyword = (order, keyword) => {
  const words = normalizeSearchText(keyword).split(/\s+/).filter(Boolean)
  if (!words.length) return true
  if (!order) return false

  const fields = [formatOrderNumber(order), order.subscriberName, order.memberDisplayName].map(normalizeSearchText)

  return words.every((word) => fields.some((field) => field.includes(word)))
}
