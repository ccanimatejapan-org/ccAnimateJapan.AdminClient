import { ROUTE_NAMES } from '@/shared/constants/routes'

export default [
  {
    path: '/customers',
    name: ROUTE_NAMES.CUSTOMERS,
    component: () => import('@/modules/customer/pages/CustomerListPage.vue'),
  },
]
