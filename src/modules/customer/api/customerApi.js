import { httpClient } from '@/shared/api/httpClient'
import { toQueryString } from '@/shared/utils/queryString'

const emptyPage = (page, pageSize) => ({
  page,
  pageSize,
  totalCount: 0,
  totalPages: 0,
  items: [],
  counts: { all: 0, withOrders: 0, noOrders: 0, deleted: 0 },
})

export const listCustomers = async ({
  page = 1,
  pageSize = 30,
  keyword = '',
  status = '',
} = {}) => {
  const query = toQueryString({ page, pageSize, keyword, status })
  const response = await httpClient.get(`/api/customers${query}`)
  return response?.data || emptyPage(page, pageSize)
}

export const getCustomerDetail = async (id) => {
  const response = await httpClient.get(`/api/customers/${id}`)
  return response?.data || null
}

export const deleteCustomer = async (id) => {
  const response = await httpClient.post(`/api/customers/${id}/delete`)
  return response?.data || null
}

export const restoreCustomer = async (id) => {
  const response = await httpClient.post(`/api/customers/${id}/restore`)
  return response?.data || null
}
