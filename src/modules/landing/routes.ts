import type { RouteRecordRaw } from 'vue-router'

export const rutasLanding: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('@/modules/landing/views/LandingView.vue'),
    meta: { requiresAuth: false },
  },
]
