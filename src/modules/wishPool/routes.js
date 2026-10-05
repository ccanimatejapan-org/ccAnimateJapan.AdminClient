import { ROUTE_NAMES } from '@/shared/constants/routes'

export default [
  {
    path: '/wish-pools',
    name: ROUTE_NAMES.WISH_POOLS,
    component: () => import('@/modules/wishPool/pages/WishPoolListPage.vue'),
  },
]
