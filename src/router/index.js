import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { isAdminAuthenticated } from '@/shared/stores/authSession'
import dashboardRoutes from '@/modules/dashboard/routes'
import authRoutes from '@/modules/auth/routes'
import orderRoutes from '@/modules/order/routes'
import activityRoutes from '@/modules/activity/routes'
import activityProductRoutes from '@/modules/activityProduct/routes'
import inventoryRoutes from '@/modules/inventory/routes'
import animateTypeRoutes from '@/modules/animateType/routes'
import reportRoutes from '@/modules/report/routes'

const normalizeActivityPath = (path) => path.replace(/^\/activity(?=\/|$)/, '/activities')

const getLegacyHashRedirect = (to) => {
  if (!to.hash?.startsWith('#/')) return null

  const [hashPath] = to.hash.slice(1).split('?')
  return {
    path: normalizeActivityPath(hashPath),
    replace: true,
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: DefaultLayout,
    redirect: () => (isAdminAuthenticated() ? '/dashboard' : '/pages/login'),
    children: [
      ...dashboardRoutes,
      ...activityRoutes,
      {
        path: '/activity',
        redirect: '/activities',
      },
      ...activityProductRoutes,
      {
        path: '/activity/:activityId/products',
        redirect: (to) => ({
          name: 'ActivityProducts',
          params: to.params,
        }),
      },
      ...animateTypeRoutes,
      ...inventoryRoutes,
      ...orderRoutes,
      ...reportRoutes,
    ],
  },
  ...authRoutes,
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const legacyHashRedirect = getLegacyHashRedirect(to)
  if (legacyHashRedirect) {
    next(legacyHashRedirect)
    return
  }

  const isLoginPage = to.path === '/pages/login'
  const isLoggedIn = isAdminAuthenticated()

  if (!isLoginPage && !isLoggedIn) {
    next('/pages/login')
    return
  }

  if (isLoginPage && isLoggedIn) {
    next('/dashboard')
    return
  }

  next()
})

export default router
