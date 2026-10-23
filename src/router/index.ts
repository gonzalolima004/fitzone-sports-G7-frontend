import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '../common/layouts/MainLayout.vue'
import { useAuthStore, type RolUsuario } from '../store/auth'
import { rutaPorRol } from '@/common/guards/ruta-por-rol'
import { rutasLanding } from '@/modules/landing/routes'
import RegistroView from '@/modules/M1-usuarios/views/RegistroView.vue'
import PerfilView from '@/modules/M1-usuarios/views/PerfilView.vue'
import { authService } from '@/modules/M1-usuarios/services/auth.service.ts'

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
    meta: { requiresAuth: true },
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
        path: 'canchas/reservas/:id',
        name: 'canchas-detalle-reserva',
        component: () =>
          import('../modules/M4-canchas/views/DetalleReservaView.vue'),
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

  // 1. Aseguramos que Supabase haya leído la URL (vital para Google OAuth)
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // 2. VERIFICACIÓN PROACTIVA (La magia ocurre aquí)
  // Si está logueado, va a una ruta privada, y NO es la ruta de completar perfil:
  if (
    requiresAuth &&
    authStore.isAuthenticated &&
    to.path !== '/completar-perfil'
  ) {
    try {
      // Hacemos ping al backend
      await authService.verifyLocalProfile()
      // Si pasa sin errores, tiene perfil local. Dejamos que el código continúe.
    } catch (error) {
      const err = error as { response?: { status?: number } }
      // Si el backend arrojó 403, el interceptor (http.ts) ya se encargó
      // de redirigir a /completar-perfil. Solo debemos cortar esta navegación original.
      if (err.response?.status === 403) {
        return
      }
      // Si es otro error grave, limpiamos sesión por seguridad.
      await authStore.logout()
      return next({ name: 'login' })
    }
  }

  // 3. Reglas estándar de navegación
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'home' })
  } else {
    next()
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
