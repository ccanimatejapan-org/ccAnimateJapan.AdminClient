import { ROUTE_NAMES } from '@/shared/constants/routes'

export default [
  {
    path: '/orders',
    name: ROUTE_NAMES.ORDERS,
    component: () => import('@/modules/order/pages/OrderListPage.vue'),
  },
]
