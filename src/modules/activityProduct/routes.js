import { ROUTE_NAMES } from '@/shared/constants/routes'

export default [
  {
    path: '/activities/:activityId/products',
    name: ROUTE_NAMES.ACTIVITY_PRODUCTS,
    component: () => import('@/modules/activityProduct/pages/ActivityProductsPage.vue'),
  },
]
