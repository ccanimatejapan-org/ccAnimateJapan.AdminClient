import { ROUTE_NAMES } from '@/shared/constants/routes'

export default [
  {
    path: '/activities',
    name: ROUTE_NAMES.ACTIVITY,
    component: () => import('@/modules/activity/pages/ActivityListPage.vue'),
  },
]
