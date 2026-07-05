import { httpClient } from '@/shared/api/httpClient'
import { toQueryString } from '@/shared/utils/queryString'

export const createProductStockTransaction = (payload) =>
  httpClient.post('/api/product-stock-transactions', payload)

export const listInventoryProducts = async () => {
  const response = await httpClient.get('/api/product-stock-transactions/inventory-products')
  return response?.data || []
}

export const listProductStockTransactions = async (productId) => {
  const query = toQueryString({ productId })
  const response = await httpClient.get(`/api/product-stock-transactions${query}`)
  return response?.data || []
}

export const listShippableProductOrders = async (productId) => {
  const response = await httpClient.get(`/api/product-stock-transactions/products/${productId}/shippable-orders`)
  return response?.data || []
}
