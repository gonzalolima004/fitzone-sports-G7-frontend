import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '../common/layouts/MainLayout.vue'
import { useAuthStore } from '../store/auth' // Agregamos la importación del store
import RegistroView from '@/modules/M1-usuarios/views/RegistroView.vue'
import PerfilView from '@/modules/M1-usuarios/views/PerfilView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true }, // Protege a MainLayout y TODAS sus rutas hijas
    children: [
      {
        path: 'perfil',
        name: 'perfil',
        component: PerfilView,
        meta: { requiresAuth: true }, // Ruta protegida
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
        path: 'reportes',
        name: 'reportes',
        component: () =>
          import('../modules/M6-reportes/views/ReportesView.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../modules/M1-usuarios/views/LoginView.vue'),
    meta: { requiresAuth: false }, // Ruta explícitamente pública
  },
  {
    path: '/registro',
    name: 'registro',
    component: RegistroView,
    meta: { requiresAuth: false }, // Ruta explícitamente pública y fuera del layout
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

// Guard de navegación global
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

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
