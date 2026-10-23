import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '../common/layouts/MainLayout.vue'
import { useAuthStore, type RolUsuario } from '../store/auth'
import { rutaPorRol } from '@/common/guards/ruta-por-rol'
import { rutasLanding } from '@/modules/landing/routes'
import RegistroView from '@/modules/M1-usuarios/views/RegistroView.vue'
import PerfilView from '@/modules/M1-usuarios/views/PerfilView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: RolUsuario[]
  }
}

const routes: RouteRecordRaw[] = [
  ...rutasLanding,
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true }, // Protege a MainLayout y TODAS sus rutas hijas
    children: [
      {
        path: 'perfil',
        name: 'perfil',
        component: PerfilView,
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'membresia',
        name: 'membresia',
        component: () =>
          import('../modules/M1-usuarios/views/MembresiaView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'inicio',
        name: 'home',
        component: () => import('../common/views/HomeView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'accesos',
        name: 'accesos',
        component: () =>
          import('../modules/M2-accesos/views/CredencialView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'aforo',
        name: 'aforo',
        component: () => import('../modules/M2-accesos/views/AforoView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['recepcionista', 'gerente'],
        },
      },
      {
        path: 'clases',
        name: 'clases',
        component: () =>
          import('../modules/M3-clases-grupales/views/ClasesView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'canchas',
        name: 'canchas',
        component: () => import('../modules/M4-canchas/views/CanchasView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'pagos',
        name: 'pagos',
        component: () => import('../modules/M5-pagos/views/PagosView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'pagos/resultado',
        name: 'pagos-resultado',
        alias: ['/pagos/exito', '/pagos/error', '/pagos/pendiente'],
        component: () =>
          import('../modules/M5-pagos/views/ResultadoPagoView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['socio', 'externo', 'recepcionista', 'gerente'],
        },
      },
      {
        path: 'gerencia',
        meta: {
          requiresAuth: true,
          roles: ['gerente'], // Protege el prefijo /gerencia y todas sus rutas hijas
        },
        children: [
          {
            path: '',
            redirect: '/gerencia/reportes',
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
      // Redirecciones de retrocompatibilidad para /reportes
      {
        path: 'reportes',
        redirect: '/gerencia/reportes',
      },
      {
        path: 'reportes/ocupacion',
        redirect: '/gerencia/reportes/ocupacion',
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

// Guard de navegación global con RBAC jerárquico
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // 1. Revisa si la ruta destino (o alguno de sus ancestros) requiere autenticación
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    // Si quiere entrar a zona privada sin estar logueado -> Al login
    next({ name: 'login' })
    return
  }

  // 2. Si ya está logueado y quiere ir al login o registro público -> A su ruta correspondiente por rol
  if (
    (to.name === 'login' || to.name === 'registro') &&
    authStore.isAuthenticated
  ) {
    next(rutaPorRol(authStore.rol))
    return
  }

  // 3. Control de acceso por roles (RBAC)
  if (authStore.isAuthenticated) {
    const rolActual = authStore.rol
    // Comprueba si alguna ruta padre o hija en la jerarquía define restricción de roles
    const tieneRestriccionRoles = to.matched.some(
      (record) => record.meta?.roles
    )

    if (tieneRestriccionRoles) {
      // Debe cumplir las restricciones de todos los niveles que definan roles
      const tienePermiso = to.matched.every((record) => {
        const roles = record.meta?.roles as RolUsuario[] | undefined
        return !roles || (rolActual && roles.includes(rolActual))
      })

      if (!tienePermiso) {
        // Redirige automáticamente a su ruta inicial autorizada según su rol
        next(rutaPorRol(rolActual))
        return
      }
    }
  }

  // Todo en orden -> Que pase
  next()
})

export default router
