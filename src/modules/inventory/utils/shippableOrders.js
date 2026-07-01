// Pure order-item reduction extracted verbatim from Inventory's loadTransactionOrders.
// Given one order detail (with an `items` array) and a product id, it sums the
// shippable amount for that product: items whose productId matches and whose
// orderProductStatus is NOT 2 (已出貨), defaulting a missing status to 1 (included)
// and a missing amount to 0. Returns a single number.
export const aggregateShippableAmount = (orderDetail, productId) =>
  (orderDetail?.items || [])
    .filter(
      (item) =>
        Number(item.productId) === Number(productId)
        && Number(item.orderProductStatus || 1) !== 2,
    )
    .reduce((total, item) => total + Number(item.amount || 0), 0)
