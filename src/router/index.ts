import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '../common/layouts/MainLayout.vue'
import { useAuthStore } from '../store/auth'
import PerfilView from '@/modules/M1-usuarios/views/PerfilView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'perfil',
        name: 'perfil',
        component: PerfilView,
        meta: { requiresAuth: true },
      },
      {
        path: 'membresia',
        name: 'membresia',
        component: () =>
          import('../modules/M1-usuarios/views/MembresiaView.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '',
        name: 'home',
        component: () => import('../common/views/HomeView.vue'),
      },
      {
        path: 'accesos',
        name: 'accesos',
        component: () =>
          import('../modules/M2-accesos/views/CredencialView.vue'),
      },
      {
        path: 'clases',
        name: 'clases',
        component: () =>
          import('../modules/M3-clases-grupales/views/ClasesView.vue'),
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
        path: 'pagos/resultado',
        name: 'pagos-resultado',
        alias: ['/pagos/exito', '/pagos/error', '/pagos/pendiente'],
        component: () =>
          import('../modules/M5-pagos/views/ResultadoPagoView.vue'),
      },
      {
        path: 'reportes',
        component: () =>
          import('../modules/M6-reportes/views/PanelGerenciaView.vue'),
        children: [
          {
            path: '',
            name: 'reportes',
            component: () =>
              import('../modules/M6-reportes/views/ReportesView.vue'),
          },
          {
            path: 'ocupacion',
            name: 'reportes-ocupacion',
            component: () =>
              import('../modules/M6-reportes/views/OcupacionView.vue'),
          },
        ],
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../modules/M1-usuarios/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/registro',
    name: 'registro',
    component: () => import('@/modules/M1-usuarios/views/RegistroView.vue'), // Lazy Loading aplicado
    meta: { requiresAuth: false },
  },
  {
    path: '/cambiar-password',
    name: 'cambiar-password',
    component: () =>
      import('@/modules/M1-usuarios/views/CambiarPasswordView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/completar-perfil',
    name: 'completar-perfil',
    component: () =>
      import('@/modules/M1-usuarios/views/CompletarPerfilView.vue'),
    meta: { requiresAuth: true }, // Debe estar logueado en Supabase para verla
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../common/views/NotFoundView.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Guard de navegación global
// Guard de navegación global
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // 1. ESPERAR a que Supabase lea la URL (vital para Google OAuth)
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  // Revisa si la ruta destino (o alguno de sus padres) requiere autenticación
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    // Si quiere entrar a zona privada sin estar logueado -> Al login
    next({ name: 'login' })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    // Si ya está logueado y quiere ir al login -> Al home del dashboard
    next({ name: 'home' })
  } else {
    // Todo en orden -> Que pase
    next()
  }
})

export default router
