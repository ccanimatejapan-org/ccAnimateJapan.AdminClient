import { ROUTE_NAMES } from '@/shared/constants/routes'

export default [
  {
    path: '/pages/login',
    name: ROUTE_NAMES.LOGIN,
    component: () => import('@/modules/auth/pages/LoginPage.vue'),
  },
]
