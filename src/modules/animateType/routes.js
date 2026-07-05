import { ROUTE_NAMES } from '@/shared/constants/routes'

export default [
  {
    path: '/animate-types',
    name: ROUTE_NAMES.ANIMATE_TYPES,
    component: () => import('@/modules/animateType/pages/AnimateTypesPage.vue'),
  },
]
