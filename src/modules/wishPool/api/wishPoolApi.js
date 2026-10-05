import { httpClient } from '@/shared/api/httpClient'
import { toQueryString } from '@/shared/utils/queryString'

const emptyPage = (page, pageSize) => ({
  page,
  pageSize,
  totalCount: 0,
  totalPages: 0,
  items: [],
  counts: { all: 0, pending: 0, opened: 0, notOpened: 0 },
})

export const listWishPools = async ({
  page = 1,
  pageSize = 30,
  keyword = '',
  groupBuyDecision = '',
} = {}) => {
  const query = toQueryString({ page, pageSize, keyword, groupBuyDecision })
  const response = await httpClient.get(`/api/wish-pools${query}`)
  return response?.data || emptyPage(page, pageSize)
}

export const updateWishPoolGroupBuyDecision = async (id, groupBuyDecision) => {
  const response = await httpClient.post(`/api/wish-pools/${id}/group-buy-status`, {
    groupBuyDecision,
  })
  return response?.data || null
}
