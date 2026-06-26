import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { isAdminAuthenticated } from '@/stores/authSession'

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
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
      },
      {
        path: '/activities',
        name: 'Activity',
        component: () => import('@/views/dashboard/activity.vue'),
      },
      {
        path: '/activity',
        redirect: '/activities',
      },
      {
        path: '/activities/:activityId/products',
        name: 'ActivityProducts',
        component: () => import('@/views/dashboard/ActivityProducts.vue'),
      },
      {
        path: '/activity/:activityId/products',
        redirect: (to) => ({
          name: 'ActivityProducts',
          params: to.params,
        }),
      },
      {
        path: '/animate-types',
        name: 'AnimateTypes',
        component: () => import('@/views/dashboard/AnimateTypes.vue'),
      },
      {
        path: '/inventory',
        name: 'Inventory',
        component: () => import('@/views/dashboard/Inventory.vue'),
      },
      {
        path: '/orders',
        name: 'Orders',
        component: () => import('@/views/dashboard/Orders.vue'),
      },
      {
        path: '/reports',
        name: 'Reports',
        component: () => import('@/views/dashboard/Reports.vue'),
      },
    ],
  },
  {
    path: '/pages/login',
    name: 'Login',
    component: () => import('@/views/pages/Login.vue'),
  },
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
