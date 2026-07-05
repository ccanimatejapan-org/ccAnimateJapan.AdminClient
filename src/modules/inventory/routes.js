import { ROUTE_NAMES } from '@/shared/constants/routes'

export default [
  {
    path: '/inventory',
    name: ROUTE_NAMES.INVENTORY,
    component: () => import('@/modules/inventory/pages/InventoryPage.vue'),
  },
]
