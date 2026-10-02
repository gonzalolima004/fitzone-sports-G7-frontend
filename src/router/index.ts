import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '../common/layouts/MainLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../common/views/HomeView.vue'),
      },
      {
        path: 'accesos',
        name: 'accesos',
        component: () => import('../modules/M2-accesos/views/CredencialView.vue'),
      },
      {
        path: 'clases',
        name: 'clases',
        component: () => import('../modules/M3-clases-grupales/views/ClasesView.vue'),
      },
      {
        path: 'canchas',
        name: 'canchas',
        component: () => import('../modules/M4-canchas/views/CanchasView.vue'),
      },
      {
        path: 'pagos',
        name: 'pagos',
        component: () => import('../modules/M5-pagos/views/PagosView.vue'),
      },
      {
        path: 'reportes',
        name: 'reportes',
        component: () => import('../modules/M6-reportes/views/ReportesView.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../modules/M1-usuarios/views/LoginView.vue'),
  },
  {
    // Ruta comodín para manejar direcciones inexistentes (404)
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../common/views/NotFoundView.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
