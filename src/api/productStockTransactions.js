import { getAdminToken } from '@/stores/authSession'
import { apiGet, apiPost } from './http'

const authHeaders = () => {
  const token = getAdminToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const createProductStockTransaction = (payload) =>
  apiPost('/api/product-stock-transactions', payload, { headers: authHeaders() })

export const listInventoryProducts = async () => {
  const response = await apiGet('/api/product-stock-transactions/inventory-products', {
    headers: authHeaders(),
  })
  return response?.data || []
}

export const listProductStockTransactions = async (productId) => {
  const response = await apiGet(`/api/product-stock-transactions?productId=${productId}`, {
    headers: authHeaders(),
  })
  return response?.data || []
}

export const listShippableProductOrders = async (productId) => {
  const response = await apiGet(`/api/product-stock-transactions/products/${productId}/shippable-orders`, {
    headers: authHeaders(),
  })
  return response?.data || []
}
