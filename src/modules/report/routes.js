import { ROUTE_NAMES } from '@/shared/constants/routes'

export default [
  {
    path: '/reports',
    name: ROUTE_NAMES.REPORTS,
    component: () => import('@/modules/report/pages/ReportsPage.vue'),
  },
]
