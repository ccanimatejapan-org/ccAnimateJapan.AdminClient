import { ROUTE_NAMES } from '@/shared/constants/routes'

export default [
  {
    path: '/dashboard',
    name: ROUTE_NAMES.DASHBOARD,
    component: () => import('@/modules/dashboard/pages/DashboardPage.vue'),
  },
]
