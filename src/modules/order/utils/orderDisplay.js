// 顧客看到的訂單編號（如 CJ202610230003）；後台自建或較早的訂單沒有編號時，退回內部 id（#265），
// 讓每一張訂單在列表與明細上都有可辨識的名稱。
export const formatOrderNumber = (order) => {
  if (!order) return ''

  const orderNo = String(order.orderNo || '').trim()
  if (orderNo) return orderNo

  return order.id ? `#${order.id}` : ''
}
