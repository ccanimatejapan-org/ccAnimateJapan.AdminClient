// Upper bounds for hand-typed product / stock numbers. They must match the backend
// (AdminAPI: Application/Common/ProductValueLimits.cs); the server rejects anything above them, so these only
// give a clear message (and a sensible number-input range) before the request is sent.
// Real data when they were chosen: japanCost <= 20,790, price <= 5,900, rate 0.2-0.21, one stock movement <= 20.
export const MAX_JAPAN_COST = 10_000_000
export const MAX_PRICE = 10_000_000
export const MAX_RATE = 10
export const MAX_STOCK_QUANTITY = 100_000 // one stock movement, or the initial stock of a new product
// Stock unit cost / price. The stock dialog fills the unit cost with round(japanCost * rate), so this has to stay
// >= MAX_JAPAN_COST * MAX_RATE: any product that passes the product limits can then still be stocked in.
export const MAX_UNIT_AMOUNT = 100_000_000
