import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '../common/layouts/MainLayout.vue'
import { useAuthStore, type RolUsuario } from '../store/auth'
import { rutaPorRol } from '@/common/guards/ruta-por-rol'
import { rutasLanding } from '@/modules/landing/routes'
//import RegistroView from '@/modules/M1-usuarios/views/RegistroView.vue'
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
        path: 'recepcion',
        name: 'recepcion',
        component: () =>
          import('../modules/M2-accesos/views/RecepcionView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['recepcionista', 'gerente'],
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
            path: 'directorio-usuarios',
            name: 'directorio-usuarios',
            component: () =>
              import('@/modules/M1-usuarios/views/DirectorioUsuariosView.vue'),
            meta: { requiresAuth: true, roles: ['gerente'] },
          },
          {
            path: 'canchas',
            name: 'gerencia-canchas',
            component: () =>
              import('../modules/M4-canchas/views/GerenciaCanchasView.vue'),
            meta: { requiresAuth: true, roles: ['gerente'] },
          },
          {
            path: '',
            name: 'gerencia',
            component: () =>
              import('../modules/gerencia/views/GerenciaDashboardView.vue'),
          },
          {
            path: 'sedes',
            name: 'gerencia-sedes',
            component: () =>
              import('../modules/gerencia/views/GestionSedesView.vue'),
          },
          {
            path: 'planes',
            name: 'gerencia-planes',
            component: () =>
              import('../modules/gerencia/views/GestionPlanesView.vue'),
          },
          {
            path: 'membresias',
            name: 'gerencia-membresias',
            component: () =>
              import('../modules/gerencia/views/GestionMembresiasView.vue'),
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

// Guard de navegación global con RBAC
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // 1. Aseguramos que Supabase haya leído la URL (vital para Google OAuth)
  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // 2. Sin sesión en ruta privada -> login
  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  // 3. VERIFICACIÓN PROACTIVA: obtiene perfil interno y ROL real desde el backend
  if (
    authStore.isAuthenticated &&
    to.path !== '/completar-perfil' &&
    (requiresAuth || to.name === 'login' || to.name === 'registro')
  ) {
    // Solo consultamos si todavía no cargamos el perfil de esta sesión
    if (!authStore.usuario?.rol) {
      try {
        const respuesta = await authService.verifyLocalProfile()
        const u = respuesta?.user
        if (u) {
          const rolBackend = String(
            u.rol ?? u.roles?.[0] ?? 'socio'
          ).toLowerCase() as RolUsuario
          authStore.setPerfilInterno({
            id: u.id_usuario,
            email: u.email,
            rol: rolBackend,
          })
        }
      } catch (error) {
        const err = error as { response?: { status?: number } }
        // Si el backend arrojó 403, el interceptor (http.ts) ya redirigió a /completar-perfil.
        if (err.response?.status === 403) {
          return
        }
        // Otro error grave: limpiamos sesión por seguridad.
        await authStore.logout()
        return next({ name: 'login' })
      }
    }
  }

  // 4. Ya logueado y quiere ir a login/registro -> a su ruta por rol
  if (
    (to.name === 'login' || to.name === 'registro') &&
    authStore.isAuthenticated
  ) {
    return next(rutaPorRol(authStore.rol))
  }

  // 5. Control de acceso por roles (RBAC)
  if (authStore.isAuthenticated) {
    const rolActual = authStore.rol
    const tienePermiso = to.matched.every((record) => {
      const roles = record.meta?.roles as RolUsuario[] | undefined
      return !roles || (rolActual && roles.includes(rolActual))
    })

    if (!tienePermiso) {
      return next(rutaPorRol(rolActual))
    }
  }

  next()
})

export default router
